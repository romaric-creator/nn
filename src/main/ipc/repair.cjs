const { ipcMain } = require("electron");
const RepairService = require("../services/repairService.cjs");

/**
 * Gestionnaire IPC pour marquer une unité spécifique comme réparée.
 * @param {object} event - L'événement IPC.
 * @param {object} params - Les paramètres.
 * @param {number} params.unitId - L'ID de l'unité de produit.
 * @param {number} params.userId - L'ID de l'utilisateur.
 */
ipcMain.handle("repair:mark-unit-as-repaired", async (event, { unitId, userId }) => {
  return new Promise((resolve) => {
    RepairService.markUnitAsRepaired(unitId, userId, (err) => {
      if (err) {
        console.error("IPC Error repair:mark-unit-as-repaired:", err.message);
        resolve({ success: false, message: err.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});

/**
 * Gestionnaire IPC pour marquer une quantité de produits comme réparée.
 * @param {object} event - L'événement IPC.
 * @param {object} params - Les paramètres.
 * @param {number} params.productId - L'ID du produit.
 * @param {number} params.quantity - La quantité à marquer comme réparée.
 * @param {number} params.userId - L'ID de l'utilisateur.
 */
ipcMain.handle("repair:mark-quantity-as-repaired", async (event, { productId, quantity, userId }) => {
  return new Promise((resolve) => {
    RepairService.markQuantityAsRepaired(productId, quantity, userId, (err) => {
      if (err) {
        console.error("IPC Error repair:mark-quantity-as-repaired:", err.message);
        resolve({ success: false, message: err.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});
