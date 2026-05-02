const { db } = require("../db/database.cjs");
const logger = require("./loggingService.cjs");

const StockService = {
  getAllProducts: (callback) => {
    db.all("SELECT * FROM products WHERE is_deleted = 0", [], callback);
  },
  getProductById: (id, callback) => {
    db.get("SELECT * FROM products WHERE id = ? AND is_deleted = 0", [id], callback);
  },
  addProduct: (product, callback) => {
    const sql = `INSERT INTO products (category, brand, model, state, purchase_price, sale_price, min_sale_price, entry_date, cpu, ram, gpu, storage, stock, remarque)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      product.category,
      product.brand,
      product.model,
      product.state,
      product.purchase_price,
      product.sale_price,
      product.min_sale_price || product.sale_price,
      product.entry_date,
      product.cpu,
      product.ram,
      product.gpu,
      product.storage,
      product.stock || 0,
      product.remarque || "",
    ];
    db.run(sql, params, function (err) {
      if (err) {
        logger.error("Erreur lors de l'ajout du produit", {
          error: err.message,
          product,
        });
        return callback(err);
      }
      
      const productId = this.lastID;
      
      // Audit Log
      const AuditService = require("./auditService.cjs");
      AuditService.logAudit(
        "products", 
        productId, 
        "CREATE", 
        product._user_id || null, 
        null, 
        JSON.stringify(product)
      );

      logger.info("Nouveau produit ajouté", {
        productId: productId,
        product,
      });
      callback(null, { lastID: productId });
    });
  },
  updateProduct: (id, product, callback) => {
    // Read existing record for audit before updating
    db.get("SELECT * FROM products WHERE id = ?", [id], (gErr, oldRow) => {
      if (gErr) {
        logger.error("Erreur lecture produit avant update", {
          error: gErr.message,
          productId: id,
        });
        return callback(gErr);
      }

      const sql = `UPDATE products SET category=?, brand=?, model=?, state=?, purchase_price=?, sale_price=?, min_sale_price=?, entry_date=?, cpu=?, ram=?, gpu=?, storage=?, stock=?, remarque=? WHERE id=?`;
      const params = [
        product.category,
        product.brand,
        product.model,
        product.state,
        product.purchase_price,
        product.sale_price,
        product.min_sale_price || product.sale_price,
        product.entry_date,
        product.cpu,
        product.ram,
        product.gpu,
        product.storage,
        product.stock,
        product.remarque || "",
        id,
      ];

      db.run(sql, params, function (err) {
        if (err) {
          logger.error("Erreur lors de la mise à jour du produit", {
            error: err.message,
            productId: id,
          });
          return callback(err);
        }

        // Insert audit log
        try {
          const AuditService = require("./auditService.cjs");
          const oldValue = oldRow ? JSON.stringify(oldRow) : null;
          const newValue = JSON.stringify(
            Object.assign({}, oldRow || {}, product),
          );
          AuditService.logAudit(
            "products",
            id,
            "UPDATE",
            product._user_id || null,
            oldValue,
            newValue
          );
        } catch (e) {
          logger.error("Erreur sérialisation audit", { error: e.message });
        }

        logger.info("Produit mis à jour", { productId: id, changes: product });
        callback(null, { changes: this.changes });
      });
    });
  },
  deleteProduct: (id, callback) => {
    db.run(
      "UPDATE products SET is_deleted = 1 WHERE id = ?",
      [id],
      function (err) {
        if (err) {
          logger.error("Erreur lors de la suppression logique du produit", {
            error: err.message,
            productId: id,
          });
          return callback(err);
        }

        // Audit Log
        const AuditService = require("./auditService.cjs");
        AuditService.logAudit("products", id, "DELETE", null, JSON.stringify({ is_deleted: 0 }), JSON.stringify({ is_deleted: 1 }));

        logger.warn("Produit supprimé logiquement", { productId: id });
      callback(null, { changes: this.changes });
    });
  },
  restoreProduct: (id, callback) => {
    db.run(
      "UPDATE products SET is_deleted = 0 WHERE id = ?",
      [id],
      function (err) {
        if (err) {
          logger.error("Erreur lors de la restauration du produit", {
            error: err.message,
            productId: id,
          });
          return callback(err);
        }

        // Audit Log
        const AuditService = require("./auditService.cjs");
        AuditService.logAudit("products", id, "RESTORE", null, JSON.stringify({ is_deleted: 1 }), JSON.stringify({ is_deleted: 0 }));

        logger.info("Produit restauré", { productId: id });
        callback(null, { changes: this.changes });
      },
    );
  },
  getLowStock: (threshold, callback) => {
    if (typeof threshold === "function") {
      callback = threshold;
      threshold = null;
    }
    if (threshold == null) {
      db.all("SELECT * FROM products WHERE stock <= min_stock AND is_deleted = 0", [], callback);
    } else {
      db.all("SELECT * FROM products WHERE stock <= ? AND is_deleted = 0", [threshold], callback);
    }
  },

  // Create a purchase, create purchase_items, product_units (per quantity)
  // and update stock via stock_movements within a single transaction.
  addPurchase: (purchase, items, callback) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      const sqlPurchase = `INSERT INTO purchases (supplier_id, date, total_amount, status) VALUES (?, ?, ?, ?)`;
      db.run(
        sqlPurchase,
        [
          purchase.supplier_id,
          purchase.date,
          purchase.total_amount,
          "completed",
        ],
        function (err) {
          if (err) {
            db.run("ROLLBACK");
            return callback(err);
          }

          const purchaseId = this.lastID;
          let itemsProcessed = 0;
          let hasError = false;

          if (!items || items.length === 0) {
            db.run("COMMIT");
            return callback(null, purchaseId);
          }

          items.forEach((item) => {
            db.run(
              `INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost) VALUES (?, ?, ?, ?)`,
              [purchaseId, item.product_id, item.quantity, item.unit_cost],
              function (err2) {
                if (err2 && !hasError) {
                  hasError = true;
                  db.run("ROLLBACK");
                  return callback(err2);
                }

                const purchaseItemId = this.lastID;

                const movement = {
                  product_id: item.product_id,
                  date: purchase.date,
                  type: "in",
                  quantity: item.quantity,
                  user_id: purchase.user_id,
                  note: `Achat n°${purchaseId}`,
                };

                const serials = Array.isArray(item.serial_numbers)
                  ? item.serial_numbers
                  : [];
                let unitsCreated = 0;
                let unitInsertError = false;

                const createUnit = (serial) => {
                  const warrantyMonths = item.warranty_months || 12;
                  const warrantyExpiry =
                    serial && warrantyMonths
                      ? new Date(
                          Date.now() + warrantyMonths * 30 * 24 * 3600 * 1000,
                        ).toISOString()
                      : null;
                  db.run(
                    `INSERT INTO product_units (product_id, purchase_id, purchase_item_id, serial_number, purchase_price, additional_costs, warranty_months, warranty_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      item.product_id,
                      purchaseId,
                      purchaseItemId,
                      serial || null,
                      item.unit_cost,
                      item.additional_costs || 0,
                      item.warranty_months || 12,
                      warrantyExpiry,
                    ],
                    (errUnit) => {
                      if (errUnit && !unitInsertError) {
                        unitInsertError = true;
                        hasError = true;
                        db.run("ROLLBACK");
                        return callback(errUnit);
                      }
                      unitsCreated++;
                      if (unitsCreated === item.quantity && !unitInsertError) {
                        StockService.addStockMovement(movement, (err4) => {
                          if (err4 && !hasError) {
                            hasError = true;
                            db.run("ROLLBACK");
                            return callback(err4);
                          }
                          itemsProcessed++;
                          if (itemsProcessed === items.length && !hasError) {
                            db.run("COMMIT");
                            callback(null, purchaseId);
                          }
                        });
                      }
                    },
                  );
                };

                // create `quantity` number of units
                for (let u = 0; u < item.quantity; u++) {
                  const serial = serials[u] || null;
                  createUnit(serial);
                }
              },
            );
          });
        },
      );
    });
  },

  markProductAsDefective: (productId, quantity, reason, userId, callback) => {
    const movement = {
      product_id: productId,
      date: new Date().toISOString(),
      type: "out",
      quantity: quantity,
      user_id: userId,
      note: reason,
    };

    logger.warn("Matériel défectueux signalé", {
      productId,
      quantity,
      reason,
      reportedBy_userId: userId,
    });

    StockService.addStockMovement(movement, callback);
  },

  addStockMovement: (movement, callback) => {
    let type = (movement.type || "").toString().toLowerCase();
    if (type === "entry" || type === "in") type = "in";
    else if (type === "defective" || type === "out") type = "out";
    else type = "in"; // Default to 'in' if unknown

    const qty = Number(movement.quantity) || 0;
    if (!movement.product_id || qty <= 0) {
      const error = new Error("Mouvement invalide: produit ou quantité manquante");
      logger.error("Tentative d'ajout de mouvement invalide", { movement, error: error.message });
      return callback && callback(error);
    }

    db.run(
      `INSERT INTO stock_movements (product_id, date, type, quantity, user_id, note) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        movement.product_id,
        movement.date || new Date().toISOString(),
        type,
        qty,
        movement.user_id || null,
        movement.note || null,
      ],
      function (err) {
        if (err) {
          logger.error("Erreur ajout mouvement stock", {
            error: err.message,
            movement: { ...movement, mappedType: type },
          });
          return callback && callback(err);
        }

        const delta = type === "in" ? qty : -qty;
        db.run(
          `UPDATE products SET stock = stock + ? WHERE id = ?`,
          [delta, movement.product_id],
          function (err2) {
            if (err2) {
              logger.error("Erreur mise à jour stock depuis movement", {
                error: err2.message,
                movement,
              });
              return callback && callback(err2);
            }
            logger.info("Mouvement de stock ajouté", {
              movementId: this.lastID,
              productId: movement.product_id,
              delta,
            });
            callback && callback(null);
          },
        );
      },
    );
  },

  // Units (per-physical-unit) helpers
  getUnitsByProduct: (product_id, callback) => {
    db.all(
      "SELECT * FROM product_units WHERE product_id = ? ORDER BY created_at DESC",
      [product_id],
      callback,
    );
  },

  findUnitBySerial: (serial, callback) => {
    if (!serial) return callback && callback(null, null);
    db.get(
      "SELECT * FROM product_units WHERE serial_number = ?",
      [serial],
      callback,
    );
  },

  scanUnits: (serials, callback) => {
    if (!Array.isArray(serials) || serials.length === 0)
      return callback(null, []);
    const placeholders = serials.map(() => "?").join(",");
    db.all(
      `SELECT * FROM product_units WHERE serial_number IN (${placeholders})`,
      serials,
      callback,
    );
  },

  getStockHistory: (product_id, callback) => {
    db.all(
      "SELECT * FROM stock_movements WHERE product_id = ? ORDER BY date DESC",
      [product_id],
      callback,
    );
  },
  searchProducts: (query, callback) => {
    const sql = `SELECT * FROM products WHERE (model LIKE ? OR category LIKE ? OR brand LIKE ?) AND is_deleted = 0`;
    const search = `%${query}%`;
    db.all(sql, [search, search, search], callback);
  },
  getDefectiveUnits: (callback) => {
    const sql = `
      SELECT 
        p.id as product_id,
        p.model, 
        p.brand,
        COUNT(pu.id) as defective_count
      FROM product_units pu
      JOIN products p ON pu.product_id = p.id
      WHERE pu.status = 'defective'
      GROUP BY p.id
    `;
    db.all(sql, [], callback);
  },

  reportDefectiveQuantity: (productId, quantity, note, userId, callback) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      
      // 1. Check stock
      db.get("SELECT stock FROM products WHERE id = ?", [productId], (err, row) => {
        if (err) { db.run("ROLLBACK"); return callback(err); }
        if (!row || row.stock < quantity) {
          db.run("ROLLBACK"); 
          return callback(new Error("Stock insuffisant pour signaler ces pannes"));
        }

        // 2. Insert N defective units
        const stmt = db.prepare("INSERT INTO product_units (product_id, status, created_at) VALUES (?, 'defective', datetime('now'))");
        for (let i = 0; i < quantity; i++) {
          stmt.run(productId);
        }
        stmt.finalize((err2) => {
          if (err2) { db.run("ROLLBACK"); return callback(err2); }

          // 3. Update main stock
          db.run("UPDATE products SET stock = stock - ? WHERE id = ?", [quantity, productId], (err3) => {
            if (err3) { db.run("ROLLBACK"); return callback(err3); }
            
            // 4. Log movement
            db.run("INSERT INTO stock_movements (product_id, type, quantity, user_id, note, date) VALUES (?, 'out', ?, ?, ?, datetime('now'))",
              [productId, quantity, userId, note || "Mise en maintenance (lot)"],
              (err4) => {
                if (err4) { db.run("ROLLBACK"); return callback(err4); }
                db.run("COMMIT", callback);
              }
            );
          });
        });
      });
    });
  },

  markRepairedQuantity: (productId, quantity, userId, callback) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // 1. Find N defective units for this product
      db.all("SELECT id FROM product_units WHERE product_id = ? AND status = 'defective' LIMIT ?", [productId, quantity], (err, rows) => {
        if (err) { db.run("ROLLBACK"); return callback(err); }
        if (rows.length < quantity) {
          db.run("ROLLBACK");
          return callback(new Error("Pas assez d'unités défectueuses trouvées"));
        }

        const ids = rows.map(r => r.id);
        const placeholders = ids.map(() => "?").join(",");

        // 2. Mark them as 'in' (or delete them if you prefer, but 'in' keeps history if we add a 'repaired' status later)
        // Actually, let's just delete them from product_units if we don't track serials, OR set them to 'in' if we do.
        // Assuming we want to return them to stock as "normal" items.
        // If we set them to 'in', they become "available units".
        db.run(`DELETE FROM product_units WHERE id IN (${placeholders})`, ids, (err2) => {
           if (err2) { db.run("ROLLBACK"); return callback(err2); }

           // 3. Update main stock
           db.run("UPDATE products SET stock = stock + ? WHERE id = ?", [quantity, productId], (err3) => {
             if (err3) { db.run("ROLLBACK"); return callback(err3); }

             // 4. Log movement
             db.run("INSERT INTO stock_movements (product_id, type, quantity, user_id, note, date) VALUES (?, 'in', ?, ?, 'Retour de maintenance', datetime('now'))",
               [productId, quantity, userId],
               (err4) => {
                 if (err4) { db.run("ROLLBACK"); return callback(err4); }
                 db.run("COMMIT", callback);
               }
             );
           });
        });
      });
    });
  },

  markUnitAsDefective: (unitId, userId, callback) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run("UPDATE product_units SET status = 'defective' WHERE id = ?", [unitId], function(err) {
        if (err) { db.run("ROLLBACK"); return callback(err); }
        
        db.get("SELECT product_id FROM product_units WHERE id = ?", [unitId], (err2, unit) => {
          if (unit) {
            db.run("INSERT INTO stock_movements (product_id, type, quantity, user_id, note, date) VALUES (?, 'out', 1, ?, 'Mise en maintenance (panne)', datetime('now'))", 
              [unit.product_id, userId]);
            db.run("UPDATE products SET stock = stock - 1 WHERE id = ? AND stock > 0", [unit.product_id]);
          }
          db.run("COMMIT");
          callback(null);
        });
      });
    });
  },
  markAsRepaired: (unitId, userId, callback) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run("UPDATE product_units SET status = 'in' WHERE id = ?", [unitId], function(err) {
        if (err) { db.run("ROLLBACK"); return callback(err); }
        
        db.get("SELECT product_id FROM product_units WHERE id = ?", [unitId], (err2, unit) => {
          if (unit) {
            db.run("INSERT INTO stock_movements (product_id, type, quantity, user_id, note, date) VALUES (?, 'in', 1, ?, 'Retour de maintenance (réparé)', datetime('now'))", 
              [unit.product_id, userId]);
            db.run("UPDATE products SET stock = stock + 1 WHERE id = ?", [unit.product_id]);
          }
          db.run("COMMIT");
          callback(null);
        });
      });
    });
  },
};

module.exports = StockService;
