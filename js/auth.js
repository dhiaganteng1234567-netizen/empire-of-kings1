/* ==========================================
   EMPIRE OF KINGS
   ACCOUNT AUTHENTICATION
   VERSION 0.0.1
========================================== */

(function () {

    "use strict";


    // ======================================
    // 1. CLIENT
    // ======================================

    const client = window.EOK_CLIENT;


    if (!client) {

        console.error("EOK: Account system unavailable.");

        return;

    }


    // ======================================
    // 2. ELEMENTS
    // ======================================

    const loginForm =
        document.getElementById("loginForm");


    const registerForm =
        document.getElementById("registerForm");


    // ======================================
    // 3. MESSAGE HANDLER
    // ======================================

    function showMessage(element, message, type) {

        if (!element) return;

        element.textContent = message;

        element.className =
            "form-message show " + type;

    }


    // ======================================
    // 4. BUTTON LOADING
    // ======================================

    function setButtonLoading(form, loading) {

        const button =
            form.querySelector('button[type="submit"]');


        if (!button) return;


        if (!button.dataset.originalText) {

            button.dataset.originalText =
                button.textContent.trim();

        }


        button.disabled = loading;


        button.textContent = loading

            ? "PLEASE WAIT..."

            : button.dataset.originalText;

    }


    // ======================================
    // 5. ERROR HANDLING
    // ======================================

    function readableError(error) {

        const message =
            String(error?.message || "");


        if (/invalid login credentials/i.test(message)) {

            return "Email atau password tidak benar.";

        }


        if (/user already registered/i.test(message)) {

            return "Email tersebut sudah terdaftar.";

        }


        if (/eok_username_invalid/i.test(message)) {

            return "Format username tidak valid.";

        }


        if (
            /duplicate key|eok_profiles_username_lower_uidx|eok_profiles_username_key|database error saving new user/i
                .test(message)
        ) {

            return "Username kemungkinan sudah digunakan. Silakan pilih username lain.";

        }


        if (/email not confirmed/i.test(message)) {

            return "Akun belum aktif. Periksa pengaturan pendaftaran.";

        }


        if (!message) {

            return "Terjadi kesalahan. Silakan coba kembali.";

        }


        return message;

    }


    // ======================================
    // 6. CHECK SESSION
    // ======================================

    async function redirectIfAuthenticated() {

        try {

            const {
                data,
                error
            } = await client.auth.getSession();


            if (error) throw error;


            if (data.session) {

                window.location.replace(
                    "dashboard.html"
                );

            }

        } catch (error) {

            console.error(
                "EOK: Session check failed.",
                error
            );

        }

    }


    if (loginForm || registerForm) {

        redirectIfAuthenticated();

    }


    // ======================================
    // 7. PASSWORD VISIBILITY
    // ======================================

    document

        .querySelectorAll("[data-toggle-password]")

        .forEach(function (button) {


            button.addEventListener(
                "click",
                function () {

                    const input =

                        document.getElementById(
                            button.dataset.togglePassword
                        );


                    if (!input) return;


                    if (input.type === "password") {

                        input.type = "text";

                        button.textContent = "HIDE";

                    } else {

                        input.type = "password";

                        button.textContent = "SHOW";

                    }

                }

            );

        });


    // ======================================
    // 8. REGISTRATION
    // ======================================

    if (registerForm) {


        registerForm.addEventListener(

            "submit",

            async function (event) {

                event.preventDefault();


                const messageElement =

                    document.getElementById(
                        "registerMessage"
                    );


                const originalUsername =

                    document

                        .getElementById("registerUsername")

                        .value

                        .trim();


                const username =
                    originalUsername.toLowerCase();


                const email =

                    document

                        .getElementById("registerEmail")

                        .value

                        .trim()

                        .toLowerCase();


                const password =

                    document

                        .getElementById("registerPassword")

                        .value;


                const confirmPassword =

                    document

                        .getElementById("confirmPassword")

                        .value;


                // USERNAME VALIDATION

                const usernamePattern =
                    /^[a-z0-9_]{3,20}$/;


                if (!usernamePattern.test(username)) {

                    showMessage(

                        messageElement,

                        "Username harus 3–20 karakter, menggunakan huruf, angka, atau underscore.",

                        "error"

                    );

                    return;

                }


                // PASSWORD VALIDATION

                if (password.length < 8) {

                    showMessage(

                        messageElement,

                        "Password minimal 8 karakter.",

                        "error"

                    );

                    return;

                }


                // PASSWORD CONFIRMATION

                if (password !== confirmPassword) {

                    showMessage(

                        messageElement,

                        "Konfirmasi password tidak cocok.",

                        "error"

                    );

                    return;

                }


                setButtonLoading(registerForm, true);


                showMessage(

                    messageElement,

                    "Creating your account...",

                    "warning"

                );


                try {


                    // CREATE ACCOUNT

                    const {

                        data,

                        error

                    } = await client.auth.signUp({

                        email: email,

                        password: password,

                        options: {

                            data: {

                                username: username,

                                display_name: originalUsername

                            }

                        }

                    });


                    if (error) throw error;


                    // CHECK SESSION

                    if (data.session) {


                        showMessage(

                            messageElement,

                            "Your account has been created successfully.",

                            "success"

                        );


                        window.location.replace(
                            "dashboard.html"
                        );


                    } else {


                        showMessage(

                            messageElement,

                            "Account registration received. Check the account confirmation configuration before continuing.",

                            "warning"

                        );

                    }


                } catch (error) {


                    console.error(
                        "EOK: Registration failed.",
                        error
                    );


                    showMessage(

                        messageElement,

                        readableError(error),

                        "error"

                    );


                } finally {


                    setButtonLoading(
                        registerForm,
                        false
                    );

                }

            }

        );

    }


    // ======================================
    // 9. LOGIN
    // ======================================

    if (loginForm) {


        loginForm.addEventListener(

            "submit",

            async function (event) {

                event.preventDefault();


                const messageElement =

                    document.getElementById(
                        "loginMessage"
                    );


                const email =

                    document

                        .getElementById("loginEmail")

                        .value

                        .trim()

                        .toLowerCase();


                const password =

                    document

                        .getElementById("loginPassword")

                        .value;


                setButtonLoading(loginForm, true);


                showMessage(

                    messageElement,

                    "Authenticating your account...",

                    "warning"

                );


                try {


                    const {

                        data,

                        error

                    } = await client.auth.signInWithPassword({

                        email: email,

                        password: password

                    });


                    if (error) throw error;


                    if (!data.session) {

                        throw new Error(
                            "Login session unavailable."
                        );

                    }


                    showMessage(

                        messageElement,

                        "Welcome back to the realm.",

                        "success"

                    );


                    window.location.replace(
                        "dashboard.html"
                    );


                } catch (error) {


                    console.error(
                        "EOK: Login failed.",
                        error
                    );


                    showMessage(

                        messageElement,

                        readableError(error),

                        "error"

                    );


                } finally {


                    setButtonLoading(
                        loginForm,
                        false
                    );

                }

            }

        );

    }


})();
