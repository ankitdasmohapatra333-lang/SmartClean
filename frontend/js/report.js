document.addEventListener("DOMContentLoaded", function () {

    /* =========================
       LOCATION
    ========================= */

    const locationButton = document.getElementById("getLocation");

    if (locationButton) {
        locationButton.addEventListener("click", getCurrentLocation);
    }


    /* =========================
       PHOTO UPLOAD
    ========================= */

    const photoInput = document.getElementById("photo");

    if (photoInput) {
        photoInput.setAttribute("multiple", "multiple");
        photoInput.addEventListener("change", previewImages);
    }


    /* =========================
       FORM SUBMISSION
    ========================= */

    const form = document.getElementById("reportForm");

    if (form) {
        form.addEventListener("submit", submitComplaint);
    }


    /* =========================
       LANGUAGE
    ========================= */

    setupLanguageSelector();


    /* =========================
       ASSISTANT
    ========================= */

    setupSmartAssistant();

});


/* =========================================================
   LOCATION
========================================================= */

function getCurrentLocation() {

    const status = document.getElementById("locationStatus");

    if (!status) {
        return;
    }


    if (!navigator.geolocation) {

        status.textContent =
            "Geolocation is not supported by this browser.";

        status.style.color = "#dc2626";

        return;
    }


    status.textContent = "Getting your location...";

    status.style.color = "#2563eb";


    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            const latitudeInput =
                document.getElementById("latitude");

            const longitudeInput =
                document.getElementById("longitude");


            if (latitudeInput) {
                latitudeInput.value = latitude;
            }


            if (longitudeInput) {
                longitudeInput.value = longitude;
            }


            status.textContent =
                `Location captured: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

            status.style.color = "#15803d";


            /*
                Save readable location information
                if a manual location field exists.
            */

            const manualLocation =
                document.getElementById("location");

            if (manualLocation && !manualLocation.value) {

                manualLocation.value =
                    `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

            }


            /*
                Optional map marker support.
            */

            if (typeof updateMapLocation === "function") {

                updateMapLocation(
                    latitude,
                    longitude
                );

            }

        },


        function (error) {

            console.error(
                "Geolocation error:",
                error
            );


            let message =
                "Unable to capture location.";

            if (error.code === 1) {

                message =
                    "Location permission was denied. Please allow location access.";

            }

            if (error.code === 2) {

                message =
                    "Your location could not be determined.";

            }

            if (error.code === 3) {

                message =
                    "Location request timed out. Please try again.";

            }


            status.textContent = message;

            status.style.color = "#dc2626";

        },


        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }

    );

}


/* =========================================================
   MANUAL LOCATION
========================================================= */

function setManualLocation(address, latitude, longitude) {

    const locationStatus =
        document.getElementById("locationStatus");

    const latitudeInput =
        document.getElementById("latitude");

    const longitudeInput =
        document.getElementById("longitude");


    if (latitudeInput && latitude !== undefined) {

        latitudeInput.value =
            latitude;

    }


    if (longitudeInput && longitude !== undefined) {

        longitudeInput.value =
            longitude;

    }


    if (locationStatus) {

        if (address) {

            locationStatus.textContent =
                address;

        } else if (
            latitude !== undefined &&
            longitude !== undefined
        ) {

            locationStatus.textContent =
                `Selected: ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;

        }

        locationStatus.style.color =
            "#15803d";

    }

}


/* =========================================================
   PHOTO PREVIEW
========================================================= */

let selectedPhotos = [];


function previewImages(event) {

    const files =
        Array.from(event.target.files || []);

    const preview =
        document.getElementById("imagePreview");


    if (!preview) {
        return;
    }


    if (!files.length) {

        selectedPhotos = [];

        preview.innerHTML = "";

        return;

    }


    /*
        Maximum 5 photos
    */

    if (files.length > 5) {

        alert(
            "You can select a maximum of 5 photos."
        );

        event.target.value = "";

        selectedPhotos = [];

        preview.innerHTML = "";

        return;

    }


    /*
        Validate image files
    */

    const invalidFile =
        files.find(
            file => !file.type.startsWith("image/")
        );


    if (invalidFile) {

        alert(
            "Please select only valid image files."
        );

        event.target.value = "";

        selectedPhotos = [];

        preview.innerHTML = "";

        return;

    }


    selectedPhotos = files;


    renderPhotoPreview();

}


/* =========================================================
   RENDER PHOTO PREVIEW
========================================================= */

function renderPhotoPreview() {

    const preview =
        document.getElementById("imagePreview");


    if (!preview) {
        return;
    }


    preview.innerHTML = "";


    if (!selectedPhotos.length) {
        return;
    }


    const wrapper =
        document.createElement("div");

    wrapper.style.cssText =
        `
        display:grid;
        grid-template-columns:
        repeat(auto-fill,minmax(140px,1fr));
        gap:12px;
        margin-top:15px;
        `;


    selectedPhotos.forEach(
        (file, index) => {

            const card =
                document.createElement("div");

            card.style.cssText =
                `
                position:relative;
                background:#f8fafc;
                border:1px solid #e2e8f0;
                border-radius:14px;
                padding:8px;
                overflow:hidden;
                `;


            const image =
                document.createElement("img");


            image.alt =
                "Complaint evidence preview";


            image.style.cssText =
                `
                width:100%;
                height:120px;
                object-fit:cover;
                border-radius:10px;
                display:block;
                `;


            const removeButton =
                document.createElement("button");


            removeButton.type =
                "button";


            removeButton.innerHTML =
                "×";


            removeButton.setAttribute(
                "aria-label",
                "Remove photo"
            );


            removeButton.style.cssText =
                `
                position:absolute;
                top:12px;
                right:12px;
                width:28px;
                height:28px;
                border:none;
                border-radius:50%;
                background:#dc2626;
                color:white;
                font-size:18px;
                font-weight:800;
                cursor:pointer;
                line-height:1;
                `;


            removeButton.onclick =
                function () {

                    removePhoto(index);

                };


            const fileName =
                document.createElement("div");


            fileName.textContent =
                file.name;


            fileName.style.cssText =
                `
                margin-top:7px;
                font-size:11px;
                color:#64748b;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
                `;


            card.appendChild(image);

            card.appendChild(removeButton);

            card.appendChild(fileName);

            wrapper.appendChild(card);


            const reader =
                new FileReader();


            reader.onload =
                function (e) {

                    image.src =
                        e.target.result;

                };


            reader.readAsDataURL(file);

        }
    );


    preview.appendChild(wrapper);


    const count =
        document.createElement("div");


    count.textContent =
        `${selectedPhotos.length} photo${selectedPhotos.length > 1 ? "s" : ""} selected`;


    count.style.cssText =
        `
        margin-top:8px;
        font-size:12px;
        color:#475569;
        font-weight:600;
        `;


    preview.appendChild(count);

}


/* =========================================================
   REMOVE PHOTO
========================================================= */

function removePhoto(index) {

    if (
        index < 0 ||
        index >= selectedPhotos.length
    ) {
        return;
    }


    selectedPhotos.splice(
        index,
        1
    );


    const photoInput =
        document.getElementById("photo");


    /*
        Rebuild the FileList using DataTransfer
        so the actual input also stays updated.
    */

    if (photoInput) {

        const dataTransfer =
            new DataTransfer();


        selectedPhotos.forEach(
            file => {

                dataTransfer.items.add(file);

            }
        );


        photoInput.files =
            dataTransfer.files;

    }


    renderPhotoPreview();

}


/* =========================================================
   SUBMIT COMPLAINT
========================================================= */

async function submitComplaint(event) {

    event.preventDefault();


    const categoryElement =
        document.getElementById("category");

    const descriptionElement =
        document.getElementById("description");

    const latitudeElement =
        document.getElementById("latitude");

    const longitudeElement =
        document.getElementById("longitude");

    const photoElement =
        document.getElementById("photo");

    const locationElement =
        document.getElementById("location");


    if (
        !categoryElement ||
        !descriptionElement
    ) {

        alert(
            "Complaint form is not available."
        );

        return;

    }


    const category =
        categoryElement.value.trim();


    const description =
        descriptionElement.value.trim();


    const latitude =
        latitudeElement
            ? latitudeElement.value
            : "";


    const longitude =
        longitudeElement
            ? longitudeElement.value
            : "";


    const location =
        locationElement
            ? locationElement.value.trim()
            : "";


    const photos =
        photoElement && photoElement.files
            ? Array.from(photoElement.files)
            : selectedPhotos;


    /* =========================
       VALIDATION
    ========================= */

    if (!category) {

        alert(
            "Please select a complaint category."
        );

        categoryElement.focus();

        return;

    }


    if (!description) {

        alert(
            "Please describe the issue."
        );

        descriptionElement.focus();

        return;

    }


    /*
        Location can be either:
        1. GPS coordinates
        2. Manual address
    */

    if (
        (!latitude || !longitude) &&
        !location
    ) {

        alert(
            "Please use your current location or enter/select the issue location."
        );

        return;

    }


    if (photos.length > 5) {

        alert(
            "You can submit a maximum of 5 photos."
        );

        return;

    }


    const submitButton =
        document.querySelector(
            ".submit-report-btn"
        );


    if (submitButton) {

        submitButton.disabled =
            true;


        submitButton.innerHTML =
            `
            <span>Submitting...</span>
            <span>⏳</span>
            `;

    }


 /* =========================
   DEMO MODE
========================= */

if (
    typeof DEMO_MODE !== "undefined" &&
    DEMO_MODE
) {

    const complaints =
        getDemoComplaints();


    /*
        Convert selected image files
        into Data URLs so that the
        actual image is stored in
        localStorage.

        This is required for DEMO_MODE
        because localStorage cannot
        directly store File objects.
    */

    const photoDataUrls =
        await Promise.all(
            photos.map(function (file) {

                return new Promise(
                    function (resolve) {

                        const reader =
                            new FileReader();


                        reader.onload =
                            function (e) {

                                resolve(
                                    e.target.result
                                );

                            };


                        reader.onerror =
                            function () {

                                resolve(null);

                            };


                        reader.readAsDataURL(
                            file
                        );

                    }
                );

            })
        );


    const validPhotoDataUrls =
        photoDataUrls.filter(
            function (photo) {

                return (
                    typeof photo ===
                        "string" &&
                    photo.startsWith(
                        "data:image/"
                    )
                );

            }
        );


    const complaint = {

        id:
            "SC-" +
            Date.now()
                .toString()
                .slice(-6),


        category:
            category,


        description:
            description,


        location:
            location ||
            (
                latitude &&
                longitude
                    ? `${latitude}, ${longitude}`
                    : "Location selected"
            ),


        latitude:
            latitude,


        longitude:
            longitude,


        /*
            IMPORTANT:
            Store actual image data,
            NOT only file names.
        */

        photo:
            validPhotoDataUrls,


        photos:
            validPhotoDataUrls,


        photoCount:
            validPhotoDataUrls.length,


        /*
            Keep original file names
            separately for reference.
        */

        photoNames:
            photos.map(
                function (file) {
                    return file.name;
                }
            ),


        priority:
            calculateDemoPriority(
                category
            ),


        status:
            "Pending",


        createdAt:
            new Date().toLocaleString()

    };


    complaints.push(
        complaint
    );


    saveDemoComplaints(
        complaints
    );


    alert(
        `Complaint submitted successfully!\n\nComplaint ID: ${complaint.id}`
    );


    window.location.href =
        "complaints.html";


    return;
}

    /* =========================
       REAL BACKEND MODE
    ========================= */

    try {

        const formData =
            new FormData();


        formData.append(
            "category",
            category
        );


        formData.append(
            "description",
            description
        );


        formData.append(
            "location",
            location
        );


        formData.append(
            "latitude",
            latitude
        );


        formData.append(
            "longitude",
            longitude
        );


        formData.append(
            "priority",
            calculateDemoPriority(category)
        );


        /*
            Current backend documentation
            supports the "photo" field.

            We append the first photo here
            to preserve backend compatibility.
        */

        if (photos.length > 0) {
            photos.forEach(function (file) {
                formData.append("photos", file);
            });
            formData.append(
                "photo",
                photos[0]
            );
        }


        await apiRequest(
            "/complaints",
            {
                method: "POST",
                body: formData
            }
        );


        alert(
            "Complaint submitted successfully."
        );


        window.location.href =
            "complaints.html";


    } catch (error) {

        console.error(
            "Complaint submission error:",
            error
        );


        alert(
            error && error.message
                ? error.message
                : "Unable to submit complaint. Please try again."
        );


        if (submitButton) {

            submitButton.disabled =
                false;


            submitButton.innerHTML =
                `
                <span>Submit Complaint</span>
                <span>→</span>
                `;

        }

    }

}
/* =========================================================
   DEMO PRIORITY
========================================================= */

function calculateDemoPriority(category) {

    if (
        category === "Drainage" ||
        category === "Garbage Dump" ||
        category === "Public Toilet"
    ) {

        return "High";

    }


    if (
        category === "Overflowing Bin" ||
        category === "Uncollected Waste"
    ) {

        return "Medium";

    }


    return "Low";

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
            "Unable to save demo complaints:",
            error
        );

    }

}


/* =========================================================
   MULTILINGUAL SUPPORT
========================================================= */

function setupLanguageSelector() {

    const selector =
        document.getElementById(
            "reportLanguage"
        );


    if (!selector) {
        return;
    }


    const savedLanguage =
        localStorage.getItem(
            "smartcleanLanguage"
        ) || "en";


    selector.value =
        savedLanguage;


    /*
        The HTML already contains
        the complete reportTranslations
        dictionary.
    */

    if (
        typeof changeReportLanguage ===
        "function"
    ) {

        changeReportLanguage(
            savedLanguage
        );

    }


    selector.addEventListener(
        "change",
        function () {

            if (
                typeof changeReportLanguage ===
                "function"
            ) {

                changeReportLanguage(
                    this.value
                );

            }

        }
    );

}


/* =========================================================
   SMART ASSISTANT
========================================================= */

function setupSmartAssistant() {

    const assistant =
        document.getElementById(
            "smartAssistant"
        );


    if (!assistant) {
        return;
    }


    const input =
        document.getElementById(
            "assistantInput"
        );


    const sendButton =
        document.getElementById(
            "assistantSend"
        );


    if (input) {

        input.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    generateComplaint();

                }

            }
        );

    }


    if (sendButton) {

        sendButton.addEventListener(
            "click",
            generateComplaint
        );

    }

}


/* =========================================================
   ASSISTANT TEXT ANALYSIS
========================================================= */

function generateComplaint() {

    const input =
        document.getElementById(
            "assistantInput"
        );


    const category =
        document.getElementById(
            "category"
        );


    const description =
        document.getElementById(
            "description"
        );


    if (!input || !description) {

        return;

    }


    const text =
        input.value.trim();


    if (!text) {

        alert(
            "Please tell the assistant what problem you observed."
        );


        input.focus();

        return;

    }


    const lowerText =
        text.toLowerCase();


    let selectedCategory =
        "Other";


    /* =========================
       GARBAGE
    ========================= */

    if (
        lowerText.includes("garbage") ||
        lowerText.includes("waste") ||
        lowerText.includes("trash") ||
        lowerText.includes("कचरा") ||
        lowerText.includes("आवर्जना") ||
        lowerText.includes("ଆବର୍ଜନା")
    ) {

        selectedCategory =
            "Garbage Dump";

    }


    /* =========================
       BIN
    ========================= */

    if (
        lowerText.includes("bin") ||
        lowerText.includes("dustbin") ||
        lowerText.includes("overflow") ||
        lowerText.includes("डस्टबिन") ||
        lowerText.includes("ବିନ୍")
    ) {

        selectedCategory =
            "Overflowing Bin";

    }


    /* =========================
       DRAINAGE
    ========================= */

    if (
        lowerText.includes("drain") ||
        lowerText.includes("drainage") ||
        lowerText.includes("sewage") ||
        lowerText.includes("नाली") ||
        lowerText.includes("सीवेज") ||
        lowerText.includes("ଡ୍ରେନ୍") ||
        lowerText.includes("ସିୱେଜ୍")
    ) {

        selectedCategory =
            "Drainage";

    }


    /* =========================
       TOILET
    ========================= */

    if (
        lowerText.includes("toilet") ||
        lowerText.includes("शौचालय") ||
        lowerText.includes("ଶୌଚାଳୟ")
    ) {

        selectedCategory =
            "Public Toilet";

    }


    /* =========================
       STREET CLEANING
    ========================= */

    if (
        lowerText.includes("street") ||
        lowerText.includes("road") ||
        lowerText.includes("cleaning") ||
        lowerText.includes("सड़क") ||
        lowerText.includes("सफाई") ||
        lowerText.includes("ରାସ୍ତା") ||
        lowerText.includes("ସଫେଇ")
    ) {

        selectedCategory =
            "Street Cleaning";

    }


    if (category) {

        category.value =
            selectedCategory;

        category.dispatchEvent(
            new Event("change")
        );

    }


    /*
        Generate a professional
        complaint description.
    */

    const generatedText =
        createAssistantDescription(
            text,
            selectedCategory
        );


    description.value =
        generatedText;


    const result =
        document.getElementById(
            "assistantResult"
        );


    if (result) {

        result.textContent =
            "Complaint details prepared. You can edit the description before submitting.";

        result.style.display =
            "block";

    }


    description.focus();


    description.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* =========================================================
   CREATE ASSISTANT DESCRIPTION
========================================================= */

function createAssistantDescription(
    text,
    category
) {

    const language =
        localStorage.getItem(
            "smartcleanLanguage"
        ) || "en";


    if (language === "hi") {

        return (
            "रिपोर्ट की गई समस्या: " +
            text +
            "। यह समस्या " +
            category +
            " श्रेणी से संबंधित है। कृपया रिपोर्ट किए गए स्थान का निरीक्षण करें और आवश्यक स्वच्छता कार्रवाई करें।"
        );

    }


    if (language === "or") {

        return (
            "ରିପୋର୍ଟ କରାଯାଇଥିବା ସମସ୍ୟା: " +
            text +
            "। ଏହି ସମସ୍ୟା " +
            category +
            " ବର୍ଗ ସହିତ ସମ୍ବନ୍ଧିତ। ଦୟାକରି ରିପୋର୍ଟ କରାଯାଇଥିବା ସ୍ଥାନଟି ଯାଞ୍ଚ କରି ଆବଶ୍ୟକ ପରିମଳ ପଦକ୍ଷେପ ନିଅନ୍ତୁ।"
        );

    }


    return (
        "Reported issue: " +
        text +
        ". This issue has been categorised as " +
        category +
        ". Please inspect the reported location and take appropriate sanitation action."
    );

}


/* =========================================================
   USE GENERATED DESCRIPTION
========================================================= */

function useGeneratedDescription() {

    const description =
        document.getElementById(
            "description"
        );


    if (!description) {
        return;
    }


    description.focus();


    description.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* =========================================================
   OPTIONAL MAP SUPPORT
========================================================= */

/*
    This function is intentionally available
    for a future Leaflet / Google Maps integration.

    When a map is added, clicking a location
    can call:

    setManualLocation(
        "Selected Address",
        latitude,
        longitude
    );
*/

function selectMapLocation(
    address,
    latitude,
    longitude
) {

    setManualLocation(
        address,
        latitude,
        longitude
    );

}


/* =========================================================
   MAP UPDATE HOOK
========================================================= */

function updateMapLocation(
    latitude,
    longitude
) {

    /*
        This function does not require
        a map library.

        If Leaflet/Google Maps is added later,
        this function can update the marker.
    */

    console.log(
        "Map location:",
        latitude,
        longitude
    );

}