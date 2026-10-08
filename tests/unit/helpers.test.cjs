const { expect } = require("chai");

describe("Commission Helper Tests", () => {
  const {
    computeCommission,
    commissionsToCSV,
  } = require("../../src/main/services/commissionHelper.cjs");

  describe("computeCommission", () => {
    it("should calculate commission correctly", () => {
      expect(computeCommission(1000, 10)).to.equal(100);
      expect(computeCommission(5000, 5)).to.equal(250);
      expect(computeCommission(10000, 15)).to.equal(1500);
    });

    it("should handle zero values", () => {
      expect(computeCommission(0, 10)).to.equal(0);
      expect(computeCommission(1000, 0)).to.equal(0);
    });

    it("should handle string inputs", () => {
      expect(computeCommission("1000", "10")).to.equal(100);
      expect(computeCommission("5000", "5")).to.equal(250);
    });

    it("should handle edge cases", () => {
      expect(computeCommission(0.01, 100)).to.equal(1);
      expect(computeCommission(100, 0.1)).to.equal(0.1);
    });
  });

  describe("commissionsToCSV", () => {
    it("should convert array to CSV string", () => {
      const data = [
        {
          user_id: 1,
          user_name: "Alice",
          units_sold: 5,
          total_revenue: 1000,
          commission_percent: 10,
          commission_amount: 100,
        },
        {
          user_id: 2,
          user_name: "Bob",
          units_sold: 8,
          total_revenue: 2000,
          commission_percent: 15,
          commission_amount: 300,
        },
      ];

      const csv = commissionsToCSV(data);
      expect(csv).to.be.a("string");
      expect(csv).to.include("user_id");
      expect(csv).to.include("user_name");
      expect(csv).to.include("Alice");
      expect(csv).to.include("Bob");
    });

    it("should handle empty array", () => {
      const csv = commissionsToCSV([]);
      expect(csv).to.be.a("string");
      expect(csv.length).to.be.greaterThan(0); // Should at least have headers
    });

    it("should format numbers correctly in CSV", () => {
      const data = [
        {
          user_id: 1,
          user_name: "Charlie",
          units_sold: 12,
          total_revenue: 5500,
          commission_percent: 8.5,
          commission_amount: 467.5,
        },
      ];

      const csv = commissionsToCSV(data);
      expect(csv).to.include("467.5");
    });

    it("should include newlines for multiple records", () => {
      const data = [
        {
          user_id: 1,
          user_name: "User1",
          units_sold: 1,
          total_revenue: 100,
          commission_percent: 10,
          commission_amount: 10,
        },
        {
          user_id: 2,
          user_name: "User2",
          units_sold: 2,
          total_revenue: 200,
          commission_percent: 10,
          commission_amount: 20,
        },
      ];

      const csv = commissionsToCSV(data);
      const lines = csv.split("\n").filter((line) => line.trim());
      expect(lines.length).to.equal(3); // header + 2 data lines
    });
  });
});

describe("Logging Service Tests", () => {
  const logger = require("../../src/main/services/loggingService.cjs");

  describe("log methods", () => {
    it("should have info method", () => {
      expect(logger.info).to.be.a("function");
    });

    it("should have error method", () => {
      expect(logger.error).to.be.a("function");
    });

    it("should have warn method", () => {
      expect(logger.warn).to.be.a("function");
    });

    it("should have debug method", () => {
      expect(logger.debug).to.be.a("function");
    });
  });

  describe("logging operations", () => {
    it("should log info without errors", () => {
      expect(() => {
        logger.info("Test info message", { test: true });
      }).to.not.throw();
    });

    it("should log error without errors", () => {
      expect(() => {
        logger.error("Test error message", { test: true });
      }).to.not.throw();
    });

    it("should log warn without errors", () => {
      expect(() => {
        logger.warn("Test warning message", { test: true });
      }).to.not.throw();
    });

    it("should log debug without errors", () => {
      expect(() => {
        logger.debug("Test debug message", { test: true });
      }).to.not.throw();
    });
  });
});

describe("Input Validation", () => {
  describe("Number validation", () => {
    it("should validate positive numbers", () => {
      const isValid = (num) => typeof num === "number" && num > 0;

      expect(isValid(100)).to.be.true;
      expect(isValid(0.01)).to.be.true;
      expect(isValid(0)).to.be.false;
      expect(isValid(-100)).to.be.false;
      expect(isValid("100")).to.be.false;
    });
  });

  describe("String validation", () => {
    it("should validate non-empty strings", () => {
      const isValid = (str) => typeof str === "string" && str.trim().length > 0;

      expect(isValid("test")).to.be.true;
      expect(isValid("  test  ")).to.be.true;
      expect(isValid("")).to.be.false;
      expect(isValid("   ")).to.be.false;
      expect(isValid(123)).to.be.false;
    });
  });

  describe("Phone validation", () => {
    it("should validate phone numbers", () => {
      const isValid = (phone) => /^\+?[\d\s\-()]{10,}$/.test(phone);

      expect(isValid("123456789")).to.be.false; // Too short
      expect(isValid("123 456 7890")).to.be.true;
      expect(isValid("+223 123456789")).to.be.true;
      expect(isValid("123-456-7890")).to.be.true;
    });
  });

  describe("Email validation", () => {
    it("should validate email addresses", () => {
      const isValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      expect(isValid("user@example.com")).to.be.true;
      expect(isValid("user.name@example.co.uk")).to.be.true;
      expect(isValid("invalid.email@")).to.be.false;
      expect(isValid("invalid@")).to.be.false;
      expect(isValid("invalid.com")).to.be.false;
    });
  });
});

describe("Data Formatting", () => {
  describe("Currency formatting", () => {
    it("should format numbers as currency", () => {
      const format = (num) =>
        num.toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

      expect(format(1000)).to.equal("1 000,00");
      expect(format(1234.5)).to.equal("1 234,50");
      expect(format(0.01)).to.equal("0,01");
    });
  });

  describe("Date formatting", () => {
    it("should format dates in French locale", () => {
      const date = new Date("2024-03-17");
      const formatted = date.toLocaleDateString("fr-FR");

      expect(formatted).to.include("17");
      expect(formatted).to.include("03");
      expect(formatted).to.include("2024");
    });
  });
});
