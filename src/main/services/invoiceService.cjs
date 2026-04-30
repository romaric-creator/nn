const { db } = require("../db/database.cjs");
const logger = require("./loggingService.cjs");

const InvoiceService = {
  /**
   * Génère le numéro de facture unique (IN-YYYY-MM-XXXXX)
   */
  generateInvoiceNumber: (callback) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const dayPrefix = `${year}${month}`;

    db.get(
      `SELECT COUNT(*) as count FROM invoices
       WHERE invoice_number LIKE ? OR strftime('%Y%m', invoice_date) = ?`,
      [`IN-${dayPrefix}%`, dayPrefix],
      (err, row) => {
        if (err) return callback(err, null);
        const sequence = (row.count || 0) + 1;
        const invoiceNumber = `IN-${dayPrefix}${String(sequence).padStart(5, "0")}`;
        callback(null, invoiceNumber);
      },
    );
  },

  /**
   * Crée une facture à partir d'une vente
   */
  createInvoiceFromSale: (saleId) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        (async () => {
          try {
            await new Promise((res, rej) => {
              db.run("BEGIN TRANSACTION", (err) => {
                if (err) rej(err);
                else res();
              });
            });

            // Récupérer les détails de la vente
            const sale = await new Promise((res, rej) => {
              db.get(
                `SELECT s.*, c.name as customer_name, u.name as user_name
                 FROM sales s
                 LEFT JOIN customers c ON s.customer_id = c.id
                 LEFT JOIN users u ON s.user_id = u.id
                 WHERE s.id = ?`,
                [saleId],
                (saleErr, row) => {
                  if (saleErr) rej(saleErr);
                  else if (!row) rej(new Error("Vente non trouvée"));
                  else res(row);
                },
              );
            });

            // Récupérer les items de la vente
            const items = await new Promise((res, rej) => {
              db.all(
                `SELECT si.*, p.model, p.brand, p.state
                 FROM sale_items si
                 LEFT JOIN products p ON si.product_id = p.id
                 WHERE si.sale_id = ?`,
                [saleId],
                (itemsErr, rows) => {
                  if (itemsErr) rej(itemsErr);
                  else res(rows);
                },
              );
            });

            // Générer le numéro de facture
            const invoiceNumber = await new Promise((res, rej) => {
              InvoiceService.generateInvoiceNumber((numErr, num) => {
                if (numErr) rej(numErr);
                else res(num);
              });
            });

            const invoiceDate = new Date().toISOString().split("T")[0];
            const discountAmount = sale.discount_amount || 0;
            const totalAmount = sale.total || 0;

            // Créer la facture
            const invoiceInsertResult = await new Promise((res, rej) => {
              db.run(
                `INSERT INTO invoices
                 (sale_id, invoice_number, invoice_date, customer_id, total_amount, discount_amount, payment_method, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  saleId,
                  invoiceNumber,
                  invoiceDate,
                  sale.customer_id,
                  totalAmount,
                  discountAmount,
                  sale.payment_method,
                  "paid",
                ],
                function (invoiceErr) {
                  if (invoiceErr) rej(invoiceErr);
                  else res(this.lastID);
                },
              );
            });
            const invoiceId = invoiceInsertResult;

            // Ajouter les items de facture
            for (const item of items) {
              const itemTotal =
                (item.selling_price || item.price) * item.quantity;
              await new Promise((res, rej) => {
                db.run(
                  `INSERT INTO invoice_items
                   (invoice_id, product_id, quantity, unit_price, item_total)
                   VALUES (?, ?, ?, ?, ?)`,
                  [
                    invoiceId,
                    item.product_id,
                    item.quantity,
                    item.selling_price || item.price,
                    itemTotal,
                  ],
                  (itemInsertErr) => {
                    if (itemInsertErr) rej(itemInsertErr);
                    else res();
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

            logger.info("Facture créée", {
              invoiceId,
              invoiceNumber,
              saleId,
            });
            resolve({
              id: invoiceId,
              invoiceNumber,
              invoiceDate,
              sale,
              items,
            });
          } catch (error) {
            db.run("ROLLBACK", (rollbackErr) => {
              if (rollbackErr) {
                logger.error("Erreur lors du ROLLBACK de la facture", {
                  rollbackErr,
                  saleId,
                });
              }
            });
            logger.error("Erreur lors de la création de la facture", {
              error: error.message,
              saleId,
            });
            reject(error);
          }
        })();
      });
    });
  },

  /**
   * Génère le HTML de la facture (prêt pour PDF)
   */
  generateInvoiceHTML: (invoiceData, callback) => {
    // Normaliser la structure - accepte deux formats différents
    const sale = invoiceData.sale || invoiceData; // Si pas de .sale, c'est que l'objet EST la facture
    const invoiceNumber =
      invoiceData.invoiceNumber || invoiceData.invoice_number;
    const invoiceDate = invoiceData.invoiceDate || invoiceData.invoice_date;
    const items = invoiceData.items || [];

    const itemsHTML = items
      .map(
        (item) => `
      <tr>
        <td>${item.brand} ${item.model} ${item.state || ""}</td>
        <td class="qty">${item.quantity}</td>
        <td class="price">${(item.unit_price || 0).toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}</td>
        <td class="price">${(
          (item.unit_price || 0) * item.quantity
        ).toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}</td>
      </tr>
    `,
      )
      .join("");

    const subtotal = items.reduce(
      (sum, item) => sum + (item.unit_price || 0) * item.quantity,
      0,
    );
    const discountAmount = sale.discount_amount || 0;
    const total = Math.max(0, subtotal - discountAmount);

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Facture ${invoiceNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            background: white;
          }
          .container {
            width: 80mm;
            margin: 0 auto;
            padding: 8px;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 12px;
            border-bottom: 3px dashed #FF5F1F;
            padding-bottom: 8px;
          }
          .company-name {
            font-size: 14px;
            font-weight: bold;
            color: #1A1A1A;
          }
          .invoice-title {
            font-size: 11px;
            font-weight: bold;
            margin-top: 6px;
            letter-spacing: 2px;
          }
          .invoice-meta {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin: 8px 0;
          }
          .customer-section {
            margin-bottom: 8px;
            border: 1px solid #ddd;
            padding: 6px;
          }
          .customer-label {
            font-weight: bold;
            font-size: 10px;
          }
          .customer-name {
            font-size: 11px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
            border-bottom: 2px solid #000;
          }
          .items-table th {
            text-align: left;
            font-weight: bold;
            padding: 4px 2px;
            border-bottom: 1px solid #000;
            font-size: 10px;
          }
          .items-table td {
            padding: 8px 8px;
            font-size: 10px;
          }
          .qty, .price {
            text-align: right;
          }
          .totals {
            width: 100%;
            margin-bottom: 8px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            font-size: 11px;
          }
          .total-row.subtotal {
            border-bottom: 1px solid #ddd;
          }
          .total-row.discount {
            color: #c00;
          }
          .total-row.grand-total {
            font-weight: bold;
            font-size: 12px;
            border-top: 2px solid #000;
            padding-top: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid #ddd;
            font-size: 10px;
          }
          .payment-method {
            font-size: 10px;
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-name">FLEXY STORE</div>
            <div style="font-size: 9px; color: #666; margin-top: 2px;">Électronique • Accessoires • Services</div>
            <div class="invoice-title" style="margin-top: 8px;">REÇU DE VENTE</div>
          </div>

          <div class="invoice-meta" style="background: #f5f5f5; padding: 6px; margin: 8px 0; border-left: 4px solid #FF5F1F;">
            <div><strong>N°:</strong> ${invoiceNumber}</div>
            <div><strong>Date:</strong> ${new Date(invoiceDate).toLocaleDateString("fr-FR")}</div>
          </div>

          ${
            sale.customer_name
              ? `
          <div class="customer-section">
            <div class="customer-label">CLIENT:</div>
            <div class="customer-name">${sale.customer_name}</div>
          </div>
          `
              : ""
          }

          <table class="items-table">
            <thead>
              <tr>
                <th>Désignation</th>
                <th class="qty" style="width: 30px;">Qté</th>
                <th class="price" style="width: 50px;">PU</th>
                <th class="price" style="width: 50px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row subtotal">
              <span>SOUS-TOTAL:</span>
              <span>${subtotal.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} CFA</span>
            </div>
            ${
              discountAmount > 0
                ? `
            <div class="total-row discount">
              <span>REMISE:</span>
              <span>-${discountAmount.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} CFA</span>
            </div>
            `
                : ""
            }
            <div class="total-row grand-total">
              <span>MONTANT TOTAL:</span>
              <span>${total.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} CFA</span>
            </div>
          </div>

          <div class="footer">
            <div style="background: #f5f5f5; padding: 6px; margin-bottom: 8px; border-left: 4px solid #FF5F1F;">
              <strong>Paiement:</strong> ${sale.payment_method || "ESPÈCES"}
            </div>
            <div style="font-size: 9px; text-align: center; margin-top: 8px; font-weight: bold;">
              ✓ Merci pour votre achat!
            </div>
            <div style="margin-top: 6px; font-size: 8px; color: #999; text-align: center;">
              ${new Date().toLocaleString("fr-FR")}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    callback(null, html);
  },

  /**
   * Récupère une facture par ID avec tous ses détails
   */
  getInvoiceById: (invoiceId, callback) => {
    db.get(
      `SELECT i.*, c.name as customer_name FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE i.id = ?`,
      [invoiceId],
      (err, invoice) => {
        if (err) return callback(err);
        if (!invoice) return callback(new Error("Facture non trouvée"));

        db.all(
          `SELECT ii.*, p.brand, p.model, p.state
           FROM invoice_items ii
           LEFT JOIN products p ON ii.product_id = p.id
           WHERE ii.invoice_id = ?`,
          [invoiceId],
          (itemsErr, items) => {
            if (itemsErr) return callback(itemsErr);
            callback(null, { ...invoice, items });
          },
        );
      },
    );
  },

  /**
   * Liste tous les factures
   */
  getInvoices: (callback) => {
    db.all(
      `SELECT i.*, c.name as customer_name, COUNT(ii.id) as item_count
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
       GROUP BY i.id
       ORDER BY i.invoice_date DESC`,
      [],
      (err, rows) => {
        if (err) return callback(err);
        callback(null, rows || []);
      },
    );
  },

  /**
   * Récupère tous les factures d'un client spécifique
   */
  getInvoicesByCustomerId: (customerId, callback) => {
    db.all(
      `SELECT i.*, COUNT(ii.id) as item_count
       FROM invoices i
       LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
       WHERE i.customer_id = ?
       GROUP BY i.id
       ORDER BY i.invoice_date DESC`,
      [customerId],
      (err, rows) => {
        if (err) return callback(err);
        callback(null, rows || []);
      },
    );
  },
};

module.exports = InvoiceService;
