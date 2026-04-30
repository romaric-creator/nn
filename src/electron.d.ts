// src/electron.d.ts
// BUG FIX: l'ancienne définition ne couvrait qu'une fraction des canaux réels.
// TypeScript ne pouvait pas valider les appels window.electronAPI.invoke()
// pour la majorité des canaux → erreurs silencieuses en dev.

export interface Product {
  id?: number;
  category: string;
  brand: string;
  model: string;
  state: string;
  purchase_price: number;
  sale_price: number;
  min_sale_price?: number;
  entry_date?: string;
  cpu?: string;
  ram?: string;
  gpu?: string;
  storage?: string;
  stock: number;
  min_stock?: number;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  path?: string;
  saleId?: number;
  purchaseId?: number;
}

type ValidChannel =
  // Stock
  | "stock:getAll"
  | "stock:getById"
  | "stock:add"
  | "stock:update"
  | "stock:delete"
  | "stock:search"
  | "stock:low"
  | "stock:mark-as-defective"
  | "stock:getDefective"
  | "stock:markRepairedQuantity"
  | "stock:reportDefectiveQuantity"
  | "stock:markDefective"
  | "stock:addMovement"
  | "stock:history"
  | "stock:bulkReceive"
  // Ventes
  | "sale:create"
  | "sale:cancel"
  | "sale:getAll"
  | "sale:getDetails"
  | "sale:getDailyTotal"
  | "sale:getWeeklyTotal"
  | "sale:getMonthlyTotal"
  | "sale:getCumulativeTotal"
  | "sale:getSalesByDateRange"
  | "sale:getDetailedReport"
  | "sale:getBestSellers"
  | "sale:getCumulative"
  | "sale:getSellerPerformance"
  | "sale:getCommissions"
  | "sale:exportCommissions"
  | "sale:exportReport"
  // Clients
  | "customer:add"
  | "customer:getAll"
  | "customer:getById"
  | "customer:getSales"
  | "customer:update"
  | "customer:delete"
  // Utilisateurs
  | "user:getAll"
  | "user:create"
  | "user:deactivate"
  | "user:login"
  | "user:logAction"
  // Audit
  | "audit:getLogs"
  | "audit:getUserLogs"
  // Base de données
  | "db:backup"
  | "db:restore"
  | "db:export-sql"
  // Unités
  | "units:list"
  | "units:find"
  | "units:scan";

export interface IElectronAPI {
  invoke<T = unknown>(
    channel: ValidChannel,
    ...args: unknown[]
  ): Promise<ApiResponse<T>>;
  on(channel: "navigate", callback: (path: string) => void): (() => void) | void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

export {};
