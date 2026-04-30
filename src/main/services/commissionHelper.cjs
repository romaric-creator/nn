function computeCommission(totalRevenue, percent) {
  const p = Number(percent) || 0;
  return (Number(totalRevenue) || 0) * (p / 100);
}

function commissionsToCSV(rows) {
  const header = [
    "user_id",
    "user_name",
    "units_sold",
    "total_revenue",
    "commission_percent",
    "commission_amount",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.user_id,
        `"${(r.user_name || "").replace(/"/g, '""')}"`,
        r.units_sold || 0,
        r.total_revenue || 0,
        r.commission_percent || 0,
        r.commission_amount || 0,
      ].join(","),
    );
  }
  return lines.join("\n");
}

module.exports = { computeCommission, commissionsToCSV };
