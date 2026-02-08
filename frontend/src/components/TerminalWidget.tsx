import { useEffect, useState, useRef } from "react";
import "../App.css";

type LogEntry = {
    id: number;
    timestamp: string;
    type: string;
    message: string;
};

export function TerminalWidget() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initial fetch
        fetchLogs();

        // Poll every 5s
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    async function fetchLogs() {
        try {
            const res = await fetch("http://localhost:3001/logs?limit=50");
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
                setError(null);
            } else {
                setError(`HTTP Error: ${res.status}`);
            }
        } catch (err: any) {
            console.error("Failed to fetch logs", err);
            setError(`Fetch Failed: ${err.message}`);
        }
    }

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <div className="terminal-container">
            <div className="terminal-header">
                <div className="terminal-title">{">>"} SYSTEM_AUDIT_LOG</div>
                <div className="terminal-controls">
                    <span className="control red"></span>
                    <span className="control yellow"></span>
                    <span className="control green"></span>
                </div>
            </div>
            <div className="terminal-body" style={{ position: 'relative' }}>
                {error && (
                    <div className="log-entry" style={{ color: 'red', fontWeight: 'bold' }}>
                        {">>"} ERROR: {error}
                    </div>
                )}

                {logs.length === 0 && !error && <div className="log-entry system">{">>"} INITIALIZING UPLINK...</div>}

                {logs.map((log) => (
                    <div key={log.id} className="log-entry">
                        <span className="log-time">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className={`log-type type-${log.type}`}>{log.type}</span>
                        <span className="log-msg">{log.message}</span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
