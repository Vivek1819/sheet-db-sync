import { readSheet } from "../sheets/read";
import { normalizeSheetRows } from "../sheets/normalize";
import { getAllRows } from "../db/rows";
import { diffRows } from "./diff";
import { applySheetToDb } from "./applySheetToDb";
import { applyDbDeletes } from "./applyDeletes";
import { applyDbToSheet } from "./applyDbToSheet";

let isRunning = false;

export async function runSync() {
  if (isRunning) return;
  isRunning = true;

  try {
    const rawSheet = await readSheet();
    const sheetRows = normalizeSheetRows(rawSheet);
    const dbRows = await getAllRows();

    const diff = diffRows(sheetRows, dbRows);

    await applySheetToDb(diff);
    await applyDbDeletes(diff);
    await applyDbToSheet(diff.toUpdateSheet);
  } finally {
    isRunning = false;
  }
}
