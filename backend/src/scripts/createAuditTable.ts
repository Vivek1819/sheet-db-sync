import { db } from "../db";

async function createAuditTable() {
    const schema = `
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      type VARCHAR(20) NOT NULL,
      message TEXT NOT NULL,
      details JSON
    )
  `;

    try {
        await db.execute(schema);
        console.log("✅ Audit table 'sync_logs' created/verified.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create audit table:", err);
        process.exit(1);
    }
}

createAuditTable();
