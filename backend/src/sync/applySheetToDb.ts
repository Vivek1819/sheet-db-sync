import { CanonicalRow } from "../types/row";
import { upsertRows, getAllRows } from "../db/rows";
import { DiffResult } from "./diff";

export async function applySheetToDb(diff: DiffResult) {
  if (diff.toInsert.length === 0 && diff.toUpdate.length === 0) return;

  const dbRows = await getAllRows();
  const dbMap = new Map(dbRows.map(r => [r.row_id, r]));

  // Inserts are always safe
  for (const row of diff.toInsert) {
    await upsertRows([row]);
  }

  // Updates must be guarded
  for (const row of diff.toUpdate) {
    const dbRow = dbMap.get(row.row_id);
    if (!dbRow) continue;

    // 🚨 Critical protection
    if (row.updated_at > dbRow.updated_at) {
      await upsertRows([row]);
    }
  }
}
