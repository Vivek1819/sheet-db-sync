import { db } from "./index";
import { CanonicalRow } from "../types/row";

export async function upsertRows(rows: CanonicalRow[]) {
  for (const row of rows) {
    await db.query(
      `
      INSERT INTO canonical_rows (row_id, updated_at, data)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        updated_at = VALUES(updated_at),
        data = VALUES(data)
      `,
      [row.row_id, row.updated_at, JSON.stringify(row.data)]
    );
  }
}

export async function getAllRows(): Promise<CanonicalRow[]> {
  const [rows] = await db.query<any[]>(
    "SELECT row_id, updated_at, data FROM canonical_rows"
  );

  return rows.map((r) => ({
    row_id: r.row_id,
    updated_at: r.updated_at,
    data: r.data,
  }));
}
