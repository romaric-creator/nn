const { db } = require("../db/database.cjs");

const AuditService = {
  /**
   * Retourne une vue unifiée des événements d'audit :
   * - audit_logs (modifications produits, ventes, etc.)
   * - stock_movements (entrées/sorties de stock)
   * - user_logs (connexions/actions utilisateurs)
   */
  getAuditLogs: (limit = 300, callback) => {
    const sql = `
      SELECT
        al.timestamp,
        u.name         AS user_name,
        UPPER(al.action) AS action,
        al.entity,
        al.entity_id,
        al.old_value,
        al.new_value,
        NULL           AS reason,
        'audit'        AS log_type
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id

      UNION ALL

      SELECT
        sm.date        AS timestamp,
        u2.name        AS user_name,
        CASE
          WHEN sm.type = 'in'  THEN 'STOCK_IN'
          WHEN sm.type = 'out' THEN 'STOCK_OUT'
          ELSE UPPER(sm.type)
        END            AS action,
        'stock'        AS entity,
        sm.product_id  AS entity_id,
        NULL           AS old_value,
        json_object('quantity', sm.quantity, 'note', IFNULL(sm.note,'')) AS new_value,
        sm.note        AS reason,
        'stock'        AS log_type
      FROM stock_movements sm
      LEFT JOIN users u2 ON sm.user_id = u2.id

      UNION ALL

      SELECT
        ul.timestamp,
        u3.name        AS user_name,
        ul.action,
        'user'         AS entity,
        ul.user_id     AS entity_id,
        NULL           AS old_value,
        NULL           AS new_value,
        NULL           AS reason,
        'user'         AS log_type
      FROM user_logs ul
      JOIN users u3 ON ul.user_id = u3.id

      ORDER BY timestamp DESC
      LIMIT ?
    `;
    db.all(sql, [limit], callback);
  },

  /**
   * Insère une entrée dans audit_logs.
   * action doit être en MAJUSCULES (ex: 'UPDATE', 'CREATE', 'DELETE', 'CHECKOUT', 'CANCEL')
   */
  logAudit: (entity, entityId, action, userId, oldValue, newValue) => {
    const sql = `
      INSERT INTO audit_logs (entity, entity_id, action, user_id, old_value, new_value, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    db.run(sql, [entity, entityId, action.toUpperCase(), userId, oldValue, newValue], (err) => {
      if (err) console.error("Erreur audit_logs:", err.message);
    });
  },

  getUserLogs: (limit = 100, callback) => {
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
