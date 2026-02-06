import express from "express";
import { env } from "./config/env";
import { db } from "./db";
import { readSheet } from "./sheets/read";
import { normalizeSheetRows } from "./sheets/normalize";
import { upsertRows, getAllRows } from "./db/rows";

const app = express();
app.use(express.json());

app.get("/health", async (_, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

app.listen(env.port, () => {
  console.log(`Backend running on port ${env.port}`);
});

app.get("/sheet", async (_, res) => {
  try {
    const rawRows = await readSheet();
    const normalized = normalizeSheetRows(rawRows);

    await upsertRows(normalized);

    const dbRows = await getAllRows();

    res.json({
      source: "db",
      rows: dbRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to sync sheet to DB" });
  }
});