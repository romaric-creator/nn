// src/main/main.cjs
// Point d'entrée principal Electron (Cameroun, architecture pro)

const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const fs = require('fs');
const logger = require('./services/loggingService.cjs');

// Import du module database SANS instancier la connexion tout de suite
const databaseModule = require("./db/database.cjs");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === "development") {
    // En mode développement, charger l'URL du serveur Vite
    win.loadURL("http://localhost:5173");
  } else {
    // En mode production, charger le fichier buildé
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

app.whenReady().then(async () => {
  try {
    const dbPath = databaseModule.dbPath;
    const initMarker = path.join(app.getPath("userData"), ".initialized");

    logger.info("Démarrage de l'application...");

    // --- ÉTAPE 1 : LOGIQUE DE MAINTENANCE (AVANT OUVERTURE DB) ---
    if (!fs.existsSync(initMarker)) {
      if (fs.existsSync(dbPath)) {
        const backupPath = dbPath + ".old_" + Date.now();
        try {
          // Ici le rename fonctionne car db n'est pas encore instancié
          fs.renameSync(dbPath, backupPath);
          logger.info("Premier démarrage : Ancienne base sauvegardée sous %s", backupPath);
        } catch (renameError) {
          logger.error("Erreur lors du renommage de la base :", renameError);
        }
      }
      
      // Créer le marqueur d'initialisation
      const dir = path.dirname(initMarker);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(initMarker, new Date().toISOString());
      logger.info("Marqueur d'initialisation créé.");
    }

    // --- ÉTAPE 2 : INITIALISATION DE LA BASE DE DONNÉES ---
    // Instancier la connexion DB après la maintenance des fichiers
    const db = databaseModule.initDbConnection();
    await databaseModule.initDb(db, databaseModule.schemaPath);
    logger.info("Base de données initialisée avec succès.");

    // --- ÉTAPE 3 : SERVICES SECONDAIRES ---
    const BackupService = require("./services/backupService.cjs");
    BackupService.autoBackup();
    logger.info("Service de sauvegarde automatique activé.");

    createWindow();
    logger.info("Fenêtre principale créée.");

    // Menu natif minimal
    const menu = Menu.buildFromTemplate([
      { label: "Fichier", submenu: [{ role: "quit", label: "Quitter" }] },
      { label: "Vente", submenu: [] },
      { label: "Stock", submenu: [] },
      { label: "Rapports", submenu: [] },
    ]);
    Menu.setApplicationMenu(menu);

    app.on("activate", function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

  } catch (fatalError) {
    logger.error("Erreur fatale au démarrage :", fatalError);
    process.exit(1);
  }
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// Enregistrement des IPC handlers
// (Vérifie qu'ils n'ouvrent pas la DB à l'import, sinon déplacer après initDbConnection())
require("./ipc/customer.cjs");
require("./ipc/sale.cjs");
require("./ipc/stock.cjs");
require("./ipc/user.cjs");
require("./ipc/backup.cjs");
require("./ipc/db.cjs");
require("./ipc/audit.cjs");
require("./ipc/invoice.cjs");

// Capture des erreurs non gérées
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
