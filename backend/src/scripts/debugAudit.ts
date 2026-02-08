import { db } from "../db";
import { logAudit } from "../db/audit";

async function checkLogs() {
    try {
        // 1. Check existing logs
        const [rows] = await db.execute("SELECT * FROM sync_logs");
        console.log("Current Log Count:", (rows as any[]).length);
        console.log("Last 3 Logs:", (rows as any[]).slice(-3));

        // 2. Try inserting a test log
        console.log("Attempting to insert test log...");
        await logAudit("SYNC_START", "Test log from debug script");

        // 3. Check again
        const [rowsAfter] = await db.execute("SELECT * FROM sync_logs");
        console.log("New Log Count:", (rowsAfter as any[]).length);

    } catch (err) {
        console.error("Debug Script Failed:", err);
    } finally {
        process.exit();
    }
}

checkLogs();
