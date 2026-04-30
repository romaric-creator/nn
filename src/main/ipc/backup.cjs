const { ipcMain, dialog, app } = require('electron');
const fs = require('fs');
const path = require('path');
const { db, dbPath } = require('../db/database.cjs');

ipcMain.handle('db:backup', async (event) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Sauvegarder la base de données',
    defaultPath: path.join(app.getPath('downloads'), `backup_fely_stock_${new Date().toISOString().split('T')[0]}.db`),
    filters: [
      { name: 'SQLite Database', extensions: ['db'] }
    ]
  });

  if (filePath) {
    try {
      // Ensure the database is flushed if possible (SQLite handled by fs.copyFileSync usually works if not busy)
      fs.copyFileSync(dbPath, filePath);
      return { success: true, message: 'Sauvegarde réussie vers : ' + filePath };
    } catch (err) {
      return { success: false, message: 'Erreur lors de la sauvegarde : ' + err.message };
    }
  }
  return { success: false, message: 'Sauvegarde annulée' };
});

ipcMain.handle('db:restore', async (event) => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Restaurer la base de données',
    filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    properties: ['openFile']
  });

  if (filePaths && filePaths.length > 0) {
    const backupPath = filePaths[0];
    
    const { response } = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Annuler', 'Confirmer la restauration'],
      title: 'Confirmation de restauration',
      message: 'Attention : La base de données actuelle sera remplacée par cette sauvegarde. L\'application va redémarrer après l\'opération.',
      detail: 'Assurez-vous d\'avoir une sauvegarde de vos données actuelles si nécessaire.'
    });

    if (response === 1) {
      try {
        // 1. Close the database connection
        db.close((err) => {
          if (err) {
            console.error('Erreur fermeture DB pour restauration:', err.message);
          }
          
          // 2. Replace the file
          fs.copyFileSync(backupPath, dbPath);
          
          // 3. Relaunch the app
          app.relaunch();
          app.exit(0);
        });
        return { success: true, message: 'Restauration en cours...' };
      } catch (err) {
        return { success: false, message: 'Erreur lors de la restauration : ' + err.message };
      }
    }
  }
  return { success: false, message: 'Restauration annulée' };
});

ipcMain.handle('db:export-sql', async (event) => {
  return { success: false, message: 'Fonctionnalité export SQL en cours de développement. Utilisez la sauvegarde .db pour l\'instant.' };
});
