import { Router } from "express";
import { insertRow, updateCell, softDeleteRow, getAllRows } from "../db/rows";
import { ensureMetadataColumns } from "../sheets/metadata";

const router = Router();

// Insert new row
router.post("/rows", async (req, res) => {
    try {
        const { data } = req.body;
        if (!data || typeof data !== "object") {
            return res.status(400).json({ error: "Invalid data" });
        }

        const row = await insertRow(data);
        res.json(row);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Update single cell
router.patch("/rows/:row_id", async (req, res) => {
    try {
        const { column, value } = req.body;
        const { row_id } = req.params;

        if (!column) {
            return res.status(400).json({ error: "Column required" });
        }

        const row = await updateCell(row_id, column, value);
        res.json(row);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Delete row
router.delete("/rows/:row_id", async (req, res) => {
    try {
        await softDeleteRow(req.params.row_id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get all rows
router.get("/rows", async (_req, res) => {
    try {
        const rows = await getAllRows();
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Add New Column (Schema Change)
router.post("/columns", async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== "string") {
            return res.status(400).json({ error: "Column name required" });
        }

        // Force Metadata Update immediately
        await ensureMetadataColumns([name]);

        // Trigger sync immediately to propagate update if needed? 
        // Not strictly necessary, but helpful.
        // However, ensureMetadataColumns already touches the Sheet.

        res.json({ success: true, column: name });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
