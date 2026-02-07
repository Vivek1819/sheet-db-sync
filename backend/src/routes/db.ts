import { Router } from "express";
import { insertRow, updateCell, deleteRow } from "../db/rows";

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
    const { row_id } = req.params;
    await deleteRow(row_id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
