import express from "express";
import { env } from "./config/env";
import { db } from "./db";
import { readSheet } from "./sheets/read";
import { normalizeSheetRows } from "./sheets/normalize";
import { upsertRows, getAllRows } from "./db/rows";
import { ensureMetadataColumns } from "./sheets/metadata";
import { writeMissingRowMetadata } from "./sheets/writeMetadata";
import { diffRows } from "./sync/diff";
import { applySheetToDb } from "./sync/applySheetToDb";
import { bumpSheetUpdatedAtIfNeeded } from "./sync/bumpSheetUpdatedAt";
import { applyDbDeletes } from "./sync/applyDeletes";
import { runSync } from "./sync/runSync";

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

setInterval(() => {
  runSync().catch(console.error);
}, 60_000);


app.get("/sheet", async (_, res) => {
  try {
    await ensureMetadataColumns();
    await writeMissingRowMetadata();

    const rawRows = await readSheet();
    const normalized = normalizeSheetRows(rawRows);

    await upsertRows(normalized);
    const dbRows = await getAllRows();

    res.json({ source: "db", rows: dbRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to sync sheet to DB" });
  }
});

app.get("/diff", async (_, res) => {
  try {
    const rawRows = await readSheet();
    const sheetRows = normalizeSheetRows(rawRows);
    const dbRows = await getAllRows();

    const diff = diffRows(sheetRows, dbRows);
    res.json(diff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to diff rows" });
  }
});

app.post("/sync/sheet-to-db", async (_, res) => {
  try {
    const rawRows1 = await readSheet();
    const sheetRows1 = normalizeSheetRows(rawRows1);
    const dbRows1 = await getAllRows();

    await bumpSheetUpdatedAtIfNeeded(sheetRows1, dbRows1);

    const rawRows2 = await readSheet();
    const sheetRows2 = normalizeSheetRows(rawRows2);
    const dbRows2 = await getAllRows();

    const diff = diffRows(sheetRows2, dbRows2);
    await applySheetToDb(diff);
    await applyDbDeletes(diff);

    res.json({ applied: diff });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sheet → DB sync failed" });
  }
});
