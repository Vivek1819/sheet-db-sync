import { useState } from "react";
import { api } from "../api/client";

export default function SyncControls() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);

  async function runSync() {
    try {
      setLoading(true);
      setStatus(null);

      await api("/sync", { method: "POST" });

      setLastSync(Date.now());
      setStatus("Sync completed successfully");
    } catch (err: any) {
      setStatus(err.message || "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: 16,
        borderRadius: 6,
        marginBottom: 24,
      }}
    >
      <h2>Sync Controls</h2>

      <button onClick={runSync} disabled={loading}>
        {loading ? "Running sync..." : "Run Sync Now"}
      </button>

      {status && (
        <p style={{ marginTop: 12 }}>
          <strong>Status:</strong> {status}
        </p>
      )}

      {lastSync && (
        <p>
          <strong>Last Sync:</strong>{" "}
          {new Date(lastSync).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
