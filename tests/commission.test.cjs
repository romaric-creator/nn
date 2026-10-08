const { expect } = require("chai");
const {
  computeCommission,
  commissionsToCSV,
} = require("../src/main/services/commissionHelper.cjs");

describe("commissionHelper", () => {
  it("computeCommission should calculate correct value", () => {
    expect(computeCommission(1000, 10)).to.equal(100);
    expect(computeCommission(0, 20)).to.equal(0);
    expect(computeCommission("2000", "5")).to.equal(100);
  });

  it("commissionsToCSV should produce valid CSV", () => {
    const rows = [
      {
        user_id: 1,
        user_name: "Alice",
        units_sold: 5,
        total_revenue: 1000,
        commission_percent: 10,
        commission_amount: 100,
      },
    ];
    const csv = commissionsToCSV(rows);
    expect(csv).to.be.a("string");
    expect(csv.split("\n")[0]).to.match(/user_id.*user_name/);
  });
});
