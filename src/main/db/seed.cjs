const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

// --- CONFIGURATION CHEMIN ---
const dbPath = path.join(process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.config"), "it-manager-desktop", "inventory.db");
const db = new sqlite3.Database(dbPath);

const run = (sql, params = []) => new Promise((res, rej) => db.run(sql, params, function(err) { err ? rej(err) : res(this); }));
const get = (sql, params = []) => new Promise((res, rej) => db.get(sql, params, (err, row) => err ? rej(err) : res(row)));
const all = (sql, params = []) => new Promise((res, rej) => db.all(sql, params, (err, rows) => err ? rej(err) : res(rows)));

async function massiveSeed() {
    try {
        console.log("🚀 Lancement du seed massif...");
        await run("PRAGMA foreign_keys = OFF"); // On coupe temporairement pour le clean rapide

        const tables = ["product_units", "stock_movements", "sale_items", "sales", "purchase_items", "purchases", "products", "suppliers", "customers", "users"];
        for (const t of tables) {
            await run(`DELETE FROM ${t}`);
            await run(`DELETE FROM sqlite_sequence WHERE name='${t}'`);
        }

        await run("PRAGMA foreign_keys = ON");

        // 1. UTILISATEURS & FOURNISSEURS
        const hash = await bcrypt.hash("pass123", 10);
        const adminId = (await run("INSERT INTO users (name, login, hash, role) VALUES (?,?,?,?)", ["Boss", "admin", hash, "admin"])).lastID;
        const vendeurIds = [];
        for(let i=1; i<=3; i++) {
            const res = await run("INSERT INTO users (name, login, hash, role, commission_percent) VALUES (?,?,?,?,?)", [`Vendeur ${i}`, `vendeur${i}`, hash, "vendeur", 5+i]);
            vendeurIds.push(res.lastID);
        }

        const supplierIds = [];
        const supps = ["Alpha Tech", "Global IT", "Direct Connect", "Smart Solutions", "Electro Hub"];
        for(const s of supps) {
            const res = await run("INSERT INTO suppliers (name, phone) VALUES (?,?)", [s, "+2376000000" + Math.floor(Math.random()*99)]);
            supplierIds.push(res.lastID);
        }

        // 2. PRODUITS (30 modèles)
        console.log("📦 Génération des produits...");
        const brands = ["HP", "Dell", "Lenovo", "Apple", "Asus", "Logitech"];
        const cats = ["Laptop", "Desktop", "Accessoire", "Ecran"];
        const productIds = [];
        for(let i=0; i<30; i++) {
            const brand = brands[i % brands.length];
            const pPrice = 50000 + (Math.random() * 500000);
            const sPrice = pPrice * 1.25;
            const res = await run(
                `INSERT INTO products (brand, model, category, state, purchase_price, sale_price, min_sale_price, stock, min_stock)
                 VALUES (?, ?, ?, 'Neuf', ?, ?, ?, 0, 5)`,
                [brand, `${brand} Model-${i}`, cats[i % cats.length], pPrice, sPrice, sPrice * 0.95]
            );
            productIds.push(res.lastID);
        }

        // 3. ACHATS (Massif)
        console.log("🛒 Remplissage des stocks...");
        for(let i=0; i<80; i++) {
            const date = new Date(Date.now() - (Math.random() * 180 * 24 * 3600 * 1000)).toISOString();
            const pRes = await run("INSERT INTO purchases (supplier_id, date, status) VALUES (?,?,?)",
                [supplierIds[i % supplierIds.length], date, 'completed']);

            const prodId = productIds[Math.floor(Math.random() * productIds.length)];
            const qty = 10 + Math.floor(Math.random() * 20);

            const piRes = await run("INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost) VALUES (?,?,?,?)",
                [pRes.lastID, prodId, qty, 100000]);

            for(let j=0; j<qty; j++) {
                await run("INSERT INTO product_units (product_id, purchase_id, purchase_item_id, serial_number, status) VALUES (?,?,?,?,?)",
                    [prodId, pRes.lastID, piRes.lastID, `SN-${i}-${j}-${Math.random().toString(36).substr(2,5)}`, 'in']);
            }
            // Update stock manuel (si pas de trigger)
            await run("UPDATE products SET stock = stock + ? WHERE id = ?", [qty, prodId]);
        }

        // 4. CLIENTS (50)
        const customerIds = [];
        for(let i=0; i<50; i++) {
            const res = await run("INSERT INTO customers (name, phone) VALUES (?,?)", [`Client ${i}`, `6${Math.floor(Math.random()*99999999)}`]);
            customerIds.push(res.lastID);
        }

        // 5. VENTES (300 transactions)
        console.log("💰 Simulation de 300 ventes...");
        for(let i=0; i<300; i++) {
            const date = new Date(Date.now() - (Math.random() * 120 * 24 * 3600 * 1000)).toISOString();
            const sellerId = vendeurIds[i % vendeurIds.length];
            const custId = customerIds[i % customerIds.length];

            const sRes = await run("INSERT INTO sales (date, user_id, customer_id, payment_method, total) VALUES (?,?,?,?,?)",
                [date, sellerId, custId, 'Espèces', 0]);

            // Chaque vente a 1 à 3 articles
            let totalVente = 0;
            const nbItems = Math.floor(Math.random() * 3) + 1;

            for(let k=0; k<nbItems; k++) {
                const prod = await get("SELECT id, sale_price FROM products WHERE stock > 0 ORDER BY RANDOM() LIMIT 1");
                if(!prod) continue;

                const unit = await get("SELECT id FROM product_units WHERE product_id = ? AND status = 'in' LIMIT 1", [prod.id]);
                if(!unit) continue;

                const siRes = await run("INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?,?,?,?)",
                    [sRes.lastID, prod.id, 1, prod.sale_price]);

                await run("UPDATE product_units SET status = 'sold', sale_id = ?, sale_item_id = ? WHERE id = ?",
                    [sRes.lastID, siRes.lastID, unit.id]);

                await run("UPDATE products SET stock = stock - 1 WHERE id = ?", [prod.id]);
                totalVente += prod.sale_price;
            }
            await run("UPDATE sales SET total = ? WHERE id = ?", [totalVente, sRes.lastID]);
        }

        console.log("✅ Terminé ! Base de données prête pour les tests de performance.");
    } catch (e) { console.error("❌ Erreur:", e); }
    finally { db.close(); }
}

massiveSeed();
