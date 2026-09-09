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

const BACKEND_HOST = "http://localhost:5000";

function getApiBaseUrl() {
    const custom = localStorage.getItem("SMARTCLEAN_API_URL");
    if (custom) return custom;

    const hostname = window.location.hostname;
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.startsWith("file")) {
        return `http://${hostname}:5000/api`;
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