const { db } = require("../db/database.cjs");
const logger = require("./loggingService.cjs");

const RepairService = {
  /**
   * Marque une unité de produit spécifique comme réparée.
   * @param {number} unitId - L'ID de l'unité de produit (table product_units).
   * @param {number} userId - L'ID de l'utilisateur effectuant l'action.
   * @param {function} callback - La fonction de rappel (err).
   */
  markUnitAsRepaired: (unitId, userId, callback) => {
    logger.info("Tentative de marquer l'unité comme réparée", { unitId, userId });

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // Étape 1: Vérifier que l'unité existe et est bien défectueuse
      db.get("SELECT * FROM product_units WHERE id = ? AND status = 'defective'", [unitId], (err, unit) => {
        if (err) {
          logger.error("Erreur DB lors de la recherche de l'unité défectueuse", { unitId, error: err.message });
          db.run("ROLLBACK");
          return callback(err);
        }

        if (!unit) {
          const notFoundError = new Error("Unité non trouvée ou n'est pas défectueuse.");
          logger.warn("Unité non trouvée pour réparation", { unitId });
          db.run("ROLLBACK");
          return callback(notFoundError);
        }

        // Étape 2: Mettre à jour le statut de l'unité à 'in' (en stock)
        db.run("UPDATE product_units SET status = 'in' WHERE id = ?", [unitId], function (updateErr) {
          if (updateErr) {
            logger.error("Erreur lors de la mise à jour du statut de l'unité", { unitId, error: updateErr.message });
            db.run("ROLLBACK");
            return callback(updateErr);
          }

          // Étape 3: Incrémenter le stock principal du produit
          db.run("UPDATE products SET stock = stock + 1 WHERE id = ?", [unit.product_id], function (stockUpdateErr) {
            if (stockUpdateErr) {
              logger.error("Erreur lors de l'incrémentation du stock produit", { productId: unit.product_id, error: stockUpdateErr.message });
              db.run("ROLLBACK");
              return callback(stockUpdateErr);
            }

            // Étape 4: Enregistrer le mouvement de stock
            const note = `Retour de maintenance (Réparé) - Unité ID: ${unitId}`;
            db.run(
              "INSERT INTO stock_movements (product_id, type, quantity, user_id, note, date) VALUES (?, 'in', 1, ?, ?, datetime('now'))",
              [unit.product_id, userId, note],
              function (movementErr) {
                if (movementErr) {
                  logger.error("Erreur lors de la création du mouvement de stock pour réparation", { productId: unit.product_id, error: movementErr.message });
                  db.run("ROLLBACK");
                  return callback(movementErr);
                }

                // Étape 5: Enregistrer une trace dans l'audit
                const auditActionUnit = "MARK_UNIT_REPAIRED";
                const auditDetailsUnit = {
                  unitId: unitId,
                  productId: unit.product_id,
                  previousStatus: unit.status, // 'defective'
                  newStatus: "in", // Le nouveau statut est 'in' (en stock)
                  stockIncremented: true,
                  movementRecorded: true,
                };
                AuditService.logAudit(
                  "product_units", // Entité pour le changement de statut
                  unitId,
                  auditActionUnit,
                  userId || null,
                  JSON.stringify({ status: unit.status }), // Ancienne valeur: statut défectueux
                  JSON.stringify(auditDetailsUnit) // Nouvelle valeur: détails de la réparation
                );
                
                // Audit séparé pour l'incrémentation du stock principal
                const auditActionProduct = "STOCK_INCREMENT_REPAIR";
                const auditDetailsProduct = {
                  productId: unit.product_id,
                  quantityIncremented: 1,
                  reason: `Unité ${unitId} réparée`,
                };
                AuditService.logAudit(
                  "products", // Entité pour l'incrémentation du stock
                  unit.product_id,
                  auditActionProduct,
                  userId || null,
                  null, // Pas d'ancienne valeur de stock facilement accessible ici sans une lecture supplémentaire
                  JSON.stringify(auditDetailsProduct)
                );


                // Si tout va bien, on commit la transaction
                db.run("COMMIT", (commitErr) => {
                  if (commitErr) {
                    logger.error("Erreur lors du COMMIT de la transaction de réparation", { error: commitErr.message });
                    return callback(commitErr);
                  }
                  logger.info("Unité marquée comme réparée avec succès", { unitId, productId: unit.product_id });
                  callback(null);
                });
              }
            );
          });
        });
      });
    });
  },

  /**
   * Marque un certain nombre d'unités défectueuses (non sérialisées) comme réparées.
   * @param {number} productId - L'ID du produit.
   * @param {number} quantity - Le nombre d'unités à réparer.
   * @param {number} userId - L'ID de l'utilisateur.
   * @param {function} callback - La fonction de rappel (err).
   */
  markQuantityAsRepaired: (productId, quantity, userId, callback) => {
    logger.info("Tentative de marquer une quantité de produit comme réparée", { productId, quantity, userId });

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // Étape 1: Trouver N unités défectueuses pour ce produit
      db.all("SELECT id FROM product_units WHERE product_id = ? AND status = 'defective' LIMIT ?", [productId, quantity], (err, rows) => {
        if (err) {
          logger.error("Erreur DB lors de la recherche des unités défectueuses par quantité", { productId, error: err.message });
          db.run("ROLLBACK");
          return callback(err);
        }
        if (rows.length < quantity) {
          const notEnoughError = new Error("Pas assez d'unités défectueuses enregistrées pour ce produit.");
          logger.warn("Quantité insuffisante d'unités défectueuses pour réparation", { productId, requested: quantity, found: rows.length });
          db.run("ROLLBACK");
          return callback(notEnoughError);
        }

        const ids = rows.map(r => r.id);
        const placeholders = ids.map(() => "?").join(",");

        // Étape 2: Supprimer ces unités de la table des unités (car elles retournent au stock général)
        // Alternative: les passer à 'in' si on veut garder une trace, mais la suppression est plus simple pour du stock non-sérialisé.
        db.run(`DELETE FROM product_units WHERE id IN (${placeholders})`, ids, (deleteErr) => {
           if (deleteErr) {
             logger.error("Erreur lors de la suppression des unités défectueuses réparées", { ids, error: deleteErr.message });
             db.run("ROLLBACK");
             return callback(deleteErr);
           }

           // Étape 3: Mettre à jour le stock principal
           db.run("UPDATE products SET stock = stock + ? WHERE id = ?", [quantity, productId], (stockUpdateErr) => {
             if (stockUpdateErr) {
               logger.error("Erreur lors de la mise à jour du stock après réparation en quantité", { productId, quantity, error: stockUpdateErr.message });
               db.run("ROLLBACK");
               return callback(stockUpdateErr);
             }

             // Étape 4: Enregistrer le mouvement de stock
             const note = `Retour de maintenance (Lot de ${quantity})`;
             db.run("INSERT INTO stock_movements (product_id, type, quantity, user_id, note, date) VALUES (?, 'in', ?, ?, ?, datetime('now'))",
               [productId, quantity, userId, note],
               (movementErr) => {
                 if (movementErr) {
                   logger.error("Erreur lors de la création du mouvement de stock pour réparation en quantité", { productId, quantity, error: movementErr.message });
                   db.run("ROLLBACK");
                   return callback(movementErr);
                 }

                 // Étape 5: Log d'audit
                 const auditAction = "MARK_QUANTITY_REPAIRED";
                 const auditDetails = {
                   productId: productId,
                   quantity: quantity,
                   unitsDeleted: ids, // Liste des IDs des unités supprimées
                   reason: "Réparation en lot",
                 };
                 AuditService.logAudit(
                   "products", // Entité principale affectée (stock global)
                   productId,
                   auditAction,
                   userId || null,
                   JSON.stringify({ deletedUnitIds: ids }), // Ancienne valeur: référence aux unités supprimées
                   JSON.stringify(auditDetails) // Nouvelle valeur: détails de l'action
                 );
                 
                 db.run("COMMIT", (commitErr) => {
                   if (commitErr) {
                     logger.error("Erreur lors du COMMIT de la transaction de réparation en quantité", { error: commitErr.message });
                     return callback(commitErr);
                   }
                   logger.info("Réparation en quantité réussie", { productId, quantity });
                   callback(null);
                 });
               }
             );
           });
        });
      });
    });
  }
};

module.exports = RepairService;
