-- Fichier de données de base (Seed)
-- Remarque : La suppression et création de table ont été adaptées à SQLite et 
-- intègrent les colonnes nécessaires au fonctionnement de l'application (prix, etc.).

DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL CHECK(category IN (
        'Ordinateur Portable', 
        'Ordinateur Fixe', 
        'Tablette', 
        'Stockage', 
        'Périphérique', 
        'Audio', 
        'Logiciel', 
        'Composant', 
        'Accessoire', 
        'Écran', 
        'Smartphone'
    )),
    model TEXT NOT NULL,
    state TEXT NOT NULL CHECK(state IN ('Neuf', 'Occasion')),
    stock INTEGER DEFAULT 0,
    -- Colonnes supplémentaires requises par l'application (issues de schema.sql)
    brand TEXT,
    purchase_price REAL,
    sale_price REAL,
    min_sale_price REAL,
    entry_date TEXT,
    cpu TEXT,
    ram TEXT,
    gpu TEXT,
    storage TEXT,
    min_stock INTEGER DEFAULT 2,
    is_deleted INTEGER DEFAULT 0
);

-- Insertion des données d'inventaire complètes

-- ORDINATEUR PORTABLE
INSERT INTO products (category, model, state, stock) VALUES 
('Ordinateur Portable', 'Dell 14 pouces', 'Occasion', 4),
('Ordinateur Portable', 'Dell 15 pouces', 'Occasion', 2),
('Ordinateur Portable', 'Macbook 2017 13.3"', 'Occasion', 2),
('Ordinateur Portable', 'Macbook 2020 13.3"', 'Occasion', 1),
('Ordinateur Portable', 'Macbook 2015', 'Occasion', 1),
('Ordinateur Portable', 'Laptop Medion 15"', 'Occasion', 1),
('Ordinateur Portable', 'Laptop Fujitsu', 'Occasion', 1),
('Ordinateur Portable', 'Laptop HP Compaq', 'Occasion', 1),
('Ordinateur Portable', 'Laptop Asus', 'Occasion', 1);

-- ORDINATEUR FIXE
INSERT INTO products (category, model, state, stock) VALUES 
('Ordinateur Fixe', 'Mini Desktop', 'Occasion', 1);

-- ÉCRAN
INSERT INTO products (category, model, state, stock) VALUES 
('Écran', 'Moniteur 17 pouces', 'Occasion', 4),
('Écran', 'Moniteur 19 pouces', 'Occasion', 4),
('Écran', 'Moniteur 24 pouces (Sans bordures)', 'Neuf', 2),
('Écran', 'Moniteur 24 pouces', 'Occasion', 2),
('Écran', 'Combo TV', 'Occasion', 3);

-- STOCKAGE
INSERT INTO products (category, model, state, stock) VALUES 
('Stockage', 'HDD 120 Go', 'Occasion', 0),
('Stockage', 'HDD 250 Go', 'Occasion', 0),
('Stockage', 'HDD 320 Go', 'Occasion', 0),
('Stockage', 'HDD 500 Go', 'Occasion', 0),
('Stockage', 'HDD 1 To', 'Occasion', 0),
('Stockage', 'SSD 2.5" 120 Go', 'Neuf', 0),
('Stockage', 'SSD 2.5" 256 Go', 'Neuf', 0),
('Stockage', 'SSD 2.5" 512 Go', 'Neuf', 0),
('Stockage', 'SSD 2.5" 1 To', 'Neuf', 0),
('Stockage', 'SSD M.2 128 Go', 'Neuf', 0),
('Stockage', 'SSD M.2 256 Go', 'Neuf', 0),
('Stockage', 'SSD M.2 512 Go', 'Neuf', 0),
('Stockage', 'Clé USB 4 Go', 'Neuf', 2),
('Stockage', 'Clé USB 8 Go', 'Neuf', 4),
('Stockage', 'Clé USB 16 Go', 'Neuf', 2),
('Stockage', 'Clé USB 32 Go', 'Neuf', 2),
('Stockage', 'Clé USB 64 Go', 'Neuf', 3),
('Stockage', 'Boîtier Disque Dur 2.0', 'Neuf', 1),
('Stockage', 'Boîtier Disque Dur 3.0', 'Neuf', 2);

-- PÉRIPHÉRIQUE
INSERT INTO products (category, model, state, stock) VALUES 
('Périphérique', 'Mini Clavier', 'Neuf', 1),
('Périphérique', 'Clavier Flexible', 'Neuf', 3),
('Périphérique', 'Souris Bluetooth', 'Neuf', 9),
('Périphérique', 'Souris Brocante', 'Occasion', 6),
('Périphérique', 'Souris Gaming', 'Neuf', 1),
('Périphérique', 'Souris HP (Neuve)', 'Neuf', 2),
('Périphérique', 'Souris Lenovo (Neuve)', 'Neuf', 1),
('Périphérique', 'Souris Vrac', 'Occasion', 3),
('Périphérique', 'Support Laptop', 'Neuf', 10),
('Périphérique', 'Webcam', 'Neuf', 0),
('Périphérique', 'Clé WiFi (Antenne)', 'Neuf', 1),
('Périphérique', 'Clé WiFi (Bluetooth/Sans antenne)', 'Neuf', 2),
('Périphérique', 'Testeur de câble Réseau', 'Neuf', 2),
('Périphérique', 'Protection Clavier', 'Neuf', 1),
('Périphérique', 'Manette PC / PS2', 'Neuf', 2),
('Périphérique', 'Manette PS3', 'Occasion', 1),
('Périphérique', 'Manette PS4', 'Neuf', 4),
('Périphérique', 'Télécommande Canal+', 'Neuf', 1),
('Périphérique', 'Télécommande LED TV', 'Neuf', 4),
('Périphérique', 'Télécommande Digisat', 'Neuf', 1),
('Périphérique', 'Télécommande Universelle', 'Neuf', 2),
('Périphérique', 'Télécommande Grundig', 'Neuf', 1),
('Périphérique', 'Télécommande Hisense', 'Neuf', 2);

-- COMPOSANT
INSERT INTO products (category, model, state, stock) VALUES 
('Composant', 'Connecteur RJ45', 'Neuf', 77),
('Composant', 'Carte Graphique', 'Occasion', 4),
('Composant', 'RAM Laptop PC4 4 Go', 'Occasion', 0),
('Composant', 'RAM Laptop PC4 8 Go', 'Occasion', 0),
('Composant', 'RAM Laptop PC4 16 Go', 'Occasion', 0),
('Composant', 'RAM Laptop PC3 4 Go', 'Occasion', 0),
('Composant', 'RAM Laptop PC3 8 Go', 'Occasion', 0),
('Composant', 'RAM Laptop PC3 16 Go', 'Occasion', 0),
('Composant', 'RAM Desktop PC4 4 Go', 'Occasion', 0),
('Composant', 'RAM Desktop PC4 8 Go', 'Occasion', 0),
('Composant', 'RAM Desktop PC4 16 Go', 'Occasion', 0),
('Composant', 'RAM Desktop PC3 4 Go', 'Occasion', 0),
('Composant', 'RAM Desktop PC3 8 Go', 'Occasion', 0),
('Composant', 'RAM Desktop PC3 16 Go', 'Occasion', 0);

-- AUDIO
INSERT INTO products (category, model, state, stock) VALUES 
('Audio', 'Écouteurs Oraimo', 'Neuf', 1),
('Audio', 'Écouteurs iPhone Type-C', 'Neuf', 2),
('Audio', 'Écouteurs Autres', 'Neuf', 1),
('Audio', 'Casque JBL', 'Occasion', 1),
('Audio', 'Micro Cravate (Avec fil)', 'Neuf', 0);

-- ACCESSOIRE (Chargeurs, Câbles, Piles)
INSERT INTO products (category, model, state, stock) VALUES 
('Accessoire', 'Chargeur DELL (Petit bout)', 'Occasion', 4),
('Accessoire', 'Chargeur DELL (Gros bout)', 'Occasion', 1),
('Accessoire', 'Chargeur DELL GB (6A)', 'Occasion', 3),
('Accessoire', 'Chargeur DELL GB (9A)', 'Occasion', 5),
('Accessoire', 'Chargeur DELL USB', 'Occasion', 1),
('Accessoire', 'Chargeur LENOVO (Bout carré)', 'Occasion', 4),
('Accessoire', 'Chargeur LENOVO (Type-C)', 'Neuf', 4),
('Accessoire', 'Chargeur HP (Gros bout)', 'Occasion', 6),
('Accessoire', 'Chargeur HP (Bout bleu)', 'Occasion', 8),
('Accessoire', 'Chargeur ACER (Petit bout)', 'Occasion', 3),
('Accessoire', 'Chargeur ACER (Normal)', 'Occasion', 3),
('Accessoire', 'Chargeur ASUS (Petit bout)', 'Occasion', 3),
('Accessoire', 'Chargeur TOSHIBA', 'Occasion', 7),
('Accessoire', 'Chargeur SAMSUNG', 'Occasion', 2),
('Accessoire', 'Chargeur Xiaomi 120W', 'Neuf', 2),
('Accessoire', 'Chargeur Huawei 88W', 'Neuf', 1),
('Accessoire', 'Chargeur Sony', 'Occasion', 2),
('Accessoire', 'Chargeur Surface Pro', 'Occasion', 1),
('Accessoire', 'Chargeur 5G 85W', 'Neuf', 1),
('Accessoire', 'Chargeur 12V', 'Neuf', 4),
('Accessoire', 'Câble HDMI 1,5m', 'Neuf', 5),
('Accessoire', 'Câble HDMI 3m', 'Neuf', 2),
('Accessoire', 'Câble HDMI 5m', 'Neuf', 1),
('Accessoire', 'Câble VGA', 'Occasion', 9),
('Accessoire', 'Câble Display Port', 'Neuf', 2),
('Accessoire', 'Adaptateur HDMI vers VGA', 'Neuf', 4),
('Accessoire', 'Adaptateur VGA vers HDMI', 'Neuf', 2),
('Accessoire', 'Adaptateur 3-en-1 Type-C', 'Neuf', 1),
('Accessoire', 'Adaptateur USB vers Réseau', 'Neuf', 1),
('Accessoire', 'Câble Alimentation (Original)', 'Neuf', 5),
('Accessoire', 'Câble Alimentation (Copie)', 'Neuf', 10),
('Accessoire', 'Rallonge PowerMax', 'Neuf', 3),
('Accessoire', 'Piles CMOS 2032/2025', 'Neuf', 19),
('Accessoire', 'Piles 9V Duracell', 'Neuf', 5),
('Accessoire', 'Piles Boutons LR44', 'Neuf', 5),
('Accessoire', 'Piles Boutons LR626', 'Neuf', 3),
('Accessoire', 'Piles Toceba PM', 'Neuf', 52),
('Accessoire', 'Piles Toceba GM', 'Neuf', 7),
('Accessoire', 'Multimètre', 'Neuf', 8),
('Accessoire', 'Power Bank 10000 mAh', 'Neuf', 1),
('Accessoire', 'Power Bank 20000 mAh', 'Neuf', 1),
('Accessoire', 'Cordon USB Type-C (2A)', 'Neuf', 3),
('Accessoire', 'Chargeur Oraimo Fast Type-C', 'Neuf', 5);
