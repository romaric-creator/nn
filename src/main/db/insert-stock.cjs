const { db } = require("../db/database.cjs");

const products = [
  // Accessoires Laptop
  { category: "Accessoires Laptop", brand: "Divers", model: "Mini clavier", purchase_price: 2500, sale_price: 4000, stock: 15 },
  { category: "Accessoires Laptop", brand: "Divers", model: "Clavier Flexible", purchase_price: 3500, sale_price: 5000, stock: 8 },
  { category: "Accessoires Laptop", brand: "Divers", model: "Support Laptop", purchase_price: 3000, sale_price: 4500, stock: 10 },
  { category: "Accessoires Laptop", brand: "Divers", model: "Souris Bluetooth", purchase_price: 3500, sale_price: 5000, stock: 20 },
  { category: "Accessoires Laptop", brand: "Divers", model: "Souris brocante", purchase_price: 1500, sale_price: 2500, stock: 12 },
  { category: "Accessoires Laptop", brand: "Divers", model: "Webcam", purchase_price: 4000, sale_price: 6000, stock: 7 },
  { category: "Accessoires Laptop", brand: "Divers", model: "Connecteur RJ45", purchase_price: 1000, sale_price: 2000, stock: 25 },
  { category: "Accessoires Laptop", brand: "Divers", model: "OTG", purchase_price: 500, sale_price: 1000, stock: 30 },
  { category: "Accessoires Laptop", brand: "Divers", model: "Boîtier 3.0", purchase_price: 2500, sale_price: 4000, stock: 10 },
  { category: "Accessoires Laptop", brand: "Divers", model: "Boîtier 2.0", purchase_price: 1500, sale_price: 2500, stock: 8 },
  { category: "Accessoires Laptop", brand: "Divers", model: "Clé WiFi internet USB", purchase_price: 3500, sale_price: 5000, stock: 12 },
  { category: "Accessoires Laptop", brand: "Divers", model: "Testeur de câble réseau", purchase_price: 2000, sale_price: 3500, stock: 5 },

  // Chargeurs
  { category: "Chargeurs", brand: "Dell", model: "Petit bout", purchase_price: 3500, sale_price: 5000, stock: 15 },
  { category: "Chargeurs", brand: "Dell", model: "Gros bout", purchase_price: 4000, sale_price: 5500, stock: 10 },
  { category: "Chargeurs", brand: "Dell", model: "Type-C", purchase_price: 6000, sale_price: 8000, stock: 8 },
  { category: "Chargeurs", brand: "Dell", model: "Dell & Lenovo (petit bout)", purchase_price: 4000, sale_price: 5500, stock: 6 },
  { category: "Chargeurs", brand: "Lenovo", model: "Bout carré", purchase_price: 3500, sale_price: 5000, stock: 12 },
  { category: "Chargeurs", brand: "Lenovo", model: "Type-C", purchase_price: 5500, sale_price: 7500, stock: 8 },
  { category: "Chargeurs", brand: "HP", model: "Gros bout", purchase_price: 4000, sale_price: 5500, stock: 10 },
  { category: "Chargeurs", brand: "HP", model: "Bleu", purchase_price: 4500, sale_price: 6000, stock: 7 },
  { category: "Chargeurs", brand: "Acer", model: "Petit bout", purchase_price: 3000, sale_price: 4500, stock: 8 },
  { category: "Chargeurs", brand: "Acer", model: "Bout normal", purchase_price: 3500, sale_price: 5000, stock: 6 },
  { category: "Chargeurs", brand: "Asus", model: "Petit bout", purchase_price: 3000, sale_price: 4500, stock: 8 },
  { category: "Chargeurs", brand: "Asus", model: "Bout normal", purchase_price: 3500, sale_price: 5000, stock: 6 },
  { category: "Chargeurs", brand: "Toshiba", model: "Standard", purchase_price: 4000, sale_price: 5500, stock: 5 },
  { category: "Chargeurs", brand: "Samsung", model: "Standard", purchase_price: 4500, sale_price: 6000, stock: 5 },

  // Câbles et Adaptateurs
  { category: "Câbles et Adaptateurs", brand: "Divers", model: "Câble VGA", purchase_price: 1500, sale_price: 2500, stock: 20 },
  { category: "Câbles et Adaptateurs", brand: "Divers", model: "Câble Desktop", purchase_price: 2000, sale_price: 3000, stock: 15 },
  { category: "Câbles et Adaptateurs", brand: "Divers", model: "Câble HDMI", purchase_price: 2500, sale_price: 4000, stock: 25 },
  { category: "Câbles et Adaptateurs", brand: "Divers", model: "Câble DISPLAY", purchase_price: 3000, sale_price: 4500, stock: 12 },
  { category: "Câbles et Adaptateurs", brand: "Divers", model: "VGA vers HDMI", purchase_price: 2000, sale_price: 3500, stock: 15 },
  { category: "Câbles et Adaptateurs", brand: "Divers", model: "HDMI vers VGA", purchase_price: 2000, sale_price: 3500, stock: 15 },
  { category: "Câbles et Adaptateurs", brand: "Divers", model: "3 en 1 (Type-C / HDMI / USB)", purchase_price: 3000, sale_price: 4500, stock: 10 },
  { category: "Câbles et Adaptateurs", brand: "Divers", model: "Adaptateur USB réseau", purchase_price: 2500, sale_price: 4000, stock: 8 },
  { category: "Câbles et Adaptateurs", brand: "Divers", model: "Câble Laptop", purchase_price: 2000, sale_price: 3000, stock: 18 },
  { category: "Câbles et Adaptateurs", brand: "Divers", model: "Câble radio", purchase_price: 1500, sale_price: 2500, stock: 10 },
  { category: "Câbles et Adaptateurs", brand: "Divers", model: "Câble réseau", purchase_price: 1500, sale_price: 2500, stock: 30 },

  // Téléphones et Audio
  { category: "Téléphones et Audio", brand: "Apple", model: "AirPod", purchase_price: 15000, sale_price: 22000, stock: 10 },
  { category: "Téléphones et Audio", brand: "Oraimo", model: "Écouteur Oraimo", purchase_price: 4000, sale_price: 6000, stock: 25 },
  { category: "Téléphones et Audio", brand: "Apple", model: "Écouteur iPhone", purchase_price: 3000, sale_price: 5000, stock: 15 },
  { category: "Téléphones et Audio", brand: "Divers", model: "Écouteur Type-C", purchase_price: 2000, sale_price: 3500, stock: 20 },
  { category: "Téléphones et Audio", brand: "Divers", model: "Micro cravate avec fil", purchase_price: 2500, sale_price: 4000, stock: 8 },
  { category: "Téléphones et Audio", brand: "JBL", model: "Casque JBL", purchase_price: 12000, sale_price: 18000, stock: 5 },
  { category: "Téléphones et Audio", brand: "Divers", model: "Power Bank", purchase_price: 8000, sale_price: 12000, stock: 15 },
  { category: "Téléphones et Audio", brand: "Divers", model: "Boîtier Type-C 3A", purchase_price: 2000, sale_price: 3500, stock: 12 },
  { category: "Téléphones et Audio", brand: "Divers", model: "Cordon USB Type-C 2A", purchase_price: 1000, sale_price: 2000, stock: 40 },
  { category: "Téléphones et Audio", brand: "Divers", model: "Cordon USB Android 2A", purchase_price: 800, sale_price: 1500, stock: 50 },
  { category: "Téléphones et Audio", brand: "Divers", model: "Cordon USB iPhone 2A", purchase_price: 1500, sale_price: 2500, stock: 30 },
  { category: "Téléphones et Audio", brand: "Divers", model: "Cordon Type-C vers Type-C", purchase_price: 2000, sale_price: 3500, stock: 25 },
  { category: "Téléphones et Audio", brand: "Divers", model: "Cordon Type-C vers iPhone", purchase_price: 2500, sale_price: 4000, stock: 20 },
  { category: "Téléphones et Audio", brand: "Oraimo", model: "Chargeur Oraimo Fast Type-C", purchase_price: 3500, sale_price: 5000, stock: 15 },
  { category: "Téléphones et Audio", brand: "Oraimo", model: "Chargeur Oraimo Fast iPhone", purchase_price: 3500, sale_price: 5000, stock: 12 },
  { category: "Téléphones et Audio", brand: "Oraimo", model: "Chargeur Oraimo Fast Android", purchase_price: 3000, sale_price: 4500, stock: 15 },

  // Gaming
  { category: "Gaming", brand: "Divers", model: "Manette PC", purchase_price: 4000, sale_price: 6000, stock: 8 },
  { category: "Gaming", brand: "Sony", model: "Manette PS3", purchase_price: 5000, sale_price: 7000, stock: 5 },
  { category: "Gaming", brand: "Sony", model: "Manette PS4", purchase_price: 8000, sale_price: 12000, stock: 4 },
  { category: "Gaming", brand: "Sony", model: "Manette PS2", purchase_price: 3000, sale_price: 4500, stock: 6 },
  { category: "Gaming", brand: "Canal+", model: "Télécommande Canal+", purchase_price: 4000, sale_price: 6000, stock: 5 },
  { category: "Gaming", brand: "Divers", model: "Télécommande LED TV", purchase_price: 2000, sale_price: 3500, stock: 10 },
  { category: "Gaming", brand: "Grundig", model: "Télécommande Grundig", purchase_price: 2500, sale_price: 4000, stock: 4 },
  { category: "Gaming", brand: "Hisense", model: "Télécommande Hisense", purchase_price: 2500, sale_price: 4000, stock: 4 },
  { category: "Gaming", brand: "Digisat", model: "Télécommande Digisat", purchase_price: 3000, sale_price: 4500, stock: 3 },
  { category: "Gaming", brand: "Innova", model: "Télécommande Innova", purchase_price: 2500, sale_price: 4000, stock: 4 },
  { category: "Gaming", brand: "Divers", model: "Télécommande Universelle", purchase_price: 3500, sale_price: 5000, stock: 8 },

  // Batteries et Piles
  { category: "Batteries et Piles", brand: "Divers", model: "Pile CMOS (2032 - 2025)", purchase_price: 500, sale_price: 1000, stock: 50 },
  { category: "Batteries et Piles", brand: "Divers", model: "Pile 9 Volts", purchase_price: 1000, sale_price: 2000, stock: 30 },
  { category: "Batteries et Piles", brand: "Duracell", model: "Piles Duracell", purchase_price: 2000, sale_price: 3500, stock: 25 },
  { category: "Batteries et Piles", brand: "Kodak", model: "Piles Kodak", purchase_price: 1500, sale_price: 2500, stock: 15 },
  { category: "Batteries et Piles", brand: "Toceba", model: "Piles Toceba", purchase_price: 1000, sale_price: 2000, stock: 20 },
  { category: "Batteries et Piles", brand: "Divers", model: "LR1130", purchase_price: 300, sale_price: 600, stock: 60 },
  { category: "Batteries et Piles", brand: "Divers", model: "LR44", purchase_price: 300, sale_price: 600, stock: 60 },
  { category: "Batteries et Piles", brand: "Divers", model: "LR626", purchase_price: 300, sale_price: 600, stock: 50 },
  { category: "Batteries et Piles", brand: "Divers", model: "LR41W", purchase_price: 300, sale_price: 600, stock: 40 },
  { category: "Batteries et Piles", brand: "iTel", model: "Batterie iTel 2500 mAh", purchase_price: 2500, sale_price: 4000, stock: 10 },
  { category: "Batteries et Piles", brand: "iTel", model: "Batterie iTel 1500 mAh", purchase_price: 2000, sale_price: 3500, stock: 8 },
  { category: "Batteries et Piles", brand: "Divers", model: "Li-ion 3.8V (12.16Wh)", purchase_price: 5000, sale_price: 7000, stock: 5 },
  { category: "Batteries et Piles", brand: "Tecno", model: "Petite batterie Tecno", purchase_price: 2500, sale_price: 4000, stock: 8 },

  // Outillage
  { category: "Outillage", brand: "Divers", model: "Multimètre", purchase_price: 5000, sale_price: 8000, stock: 6 },
];

const stmt = db.prepare(`
  INSERT INTO products (category, brand, model, purchase_price, sale_price, stock, entry_date)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
`);

let count = 0;
for (const p of products) {
  stmt.run(p.category, p.brand, p.model, p.purchase_price, p.sale_price, p.stock);
  count++;
}

stmt.finalize(() => {
  console.log(`${count} produits insérés dans la base de données`);
  process.exit(0);
});