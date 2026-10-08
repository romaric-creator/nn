const { expect } = require("chai");
const path = require("path");
const fs = require("fs");

describe("IPC Handler Validation", function () {
  this.timeout(5000);

  // Read all IPC handler files to validate structure
  const ipcDir = path.join(__dirname, "../../src/main/ipc");

  it("should have all required IPC handler files", function (done) {
    const requiredFiles = [
      "invoice.cjs",
      "sale.cjs",
      "customer.cjs",
      "stock.cjs",
      "user.cjs",
      "audit.cjs",
      "db.cjs",
      "backup.cjs",
    ];

    requiredFiles.forEach((file) => {
      const filePath = path.join(ipcDir, file);
      expect(fs.existsSync(filePath)).to.be.true;
    });
    done();
  });

  describe("Invoice IPC Handlers", () => {
    let invoiceIpc;

    before(() => {
      try {
        invoiceIpc = fs.readFileSync(path.join(ipcDir, "invoice.cjs"), "utf-8");
      } catch (e) {
        console.error("Failed to read invoice.cjs:", e);
      }
    });

    it("should have createFromSale handler", () => {
      expect(invoiceIpc).to.include("invoice:createFromSale");
    });

    it("should have generateHTML handler", () => {
      expect(invoiceIpc).to.include("invoice:generateHTML");
    });

    it("should have getById handler", () => {
      expect(invoiceIpc).to.include("invoice:getById");
    });

    it("should have getAll handler", () => {
      expect(invoiceIpc).to.include("invoice:getAll");
    });

    it("should have getByCustomerId handler", () => {
      expect(invoiceIpc).to.include("invoice:getByCustomerId");
    });
  });

  describe("Sale IPC Handlers", () => {
    let saleIpc;

    before(() => {
      try {
        saleIpc = fs.readFileSync(path.join(ipcDir, "sale.cjs"), "utf-8");
      } catch (e) {
        console.error("Failed to read sale.cjs:", e);
      }
    });

    it("should have create handler", () => {
      expect(saleIpc).to.include("sale:create");
    });

    it("should have getAll handler", () => {
      expect(saleIpc).to.include("sale:getAll");
    });

    it("should have getDetails handler", () => {
      expect(saleIpc).to.include("sale:getDetails");
    });
  });

  describe("Customer IPC Handlers", () => {
    let customerIpc;

    before(() => {
      try {
        customerIpc = fs.readFileSync(
          path.join(ipcDir, "customer.cjs"),
          "utf-8",
        );
      } catch (e) {
        console.error("Failed to read customer.cjs:", e);
      }
    });

    it("should have add handler", () => {
      expect(customerIpc).to.include("customer:add");
    });

    it("should have getAll handler", () => {
      expect(customerIpc).to.include("customer:getAll");
    });

    it("should have update handler", () => {
      expect(customerIpc).to.include("customer:update");
    });

    it("should have delete handler", () => {
      expect(customerIpc).to.include("customer:delete");
    });
  });

  describe("Stock IPC Handlers", () => {
    let stockIpc;

    before(() => {
      try {
        stockIpc = fs.readFileSync(path.join(ipcDir, "stock.cjs"), "utf-8");
      } catch (e) {
        console.error("Failed to read stock.cjs:", e);
      }
    });

    it("should have getAll handler", () => {
      expect(stockIpc).to.include("stock:getAll");
    });

    it("should have add handler", () => {
      expect(stockIpc).to.include("stock:add");
    });

    it("should have update handler", () => {
      expect(stockIpc).to.include("stock:update");
    });
  });
});

describe("Preload Security Validation", function () {
  this.timeout(5000);

  let preloadContent;

  before(() => {
    try {
      preloadContent = fs.readFileSync(
        path.join(__dirname, "../../src/preload/preload.cjs"),
        "utf-8",
      );
    } catch (e) {
      console.error("Failed to read preload.cjs:", e);
    }
  });

  it("should have whitelist for invoice channels", () => {
    expect(preloadContent).to.include("invoice:createFromSale");
    expect(preloadContent).to.include("invoice:generateHTML");
    expect(preloadContent).to.include("invoice:getById");
    expect(preloadContent).to.include("invoice:getAll");
    expect(preloadContent).to.include("invoice:getByCustomerId");
  });

  it("should have whitelist for sale channels", () => {
    expect(preloadContent).to.include("sale:create");
    expect(preloadContent).to.include("sale:getAll");
  });

  it("should have whitelist for customer channels", () => {
    expect(preloadContent).to.include("customer:add");
    expect(preloadContent).to.include("customer:getAll");
    expect(preloadContent).to.include("customer:update");
    expect(preloadContent).to.include("customer:delete");
  });

  it("should have whitelist for stock channels", () => {
    expect(preloadContent).to.include("stock:getAll");
    expect(preloadContent).to.include("stock:add");
    expect(preloadContent).to.include("stock:update");
  });

  it("should only allow specified channels", () => {
    // The preload should check validChannels
    expect(preloadContent).to.include("validChannels");
    expect(preloadContent).to.include("if (validChannels.includes(channel))");
  });

  it("should warn about unauthorized channels", () => {
    expect(preloadContent).to.include("console.warn");
  });
});
