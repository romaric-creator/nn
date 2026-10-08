const { ipcMain } = require("electron");
const InvoiceService = require("../services/invoiceService.cjs");

/**
 * Génère le HTML de la facture (prêt pour PDF print)
 */
ipcMain.handle("invoice:generateHTML", async (event, invoiceId) => {
  return new Promise((resolve) => {
    InvoiceService.getInvoiceById(invoiceId, (getErr, invoiceData) => {
      if (getErr) return resolve({ success: false, message: getErr.message });

      InvoiceService.generateInvoiceHTML(invoiceData, (genErr, html) => {
        if (genErr) resolve({ success: false, message: genErr.message });
        else
          resolve({
            success: true,
            data: { html, invoiceNumber: invoiceData.invoice_number },
          });
      });
    });
  });
});

/**
 * Récupère une facture complète par ID
 */
ipcMain.handle("invoice:getById", async (event, invoiceId) => {
  return new Promise((resolve) => {
    InvoiceService.getInvoiceById(invoiceId, (err, data) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data });
    });
  });
});

/**
 * Liste toutes les factures
 */
ipcMain.handle("invoice:getAll", async () => {
  return new Promise((resolve) => {
    InvoiceService.getInvoices((err, data) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data });
    });
  });
});

/**
 * Récupère les factures d'un client spécifique
 */
ipcMain.handle("invoice:getByCustomerId", async (event, customerId) => {
  return new Promise((resolve) => {
    InvoiceService.getInvoicesByCustomerId(customerId, (err, data) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data });
    });
  });
});
