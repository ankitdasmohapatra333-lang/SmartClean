/*
    ======================================================
    SMARTCLEAN CONFIGURATION
    ======================================================
    
    1. SINGLE LAPTOP SETUP:
       Runs with Backend on http://localhost:5000/api
       
    2. TWO LAPTOPS SETUP (Laptop A: Backend, Laptop B: Frontend):
       - Find Laptop A's Local IP (e.g. run `ipconfig` in cmd -> e.g. 192.168.1.45)
       - Set BACKEND_HOST below to: "http://192.168.1.45:5000"
       - Or in Laptop B's browser console, run:
         localStorage.setItem("SMARTCLEAN_API_URL", "http://192.168.1.45:5000/api")
*/

/*
    Set your deployed Render backend URL here:
    Example: const RENDER_BACKEND_URL = "https://smartclean.onrender.com";
*/
const RENDER_BACKEND_URL = "https://smartclean-42mc.onrender.com";

const BACKEND_HOST = "http://localhost:5000";

function getApiBaseUrl() {
    // 1. Check custom runtime override (via localStorage or window)
    const custom = (typeof localStorage !== "undefined" && localStorage.getItem("SMARTCLEAN_API_URL"))
        || (typeof window !== "undefined" && window.SMARTCLEAN_API_URL);
    if (custom) {
        const clean = String(custom).trim().replace(/\/$/, "");
        return /\/api$/i.test(clean) ? clean : `${clean}/api`;
    }

    // 2. Check current browser location
    if (typeof window !== "undefined" && window.location) {
        const hostname = window.location.hostname;
        const port = window.location.port;

        // Local development (localhost / 127.0.0.1)
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            return `${BACKEND_HOST}/api`;
        }

        // Deployed on Render directly (same origin)
        if (hostname.endsWith("onrender.com") && port !== "5000") {
            return `${window.location.origin}/api`;
        }

        // Local network access (LAN IP on port 5000)
        if (port === "5000") {
            return `${window.location.origin}/api`;
        }
    }

    // 3. Deployed on Vercel: use RENDER_BACKEND_URL
    if (RENDER_BACKEND_URL && RENDER_BACKEND_URL.trim() !== "") {
        const clean = RENDER_BACKEND_URL.trim().replace(/\/$/, "");
        return /\/api$/i.test(clean) ? clean : `${clean}/api`;
    }

    return `${BACKEND_HOST}/api`;
}

const API_BASE_URL = getApiBaseUrl();

/*
    DEMO_MODE = true
    ----------------
    Standalone mode using browser localStorage without a backend.

    DEMO_MODE = false
    -----------------
    Connected mode using live Node.js REST API and MongoDB.
*/
const DEMO_MODE = false;