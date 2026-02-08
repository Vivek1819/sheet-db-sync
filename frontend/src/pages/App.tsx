import { useEffect, useState } from "react";
import { fetchRows, runSync, insertRow, addColumn } from "../api/client";
import type { CanonicalRow } from "../types/row";
import { RowsTable } from "../components/RowsTable";
import SyncControls from "../components/SyncControls";
import { useToast } from "../context/ToastContext";
import { InputModal } from "../components/InputModal";
import "../App.css";

function App() {
  const [rows, setRows] = useState<CanonicalRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showColModal, setShowColModal] = useState(false);
  const [submittingCol, setSubmittingCol] = useState(false);

  const { addToast } = useToast();

  async function loadRows() {
    try {
      const data = await fetchRows();
      setRows(data);
    } catch (err) {
      // Silent fail on background poll usually, but maybe toast on first load?
    }
  }

  async function handleAddRow() {
    try {
      const row = await insertRow({});
      setRows((prev) => [...prev, row]);
      addToast("New entry created", "success");
    } catch (err: any) {
      addToast("Failed to create entry", "error");
    }
  }

  // Open Modal
  function handleOpenAddColumn() {
    setShowColModal(true);
  }

  // Handle Modal Submit
  async function handleColumnSubmit(name: string) {
    if (!name) return;

    try {
      setSubmittingCol(true);
      await addColumn(name);

      // Close modal immediately
      setShowColModal(false);

      addToast(`Column "${name}" added to Schema`, "success");
      addToast("Syncing schema...", "info");

      // Reload to see if it pushed (might take a sec)
      await loadRows();
    } catch (err: any) {
      addToast(err.message || "Failed to add column", "error");
    } finally {
      setSubmittingCol(false);
    }
  }

  async function handleSync() {
    setLoading(true);
    addToast("Sync initiated...", "info");
    try {
      await runSync();
      await loadRows();
      addToast("Sync complete", "success");
    } catch (err) {
      addToast("Sync failed", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      loadRows();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const activeRows = rows.filter((r) => !r.deleted_at);

  return (
    <div className="app-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          NEXUS SYNC
          <span className="live-badge">LIVE</span>
        </h1>
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
            addToast("Row deleted", "info");
          }}
        />

        <div className="add-row-container" style={{ gap: '1rem' }}>
          <button
            onClick={handleOpenAddColumn}
            className="btn-add"
            disabled={submittingCol}
            style={{ borderColor: 'var(--neon-purple)', color: 'var(--neon-purple)' }}
          >
            <span className="plus-icon">+</span>
            <span>ADD COL</span>
          </button>

          <button onClick={handleAddRow} className="btn-add">
            <span className="plus-icon">+</span>
            <span>NEW ENTRY</span>
          </button>
        </div>
      </section>

      {/* MODALS */}
      <InputModal
        isOpen={showColModal}
        title="NEW SCHEMA COLUMN"
        placeholder="Column Name (e.g. Phone)"
        onClose={() => setShowColModal(false)}
        onSubmit={handleColumnSubmit}
      />
    </div>
  );
}

export default App;
