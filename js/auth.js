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

                    alert(
                        "Demo OTP: 123456"
                    );

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

                    alert(
                        "Demo OTP: 123456"
                    );

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

    try {

        await apiRequest(
            "/auth/login",
            {
                method: "POST",

                body: JSON.stringify({
                    mobile: mobile,
                    email: email
                })
            }
        );


        window.location.href =
            "otp.html";

    } catch (error) {

        console.error(
            "Login OTP error:",
            error
        );

        alert(
            error.message ||
            "Unable to send OTP."
        );
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

    try {

        await apiRequest(
            "/auth/register",
            {
                method: "POST",

                body: JSON.stringify({
                    name: name,
                    mobile: mobile,
                    email: email
                })
            }
        );


        window.location.href =
            "otp.html";

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        alert(
            error.message ||
            "Unable to register user."
        );
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

                    if (
                        otp !== "123456"
                    ) {

                        alert(
                            "Invalid demo OTP. Use 123456."
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


                    localStorage.setItem(
                        "smartclean_token",
                        "demo-token"
                    );


                    localStorage.setItem(
                        "smartclean_user",
                        JSON.stringify({
                            name: name,
                            mobile: pendingMobile,
                            email: email
                        })
                    );


                    window.location.href =
                        "dashboard.html";

                    return;
                }


                /* BACKEND MODE */

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


                    localStorage.setItem(
                        "smartclean_token",
                        response.token
                    );


                    localStorage.setItem(
                        "smartclean_user",
                        JSON.stringify(
                            response.user ||
                            {
                                mobile:
                                    pendingMobile,
                                name:
                                    "Citizen"
                            }
                        )
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
                        "OTP verification failed."
                    );
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


                if (
                    typeof DEMO_MODE !== "undefined" &&
                    DEMO_MODE
                ) {

                    alert(
                        "Demo OTP: 123456"
                    );

                    return;
                }


                try {

                    await apiRequest(
                        "/auth/login",
                        {
                            method: "POST",

                            body: JSON.stringify({
                                mobile: mobile
                            })
                        }
                    );


                    alert(
                        "OTP sent successfully."
                    );

                } catch (error) {

                    alert(
                        error.message ||
                        "Unable to resend OTP."
                    );
                }
            }
        );
    }
}


/* =========================
   CITIZEN LOGOUT
========================= */

function logout() {

    localStorage.removeItem(
        "smartclean_token"
    );

    localStorage.removeItem(
        "smartclean_user"
    );

    localStorage.removeItem(
        "smartclean_pending_mobile"
    );

    localStorage.removeItem(
        "smartclean_pending_email"
    );

    localStorage.removeItem(
        "smartclean_pending_name"
    );


    window.location.href =
        "login.html";
}


/* =========================
   ADMIN LOGOUT
========================= */

function adminLogout() {

    localStorage.removeItem(
        "smartclean_admin"
    );

    localStorage.removeItem(
        "smartclean_token"
    );


    window.location.href =
        "admin-login.html";
}S