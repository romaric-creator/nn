const { ipcMain } = require("electron");
const SaleService = require("../services/saleService.cjs");

// ─────────────────────────────────────────────────────────────────────────────
//  CRUD & Totaux
// ─────────────────────────────────────────────────────────────────────────────

ipcMain.handle("sale:checkout", async (event, sale, items) => {
  try {
    const result = await SaleService.checkout(sale, items);
    return { success: true, ...result };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle("sale:cancel", async (event, saleId) => {
  return new Promise((resolve) => {
    SaleService.cancelSale(saleId, (err) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true });
    });
  });
});

ipcMain.handle("sale:getAll", async () => {
  return new Promise((resolve) => {
    SaleService.getSales((err, rows) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: rows });
    });
  });
});

ipcMain.handle("sale:getDetails", async (event, saleId) => {
  return new Promise((resolve) => {
    SaleService.getSaleDetails(saleId, (err, rows) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: rows });
    });
  });
});

ipcMain.handle("sale:getDailyTotal", async () => {
  return new Promise((resolve) => {
    SaleService.getDailySalesTotal((err, row) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: row.dailyTotal || 0 });
    });
  });
});

ipcMain.handle("sale:getWeeklyTotal", async () => {
  return new Promise((resolve) => {
    SaleService.getWeeklySalesTotal((err, row) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: row.weeklyTotal || 0 });
    });
  });
});

ipcMain.handle("sale:getMonthlyTotal", async () => {
  return new Promise((resolve) => {
    SaleService.getMonthlySalesTotal((err, row) => {
      if (err) {
        console.error("IPC Error sale:getMonthlyTotal:", err.message);
        resolve({ success: false, message: err.message });
      } else {
        resolve({ success: true, data: row.monthlyTotal || 0 });
      }
    });
  });
});

ipcMain.handle("sale:getCumulativeTotal", async () => {
  return new Promise((resolve) => {
    SaleService.getCumulativeSalesTotal((err, row) => {
      if (err) {
        console.error("IPC Error sale:getCumulativeTotal:", err.message);
        resolve({ success: false, message: err.message });
      } else {
        resolve({ success: true, data: row.cumulativeTotal || 0 });
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Rapports & Requêtes avancées
// ─────────────────────────────────────────────────────────────────────────────

ipcMain.handle(
  "sale:getSalesByDateRange",
  async (event, startDate, endDate) => {
    return new Promise((resolve) => {
      SaleService.getSalesByDateRange(startDate, endDate, (err, rows) => {
        if (err) {
          console.error("IPC Error sale:getSalesByDateRange:", err.message);
          resolve({ success: false, message: err.message });
        } else {
          resolve({ success: true, data: rows });
        }
      });
    });
  },
);

ipcMain.handle("sale:getDetailedReport", async (event, startDate, endDate) => {
  return new Promise((resolve) => {
    SaleService.getDetailedSalesReport(startDate, endDate, (err, rows) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: rows });
    });
  });
});

ipcMain.handle("sale:getBestSellers", async (event, limit) => {
  return new Promise((resolve) => {
    SaleService.getBestSellingProducts(limit, (err, rows) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: rows });
    });
  });
});

ipcMain.handle("sale:getCumulative", async (event, yearMonth) => {
  return new Promise((resolve) => {
    SaleService.getCumulativeMonthlySales(yearMonth, (err, rows) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: rows });
    });
  });
});

ipcMain.handle("sale:getCommissions", async (event, startDate, endDate) => {
  return new Promise((resolve) => {
    SaleService.getCommissionsReport(startDate, endDate, (err, rows) => {
      if (err) resolve({ success: false, message: err.message });
      else resolve({ success: true, data: rows });
    });
  });
});

ipcMain.handle(
  "sale:getSellerPerformance",
  async (event, startDate, endDate) => {
    return new Promise((resolve) => {
      SaleService.getSellerPerformance(startDate, endDate, (err, rows) => {
        if (err) resolve({ success: false, message: err.message });
        else resolve({ success: true, data: rows });
      });
    });
  },
);

// ─────────────────────────────────────────────────────────────────────────────
//  Export Commissions CSV (inchangé)
// ─────────────────────────────────────────────────────────────────────────────

ipcMain.handle("sale:exportCommissions", async (event, startDate, endDate) => {
  return new Promise((resolve) => {
    SaleService.getCommissionsReport(startDate, endDate, (err, rows) => {
      if (err) return resolve({ success: false, message: err.message });
      const helper = require("../services/commissionHelper.cjs");
      const csv = helper.commissionsToCSV(rows);
      const fs = require("fs");
      const path = require("path");
      const { app } = require("electron");
      const backupsDir = path.join(
        app.getPath("appData"),
        "it-manager-desktop",
        "backups",
      );
      if (!fs.existsSync(backupsDir))
        fs.mkdirSync(backupsDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const dest = path.join(backupsDir, `commissions-${timestamp}.csv`);
      fs.writeFile(dest, csv, (wErr) => {
        if (wErr) return resolve({ success: false, message: wErr.message });
        resolve({ success: true, path: dest });
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Export Rapport Comptable Complet — VERSION 3 (XLSX coloré, 6 onglets)
//
//  Dépendance : npm install exceljs
// ─────────────────────────────────────────────────────────────────────────────

ipcMain.handle("sale:exportReport", async (event, startDate, endDate) => {
  const call = (fn, ...args) =>
    new Promise((res, rej) =>
      fn(...args, (err, data) => (err ? rej(err) : res(data))),
    );

  try {
    const [detailRows, , sellers, commissions] = await Promise.all([
      call(
        SaleService.getDetailedSalesReport.bind(SaleService),
        startDate,
        endDate,
      ),
      call(SaleService.getBestSellingProducts.bind(SaleService), 20),
      call(
        SaleService.getSellerPerformance.bind(SaleService),
        startDate,
        endDate,
      ),
      call(
        SaleService.getCommissionsReport.bind(SaleService),
        startDate,
        endDate,
      ).catch(() => []),
    ]);

    // ── Helpers data ──────────────────────────────────────────────────────────
    const TVA_RATE = 0.1925;
    const now = new Date();
    const exportedAt = now.toLocaleString("fr-FR");

    const fmtDate = (iso) => {
      if (!iso) return "";
      return new Date(iso).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };
    const fmt = (n) => Number(n || 0).toLocaleString("fr-FR");
    const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) + "%" : "0.0%");

    // ── Calculs globaux ───────────────────────────────────────────────────────
    const uniqueSales = new Set(detailRows.map((r) => r.sale_id));
    const nbFactures = uniqueSales.size;
    const nbLignes = detailRows.length;
    const totalCA = detailRows.reduce(
      (s, r) => s + Number(r.line_total || 0),
      0,
    );
    const panierMoyen = nbFactures ? totalCA / nbFactures : 0;
    const qteVendues = detailRows.reduce(
      (s, r) => s + Number(r.quantity || 0),
      0,
    );
    const htTotal = totalCA / (1 + TVA_RATE);
    const tvaTotal = totalCA - htTotal;
    const totalCommAmt = commissions.reduce(
      (s, c) => s + Number(c.commission_amount || 0),
      0,
    );

    // Par mode de paiement
    const byPayment = {};
    detailRows.forEach((r) => {
      const m = r.payment_method || "Non précisé";
      byPayment[m] = (byPayment[m] || 0) + Number(r.line_total || 0);
    });

    // Par client
    const byClient = {};
    detailRows.forEach((r) => {
      const c = r.customer_name || "Client anonyme";
      if (!byClient[c]) byClient[c] = { ca: 0, factures: new Set(), qte: 0 };
      byClient[c].ca += Number(r.line_total || 0);
      byClient[c].factures.add(r.sale_id);
      byClient[c].qte += Number(r.quantity || 0);
    });
    const topClients = Object.entries(byClient)
      .map(([nom, d]) => ({
        nom,
        ca: d.ca,
        factures: d.factures.size,
        qte: d.qte,
      }))
      .sort((a, b) => b.ca - a.ca);

    // Évolution journalière
    const byDay = {};
    detailRows.forEach((r) => {
      const d = fmtDate(r.date);
      if (!byDay[d]) byDay[d] = { ca: 0, factures: new Set(), qte: 0 };
      byDay[d].ca += Number(r.line_total || 0);
      byDay[d].factures.add(r.sale_id);
      byDay[d].qte += Number(r.quantity || 0);
    });
    const dailyRows = Object.entries(byDay).sort(([a], [b]) => {
      const parse = (s) => s.split("/").reverse().join("-");
      return parse(a).localeCompare(parse(b));
    });
    const maxDayCA = Math.max(...dailyRows.map(([, d]) => d.ca));

    // Par produit
    const byProduct = {};
    detailRows.forEach((r) => {
      const p = r.product_name || "Inconnu";
      if (!byProduct[p]) byProduct[p] = { ca: 0, qte: 0, ventes: 0 };
      byProduct[p].ca += Number(r.line_total || 0);
      byProduct[p].qte += Number(r.quantity || 0);
      byProduct[p].ventes++;
    });
    const productRows = Object.entries(byProduct)
      .map(([nom, d]) => ({ nom, ...d, pmu: d.qte ? d.ca / d.qte : 0 }))
      .sort((a, b) => b.ca - a.ca);

    // ── Palette ARGB ──────────────────────────────────────────────────────────
    const C = {
      navy: "FF1A3557",
      blueMed: "FF2563EB",
      blueXL: "FFEFF6FF",
      teal: "FF0F766E",
      tealLight: "FFCCFBF1",
      orange: "FFEA580C",
      orangeL: "FFFFEDD5",
      grayDark: "FF374151",
      grayMed: "FF6B7280",
      grayLight: "FFF3F4F6",
      white: "FFFFFFFF",
      green: "FF15803D",
      greenL: "FFDCFCE7",
      red: "FFB91C1C",
      redL: "FFFEE2E2",
      amber: "FFB45309",
      amberL: "FFFEF3C7",
      purple: "FF7C3AED",
      purpleL: "FFEDE9FE",
    };

    // ── ExcelJS ───────────────────────────────────────────────────────────────
    const ExcelJS = require("exceljs");
    const wb = new ExcelJS.Workbook();
    wb.creator = "IT Manager Desktop";
    wb.created = now;

    // ── Helpers style ─────────────────────────────────────────────────────────

    const thinBorder = {
      top: { style: "thin", color: { argb: "FFD1D5DB" } },
      left: { style: "thin", color: { argb: "FFD1D5DB" } },
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
      right: { style: "thin", color: { argb: "FFD1D5DB" } },
    };

    /** Applique fill + font + alignment + border sur une cellule ExcelJS */
    function sc(
      cell,
      {
        bg = null,
        fg = "FF000000",
        bold = false,
        size = 11,
        italic = false,
        hAlign = "left",
        vAlign = "middle",
        wrap = false,
        border = false,
        indent = 0,
      } = {},
    ) {
      if (bg)
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bg },
        };
      cell.font = { name: "Arial", size, bold, italic, color: { argb: fg } };
      cell.alignment = {
        horizontal: hAlign,
        vertical: vAlign,
        wrapText: wrap,
        indent,
      };
      if (border) cell.border = thinBorder;
    }

    /** Fusionne + style en une seule ligne */
    function mergeStyle(ws, tl, br, value, opts = {}) {
      ws.mergeCells(`${tl}:${br}`);
      const cell = ws.getCell(tl);
      cell.value = value;
      sc(cell, opts);
    }

    /** Ligne d'headers de tableau */
    function tableHeader(ws, rowNum, cols, bg = C.navy) {
      ws.getRow(rowNum).height = 22;
      cols.forEach(({ col, label, width, hAlign = "center" }) => {
        const cell = ws.getCell(rowNum, col);
        cell.value = label;
        sc(cell, {
          bg,
          fg: C.white,
          bold: true,
          size: 10,
          hAlign,
          border: true,
        });
        if (width) ws.getColumn(col).width = width;
      });
    }

    /** Ligne de total fond navy */
    function totalRow(ws, rowNum, cells) {
      ws.getRow(rowNum).height = 22;
      cells.forEach(({ col, value, hAlign = "center" }) => {
        const cell = ws.getCell(rowNum, col);
        cell.value = value;
        sc(cell, {
          bg: C.navy,
          fg: C.white,
          bold: true,
          size: 11,
          hAlign,
          border: true,
        });
      });
    }

    /** Bannière de section (fond navy, texte blanc gras, h=26) */
    function sectionBanner(ws, rowNum, startCol, endCol, text, bg = C.navy) {
      const tl = ws.getCell(rowNum, startCol).address;
      const br = ws.getCell(rowNum, endCol).address;
      ws.mergeCells(`${tl}:${br}`);
      const cell = ws.getCell(rowNum, startCol);
      cell.value = text;
      sc(cell, {
        bg,
        fg: C.white,
        bold: true,
        size: 13,
        hAlign: "left",
        indent: 1,
      });
      ws.getRow(rowNum).height = 26;
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  ONGLET 1 — 📊 TABLEAU DE BORD
    // ═════════════════════════════════════════════════════════════════════════
    const ws1 = wb.addWorksheet("📊 Tableau de bord", {
      views: [{ showGridLines: false }],
    });

    // Largeurs : col A=3, col B..L=9 (3 cols par KPI card × 4 cards = 12 cols)
    ws1.getColumn(1).width = 3;
    for (let c = 2; c <= 13; c++) ws1.getColumn(c).width = 9;

    // Ligne 1 — titre
    ws1.getRow(1).height = 55;
    mergeStyle(
      ws1,
      "B1",
      "M1",
      "IT MANAGER DESKTOP — RAPPORT COMPTABLE DES VENTES",
      {
        bg: C.navy,
        fg: C.white,
        bold: true,
        size: 18,
        hAlign: "center",
        vAlign: "middle",
      },
    );

    // Ligne 2 — sous-titre
    ws1.getRow(2).height = 18;
    mergeStyle(
      ws1,
      "B2",
      "M2",
      `Période : ${fmtDate(startDate)}  au  ${fmtDate(endDate)}   |   Export : ${exportedAt}`,
      { bg: C.blueMed, fg: C.white, size: 10, hAlign: "center", italic: true },
    );

    ws1.getRow(3).height = 10;

    // Lignes 4–7 : 4 KPI cards (chacune sur 3 colonnes B-D, E-G, H-J, K-M)
    const kpiCards = [
      {
        label: "CA TTC",
        value: `${fmt(Math.round(totalCA))} FCFA`,
        sub: "Total encaissé",
        bg: C.navy,
        startCol: 2,
      },
      {
        label: "CA HT",
        value: `${fmt(Math.round(htTotal))} FCFA`,
        sub: "Hors TVA 19.25%",
        bg: C.teal,
        startCol: 5,
      },
      {
        label: "TVA Collectée",
        value: `${fmt(Math.round(tvaTotal))} FCFA`,
        sub: "À reverser DGI",
        bg: C.orange,
        startCol: 8,
      },
      {
        label: "Panier Moyen",
        value: `${fmt(Math.round(panierMoyen))} FCFA`,
        sub: "CA ÷ nb factures",
        bg: C.purple,
        startCol: 11,
      },
    ];

    kpiCards.forEach(({ label, value, sub, bg, startCol }) => {
      const endCol = startCol + 2;
      const tlOf = (row) => ws1.getCell(row, startCol).address;
      const brOf = (row) => ws1.getCell(row, endCol).address;

      ws1.getRow(4).height = 20;
      mergeStyle(ws1, tlOf(4), brOf(4), label, {
        bg,
        fg: C.white,
        size: 10,
        hAlign: "center",
      });

      ws1.getRow(5).height = 38;
      mergeStyle(ws1, tlOf(5), brOf(5), value, {
        bg,
        fg: C.white,
        bold: true,
        size: 22,
        hAlign: "center",
      });

      ws1.getRow(6).height = 18;
      mergeStyle(ws1, tlOf(6), brOf(6), sub, {
        bg,
        fg: C.white,
        size: 9,
        hAlign: "center",
        italic: true,
      });

      ws1.getRow(7).height = 8;
      ws1.mergeCells(`${tlOf(7)}:${brOf(7)}`);
      ws1.getCell(7, startCol).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: C.white },
      };
    });

    // Ligne 8 : KPIs secondaires
    ws1.getRow(8).height = 26;
    const secKpis = [
      { label: `${fmt(qteVendues)} unités vendues`, startCol: 2 },
      { label: `${nbLignes} lignes articles`, startCol: 5 },
      { label: `${nbFactures} factures validées`, startCol: 8 },
      {
        label: `${fmt(Math.round(totalCA / (qteVendues || 1)))} FCFA / article`,
        startCol: 11,
      },
    ];
    secKpis.forEach(({ label, startCol }) => {
      const tl = ws1.getCell(8, startCol).address;
      const br = ws1.getCell(8, startCol + 2).address;
      ws1.mergeCells(`${tl}:${br}`);
      const cell = ws1.getCell(8, startCol);
      cell.value = label;
      sc(cell, {
        bg: C.grayLight,
        fg: C.grayDark,
        bold: true,
        size: 10,
        hAlign: "center",
        border: true,
      });
    });

    ws1.getRow(9).height = 10;

    // Bannière évolution
    sectionBanner(ws1, 10, 2, 13, "ÉVOLUTION JOURNALIÈRE DES VENTES");

    // Headers tableau journalier (colonnes B-G)
    tableHeader(ws1, 11, [
      { col: 2, label: "Date", width: 14 },
      { col: 3, label: "CA TTC (FCFA)", width: 18 },
      { col: 4, label: "% CA Total", width: 12 },
      { col: 5, label: "Nb Factures", width: 13 },
      { col: 6, label: "Qté Vendue", width: 13 },
      { col: 7, label: "Panier Moyen", width: 18 },
    ]);

    // Données journalières
    dailyRows.forEach(([date, d], i) => {
      const r = 12 + i;
      ws1.getRow(r).height = 20;
      const isMax = d.ca === maxDayCA;
      const bg = isMax ? C.amberL : i % 2 === 0 ? C.blueXL : C.white;
      const fg = isMax ? C.amber : C.grayDark;
      const bold = isMax;

      [
        { col: 2, v: date, ha: "center" },
        { col: 3, v: fmt(Math.round(d.ca)), ha: "right" },
        { col: 4, v: pct(d.ca, totalCA), ha: "center" },
        { col: 5, v: d.factures.size, ha: "center" },
        { col: 6, v: d.qte, ha: "center" },
        {
          col: 7,
          v: `${fmt(Math.round(d.ca / (d.factures.size || 1)))} FCFA`,
          ha: "right",
        },
      ].forEach(({ col, v, ha }) => {
        const cell = ws1.getCell(r, col);
        cell.value = v;
        sc(cell, { bg, fg, bold, size: 10, hAlign: ha, border: true });
      });
    });

    // Total journalier
    const totalDayRow = 12 + dailyRows.length;
    totalRow(ws1, totalDayRow, [
      { col: 2, value: "TOTAL", hAlign: "center" },
      { col: 3, value: fmt(Math.round(totalCA)), hAlign: "right" },
      { col: 4, value: "100.0%", hAlign: "center" },
      { col: 5, value: nbFactures, hAlign: "center" },
      { col: 6, value: qteVendues, hAlign: "center" },
      {
        col: 7,
        value: `${fmt(Math.round(panierMoyen))} FCFA`,
        hAlign: "right",
      },
    ]);

    // Alerte journée max
    const alertRow1 = totalDayRow + 1;
    ws1.getRow(alertRow1).height = 22;
    const [maxDayDate] = dailyRows.reduce((a, b) =>
      b[1].ca > a[1].ca ? b : a,
    );
    mergeStyle(
      ws1,
      `B${alertRow1}`,
      `M${alertRow1}`,
      `⚠  Le ${maxDayDate} concentre ${pct(byDay[maxDayDate].ca, totalCA)} du CA total (${fmt(Math.round(byDay[maxDayDate].ca))} FCFA) — journée atypique à surveiller`,
      { bg: C.amberL, fg: C.amber, size: 10, hAlign: "left", indent: 1 },
    );

    // ═════════════════════════════════════════════════════════════════════════
    //  ONGLET 2 — 📦 PRODUITS
    // ═════════════════════════════════════════════════════════════════════════
    const ws2 = wb.addWorksheet("📦 Produits", {
      views: [{ showGridLines: false }],
    });

    ws2.getRow(1).height = 50;
    mergeStyle(ws2, "A1", "H1", "ANALYSE PAR PRODUIT", {
      bg: C.teal,
      fg: C.white,
      bold: true,
      size: 16,
      hAlign: "center",
    });

    ws2.getRow(2).height = 10;
    tableHeader(
      ws2,
      3,
      [
        { col: 1, label: "Rang", width: 7 },
        { col: 2, label: "Produit", width: 24 },
        { col: 3, label: "CA TTC (FCFA)", width: 20 },
        { col: 4, label: "% CA", width: 11 },
        { col: 5, label: "Qté Vendue", width: 13 },
        { col: 6, label: "% Qté", width: 11 },
        { col: 7, label: "Prix Moy. Unit.", width: 20 },
        { col: 8, label: "Nb Trans.", width: 11 },
      ],
      C.teal,
    );

    productRows.forEach((p, i) => {
      const r = 4 + i;
      ws2.getRow(r).height = 22;
      const bg = i % 2 === 0 ? C.tealLight : C.white;
      [
        { col: 1, v: i + 1, ha: "center" },
        { col: 2, v: p.nom, ha: "left" },
        { col: 3, v: fmt(Math.round(p.ca)), ha: "right" },
        { col: 4, v: pct(p.ca, totalCA), ha: "center" },
        { col: 5, v: p.qte, ha: "center" },
        { col: 6, v: pct(p.qte, qteVendues), ha: "center" },
        { col: 7, v: `${fmt(Math.round(p.pmu))} FCFA`, ha: "right" },
        { col: 8, v: p.ventes, ha: "center" },
      ].forEach(({ col, v, ha }) => {
        const cell = ws2.getCell(r, col);
        cell.value = v;
        sc(cell, { bg, size: 11, hAlign: ha, border: true });
      });
    });

    totalRow(ws2, 4 + productRows.length, [
      { col: 1, value: "" },
      { col: 2, value: "TOTAL", hAlign: "left" },
      { col: 3, value: fmt(Math.round(totalCA)), hAlign: "right" },
      { col: 4, value: "100.0%", hAlign: "center" },
      { col: 5, value: qteVendues, hAlign: "center" },
      { col: 6, value: "100.0%", hAlign: "center" },
      { col: 7, value: "" },
      { col: 8, value: nbLignes, hAlign: "center" },
    ]);

    // ═════════════════════════════════════════════════════════════════════════
    //  ONGLET 3 — 👥 CLIENTS
    // ═════════════════════════════════════════════════════════════════════════
    const ws3 = wb.addWorksheet("👥 Clients", {
      views: [{ showGridLines: false }],
    });

    ws3.getRow(1).height = 50;
    mergeStyle(ws3, "A1", "G1", "ANALYSE PAR CLIENT", {
      bg: C.purple,
      fg: C.white,
      bold: true,
      size: 16,
      hAlign: "center",
    });

    ws3.getRow(2).height = 10;
    tableHeader(
      ws3,
      3,
      [
        { col: 1, label: "Rang", width: 7 },
        { col: 2, label: "Client", width: 22 },
        { col: 3, label: "CA TTC (FCFA)", width: 20 },
        { col: 4, label: "% CA", width: 11 },
        { col: 5, label: "Nb Factures", width: 14 },
        { col: 6, label: "Qté Achetée", width: 14 },
        { col: 7, label: "Panier Moyen", width: 22 },
      ],
      C.purple,
    );

    topClients.forEach((client, i) => {
      const r = 4 + i;
      ws3.getRow(r).height = 22;
      const isAnon = client.nom === "Client anonyme";
      const bg = isAnon ? C.amberL : i % 2 === 0 ? C.purpleL : C.white;
      const fg = isAnon ? C.amber : C.grayDark;
      [
        { col: 1, v: i + 1, ha: "center" },
        { col: 2, v: client.nom, ha: "left" },
        { col: 3, v: fmt(Math.round(client.ca)), ha: "right" },
        { col: 4, v: pct(client.ca, totalCA), ha: "center" },
        { col: 5, v: client.factures, ha: "center" },
        { col: 6, v: client.qte, ha: "center" },
        {
          col: 7,
          v: `${fmt(Math.round(client.ca / (client.factures || 1)))} FCFA`,
          ha: "right",
        },
      ].forEach(({ col, v, ha }) => {
        const cell = ws3.getCell(r, col);
        cell.value = v;
        sc(cell, { bg, fg, bold: isAnon, size: 11, hAlign: ha, border: true });
      });
    });

    const totalCliRow = 4 + topClients.length;
    totalRow(ws3, totalCliRow, [
      { col: 1, value: "" },
      { col: 2, value: "TOTAL", hAlign: "left" },
      { col: 3, value: fmt(Math.round(totalCA)), hAlign: "right" },
      { col: 4, value: "100.0%", hAlign: "center" },
      { col: 5, value: nbFactures, hAlign: "center" },
      { col: 6, value: qteVendues, hAlign: "center" },
      { col: 7, value: "" },
    ]);

    const alertRow3 = totalCliRow + 1;
    ws3.getRow(alertRow3).height = 22;
    mergeStyle(
      ws3,
      `A${alertRow3}`,
      `G${alertRow3}`,
      "⚠  'Client anonyme' représente un CA significatif sans données de fidélisation — Capturer les coordonnées client !",
      { bg: C.amberL, fg: C.amber, size: 10, hAlign: "left", indent: 1 },
    );

    // ═════════════════════════════════════════════════════════════════════════
    //  ONGLET 4 — 💳 PAIEMENTS & VENDEURS
    // ═════════════════════════════════════════════════════════════════════════
    const ws4 = wb.addWorksheet("💳 Paiements", {
      views: [{ showGridLines: false }],
    });

    ws4.getRow(1).height = 50;
    mergeStyle(ws4, "A1", "E1", "MODES DE PAIEMENT & PERFORMANCE VENDEURS", {
      bg: C.orange,
      fg: C.white,
      bold: true,
      size: 16,
      hAlign: "center",
    });

    ws4.getRow(2).height = 10;
    tableHeader(
      ws4,
      3,
      [
        { col: 1, label: "Mode de paiement", width: 22 },
        { col: 2, label: "Montant TTC", width: 20 },
        { col: 3, label: "% du Total", width: 13 },
        { col: 4, label: "TVA incluse", width: 18 },
        { col: 5, label: "Montant HT", width: 18 },
      ],
      C.orange,
    );

    const payBgMap = {
      cash: C.amberL,
      Virement: C.blueXL,
      Carte: C.purpleL,
      Espèces: C.greenL,
    };

    const sortedPayments = Object.entries(byPayment).sort(
      (a, b) => b[1] - a[1],
    );
    sortedPayments.forEach(([mode, montant], i) => {
      const r = 4 + i;
      ws4.getRow(r).height = 22;
      const bg = payBgMap[mode] || C.grayLight;
      const tva = montant - montant / (1 + TVA_RATE);
      const ht = montant / (1 + TVA_RATE);
      [
        { col: 1, v: mode, ha: "left" },
        { col: 2, v: fmt(Math.round(montant)), ha: "right" },
        { col: 3, v: pct(montant, totalCA), ha: "center" },
        { col: 4, v: fmt(Math.round(tva)), ha: "right" },
        { col: 5, v: fmt(Math.round(ht)), ha: "right" },
      ].forEach(({ col, v, ha }) => {
        const cell = ws4.getCell(r, col);
        cell.value = v;
        sc(cell, { bg, size: 11, hAlign: ha, border: true });
      });
    });

    totalRow(ws4, 4 + sortedPayments.length, [
      { col: 1, value: "TOTAL", hAlign: "left" },
      { col: 2, value: fmt(Math.round(totalCA)), hAlign: "right" },
      { col: 3, value: "100.0%", hAlign: "center" },
      { col: 4, value: fmt(Math.round(tvaTotal)), hAlign: "right" },
      { col: 5, value: fmt(Math.round(htTotal)), hAlign: "right" },
    ]);

    // Vendeurs
    const sellBannerRow = 4 + sortedPayments.length + 2;
    sectionBanner(
      ws4,
      sellBannerRow,
      1,
      5,
      "PERFORMANCE VENDEURS & COMMISSIONS",
    );

    const sellHeaderRow = sellBannerRow + 1;
    tableHeader(ws4, sellHeaderRow, [
      { col: 1, label: "Vendeur", width: 22 },
      { col: 2, label: "CA TTC réalisé", width: 20 },
      { col: 3, label: "% CA", width: 13 },
      { col: 4, label: "Nb Ventes", width: 13 },
      { col: 5, label: "Commission (FCFA)", width: 20 },
    ]);

    if (sellers && sellers.length > 0) {
      sellers.forEach((s, i) => {
        const r = sellHeaderRow + 1 + i;
        ws4.getRow(r).height = 22;
        const comm = commissions.find(
          (c) => c.user_id === s.user_id || c.user_name === s.user_name,
        );
        const commAmt = comm ? Number(comm.commission_amount || 0) : 0;
        const bg = i % 2 === 0 ? C.blueXL : C.white;
        [
          { col: 1, v: s.user_name || "Vendeur inconnu", ha: "left" },
          { col: 2, v: fmt(Math.round(s.total_revenue || 0)), ha: "right" },
          { col: 3, v: pct(s.total_revenue || 0, totalCA), ha: "center" },
          { col: 4, v: s.nb_sales || 0, ha: "center" },
          { col: 5, v: commAmt ? fmt(Math.round(commAmt)) : "—", ha: "right" },
        ].forEach(({ col, v, ha }) => {
          const cell = ws4.getCell(r, col);
          cell.value = v;
          sc(cell, { bg, size: 11, hAlign: ha, border: true });
        });
      });

      const sellTotalRow = sellHeaderRow + 1 + sellers.length;
      totalRow(ws4, sellTotalRow, [
        { col: 1, value: "TOTAL", hAlign: "left" },
        { col: 2, value: fmt(Math.round(totalCA)), hAlign: "right" },
        { col: 3, value: "100.0%", hAlign: "center" },
        { col: 4, value: nbFactures, hAlign: "center" },
        {
          col: 5,
          value: totalCommAmt ? fmt(Math.round(totalCommAmt)) : "—",
          hAlign: "right",
        },
      ]);

      // Alerte dépendance vendeur
      const topSeller = sellers.reduce((a, b) =>
        Number(b.total_revenue || 0) > Number(a.total_revenue || 0) ? b : a,
      );
      const alertRow4 = sellTotalRow + 1;
      ws4.getRow(alertRow4).height = 22;
      mergeStyle(
        ws4,
        `A${alertRow4}`,
        `E${alertRow4}`,
        `⚠  ${topSeller.user_name} réalise ${pct(topSeller.total_revenue || 0, totalCA)} des ventes — risque de dépendance à un seul vendeur`,
        { bg: C.redL, fg: C.red, size: 10, hAlign: "left", indent: 1 },
      );
    } else {
      ws4.getRow(sellHeaderRow + 1).height = 22;
      mergeStyle(
        ws4,
        `A${sellHeaderRow + 1}`,
        `E${sellHeaderRow + 1}`,
        "(Aucune donnée vendeur pour cette période)",
        {
          bg: C.grayLight,
          fg: C.grayMed,
          size: 11,
          hAlign: "center",
          italic: true,
        },
      );
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  ONGLET 5 — 📋 TVA & RÉSULTAT
    // ═════════════════════════════════════════════════════════════════════════
    const ws5 = wb.addWorksheet("📋 TVA & Résultat", {
      views: [{ showGridLines: false }],
    });

    ws5.getColumn(1).width = 36;
    ws5.getColumn(2).width = 22;
    ws5.getColumn(3).width = 14;
    ws5.getColumn(4).width = 32;

    ws5.getRow(1).height = 50;
    mergeStyle(
      ws5,
      "A1",
      "D1",
      "COMPTE DE RÉSULTAT & DÉCLARATION TVA SIMPLIFIÉE",
      { bg: C.green, fg: C.white, bold: true, size: 16, hAlign: "center" },
    );

    ws5.getRow(2).height = 10;
    tableHeader(
      ws5,
      3,
      [
        { col: 1, label: "Libellé" },
        { col: 2, label: "Montant (FCFA)" },
        { col: 3, label: "% CA TTC" },
        { col: 4, label: "Note" },
      ],
      C.green,
    );

    const resultData = [
      {
        lib: "(+) Chiffre d'affaires TTC",
        val: fmt(Math.round(totalCA)),
        p: "100.0%",
        note: "",
        bg: C.greenL,
        fg: C.green,
        bold: true,
      },
      {
        lib: "      dont HT",
        val: fmt(Math.round(htTotal)),
        p: pct(htTotal, totalCA),
        note: "",
        bg: C.white,
        fg: C.grayDark,
        bold: false,
      },
      {
        lib: "      dont TVA 19.25%",
        val: fmt(Math.round(tvaTotal)),
        p: pct(tvaTotal, totalCA),
        note: "À reverser DGI",
        bg: C.amberL,
        fg: C.amber,
        bold: false,
      },
      {
        lib: "(-) Commissions vendeurs",
        val: totalCommAmt ? fmt(Math.round(totalCommAmt)) : "— non renseigné —",
        p: "",
        note: "Voir onglet Paiements",
        bg: C.grayLight,
        fg: C.grayMed,
        bold: false,
      },
      {
        lib: "(-) Coût d'achat stock",
        val: "— non renseigné —",
        p: "",
        note: "Factures fournisseurs requises",
        bg: C.grayLight,
        fg: C.grayMed,
        bold: false,
      },
      {
        lib: "(=) MARGE BRUTE ESTIMÉE",
        val: "— données stock requises —",
        p: "",
        note: "",
        bg: C.redL,
        fg: C.red,
        bold: true,
      },
    ];

    resultData.forEach(({ lib, val, p, note, bg, fg, bold }, i) => {
      const r = 4 + i;
      ws5.getRow(r).height = 22;
      [
        { col: 1, v: lib, ha: "left" },
        { col: 2, v: val, ha: "right" },
        { col: 3, v: p, ha: "center" },
        { col: 4, v: note, ha: "left" },
      ].forEach(({ col, v, ha }) => {
        const cell = ws5.getCell(r, col);
        cell.value = v;
        sc(cell, { bg, fg, bold, size: 11, hAlign: ha, border: true });
      });
    });

    ws5.getRow(11).height = 10;
    sectionBanner(
      ws5,
      12,
      1,
      4,
      "DÉCLARATION TVA SIMPLIFIÉE (19.25%) — Cameroun",
    );

    tableHeader(ws5, 13, [
      { col: 1, label: "Libellé" },
      { col: 2, label: "Montant (FCFA)" },
      { col: 3, label: "Référence" },
      { col: 4, label: "" },
    ]);

    const tvaData = [
      {
        lib: "Base HT imposable",
        val: fmt(Math.round(htTotal)),
        ref: "Cumul période",
        bg: C.blueXL,
      },
      {
        lib: "TVA collectée (19.25%)",
        val: fmt(Math.round(tvaTotal)),
        ref: "À reverser DGI",
        bg: C.amberL,
      },
      {
        lib: "TVA déductible sur achats",
        val: "— non renseigné —",
        ref: "Factures fournisseurs requises",
        bg: C.grayLight,
      },
      {
        lib: "TVA NETTE À PAYER",
        val: "— données achats requises —",
        ref: "",
        bg: C.redL,
      },
    ];

    tvaData.forEach(({ lib, val, ref, bg }, i) => {
      const r = 14 + i;
      ws5.getRow(r).height = 22;
      const bold = lib === "TVA NETTE À PAYER";
      [
        { col: 1, v: lib, ha: "left" },
        { col: 2, v: val, ha: "right" },
        { col: 3, v: ref, ha: "left" },
        { col: 4, v: "", ha: "left" },
      ].forEach(({ col, v, ha }) => {
        const cell = ws5.getCell(r, col);
        cell.value = v;
        sc(cell, { bg, bold, size: 11, hAlign: ha, border: true });
      });
    });

    ws5.getRow(19).height = 22;
    mergeStyle(
      ws5,
      "A19",
      "D19",
      "⚠  Ce tableau est informatif. Consulter un comptable agréé pour la déclaration officielle DGI.",
      { bg: C.amberL, fg: C.amber, size: 10, hAlign: "left", indent: 1 },
    );

    // ═════════════════════════════════════════════════════════════════════════
    //  ONGLET 6 — 🧾 JOURNAL DE CAISSE
    // ═════════════════════════════════════════════════════════════════════════
    const ws6 = wb.addWorksheet("🧾 Journal de caisse", {
      views: [{ showGridLines: false, state: "frozen", ySplit: 3 }],
    });

    ws6.getRow(1).height = 50;
    mergeStyle(
      ws6,
      "A1",
      "K1",
      "JOURNAL DE CAISSE — DÉTAIL COMPLET DES VENTES",
      { bg: C.navy, fg: C.white, bold: true, size: 16, hAlign: "center" },
    );

    ws6.getRow(2).height = 8;
    tableHeader(ws6, 3, [
      { col: 1, label: "N° Facture", width: 13 },
      { col: 2, label: "Date", width: 13 },
      { col: 3, label: "Client", width: 20 },
      { col: 4, label: "Produit", width: 18 },
      { col: 5, label: "Qté", width: 7 },
      { col: 6, label: "PU HT (FCFA)", width: 16 },
      { col: 7, label: "PU TTC (FCFA)", width: 16 },
      { col: 8, label: "Total Ligne TTC", width: 16 },
      { col: 9, label: "Total Facture", width: 15 },
      { col: 10, label: "Paiement", width: 13 },
      { col: 11, label: "Statut", width: 11 },
    ]);

    let prevSaleId = null;
    let saleRunning = 0;
    let jnlRow = 4;

    const writeSubtotal = (saleId, amount) => {
      ws6.getRow(jnlRow).height = 16;
      // Remplir les colonnes en gris
      for (let col = 1; col <= 11; col++) {
        sc(ws6.getCell(jnlRow, col), { bg: C.grayLight });
      }
      // Label sous-total (col 4) et valeur (col 8)
      const stLabel = ws6.getCell(jnlRow, 4);
      stLabel.value = `  Sous-total facture #${saleId}`;
      sc(stLabel, {
        bg: C.grayLight,
        fg: C.grayMed,
        italic: true,
        size: 10,
        hAlign: "left",
      });
      const stVal = ws6.getCell(jnlRow, 8);
      stVal.value = fmt(Math.round(amount));
      sc(stVal, {
        bg: C.grayLight,
        fg: C.grayDark,
        bold: true,
        size: 10,
        hAlign: "right",
      });
      jnlRow++;

      // Ligne séparateur vide
      ws6.getRow(jnlRow).height = 6;
      for (let col = 1; col <= 11; col++) {
        ws6.getCell(jnlRow, col).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: C.white },
        };
      }
      jnlRow++;
    };

    detailRows.forEach((row) => {
      if (prevSaleId !== null && row.sale_id !== prevSaleId) {
        writeSubtotal(prevSaleId, saleRunning);
        saleRunning = 0;
      }
      const lineTotal = Number(row.line_total || 0);
      const puHT = Number(row.unit_price || 0) / (1 + TVA_RATE);
      saleRunning += lineTotal;
      prevSaleId = row.sale_id;

      ws6.getRow(jnlRow).height = 19;
      const paiement = row.payment_method || "";
      const bg = payBgMap[paiement] || C.white;

      [
        {
          col: 1,
          v: `FAC-${String(row.sale_id).padStart(5, "0")}`,
          ha: "center",
        },
        { col: 2, v: fmtDate(row.date), ha: "center" },
        { col: 3, v: row.customer_name || "Client anonyme", ha: "left" },
        { col: 4, v: row.product_name || "—", ha: "left" },
        { col: 5, v: row.quantity, ha: "center" },
        { col: 6, v: fmt(Math.round(puHT)), ha: "right" },
        { col: 7, v: fmt(row.unit_price), ha: "right" },
        { col: 8, v: fmt(Math.round(lineTotal)), ha: "right" },
        { col: 9, v: "", ha: "center" },
        { col: 10, v: row.payment_method || "—", ha: "center" },
        { col: 11, v: "Validée", ha: "center" },
      ].forEach(({ col, v, ha }) => {
        const cell = ws6.getCell(jnlRow, col);
        cell.value = v;
        sc(cell, { bg, size: 10, hAlign: ha, border: true });
      });
      jnlRow++;
    });

    // Dernier sous-total
    if (prevSaleId !== null) writeSubtotal(prevSaleId, saleRunning);

    // Total général
    ws6.getRow(jnlRow).height = 24;
    for (let col = 1; col <= 11; col++) {
      sc(ws6.getCell(jnlRow, col), {
        bg: C.navy,
        fg: C.white,
        bold: true,
        size: 11,
        hAlign: "center",
        border: true,
      });
    }
    ws6.getCell(jnlRow, 1).value = "TOTAL GÉNÉRAL";
    ws6.getCell(jnlRow, 5).value = String(qteVendues);
    ws6.getCell(jnlRow, 8).value = `${fmt(Math.round(totalCA))} FCFA`;
    jnlRow++;

    // Pied de page
    jnlRow++;
    ws6.getRow(jnlRow).height = 18;
    mergeStyle(
      ws6,
      `A${jnlRow}`,
      `K${jnlRow}`,
      `Document généré par IT Manager Desktop le ${exportedAt} — Confidentiel — IT Manager Desktop © ${now.getFullYear()}`,
      {
        bg: C.grayLight,
        fg: C.grayMed,
        size: 9,
        hAlign: "center",
        italic: true,
      },
    );

    // ── Écriture fichier ──────────────────────────────────────────────────────
    const fs = require("fs");
    const path = require("path");
    const { app } = require("electron");

    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `Rapport_Comptable_${timestamp}.xlsx`;
    const downloadsDir = app.getPath("downloads");
    if (!fs.existsSync(downloadsDir))
      fs.mkdirSync(downloadsDir, { recursive: true });
    const dest = path.join(downloadsDir, filename);

    await wb.xlsx.writeFile(dest);

    // Backup silencieux dans appData
    try {
      const backupsDir = path.join(
        app.getPath("appData"),
        "it-manager-desktop",
        "backups",
      );
      if (!fs.existsSync(backupsDir))
        fs.mkdirSync(backupsDir, { recursive: true });
      await wb.xlsx.writeFile(path.join(backupsDir, filename));
    } catch (e) {
      console.error("Backup save failed:", e);
    }

    return { success: true, path: dest };
  } catch (err) {
    console.error("IPC Error sale:exportReport:", err);
    return { success: false, message: err.message };
  }
});
