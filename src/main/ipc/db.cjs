const { ipcMain } = require("electron");
const { db } = require("../db/database.cjs");

ipcMain.handle("db:status", async () => {
  return new Promise((resolve) => {
    db.get("PRAGMA integrity_check;", (err, row) => {
      if (err) {
        resolve({ success: false, message: err.message });
      } else {
        const result = row && row.integrity_check ? String(row.integrity_check).toLowerCase() : "unknown";
        resolve({ success: true, status: result });
      }
    });
  });
});

module.exports = {};
