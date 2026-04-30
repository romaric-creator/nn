const path = require("path");
const fs = require("fs");
const { createDbConnection, initDb, schemaPath } = require("../src/main/db/database.cjs");

const TEST_DB_DIR = path.join(__dirname, "../temp_test_db");
const TEST_DB_PATH = path.join(TEST_DB_DIR, "test_inventory.db");

let testDbInstance = null;

async function setupTestDb() {
  // Ensure the test DB directory exists
  if (!fs.existsSync(TEST_DB_DIR)) {
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
  }

  // Clean up previous test DB if it exists
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  // Create and initialize a new database instance for the test
  testDbInstance = createDbConnection(TEST_DB_PATH);
  await initDb(testDbInstance, schemaPath);
  return testDbInstance;
}

async function teardownTestDb() {
  if (testDbInstance) {
    await new Promise((resolve, reject) => {
      testDbInstance.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    testDbInstance = null;
  }
  // Clean up the test DB file
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

// Export the functions for use in test files
module.exports = { setupTestDb, teardownTestDb, TEST_DB_PATH };