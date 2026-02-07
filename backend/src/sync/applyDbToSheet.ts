import { CanonicalRow } from "../types/row";
import { getSheetsClient } from "../sheets/client";
import { env } from "../config/env";

export async function applyDbToSheet(rows: CanonicalRow[]) {
  if (rows.length === 0) return;

  const sheets = getSheetsClient();

  // 1. Read headers to know column order
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: env.google.sheetId,
    range: "A1:Z1",
  });

  const headers = headerRes.data.values?.[0] || [];
  const rowIdIndex = headers.indexOf("__row_id");
  const updatedAtIndex = headers.indexOf("__updated_at");

  if (rowIdIndex === -1 || updatedAtIndex === -1) return;

  // 2. Read all sheet rows once
  const rowsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: env.google.sheetId,
    range: "A2:Z1000",
  });

  const sheetRows = rowsRes.data.values || [];

  // 3. Update matching rows
  for (const dbRow of rows) {
    const sheetRowIndex = sheetRows.findIndex(
      (r) => r[rowIdIndex] === dbRow.row_id
    );

    if (sheetRowIndex === -1) continue;

    const updatedRow = [...sheetRows[sheetRowIndex]];

    headers.forEach((header, idx) => {
      if (header !== "__row_id" && header !== "__updated_at") {
        updatedRow[idx] = dbRow.data[header] ?? "";
      }
    });

    updatedRow[rowIdIndex] = dbRow.row_id;
    updatedRow[updatedAtIndex] = dbRow.updated_at.toString();

    const sheetRowNumber = sheetRowIndex + 2;

    await sheets.spreadsheets.values.update({
      spreadsheetId: env.google.sheetId,
      range: `A${sheetRowNumber}:Z${sheetRowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [updatedRow],
      },
    });
  }
}
