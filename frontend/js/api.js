async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("smartclean_token");
    const userStr = localStorage.getItem("smartclean_user");
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