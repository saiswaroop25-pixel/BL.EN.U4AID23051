# Notification System Design

## Stage 1

The first stage is handled in `notification_app_fe/src/priority.js`. I kept the scoring small and easy to explain:

- `Placement` gets weight `3`.
- `Result` gets weight `2`.
- `Event` gets weight `1`.
- If two notifications have the same type weight, the newer one comes first.

The score used by the code is:

```text
score = typeWeight * 1,000,000,000 - ageInSeconds
```

This keeps placement notifications ahead of result notifications, result notifications ahead of event notifications, and still uses recency inside each group. The top priority list is produced by `getTopPriorityNotifications(notifications, n, readIds)`.

For the current API size, sorting the fetched list is simple and fast enough. If the notification count becomes large, the same score can be used with a small heap of size `n`, so only the current top `n` items are kept in memory.

## Stage 2

The React app is in `notification_app_fe` and also runs from the repository root:

```bash
npm install --prefix notification_app_fe
npm run dev
```

The dev server is configured for `http://localhost:3000`.

The app has two views:

- `Priority Inbox`: shows only unread priority notifications and lets the user choose top 5, 10, 15, or 20.
- `All Notifications`: shows all notifications and supports filtering by `Placement`, `Result`, and `Event`.

Viewed notification IDs are stored in `localStorage`, so a notification stays marked as read after refresh.

## API and Auth

The notification API is protected. The frontend reads auth values from `notification_app_fe/.env`, gets a token from `/auth`, and then calls `/notifications` with the bearer token.

The logging middleware follows the same registration/auth setup. Registration should be run only once:

```bash
npm run register
```

After registration, the returned `clientID` and `clientSecret` should be copied into the local `.env` files. These files are ignored by Git.

## Folders

- `logging_middleware`: reusable `Log(stack, level, package, message)` package and registration helpers.
- `notification_app_fe`: React frontend for the notification pages.
- `notification_app_be`: small backend placeholder with a `/health` endpoint.
