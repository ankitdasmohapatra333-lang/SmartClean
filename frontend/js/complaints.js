document.addEventListener("DOMContentLoaded", function () {
    setupComplaintsLanguage();
    loadComplaints();
});


/* =========================================================
   GLOBAL STATE
========================================================= */

let allComplaints = [];
let currentSearch = "";
let currentStatusFilter = "All";


/* =========================================================
   TRANSLATIONS
========================================================= */

const complaintsTranslations = {

    en: {
        badge: "SMARTCLEAN",
        pageTitle: "My Reports",
        pageDescription:
            "Track the progress of your submitted sanitation complaints from submission to resolution.",
        dashboard: "Dashboard",

        resolvedTitle: "Complaint Resolved",
        resolvedText:
            "Your complaint has been successfully resolved.",

        introTitle: "Track Your Complaints",
        introText:
            "Monitor every report and follow its progress until resolution.",

        activity: "YOUR ACTIVITY",
        submittedReports: "Submitted Reports",

        totalReports: "Total Reports",
        pendingReports: "Pending",
        progressReports: "In Progress",
        resolvedReports: "Resolved",

        refresh: "Refresh",
        refreshing: "Refreshing...",
        newReport: "＋ New Report",

        statusGuide: "STATUS GUIDE",
        pending: "Pending",
        assigned: "Assigned",
        inProgress: "In Progress",
        resolved: "Resolved",

        loadingTitle: "Loading reports...",
        loadingText:
            "Please wait while we retrieve your complaints.",

        category: "Category",
        complaintDescription: "Description",
        location: "Location",
        priority: "Priority",

        locationCaptured: "Location captured",
        coordinatesUnavailable: "Coordinates unavailable",
        noDescription: "No description provided.",
        other: "Other",

        photo: "photo",
        photos: "photos",
        attached: "attached",

        complaintResolved: "Complaint Resolved",
        resolvedMessage:
            "This complaint has been successfully resolved.",

        noMatchingComplaints: "No matching complaints",
        changeSearchFilter:
            "Try changing your search or status filter.",

        noComplaints: "No complaints found",
        noReportsYet:
            "You have not submitted any sanitation reports yet.",

        reportIssue: "Report an Issue",
        clearFilters: "Clear Filters",

        thankYouTitle:
            "Thank you for helping keep our community clean.",
        thankYouText:
            "Every accurate report helps identify sanitation issues and improve municipal response.",

        footerTagline:
            "Report → Prioritize → Act → Resolve",

        searchPlaceholder: "Search complaints..."
    },


    hi: {
        badge: "SMARTCLEAN",
        pageTitle: "मेरी शिकायतें",
        pageDescription:
            "अपनी स्वच्छता शिकायतों की स्थिति को जमा करने से समाधान तक ट्रैक करें।",
        dashboard: "डैशबोर्ड",

        resolvedTitle: "शिकायत का समाधान हो गया",
        resolvedText:
            "आपकी शिकायत का सफलतापूर्वक समाधान कर दिया गया है।",

        introTitle: "अपनी शिकायतें ट्रैक करें",
        introText:
            "हर शिकायत की स्थिति देखें और समाधान तक उसकी प्रगति को ट्रैक करें।",

        activity: "आपकी गतिविधि",
        submittedReports: "जमा की गई शिकायतें",

        totalReports: "कुल शिकायतें",
        pendingReports: "लंबित",
        progressReports: "प्रगति में",
        resolvedReports: "समाधान हो गया",

        refresh: "रिफ्रेश",
        refreshing: "रिफ्रेश हो रहा है...",
        newReport: "＋ नई शिकायत",

        statusGuide: "स्थिति मार्गदर्शिका",
        pending: "लंबित",
        assigned: "असाइन की गई",
        inProgress: "प्रगति में",
        resolved: "समाधान हो गया",

        loadingTitle: "शिकायतें लोड हो रही हैं...",
        loadingText:
            "कृपया प्रतीक्षा करें, आपकी शिकायतें प्राप्त की जा रही हैं।",

        category: "श्रेणी",
        complaintDescription: "विवरण",
        location: "स्थान",
        priority: "प्राथमिकता",

        locationCaptured: "स्थान प्राप्त किया गया",
        coordinatesUnavailable: "निर्देशांक उपलब्ध नहीं हैं",
        noDescription: "कोई विवरण नहीं दिया गया है।",
        other: "अन्य",

        photo: "फोटो",
        photos: "फोटो",
        attached: "संलग्न",

        complaintResolved: "शिकायत का समाधान हो गया",
        resolvedMessage:
            "इस शिकायत का सफलतापूर्वक समाधान कर दिया गया है।",

        noMatchingComplaints: "कोई मिलती-जुलती शिकायत नहीं मिली",
        changeSearchFilter:
            "अपनी खोज या स्थिति फ़िल्टर बदलकर देखें।",

        noComplaints: "कोई शिकायत नहीं मिली",
        noReportsYet:
            "आपने अभी तक कोई स्वच्छता शिकायत दर्ज नहीं की है।",

        reportIssue: "समस्या की शिकायत करें",
        clearFilters: "फ़िल्टर हटाएँ",

        thankYouTitle:
            "हमारे समुदाय को स्वच्छ रखने में मदद करने के लिए धन्यवाद।",
        thankYouText:
            "हर सही शिकायत स्वच्छता समस्याओं की पहचान करने और नगर निकाय की प्रतिक्रिया बेहतर बनाने में मदद करती है।",

        footerTagline:
            "रिपोर्ट → प्राथमिकता → कार्रवाई → समाधान",

        searchPlaceholder: "शिकायत खोजें..."
    },


    or: {
        badge: "SMARTCLEAN",
        pageTitle: "ମୋର ଅଭିଯୋଗ",
        pageDescription:
            "ଆପଣଙ୍କ ସ୍ୱଚ୍ଛତା ଅଭିଯୋଗର ସ୍ଥିତିକୁ ଦାଖଲ ଠାରୁ ସମାଧାନ ପର୍ଯ୍ୟନ୍ତ ଟ୍ରାକ୍ କରନ୍ତୁ।",
        dashboard: "ଡ୍ୟାସବୋର୍ଡ",

        resolvedTitle: "ଅଭିଯୋଗର ସମାଧାନ ହୋଇଛି",
        resolvedText:
            "ଆପଣଙ୍କ ଅଭିଯୋଗର ସଫଳତାର ସହ ସମାଧାନ ହୋଇଛି।",

        introTitle: "ଆପଣଙ୍କ ଅଭିଯୋଗ ଟ୍ରାକ୍ କରନ୍ତୁ",
        introText:
            "ପ୍ରତ୍ୟେକ ଅଭିଯୋଗର ସ୍ଥିତି ଦେଖନ୍ତୁ ଏବଂ ସମାଧାନ ପର୍ଯ୍ୟନ୍ତ ପ୍ରଗତି ଟ୍ରାକ୍ କରନ୍ତୁ।",

        activity: "ଆପଣଙ୍କ କାର୍ଯ୍ୟକଳାପ",
        submittedReports:
            "ଦାଖଲ ହୋଇଥିବା ଅଭିଯୋଗ",

        totalReports: "ମୋଟ ଅଭିଯୋଗ",
        pendingReports: "ବିଚାରାଧୀନ",
        progressReports: "ପ୍ରଗତିରେ",
        resolvedReports: "ସମାଧାନ ହୋଇଛି",

        refresh: "ରିଫ୍ରେଶ",
        refreshing: "ରିଫ୍ରେଶ ହେଉଛି...",
        newReport: "＋ ନୂଆ ଅଭିଯୋଗ",

        statusGuide: "ସ୍ଥିତି ମାର୍ଗଦର୍ଶିକା",
        pending: "ବିଚାରାଧୀନ",
        assigned: "ନିଯୁକ୍ତ",
        inProgress: "ପ୍ରଗତିରେ",
        resolved: "ସମାଧାନ ହୋଇଛି",

        loadingTitle: "ଅଭିଯୋଗ ଲୋଡ୍ ହେଉଛି...",
        loadingText:
            "ଦୟାକରି ଅପେକ୍ଷା କରନ୍ତୁ, ଆପଣଙ୍କ ଅଭିଯୋଗଗୁଡ଼ିକ ଆଣାଯାଉଛି।",

        category: "ଶ୍ରେଣୀ",
        complaintDescription: "ବିବରଣୀ",
        location: "ସ୍ଥାନ",
        priority: "ପ୍ରାଥମିକତା",

        locationCaptured: "ସ୍ଥାନ ଗ୍ରହଣ କରାଯାଇଛି",
        coordinatesUnavailable:
            "କୋଅର୍ଡିନେଟ୍ ଉପଲବ୍ଧ ନାହିଁ",
        noDescription: "କୌଣସି ବିବରଣୀ ଦିଆଯାଇନାହିଁ।",
        other: "ଅନ୍ୟ",

        photo: "ଫଟୋ",
        photos: "ଫଟୋ",
        attached: "ସଂଲଗ୍ନ",

        complaintResolved:
            "ଅଭିଯୋଗର ସମାଧାନ ହୋଇଛି",
        resolvedMessage:
            "ଏହି ଅଭିଯୋଗର ସଫଳତାର ସହ ସମାଧାନ ହୋଇଛି।",

        noMatchingComplaints:
            "କୌଣସି ମେଳ ଖାଉଥିବା ଅଭିଯୋଗ ମିଳିଲା ନାହିଁ",

        changeSearchFilter:
            "ଆପଣଙ୍କ ସନ୍ଧାନ କିମ୍ବା ସ୍ଥିତି ଫିଲ୍ଟର ବଦଳାଇ ଦେଖନ୍ତୁ।",

        noComplaints:
            "କୌଣସି ଅଭିଯୋଗ ମିଳିଲା ନାହିଁ",

        noReportsYet:
            "ଆପଣ ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ସ୍ୱଚ୍ଛତା ଅଭିଯୋଗ ଦାଖଲ କରିନାହାନ୍ତି।",

        reportIssue: "ସମସ୍ୟା ରିପୋର୍ଟ କରନ୍ତୁ",
        clearFilters: "ଫିଲ୍ଟର ସଫା କରନ୍ତୁ",

        thankYouTitle:
            "ଆମ ସମୁଦାୟକୁ ସ୍ୱଚ୍ଛ ରଖିବାରେ ସାହାଯ୍ୟ କରିଥିବାରୁ ଧନ୍ୟବାଦ।",

        thankYouText:
            "ପ୍ରତ୍ୟେକ ସଠିକ୍ ଅଭିଯୋଗ ସ୍ୱଚ୍ଛତା ସମସ୍ୟା ଚିହ୍ନଟ କରିବା ଏବଂ ପୌରସଂସ୍ଥାର ପ୍ରତିକ୍ରିୟା ଉନ୍ନତ କରିବାରେ ସାହାଯ୍ୟ କରେ।",

        footerTagline:
            "ରିପୋର୍ଟ → ପ୍ରାଥମିକତା → କାର୍ଯ୍ୟ → ସମାଧାନ",

        searchPlaceholder:
            "ଅଭିଯୋଗ ଖୋଜନ୍ତୁ..."
    }

};


/* =========================================================
   LANGUAGE HELPERS
========================================================= */

function getCurrentLanguage() {
    const savedLanguage =
        localStorage.getItem("smartcleanLanguage") || "en";

    return complaintsTranslations[savedLanguage]
        ? savedLanguage
        : "en";
}


function getTranslation(key) {
    const language = getCurrentLanguage();

    return (
        complaintsTranslations[language][key] ||
        complaintsTranslations.en[key] ||
        key
    );
}


function translateStatus(status) {
    switch (status) {
        case "Pending":
            return getTranslation("pending");

        case "Assigned":
            return getTranslation("assigned");

        case "In Progress":
            return getTranslation("inProgress");

        case "Resolved":
            return getTranslation("resolved");

        default:
            return status;
    }
}


/* =========================================================
   LOAD COMPLAINTS
========================================================= */

async function loadComplaints() {
    const container =
        document.getElementById("complaintsList");

    if (!container) return;

    container.innerHTML = `
        <div class="complaints-loading">
            <div class="loading-icon">📋</div>
            <h5>${escapeHTML(
                getTranslation("loadingTitle")
            )}</h5>
            <p>${escapeHTML(
                getTranslation("loadingText")
            )}</p>
        </div>
    `;

    if (typeof DEMO_MODE !== "undefined" && DEMO_MODE) {
        allComplaints = getDemoComplaints();
        updateComplaintSummary(allComplaints);
        showResolvedNotification(allComplaints);
        renderComplaints();
        return;
    }

    try {
        const response = await apiRequest("/complaints", { method: "GET" });
        const list = Array.isArray(response) ? response : (response.complaints || []);
        allComplaints = list;
        updateComplaintSummary(allComplaints);
        showResolvedNotification(allComplaints);
        renderComplaints();
    } catch (error) {
        console.warn("Backend complaints load failed, falling back to local demo data:", error);
        allComplaints = getDemoComplaints();
        updateComplaintSummary(allComplaints);
        showResolvedNotification(allComplaints);
        renderComplaints();
    }
}


/* =========================================================
   RENDER COMPLAINTS
========================================================= */

function renderComplaints() {
    const container =
        document.getElementById("complaintsList");

    if (!container) return;

    let filteredComplaints =
        allComplaints.slice();

    if (currentStatusFilter !== "All") {
        filteredComplaints =
            filteredComplaints.filter(function (complaint) {
                return (
                    complaint.status || "Pending"
                ) === currentStatusFilter;
            });
    }

    if (currentSearch) {
        filteredComplaints =
            filteredComplaints.filter(function (complaint) {

                const searchableText = [
                    complaint.complaintId,
                    complaint.id,
                    complaint.category,
                    complaint.description,
                    complaint.location,
                    complaint.priority,
                    complaint.status
                ]
                    .join(" ")
                    .toLowerCase();

                return searchableText.includes(
                    currentSearch
                );
            });
    }

    if (!filteredComplaints.length) {

        const hasFilters =
            currentSearch ||
            currentStatusFilter !== "All";

        container.innerHTML = `
            <div class="dashboard-card empty-state">

                <div class="empty-state-icon">
                    ${hasFilters ? "🔎" : "📋"}
                </div>

                <h5>
                    ${escapeHTML(
                        hasFilters
                            ? getTranslation(
                                "noMatchingComplaints"
                            )
                            : getTranslation(
                                "noComplaints"
                            )
                    )}
                </h5>

                <p>
                    ${escapeHTML(
                        hasFilters
                            ? getTranslation(
                                "changeSearchFilter"
                            )
                            : getTranslation(
                                "noReportsYet"
                            )
                    )}
                </p>

                ${
                    !hasFilters
                        ? `
                            <a
                                href="report.html"
                                class="btn btn-smart mt-2"
                            >
                                ${escapeHTML(
                                    getTranslation(
                                        "reportIssue"
                                    )
                                )}
                            </a>
                        `
                        : `
                            <button
                                type="button"
                                class="btn btn-outline-secondary mt-2"
                                onclick="clearComplaintFilters()"
                            >
                                ${escapeHTML(
                                    getTranslation(
                                        "clearFilters"
                                    )
                                )}
                            </button>
                        `
                }

            </div>
        `;

        return;
    }

    container.innerHTML =
        filteredComplaints
            .slice()
            .reverse()
            .map(function (complaint) {
                return createComplaintCard(
                    complaint
                );
            })
            .join("");
}


/* =========================================================
   CREATE COMPLAINT CARD
========================================================= */

function createComplaintCard(c) {

    const status =
        c.status || "Pending";

    const priority =
        c.priority || "Medium";

    const statusClass =
        String(status)
            .toLowerCase()
            .replaceAll(" ", "-");

    const locationText =
        c.location ||
        getTranslation("locationCaptured");

    const coordinatesAvailable =
        c.latitude !== undefined &&
        c.latitude !== null &&
        c.latitude !== "" &&
        c.longitude !== undefined &&
        c.longitude !== null &&
        c.longitude !== "";

    const photoCount =
        Array.isArray(c.photos)
            ? c.photos.length
            : c.photo
                ? 1
                : 0;

    const categoryText =
        c.category ||
        getTranslation("other");

    const descriptionText =
        c.description ||
        getTranslation("noDescription");

    const rawId =
        c.complaintId ||
        c.id ||
        "N/A";

    const displayComplaintId =
        String(rawId).startsWith("Complaint ID:")
            ? rawId
            : `Complaint ID: ${rawId}`;

    let formattedDate =
        c.createdAt || "Date unavailable";
    if (c.createdAt && !isNaN(Date.parse(c.createdAt))) {
        try {
            formattedDate = new Date(c.createdAt).toLocaleString();
        } catch (e) {}
    }

    return `
        <div
            class="dashboard-card complaint-card mb-3"
            data-status="${escapeHTML(
                statusClass
            )}"
            data-priority="${escapeHTML(
                String(priority).toLowerCase()
            )}"
        >

            <div class="card-header-custom">

                <div>

                    <strong>
                        ${escapeHTML(
                            displayComplaintId
                        )}
                    </strong>

                    <div class="text-muted small">
                        ${escapeHTML(
                            formattedDate
                        )}
                    </div>

                </div>

                <span
                    class="badge ${getStatusBadge(
                        status
                    )}"
                >
                    ${escapeHTML(
                        translateStatus(status)
                    )}
                </span>

            </div>


            <div class="row g-3">

                <div class="col-md-3">

                    <strong>
                        ${escapeHTML(
                            getTranslation(
                                "category"
                            )
                        )}
                    </strong>

                    <p class="mb-2">
                        ${escapeHTML(
                            categoryText
                        )}
                    </p>

                    <span class="small text-muted">
                        ${escapeHTML(
                            getTranslation(
                                "priority"
                            )
                        )}:
                    </span>

                    <span
                        class="badge ${getPriorityBadge(
                            priority
                        )}"
                    >
                        ${escapeHTML(
                            translatePriority(
                                priority
                            )
                        )}
                    </span>

                </div>


                <div class="col-md-5">

                    <strong>
                        ${escapeHTML(
                            getTranslation(
                                "complaintDescription"
                            )
                        )}
                    </strong>

                    <p class="mb-0">
                        ${escapeHTML(
                            descriptionText
                        )}
                    </p>

                </div>


                <div class="col-md-4">

                    <strong>
                        ${escapeHTML(
                            getTranslation(
                                "location"
                            )
                        )}
                    </strong>

                    <p class="mb-1">
                        📍
                        ${escapeHTML(
                            locationText
                        )}
                    </p>

                    ${
                        coordinatesAvailable
                            ? `
                                <small class="text-muted">
                                    ${escapeHTML(
                                        String(
                                            c.latitude
                                        )
                                    )},
                                    ${escapeHTML(
                                        String(
                                            c.longitude
                                        )
                                    )}
                                </small>
                            `
                            : `
                                <small class="text-muted">
                                    ${escapeHTML(
                                        getTranslation(
                                            "coordinatesUnavailable"
                                        )
                                    )}
                                </small>
                            `
                    }

                </div>

            </div>


            ${
                photoCount > 0
                    ? `
                        <div class="complaint-photo-info">

                            📷

                            <span>
                                ${photoCount}
                                ${
                                    photoCount > 1
                                        ? getTranslation(
                                            "photos"
                                        )
                                        : getTranslation(
                                            "photo"
                                        )
                                }
                                ${escapeHTML(
                                    getTranslation(
                                        "attached"
                                    )
                                )}
                            </span>

                        </div>
                    `
                    : ""
            }


            <div class="complaint-status-timeline">
                ${createStatusTimeline(status)}
            </div>


            ${
                status === "Resolved"
                    ? `
                        <div class="resolved-mini-message">

                            <span>✅</span>

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        getTranslation(
                                            "complaintResolved"
                                        )
                                    )}
                                </strong>

                                <p>
                                    ${escapeHTML(
                                        getTranslation(
                                            "resolvedMessage"
                                        )
                                    )}
                                </p>

                            </div>

                        </div>
                    `
                    : ""
            }

        </div>
    `;
}


/* =========================================================
   PRIORITY TRANSLATION
========================================================= */

function translatePriority(priority) {

    const language =
        getCurrentLanguage();

    const translations = {

        en: {
            Low: "Low",
            Medium: "Medium",
            High: "High",
            Critical: "Critical"
        },

        hi: {
            Low: "कम",
            Medium: "मध्यम",
            High: "उच्च",
            Critical: "अत्यावश्यक"
        },

        or: {
            Low: "କମ",
            Medium: "ମଧ୍ୟମ",
            High: "ଉଚ୍ଚ",
            Critical: "ଗୁରୁତର"
        }

    };

    return (
        translations[language]?.[priority] ||
        priority
    );
}


/* =========================================================
   STATUS TIMELINE
========================================================= */

function createStatusTimeline(status) {

    const statuses = [
        "Pending",
        "Assigned",
        "In Progress",
        "Resolved"
    ];

    const currentIndex =
        statuses.indexOf(status);

    return `
        <div class="status-timeline">

            ${statuses.map(
                function (item, index) {

                    let state = "";

                    if (
                        currentIndex >= 0 &&
                        index < currentIndex
                    ) {
                        state = "completed";
                    } else if (
                        index === currentIndex
                    ) {
                        state = "active";
                    }

                    return `
                        <div
                            class="status-step ${state}"
                        >

                            <div
                                class="status-step-dot"
                            ></div>

                            <span>
                                ${escapeHTML(
                                    translateStatus(
                                        item
                                    )
                                )}
                            </span>

                        </div>
                    `;

                }
            ).join("")}

        </div>
    `;
}


/* =========================================================
   DEMO STORAGE
========================================================= */

function getDemoComplaints() {

    try {

        const saved =
            localStorage.getItem(
                "smartcleanComplaints"
            );

        if (!saved) return [];

        const complaints =
            JSON.parse(saved);

        return Array.isArray(
            complaints
        )
            ? complaints
            : [];

    } catch (error) {

        console.error(
            "Error loading complaints:",
            error
        );

        return [];
    }
}


/* =========================================================
   STATUS BADGE
========================================================= */

function getStatusBadge(status) {

    switch (status) {

        case "Pending":
            return "text-bg-warning";

        case "Assigned":
            return "text-bg-info";

        case "In Progress":
            return "text-bg-primary";

        case "Resolved":
            return "text-bg-success";

        default:
            return "text-bg-secondary";
    }
}


/* =========================================================
   PRIORITY BADGE
========================================================= */

function getPriorityBadge(priority) {

    switch (priority) {

        case "Critical":
            return "text-bg-danger";

        case "High":
            return "text-bg-danger";

        case "Medium":
            return "text-bg-warning";

        case "Low":
            return "text-bg-success";

        default:
            return "text-bg-secondary";
    }
}


/* =========================================================
   SUMMARY CARDS
========================================================= */

function updateComplaintSummary(
    complaints
) {

    const totalElement =
        document.getElementById(
            "totalComplaintsCount"
        );

    const pendingElement =
        document.getElementById(
            "pendingComplaintsCount"
        );

    const progressElement =
        document.getElementById(
            "progressComplaintsCount"
        );

    const resolvedElement =
        document.getElementById(
            "resolvedComplaintsCount"
        );

    const total =
        complaints.length;

    const pending =
        complaints.filter(
            function (c) {
                return (
                    c.status ||
                    "Pending"
                ) === "Pending";
            }
        ).length;

    const progress =
        complaints.filter(
            function (c) {
                return (
                    c.status === "Assigned" ||
                    c.status === "In Progress"
                );
            }
        ).length;

    const resolved =
        complaints.filter(
            function (c) {
                return c.status === "Resolved";
            }
        ).length;

    if (totalElement) {
        totalElement.textContent =
            total;
    }

    if (pendingElement) {
        pendingElement.textContent =
            pending;
    }

    if (progressElement) {
        progressElement.textContent =
            progress;
    }

    if (resolvedElement) {
        resolvedElement.textContent =
            resolved;
    }
}


/* =========================================================
   RESOLVED NOTIFICATION
========================================================= */

function showResolvedNotification(
    complaints
) {

    const notification =
        document.getElementById(
            "resolvedNotification"
        );

    if (!notification) return;

    const resolvedComplaints =
        complaints.filter(
            function (c) {
                return c.status === "Resolved";
            }
        );

    if (!resolvedComplaints.length) {

        notification.style.display =
            "none";

        return;
    }

    const latestResolved =
        resolvedComplaints[
            resolvedComplaints.length - 1
        ];

    notification.style.display =
        "flex";

    notification.innerHTML = `
        <div class="notification-icon">
            ✅
        </div>

        <div class="notification-content">

            <strong>
                ${escapeHTML(
                    getTranslation(
                        "resolvedTitle"
                    )
                )}
            </strong>

            <p>
                ${escapeHTML(
                    getTranslation(
                        "resolvedText"
                    )
                )}

                <strong>
                    ${escapeHTML(
                        latestResolved.id || ""
                    )}
                </strong>
            </p>

        </div>

        <button
            type="button"
            class="notification-close"
            onclick="closeResolvedNotification()"
            aria-label="Close"
        >
            ×
        </button>
    `;
}


/* =========================================================
   CLOSE NOTIFICATION
========================================================= */

function closeResolvedNotification() {

    const notification =
        document.getElementById(
            "resolvedNotification"
        );

    if (notification) {
        notification.style.display =
            "none";
    }
}


/* =========================================================
   REFRESH
========================================================= */

function refreshComplaintsPage() {

    const button =
        document.getElementById(
            "refreshComplaints"
        );

    if (!button) {
        loadComplaints();
        return;
    }

    const originalHTML =
        button.innerHTML;

    button.disabled = true;

    button.innerHTML = `
        <span>⟳</span>
        ${escapeHTML(
            getTranslation(
                "refreshing"
            )
        )}
    `;

    setTimeout(function () {

        loadComplaints();

        button.disabled = false;
        button.innerHTML =
            originalHTML;

    }, 400);
}


/* =========================================================
   SEARCH
========================================================= */

function searchComplaints(
    searchText
) {

    currentSearch =
        String(searchText || "")
            .trim()
            .toLowerCase();

    renderComplaints();
}


/* =========================================================
   FILTER
========================================================= */

function filterComplaints(
    status
) {

    currentStatusFilter =
        status || "All";

    renderComplaints();
}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearComplaintFilters() {

    currentSearch = "";

    currentStatusFilter = "All";

    const searchInput =
        document.getElementById(
            "complaintSearch"
        );

    const statusFilter =
        document.getElementById(
            "complaintStatusFilter"
        );

    if (searchInput) {
        searchInput.value = "";
    }

    if (statusFilter) {
        statusFilter.value = "All";
    }

    renderComplaints();
}


/* =========================================================
   MULTILINGUAL SUPPORT
========================================================= */

function setupComplaintsLanguage() {

    const selector =
        document.getElementById(
            "complaintsLanguage"
        );

    if (!selector) return;

    const savedLanguage =
        localStorage.getItem(
            "smartcleanLanguage"
        ) || "en";

    selector.value =
        complaintsTranslations[
            savedLanguage
        ]
            ? savedLanguage
            : "en";

    changeComplaintsLanguage(
        selector.value
    );

    selector.addEventListener(
        "change",
        function () {

            changeComplaintsLanguage(
                this.value
            );

        }
    );
}


/* =========================================================
   APPLY LANGUAGE
========================================================= */

function changeComplaintsLanguage(
    language
) {

    if (
        !complaintsTranslations[
            language
        ]
    ) {
        language = "en";
    }

    const t =
        complaintsTranslations[
            language
        ];

    localStorage.setItem(
        "smartcleanLanguage",
        language
    );

    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach(
            function (element) {

                const key =
                    element.getAttribute(
                        "data-i18n"
                    );

                if (
                    t[key] !== undefined
                ) {

                    element.textContent =
                        t[key];
                }

            }
        );

    const searchInput =
        document.getElementById(
            "complaintSearch"
        );

    if (searchInput) {

        searchInput.placeholder =
            t.searchPlaceholder;
    }

    renderComplaints();
}


/* =========================================================
   SAFE HTML
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}