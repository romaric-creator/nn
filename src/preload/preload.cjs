// src/preload/preload.cjs
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel, ...args) => {
    const validChannels = [
      // Stock
      "stock:getAll",
      "stock:getById",
      "stock:add",
      "stock:update",
      "stock:delete",
      "stock:search",
      "stock:low",
      "stock:mark-as-defective",
      "stock:getDefective",
      "stock:markRepairedQuantity",
      "stock:reportDefectiveQuantity",
      "stock:markDefective",
      "stock:addMovement",
      "stock:history",
      "stock:bulkReceive",
      // Ventes
      "sale:checkout",
      "sale:create",
      "sale:cancel",
      "sale:getAll",
      "sale:getDetails",
      "sale:getDailyTotal",
      "sale:getWeeklyTotal",
      "sale:getMonthlyTotal",
      "sale:getSalesByDateRange",
      "sale:getDetailedReport",
      "sale:getBestSellers",
      "sale:getCumulative",
      "sale:getCumulativeTotal",
      "sale:getSellerPerformance",
      "sale:getCommissions",
      "sale:exportCommissions",
      "sale:exportReport",
      // Clients
      "customer:add",
      "customer:getAll",
      "customer:getById",
      "customer:getSales",
      // BUG FIX: canaux manquants — customer:update et customer:delete
      // n'étaient pas dans la whitelist → ipcRenderer.invoke retournait undefined
      // même si les handlers IPC existaient côté main
      "customer:update",
      "customer:delete",
      // Utilisateurs
      "user:getAll",
      "user:create",
      "user:deactivate",
      "user:login",
      "user:logAction",
      // Audit
      "audit:getLogs",
      "audit:getUserLogs",
      // Factures
      "invoice:createFromSale",
      "invoice:generateHTML",
      "invoice:getById",
      "invoice:getAll",
      "invoice:getByCustomerId",
      // Base de données
      "db:backup",
      "db:restore",
      "db:export-sql",
      // Unités
      "units:list",
      "units:find",
      "units:scan",
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    console.warn(`[preload] Canal non autorisé: ${channel}`);
    return Promise.resolve(undefined);
  },

  on: (channel, callback) => {
    const validChannels = ["navigate"];
    if (validChannels.includes(channel)) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
  },
});
