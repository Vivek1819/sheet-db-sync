import { google } from "googleapis";
import { env } from "../config/env";
import path from "path";

export function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(env.google.credentialsPath),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}
