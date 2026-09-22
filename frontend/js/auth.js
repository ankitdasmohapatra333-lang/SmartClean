document.addEventListener("DOMContentLoaded", function () {

    /* =========================
       CITIZEN LOGIN
    ========================= */

    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async function (e) {

                e.preventDefault();

                const mobile =
                    document.getElementById("mobile")
                        ?.value
                        .trim();

                const email =
                    document.getElementById("email")
                        ?.value
                        .trim() || "";


                if (!validateMobile(mobile)) {

                    alert(
                        "Please enter a valid 10-digit Indian mobile number."
                    );

                    return;
                }


                localStorage.setItem(
                    "smartclean_pending_mobile",
                    mobile
                );

                localStorage.setItem(
                    "smartclean_pending_email",
                    email
                );


                /* DEMO MODE */

                if (
                    typeof DEMO_MODE !== "undefined" &&
                    DEMO_MODE
                ) {
                    const dynamicOtp = Math.floor(100000 + Math.random() * 900000).toString();
                    sessionStorage.setItem("smartclean_live_otp", dynamicOtp);

                    window.location.href =
                        "otp.html";

                    return;
                }


                /* BACKEND MODE */

                await sendLoginOTP(
                    mobile,
                    email
                );
            }
        );
    }


    /* =========================
       CITIZEN REGISTER
    ========================= */

    const registerForm =
        document.getElementById(
            "registerForm"
        );

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async function (e) {

                e.preventDefault();

                const name =
                    document.getElementById("name")
                        ?.value
                        .trim() || "";

                const mobile =
                    document.getElementById(
                        "registerMobile"
                    )
                        ?.value
                        .trim();

                const email =
                    document.getElementById(
                        "registerEmail"
                    )
                        ?.value
                        .trim() || "";


                if (!validateMobile(mobile)) {

                    alert(
                        "Please enter a valid 10-digit Indian mobile number."
                    );

                    return;
                }


                localStorage.setItem(
                    "smartclean_pending_name",
                    name
                );

                localStorage.setItem(
                    "smartclean_pending_mobile",
                    mobile
                );

                localStorage.setItem(
                    "smartclean_pending_email",
                    email
                );


                /* DEMO MODE */

                if (
                    typeof DEMO_MODE !== "undefined" &&
                    DEMO_MODE
                ) {
                    const dynamicOtp = Math.floor(100000 + Math.random() * 900000).toString();
                    sessionStorage.setItem("smartclean_live_otp", dynamicOtp);

                    window.location.href =
                        "otp.html";

                    return;
                }


                /* BACKEND MODE */

                await registerUser(
                    name,
                    mobile,
                    email
                );
            }
        );
    }


    /* =========================
       OTP
    ========================= */

    setupOTP();


    /* =========================
       ADMIN LOGIN
    ========================= */

    const adminLoginForm =
        document.getElementById(
            "adminLoginForm"
        );

    if (adminLoginForm) {

        adminLoginForm.addEventListener(
            "submit",
            async function (e) {

                e.preventDefault();

                const email =
                    document.getElementById(
                        "adminEmail"
                    )
                        ?.value
                        .trim();

                const password =
                    document.getElementById(
                        "adminPassword"
                    )
                        ?.value;


                if (!email || !password) {

                    alert(
                        "Please enter admin email and password."
                    );

                    return;
                }


                /* DEMO MODE */

                if (
                    typeof DEMO_MODE !== "undefined" &&
                    DEMO_MODE
                ) {

                    localStorage.setItem(
                        "smartclean_admin",
                        "true"
                    );

                    localStorage.setItem(
                        "smartclean_token",
                        "demo-admin-token"
                    );

                    window.location.href =
                        "admin-dashboard.html";

                    return;
                }


                /* BACKEND MODE */

                try {

                    const data =
                        await apiRequest(
                            "/auth/admin-login",
                            {
                                method: "POST",

                                body: JSON.stringify({
                                    email: email,
                                    password: password
                                })
                            }
                        );


                    if (!data.token) {

                        throw new Error(
                            "Admin login token was not received."
                        );
                    }


                    localStorage.setItem(
                        "smartclean_token",
                        data.token
                    );

                    localStorage.setItem(
                        "smartclean_admin",
                        "true"
                    );


                    window.location.href =
                        "admin-dashboard.html";

                } catch (error) {

                    console.error(
                        "Admin login error:",
                        error
                    );

                    alert(
                        error.message ||
                        "Admin login failed."
                    );
                }
            }
        );
    }
});


/* =========================
   MOBILE VALIDATION
========================= */

function validateMobile(mobile) {

    return /^[6-9][0-9]{9}$/.test(
        mobile
    );
}



/* =========================
   SEND LOGIN OTP
========================= */

async function sendLoginOTP(
    mobile,
    email
) {

    const submitBtn = document.querySelector("#loginForm button[type='submit']");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Calling with OTP...";
    }

    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);

    try {
        const response = await apiRequest(
            "/auth/login",
            {
                method: "POST",
                body: JSON.stringify({
                    mobile: cleanMobile,
                    email: email
                })
            }
        );

        console.log("Server OTP dispatched:", response);
        if (response.fallbackOtp) {
            alert("OTP call could not be placed from this local server. Use the OTP printed in the backend terminal for testing.");
        }
        window.location.href = "otp.html";

    } catch (error) {
        console.error("Login OTP error:", error);
        alert(error.message || "Unable to send verification OTP. Please try again.");

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "Get OTP Call <span>→</span>";
        }
    }
}


/* =========================
   REGISTER USER
========================= */

async function registerUser(
    name,
    mobile,
    email
) {

    const submitBtn = document.querySelector("#registerForm button[type='submit']");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Calling with OTP...";
    }

    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);

    try {
        const response = await apiRequest(
            "/auth/register",
            {
                method: "POST",
                body: JSON.stringify({
                    name: name,
                    mobile: cleanMobile,
                    email: email
                })
            }
        );

        console.log("Server OTP dispatched:", response);
        if (response.fallbackOtp) {
            alert("OTP call could not be placed from this local server. Use the OTP printed in the backend terminal for testing.");
        }
        window.location.href = "otp.html";

    } catch (error) {
        console.error("Registration error:", error);
        alert(error.message || "Unable to register user.");

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "Continue with OTP Call →";
        }
    }
}


/* =========================
   OTP SETUP
========================= */

function setupOTP() {

    const inputs =
        document.querySelectorAll(
            ".otp-input"
        );

    if (!inputs.length) {
        return;
    }


    const mobile =
        localStorage.getItem(
            "smartclean_pending_mobile"
        );


    const mobileElement =
        document.getElementById(
            "otpMobile"
        );


    if (
        mobileElement &&
        mobile
    ) {

        mobileElement.textContent =
            "+91 " + mobile;
    }


    /* OTP INPUT BEHAVIOUR */

    inputs.forEach(
        function (input, index) {

            input.addEventListener(
                "input",
                function () {

                    this.value =
                        this.value
                            .replace(/\D/g, "")
                            .slice(0, 1);


                    if (
                        this.value &&
                        index <
                        inputs.length - 1
                    ) {

                        inputs[
                            index + 1
                        ].focus();
                    }
                }
            );


            input.addEventListener(
                "keydown",
                function (e) {

                    if (
                        e.key === "Backspace" &&
                        !this.value &&
                        index > 0
                    ) {

                        inputs[
                            index - 1
                        ].focus();
                    }
                }
            );


            input.addEventListener(
                "paste",
                function (e) {

                    e.preventDefault();

                    const pasted =
                        (
                            e.clipboardData ||
                            window.clipboardData
                        )
                            .getData("text")
                            .replace(/\D/g, "")
                            .slice(0, 6);


                    pasted
                        .split("")
                        .forEach(
                            function (
                                digit,
                                digitIndex
                            ) {

                                if (
                                    inputs[
                                        digitIndex
                                    ]
                                ) {

                                    inputs[
                                        digitIndex
                                    ].value =
                                        digit;
                                }
                            }
                        );


                    if (pasted.length === 6) {

                        inputs[5].focus();
                    }
                }
            );
        }
    );


    /* OTP FORM */

    const otpForm =
        document.getElementById(
            "otpForm"
        );


    if (otpForm) {

        otpForm.addEventListener(
            "submit",
            async function (e) {

                e.preventDefault();


                let otp = "";

                inputs.forEach(
                    function (input) {

                        otp +=
                            input.value;
                    }
                );


                if (otp.length !== 6) {

                    alert(
                        "Please enter the 6-digit OTP."
                    );

                    return;
                }


                const pendingMobile =
                    localStorage.getItem(
                        "smartclean_pending_mobile"
                    );


                if (!pendingMobile) {

                    alert(
                        "Mobile number not found. Please login again."
                    );

                    window.location.href =
                        "login.html";

                    return;
                }


                /* DEMO MODE */

                if (
                    typeof DEMO_MODE !== "undefined" &&
                    DEMO_MODE
                ) {

                    const expectedOtp = sessionStorage.getItem("smartclean_live_otp");

                    if (
                        expectedOtp && otp !== expectedOtp
                    ) {

                        alert(
                            "Invalid OTP. Please enter the correct verification code."
                        );

                        return;
                    }


                    const name =
                        localStorage.getItem(
                            "smartclean_pending_name"
                        ) ||
                        "Citizen";


                    const email =
                        localStorage.getItem(
                            "smartclean_pending_email"
                        ) ||
                        "";


                    setCitizenSession(
                        "demo-token",
                        {
                            name: name,
                            mobile: pendingMobile,
                            email: email
                        }
                    );


                    window.location.href =
                        "dashboard.html";

                    return;
                }


                /* BACKEND MODE */

                const verifyBtn = otpForm.querySelector("button[type='submit']");
                if (verifyBtn) {
                    verifyBtn.disabled = true;
                    verifyBtn.innerHTML = "Verifying OTP... ⏳";
                }

                try {

                    const response =
                        await apiRequest(
                            "/auth/verify-otp",
                            {
                                method: "POST",

                                body: JSON.stringify({
                                    mobile:
                                        pendingMobile,
                                    otp: otp
                                })
                            }
                        );


                    if (!response.token) {

                        throw new Error(
                            "Login token was not received."
                        );
                    }


                    setCitizenSession(
                        response.token,
                        response.user ||
                        {
                            mobile:
                                pendingMobile,
                            name:
                                "Citizen"
                        }
                    );


                    window.location.href =
                        "dashboard.html";

                } catch (error) {

                    console.error(
                        "OTP verification error:",
                        error
                    );

                    alert(
                        error.message ||
                        "OTP verification failed. Please check the code."
                    );

                    if (verifyBtn) {
                        verifyBtn.disabled = false;
                        verifyBtn.innerHTML = "✓ Verify OTP";
                    }
                }
            }
        );
    }


    /* =========================
       RESEND OTP
    ========================= */

    const resendButton =
        document.getElementById(
            "resendOtp"
        );


    if (resendButton) {

        resendButton.addEventListener(
            "click",
            async function () {

                const mobile =
                    localStorage.getItem(
                        "smartclean_pending_mobile"
                    );

                if (!mobile) {

                    alert(
                        "Mobile number not found."
                    );

                    return;
                }

                resendButton.disabled = true;
                resendButton.textContent = "Calling again...";

                try {
                    const response = await apiRequest(
                        "/auth/login",
                        {
                            method: "POST",
                            body: JSON.stringify({
                                mobile: mobile
                            })
                        }
                    );

                    alert(
                        response.fallbackOtp
                            ? "OTP call could not be placed from this local server. Use the OTP printed in the backend terminal for testing."
                            : "Verification OTP call sent to +91 " + mobile
                    );
                } catch (error) {
                    alert(
                        error.message ||
                        "Unable to resend OTP."
                    );
                } finally {
                    resendButton.disabled = false;
                    resendButton.textContent = "Call Again";
                }
            }
        );
    }
}


/* =========================
   CITIZEN LOGOUT
========================= */

function logout() {
    clearCitizenSession();
    localStorage.removeItem("smartclean_pending_mobile");
    localStorage.removeItem("smartclean_pending_email");
    localStorage.removeItem("smartclean_pending_name");
    sessionStorage.removeItem("smartclean_live_otp");

    window.location.href = "login.html";
}


/* =========================
   ADMIN LOGOUT
========================= */

function adminLogout() {
    localStorage.removeItem("smartclean_admin");
    localStorage.removeItem("smartclean_token");
    sessionStorage.removeItem("smartclean_token");
    sessionStorage.removeItem("smartclean_user");

    window.location.href = "admin-login.html";
}
