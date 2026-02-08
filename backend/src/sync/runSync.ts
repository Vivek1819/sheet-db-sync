import { readSheet } from "../sheets/read";
import { normalizeSheetRows } from "../sheets/normalize";
import { getAllRows } from "../db/rows";
import { diffRows } from "./diff";
import { applySheetToDb } from "./applySheetToDb";
import { applyDbDeletes } from "./applyDeletes";
import { applyDbToSheet } from "./applyDbToSheet";
import { applyDbInsertToSheet } from "./applyDbInsertToSheet";
import { applyDbDeletesToSheet } from "./applyDbDeletesToSheet";
import { ensureMetadataColumns } from "../sheets/metadata";
import { writeMissingRowMetadata } from "../sheets/writeMetadata";
import { hideDeletedRowsInSheet } from "./applyDbDeletesVisibilityToSheet";
import { bumpSheetUpdatedAtIfNeeded } from "./bumpSheetUpdatedAt";

let isRunning = false;

export async function runSync() {
  if (isRunning) return;
  isRunning = true;

  try {
    // ─────────────
    // SCHEMA SYNC PHASE (New)
    // ─────────────
    // 1. Get all DB rows first to know what columns exist
    const dbRows = await getAllRows();

    // 2. Collect all unique keys from DB (excluding metadata)
    const allDbKeys = new Set<string>();
    dbRows.forEach(row => {
      Object.keys(row.data).forEach(key => allDbKeys.add(key));
    });

    // 3. Ensure these keys exist in Sheet Headers
    await ensureMetadataColumns(Array.from(allDbKeys));

    await writeMissingRowMetadata();

    // ─────────────
    // READ PHASE
    // ─────────────
    const sheetRows = normalizeSheetRows(await readSheet());

    // Ensure sheet edits get timestamps
    await bumpSheetUpdatedAtIfNeeded(sheetRows, dbRows);

    const sheetRowsAfter = normalizeSheetRows(await readSheet());

    // ─────────────
    // DIFF
    // ─────────────
    const diff = diffRows(sheetRowsAfter, dbRows);

    // ─────────────
    // APPLY
    // ─────────────

    // 1️⃣ Sheet → DB
    await applySheetToDb(diff);

    // 2️⃣ DB → Sheet INSERT
    const dbRowsAfter = await getAllRows();
    const sheetRowsFinal = normalizeSheetRows(await readSheet());

    const rowsToInsertIntoSheet = dbRowsAfter.filter(
      dbRow =>
        !dbRow.deleted_at &&
        !sheetRowsFinal.some(sheetRow => sheetRow.row_id === dbRow.row_id)
    );

    await applyDbInsertToSheet(rowsToInsertIntoSheet);

    // 3️⃣ DB → Sheet UPDATE
    await applyDbToSheet(diff.toUpdateSheet);

    // 4️⃣ DB → Sheet DELETE / VISIBILITY
    await applyDbDeletesToSheet(dbRowsAfter);
    await hideDeletedRowsInSheet();


  } catch (err) {
    console.error("[Sync] Error:", err);
  } finally {
    isRunning = false;
  }
}
