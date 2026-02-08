import { useEffect, useState } from "react";
import { fetchRows, runSync, insertRow, addColumn } from "../api/client";
import type { CanonicalRow } from "../types/row";
import { RowsTable } from "../components/RowsTable";
import SyncControls from "../components/SyncControls";
import "../App.css";

function App() {
  const [rows, setRows] = useState<CanonicalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingCol, setAddingCol] = useState(false);

  async function loadRows() {
    const data = await fetchRows();
    setRows(data);
  }

  async function handleAddRow() {
    const row = await insertRow({});
    setRows((prev) => [...prev, row]);
  }

  async function handleAddColumn() {
    const name = prompt("Enter new column name (e.g. Email)");
    if (!name) return;

    try {
      setAddingCol(true);
      await addColumn(name);
      // Wait a moment for DB/Sheet to sync up if possible, or just reload rows
      // Ideally run a sync to force sheet update
      await loadRows();
      alert(`Column "${name}" added! It will appear after the next sync.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setAddingCol(false);
    }
  }

  async function handleSync() {
    setLoading(true);
    await runSync();
    await loadRows();
    setLoading(false);
  }

  useEffect(() => {
    loadRows();
  }, []);

  const activeRows = rows.filter((r) => !r.deleted_at);

  return (
    <div className="app-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">NEXUS SYNC</h1>
        <div className="cluster-subtitle">Data/Sheet Bridge v2.0</div>
      </header>

      <SyncControls onSync={handleSync} loading={loading} />

      <section className="data-section">
        <div className="section-header">
          <h2 className="section-title">LIVE RECORDS</h2>
        </div>

        <RowsTable
          rows={activeRows}
          onRowDeleted={(rowId) => {
            setRows((prev) => prev.filter((r) => r.row_id !== rowId));
          }}
        />

        <div className="add-row-container" style={{ gap: '1rem' }}>
          <button
            onClick={handleAddColumn}
            className="btn-add"
            disabled={addingCol}
            style={{ borderColor: 'var(--neon-purple)', color: 'var(--neon-purple)' }}
          >
            <span className="plus-icon">+</span>
            <span>{addingCol ? "ADDING..." : "ADD COL"}</span>
          </button>

          <button onClick={handleAddRow} className="btn-add">
            <span className="plus-icon">+</span>
            <span>NEW ENTRY</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;
