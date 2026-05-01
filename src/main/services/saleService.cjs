const { db } = require("../db/database.cjs");
const logger = require("./loggingService.cjs");
const InvoiceService = require("./invoiceService.cjs");
const AuditService = require("./auditService.cjs");

const SaleService = {
  /**
   * Processus de checkout complet et atomique.
   * Crée la vente, la facture, met à jour le stock, et génère le HTML du reçu
   * dans une seule transaction pour garantir l'intégrité des données.
   */
  checkout: (sale, items) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        (async () => {
          let saleId, invoiceId;
          try {
            await new Promise((res, rej) => db.run("BEGIN TRANSACTION", (err) => err ? rej(err) : res()));

            // 1. Créer la vente (sales)
            const dateStr = new Date().toISOString();
            const total = typeof sale.total === "number" && !isNaN(sale.total) ? sale.total : 0;
            const discountAmount = sale.discount_amount !== undefined ? sale.discount_amount : sale.discount || 0;
            const discountType = sale.discount_type || "fixed";

            saleId = await new Promise((res, rej) => {
              db.run(
                `INSERT INTO sales (date, user_id, customer_id, total, payment_method, discount_amount, discount_type)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [dateStr, sale.user_id, sale.customer_id, total, sale.payment_method, discountAmount, discountType],
                function (err) { if (err) rej(err); else res(this.lastID); }
              );
            });

            // 2. Créer les lignes de vente (sale_items) et mettre à jour le stock
            for (const item of items) {
              const sellingPrice = item.selling_price || item.price;
              await new Promise((res, rej) => {
                db.run(
                  `INSERT INTO sale_items (sale_id, product_id, quantity, price, original_price, selling_price, price_modified)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [saleId, item.product_id, item.quantity, sellingPrice, item.original_price, sellingPrice, item.original_price !== sellingPrice ? 1 : 0],
                  (err) => err ? rej(err) : res()
                );
              });

              await new Promise((res, rej) => {
                db.run(
                  `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`,
                  [item.quantity, item.product_id, item.quantity],
                  function (err) {
                    if (err || this.changes === 0) rej(new Error(`Stock insuffisant pour le produit ID ${item.product_id}`));
                    else res();
                  }
                );
              });
            }

            // 3. Créer la facture (invoices)
            const invoiceNumber = await new Promise((res, rej) => InvoiceService.generateInvoiceNumber((err, num) => err ? rej(err) : res(num)));
            const invoiceDate = dateStr.split('T')[0];

            invoiceId = await new Promise((res, rej) => {
              db.run(
                `INSERT INTO invoices (sale_id, invoice_number, invoice_date, customer_id, total_amount, discount_amount, payment_method, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [saleId, invoiceNumber, invoiceDate, sale.customer_id, total, discountAmount, sale.payment_method, "paid"],
                function (err) { if (err) rej(err); else res(this.lastID); }
              );
            });

            // 4. Créer les lignes de facture (invoice_items)
            for (const item of items) {
              const itemTotal = (item.selling_price || item.price) * item.quantity;
              await new Promise((res, rej) => {
                db.run(
                  `INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, item_total)
                   VALUES (?, ?, ?, ?, ?)`,
                  [invoiceId, item.product_id, item.quantity, item.selling_price || item.price, itemTotal],
                  (err) => err ? rej(err) : res()
                );
              });
            }

            await new Promise((res, rej) => db.run("COMMIT", (err) => err ? rej(err) : res()));

            // 5. Post-transaction: Générer le HTML
            const fullSaleData = await new Promise((res, rej) => {
              db.get(`SELECT s.*, c.name as customer_name FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = ?`, [saleId], (err, row) => err ? rej(err) : res(row));
            });

            const fullItemsData = await new Promise((res, rej) => {
              db.all(`SELECT si.*, p.model, p.brand, p.state FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?`, [saleId], (err, rows) => err ? rej(err) : res(rows));
            });

            const invoiceDataForHtml = {
              id: invoiceId,
              invoiceNumber,
              invoiceDate,
              sale: fullSaleData,
              items: fullItemsData.map(i => ({...i, unit_price: i.selling_price}))
            };

            const html = await new Promise((res, rej) => InvoiceService.generateInvoiceHTML(invoiceDataForHtml, (err, h) => err ? rej(err) : res(h)));

            // Audit : enregistrer la vente
            AuditService.logAudit(
              "sales", saleId, "checkout", sale.user_id,
              null,
              JSON.stringify({ total, items: items.map(i => ({ product_id: i.product_id, qty: i.quantity, price: i.selling_price || i.price })) })
            );

            logger.info("Checkout réussi", { saleId, invoiceId });
            resolve({ success: true, saleId, invoiceId, html });

          } catch (error) {
            await new Promise((res) => db.run("ROLLBACK", () => res()));
            logger.error("Erreur de checkout, ROLLBACK effectué", { error: error.message, saleData: sale });
            reject(error);
          }
        })();
      });
    });
  },

  createSale: (sale, items) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => { // db.serialize is kept for serialization
        (async () => { // Self-executing async function
          try {
            await new Promise((res, rej) => {
              db.run("BEGIN TRANSACTION", (err) => {
                if (err) rej(err);
                else res();
              });
            });

            let dateStr = sale.date;
            if (!dateStr || isNaN(Date.parse(dateStr))) {
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, "0");
              const day = String(now.getDate()).padStart(2, "0");
              const hours = String(now.getHours()).padStart(2, "0");
              const minutes = String(now.getMinutes()).padStart(2, "0");
              const seconds = String(now.getSeconds()).padStart(2, "0");
              dateStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            } else if (dateStr.length === 10) {
              dateStr = dateStr + " 00:00:00";
            } else if (dateStr.includes("T")) {
              dateStr = dateStr.replace("T", " ").slice(0, 19);
            }
            const total =
              typeof sale.total === "number" && !isNaN(sale.total) ? sale.total : 0;

            const discountAmount =
              sale.discount_amount !== undefined
                ? sale.discount_amount
                : sale.discount || 0;
            const discountType = sale.discount_type || "fixed";

            const saleInsertResult = await new Promise((res, rej) => {
              db.run(
                `INSERT INTO sales (date, user_id, customer_id, total, payment_method, payment_provider, transaction_id, discount_amount, discount_type, discount)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  dateStr,
                  sale.user_id,
                  sale.customer_id,
                  total,
                  sale.payment_method,
                  sale.payment_provider,
                  sale.transaction_id,
                  discountAmount,
                  discountType,
                  discountAmount,
                ],
                function (err) {
                  if (err) rej(err);
                  else res(this.lastID);
                },
              );
            });

            const saleId = saleInsertResult;

            if (items.length === 0) {
              await new Promise((res, rej) => {
                db.run("COMMIT", (err) => {
                  if (err) rej(err);
                  else res();
                });
              });
              logger.info("Vente sans articles créée", { saleId, saleData: sale });
              return resolve(saleId);
            }

            for (const item of items) {
              const originalPrice = item.original_price || item.price;
              const sellingPrice = item.selling_price || item.price;
              const priceModified = originalPrice !== sellingPrice ? 1 : 0;

              const saleItemInsertResult = await new Promise((res, rej) => {
                db.run(
                  `INSERT INTO sale_items (sale_id, product_id, quantity, price, original_price, selling_price, price_modified)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    saleId,
                    item.product_id,
                    item.quantity,
                    sellingPrice,
                    originalPrice,
                    sellingPrice,
                    priceModified,
                  ],
                  function (err) {
                    if (err) rej(err);
                    else res(this.lastID);
                  },
                );
              });
              const saleItemId = saleItemInsertResult;

              if (priceModified) {
                await new Promise((res, rej) => {
                  db.run(
                    `INSERT INTO price_audit_logs (sale_item_id, user_id, original_price, modified_price, reason, timestamp)
                     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
                    [
                      saleItemId,
                      sale.user_id,
                      originalPrice,
                      sellingPrice,
                      "Prix modifié au moment de la vente",
                    ],
                    (err) => {
                      if (err) {
                        logger.warn("Impossible de créer l'audit trail de prix", { err });
                      }
                      res(); // Always resolve, even on error, to not block the main transaction
                    },
                  );
                });
              }

              const stockUpdateResult = await new Promise((res, rej) => {
                db.run(
                  `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`,
                  [item.quantity, item.product_id, item.quantity],
                  function (err) {
                    if (err || this.changes === 0) {
                      rej(
                        new Error(
                          err
                            ? err.message
                            : "Stock insuffisant pour le produit " + item.product_id,
                        ),
                      );
                    } else {
                      res();
                    }
                  },
                );
              });
            }

            await new Promise((res, rej) => {
              db.run("COMMIT", (err) => {
                if (err) rej(err);
                else res();
              });
            });

            logger.info("Nouvelle vente enregistrée", {
              saleId,
              userId: sale.user_id,
              customerId: sale.customer_id,
              total,
              itemCount: items.length,
              discountType,
              discountAmount,
            });
            resolve(saleId);
          } catch (error) {
            db.run("ROLLBACK", (rollbackErr) => {
              if (rollbackErr) {
                logger.error("Erreur lors du ROLLBACK de la vente", {
                  rollbackErr,
                  saleId: sale.id,
                });
              }
            });
            logger.error("Erreur lors de la création de la vente", {
              error: error.message,
              saleData: sale,
            });
            reject(error);
          }
        })(); // End of self-executing async function
      });
    });
  },
  cancelSale: (saleId, callback) => {

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      // Vérifier si déjà annulée
      db.get("SELECT status FROM sales WHERE id = ?", [saleId], (sErr, row) => {
        if (sErr) {
          db.run("ROLLBACK");
          return callback(sErr);
        }
        if (row && row.status === "cancelled") {
          db.run("ROLLBACK");
          return callback(null);
        }

        db.all(
          "SELECT * FROM sale_items WHERE sale_id = ?",
          [saleId],
          (err, items) => {
            if (err) {
              db.run("ROLLBACK");
              logger.error(
                "Erreur lors de la recherche des articles pour annulation de vente",
                { error: err.message, saleId },
              );
              return callback(err);
            }
            let ops = 0;
            let hasError = false;
            if (!items || items.length === 0) {
              // Même si pas d'items, marquer cancelled
              db.run(
                "UPDATE sales SET status = ? WHERE id = ?",
                ["cancelled", saleId],
                (err2) => {
                  if (err2) {
                    db.run("ROLLBACK");
                    return callback(err2);
                  }
                  db.run("COMMIT", (commitErr) => {
                    if (commitErr) {
                      return callback(commitErr);
                    }
                    logger.warn("Vente annulée", { saleId, restoredItems: 0 });
                    callback(null);
                  });
                },
              );
              return;
            }
            items.forEach((item) => {
              db.run(
                "UPDATE products SET stock = stock + ? WHERE id = ?",
                [item.quantity, item.product_id],
                function (uErr) {
                  if (uErr && !hasError) {
                    hasError = true;
                    db.run("ROLLBACK");
                    logger.error("Erreur restauration stock", {
                      error: uErr.message,
                      saleId,
                    });
                    return callback(uErr);
                  }
                  ops++;
                  if (ops === items.length && !hasError) {
                    // Marquer la vente comme annulée (audit preserved)
                    db.run(
                      "UPDATE sales SET status = ? WHERE id = ?",
                      ["cancelled", saleId],
                      (err2) => {
                        if (err2) {
                          db.run("ROLLBACK");
                          logger.error("Erreur mise à jour status vente", {
                            error: err2.message,
                            saleId,
                          });
                          return callback(err2);
                        }
                        db.run("COMMIT", (commitErr) => {
                          if (commitErr) {
                            logger.error(
                              "Erreur lors du COMMIT de l'annulation de vente",
                              { error: commitErr.message, saleId },
                            );
                            return callback(commitErr);
                          }
                          logger.warn("Vente annulée", {
                            saleId,
                            restoredItems: items.length,
                          });
                          // Audit : enregistrer l'annulation
                          AuditService.logAudit("sales", saleId, "cancel", null, JSON.stringify({ status: 'completed' }), JSON.stringify({ status: 'cancelled' }));
                          callback(null);
                        });
                      },
                    );
                  }
                },
              );
            });
          },
        );
      });
    });
  },
  getSales: (callback) => {
    db.all("SELECT * FROM sales ORDER BY date DESC", [], callback);
  },
  getSaleDetails: (saleId, callback) => {
    db.all("SELECT * FROM sale_items WHERE sale_id = ?", [saleId], callback);
  },
  getDailySalesTotal: (callback) => {
    db.get(
      "SELECT SUM(total) as dailyTotal FROM sales WHERE date(date) = date('now') AND status IS NOT 'cancelled'",
      [],
      callback,
    );
  },
  getWeeklySalesTotal: (callback) => {
    db.get(
      "SELECT SUM(total) as weeklyTotal FROM sales WHERE date(date) >= date('now', 'weekday 0', '-7 days') AND status IS NOT 'cancelled'",
      [],
      callback,
    );
  },
  getMonthlySalesTotal: (callback) => {
    db.get(
      "SELECT SUM(total) as monthlyTotal FROM sales WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now') AND status IS NOT 'cancelled'",
      [],
      callback,
    );
  },

  getCumulativeSalesTotal: (callback) => {
    db.get(
      "SELECT SUM(total) as cumulativeTotal FROM sales WHERE status IS NOT 'cancelled'",
      [],
      callback,
    );
  },
  getSalesByDateRange: (startDate, endDate, callback) => {
    db.all(
      "SELECT * FROM sales WHERE date(date) BETWEEN ? AND ? ORDER BY date DESC",
      [startDate, endDate],
      callback,
    );
  },

  // --- NOUVELLES FONCTIONS DE RAPPORT ---

  getDetailedSalesReport: (startDate, endDate, callback) => {
    const sql = `
			SELECT
				s.id as sale_id,
				s.date,
				c.name as customer_name,
				p.model as product_name,
				si.quantity,
				si.price as unit_price,
				(si.quantity * si.price) as line_total,
				s.total as invoice_total,
				s.payment_method
			FROM sales s
			JOIN sale_items si ON s.id = si.sale_id
			JOIN products p ON si.product_id = p.id
			LEFT JOIN customers c ON s.customer_id = c.id
			WHERE date(s.date) BETWEEN ? AND ? AND s.status IS NOT 'cancelled'
			ORDER BY s.date DESC, s.id DESC
		`;
    db.all(sql, [startDate, endDate], callback);
  },

  getBestSellingProducts: (limit = 5, callback) => {
    const sql = `
			SELECT
				p.model,
				SUM(si.quantity) as total_sold,
				SUM(si.quantity * si.price) as total_revenue
			FROM sale_items si
			JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status IS NOT 'cancelled'
			GROUP BY p.id
			ORDER BY total_sold DESC
			LIMIT ?
		`;
    db.all(sql, [limit], callback);
  },

  getCumulativeMonthlySales: (yearMonth, callback) => {
    const sql = `
			WITH DailySales AS (
				SELECT
					date(date) as sale_day,
					SUM(total) as daily_total
				FROM sales
				WHERE strftime('%Y-%m', date) = ? AND status IS NOT 'cancelled'
				GROUP BY sale_day
			)
			SELECT
				sale_day,
				daily_total,
				SUM(daily_total) OVER (ORDER BY sale_day) as cumulative_total
			FROM DailySales
			ORDER BY sale_day
		`;
    db.all(sql, [yearMonth], callback);
  },

  getSellerPerformance: (startDate, endDate, callback) => {
    const sql = `
      SELECT
        u.id as user_id,
        u.name as user_name,
        COUNT(DISTINCT s.id) as nb_sales,
        SUM(si.quantity) as units_sold,
        SUM(si.quantity * si.price) as total_revenue,
        AVG(si.price) as avg_price,
        SUM((si.price - IFNULL(p.purchase_price,0)) * si.quantity) as approx_margin
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE date(s.date) BETWEEN ? AND ? AND s.status IS NOT 'cancelled'
      GROUP BY u.id
      ORDER BY total_revenue DESC
    `;
    db.all(sql, [startDate, endDate], callback);
  },

  // Commission report: returns commission_percent from users and computed commission_amount
  getCommissionsReport: (startDate, endDate, callback) => {
    const sql = `
      SELECT
        u.id as user_id,
        u.name as user_name,
        IFNULL(SUM(si.quantity * si.price),0) as total_revenue,
        u.commission_percent as commission_percent,
        IFNULL(SUM(si.quantity),0) as units_sold
      FROM users u
      LEFT JOIN sales s ON s.user_id = u.id AND date(s.date) BETWEEN ? AND ? AND s.status IS NOT 'cancelled'
      LEFT JOIN sale_items si ON si.sale_id = s.id
      WHERE u.role = 'vendeur'
      GROUP BY u.id
      ORDER BY total_revenue DESC
    `;
    db.all(sql, [startDate, endDate], (err, rows) => {
      if (err) return callback(err);
      // compute commission_amount
      const helper = require("./commissionHelper.cjs");
      const out = rows.map((r) => ({
        ...r,
        commission_amount: helper.computeCommission(
          r.total_revenue,
          r.commission_percent,
        ),
      }));
      callback(null, out);
    });
  },

  // === NOUVELLES METHODES PHASE 2 ===

  /**
   * Obtenir ventes paginées (pour affichage optimisé)
   * @param {number} page - numéro de page (0-based)
   * @param {number} limit - nombre d'éléments par page
   * @param {string} orderBy - champ de tri (date, total)
   */
  getSalesPaginated: (page = 0, limit = 50, orderBy = "date", callback) => {
    const offset = page * limit;
    const sortField = ["date", "total", "id"].includes(orderBy)
      ? orderBy
      : "date";

    // Requête de données
    db.all(
      `SELECT * FROM sales WHERE status IS NOT 'cancelled'
       ORDER BY ${sortField} DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
      (err, rows) => {
        if (err) return callback(err);

        // Requête du total pour pagination
        db.get(
          "SELECT COUNT(*) as total FROM sales WHERE status IS NOT 'cancelled'",
          [],
          (countErr, countRow) => {
            if (countErr) return callback(countErr);

            callback(null, {
              data: rows || [],
              total: countRow.total || 0,
              page,
              limit,
              pages: Math.ceil((countRow.total || 0) / limit),
            });
          },
        );
      },
    );
  },

  /**
   * Obtenir produits paginés (pour liste caisse optimisée)
   */
  getProductsPaginated: (page = 0, limit = 50, search = "", callback) => {
    const offset = page * limit;
    const searchTerm = `%${search}%`;

    db.all(
      `SELECT * FROM products
       WHERE (model LIKE ? OR brand LIKE ? OR category LIKE ?)
       AND stock > 0
       ORDER BY stock DESC
       LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, limit, offset],
      (err, rows) => {
        if (err) return callback(err);

        db.get(
          `SELECT COUNT(*) as total FROM products
           WHERE (model LIKE ? OR brand LIKE ? OR category LIKE ?)
           AND stock > 0`,
          [searchTerm, searchTerm, searchTerm],
          (countErr, countRow) => {
            if (countErr) return callback(countErr);

            callback(null, {
              data: rows || [],
              total: countRow.total || 0,
              page,
              limit,
              pages: Math.ceil((countRow.total || 0) / limit),
            });
          },
        );
      },
    );
  },

  /**
   * Statistiques rapides (pour dashboard - optimisé avec indices)
   */
  getQuickStats: (callback) => {
    db.serialize(() => {
      const today = new Date().toISOString().split("T")[0];

      db.all(
        `SELECT
          (SELECT SUM(total) FROM sales WHERE date(date) = ? AND status IS NOT 'cancelled') as today_sales,
          (SELECT COUNT(*) FROM sales WHERE date(date) = ? AND status IS NOT 'cancelled') as today_count,
          (SELECT COUNT(*) FROM products WHERE stock <= min_stock) as low_stock_count,
          (SELECT SUM(si.quantity) FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE date(s.date) = ? AND s.status IS NOT 'cancelled') as today_units,
          (SELECT AVG(si.price) FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE date(s.date) = ? AND s.status IS NOT 'cancelled') as today_avg_price
        `,
        [today, today, today, today],
        (err, rows) => {
          if (err) return callback(err);
          callback(null, rows && rows[0] ? rows[0] : {});
        },
      );
    });
  },
};

module.exports = SaleService;
