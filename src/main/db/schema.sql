-- Schéma SQLite pour Flexy Store

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  login TEXT UNIQUE NOT NULL,
  hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'vendeur')),
  active INTEGER DEFAULT 1,
  commission_percent REAL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT,
  brand TEXT,
  model TEXT,
  state TEXT,
  purchase_price REAL, -- Dernier prix d'achat
  sale_price REAL,
  min_sale_price REAL,
  entry_date TEXT,
  cpu TEXT,
  ram TEXT,
  gpu TEXT,
  storage TEXT,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 2, -- Seuil d'alerte
  is_deleted INTEGER DEFAULT 0, -- 0 = non supprimé, 1 = supprimé logiquement
  remarque TEXT
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT
);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER,
  date TEXT NOT NULL,
  total_amount REAL,
  status TEXT DEFAULT 'completed',
  FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  unit_cost REAL,
  FOREIGN KEY(purchase_id) REFERENCES purchases(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS customers (
-- ... reste inchangé

  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  phone TEXT
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  user_id INTEGER,
  customer_id INTEGER,
  total REAL,
  payment_method TEXT,
  payment_provider TEXT,
  transaction_id TEXT,
  discount REAL DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  price REAL,
  FOREIGN KEY(sale_id) REFERENCES sales(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  date TEXT,
  type TEXT CHECK(type IN ('in', 'out', 'defective')),
  quantity INTEGER,
  user_id INTEGER,
  note TEXT,
  FOREIGN KEY(product_id) REFERENCES products(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Table pour stocker les unités physiques (par numéro de série / unité)
CREATE TABLE IF NOT EXISTS product_units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  purchase_id INTEGER,
  purchase_item_id INTEGER,
  serial_number TEXT UNIQUE,
  purchase_price REAL,
  additional_costs REAL DEFAULT 0,
  warranty_months INTEGER DEFAULT 12,
  warranty_expiry TEXT,
  status TEXT DEFAULT 'in' CHECK(status IN ('in','sold','defective','reserved')),
  created_at TEXT DEFAULT (datetime('now')),
  sale_id INTEGER,
  sale_item_id INTEGER,
  FOREIGN KEY(product_id) REFERENCES products(id),
  FOREIGN KEY(purchase_id) REFERENCES purchases(id),
  FOREIGN KEY(purchase_item_id) REFERENCES purchase_items(id),
  FOREIGN KEY(sale_id) REFERENCES sales(id),
  FOREIGN KEY(sale_item_id) REFERENCES sale_items(id)
);

-- Table d'audit global pour modifications critiques (prix, libellé, etc.)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  entity TEXT,           -- Table concernée (ex: 'products', 'sales')
  entity_id INTEGER,     -- ID de l'enregistrement concerné
  action TEXT,           -- Type d'action (ex: 'update', 'delete', 'sale')
  old_value TEXT,        -- Ancienne valeur (JSON)
  new_value TEXT,        -- Nouvelle valeur (JSON)
  timestamp TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Table d'audit pour les modifications de prix des articles de vente
CREATE TABLE IF NOT EXISTS price_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_item_id INTEGER NOT NULL,
  user_id INTEGER,
  original_price REAL,
  modified_price REAL,
  reason TEXT,
  timestamp TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(sale_item_id) REFERENCES sale_items(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date TEXT NOT NULL,
  customer_id INTEGER,
  total_amount REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  payment_method TEXT,
  status TEXT DEFAULT 'paid' CHECK(status IN ('paid', 'pending', 'cancelled')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(sale_id) REFERENCES sales(id),
  FOREIGN KEY(customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  item_total REAL NOT NULL,
  FOREIGN KEY(invoice_id) REFERENCES invoices(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

-- === INDICES POUR OPTIMISATION REQUETES ===

-- Recherche rapide par date (rapports, statistiques)
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);

-- Recherche par client
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);

-- Recherche par utilisateur (audit, commissions)
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_user ON user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_price_audit_user ON price_audit_logs(user_id);

-- Recherche stock par produit
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_product_units_product ON product_units(product_id);

-- Recherche factures par vente
CREATE INDEX IF NOT EXISTS idx_invoices_sale ON invoices(sale_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Recherche articles de vente
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
