const { expect } = require("chai");
const path = require("path");
const fs = require("fs");

describe("React Components File Structure", function () {
  this.timeout(5000);

  const componentDir = path.join(__dirname, "../../src/renderer/pages");
  const componentDirShared = path.join(
    __dirname,
    "../../src/renderer/components",
  );

  it("should have all required page components", function (done) {
    const requiredPages = [
      "Home.tsx",
      "Sales.tsx",
      "Stock.tsx",
      "Receive.tsx",
      "Customers.tsx",
      "Users.tsx",
      "Reports.tsx",
      "Login.tsx",
      "Invoices.tsx",
    ];

    requiredPages.forEach((file) => {
      const filePath = path.join(componentDir, file);
      expect(fs.existsSync(filePath), `${file} should exist`).to.be.true;
    });
    done();
  });

  it("should have all required shared components", function (done) {
    const requiredComponents = [
      "Sidebar.tsx",
      "NotificationProvider.tsx",
      "ErrorBoundary.tsx",
    ];

    requiredComponents.forEach((file) => {
      const filePath = path.join(componentDirShared, file);
      expect(fs.existsSync(filePath), `${file} should exist`).to.be.true;
    });
    done();
  });

  describe("Sales Page Component", () => {
    let salesContent;

    before(() => {
      try {
        salesContent = fs.readFileSync(
          path.join(componentDir, "Sales.tsx"),
          "utf-8",
        );
      } catch (e) {
        console.error("Failed to read Sales.tsx:", e);
      }
    });

    it("should have price editing functionality", () => {
      expect(salesContent).to.include("updatePrice");
    });

    it("should have discount handling", () => {
      expect(salesContent).to.include("discount");
    });

    it("should have customer selection", () => {
      expect(salesContent).to.include("customer");
    });

    it("should have checkout functionality", () => {
      expect(salesContent).to.include("handleCheckout");
    });

    it("should call invoice:createFromSale", () => {
      expect(salesContent).to.include("invoice:createFromSale");
    });

    it("should call invoice:generateHTML", () => {
      expect(salesContent).to.include("invoice:generateHTML");
    });
  });

  describe("Invoices Page Component", () => {
    let invoicesContent;

    before(() => {
      try {
        invoicesContent = fs.readFileSync(
          path.join(componentDir, "Invoices.tsx"),
          "utf-8",
        );
      } catch (e) {
        console.error("Failed to read Invoices.tsx:", e);
      }
    });

    it("should load invoices on mount", () => {
      expect(invoicesContent).to.include("invoice:getAll");
    });

    it("should have search functionality", () => {
      expect(invoicesContent).to.include("search");
    });

    it("should have filter by status", () => {
      expect(invoicesContent).to.include("status");
    });

    it("should have print functionality", () => {
      expect(invoicesContent).to.include("print");
    });

    it("should have download functionality", () => {
      expect(invoicesContent).to.include("download");
    });
  });

  describe("Customers Page Component", () => {
    let customersContent;

    before(() => {
      try {
        customersContent = fs.readFileSync(
          path.join(componentDir, "Customers.tsx"),
          "utf-8",
        );
      } catch (e) {
        console.error("Failed to read Customers.tsx:", e);
      }
    });

    it("should load customers on mount", () => {
      expect(customersContent).to.include("customer:getAll");
    });

    it("should have add customer functionality", () => {
      expect(customersContent).to.include("customer:add");
    });

    it("should have edit customer functionality", () => {
      expect(customersContent).to.include("customer:update");
    });

    it("should have delete customer functionality", () => {
      expect(customersContent).to.include("customer:delete");
    });

    it("should have invoice history viewer", () => {
      expect(customersContent).to.include("invoice:getByCustomerId");
    });

    it("should have print invoice from customer view", () => {
      expect(customersContent).to.include("invoice:generateHTML");
    });
  });

  describe("Stock Page Component", () => {
    let stockContent;

    before(() => {
      try {
        stockContent = fs.readFileSync(
          path.join(componentDir, "Stock.tsx"),
          "utf-8",
        );
      } catch (e) {
        console.error("Failed to read Stock.tsx:", e);
      }
    });

    it("should load stock on mount", () => {
      expect(stockContent).to.include("stock:getAll");
    });

    it("should have CRUD operations", () => {
      expect(stockContent).to.include("stock:add");
      expect(stockContent).to.include("stock:update");
      expect(stockContent).to.include("stock:delete");
    });
  });

  describe("App.tsx Routing", () => {
    let appContent;

    before(() => {
      try {
        appContent = fs.readFileSync(
          path.join(__dirname, "../../src/renderer/App.tsx"),
          "utf-8",
        );
      } catch (e) {
        console.error("Failed to read App.tsx:", e);
      }
    });

    it("should have route to Home page", () => {
      expect(appContent).to.include("Home");
    });

    it("should have route to Sales page", () => {
      expect(appContent).to.include("Sales");
    });

    it("should have route to Stock page", () => {
      expect(appContent).to.include("Stock");
    });

    it("should have route to Customers page", () => {
      expect(appContent).to.include("Customers");
    });

    it("should have route to Invoices page", () => {
      expect(appContent).to.include("Invoices");
    });

    it("should have route to Reports page", () => {
      expect(appContent).to.include("Reports");
    });

    it("should have route to Users page", () => {
      expect(appContent).to.include("Users");
    });

    it("should have route to Login page", () => {
      expect(appContent).to.include("Login");
    });
  });
});
