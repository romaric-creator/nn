const { getDb } = require('../db/database.cjs');

const CustomerService = {
  addCustomer: (customer, callback) => {
    const sql = `INSERT INTO customers (name, phone) VALUES (?, ?)`;
    getDb().run(sql, [customer.name, customer.phone], callback);
  },
  getAllCustomers: (callback) => {
    getDb().all('SELECT * FROM customers ORDER BY name ASC', [], callback);
  },
  getCustomerById: (id, callback) => {
    getDb().get('SELECT * FROM customers WHERE id = ?', [id], callback);
  },
  getCustomerSales: (customer_id, callback) => {
    getDb().all(
      'SELECT * FROM sales WHERE customer_id = ? ORDER BY date DESC',
      [customer_id],
      callback,
    );
  },
  // BUG FIX: méthode manquante — Customers.tsx appelait customer:update mais
  // le service n'avait pas cette méthode → mise à jour silencieusement ignorée
  updateCustomer: (id, customer, callback) => {
    const sql = `UPDATE customers SET name = ?, phone = ? WHERE id = ?`;
    getDb().run(sql, [customer.name, customer.phone, id], callback);
  },
  // BUG FIX: méthode manquante — Customers.tsx appelait customer:delete mais
  // le service n'avait pas cette méthode → suppression silencieusement ignorée
  deleteCustomer: (id, callback) => {
    getDb().run('DELETE FROM customers WHERE id = ?', [id], callback);
  },
};

module.exports = CustomerService;
