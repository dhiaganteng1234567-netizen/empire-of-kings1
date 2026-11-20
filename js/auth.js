/* =========================================
   EMPIRE OF KINGS
   AUTHENTICATION SYSTEM
   VERSION 1.0
========================================= */

(function () {

    "use strict";


    // ======================================
    // 1. SUPABASE CLIENT
    // ======================================

    const supabase = window.EOK_SUPABASE;


    if (!supabase) {

        console.error(
            "Supabase client tidak tersedia."
        );

        return;

    }


    // ======================================
    // 2. DOM ELEMENTS
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
    // 5. ERROR HANDLER
    // ======================================

    function readableError(error) {

        const message =
            String(error?.message || "");


        if (
            /invalid login credentials/i.test(message)
        ) {

            return "Email atau password tidak benar.";

        }


        if (
            /user already registered/i.test(message)
        ) {

            return "Email ini sudah terdaftar.";

        }


        if (
            /password should be at least/i.test(message)
        ) {

            return "Password terlalu pendek.";

        }


        if (
            /email not confirmed/i.test(message)
        ) {

            return "Email belum dikonfirmasi. Periksa pengaturan Confirm Email di Supabase.";

        }


        if (!message) {

            return "Terjadi kesalahan. Silakan coba kembali.";

        }


        return message;

    }


    // ======================================
    // 6. REDIRECT ACTIVE SESSION
    // ======================================

    async function redirectIfAuthenticated() {

        try {

            const {
                data,
                error
            } = await supabase.auth.getSession();


            if (error) throw error;


            if (data.session) {

                window.location.replace(
                    "dashboard.html"
                );

            }

        } catch (error) {

            console.error(
                "Session check failed:",
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

                    const inputId =
                        button.dataset.togglePassword;


                    const input =
                        document.getElementById(inputId);


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
    // 8. REGISTER SYSTEM
    // ======================================

    if (registerForm) {


        registerForm.addEventListener(

            "submit",

            async function (event) {

                event.preventDefault();


                const messageElement =
                    document.getElementById("registerMessage");


                const username =
                    document
                        .getElementById("registerUsername")
                        .value
                        .trim();


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


                // Username validation

                const usernamePattern =
                    /^[A-Za-z0-9_]{3,20}$/;


                if (!usernamePattern.test(username)) {

                    showMessage(
                        messageElement,
                        "Username harus 3–20 karakter dan hanya menggunakan huruf, angka, atau underscore.",
                        "error"
                    );

                    return;

                }


                // Password validation

                if (password.length < 8) {

                    showMessage(
                        messageElement,
                        "Password minimal 8 karakter.",
                        "error"
                    );

                    return;

                }


                // Confirm password

                if (password !== confirmPassword) {

                    showMessage(
                        messageElement,
                        "Konfirmasi password tidak cocok.",
                        "error"
                    );

                    return;

                }


                setButtonLoading(
                    registerForm,
                    true
                );


                showMessage(
                    messageElement,
                    "Creating your account...",
                    "warning"
                );


                try {


                    // Supabase registration

                    const {
                        data,
                        error
                    } = await supabase.auth.signUp({

                        email: email,

                        password: password,

                        options: {

                            data: {

                                username: username,

                                display_name: username

                            }

                        }

                    });


                    if (error) throw error;


                    // Automatic session check

                    if (data.session) {


                        showMessage(
                            messageElement,
                            "Account created successfully. Entering the realm...",
                            "success"
                        );


                        window.location.replace(
                            "dashboard.html"
                        );


                    } else {


                        showMessage(

                            messageElement,

                            "Pendaftaran diterima, tetapi sesi belum aktif. Pastikan Confirm Email dinonaktifkan pada pengaturan Supabase.",

                            "warning"

                        );

                    }


                } catch (error) {


                    console.error(
                        "Registration error:",
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
    // 9. LOGIN SYSTEM
    // ======================================

    if (loginForm) {


        loginForm.addEventListener(

            "submit",

            async function (event) {

                event.preventDefault();


                const messageElement =
                    document.getElementById("loginMessage");


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


                setButtonLoading(
                    loginForm,
                    true
                );


                showMessage(
                    messageElement,
                    "Authenticating your account...",
                    "warning"
                );


                try {


                    const {
                        data,
                        error
                    } = await supabase.auth.signInWithPassword({

                        email: email,

                        password: password

                    });


                    if (error) throw error;


                    if (!data.session) {

                        throw new Error(
                            "Login berhasil tetapi sesi belum terbentuk."
                        );

                    }


                    showMessage(

                        messageElement,

                        "Login successful. Welcome back.",

                        "success"

                    );


                    window.location.replace(
                        "dashboard.html"
                    );


                } catch (error) {


                    console.error(
                        "Login error:",
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
