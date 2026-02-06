import { getSheetsClient } from "./client";
import { env } from "../config/env";

export async function readSheet() {
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.google.sheetId,
    range: "A1:Z1000", // safe default
  });

  return response.data.values || [];
}
