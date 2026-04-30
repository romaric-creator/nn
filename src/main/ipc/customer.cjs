const { ipcMain } = require('electron');
const CustomerService = require('../services/customerService.cjs');

ipcMain.handle('customer:add', async (event, customer) => {
  return new Promise((resolve) => {
    CustomerService.addCustomer(customer, (err) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true });
    });
  });
});

ipcMain.handle('customer:getAll', async () => {
  return new Promise((resolve) => {
    CustomerService.getAllCustomers((err, rows) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: rows });
    });
  });
});

ipcMain.handle('customer:getById', async (event, id) => {
  return new Promise((resolve) => {
    CustomerService.getCustomerById(id, (err, row) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: row });
    });
  });
});

ipcMain.handle('customer:getSales', async (event, customer_id) => {
  return new Promise((resolve) => {
    CustomerService.getCustomerSales(customer_id, (err, rows) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: rows });
    });
  });
});

// BUG FIX: handler manquant — Customers.tsx appelle customer:update
// mais ce handler n'était pas enregistré → l'édition d'un client ne faisait rien
ipcMain.handle('customer:update', async (event, id, customer) => {
  return new Promise((resolve) => {
    CustomerService.updateCustomer(id, customer, (err) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true });
    });
  });
});

// BUG FIX: handler manquant — Customers.tsx appelle customer:delete
// mais ce handler n'était pas enregistré → la suppression d'un client ne faisait rien
ipcMain.handle('customer:delete', async (event, id) => {
  return new Promise((resolve) => {
    CustomerService.deleteCustomer(id, (err) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true });
    });
  });
});
