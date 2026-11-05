# QuietCue — local PostgreSQL

This working copy uses an Expo app in `mobile/` and a Node API in `backend/`.
The app calls the API; only the API holds the PostgreSQL password.
Login, registration, family codes, requests, tasks, focus sessions and notifications
use PostgreSQL. The active app refreshes family updates every seven seconds.

## Start on this Windows PC

Requires Node.js 22 or newer. Open PowerShell in this folder:

```powershell
./setup-local.ps1
./start-local.ps1
```

Setup downloads the official PostgreSQL 18 Windows binaries into `.local/`,
initializes a password-protected database on `127.0.0.1:54329`, writes private
credentials to `backend/.env`, and applies `backend/schema.sql`. It can be rerun
without clearing records. PostgreSQL runs as a local process, not a Windows service.
The runtime and credentials are ignored by Git.

Press `w` in the Expo terminal for the browser. For Expo Go on a physical phone,
put the PC's LAN address into `mobile/.env`, for example:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.10:3001
```

Restart Expo after changing this setting. Connect the phone to the same network.
For an Android emulator use `http://10.0.2.2:3001`; for the PC browser use
`http://localhost:3001`. The API listens on port 3001; the database stays on loopback.

## Stop

Stop Expo with Ctrl+C, then stop the API and database:

```powershell
./stop-local.ps1
```

## Existing Supabase records

The original project and Supabase database have not been modified. This is a fresh
local database: create a parent and child account and join with the parent's code.
Existing Supabase users, passwords and app records have not been imported.
The old SQL under `mobile/supabase/` is reference material only and is not executed.

## Other PostgreSQL installations

Use a dedicated empty database and a migration account that can create roles.
Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL`.
Run `npm ci`, `npm run migrate`, then `npm start` from `backend/`.
Run `npm ci` and `npm start` from `mobile/` with its API URL configured.
The optional `compose.yaml` provides PostgreSQL on port 5432 when Docker is installed;
copy the root `.env.example` to `.env`, choose a password, and run `docker compose up -d`.

## Validation

```powershell
cd backend
npm test
cd ../mobile
npx tsc --noEmit
npm run lint
```

Tests cover authentication over HTTP, family isolation, database policies, requests,
notifications, tasks, focus sessions and parameterized queries. Automated database
tests use PGlite; the local server uses PostgreSQL through `pg`.
Run `npm run test:live` from `backend/` to repeat the HTTP test against the configured
PostgreSQL database. Temporary test accounts are removed afterward.

References: [PostgreSQL Windows downloads](https://www.postgresql.org/download/windows/),
[EDB Windows binaries](https://www.enterprisedb.com/download-postgresql-binaries).
