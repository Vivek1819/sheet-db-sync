# Bi-Sync: 2-Way Google Sheet <-> MySQL Bridge

Bi-Sync is a production-grade synchronization engine that keeps a Google Sheet and a MySQL database in perfect harmony. It supports live schema synchronization, row-level updates, and **multi-player concurrency**, designed to handle the nuances of real-world data integration.

<img width="1125" height="892" alt="image" src="https://github.com/user-attachments/assets/7eb98d38-de29-47f5-95df-ab33a15ffd3f" />


---

## 🚀 Core Functionalities

### 🔄 True Bidirectional Sync
*   **Sheet -> DB:** The system polls the Google Sheet for changes. If a row is edited, it calculates the diff and pushes updates to MySQL.
*   **DB -> Sheet:** Changes made directly to the database (or via the App UI) are pushed to the Sheet.
*   **Multi-Player Support:** Handles simultaneous edits from multiple users on the Sheet and the App using a "Last Write Wins" strategy to resolve conflicts deterministically.

### 🛡️ Live Schema Sync
*   **Dynamic Columns:** Adding a column in the "Bi-Sync" dashboard automatically:
    1.  `ALTER TABLE` in MySQL to add the column.
    2.  Updates the Google Sheet header row.
    3.  Regenerates metadata to track the new validation rules.

### 🕵️ Audit Logging ("The Matrix")
*   **Immutable Logs:** Every sync operation (`INSERT`, `UPDATE`, `DELETE`, `SCHEMA`) is recorded in the `sync_logs` table.
*   **Visualization:** A retro-sci-fi Terminal Widget streams these logs in real-time, providing transparency into the system's operations.

---

## ⚡ Performance & Optimization

### 📦 Batching & Quota Management
*   **Batch Updates:** The backend aggregates all pending writes into a single `batchUpdate` API call per sync cycle. This ensures atomicity and dramatically reduces the risk of hitting Google's API rate limits (60/min), allowing the system to scale efficiently.

### 🎯 Field Masking (Patching)
*   **Efficient Writes:** Instead of rewriting entire rows, the sync engine calculates the exact delta (e.g., "Cell B2 changed from 'Pending' to 'Approved'"). We send only these specific cell updates, minimizing payload size and processing time.

---

## 🧠 Nuances, Edge Cases & Design Considerations

### 🔁 Sync & Conflict Resolution
*   **Stable Row Identity (`row_id`):** Each row has a persistent UUID to prevent conflicts caused by row reordering or insertion in Google Sheets. This ensures deterministic mapping between Sheet rows and DB rows.
*   **Timestamp-Based Source of Truth:** All conflicts are resolved using a last-write-wins strategy. The version (Sheet or DB) with the higher `updated_at` is treated as authoritative.
*   **Explicit Sheet Timestamp Bumping:** When sheet data changes but timestamps are stale, the system auto-bumps `updated_at` in the sheet to prevent infinite sync loops.

### 🗑️ Delete Handling (Safe & Reversible)
*   **Soft Deletes in DB:** Rows are never immediately hard-deleted. A `deleted_at` timestamp marks logical deletion.
*   **Sheet Visibility Handling:** Deleted rows are filtered from the Google Sheet view logic without being physically removed immediately, preventing accidental reappearance due to sync race conditions.

### 🧩 Metadata Robustness
*   **Automatic Metadata Enforcement:** Ensures `row_id`, `updated_at`, and `deleted_at` always exist in the sheet, even if users manually remove or reorder columns.
*   **Header-Based Column Mapping:** All sheet writes are aligned using header names, not column indices, supporting column reordering and schema changes.

### ⚠️ Edge Scenarios Handled
*   **Race Conditions:** The sync engine locks execution (`isRunning` flag). If a sync is in progress, the next cycle waits, preventing data corruption.
*   **Idempotency:** Running sync multiple times without changes produces no side effects.
*   **Data Type Safety:** Invalid data types (e.g., text in a Date field) are caught or nulled before hitting MySQL to prevent driver crashes.

---

## 📌 Architecture & Scope

### Assumptions
*   **Canonical Source:** A single Google Sheet is treated as the primary external interface per sync instance.
*   **Time Synchronization:** System clocks between the backend and Google Sheets are reasonably in sync (used for `updated_at` comparisons).
*   **Metadata Integrity:** Users do not directly edit metadata columns (`__row_id`, `__updated_at`) manually in the Sheet.

### Known Limitations & Non-Goals
*   **Deterministic Conflict Resolution:** We use a simple "Last Write Wins" strategy rather than complex CRDTs or merge-based reconciliation, prioritizing predictability over complexity.
*   **Polling vs. Real-Time:** Sync is polling-based (15s interval) to respect Google API Rate Limits strictly. Short-lived consistency gaps may exist between cycles.
*   **Schema Deletion:** Dropping columns is not supported via the UI to prevent irreversible data loss in the Database.

### 👥 Multi-User & Concurrency
*   **Concurrent Editing:** Multiple users can edit the Google Sheet or App UI simultaneously. The system resolves conflicts deterministically using the most recent timestamp.
*   **Process Locking:** Sync execution is guarded by a process-level lock to prevent overlapping runs, ensuring atomic updates.
*   **Convergence:** Temporary divergence is acceptable and the system is guaranteed to converge on the next successful sync cycle.

---

## Setup Instructions

### Prerequisites
1.  **Node.js** (v16+)
2.  **MySQL Server**
3.  **Google Cloud Service Account** (with Sheets API enabled)

### Installation
1.  **Clone the repo.**
2.  **Environment Setup:**
    Create a `.env` file in `./backend` with `DB_HOST`, `GOOGLE_SHEET_ID`, etc.
    Place your `service-account.json` in `backend/secrets/`.
3.  **Install Dependencies:**
    ```bash
    cd backend && npm install
    cd frontend && npm install
    ```
4.  **Run:**
    *   Backend: `npm run dev` (Port 3001)
    *   Frontend: `npm run dev` (Port 5173)

---
