const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

const dbPath = path.join(app.getPath('userData'), 'inventory.db');
const schemaPath = path.join(__dirname, 'schema.sql');
let dbInstance = null;

function initDbConnection() {
    if (!dbInstance) {
        dbInstance = new Database(dbPath, { verbose: console.log });
        dbInstance.pragma('journal_mode = WAL');
    }
    return dbInstance;
}

async function initDb(db, schema) {
    // Ton code d'initialisation de table ici...
}

module.exports = { 
    initDbConnection, 
    initDb, 
    dbPath, 
    schemaPath 
};
