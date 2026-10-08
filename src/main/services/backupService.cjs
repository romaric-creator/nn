const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { dbPath } = require('../db/database.cjs');

const BackupService = {
  autoBackup: () => {
    try {
      const backupDir = path.join(app.getPath('appData'), 'it-manager-desktop', 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const backupFile = path.join(backupDir, `auto_backup_${dateStr}.db`);

      // Only backup once a day
      if (!fs.existsSync(backupFile)) {
        fs.copyFileSync(dbPath, backupFile);
        console.log('Automated Daily Backup created:', backupFile);
        
        // Cleanup old backups (keep last 7 days)
        const files = fs.readdirSync(backupDir);
        if (files.length > 7) {
          files.sort().slice(0, files.length - 7).forEach(f => {
            fs.unlinkSync(path.join(backupDir, f));
          });
        }
      }
    } catch (err) {
      console.error('Automated Backup Failed:', err.message);
    }
  }
};

module.exports = BackupService;
