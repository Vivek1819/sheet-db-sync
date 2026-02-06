import { getSheetsClient } from "./client";
import { env } from "../config/env";

const ROW_ID_COL = "__row_id";
const UPDATED_AT_COL = "__updated_at";

export async function ensureMetadataColumns() {
  const sheets = getSheetsClient();

  // Read current header row
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.google.sheetId,
    range: "A1:Z1",
  });

  const headers = response.data.values?.[0] ?? [];

  const newHeaders = [...headers];

  if (!headers.includes(ROW_ID_COL)) {
    newHeaders.push(ROW_ID_COL);
  }

  if (!headers.includes(UPDATED_AT_COL)) {
    newHeaders.push(UPDATED_AT_COL);
  }

  // If nothing changed, exit
  if (newHeaders.length === headers.length) return;

  // Rewrite header row explicitly
  await sheets.spreadsheets.values.update({
    spreadsheetId: env.google.sheetId,
    range: "A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [newHeaders],
    },
  });
}
