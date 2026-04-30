const { ipcMain } = require("electron");
const StockService = require("../services/stockService.cjs");
// BUG FIX: importer le db partagé pour éviter d'ouvrir une nouvelle connexion dans bulkReceive
const { db } = require("../db/database.cjs");

ipcMain.handle("stock:getAll", async () => {
  return new Promise((resolve) => {
    StockService.getAllProducts((err, rows) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: rows });
    });
  });
});

ipcMain.handle("stock:getById", async (event, id) => {
  return new Promise((resolve) => {
    StockService.getProductById(id, (err, row) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: row });
    });
  });
});

ipcMain.handle("stock:add", async (event, product) => {
  return new Promise((resolve) => {
    StockService.addProduct(product, (err) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true });
    });
  });
});

ipcMain.handle("stock:update", async (event, id, product) => {
  return new Promise((resolve) => {
    StockService.updateProduct(id, product, (err) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true });
    });
  });
});

ipcMain.handle("stock:delete", async (event, id) => {
  return new Promise((resolve) => {
    StockService.deleteProduct(id, (err) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true });
    });
  });
});

ipcMain.handle("stock:restore", async (event, id) => {
  return new Promise((resolve) => {
    StockService.restoreProduct(id, (err) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true });
    });
  });
});

ipcMain.handle("stock:low", async (event, threshold) => {
  return new Promise((resolve) => {
    StockService.getLowStock(threshold, (err, rows) => {
      if (err) {
        console.error("IPC Error stock:low:", err.message);
        resolve({ success: false, message: err.message });
      } else {
        resolve({ success: true, data: rows });
      }
    });
  });
});

ipcMain.handle("stock:addMovement", async (event, movement) => {
  return new Promise((resolve) => {
    StockService.addStockMovement(movement, (err) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true });
    });
  });
});

ipcMain.handle("stock:history", async (event, product_id) => {
  return new Promise((resolve) => {
    StockService.getStockHistory(product_id, (err, rows) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: rows });
    });
  });
});

ipcMain.handle("stock:search", async (event, query) => {
  return new Promise((resolve) => {
    StockService.searchProducts(query, (err, rows) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: rows });
    });
  });
});

ipcMain.handle(
  "stock:mark-as-defective",
  async (event, { productId, quantity, reason, userId }) => {
    return new Promise((resolve) => {
      StockService.markProductAsDefective(
        productId,
        quantity,
        reason,
        userId,
        (err) => {
          if (err) resolve({ success: false, message: err.message });
          else resolve({ success: true });
        },
      );
    });
  },
);

ipcMain.handle("stock:markDefective", async (event, unitId, userId) => {
  return new Promise((resolve) => {
    StockService.markUnitAsDefective(unitId, userId, (err) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true });
    });
  });
});

ipcMain.handle("units:find", async (event, serial) => {
  return new Promise((resolve) => {
    StockService.findUnitBySerial(serial, (err, row) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: row });
    });
  });
});

ipcMain.handle("units:scan", async (event, serials) => {
  return new Promise((resolve) => {
    StockService.scanUnits(serials, (err, rows) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: rows });
    });
  });
});

ipcMain.handle("stock:bulkReceive", async (event, purchaseInfo, rows) => {
  return new Promise((resolve) => {
    // BUG FIX: remplacé la création d'une nouvelle connexion sqlite3 par
    // le db partagé importé depuis database.cjs. L'ancienne version ouvrait
    // une connexion isolée → risques de lock et d'incohérence transactionnelle.
    const findProductByName = (productName, callback) => {
      db.get(
        `SELECT id FROM products WHERE (brand || ' ' || model) LIKE ? OR model LIKE ? LIMIT 1`,
        [`%${productName}%`, `%${productName}%`],
        (err, row) => {
          if (err) callback(err, null);
          else if (!row)
            callback(new Error(`Produit introuvable: ${productName}`), null);
          else callback(null, row.id);
        },
      );
    };

    let processedItems = [];
    let pendingLookups = 0;
    let hasError = false;

    const completeProcessing = () => {
      if (pendingLookups === 0 && !hasError) {
        const purchase = {
          supplier_id: purchaseInfo.supplier_id || null,
          date: purchaseInfo.date || new Date().toISOString(),
          total_amount: purchaseInfo.total_amount || 0,
          user_id: purchaseInfo.user_id || null,
        };
        StockService.addPurchase(
          purchase,
          processedItems,
          (err, purchaseId) => {
            if (err) resolve({ success: false, message: err.message });
            else resolve({ success: true, purchaseId });
          },
        );
      }
    };

    if (!rows || rows.length === 0) {
      return resolve({ success: false, message: "Aucune ligne à traiter" });
    }

    rows.forEach((r) => {
      if (r.product_id) {
        processedItems.push({
          product_id: r.product_id,
          quantity: r.quantity,
          unit_cost: r.unit_cost,
          additional_costs: r.additional_costs,
          warranty_months: r.warranty_months,
        });
      } else if (r.product_name || r.nom_produit) {
        pendingLookups++;
        const productName = r.product_name || r.nom_produit;
        findProductByName(productName, (err, productId) => {
          if (err) {
            if (!hasError) {
              hasError = true;
              resolve({ success: false, message: err.message });
            }
          } else {
            processedItems.push({
              product_id: productId,
              quantity: r.quantity,
              unit_cost: r.unit_cost,
              additional_costs: r.additional_costs,
              warranty_months: r.warranty_months,
            });
            pendingLookups--;
            completeProcessing();
          }
        });
      } else {
        if (!hasError) {
          hasError = true;
          resolve({
            success: false,
            message: "Ligne invalide: product_id ou product_name requis",
          });
        }
      }
    });

    if (pendingLookups === 0 && !hasError) {
      completeProcessing();
    }
  });
});

ipcMain.handle("stock:getDefective", async () => {
  return new Promise((resolve) => {
    StockService.getDefectiveUnits((err, rows) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: rows });
    });
  });
});

ipcMain.handle("stock:reportDefectiveQuantity", async (event, payload) => {
  const { productId, quantity, note, userId } = payload;
  return new Promise((resolve) => {
    StockService.reportDefectiveQuantity(
      productId,
      quantity,
      note,
      userId,
      (err) => {
        if (err) resolve({ success: false, message: err.message });
        else resolve({ success: true });
      },
    );
  });
});

ipcMain.handle("stock:markRepairedQuantity", async (event, payload) => {
  const { productId, quantity, userId } = payload;
  return new Promise((resolve) => {
    StockService.markRepairedQuantity(productId, quantity, userId, (err) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true });
    });
  });
});
