const BASE_URL = "http://localhost:3001";

export async function fetchRows() {
  const res = await fetch(`${BASE_URL}/db/rows`);
  if (!res.ok) throw new Error("Failed to fetch rows");
  return res.json();
}

export async function runSync() {
  const res = await fetch(`${BASE_URL}/sync`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Sync failed");
  return res.json();
}

export async function insertRow(data: Record<string, string>) {
  const res = await fetch(`${BASE_URL}/db/rows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  return res.json();
}

export async function updateCell(
  row_id: string,
  column: string,
  value: string
) {
  const res = await fetch(`${BASE_URL}/db/rows/${row_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ column, value }),
  });
  return res.json();
}

export async function deleteRow(row_id: string) {
  const res = await fetch(`${BASE_URL}/db/rows/${row_id}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function addColumn(name: string) {
  const res = await fetch(`${BASE_URL}/db/columns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to add column");
  }

  return res.json();
}
