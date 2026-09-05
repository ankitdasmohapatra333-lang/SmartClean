# SmartClean Team Handoff

## Compatibility Status

The backend now matches Omm's frontend prompt and still keeps the older support routes.

Frontend base URL:

```text
http://localhost:5000/api
```

Backend status:

- API runs on `http://localhost:5000`
- OTP demo code is `123456`
- Admin login comes from the private `.env` values `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- MongoDB Atlas is attempted first
- If Atlas is blocked, backend runs in temporary memory mode for demo

## Required Frontend Routes

These routes are implemented:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/verify-otp`
- `POST /api/auth/admin-login`
- `POST /api/complaints`
- `GET /api/complaints`
- `GET /api/admin/complaints`
- `GET /api/admin/dashboard`
- `PUT /api/admin/complaints/:id/status`

## Demo Flow

1. Start backend: `npm start`
2. Citizen login/register with a 10-digit Indian mobile number.
3. Enter OTP: `123456`
4. Submit complaint to `POST /api/complaints`.
5. Admin login with the private `.env` values shared inside the team.
6. Admin dashboard loads from `GET /api/admin/dashboard`.
7. Admin list loads from `GET /api/admin/complaints`.
8. Admin updates status using `PUT /api/admin/complaints/:id/status`.
9. Citizen complaint page refreshes with updated status.

## Request/Response Shape

Complaint creation accepts:

- `category`
- `description`
- `photo` file or `photoUrl`
- `latitude`
- `longitude`
- `location`
- `priority`

Status values:

- `Pending`
- `Assigned`
- `In Progress`
- `Resolved`

Priority values:

- `Low`
- `Medium`
- `High`
- `Critical`

## What Still Needs Human Action

- Fix MongoDB Atlas Network Access by allow-listing the current IP address.
- Rotate the MongoDB password because the real connection string was shared during setup.
- Frontend team should keep `API_BASE_URL = "http://localhost:5000/api"`.
- Keep AI/IoT claims honest in PPT: current backend has rule-based priority and API-ready IoT zone status, not advanced ML or physical sensor integration yet.
