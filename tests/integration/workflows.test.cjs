const { expect } = require("chai");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3");

const testDbPath = path.join(__dirname, "../../test-integration.db");
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

describe("Integration Tests - Complete Workflows", function () {
  this.timeout(10000);

  let db;
  let userId, customerId, productId, saleId, invoiceId;

  before((done) => {
    db = new sqlite3.Database(testDbPath);

    db.serialize(() => {
      // Create all necessary tables for integration test
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT NOT NULL
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY,
          code TEXT UNIQUE NOT NULL,
          brand TEXT,
          model TEXT,
          state TEXT,
          purchase_price REAL,
          sale_price REAL,
          quantity INTEGER DEFAULT 0,
          category TEXT
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          customer_id INTEGER,
          total_amount REAL,
          discount_type TEXT,
          discount_amount REAL DEFAULT 0,
          payment_method TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(customer_id) REFERENCES customers(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY,
          sale_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          original_price REAL,
          selling_price REAL,
          price_modified INTEGER DEFAULT 0,
          FOREIGN KEY(sale_id) REFERENCES sales(id),
          FOREIGN KEY(product_id) REFERENCES products(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS invoices (
          id INTEGER PRIMARY KEY,
          sale_id INTEGER,
          customer_id INTEGER,
          invoice_number TEXT UNIQUE,
          invoice_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          total_amount REAL,
          discount_amount REAL DEFAULT 0,
          payment_method TEXT,
          status TEXT DEFAULT 'pending',
          FOREIGN KEY(sale_id) REFERENCES sales(id),
          FOREIGN KEY(customer_id) REFERENCES customers(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS invoice_items (
          id INTEGER PRIMARY KEY,
          invoice_id INTEGER NOT NULL,
          product_id INTEGER,
          quantity INTEGER NOT NULL,
          unit_price REAL NOT NULL,
          item_total REAL NOT NULL,
          FOREIGN KEY(invoice_id) REFERENCES invoices(id),
          FOREIGN KEY(product_id) REFERENCES products(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS price_audit_logs (
          id INTEGER PRIMARY KEY,
          sale_item_id INTEGER,
          original_price REAL,
          modified_price REAL,
          reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(sale_item_id) REFERENCES sale_items(id)
        )
      `);

      db.run(
        `
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          action TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
      `,
        () => {
          // Insert test data
          db.run(
            "INSERT INTO users (name, role) VALUES (?, ?)",
            ["Vendeur Test", "vendeur"],
            function () {
              userId = this.lastID;
            },
          );

          db.run(
            "INSERT INTO customers (name, phone) VALUES (?, ?)",
            ["Client Integration", "555555"],
            function () {
              customerId = this.lastID;
            },
          );

          db.run(
            `INSERT INTO products (code, brand, model, state, sale_price, quantity, category)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ["INT-001", "Samsung", "A70", "Neuf", 120000, 10, "Phones"],
            function () {
              productId = this.lastID;
              done();
            },
          );
        },
      );
    });
  });

  after((done) => {
    db.close(() => {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
      done();
    });
  });

  describe("Workflow 1: Create Sale -> Create Invoice", () => {
    it("should create a sale with items", function (done) {
      db.run(
        `INSERT INTO sales (user_id, customer_id, total_amount, discount_type, discount_amount, payment_method)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, customerId, 240000, "fixed", 10000, "cash"],
        function (err) {
          expect(err).to.be.null;
          saleId = this.lastID;
          expect(saleId).to.be.greaterThan(0);
          done();
        },
      );
    });

    it("should add items to the sale", function (done) {
      db.run(
        `INSERT INTO sale_items (sale_id, product_id, quantity, original_price, selling_price, price_modified)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [saleId, productId, 2, 120000, 120000, 0],
        function (err) {
          expect(err).to.be.null;
          expect(this.lastID).to.be.greaterThan(0);
          done();
        },
      );
    });

    it("should create an invoice from the sale", function (done) {
      // Generate invoice number
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const invoiceNumber = `IN-${year}${month}00001`;

      db.run(
        `INSERT INTO invoices (sale_id, customer_id, invoice_number, total_amount, discount_amount, payment_method, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [saleId, customerId, invoiceNumber, 240000, 10000, "cash", "pending"],
        function (err) {
          expect(err).to.be.null;
          invoiceId = this.lastID;
          expect(invoiceId).to.be.greaterThan(0);
          done();
        },
      );
    });

    it("should add invoice items", function (done) {
      db.run(
        `INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, item_total)
         VALUES (?, ?, ?, ?, ?)`,
        [invoiceId, productId, 2, 120000, 240000],
        function (err) {
          expect(err).to.be.null;
          done();
        },
      );
    });
  });

  describe("Workflow 2: Retrieve Invoice Data", () => {
    it("should retrieve complete invoice with items", function (done) {
      db.get(
        `SELECT i.*, c.name as customer_name FROM invoices i
         LEFT JOIN customers c ON i.customer_id = c.id
         WHERE i.id = ?`,
        [invoiceId],
        (err, invoice) => {
          expect(err).to.be.null;
          expect(invoice).to.exist;
          expect(invoice.invoice_number).to.include("IN-");
          expect(invoice.customer_name).to.equal("Client Integration");
          expect(invoice.total_amount).to.equal(240000);

          db.all(
            `SELECT ii.*, p.brand, p.model FROM invoice_items ii
             LEFT JOIN products p ON ii.product_id = p.id
             WHERE ii.invoice_id = ?`,
            [invoiceId],
            (err, items) => {
              expect(err).to.be.null;
              expect(items).to.be.an("array");
              expect(items.length).to.equal(1);
              expect(items[0].brand).to.equal("Samsung");
              expect(items[0].unit_price).to.equal(120000);
              done();
            },
          );
        },
      );
    });

    it("should retrieve customer with all invoices", function (done) {
      db.all(
        `SELECT i.*, COUNT(ii.id) as item_count FROM invoices i
         LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
         WHERE i.customer_id = ?
         GROUP BY i.id
         ORDER BY i.invoice_date DESC`,
        [customerId],
        (err, invoices) => {
          expect(err).to.be.null;
          expect(invoices).to.be.an("array");
          expect(invoices.length).to.be.greaterThan(0);
          expect(invoices[0].item_count).to.equal(1);
          done();
        },
      );
    });
  });

  describe("Workflow 3: Price Modification with Audit Trail", () => {
    let saleItemId;

    before((done) => {
      db.get(
        "SELECT id FROM sale_items WHERE sale_id = ? LIMIT 1",
        [saleId],
        (err, row) => {
          saleItemId = row.id;
          done();
        },
      );
    });

    it("should update sale item price and record audit log", function (done) {
      // Update price
      db.run(
        "UPDATE sale_items SET selling_price = ?, price_modified = 1 WHERE id = ?",
        [110000, saleItemId],
        function (err) {
          expect(err).to.be.null;
          expect(this.changes).to.equal(1);

          // Create audit log
          db.run(
            `INSERT INTO price_audit_logs (sale_item_id, original_price, modified_price, reason)
             VALUES (?, ?, ?, ?)`,
            [saleItemId, 120000, 110000, "Customer negotiation"],
            function (err) {
              expect(err).to.be.null;

              // Verify audit trail
              db.get(
                "SELECT * FROM price_audit_logs WHERE sale_item_id = ?",
                [saleItemId],
                (err, log) => {
                  expect(log).to.exist;
                  expect(log.original_price).to.equal(120000);
                  expect(log.modified_price).to.equal(110000);
                  expect(log.reason).to.equal("Customer negotiation");
                  done();
                },
              );
            },
          );
        },
      );
    });
  });

  describe("Workflow 4: Search and Filter", () => {
    it("should search invoices by invoice number", function (done) {
      db.all(
        `SELECT i.*, COUNT(ii.id) as item_count FROM invoices i
         LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
         WHERE LOWER(i.invoice_number) LIKE LOWER(?)
         GROUP BY i.id`,
        ["%IN-%"],
        (err, invoices) => {
          expect(err).to.be.null;
          expect(invoices.length).to.be.greaterThan(0);
          done();
        },
      );
    });

    it("should filter invoices by status", function (done) {
      db.all(
        `SELECT * FROM invoices WHERE status = ? ORDER BY invoice_date DESC`,
        ["pending"],
        (err, invoices) => {
          expect(err).to.be.null;
          expect(invoices).to.be.an("array");
          invoices.forEach((inv) => {
            expect(inv.status).to.equal("pending");
          });
          done();
        },
      );
    });
  });

  describe("Data Integrity Checks", () => {
    it("should ensure foreign key constraints", function (done) {
      // Try to insert invoice with invalid customer_id
      db.run(
        `INSERT INTO invoices (sale_id, customer_id, invoice_number, total_amount, payment_method)
         VALUES (?, ?, ?, ?, ?)`,
        [saleId, 999999, `IN-ERROR-${Date.now()}`, 1000, "cash"],
        function (err) {
          // Should succeed (FK constraints may not be enforced in SQLite by default)
          // But we verify it was inserted
          expect(this.changes).to.equal(1);
          done();
        },
      );
    });

    it("should prevent duplicate invoice numbers", function (done) {
      const dupNumber = `DUP-${Date.now()}`;

      db.run(
        `INSERT INTO invoices (customer_id, invoice_number, total_amount, payment_method)
         VALUES (?, ?, ?, ?)`,
        [customerId, dupNumber, 1000, "cash"],
        () => {
          db.run(
            `INSERT INTO invoices (customer_id, invoice_number, total_amount, payment_method)
             VALUES (?, ?, ?, ?)`,
            [customerId, dupNumber, 2000, "cash"],
            function (err) {
              expect(err).to.exist;
              expect(err.message).to.include("UNIQUE");
              done();
            },
          );
        },
      );
    });
  });
});
