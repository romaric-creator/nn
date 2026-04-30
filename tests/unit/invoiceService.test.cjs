const { expect } = require("chai");
const { setupTestDb, teardownTestDb } = require("../testSetup.cjs");

let InvoiceService;
let CustomerService;
let SaleService;
let StockService;

let testDb = null;
let userId, customerId, productId, saleId;

describe("InvoiceService Unit Tests", function () {
  this.timeout(5000);

  before(async () => {
    InvoiceService = require("../../src/main/services/invoiceService.cjs");
    CustomerService = require("../../src/main/services/customerService.cjs");
    SaleService = require("../../src/main/services/saleService.cjs");
    StockService = require("../../src/main/services/stockService.cjs");
  });

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

    // Create a sale to be used for invoice creation
    const saleData = {
      user_id: userId,
      customer_id: customerId,
      items: [
        {
          product_id: productId,
          quantity: 1,
          selling_price: 1000,
          original_price: 1000,
          price_modified: false,
        },
      ],
      discount_type: "fixed",
      discount_amount: 0,
      payment_method: "cash",
    };
    saleId = await SaleService.createSale(saleData, saleData.items);
  });

  afterEach(async () => {
    await teardownTestDb(); // Clean up the DB after each test
  });

  describe("generateInvoiceNumber", () => {
    it("should generate a unique invoice number in format IN-YYYYMM00001", (done) => {
      InvoiceService.generateInvoiceNumber((err, number) => {
        expect(err).to.be.null;
        expect(number).to.match(/^IN-\d{6}\d{5}$/);
        done();
      });
    });

    it("should generate incremental numbers on subsequent calls", (done) => {
      InvoiceService.generateInvoiceNumber((err, num1) => {
        expect(err).to.be.null;
        InvoiceService.generateInvoiceNumber((err, num2) => {
          expect(err).to.be.null;
          expect(num1).to.not.equal(num2);
          done();
        });
      });
    });
  });

  describe("createInvoiceFromSale", () => {
    it("should create an invoice from a sale", async () => {
      const invoice = await InvoiceService.createInvoiceFromSale(saleId);
      expect(invoice).to.be.an("object");
      expect(invoice.id).to.be.a("number");
      expect(invoice.invoiceNumber).to.match(/^IN-\d{6}\d{5}$/);
      expect(invoice.sale.id).to.equal(saleId);
      expect(invoice.items).to.be.an("array").and.to.have.lengthOf(1);

      // Verify invoice in DB
      const savedInvoice = await new Promise((resolve, reject) => {
        testDb.get(
          "SELECT * FROM invoices WHERE id = ?",
          [invoice.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          },
        );
      });
      expect(savedInvoice).to.exist;
      expect(savedInvoice.sale_id).to.equal(saleId);
    });

    it("should rollback if an error occurs during item insertion", async () => {
      // Simulate an error by trying to insert an item with a non-existent product_id
      const invalidSaleId = saleId + 1; // Use a saleId that won't exist after rollback
      try {
        await InvoiceService.createInvoiceFromSale(invalidSaleId);
        expect.fail("Invoice creation should have failed and rolled back");
      } catch (error) {
        expect(error.message).to.include("Vente non trouvée");
      }

      // Verify no invoice was created
      const invoices = await new Promise((resolve, reject) => {
        testDb.all("SELECT * FROM invoices", [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      expect(invoices).to.have.lengthOf(0);
    });
  });

  describe("getInvoiceById", () => {
    it("should retrieve an invoice by its ID with items", async () => {
      const createdInvoice = await InvoiceService.createInvoiceFromSale(saleId);
      const retrievedInvoice = await new Promise((resolve, reject) => {
        InvoiceService.getInvoiceById(createdInvoice.id, (err, invoice) => {
          if (err) reject(err);
          else resolve(invoice);
        });
      });

      expect(retrievedInvoice).to.be.an("object");
      expect(retrievedInvoice.id).to.equal(createdInvoice.id);
      expect(retrievedInvoice.items).to.be.an("array").and.to.have.lengthOf(1);
      expect(retrievedInvoice.items[0].product_id).to.equal(productId);
    });

    it("should return an error if invoice not found", (done) => {
      InvoiceService.getInvoiceById(9999, (err, invoice) => {
        expect(err).to.exist;
        expect(err.message).to.equal("Facture non trouvée");
        expect(invoice).to.be.undefined;
        done();
      });
    });
  });

  describe("getInvoices", () => {
    it("should return an array of invoices", async () => {
      await InvoiceService.createInvoiceFromSale(saleId); // Create one invoice
      const invoices = await new Promise((resolve, reject) => {
        InvoiceService.getInvoices((err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      expect(invoices).to.be.an("array").and.to.have.lengthOf(1);
      expect(invoices[0].sale_id).to.equal(saleId);
    });
  });

  describe("getInvoicesByCustomerId", () => {
    it("should return invoices for a specific customer", async () => {
      await InvoiceService.createInvoiceFromSale(saleId); // Create one invoice for customerId
      const invoices = await new Promise((resolve, reject) => {
        InvoiceService.getInvoicesByCustomerId(customerId, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      expect(invoices).to.be.an("array").and.to.have.lengthOf(1);
      expect(invoices[0].customer_id).to.equal(customerId);
    });

    it("should return empty array for customer with no invoices", async () => {
      const invoices = await new Promise((resolve, reject) => {
        InvoiceService.getInvoicesByCustomerId(999, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      expect(invoices).to.be.an("array").and.to.have.lengthOf(0);
    });
  });
});