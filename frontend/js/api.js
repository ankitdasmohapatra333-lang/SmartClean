async function apiRequest(endpoint, options = {}) {
    const token = getSmartcleanToken();
    const userStr = getSmartcleanUserJSON();
    let userMobile = "";

    try {
        if (userStr) {
            const u = JSON.parse(userStr);
            if (u && u.mobile) {
                userMobile = String(u.mobile).trim();
            }
        }
    } catch (e) {}

    const headers = {
        ...(options.headers || {})
    };

    /*
        Do not set Content-Type manually for FormData.
        Browser automatically adds the multipart boundary.
    */

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    /*
        Add authentication token when available.
    */

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    if (userMobile) {
        headers["X-Citizen-Mobile"] = userMobile;
    }

    const response = await fetch(
        API_BASE_URL + endpoint,
        {
            ...options,
            headers
        }
    );

    /*
        Safely handle JSON and non-JSON responses.
    */

    let data;

    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            `Request failed (${response.status})`
        );
    }

    return data;
}


/* =========================
   DEMO COMPLAINT STORAGE
========================= */

/*
    Use ONE storage key throughout
    the SMARTCLEAN frontend.
*/

function getDemoComplaints() {

    try {

        const data = localStorage.getItem(
            "smartcleanComplaints"
        );

        if (!data) {
            return [];
        }

        const complaints = JSON.parse(data);

        return Array.isArray(complaints)
            ? complaints
            : [];

    } catch (error) {

        console.error(
            "Unable to read demo complaints:",
            error
        );

        return [];
    }
}


function saveDemoComplaints(data) {

    try {

        localStorage.setItem(
            "smartcleanComplaints",
            JSON.stringify(data)
        );

    } catch (error) {

        console.error(
            "Unable to save demo complaints:",
            error
        );
    }
}

function getSmartcleanToken() {
    return (
        sessionStorage.getItem("smartclean_token") ||
        localStorage.getItem("smartclean_token") ||
        ""
    );
}

function getSmartcleanUserJSON() {
    return (
        sessionStorage.getItem("smartclean_user") ||
        localStorage.getItem("smartclean_user") ||
        ""
    );
}

function getSmartcleanUser() {
    try {
        const user = JSON.parse(getSmartcleanUserJSON() || "null");
        return user && typeof user === "object" ? user : null;
    } catch (error) {
        return null;
    }
}

function setCitizenSession(token, user) {
    sessionStorage.setItem("smartclean_token", token);
    sessionStorage.setItem("smartclean_user", JSON.stringify(user || {}));
    localStorage.removeItem("smartclean_token");
    localStorage.removeItem("smartclean_user");
}

function clearCitizenSession() {
    sessionStorage.removeItem("smartclean_token");
    sessionStorage.removeItem("smartclean_user");
    localStorage.removeItem("smartclean_token");
    localStorage.removeItem("smartclean_user");
}

function requireCitizenSession() {
    const hasCurrentSession = Boolean(sessionStorage.getItem("smartclean_token"));

    if (hasCurrentSession) {
        return true;
    }

    localStorage.removeItem("smartclean_token");
    localStorage.removeItem("smartclean_user");

    const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";
    window.location.href = `login.html?next=${encodeURIComponent(currentPage)}`;
    return false;
}
