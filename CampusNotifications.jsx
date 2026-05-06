/* @jsxRuntime classic */
import React, { useCallback, useEffect, useMemo, useState } from "./notification_app_fe/src/react.js";
import { fetchNotifications } from "./notification_app_fe/src/api.js";
import { getTopPriorityNotifications, sortByNewest } from "./notification_app_fe/src/priority.js";

const TYPE_COLORS = {
  Placement: { bg: "#e3f2fd", text: "#0d47a1", dot: "#1976d2" },
  Result: { bg: "#e8f5e9", text: "#1b5e20", dot: "#43a047" },
  Event: { bg: "#fff3e0", text: "#e65100", dot: "#fb8c00" },
};

function formatRelative(timestamp) {
  const diff = (Date.now() - new Date(timestamp).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Badge({ type }) {
  const color = TYPE_COLORS[type] || { bg: "#eceff1", text: "#37474f", dot: "#607d8b" };
  return (
    <span className="badge" style={{ background: color.bg, color: color.text }}>
      <span className="badgeDot" style={{ background: color.dot }} />
      {type}
    </span>
  );
}

function NotificationCard({ notification, read, rank, onRead }) {
  return (
    <button
      className={`notificationCard ${read ? "read" : "unread"}`}
      type="button"
      onClick={() => onRead(notification.ID)}
    >
      {rank && <span className="rank">#{rank}</span>}
      <span className="notificationBody">
        <span className="cardHeader">
          <Badge type={notification.Type} />
          {!read && <span className="unreadDot" title="Unread" />}
        </span>
        <span className="message">{notification.Message}</span>
        <span className="timestamp">{formatRelative(notification.Timestamp)}</span>
      </span>
    </button>
  );
}

function EmptyState({ title, message }) {
  return (
    <section className="emptyState">
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  );
}

export default function CampusNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState("priority");
  const [topN, setTopN] = useState(10);
  const [filterType, setFilterType] = useState("All");
  const [lastFetch, setLastFetch] = useState(null);
  const [readIds, setReadIds] = useState(() => {
    const stored = localStorage.getItem("campus-read-notifications");
    return new Set(stored ? JSON.parse(stored) : []);
  });

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await fetchNotifications({ limit: 100, type: page === "all" ? filterType : "All" });
      setNotifications(items);
      setLastFetch(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterType, page]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    localStorage.setItem("campus-read-notifications", JSON.stringify([...readIds]));
  }, [readIds]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !readIds.has(notification.ID)).length,
    [notifications, readIds]
  );

  const priorityNotifications = useMemo(
    () => getTopPriorityNotifications(notifications, topN, readIds),
    [notifications, readIds, topN]
  );

  const allNotifications = useMemo(() => sortByNewest(notifications), [notifications]);
  const displayed = page === "priority" ? priorityNotifications : allNotifications;

  function markRead(id) {
    setReadIds((current) => new Set([...current, id]));
  }

  return (
    <main className="appShell">
      <header className="appHeader">
        <div>
          <p className="eyebrow">Campus Notifications</p>
          <h1>{page === "priority" ? "Priority Inbox" : "All Notifications"}</h1>
          {lastFetch && (
            <p className="subtle">
              Updated {formatRelative(lastFetch.toISOString())} - {notifications.length} total - {unreadCount} unread
            </p>
          )}
        </div>
        <button className="refreshButton" type="button" onClick={loadNotifications} disabled={loading}>
          Refresh
        </button>
      </header>

      <nav className="tabs" aria-label="Notification pages">
        <button className={page === "priority" ? "active" : ""} type="button" onClick={() => setPage("priority")}>
          Priority Inbox
        </button>
        <button className={page === "all" ? "active" : ""} type="button" onClick={() => setPage("all")}>
          All Notifications
          {unreadCount > 0 && <span>{unreadCount}</span>}
        </button>
      </nav>

      <section className="controls">
        {page === "priority" ? (
          <label>
            Show top
            <select value={topN} onChange={(event) => setTopN(Number(event.target.value))}>
              {[5, 10, 15, 20].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            Type
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
              {["All", "Placement", "Result", "Event"].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      {loading && <EmptyState title="Loading notifications" message="Fetching the latest campus updates." />}

      {!loading && error && (
        <section className="errorPanel">
          <strong>Could not load notifications.</strong>
          <p>{error}</p>
        </section>
      )}

      {!loading && !error && displayed.length === 0 && (
        <EmptyState
          title={page === "priority" ? "No unread priority notifications" : "No notifications"}
          message="Refresh again after new campus updates are available."
        />
      )}

      {!loading && !error && displayed.length > 0 && (
        <section className="notificationList">
          {displayed.map((notification, index) => (
            <NotificationCard
              key={notification.ID}
              notification={notification}
              read={readIds.has(notification.ID)}
              rank={page === "priority" ? index + 1 : null}
              onRead={markRead}
            />
          ))}
        </section>
      )}
    </main>
  );
}
