const { expect } = require("chai");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3");

const testDbPath = path.join(__dirname, "../../test-stock.db");
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

const db = new sqlite3.Database(testDbPath);

describe("StockService Unit Tests", function () {
  this.timeout(5000);

  before((done) => {
    db.serialize(() => {
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
          category TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(
        `
        CREATE TABLE IF NOT EXISTS stock_movements (
          id INTEGER PRIMARY KEY,
          product_id INTEGER NOT NULL,
          type TEXT,
          quantity INTEGER,
          reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(product_id) REFERENCES products(id)
        )
      `,
        done,
      );
    });
  });

  after((done) => {
    db.close(() => {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
      done();
    });
  });

  describe("addProduct", () => {
    it("should add a new product", function (done) {
      db.run(
        `INSERT INTO products (code, brand, model, sale_price, quantity, category)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["TEST-001", "Samsung", "A50", 150000, 5, "Phones"],
        function (err) {
          expect(err).to.be.null;
          expect(this.lastID).to.be.greaterThan(0);
          done();
        },
      );
    });

    it("should reject duplicate product code", function (done) {
      db.run(
        `INSERT INTO products (code, brand, model, sale_price, quantity, category)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["UNIQUE-CODE", "Apple", "iPhone", 200000, 3, "Phones"],
        () => {
          db.run(
            `INSERT INTO products (code, brand, model, sale_price, quantity, category)
             VALUES (?, ?, ?, ?, ?, ?)`,
            ["UNIQUE-CODE", "Apple", "iPhone 2", 200000, 2, "Phones"],
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

  describe("getProduct", () => {
    let productId;

    before((done) => {
      db.run(
        `INSERT INTO products (code, brand, model, sale_price, quantity, category)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["GET-001", "Xiaomi", "Redmi", 100000, 8, "Phones"],
        function () {
          productId = this.lastID;
          done();
        },
      );
    });

    it("should retrieve product by ID", function (done) {
      db.get("SELECT * FROM products WHERE id = ?", [productId], (err, row) => {
        expect(err).to.be.null;
        expect(row).to.exist;
        expect(row.brand).to.equal("Xiaomi");
        expect(row.quantity).to.equal(8);
        done();
      });
    });

    it("should return null for non-existent product", function (done) {
      db.get("SELECT * FROM products WHERE id = ?", [99999], (err, row) => {
        expect(err).to.be.null;
        expect(row).to.be.undefined;
        done();
      });
    });
  });

  describe("getAllProducts", () => {
    it("should retrieve all products", function (done) {
      db.all(
        "SELECT * FROM products ORDER BY created_at DESC",
        [],
        (err, rows) => {
          expect(err).to.be.null;
          expect(rows).to.be.an("array");
          expect(rows.length).to.be.greaterThan(0);
          done();
        },
      );
    });
  });

  describe("updateProduct", () => {
    let productId;

    before((done) => {
      db.run(
        `INSERT INTO products (code, brand, model, sale_price, quantity, category)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["UPDATE-001", "OnePlus", "9", 180000, 4, "Phones"],
        function () {
          productId = this.lastID;
          done();
        },
      );
    });

    it("should update product quantity", function (done) {
      db.run(
        "UPDATE products SET quantity = ? WHERE id = ?",
        [7, productId],
        function (err) {
          expect(err).to.be.null;
          expect(this.changes).to.equal(1);

          db.get(
            "SELECT * FROM products WHERE id = ?",
            [productId],
            (err, row) => {
              expect(row.quantity).to.equal(7);
              done();
            },
          );
        },
      );
    });

    it("should update product sale price", function (done) {
      db.run(
        "UPDATE products SET sale_price = ? WHERE id = ?",
        [190000, productId],
        function (err) {
          expect(err).to.be.null;

          db.get(
            "SELECT * FROM products WHERE id = ?",
            [productId],
            (err, row) => {
              expect(row.sale_price).to.equal(190000);
              done();
            },
          );
        },
      );
    });
  });

  describe("stockMovements", () => {
    let productId;

    before((done) => {
      db.run(
        `INSERT INTO products (code, brand, model, sale_price, quantity, category)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["MOVE-001", "Google", "Pixel", 120000, 10, "Phones"],
        function () {
          productId = this.lastID;
          done();
        },
      );
    });

    it("should record stock movement when item is sold", function (done) {
      db.run(
        `INSERT INTO stock_movements (product_id, type, quantity, reason)
         VALUES (?, ?, ?, ?)`,
        [productId, "sale", -2, "Sold to customer"],
        function (err) {
          expect(err).to.be.null;
          expect(this.lastID).to.be.greaterThan(0);
          done();
        },
      );
    });

    it("should record stock movement when items are received", function (done) {
      db.run(
        `INSERT INTO stock_movements (product_id, type, quantity, reason)
         VALUES (?, ?, ?, ?)`,
        [productId, "receive", 5, "Stock replenishment"],
        function (err) {
          expect(err).to.be.null;

          db.all(
            `SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at`,
            [productId],
            (err, rows) => {
              expect(rows.length).to.equal(2);
              expect(rows[0].type).to.equal("sale");
              expect(rows[1].type).to.equal("receive");
              done();
            },
          );
        },
      );
    });
  });

  describe("deleteProduct", () => {
    let productId;

    before((done) => {
      db.run(
        `INSERT INTO products (code, brand, model, sale_price, quantity, category)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["DELETE-001", "Nokia", "105", 50000, 2, "Phones"],
        function () {
          productId = this.lastID;
          done();
        },
      );
    });

    it("should delete a product", function (done) {
      db.run("DELETE FROM products WHERE id = ?", [productId], function (err) {
        expect(err).to.be.null;
        expect(this.changes).to.equal(1);

        db.get(
          "SELECT * FROM products WHERE id = ?",
          [productId],
          (err, row) => {
            expect(row).to.be.undefined;
            done();
          },
        );
      });
    });
  });
});
