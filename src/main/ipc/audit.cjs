const { ipcMain } = require("electron");
const AuditService = require("../services/auditService.cjs");

ipcMain.handle("audit:getLogs", async (event, limit) => {
  return new Promise((resolve) => {
    AuditService.getAuditLogs(limit, (err, rows) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: rows });
    });
  });
});

ipcMain.handle("audit:getUserLogs", async (event, limit) => {
  return new Promise((resolve) => {
    AuditService.getUserLogs(limit, (err, rows) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: rows });
    });
  });
});
