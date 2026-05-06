export const NOTIFICATION_TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

export function getPriorityScore(notification, now = Date.now()) {
  const typeWeight = NOTIFICATION_TYPE_WEIGHT[notification.Type] || 0;
  const timestamp = new Date(notification.Timestamp).getTime();
  const ageInSeconds = Number.isFinite(timestamp) ? (now - timestamp) / 1000 : Number.MAX_SAFE_INTEGER;

  return typeWeight * 1_000_000_000 - ageInSeconds;
}

export function getTopPriorityNotifications(notifications, limit = 10, readIds = new Set()) {
  return [...notifications]
    .filter((notification) => !readIds.has(notification.ID))
    .sort((left, right) => getPriorityScore(right) - getPriorityScore(left))
    .slice(0, limit);
}

export function sortByNewest(notifications) {
  return [...notifications].sort(
    (left, right) => new Date(right.Timestamp).getTime() - new Date(left.Timestamp).getTime()
  );
}
