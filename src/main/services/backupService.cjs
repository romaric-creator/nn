const fs = require("fs");
const path = require("path");
const { db, dbPath } = require("../db/database.cjs");
const logger = require("./loggingService.cjs");

const BackupService = {
  /**
   * Crée un backup complet de la DB
   * Stocké dans : ~/.config/it-manager-desktop/backups/
   */
  createBackup: (callback) => {
    try {
      const backupDir = path.join(path.dirname(dbPath), "backups");

      // Créer dossier backups s'il n'existe pas
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Nom du backup : backup_YYYY_MM_DD_HH_MM_SS.db
      const now = new Date();
      const timestamp = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}_${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}_${String(now.getMinutes()).padStart(2, "0")}_${String(now.getSeconds()).padStart(2, "0")}`;
      const backupPath = path.join(backupDir, `backup_${timestamp}.db`);

      // Copier le fichier DB
      fs.copyFileSync(dbPath, backupPath);

      logger.info("Backup DB créé", {
        backupPath,
        size: fs.statSync(backupPath).size,
      });
      callback(null, { success: true, path: backupPath, timestamp });
    } catch (err) {
      logger.error("Erreur création backup", { error: err.message });
      callback(err);
    }
  },

  /**
   * Liste tous les backups disponibles
   */
  listBackups: (callback) => {
    try {
      const backupDir = path.join(path.dirname(dbPath), "backups");

      if (!fs.existsSync(backupDir)) {
        return callback(null, []);
      }

      const backups = fs
        .readdirSync(backupDir)
        .filter((f) => f.startsWith("backup_") && f.endsWith(".db"))
        .map((f) => ({
          name: f,
          path: path.join(backupDir, f),
          size: fs.statSync(path.join(backupDir, f)).size,
          date: fs.statSync(path.join(backupDir, f)).mtime,
        }))
        .sort((a, b) => b.date - a.date);

      callback(null, backups);
    } catch (err) {
      logger.error("Erreur lecture backups", { error: err.message });
      callback(err);
    }
  },

  /**
   * Restaure un backup
   * ATTENTION: remplace la DB actuelle!
   */
  restoreBackup: (backupPath, callback) => {
    try {
      // Vérifier que le fichier existe
      if (!fs.existsSync(backupPath)) {
        return callback(new Error("Backup non trouvé"));
      }

      // Créer un backup de sécurité avant restauration
      const safetyBackup = path.join(
        path.dirname(dbPath),
        "backups",
        `safety_before_restore_${Date.now()}.db`,
      );

      if (!fs.existsSync(path.dirname(safetyBackup))) {
        fs.mkdirSync(path.dirname(safetyBackup), { recursive: true });
      }

      fs.copyFileSync(dbPath, safetyBackup);

      // Fermer la DB actuelle
      db.close((closeErr) => {
        if (closeErr) {
          logger.error("Erreur fermeture DB avant restore", {
            error: closeErr.message,
          });
          return callback(closeErr);
        }

        // Remplacer la DB
        fs.copyFileSync(backupPath, dbPath);

        // Rouvrir la DB
        const sqlite3 = require("sqlite3").verbose();
        const newDb = new sqlite3.Database(dbPath, (openErr) => {
          if (openErr) {
            logger.error("Erreur réouverture DB après restore", {
              error: openErr.message,
            });
            return callback(openErr);
          }

          logger.warn("DB restaurée depuis backup", {
            backupPath,
            safetyBackup,
          });
          callback(null, { success: true, safetyBackup });
        });
      });
    } catch (err) {
      logger.error("Erreur restauration backup", { error: err.message });
      callback(err);
    }
  },

  /**
   * Supprime les anciens backups (garde les N derniers)
   */
  cleanupOldBackups: (keepCount = 10, callback) => {
    try {
      const backupDir = path.join(path.dirname(dbPath), "backups");

      if (!fs.existsSync(backupDir)) {
        return callback(null, { deleted: 0 });
      }

      const backups = fs
        .readdirSync(backupDir)
        .filter((f) => f.startsWith("backup_") && f.endsWith(".db"))
        .map((f) => ({
          name: f,
          path: path.join(backupDir, f),
          time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      let deleted = 0;

      // Supprimer les anciens
      for (let i = keepCount; i < backups.length; i++) {
        fs.unlinkSync(backups[i].path);
        deleted++;
      }

      logger.info("Cleanup anciens backups", {
        deleted,
        kept: Math.min(keepCount, backups.length),
      });
      callback(null, { deleted, kept: Math.min(keepCount, backups.length) });
    } catch (err) {
      logger.error("Erreur cleanup backups", { error: err.message });
      callback(err);
    }
  },

  /**
   * Backup automatique quotidien (à appeler au démarrage)
   */
  setupDailyBackup: () => {
    // Backup au démarrage
    BackupService.createBackup((err) => {
      if (err) {
        logger.error("Backup démarrage échoué", { error: err.message });
      } else {
        logger.info("Backup démarrage réussi");
      }

      // Cleanup des vieux backups
      BackupService.cleanupOldBackups(30, (cleanErr) => {
        if (cleanErr) {
          logger.error("Cleanup backups échoué", { error: cleanErr.message });
        }
      });
    });

    // Backup quotidien à 2h du matin
    const scheduleDaily = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(2, 0, 0, 0);

      // Si l'heure est déjà passée, le faire demain
      if (now > target) {
        target.setDate(target.getDate() + 1);
      }

      const delay = target.getTime() - now.getTime();

      setTimeout(() => {
        BackupService.createBackup((err) => {
          if (err) {
            logger.error("Backup quotidien échoué", { error: err.message });
          } else {
            logger.info("Backup quotidien réussi");
          }

          // Cleanup tous les 7 backups (env 1 semaine)
          BackupService.cleanupOldBackups(30, () => {});

          // Reschedule pour demain
          scheduleDaily();
        });
      }, delay);
    };

    scheduleDaily();
  },
};

module.exports = BackupService;
