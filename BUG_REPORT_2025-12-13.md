# Bug Report & Fixes - 2025-12-13

## Overview
This document details the investigation and resolution of critical issues affecting the deployment of the DailyUse API and Web Frontend. The issues prevented the API from connecting to the database, caused the frontend to crash on startup, and blocked communication between the frontend and API.

## Issues Identified

### 1. API Database Connection Failure
**Symptoms:**
- API logs showed repeated errors: `The provided database string is invalid. Error parsing connection string: empty host in database URL.`
- `PrismaClient` failed to initialize, causing 500 errors on API endpoints.

**Root Cause:**
- The `docker-compose.prod.yml` file was overriding the `DATABASE_URL` environment variable with a constructed string:
  ```yaml
  DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@postgres:5432/${DB_NAME:-dailyuse}
  ```
- This constructed URL was likely malformed or conflicted with the intended configuration, or the variable substitution was failing in the deployment environment.
- The intention (based on `apps/api/.env`) was to use a Neon Cloud Database URL, but the Docker Compose override forced a local connection string that was invalid or unreachable.

**Fix:**
- Removed the `DATABASE_URL` override from the `api` service in `docker-compose.prod.yml`.
- The application now correctly loads the valid `DATABASE_URL` from the mounted `.env` file (pointing to the Neon Cloud DB).

### 2. API Port Mismatch (Connection Refused)
**Symptoms:**
- Frontend logs showed: `POST http://localhost:3888/api/v1/auth/register net::ERR_CONNECTION_REFUSED`.
- The frontend was configured to talk to port `3888`.
- The Docker container was exposing port `3000` (mapped as `${API_PORT:-3000}:3000`).

**Root Cause:**
- The `apps/api/.env` file defined `PORT=3888`, so the API server inside the container was listening on port 3888.
- However, `docker-compose` expected the internal port to be 3000 and mapped the host port 3000 to it.
- This resulted in a mismatch: The host port 3888 (expected by frontend) was not listening, and the container port 3000 (mapped by Docker) had no service listening on it inside the container.

**Fix:**
- Forced the API server to listen on port 3000 inside the container by adding `PORT: 3000` to the `environment` section of `docker-compose.prod.yml`.
- Updated the port mapping in `docker-compose.prod.yml` to `${API_PORT:-3888}:3000`. This maps the Host Port **3888** to the Container Port **3000**.
- This aligns the external access point (3888) with the frontend's configuration while keeping the internal container configuration standard (3000).

### 3. Frontend Crash (`crypto.randomUUID`)
**Symptoms:**
- Frontend logs showed: `TypeError: crypto.randomUUID is not a function`.
- This caused the application initialization to fail.

**Root Cause:**
- `crypto.randomUUID` is a standard Web API method but is only available in **Secure Contexts** (HTTPS or localhost).
- While `localhost` is usually considered secure, certain browser environments or network configurations (e.g., accessing via LAN IP) might treat it as insecure, disabling this method.
- Older browsers also lack support for this method.

**Fix:**
- Added a polyfill for `crypto.randomUUID` in `apps/web/src/main.ts`.
- The polyfill detects if the method is missing and provides a fallback implementation using `crypto.getRandomValues`.

## Verification
- **Database:** The API should now successfully connect to the configured Neon Cloud Database.
- **Connectivity:** The Frontend should successfully reach the API at `http://localhost:3888/`.
- **Frontend Startup:** The Frontend should load without the `TypeError` and successfully complete initialization.

## Files Modified
- `docker-compose.prod.yml`
- `apps/web/src/main.ts`
