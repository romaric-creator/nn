// src/main/main.cjs
// Point d'entrée principal Electron (Cameroun, architecture pro)

const electron = require("electron");
const app = electron.app || null;
const { BrowserWindow, ipcMain, Menu } = electron;
const path = require("path");
const { initDb, db, schemaPath } = require("./db/database.cjs");

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
  await initDb(db, schemaPath);
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

// Enregistrement des IPC handlers
require("./ipc/customer.cjs");
require("./ipc/sale.cjs");
require("./ipc/stock.cjs");
require("./ipc/user.cjs");
require("./ipc/backup.cjs");
require("./ipc/audit.cjs");
require("./ipc/invoice.cjs");
