const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

let app;
try {
  app = require("electron").app;
} catch (err) {
  // Pas dans un environnement Electron (ex: scripts de test ou migrations)
  app = null;
}

// Determine if we are packaged
const isPackaged = process.env.NODE_ENV === 'production';

const schemaPath = isPackaged
  ? path.join(process.resourcesPath, "schema.sql")
  : path.join(__dirname, "schema.sql");

function ensureDbDir(dbFilePath) {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createDbConnection(dbFilePath) {
  ensureDbDir(dbFilePath);
  return new sqlite3.Database(dbFilePath, (err) => {
    if (err) {
      console.error("Erreur ouverture DB:", err.message);
    }
  });
}

const initDb = (databaseInstance, schemaFilePath) => {
  return new Promise((resolve, reject) => {
    const schema = fs.readFileSync(schemaFilePath, "utf-8");
    databaseInstance.exec(schema, (err) => {
      if (err) {
        console.error("Erreur initialisation DB:", err.message);
        reject(err);
      } else {
        console.log("Base SQLite initialisée:", databaseInstance.filename);

        // Migration : Vérifier si min_stock existe, sinon l'ajouter
        databaseInstance.all("PRAGMA table_info(products)", (err, columns) => {
          if (!err) {
            const hasMinStock = columns.some((col) => col.name === "min_stock");
            if (!hasMinStock) {
              databaseInstance.run(
                "ALTER TABLE products ADD COLUMN min_stock INTEGER DEFAULT 2",
              );
              console.log(
                "Migration : Colonne min_stock ajoutée à la table products.",
              );
            }

            // Migration : Vérifier si is_deleted existe, sinon l'ajouter
            const hasIsDeleted = columns.some((col) => col.name === "is_deleted");
            if (!hasIsDeleted) {
              databaseInstance.run(
                "ALTER TABLE products ADD COLUMN is_deleted INTEGER DEFAULT 0",
              );
              console.log(
                "Migration : Colonne is_deleted ajoutée à la table products.",
              );
            }

            // Migration : Vérifier si remarque existe, sinon l'ajouter
            const hasRemarque = columns.some((col) => col.name === "remarque");
            if (!hasRemarque) {
              databaseInstance.run(
                "ALTER TABLE products ADD COLUMN remarque TEXT",
              );
              console.log(
                "Migration : Colonne remarque ajoutée à la table products.",
              );
            }
          }
        });

        // Migration destructive : supprimer colonnes obsolètes si elles existent
        databaseInstance.all("PRAGMA table_info(products)", (tErr, cols) => {
          if (tErr || !cols) return;
          const expectedCols = new Set([
            "id",
            "category",
            "brand",
            "model",
            "state",
            "purchase_price",
            "sale_price",
            "min_sale_price",
            "entry_date",
            "cpu",
            "ram",
            "gpu",
            "storage",
            "stock",
            "min_stock",
          ]);
          const hasObsolete = cols.some((c) => !expectedCols.has(c.name));
          if (!hasObsolete) return;

          console.log(
            "Migration destructive : suppression des colonnes obsolètes de products",
          );
          databaseInstance.serialize(() => {
            databaseInstance.run("PRAGMA foreign_keys=OFF");
            databaseInstance.run("BEGIN TRANSACTION");
            databaseInstance.get(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='products_new'",
              (getErr, row) => {
                if (getErr) {
                  console.error("Erreur check products_new:", getErr.message);
                  databaseInstance.run("PRAGMA foreign_keys=ON");
                  return;
                }

                const createAndSwap = () => {
                  databaseInstance.run(
                    `CREATE TABLE products_new (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  category TEXT,
                  brand TEXT,
                  model TEXT,
                  state TEXT,
                  purchase_price REAL,
                  sale_price REAL,
                  min_sale_price REAL,
                  entry_date TEXT,
                  cpu TEXT,
                  ram TEXT,
                  gpu TEXT,
                  storage TEXT,
                  stock INTEGER DEFAULT 0,
                  min_stock INTEGER DEFAULT 2,
                  is_deleted INTEGER DEFAULT 0
                )`,
                    (createErr) => {
                      if (createErr) {
                        console.error(
                          "Erreur creation products_new:",
                          createErr.message,
                        );
                        databaseInstance.run("PRAGMA foreign_keys=ON");
                        return;
                      }

                      databaseInstance.run(
                        `INSERT OR IGNORE INTO products_new (id, category, brand, model, state, purchase_price, sale_price, min_sale_price, entry_date, cpu, ram, gpu, storage, stock, min_stock)
                    SELECT id, category, brand, model, state, purchase_price, sale_price, min_sale_price, entry_date, cpu, ram, gpu, storage, stock, min_stock FROM products`,
                        (insErr) => {
                          if (insErr) {
                            console.error(
                              "Erreur migration products (drop serial):",
                              insErr.message,
                            );
                            databaseInstance.run("ROLLBACK");
                            databaseInstance.run("PRAGMA foreign_keys=ON");
                            return;
                          }

                          databaseInstance.run("DROP TABLE products", (dropErr) => {
                            if (dropErr) {
                              console.error(
                                "Erreur drop products:",
                                dropErr.message,
                              );
                              databaseInstance.run("ROLLBACK");
                              databaseInstance.run("PRAGMA foreign_keys=ON");
                              return;
                            }

                            databaseInstance.run(
                              "ALTER TABLE products_new RENAME TO products",
                              (renameErr) => {
                                if (renameErr) {
                                  console.error(
                                    "Erreur rename products_new:",
                                    renameErr.message,
                                  );
                                  databaseInstance.run("ROLLBACK");
                                  databaseInstance.run("PRAGMA foreign_keys=ON");
                                  return;
                                }
                                databaseInstance.run("COMMIT");
                                databaseInstance.run("PRAGMA foreign_keys=ON");
                                console.log(
                                  "Migration destructive : colonnes obsolètes supprimées.",
                                );
                              },
                            );
                          });
                        },
                      );
                    },
                  );
                };

                if (row) {
                  databaseInstance.run("DROP TABLE IF EXISTS products_new", (dropNewErr) => {
                    if (dropNewErr) {
                      console.error(
                        "Erreur suppression products_new existant:",
                        dropNewErr.message,
                      );
                      databaseInstance.run("PRAGMA foreign_keys=ON");
                      return;
                    }
                    createAndSwap();
                  });
                } else {
                  createAndSwap();
                }
              },
            );
          });
        });

        // Migration : ajouter colonne status à sales si manquante
        databaseInstance.all("PRAGMA table_info(sales)", (err2, salesCols) => {
          if (!err2) {
            const hasStatus = salesCols.some((col) => col.name === "status");
            if (!hasStatus) {
              databaseInstance.run(
                "ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'completed'",
              );
              console.log(
                "Migration : Colonne status ajoutée à la table sales.",
              );
            }
          }
        });

        // Migration : ajouter colonnes manquantes à audit_logs
        databaseInstance.all("PRAGMA table_info(audit_logs)", (alErr, alCols) => {
          if (!alErr && alCols) {
            const cols = alCols.map(c => c.name);
            if (!cols.includes("entity")) {
              databaseInstance.run("ALTER TABLE audit_logs ADD COLUMN entity TEXT");
              console.log("Migration : Colonne entity ajoutée à audit_logs.");
            }
            if (!cols.includes("entity_id")) {
              databaseInstance.run("ALTER TABLE audit_logs ADD COLUMN entity_id INTEGER");
              console.log("Migration : Colonne entity_id ajoutée à audit_logs.");
            }
            if (!cols.includes("old_value")) {
              databaseInstance.run("ALTER TABLE audit_logs ADD COLUMN old_value TEXT");
              console.log("Migration : Colonne old_value ajoutée à audit_logs.");
            }
            if (!cols.includes("new_value")) {
              databaseInstance.run("ALTER TABLE audit_logs ADD COLUMN new_value TEXT");
              console.log("Migration : Colonne new_value ajoutée à audit_logs.");
            }
          }
        });

        // Migration : ajouter colonne commission_percent à users si manquante
        databaseInstance.all("PRAGMA table_info(users)", (uErr, userCols) => {
          if (!uErr && userCols) {
            const hasCommission = userCols.some(
              (c) => c.name === "commission_percent",
            );
            if (!hasCommission) {
              databaseInstance.run(
                "ALTER TABLE users ADD COLUMN commission_percent REAL DEFAULT 0",
                (addErr) => {
                  if (!addErr)
                    console.log(
                      "Migration : commission_percent ajoutée à users",
                    );
                },
              );
            }
          }
        });

        // Migration Phase 1 : Prix modifiables + Remises améliorées
        databaseInstance.all("PRAGMA table_info(sale_items)", (siErr, siCols) => {
          if (!siErr && siCols) {
            const hasOriginalPrice = siCols.some(
              (c) => c.name === "original_price",
            );
            const hasSellingPrice = siCols.some(
              (c) => c.name === "selling_price",
            );
            const hasPriceModified = siCols.some(
              (c) => c.name === "price_modified",
            );

            if (!hasOriginalPrice) {
              databaseInstance.run(
                "ALTER TABLE sale_items ADD COLUMN original_price REAL",
                (addErr) => {
                  if (!addErr)
                    console.log(
                      "Migration : original_price ajoutée à sale_items",
                    );
                },
              );
            }
            if (!hasSellingPrice) {
              databaseInstance.run(
                "ALTER TABLE sale_items ADD COLUMN selling_price REAL",
                (addErr) => {
                  if (!addErr)
                    console.log(
                      "Migration : selling_price ajoutée à sale_items",
                    );
                },
              );
            }
            if (!hasPriceModified) {
              databaseInstance.run(
                "ALTER TABLE sale_items ADD COLUMN price_modified INTEGER DEFAULT 0",
                (addErr) => {
                  if (!addErr)
                    console.log(
                      "Migration : price_modified ajoutée à sale_items",
                    );
                },
              );
            }
          }
        });

        // Migration Phase 1 : Type de remise (fixe vs %)
        databaseInstance.all("PRAGMA table_info(sales)", (sErr, sCols) => {
          if (!sErr && sCols) {
            const hasDiscountType = sCols.some(
              (c) => c.name === "discount_type",
            );
            const hasDiscountValue = sCols.some(
              (c) => c.name === "discount_amount",
            );

            if (!hasDiscountType) {
              databaseInstance.run(
                "ALTER TABLE sales ADD COLUMN discount_type TEXT DEFAULT 'fixed' CHECK(discount_type IN ('fixed', 'percentage'))",
                (addErr) => {
                  if (!addErr)
                    console.log("Migration : discount_type ajoutée à sales");
                },
              );
            }
            if (!hasDiscountValue) {
              databaseInstance.run(
                "ALTER TABLE sales ADD COLUMN discount_amount REAL DEFAULT 0",
                (addErr) => {
                  if (!addErr)
                    console.log("Migration : discount_amount ajoutée à sales");
                },
              );
            }
          }
        });

        // Migration : Ajouter sale_id et sale_item_id à product_units
        databaseInstance.all("PRAGMA table_info(product_units)", (puErr, puCols) => {
          if (!puErr && puCols) {
            const hasSaleId = puCols.some((c) => c.name === "sale_id");
            const hasSaleItemId = puCols.some((c) => c.name === "sale_item_id");

            if (!hasSaleId) {
              databaseInstance.run(
                "ALTER TABLE product_units ADD COLUMN sale_id INTEGER",
                (addErr) => {
                  if (!addErr) console.log("Migration : sale_id ajoutée à product_units");
                },
              );
            }
            if (!hasSaleItemId) {
              databaseInstance.run(
                "ALTER TABLE product_units ADD COLUMN sale_item_id INTEGER",
                (addErr) => {
                  if (!addErr) console.log("Migration : sale_item_id ajoutée à product_units");
                },
              );
            }
          }
        });

        // (Obsolete) Previously we removed a UNIQUE constraint on an obsolete
        // product column. That column is no longer used; no action required here.
        // Créer un utilisateur admin par défaut si vide
        databaseInstance.get('SELECT * FROM users WHERE login = "admin"', [], (err, row) => {
          const crypto = require("crypto");
          const hash = crypto
            .createHash("sha256")
            .update("admin")
            .digest("hex");
          if (!row) {
            databaseInstance.run(
              "INSERT INTO users (name, login, hash, role, active) VALUES (?, ?, ?, ?, ?)",
              ["Administrateur", "admin", hash, "admin", 1],
            );
          } else {
            // On force la mise à jour au cas où le hash serait différent
            databaseInstance.run('UPDATE users SET hash = ? WHERE login = "admin"', [hash]);
          }
          console.log("Système d'accès synchronisé : admin / admin");

          // Initialiser les données de base si la table products est vide (première installation)
          databaseInstance.get("SELECT COUNT(*) as count FROM products", (errCount, rowCount) => {
            if (!errCount && rowCount && rowCount.count === 0) {
              const seedPath = app && app.isPackaged
                ? path.join(process.resourcesPath, "seed.sql")
                : path.join(__dirname, "../../../seed.sql");
                
              if (fs.existsSync(seedPath)) {
                const seedContent = fs.readFileSync(seedPath, "utf-8");
                databaseInstance.exec(seedContent, (errSeed) => {
                  if (errSeed) {
                    console.error("Erreur lors de l'exécution du seed:", errSeed.message);
                  } else {
                    console.log("Données de base (seed) importées avec succès.");
                  }
                  resolve(databaseInstance);
                });
              } else {
                console.warn("Fichier seed.sql introuvable, initialisation des données ignorée.", seedPath);
                resolve(databaseInstance);
              }
            } else {
              // La base de données contient déjà des produits ou erreur, on ne fait rien
              resolve(databaseInstance);
            }
          });
        });
      }
    });
  });
};

const productionDbPath = app
  ? path.join(app.getPath("appData"), "it-manager-desktop", "inventory.db")
  : path.join(__dirname, "../../temp_test_db", "inventory.db"); // Fallback for non-Electron env

const db = createDbConnection(productionDbPath);


module.exports = { createDbConnection, initDb, db, productionDbPath, schemaPath };
