# HomeHub Back-end

Express/PostgreSQL back-end for authentication, Google OAuth, 2FA, password reset, and device control.

## Stack

- Node.js
- Express
- PostgreSQL
- JWT in `httpOnly` cookies
- Passport Google OAuth
- Nodemailer

## Prerequisites

Install these before running the project:

- Node.js 18+ and npm
- PostgreSQL 14+ or any recent PostgreSQL version
- A Gmail app password if you want password-reset emails to work
- Google OAuth credentials if you want Google login to work

## First-time Setup

### 1. Clone and enter the project

```bash
git clone <your-repo-url>
cd homehub/Back-end
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your environment file

Copy the sample env file and fill in your real values:

```bash
cp .env.example .env
```

Required variables:

- `PORT`: API port, for example `5000`
- `NODE_ENV`: use `development` locally
- `FRONTEND_URL`: your frontend URL, for example `http://localhost:5173`
- `SESSION_SECRET`: any long random string
- `JWT_SECRET`: any long random string
- `PG_USER`
- `PG_HOST`
- `PG_DATABASE`
- `PG_PASSWORD`
- `PG_PORT`

Optional but needed for some features:

- `EMAIL_USER` and `EMAIL_PASS`: needed for forgot-password email delivery
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`: needed for Google sign-in

### 4. Create the PostgreSQL database

Create a database that matches `PG_DATABASE` in your `.env`.

Example:

```sql
CREATE DATABASE "homeHub";
```

### 5. Run the schema

Run the SQL in [sql.sql](/home/pathfinder/2026/homehub/Back-end/sql.sql:1) against your PostgreSQL database.

Example with `psql`:

```bash
psql -U postgres -d homeHub -f sql.sql
```

This creates the core tables:

- `users`
- `homes`
- `devices`
- `device_status`

### 6. Start the server

Development:

```bash
npm run dev
```

Production-style local run:

```bash
npm start
```

If everything is wired correctly, the API should start on:

```text
http://localhost:5000
```

Or whatever `PORT` you set in `.env`.

## Seed Demo Data

If your tables are empty, you can populate them with demo data using:

```bash
npm run seed
```

This seed script will:

- clear existing data from `device_status`, `devices`, `homes`, and `users`
- create one demo user
- create one demo home
- create a few demo devices and statuses

Demo login created by the seed:

```text
email: demo@homehub.com
password: password123
```

Run the seed only after:

- PostgreSQL is running
- your `.env` is configured
- you have already created the tables from `sql.sql`

## Daily Run Commands

Whenever you download the project again from GitHub, the usual flow is:

```bash
cd homehub/Back-end
npm install
cp .env.example .env
# fill in .env
psql -U postgres -d homeHub -f sql.sql
npm run dev
```

If `.env` already exists and your database is already created, the normal day-to-day command is just:

```bash
npm run dev
```

## Frontend Connection

Your frontend should point to this API using:

```env
VITE_API_BASE_URL=http://localhost:5000
```

If your backend runs on another port, use that port instead.

The frontend auth logic should call these endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/2fa/verify`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password/:token`

Health check:

- `GET /api/health`

## Auth Notes

- Authentication is cookie-based. The browser must send credentials with requests.
- There is no Laravel Sanctum setup in this backend.
- Login may return an MFA challenge before the user session is fully established.
- Google login redirects back to `FRONTEND_URL`.

## Common Problems

### PostgreSQL connection fails

Check:

- PostgreSQL is running
- Your `.env` values are correct
- The database named in `PG_DATABASE` exists
- The `users`, `homes`, `devices`, and `device_status` tables have been created from `sql.sql`

### CORS errors

Make sure:

- `FRONTEND_URL` in `.env` matches your frontend exactly
- Your frontend is using the same backend port as `VITE_API_BASE_URL`
- Axios is sending `withCredentials: true`

### Forgot-password email does not send

Check:

- `EMAIL_USER` and `EMAIL_PASS` are valid
- You are using a Gmail app password, not your normal Gmail password

### Google login fails

Check:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- The callback URL registered in Google Cloud matches your `.env`

## Scripts

- `npm run dev`: runs the API with `nodemon`
- `npm run seed`: clears and reseeds the database with demo data
- `npm start`: runs the API with Node

## What Was Fixed

The backend was adjusted so a fresh setup is more likely to work cleanly:

- enabled `POST /api/auth/register`
- fixed the `/api/devices` route mount
- added a correct `/toggle` device route while keeping the old typo route
- fixed `optionalAuth` middleware JWT verification
- removed auth protection from `POST /api/auth/2fa/verify` so login MFA can complete
- added `users` table creation to `sql.sql`
- added `.env.example`
