import { DiffResult } from "./diff";
import { db } from "../db";

export async function applyDbDeletes(diff: DiffResult) {
  if (diff.toDelete.length === 0) return;

  const ids = diff.toDelete.map((r) => r.row_id);

  const placeholders = ids.map(() => "?").join(",");

  await db.query(
    `DELETE FROM canonical_rows WHERE row_id IN (${placeholders})`,
    ids
  );
}
