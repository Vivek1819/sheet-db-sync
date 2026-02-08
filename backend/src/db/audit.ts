import { db } from "./index";

export type AuditType = "SYNC_START" | "SYNC_COMPLETE" | "INSERT" | "UPDATE" | "DELETE" | "SCHEMA" | "ERROR";

export async function logAudit(type: AuditType, message: string, details?: any) {
    try {
        // Fire and forget - don't await updates to avoid blocking main thread too mucn
        db.execute(
            "INSERT INTO sync_logs (type, message, details) VALUES (?, ?, ?)",
            [type, message, details ? JSON.stringify(details) : null]
        ).catch(err => console.error("Audit Log Failed:", err));

        // Also log to console for dev visibility
        console.log(`[AUDIT:${type}] ${message}`);
    } catch (err) {
        console.error("Audit Log Failed:", err);
    }
}
