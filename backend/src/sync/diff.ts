import { CanonicalRow } from "../types/row";

export type DiffResult = {
  toInsert: CanonicalRow[];
  toUpdate: CanonicalRow[];
  toDelete: CanonicalRow[];
  toUpdateSheet: CanonicalRow[];
};

export function diffRows(
  sheetRows: CanonicalRow[],
  dbRows: CanonicalRow[]
): DiffResult {
  const dbMap = new Map<string, CanonicalRow>();
  dbRows.forEach((r) => dbMap.set(r.row_id, r));

  const sheetMap = new Map<string, CanonicalRow>();
  sheetRows.forEach((r) => sheetMap.set(r.row_id, r));

  const toInsert: CanonicalRow[] = [];
  const toUpdate: CanonicalRow[] = [];
  const toDelete: CanonicalRow[] = [];
  const toUpdateSheet: CanonicalRow[] = [];

  // Sheet → DB (insert / update)
  for (const sheetRow of sheetRows) {
    const dbRow = dbMap.get(sheetRow.row_id);

    if (!dbRow) {
      toInsert.push(sheetRow);
      continue;
    }

    if (sheetRow.updated_at > dbRow.updated_at) {
      toUpdate.push(sheetRow); // Sheet → DB
    } else if (dbRow.updated_at > sheetRow.updated_at) {
      toUpdateSheet.push(dbRow); // DB → Sheet
    }
  }

  // DB → Sheet (delete)
  for (const dbRow of dbRows) {
    if (!sheetMap.has(dbRow.row_id)) {
      toDelete.push(dbRow);
    }
  }

  return { toInsert, toUpdate, toDelete, toUpdateSheet };
}
