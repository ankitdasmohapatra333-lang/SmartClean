# SmartClean Backend

Backend API for SIH Problem Statement 26195: waste complaint reporting, OTP citizen login, admin dashboard, complaint status tracking, zone/bin monitoring, and sanitation alerts.

## Run

```bash
npm install
npm start
```

Base URL for the frontend:

```text
http://localhost:5000/api
```

Development credentials are configured in your private `.env` file:

```text
Citizen OTP: 123456
Admin email: set ADMIN_EMAIL in .env
Admin password: set ADMIN_PASSWORD in .env
```

If MongoDB Atlas is unreachable, `ALLOW_MEMORY_FALLBACK=true` lets the server keep running with temporary in-memory demo data. `/api/health` will show `database: "offline-memory"` in that case.

## Frontend-Compatible Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register citizen and generate OTP |
| POST | `/api/auth/login` | Login citizen and generate OTP |
| POST | `/api/auth/verify-otp` | Verify OTP and return token |
| POST | `/api/auth/admin-login` | Admin login and return token |
| POST | `/api/complaints` | Citizen complaint submission |
| GET | `/api/complaints` | Citizen complaint tracking list |
| GET | `/api/admin/complaints` | Admin complaint list with filters |
| GET | `/api/admin/dashboard` | Admin KPI cards and analytics |
| PUT | `/api/admin/complaints/:id/status` | Admin status/assignment update |

Extra demo/support endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API and MongoDB connection status |
| GET | `/api/zones` | Zone/bin status list |
| POST | `/api/zones/status` | Manual/IoT bin fill and sanitation update |
| GET | `/api/alerts` | Collection, urgent complaint, and sanitation alerts |
| GET | `/api/dashboard/summary` | Backward-compatible dashboard summary |
| GET | `/api/zones/analysis/hotspots` | Hotspot ranking |
| GET | `/api/analysis/waste-types` | Category analytics |

## Complaint Fields

`POST /api/complaints` accepts JSON or `multipart/form-data`.

```json
{
  "category": "Garbage Dump",
  "description": "Large garbage dump near Gate 3",
  "location": "Gate 3",
  "latitude": 20.2961,
  "longitude": 85.8245,
  "priority": "High"
}
```

Photo upload field can be `photo` or any image file field. Files are stored under `/uploads/complaints`.

Allowed status values:

```text
Pending, Assigned, In Progress, Resolved
```

Allowed priority values:

```text
Low, Medium, High, Critical
```

## Frontend Example

```js
const API_BASE_URL = 'http://localhost:5000/api';

const login = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mobile: '9876543210' })
}).then((res) => res.json());

const verified = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mobile: '9876543210', otp: '123456' })
}).then((res) => res.json());

const token = verified.token;

await fetch(`${API_BASE_URL}/complaints`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    category: 'Garbage Dump',
    description: 'Large garbage dump near Gate 3',
    location: 'Gate 3'
  })
});
```
