const { ipcMain } = require("electron");
const BackupService = require("../services/backupService.cjs");

/**
 * Créer un backup manuelle
 */
ipcMain.handle("backup:create", async () => {
  return new Promise((resolve) => {
    BackupService.createBackup((err, result) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: result });
    });
  });
});

/**
 * Lister les backups disponibles
 */
ipcMain.handle("backup:list", async () => {
  return new Promise((resolve) => {
    BackupService.listBackups((err, backups) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: backups });
    });
  });
});

/**
 * Restaurer un backup
 */
ipcMain.handle("backup:restore", async (event, backupPath) => {
  return new Promise((resolve) => {
    BackupService.restoreBackup(backupPath, (err, result) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: result });
    });
  });
});

/**
 * Nettoyer les vieux backups
 */
ipcMain.handle("backup:cleanup", async (event, keepCount = 30) => {
  return new Promise((resolve) => {
    BackupService.cleanupOldBackups(keepCount, (err, result) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: result });
    });
  });
});
