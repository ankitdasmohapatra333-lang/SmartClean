document.addEventListener("DOMContentLoaded", function () {
    loadAdminDashboard();
});


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentAdminComplaints = [];


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

async function loadAdminDashboard() {

    if (
        typeof DEMO_MODE !== "undefined" &&
        DEMO_MODE
    ) {
        loadDemoAdminDashboard();
        return;
    }

    try {

        const data = await apiRequest(
            "/admin/dashboard",
            {
                method: "GET"
            }
        );

        updateAdminStats(data);

        await loadAdminComplaints();

    } catch (error) {

        console.error(
            "Admin dashboard error:",
            error
        );

        showAdminError(
            "Unable to load admin dashboard. Please check the backend connection."
        );
    }
}


/* =========================================================
   DEMO ADMIN DASHBOARD
========================================================= */

function loadDemoAdminDashboard() {

    const complaints =
        getDemoComplaints();

    currentAdminComplaints =
        complaints;

    const total =
        complaints.length;

    const pending =
        complaints.filter(function (c) {
            return (
                c.status ||
                "Pending"
            ) === "Pending";
        }).length;

    const progress =
        complaints.filter(function (c) {
            return (
                c.status === "Assigned" ||
                c.status === "In Progress"
            );
        }).length;

    const resolved =
        complaints.filter(function (c) {
            return (
                c.status === "Resolved"
            );
        }).length;


    updateAdminStats({
        total: total,
        pending: pending,
        progress: progress,
        resolved: resolved
    });

    loadAdminComplaints();
}


/* =========================================================
   ADMIN STATISTICS
========================================================= */

function updateAdminStats(data) {

    const totalElement =
        document.getElementById(
            "adminTotal"
        );

    const pendingElement =
        document.getElementById(
            "adminPending"
        );

    const progressElement =
        document.getElementById(
            "adminProgress"
        );

    const resolvedElement =
        document.getElementById(
            "adminResolved"
        );


    const total =
        data.total ??
        data.totalComplaints ??
        data.count ??
        0;

    const pending =
        data.pending ??
        data.pendingComplaints ??
        0;

    const progress =
        data.progress ??
        data.inProgress ??
        data.inProgressComplaints ??
        0;

    const resolved =
        data.resolved ??
        data.resolvedComplaints ??
        0;


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
   LOAD ADMIN COMPLAINTS
========================================================= */

async function loadAdminComplaints() {

    const table =
        document.getElementById(
            "adminComplaintsTable"
        );

    if (!table) return;


    /* =====================================================
       DEMO MODE
    ===================================================== */

    if (
        typeof DEMO_MODE !== "undefined" &&
        DEMO_MODE
    ) {

        const complaints =
            getDemoComplaints();

        currentAdminComplaints =
            complaints;

        renderAdminComplaints(
            complaints
        );

        return;
    }


    /* =====================================================
       BACKEND MODE
    ===================================================== */

    try {

        const response =
            await apiRequest(
                "/admin/complaints",
                {
                    method: "GET"
                }
            );


        const complaints =
            Array.isArray(response)
                ? response
                : response.complaints || [];


        currentAdminComplaints =
            complaints;

        renderAdminComplaints(
            complaints
        );

    } catch (error) {

        console.error(
            "Admin complaints error:",
            error
        );

        table.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="text-center text-danger py-5"
                >
                    ⚠️ Unable to load complaints.
                </td>
            </tr>
        `;
    }
}


/* =========================================================
   RENDER ADMIN COMPLAINTS
========================================================= */

function renderAdminComplaints(
    complaints
) {

    const table =
        document.getElementById(
            "adminComplaintsTable"
        );

    if (!table) return;


    if (!complaints.length) {

        table.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="text-center text-muted py-5"
                >
                    📋 No complaints available.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML =
        complaints
            .slice()
            .reverse()
            .map(function (c) {

                const id =
                    c.complaintId ||
                    c.id ||
                    c._id ||
                    "N/A";

                const category =
                    c.category ||
                    "Other";

                const description =
                    c.description ||
                    "No description provided.";

                const createdAt =
                    c.createdAt ||
                    "Date unavailable";

                const status =
                    c.status ||
                    "Pending";

                const priority =
                    c.priority ||
                    "Medium";

                const location =
                    c.location ||
                    "Location unavailable";


                const photoCount =
                    getComplaintPhotos(c).length;


                return `
                    <tr>

                        <!-- COMPLAINT ID -->
                        <td>
                            <strong>
                                ${escapeHTML(id)}
                            </strong>
                        </td>


                        <!-- CATEGORY -->
                        <td>
                            ${escapeHTML(
                                category
                            )}
                        </td>


                        <!-- LOCATION -->
                        <td>
                            <div>
                                📍
                                ${escapeHTML(
                                    String(
                                        location
                                    )
                                )}
                            </div>

                            ${
                                hasCoordinates(c)
                                    ? `
                                        <small
                                            class="text-muted"
                                        >
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
                                    : ""
                            }
                        </td>


                        <!-- DATE -->
                        <td>
                            ${escapeHTML(
                                String(
                                    createdAt
                                )
                            )}
                        </td>


                        <!-- STATUS -->
                        <td>

                            <span
                                class="badge ${getStatusBadge(
                                    status
                                )}"
                            >
                                ${escapeHTML(
                                    status
                                )}
                            </span>

                        </td>


                        <!-- PHOTO -->
                        <td>

                            ${
                                photoCount > 0
                                    ? `
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-success"
                                            onclick="viewComplaintPhoto('${escapeAttribute(
                                                id
                                            )}')"
                                        >
                                            📷 View Photo
                                            ${
                                                photoCount > 1
                                                    ? `(${photoCount})`
                                                    : ""
                                            }
                                        </button>
                                    `
                                    : `
                                        <span
                                            class="text-muted small"
                                        >
                                            📷 No Photo
                                        </span>
                                    `
                            }

                        </td>


                        <!-- ACTION -->
                        <td>

                            <select
                                class="form-select form-select-sm"
                                onchange="updateStatus(
                                    '${escapeAttribute(id)}',
                                    this.value
                                )"
                            >

                                <option
                                    value="Pending"
                                    ${
                                        status ===
                                        "Pending"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Pending
                                </option>

                                <option
                                    value="Assigned"
                                    ${
                                        status ===
                                        "Assigned"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Assigned
                                </option>

                                <option
                                    value="In Progress"
                                    ${
                                        status ===
                                        "In Progress"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    In Progress
                                </option>

                                <option
                                    value="Resolved"
                                    ${
                                        status ===
                                        "Resolved"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Resolved
                                </option>

                            </select>

                        </td>

                    </tr>
                `;

            })
            .join("");
}


/* =========================================================
   VIEW COMPLAINT PHOTO
========================================================= */

function viewComplaintPhoto(
    complaintId
) {

    const complaint =
        currentAdminComplaints.find(
            function (c) {

                const id =
                    c.id ||
                    c._id;

                return (
                    String(id) ===
                    String(complaintId)
                );
            }
        );


    if (!complaint) {

        alert(
            "Complaint not found."
        );

        return;
    }


    const photos =
        getComplaintPhotos(
            complaint
        );


    if (!photos.length) {

        alert(
            "No photo is attached to this complaint."
        );

        return;
    }


    createPhotoModal(
        complaint,
        photos
    );
}


/* =========================================================
   GET COMPLAINT PHOTOS
========================================================= */

function getComplaintPhotos(
    complaint
) {

    if (!complaint) {
        return [];
    }


    let photos = [];


    /* =====================================================
       PHOTOS ARRAY
    ===================================================== */

    if (
        Array.isArray(
            complaint.photos
        )
    ) {

        photos =
            complaint.photos.filter(
                function (photo) {

                    return (
                        typeof photo ===
                        "string" &&
                        photo.trim() !== ""
                    );
                }
            );
    }


    /* =====================================================
       SINGLE PHOTO
    ===================================================== */

    if (
        !photos.length &&
        complaint.photo
    ) {

        if (
            typeof complaint.photo ===
            "string"
        ) {

            photos = [
                complaint.photo
            ];
        }
    }


    /* =====================================================
       PHOTO URL
    ===================================================== */

    if (
        !photos.length &&
        complaint.photoUrl
    ) {

        if (
            typeof complaint.photoUrl ===
            "string"
        ) {

            photos = [
                complaint.photoUrl
            ];
        }
    }


    /* =====================================================
       IMAGE URL
    ===================================================== */

    if (
        !photos.length &&
        complaint.image
    ) {

        if (
            typeof complaint.image ===
            "string"
        ) {

            photos = [
                complaint.image
            ];
        }
    }


    return photos;
}


/* =========================================================
   CREATE PHOTO MODAL
========================================================= */

function createPhotoModal(
    complaint,
    photos
) {

    removePhotoModal();


    const complaintId =
        complaint.id ||
        complaint._id ||
        "N/A";

    const category =
        complaint.category ||
        "Other";

    const description =
        complaint.description ||
        "No description provided.";

    const location =
        complaint.location ||
        "Location unavailable";


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "adminPhotoModal";


    modal.innerHTML = `
        <div
            class="admin-photo-modal-overlay"
            onclick="closePhotoModal(event)"
        >

            <div
                class="admin-photo-modal"
                onclick="event.stopPropagation()"
            >

                <!-- HEADER -->
                <div
                    class="admin-photo-modal-header"
                >

                    <div>

                        <h4>
                            📷 Complaint Photo
                        </h4>

                        <small>
                            Complaint ID:
                            <strong>
                                ${escapeHTML(
                                    complaintId
                                )}
                            </strong>
                        </small>

                    </div>

                    <button
                        type="button"
                        class="admin-photo-close"
                        onclick="closePhotoModal()"
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>


                <!-- PHOTO AREA -->
                <div
                    class="admin-photo-viewer"
                >

                    ${
                        photos.length === 1
                            ? `
                                <img
                                    src="${escapeAttribute(
                                        normalizePhotoUrl(
                                            photos[0]
                                        )
                                    )}"
                                    alt="Complaint photo"
                                    class="admin-complaint-image"
                                    onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                                >

                                <div
                                    class="photo-error-message"
                                    style="display:none;"
                                >
                                    ⚠️ Unable to load this photo.
                                </div>
                            `
                            : `
                                <div
                                    class="admin-photo-grid"
                                >

                                    ${photos
                                        .map(
                                            function (
                                                photo,
                                                index
                                            ) {

                                                return `
                                                    <div
                                                        class="admin-photo-item"
                                                    >

                                                        <img
                                                            src="${escapeAttribute(
                                                                normalizePhotoUrl(
                                                                    photo
                                                                )
                                                            )}"
                                                            alt="Complaint photo ${
                                                                index +
                                                                1
                                                            }"
                                                            class="admin-complaint-image"
                                                            onclick="openFullPhoto('${escapeAttribute(
                                                                normalizePhotoUrl(
                                                                    photo
                                                                )
                                                            )}')"
                                                            onerror="this.style.display='none';"
                                                        >

                                                        <span>
                                                            Photo ${
                                                                index +
                                                                1
                                                            }
                                                        </span>

                                                    </div>
                                                `;
                                            }
                                        )
                                        .join("")}

                                </div>
                            `
                    }

                </div>


                <!-- COMPLAINT DETAILS -->
                <div
                    class="admin-photo-details"
                >

                    <div>
                        <strong>
                            Category
                        </strong>

                        <span>
                            ${escapeHTML(
                                category
                            )}
                        </span>
                    </div>


                    <div>
                        <strong>
                            Location
                        </strong>

                        <span>
                            📍
                            ${escapeHTML(
                                location
                            )}
                        </span>
                    </div>


                    <div>
                        <strong>
                            Description
                        </strong>

                        <span>
                            ${escapeHTML(
                                description
                            )}
                        </span>
                    </div>

                </div>


                <!-- FOOTER -->
                <div
                    class="admin-photo-modal-footer"
                >

                    ${
                        photos.length > 1
                            ? `
                                <span>
                                    📷
                                    ${photos.length}
                                    photos attached
                                </span>
                            `
                            : `
                                <span>
                                    📷 Photo attached
                                </span>
                            `
                    }

                    <button
                        type="button"
                        class="btn btn-smart"
                        onclick="closePhotoModal()"
                    >
                        Close
                    </button>

                </div>

            </div>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    addPhotoModalStyles();


    document.body.style.overflow =
        "hidden";
}


/* =========================================================
   NORMALIZE PHOTO URL
========================================================= */

function normalizePhotoUrl(
    photo
) {

    if (
        photo === null ||
        photo === undefined
    ) {
        return "";
    }


    let photoUrl =
        String(photo).trim();


    if (!photoUrl) {
        return "";
    }


    /* Already Data URL */

    if (
        photoUrl.startsWith(
            "data:image/"
        )
    ) {

        return photoUrl;
    }


    /* Already Blob URL */

    if (
        photoUrl.startsWith(
            "blob:"
        )
    ) {

        return photoUrl;
    }


    /* Already HTTP URL */

    if (
        photoUrl.startsWith(
            "http://"
        ) ||
        photoUrl.startsWith(
            "https://"
        )
    ) {

        return photoUrl;
    }


    /* Backend uploaded image */

    if (
        photoUrl.startsWith(
            "/uploads/"
        )
    ) {

        if (
            typeof API_BASE_URL !==
            "undefined"
        ) {

            return (
                API_BASE_URL.replace(
                    /\/api\/?$/,
                    ""
                ) +
                photoUrl
            );
        }

        return photoUrl;
    }


    return photoUrl;
}


/* =========================================================
   OPEN FULL PHOTO
========================================================= */

function openFullPhoto(
    photoUrl
) {

    const viewer =
        document.createElement(
            "div"
        );

    viewer.id =
        "adminFullPhotoViewer";


    viewer.innerHTML = `
        <div
            class="admin-full-photo-overlay"
            onclick="closeFullPhoto(event)"
        >

            <button
                type="button"
                class="admin-full-photo-close"
                onclick="closeFullPhoto()"
            >
                ×
            </button>

            <img
                src="${escapeAttribute(
                    photoUrl
                )}"
                alt="Full complaint photo"
                onclick="event.stopPropagation()"
            >

        </div>
    `;


    document.body.appendChild(
        viewer
    );
}


/* =========================================================
   CLOSE PHOTO MODAL
========================================================= */

function closePhotoModal(
    event
) {

    if (
        event &&
        event.target &&
        !event.target.classList.contains(
            "admin-photo-modal-overlay"
        )
    ) {
        return;
    }


    removePhotoModal();

    document.body.style.overflow =
        "";
}


/* =========================================================
   REMOVE PHOTO MODAL
========================================================= */

function removePhotoModal() {

    const modal =
        document.getElementById(
            "adminPhotoModal"
        );

    if (modal) {
        modal.remove();
    }
}


/* =========================================================
   CLOSE FULL PHOTO
========================================================= */

function closeFullPhoto(
    event
) {

    if (
        event &&
        event.target &&
        !event.target.classList.contains(
            "admin-full-photo-overlay"
        )
    ) {
        return;
    }


    const viewer =
        document.getElementById(
            "adminFullPhotoViewer"
        );

    if (viewer) {
        viewer.remove();
    }
}


/* =========================================================
   ADD PHOTO MODAL STYLES
========================================================= */

function addPhotoModalStyles() {

    if (
        document.getElementById(
            "adminPhotoModalStyles"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "adminPhotoModalStyles";


    style.textContent = `
        .admin-photo-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(0, 0, 0, 0.72);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: adminPhotoFadeIn 0.2s ease;
        }

        .admin-photo-modal {
            width: min(900px, 100%);
            max-height: 92vh;
            overflow-y: auto;
            background: #ffffff;
            border-radius: 22px;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.30);
            overflow-x: hidden;
        }

        .admin-photo-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 20px 24px;
            border-bottom: 1px solid #e9ecef;
        }

        .admin-photo-modal-header h4 {
            margin: 0 0 5px;
            font-weight: 700;
        }

        .admin-photo-modal-header small {
            color: #6c757d;
        }

        .admin-photo-close {
            width: 42px;
            height: 42px;
            border: 0;
            border-radius: 50%;
            background: #f1f3f5;
            color: #333;
            font-size: 28px;
            line-height: 1;
            cursor: pointer;
            transition: 0.2s ease;
        }

        .admin-photo-close:hover {
            background: #dc3545;
            color: #fff;
            transform: rotate(90deg);
        }

        .admin-photo-viewer {
            min-height: 300px;
            padding: 24px;
            background: #f8f9fa;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .admin-complaint-image {
            display: block;
            max-width: 100%;
            max-height: 55vh;
            width: auto;
            height: auto;
            object-fit: contain;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            cursor: zoom-in;
            background: #fff;
        }

        .admin-photo-grid {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(
                auto-fit,
                minmax(220px, 1fr)
            );
            gap: 18px;
        }

        .admin-photo-item {
            background: #fff;
            border-radius: 16px;
            padding: 12px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
        }

        .admin-photo-item img {
            width: 100%;
            height: 220px;
            object-fit: cover;
            cursor: zoom-in;
        }

        .admin-photo-item span {
            display: block;
            margin-top: 8px;
            text-align: center;
            font-size: 13px;
            color: #6c757d;
        }

        .photo-error-message {
            padding: 40px;
            color: #dc3545;
            text-align: center;
        }

        .admin-photo-details {
            padding: 20px 24px;
            display: grid;
            grid-template-columns: repeat(
                3,
                1fr
            );
            gap: 16px;
        }

        .admin-photo-details > div {
            padding: 15px;
            border-radius: 14px;
            background: #f8f9fa;
        }

        .admin-photo-details strong {
            display: block;
            margin-bottom: 5px;
            font-size: 13px;
            color: #6c757d;
        }

        .admin-photo-details span {
            display: block;
            word-break: break-word;
        }

        .admin-photo-modal-footer {
            padding: 16px 24px 22px;
            border-top: 1px solid #e9ecef;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
        }

        .admin-photo-modal-footer span {
            color: #6c757d;
            font-size: 14px;
        }

        .admin-full-photo-overlay {
            position: fixed;
            inset: 0;
            z-index: 100000;
            background: rgba(0, 0, 0, 0.94);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 30px;
        }

        .admin-full-photo-overlay img {
            max-width: 95vw;
            max-height: 92vh;
            object-fit: contain;
            border-radius: 12px;
        }

        .admin-full-photo-close {
            position: fixed;
            top: 20px;
            right: 25px;
            z-index: 100001;
            width: 46px;
            height: 46px;
            border: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
            font-size: 30px;
            cursor: pointer;
        }

        .admin-full-photo-close:hover {
            background: #dc3545;
        }

        @keyframes adminPhotoFadeIn {
            from {
                opacity: 0;
                transform: scale(0.98);
            }

            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        @media (max-width: 768px) {

            .admin-photo-modal-overlay {
                padding: 10px;
            }

            .admin-photo-modal {
                border-radius: 16px;
                max-height: 95vh;
            }

            .admin-photo-details {
                grid-template-columns: 1fr;
            }

            .admin-photo-grid {
                grid-template-columns: 1fr;
            }

            .admin-photo-item img {
                height: 240px;
            }

            .admin-photo-modal-footer {
                flex-direction: column;
                align-items: stretch;
            }

            .admin-photo-modal-footer .btn {
                width: 100%;
            }
        }
    `;


    document.head.appendChild(
        style
    );
}


/* =========================================================
   COORDINATES
========================================================= */

function hasCoordinates(
    complaint
) {

    return (
        complaint.latitude !==
            undefined &&
        complaint.latitude !==
            null &&
        complaint.latitude !==
            "" &&
        complaint.longitude !==
            undefined &&
        complaint.longitude !==
            null &&
        complaint.longitude !==
            ""
    );
}


/* =========================================================
   UPDATE STATUS
========================================================= */

async function updateStatus(
    id,
    status
) {

    if (!id || !status) {
        return;
    }


    const allowedStatuses = [
        "Pending",
        "Assigned",
        "In Progress",
        "Resolved"
    ];


    if (
        !allowedStatuses.includes(
            status
        )
    ) {

        alert(
            "Invalid complaint status."
        );

        return;
    }


    /* =====================================================
       DEMO MODE
    ===================================================== */

    if (
        typeof DEMO_MODE !== "undefined" &&
        DEMO_MODE
    ) {

        const complaints =
            getDemoComplaints();


        const complaint =
            complaints.find(
                function (c) {

                    return (
                        String(
                            c.id
                        ) ===
                        String(id)
                    );
                }
            );


        if (!complaint) {

            alert(
                "Complaint not found."
            );

            return;
        }


        complaint.status =
            status;


        saveDemoComplaints(
            complaints
        );


        currentAdminComplaints =
            complaints;


        loadAdminDashboard();

        return;
    }


    /* =====================================================
       BACKEND MODE
    ===================================================== */

    try {

        await apiRequest(
            `/admin/complaints/${encodeURIComponent(
                id
            )}/status`,
            {
                method: "PUT",
                body: JSON.stringify({
                    status: status
                })
            }
        );


        await loadAdminDashboard();

    } catch (error) {

        console.error(
            "Status update error:",
            error
        );


        alert(
            error && error.message
                ? error.message
                : "Unable to update complaint status."
        );


        await loadAdminDashboard();
    }
}


/* =========================================================
   STATUS BADGE
========================================================= */

function getStatusBadge(
    status
) {

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
   DEMO STORAGE
========================================================= */

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


        return Array.isArray(
            complaints
        )
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


function saveDemoComplaints(
    complaints
) {

    try {

        localStorage.setItem(
            "smartcleanComplaints",
            JSON.stringify(
                complaints
            )
        );

    } catch (error) {

        console.error(
            "Unable to save complaints:",
            error
        );
    }
}


/* =========================================================
   ERROR
========================================================= */

function showAdminError(
    message
) {

    const table =
        document.getElementById(
            "adminComplaintsTable"
        );

    if (!table) return;


    table.innerHTML = `
        <tr>

            <td
                colspan="7"
                class="text-center text-danger py-5"
            >

                ⚠️

                <div class="mt-2">
                    ${escapeHTML(
                        message
                    )}
                </div>

                <button
                    class="btn btn-smart btn-sm mt-3"
                    onclick="loadAdminDashboard()"
                >
                    Try Again
                </button>

            </td>

        </tr>
    `;
}


/* =========================================================
   SAFE HTML
========================================================= */

function escapeHTML(
    value
) {

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


/* =========================================================
   SAFE ATTRIBUTE
========================================================= */

function escapeAttribute(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll(
            "\\",
            "\\\\"
        )
        .replaceAll(
            "'",
            "\\'"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        );
}