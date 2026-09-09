# 🌿 SMARTCLEAN - Full Stack Application

Intelligent Waste Segregation, Disposal Tracking, and Sanitation Monitoring System (SIH Problem Statement 26195).

---

## 📁 Project Architecture

```text
SmartClean/
├── frontend/                        # Web Client (HTML, CSS, JS)
│   ├── CSS/
│   │   └── style.css                # Global & responsive styling
│   ├── js/
│   │   ├── config.js                # API Base URL & backend host config
│   │   ├── api.js                   # Unified fetch API client
│   │   ├── auth.js                  # OTP authentication & session management
│   │   ├── complaints.js            # Complaint submission & tracking
│   │   ├── dashboard.js             # Citizen dashboard & KPI metrics
│   │   ├── admin.js                 # Admin management & status controls
│   │   ├── report.js                # Geo-tagged complaint reporting
│   │   └── chatbot.js               # AI sanitation assistant
│   ├── index.html                   # Landing page
│   ├── login.html                   # Citizen OTP login
│   ├── register.html                # Citizen registration
│   ├── otp.html                     # 6-Box OTP input verification
│   ├── dashboard.html               # Citizen portal
│   ├── report.html                  # New complaint submission with GPS/photo
│   ├── complaints.html              # Citizen complaint tracking
│   ├── admin-login.html             # Municipality admin login
│   └── admin-dashboard.html         # Municipality command center
│
├── backend/                         # Node.js + Express + MongoDB REST API
│   ├── models/
│   │   ├── Complaint.js             # Complaint MongoDB schema
│   │   ├── OTP.js                   # OTP verification schema & session store
│   │   ├── User.js                  # Citizen & admin user models
│   │   └── Zone.js                  # Bin fill & sanitation zones
│   ├── uploads/                     # Uploaded complaint photos
│   ├── server.js                    # Express REST API, CORS & dispatchers
│   ├── package.json                 # Backend dependencies
│   ├── .env.example                 # Environment variable template
│   └── smartclean.postman_collection.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide

### 💻 Mode 1: Single Laptop Setup (Frontend & Backend on Same Machine)

1. **Start the Backend:**
   ```bash
   cd backend
   npm install
   npm start
   ```
   *Backend will start on `http://localhost:5000` with MongoDB Atlas connected.*

2. **Open the Frontend:**
   * Open `frontend/index.html` directly in your browser or with VS Code **Live Server** (`http://127.0.0.1:5500/frontend/index.html`).
   * Or navigate to `http://localhost:5000` (the backend automatically serves the frontend).

---

### 💻 Mode 2: Two Laptops Setup (Laptop A = Backend, Laptop B = Frontend)

> **Yes! Frontend and Backend can run simultaneously on two separate laptops over the same Wi-Fi / Local Area Network (LAN) or over the Internet.**

#### Step 1: Start Backend on Laptop A
1. Connect Laptop A and Laptop B to the **same Wi-Fi network**.
2. On Laptop A, open Command Prompt or Terminal and find its local IP:
   * **Windows:** `ipconfig` (Look for `IPv4 Address`, e.g., `192.168.1.45`)
   * **Mac/Linux:** `ifconfig` or `ip a`
3. Start the backend:
   ```bash
   cd backend
   npm start
   ```
   *The backend listens on `0.0.0.0:5000`, making it accessible to all devices on the network.*

#### Step 2: Configure Frontend on Laptop B
1. Copy the `frontend` folder to Laptop B.
2. Open `frontend/js/config.js` on Laptop B and set Laptop A's IP address:
   ```javascript
   const BACKEND_HOST = "http://192.168.1.45:5000"; // Replace with Laptop A's IP
   ```
   *(Alternatively, on Laptop B's browser console, run: `localStorage.setItem("SMARTCLEAN_API_URL", "http://192.168.1.45:5000/api")`)*
3. Open `frontend/index.html` on Laptop B using Live Server, Python HTTP server, or double-click to open in browser.
4. **All actions (Citizen OTP Login, Complaint Filing, Admin Status Updates) will communicate directly with Laptop A in real-time!**

---

## 🔐 Environment Configuration (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/smartclean?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=admin@smartclean.com
ADMIN_PASSWORD=admin123
ALLOW_MEMORY_FALLBACK=true
TWOFACTOR_API_KEY=your_2factor_api_key
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register citizen & generate OTP |
| `POST` | `/api/auth/login` | Citizen login & generate OTP |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP & issue JWT session |
| `POST` | `/api/auth/admin-login` | Admin authentication |
| `GET` | `/api/health` | Service & database health monitor |
| `POST` | `/api/complaints` | File citizen complaint with photo & GPS |
| `GET` | `/api/complaints` | List citizen's filed complaints |
| `GET` | `/api/admin/complaints` | Admin complaint repository with search & filter |
| `GET` | `/api/admin/dashboard` | KPI metrics & category statistics |
| `PUT` | `/api/admin/complaints/:id/status` | Update resolution status & assign crew |
| `GET` | `/api/zones` | Real-time bin fill levels & sanitation alerts |
| `POST` | `/api/zones/status` | Update IoT bin fill & sanitation status |
