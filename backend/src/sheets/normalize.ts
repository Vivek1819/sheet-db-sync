import { CanonicalRow } from "../types/row";
import crypto from "crypto";

const ROW_ID_COL = "__row_id";
const UPDATED_AT_COL = "__updated_at";

export function normalizeSheetRows(values: string[][]): CanonicalRow[] {
    if (values.length === 0) return [];

    const headers = values[0];
    const dataRows = values.slice(1);

    const rowIdIndex = headers.indexOf(ROW_ID_COL);
    const updatedAtIndex = headers.indexOf(UPDATED_AT_COL);

    return dataRows
        .filter((row) => {
            return (
                !row.includes(ROW_ID_COL) &&
                !row.includes(UPDATED_AT_COL)
            );
        })
        .map((row) => {
            const data: Record<string, string> = {};

            headers.forEach((header, idx) => {
                if (header !== ROW_ID_COL && header !== UPDATED_AT_COL) {
                    data[header] = row[idx] ?? "";
                }
            });

            const row_id =
                rowIdIndex >= 0
                    ? row[rowIdIndex]
                    : crypto.randomUUID();

            const updated_at =
                updatedAtIndex >= 0
                    ? Number(row[updatedAtIndex])
                    : Date.now();

            return {
                row_id,
                updated_at,
                data,
            };
        });
}
