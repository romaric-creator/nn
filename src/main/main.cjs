// src/main/main.cjs
// Point d'entrée principal Electron (Cameroun, architecture pro)

const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const { initDb, initDbConnection, schemaPath } = require("./db/database.cjs");

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
  const fs = require('fs');
  const { dbPath, getDb } = require("./db/database.cjs");
  const initMarker = path.join(app.getPath("userData"), "it-manager-desktop", ".initialized");

  // Logique de "Premier Démarrage" : si le marqueur n'existe pas, on repart à zéro
  // mais on garde une trace de l'ancienne base au cas où (backup).
  if (!fs.existsSync(initMarker)) {
    if (fs.existsSync(dbPath)) {
      const backupPath = dbPath + ".old_" + Date.now();
      fs.renameSync(dbPath, backupPath);
      console.log("Premier démarrage détecté. Ancienne base renommée en :", backupPath);
    }
    // Créer le marqueur pour les prochains démarrages
    const dir = path.dirname(initMarker);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(initMarker, new Date().toISOString());
  }

  // Initialize database connection FIRST
  initDbConnection();

  // Get the db instance for initDb
  const db = getDb();

  // Initialize database schema and migrations
  await initDb(db, schemaPath);

  // Automated Daily Backup
  const BackupService = require("./services/backupService.cjs");
  BackupService.autoBackup();

  // NOW load all IPC handlers (they can safely use db after initialization)
  require("./ipc/customer.cjs");
  require("./ipc/sale.cjs");
  require("./ipc/stock.cjs");
  require("./ipc/user.cjs");
  require("./ipc/backup.cjs");
  require("./ipc/db.cjs");
  require("./ipc/audit.cjs");
  require("./ipc/invoice.cjs");

  createWindow();
  // Menu natif minimal (exemple)
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
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
