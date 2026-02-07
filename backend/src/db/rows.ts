import { db } from "./index";
import { CanonicalRow } from "../types/row";
import crypto from "crypto";

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
        data: typeof r.data === "string" ? JSON.parse(r.data) : r.data,
    }));
}

export async function insertRow(data: Record<string, string>) {
  const row_id = crypto.randomUUID();
  const updated_at = Date.now();

  await db.query(
    `
    INSERT INTO canonical_rows (row_id, updated_at, data)
    VALUES (?, ?, ?)
    `,
    [row_id, updated_at, JSON.stringify(data)]
  );

  return { row_id, updated_at, data };
}

export async function updateCell(
  row_id: string,
  column: string,
  value: string
) {
  const [rows] = await db.query<any[]>(
    "SELECT data FROM canonical_rows WHERE row_id = ?",
    [row_id]
  );

  if (rows.length === 0) {
    throw new Error("Row not found");
  }

  const data =
    typeof rows[0].data === "string"
      ? JSON.parse(rows[0].data)
      : rows[0].data;

  data[column] = value;
  const updated_at = Date.now();

  await db.query(
    `
    UPDATE canonical_rows
    SET data = ?, updated_at = ?
    WHERE row_id = ?
    `,
    [JSON.stringify(data), updated_at, row_id]
  );

  return { row_id, updated_at, data };
}

export async function deleteRow(row_id: string) {
  await db.query(
    "DELETE FROM canonical_rows WHERE row_id = ?",
    [row_id]
  );
}
