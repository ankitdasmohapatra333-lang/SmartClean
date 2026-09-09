# ?? SMARTCLEAN Frontend Client

Responsive citizen and municipal administration web application.

## Run on this Laptop
Open index.html in your browser, or with VS Code Live Server (http://127.0.0.1:5500/frontend/index.html).

## Connecting to Backend on Another Laptop
1. Open js/config.js.
2. Change const BACKEND_HOST = " http://localhost:5000\; to your backend laptop IP (e.g. \http://192.168.1.45:5000\).
3. Or in your browser console, type:
 `javascript
 localStorage.setItem(\SMARTCLEAN_API_URL\, \http://192.168.1.45:5000/api\);
 `
