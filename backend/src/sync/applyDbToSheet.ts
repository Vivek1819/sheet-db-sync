import { CanonicalRow } from "../types/row";
import { getSheetsClient } from "../sheets/client";
import { env } from "../config/env";

export async function applyDbToSheet(rows: CanonicalRow[]) {
  if (rows.length === 0) return;

  const sheets = getSheetsClient();

  // 1. Read everything to map Row IDs to Grid Coordinates
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.google.sheetId,
    range: "A1:Z1000", // Assuming max 1000 rows for this MVP
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const values = response.data.values || [];
  if (values.length === 0) return;

  const headers = values[0];
  const rowIdIndex = headers.indexOf("__row_id");
  const updatedAtIndex = headers.indexOf("__updated_at");

  if (rowIdIndex === -1 || updatedAtIndex === -1) return;

  // Map header name to Column Index (0-based)
  const colMap = new Map<string, number>();
  headers.forEach((h, i) => colMap.set(h, i));

  // Map Row ID to Row Index (0-based)
  // Row 0 is header, Row 1 is data...
  const rowMap = new Map<string, number>();
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const id = row[rowIdIndex];
    if (id) {
      rowMap.set(id, i);
    }
  }

  // 2. Build Batch Requests
  const requests: any[] = [];

  for (const dbRow of rows) {
    const sheetRowIndex = rowMap.get(dbRow.row_id);
    if (sheetRowIndex === undefined) continue;

    const sheetRowData = values[sheetRowIndex];

    // Detect changed cells
    // We only update if DB value is different from Sheet value (redundancy check)
    // OR if we just want to enforce DB state. 
    // Since 'rows' here is ALREADY the diff (toUpdateSheet), we can technically just write.
    // But to be super safe against race conditions (User edited Col A while we processed Col B),
    // we should only write specific columns.

    // Iterate over all data columns in DB row
    Object.entries(dbRow.data).forEach(([colName, dbValue]) => {
      const colIndex = colMap.get(colName);
      if (colIndex === undefined) return;

      const currentSheetValue = sheetRowData[colIndex];

      // Strict equality check to avoid writing if not needed
      // (Though strings vs numbers might be tricky, so loose equality usually safer or string conversion)
      if (String(currentSheetValue) !== String(dbValue)) {
        requests.push({
          updateCells: {
            range: {
              sheetId: 0, // Assuming first sheet
              startRowIndex: sheetRowIndex,
              endRowIndex: sheetRowIndex + 1,
              startColumnIndex: colIndex,
              endColumnIndex: colIndex + 1,
            },
            rows: [
              {
                values: [
                  {
                    userEnteredValue: {
                      stringValue: String(dbValue ?? ""), // Force string for now for safety
                    },
                  },
                ],
              },
            ],
            fields: "userEnteredValue",
          },
        });
      }
    });

    // Always update __updated_at if we touched the row (or even if we didn't, to sync timestamps)
    requests.push({
      updateCells: {
        range: {
          sheetId: 0,
          startRowIndex: sheetRowIndex,
          endRowIndex: sheetRowIndex + 1,
          startColumnIndex: updatedAtIndex,
          endColumnIndex: updatedAtIndex + 1,
        },
        rows: [
          {
            values: [
              {
                userEnteredValue: {
                  stringValue: dbRow.updated_at.toString(),
                },
              },
            ],
          },
        ],
        fields: "userEnteredValue",
      },
    });
  }

  if (requests.length === 0) return;

  // 3. Execute Batch
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: env.google.sheetId,
    requestBody: {
      requests,
    },
  });

  console.log(`[Sync] Batched ${requests.length} cell updates to Sheet.`);
}
