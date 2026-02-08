import { Router } from "express";
import { db } from "../db";

const router = Router();

// GET /api/logs
router.get("/", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        // Use string interpolation for LIMIT to avoid "Incorrect arguments to mysqld_stmt_execute"
        // (mysql2 prepared statements can be finicky with LIMIT parameters)
        const [rows] = await db.query(
            `SELECT * FROM sync_logs ORDER BY id DESC LIMIT ${limit}`
        );
        res.json((rows as any[]).reverse()); // Send oldest first for terminal feel, or simplest
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
