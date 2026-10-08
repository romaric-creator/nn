const { expect } = require("chai");
const { setupTestDb, teardownTestDb } = require("../testSetup.cjs");
const SaleService = require("../../src/main/services/saleService.cjs");

let userId, customerId, productId;
let testDb = null;

describe("SaleService Unit Tests", function () {
  this.timeout(5000);

  beforeEach(async () => {
    testDb = await setupTestDb(); // Setup a fresh DB for each test

    // Insert test data into the fresh DB
    await new Promise((resolve, reject) => {
      testDb.get(
        "SELECT id FROM users WHERE login = 'admin'",
        [],
        (err, row) => {
          if (err) return reject(err);
          userId = row.id;
          resolve();
        },
      );
    });
    await new Promise((resolve, reject) => {
      testDb.run(
        "INSERT INTO customers (name, phone) VALUES (?, ?)",
        ["Test Client", "123456"],
        function (err) {
          if (err) return reject(err);
          customerId = this.lastID;
          resolve();
        },
      );
    });
    await new Promise((resolve, reject) => {
      testDb.run(
        "INSERT INTO products (category, brand, model, state, sale_price, stock) VALUES (?, ?, ?, ?, ?, ?)",
        ["Category", "Brand", "Model", "new", 1000, 10],
        function (err) {
          if (err) return reject(err);
          productId = this.lastID;
          resolve();
        },
      );
    });
  });

  afterEach(async () => {
    await teardownTestDb(); // Clean up the DB after each test
  });

  describe("createSale", () => {
    it("should create a sale with items and update stock", async () => {
      const saleData = {
        user_id: userId,
        customer_id: customerId,
        items: [
          {
            product_id: productId,
            quantity: 2,
            selling_price: 1000,
            original_price: 1000,
            price_modified: false,
          },
        ],
        discount_type: "fixed",
        discount_amount: 100,
        payment_method: "cash",
      };

      const saleId = await SaleService.createSale(saleData, saleData.items);
      expect(saleId).to.be.a("number");
      expect(saleId).to.be.greaterThan(0);

      // Verify stock update
      const product = await new Promise((resolve, reject) => {
        testDb.get(
          "SELECT stock FROM products WHERE id = ?",
          [productId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          },
        );
      });
      expect(product.stock).to.equal(8); // Original stock 10 - 2 sold
    });

    it("should rollback if stock is insufficient", async () => {
      const saleData = {
        user_id: userId,
        customer_id: customerId,
        items: [
          {
            product_id: productId,
            quantity: 15, // More than available stock (10)
            selling_price: 1000,
            original_price: 1000,
            price_modified: false,
          },
        ],
        discount_type: "fixed",
        discount_amount: 100,
        payment_method: "cash",
      };

      try {
        await SaleService.createSale(saleData, saleData.items);
        expect.fail("Sale should not have been created with insufficient stock");
      } catch (error) {
        expect(error.message).to.include("Stock insuffisant");
      }

      // Verify stock was not updated
      const product = await new Promise((resolve, reject) => {
        testDb.get(
          "SELECT stock FROM products WHERE id = ?",
          [productId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          },
        );
      });
      expect(product.stock).to.equal(10); // Stock should remain unchanged
    });
  });

  describe("getSales", () => {
    it("should return an array of sales", function (done) {
      SaleService.getSales((err, sales) => {
        expect(err).to.be.null;
        expect(sales).to.be.an("array");
        done();
      });
    });
  });
});