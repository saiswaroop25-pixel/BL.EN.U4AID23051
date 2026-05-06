import { useState, useEffect, useCallback } from "react";

const API_URL = "http://20.207.122.201/evaluation-service/notifications";

const TYPE_WEIGHT = { Placement: 3, Result: 2, Event: 1 };
const TYPE_COLORS = {
  Placement: { bg: "#B5D4F4", text: "#0C447C", dot: "#185FA5" },
  Result:    { bg: "#C0DD97", text: "#3B6D11", dot: "#639922" },
  Event:     { bg: "#FAC775", text: "#854F0B", dot: "#BA7517" },
};

function formatRelative(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function priorityScore(n) {
  const weight = TYPE_WEIGHT[n.Type] || 0;
  const age = (Date.now() - new Date(n.Timestamp).getTime()) / 1000;
  return weight * 1e9 - age;
}

function Badge({ type }) {
  const c = TYPE_COLORS[type] || { bg: "#E2E2E2", text: "#444", dot: "#888" };
  return (
    <span style={{
      background: c.bg, color: c.text,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
      padding: "2px 8px", borderRadius: 99, display: "inline-flex",
      alignItems: "center", gap: 4
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {type}
    </span>
  );
}

function NotificationCard({ n, read, onRead, rank }) {
  return (
    <div
      onClick={() => onRead(n.ID)}
      style={{
        background: read ? "var(--color-background-secondary)" : "var(--color-background-primary)",
        border: `0.5px solid ${read ? "var(--color-border-tertiary)" : "var(--color-border-secondary)"}`,
        borderRadius: 12, padding: "14px 16px",
        cursor: "pointer", transition: "box-shadow 0.15s",
        display: "flex", gap: 12, alignItems: "flex-start",
        position: "relative",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-primary)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = read ? "var(--color-border-tertiary)" : "var(--color-border-secondary)"}
    >
      {rank != null && (
        <div style={{
          minWidth: 26, height: 26, borderRadius: "50%",
          background: rank <= 3 ? "#FAC775" : "var(--color-background-tertiary)",
          color: rank <= 3 ? "#854F0B" : "var(--color-text-secondary)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1
        }}>
          #{rank}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
          <Badge type={n.Type} />
          {!read && (
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#378ADD", flexShrink: 0, display: "inline-block"
            }} title="Unread" />
          )}
        </div>
        <p style={{
          margin: 0, fontSize: 14,
          color: read ? "var(--color-text-secondary)" : "var(--color-text-primary)",
          fontWeight: read ? 400 : 500, lineHeight: 1.5,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
        }}>
          {n.Message}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
          {formatRelative(n.Timestamp)}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-secondary)" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-primary)" }}>{title}</p>
      <p style={{ margin: "6px 0 0", fontSize: 13 }}>{sub}</p>
    </div>
  );
}

export default function App() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readIds, setReadIds] = useState(new Set());
  const [page, setPage] = useState("inbox"); // "inbox" | "all"
  const [topN, setTopN] = useState(10);
  const [filterType, setFilterType] = useState("All");
  const [lastFetch, setLastFetch] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (filterType !== "All") params.set("type", filterType);
      const res = await fetch(`${API_URL}?${params}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
      setLastFetch(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = (id) => setReadIds(prev => new Set([...prev, id]));

  const prioritized = [...notifications]
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, topN);

  const displayed = page === "inbox"
    ? prioritized
    : [...notifications].sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

  const unreadCount = notifications.filter(n => !readIds.has(n.ID)).length;

  const navBtn = (id, label, count) => (
    <button
      onClick={() => setPage(id)}
      style={{
        background: page === id ? "var(--color-background-secondary)" : "transparent",
        border: page === id ? "0.5px solid var(--color-border-secondary)" : "0.5px solid transparent",
        borderRadius: 8, padding: "7px 14px", cursor: "pointer",
        fontSize: 13, fontWeight: page === id ? 500 : 400,
        color: page === id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
        display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
      }}
    >
      {label}
      {count > 0 && (
        <span style={{
          background: "#378ADD", color: "#fff",
          fontSize: 10, fontWeight: 700,
          borderRadius: 99, padding: "1px 6px", minWidth: 18, textAlign: "center"
        }}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "var(--font-sans)" }}>
      <h2 style={{ visibilityHidden: true, position: "absolute", top: -9999 }} className="sr-only">
        Campus Notifications — Priority Inbox and All Notifications
      </h2>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>
              Campus Notifications
            </p>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>
              {page === "inbox" ? "Priority Inbox" : "All Notifications"}
            </h1>
          </div>
          <button
            onClick={fetchNotifications}
            disabled={loading}
            style={{
              background: "transparent", border: "0.5px solid var(--color-border-secondary)",
              borderRadius: 8, padding: "7px 12px", cursor: loading ? "not-allowed" : "pointer",
              fontSize: 12, color: "var(--color-text-secondary)", display: "flex",
              alignItems: "center", gap: 6, opacity: loading ? 0.6 : 1
            }}
          >
            <i className="ti ti-refresh" style={{ fontSize: 14, display: "inline-block", animation: loading ? "spin 1s linear infinite" : "none" }} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {lastFetch && (
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--color-text-tertiary)" }}>
            Last updated {formatRelative(lastFetch.toISOString())} · {notifications.length} total notifications
          </p>
        )}
      </div>

      {/* Nav tabs */}
      <div style={{
        display: "flex", gap: 6, marginBottom: "1rem",
        borderBottom: "0.5px solid var(--color-border-tertiary)", paddingBottom: "0.75rem"
      }}>
        {navBtn("inbox", "Priority Inbox", 0)}
        {navBtn("all", "All Notifications", unreadCount)}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        {page === "inbox" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Show top</label>
            {[5, 10, 15, 20].map(n => (
              <button
                key={n}
                onClick={() => setTopN(n)}
                style={{
                  background: topN === n ? "#378ADD" : "transparent",
                  color: topN === n ? "#fff" : "var(--color-text-secondary)",
                  border: `0.5px solid ${topN === n ? "#378ADD" : "var(--color-border-secondary)"}`,
                  borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: topN === n ? 500 : 400
                }}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {page === "all" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Filter</label>
            {["All", "Placement", "Result", "Event"].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  background: filterType === t ? (TYPE_COLORS[t]?.bg || "#378ADD") : "transparent",
                  color: filterType === t ? (TYPE_COLORS[t]?.text || "#fff") : "var(--color-text-secondary)",
                  border: `0.5px solid ${filterType === t ? (TYPE_COLORS[t]?.dot || "#378ADD") : "var(--color-border-secondary)"}`,
                  borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: filterType === t ? 500 : 400
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {page === "inbox" && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, fontSize: 11, alignItems: "center" }}>
            {Object.entries(TYPE_COLORS).map(([type, c]) => (
              <span key={type} style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-text-secondary)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot }} />
                {type}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-secondary)", fontSize: 13 }}>
          <div style={{ marginBottom: 12, fontSize: 20 }}>⏳</div>
          Fetching notifications…
        </div>
      )}

      {error && (
        <div style={{
          background: "var(--color-background-danger)", border: "0.5px solid var(--color-border-danger)",
          borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--color-text-danger)",
          display: "flex", alignItems: "center", gap: 10
        }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 16 }} aria-hidden="true" />
          <span>Could not fetch notifications: {error}. The API may require auth.</span>
        </div>
      )}

      {!loading && !error && displayed.length === 0 && (
        <EmptyState icon="🔔" title="No notifications" sub="Nothing to show here right now." />
      )}

      {!loading && !error && displayed.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {displayed.map((n, i) => (
            <NotificationCard
              key={n.ID}
              n={n}
              read={readIds.has(n.ID)}
              onRead={markRead}
              rank={page === "inbox" ? i + 1 : null}
            />
          ))}
        </div>
      )}

      {page === "inbox" && !loading && !error && displayed.length > 0 && (
        <div style={{
          marginTop: "1.25rem", padding: "12px 16px",
          background: "var(--color-background-secondary)",
          borderRadius: 10, border: "0.5px solid var(--color-border-tertiary)",
          fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6
        }}>
          <strong style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>Priority scoring:</strong>{" "}
          Placement (×3) › Result (×2) › Event (×1), combined with recency. Click a notification to mark it as read.
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
