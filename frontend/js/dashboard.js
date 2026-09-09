document.addEventListener("DOMContentLoaded", function () {
    loadUserData();
    loadDashboard();
});


/* =========================
   USER DATA
========================= */

function loadUserData() {
    try {
        const user = JSON.parse(
            localStorage.getItem("smartclean_user") || "null"
        );

        if (!user) return;

        const name = user.name || "Citizen";

        const userName =
            document.getElementById("userName");

        const welcomeName =
            document.getElementById("welcomeName");

        if (userName) {
            userName.textContent = name;
        }

        if (welcomeName) {
            welcomeName.textContent = name;
        }

    } catch (error) {
        console.error("Unable to load user data:", error);
    }
}


/* =========================
   DASHBOARD
========================= */

async function loadDashboard() {

    /*
        DEMO MODE
        ----------
        Data comes from localStorage.
    */

    if (typeof DEMO_MODE !== "undefined" && DEMO_MODE) {
        loadDemoDashboard();
        return;
    }


    /*
        BACKEND MODE
        ------------
        Data comes from Node.js backend.
    */

    try {
        const response = await apiRequest("/complaints", { method: "GET" });
        const complaints = Array.isArray(response) ? response : (response.complaints || []);

        const total = complaints.length;
        const pending = complaints.filter(c => (c.status || "Pending") === "Pending").length;
        const resolved = complaints.filter(c => c.status === "Resolved").length;

        updateDashboardStats({ total, pending, resolved });
        displayRecentComplaints(complaints);
    } catch (error) {
        console.warn("Backend citizen dashboard load failed, falling back to local demo data:", error);
        loadDemoDashboard();
    }
}


/* =========================
   DEMO DASHBOARD
========================= */

function loadDemoDashboard() {

    const complaints = getDemoComplaints();

    const total = complaints.length;

    const pending =
        complaints.filter(function (c) {
            return c.status === "Pending";
        }).length;

    const resolved =
        complaints.filter(function (c) {
            return c.status === "Resolved";
        }).length;

    updateDashboardStats({
        total: total,
        pending: pending,
        resolved: resolved
    });

    displayRecentComplaints(complaints);
}


/* =========================
   UPDATE STATISTICS
========================= */

function updateDashboardStats(data) {

    const totalElement =
        document.getElementById("totalComplaints");

    const pendingElement =
        document.getElementById("pendingComplaints");

    const resolvedElement =
        document.getElementById("resolvedComplaints");


    const total =
        data.total ??
        data.totalComplaints ??
        0;

    const pending =
        data.pending ??
        data.pendingComplaints ??
        0;

    const resolved =
        data.resolved ??
        data.resolvedComplaints ??
        0;


    if (totalElement) {
        totalElement.textContent = total;
    }

    if (pendingElement) {
        pendingElement.textContent = pending;
    }

    if (resolvedElement) {
        resolvedElement.textContent = resolved;
    }
}


/* =========================
   BACKEND COMPLAINTS
========================= */

async function loadBackendComplaints() {

    try {

        const response = await apiRequest(
            "/complaints",
            {
                method: "GET"
            }
        );

        const complaints =
            Array.isArray(response)
                ? response
                : response.complaints || [];

        displayRecentComplaints(complaints);

    } catch (error) {

        console.error(
            "Unable to load complaints:",
            error
        );

        showDashboardError(
            "Unable to load recent complaints."
        );
    }
}


/* =========================
   RECENT COMPLAINTS
========================= */

function displayRecentComplaints(complaints) {

    const container =
        document.getElementById("recentComplaints");

    if (!container) return;


    if (!complaints.length) {

        container.innerHTML = `
            <div class="empty-state">

                <div>📋</div>

                <h5>No reports yet</h5>

                <p>
                    Your submitted complaints will appear here.
                </p>

            </div>
        `;

        return;
    }


    const recent =
        complaints
            .slice()
            .reverse()
            .slice(0, 5);


    container.innerHTML =
        recent.map(function (c) {

            const category =
                c.category || "Waste Issue";

            const description =
                c.description || "No description";

            const status =
                c.status || "Pending";


            return `
                <div class="quick-action">

                    <span class="quick-action-icon">
                        🗑️
                    </span>

                    <div>

                        <strong>
                            ${escapeHTML(category)}
                        </strong>

                        <small>
                            ${escapeHTML(
                                description.substring(0, 60)
                            )}${description.length > 60 ? "..." : ""}
                        </small>

                    </div>

                    <span class="ms-auto status-badge ${getStatusClass(status)}">
                        ${escapeHTML(status)}
                    </span>

                </div>
            `;

        }).join("");
}


/* =========================
   STATUS CLASS
========================= */

function getStatusClass(status) {

    switch (status) {

        case "Pending":
            return "status-pending";

        case "Assigned":
            return "status-assigned";

        case "In Progress":
            return "status-progress";

        case "Resolved":
            return "status-resolved";

        default:
            return "status-default";
    }
}


/* =========================
   DEMO STORAGE
========================= */

function getDemoComplaints() {

    try {

        const saved =
            localStorage.getItem(
                "smartcleanComplaints"
            );

        if (!saved) {
            return [];
        }

        const complaints =
            JSON.parse(saved);

        return Array.isArray(complaints)
            ? complaints
            : [];

    } catch (error) {

        console.error(
            "Unable to read complaints:",
            error
        );

        return [];
    }
}


/* =========================
   ERROR MESSAGE
========================= */

function showDashboardError(message) {

    const container =
        document.getElementById("recentComplaints");

    if (!container) return;

    container.innerHTML = `
        <div class="empty-state">

            <div>⚠️</div>

            <h5>Unable to load data</h5>

            <p>
                ${escapeHTML(message)}
            </p>

            <button
                type="button"
                class="btn btn-smart mt-2"
                onclick="loadDashboard()"
            >
                Try Again
            </button>

        </div>
    `;
}


/* =========================
   SAFE HTML
========================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}