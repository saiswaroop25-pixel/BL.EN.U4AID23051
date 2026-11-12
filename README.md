# Campus Notifications

A campus notification system with a React front end that surfaces the most important unread notifications first, plus a reusable logging middleware package.

## Features

- **Priority Inbox** – shows only unread notifications ranked by priority; choose the top 5, 10, 15 or 20.
- **All Notifications** – full list with filtering by `Placement`, `Result` and `Event`.
- **Persistent read state** – viewed notification IDs are stored in `localStorage`, so they stay read after a refresh.
- **Logging middleware** – reusable `Log(stack, level, package, message)` helper plus registration/auth scripts for the evaluation service.

## Priority scoring

Each notification gets a score so that important types come first and newer items win ties:

```text
score = typeWeight * 1,000,000,000 - ageInSeconds
```

| Type      | Weight |
|-----------|--------|
| Placement | 3      |
| Result    | 2      |
| Event     | 1      |

See [`notification_system_design.md`](notification_system_design.md) for the design rationale.

## Project structure

```text
.
├── logging_middleware/      # Log() package, register/auth scripts
├── notification_app_fe/     # React + Vite front end
├── notification_app_be/     # Minimal Node backend (/health endpoint)
├── CampusNotifications.jsx
└── notification_system_design.md
```

## Tech stack

React, Vite, Node.js (ES modules)

## Getting started

Prerequisites: Node.js 18+ and npm.

```bash
# install front-end dependencies
npm install --prefix notification_app_fe

# configure environment
cp notification_app_fe/.env.example notification_app_fe/.env
# then fill in the VITE_EVALUATION_* values

# start the dev server (http://localhost:3000)
npm run dev
```

Other scripts:

```bash
npm run build      # production build of the front end
npm run register   # one-time registration with the evaluation service
npm run auth       # fetch an auth token
```

Run `npm run register` only once, then copy the returned `clientID` and `clientSecret` into your local `.env` files (they are git-ignored).

Backend placeholder:

```bash
cd notification_app_be && npm start   # GET http://localhost:3001/health
```

## Author

Sai Swaroop Talasu – [@saiswaroop25-pixel](https://github.com/saiswaroop25-pixel)
