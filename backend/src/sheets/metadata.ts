import { getSheetsClient } from "./client";
import { env } from "../config/env";

const METADATA_COLUMNS = [
  "__row_id",
  "__updated_at",
  "__deleted_at",
];

// Modified to accept DB columns for Schema Sync
export async function ensureMetadataColumns(dbColumns: string[] = []) {
  const sheets = getSheetsClient();

  // 1. Read header
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: env.google.sheetId,
    range: "A1:Z1",
  });

  const headers = headerRes.data.values?.[0] ?? [];
  let newHeaders = [...headers];

  // 2. Ensure DB Columns exist in Sheet
  for (const col of dbColumns) {
    if (!newHeaders.includes(col)) {
      newHeaders.push(col);
    }
  }

  // 3. Ensure Metadata Columns exist
  for (const col of METADATA_COLUMNS) {
    if (!newHeaders.includes(col)) {
      newHeaders.push(col);
    }
  }

  // 4. Update header if needed
  if (newHeaders.length !== headers.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.google.sheetId,
      range: "A1",
      valueInputOption: "RAW",
      requestBody: { values: [newHeaders] },
    });
    console.log("[Schema Sync] Updated Sheet Headers:", newHeaders);
  }

  // 5. Ensure deleted_at column has data (fill with empty strings if new)
  // This is a bit hacky to "materialize" the column for the first 1000 rows
  const deletedAtIndex = newHeaders.indexOf("__deleted_at");
  if (deletedAtIndex !== -1) {
    if (!headers.includes("__deleted_at")) {
      const colLetter = String.fromCharCode(65 + deletedAtIndex);
      // Only do this if column was just added
      await sheets.spreadsheets.values.update({
        spreadsheetId: env.google.sheetId,
        range: `${colLetter}2:${colLetter}1000`,
        valueInputOption: "RAW",
        requestBody: {
          values: Array.from({ length: 999 }, () => [""]),
        },
      });
    }
  }
}
