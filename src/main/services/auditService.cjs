const { db } = require("../db/database.cjs");

const AuditService = {
  getAuditLogs: (limit = 10, callback) => {
    const sql = `
      SELECT al.*, u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.timestamp DESC
      LIMIT ?
    `;
    db.all(sql, [limit], callback);
  },
  logAudit: (entity, entityId, action, userId, oldValue, newValue) => {
    const sql = `
      INSERT INTO audit_logs (entity, entity_id, action, user_id, old_value, new_value, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    db.run(sql, [entity, entityId, action, userId, oldValue, newValue]);
  },
  getUserLogs: (limit = 10, callback) => {
    const sql = `
      SELECT ul.*, u.name as user_name
      FROM user_logs ul
      JOIN users u ON ul.user_id = u.id
      ORDER BY ul.timestamp DESC
      LIMIT ?
    `;
    db.all(sql, [limit], callback);
  }
};

module.exports = AuditService;
