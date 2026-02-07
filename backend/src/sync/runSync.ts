import { readSheet } from "../sheets/read";
import { normalizeSheetRows } from "../sheets/normalize";
import { getAllRows } from "../db/rows";
import { diffRows } from "./diff";
import { applySheetToDb } from "./applySheetToDb";
import { applyDbDeletes } from "./applyDeletes";
import { bumpSheetUpdatedAtIfNeeded } from "./bumpSheetUpdatedAt";
import { ensureMetadataColumns } from "../sheets/metadata";
import { writeMissingRowMetadata } from "../sheets/writeMetadata";
import { hideMetadataColumns } from "../sheets/hideMetadata";
import { reorderMetadataColumns } from "../sheets/reorderMetadata";
import { applyDbToSheet } from "./applyDbToSheet";

let isRunning = false;

export async function runSync() {
  if (isRunning) return;
  isRunning = true;

  try {

    await ensureMetadataColumns();
    await writeMissingRowMetadata();
    await hideMetadataColumns();
    await reorderMetadataColumns();

    // Phase 1: read + detect
    const raw1 = await readSheet();
    const sheet1 = normalizeSheetRows(raw1);
    const db1 = await getAllRows();

    // Phase 2: bump timestamps if needed
    await bumpSheetUpdatedAtIfNeeded(sheet1, db1);

    // Phase 3: re-read after bump
    const raw2 = await readSheet();
    const sheet2 = normalizeSheetRows(raw2);
    const db2 = await getAllRows();

    // Phase 4: apply diff
    const diff = diffRows(sheet2, db2);

    await applySheetToDb(diff);
    await applyDbDeletes(diff);
    await applyDbToSheet(diff.toUpdateSheet);
  } finally {
    isRunning = false;
  }
}
