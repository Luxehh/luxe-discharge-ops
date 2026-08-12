# Discharge Ops

MERN stack multi-location discharge tracking application.

## Structure

```
luxe-discharge/
├── frontend/     # React + Vite + Tailwind CSS
└── backend/      # Node.js + Express (+ MongoDB optional)
```

## Prerequisites

- Node.js 18+
- MongoDB (optional — demo mode works without it)

## Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

API runs at `http://localhost:5000`.

Optional: with MongoDB running, seed demo users:

```bash
npm run seed
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

Create `frontend/.env` (see `.env.example`):

```
VITE_API_URL=http://localhost:5000
```

On live, set `VITE_API_URL` to your backend URL (no trailing slash), then rebuild.

## Demo Credentials

| Role        | Email              | Password     |
|-------------|--------------------|--------------|
| Super Admin | admin@rms.com      | Admin@123    |
| Illinois    | illinois@rms.com   | Illinois@123 |
| Indiana     | indiana@rms.com    | Indiana@123  |
| Missouri    | missouri@rms.com   | Missouri@123 |
| Oklahoma    | oklahoma@rms.com   | Oklahoma@123 |

## Routes

| Path                   | Page                  |
|------------------------|-----------------------|
| `/login`               | Sign in               |
| `/overview`            | Overview dashboard    |
| `/add-referral`        | Add Referral Details  |
| `/comparison-trends`   | Comparison & Trends   |
| `/locations`           | Locations             |
| `/insurances`          | Insurances            |
| `/not-accept-reasons`  | Not-Accept Reasons    |
| `/location-logins`     | Location Logins       |

After login, users are redirected to `/overview`. Super Admin sees all locations; location admins see their own location data.

## Dummy data & live fresh start

Backend `.env` flags:

| Variable | Value | Effect |
|----------|-------|--------|
| `FRONTEND_URL` | comma-separated origins | CORS allow-list (e.g. `http://localhost:5173,https://your-app.com`) |
| `SEED_DUMMY_DATA` | `true` | On Mongo connect, if referrals are empty and wipe flag is not set, seed ~4–5 house referrals per month for the current year and the previous 3 years |
| `ALLOW_DELETE_ALL` | `true` | Shows **Data Management → Delete All** for Super Admin |

**Local testing:** set both to `true`, restart the API (or run `npm run seed:dummy`), then exercise Overview / Comparison & Trends.

**Live deploy:** set `SEED_DUMMY_DATA=false`. Temporarily set `ALLOW_DELETE_ALL=true`, sign in as Super Admin, open **Data Management**, run **Delete All Records**, then set `ALLOW_DELETE_ALL=false` and restart. Delete All keeps logins, restores empty master lists (houses/insurances/etc.), and sets a DB flag so dummy referrals are never auto-added again even if `SEED_DUMMY_DATA` is later turned on.
