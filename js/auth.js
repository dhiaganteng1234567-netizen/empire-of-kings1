// ==========================================
// EMPIRE OF KINGS
// AUTHENTICATION SYSTEM
// VERSION 0.21
// NO EMAIL CONFIRMATION FLOW
// ==========================================

(function () {

    const supabase = window.EOK?.supabase;

    const messageElement =
        document.getElementById("auth-message");

    // ======================================
    // CHECK SUPABASE
    // ======================================

    if (!supabase) {

        console.error("Supabase client tidak ditemukan.");

        if (messageElement) {
            messageElement.textContent =
                "Koneksi Supabase gagal.";
        }

        return;
    }


    // ======================================
    // MESSAGE
    // ======================================

    function showMessage(message, type = "error") {

        if (!messageElement) return;

        messageElement.textContent = message;

        messageElement.className =
            "auth-message " + type;

    }


    // ======================================
    // PASSWORD VISIBILITY
    // ======================================

    document
        .querySelectorAll("[data-toggle-password]")
        .forEach(button => {

            button.addEventListener("click", function () {

                const input =
                    document.getElementById(
                        this.dataset.togglePassword
                    );

                if (!input) return;

                if (input.type === "password") {

                    input.type = "text";

                    this.textContent = "Sembunyikan";

                } else {

                    input.type = "password";

                    this.textContent = "Lihat";

                }

            });

        });


    // ======================================
    // REDIRECT EXISTING SESSION
    // ======================================

    async function redirectIfLoggedIn() {

        try {

            const { data, error } =
                await supabase.auth.getSession();

            if (error) {
                console.error(error);
                return;
            }

            if (data.session) {

                window.location.replace(
                    "dashboard.html"
                );

            }

        } catch (error) {

            console.error(error);

        }

    }

    redirectIfLoggedIn();


    // ======================================
    // FRIENDLY ERROR
    // ======================================

    function getFriendlyError(error, mode) {

        const message =
            String(error?.message || "").toLowerCase();

        if (
            message.includes("invalid login credentials")
        ) {
            return "Email atau password salah.";
        }

        if (
            message.includes("user already registered") ||
            message.includes("already been registered")
        ) {
            return "Email tersebut sudah memiliki akun.";
        }

        if (
            message.includes("duplicate key") ||
            message.includes("profiles_username")
        ) {
            return "Username sudah digunakan.";
        }

        if (
            message.includes("password")
        ) {
            return "Password tidak memenuhi ketentuan.";
        }

        if (
            message.includes("database error saving new user")
        ) {
            return "Gagal membuat profil pemain. Periksa trigger Part 2A.";
        }

        if (mode === "register") {
            return "Registrasi gagal. Periksa data dan konfigurasi Supabase.";
        }

        return "Terjadi kesalahan. Periksa koneksi internet.";
    }


    // ======================================
    // LOGIN
    // ======================================

    const loginForm =
        document.getElementById("login-form");

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                if (!loginForm.reportValidity()) {
                    return;
                }

                const email =
                    document.getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();

                const password =
                    document.getElementById("password")
                    .value;

                const button =
                    document.getElementById("login-submit");

                button.disabled = true;

                button.textContent = "Memproses...";

                showMessage(
                    "Sedang masuk ke dunia...",
                    "success"
                );

                try {

                    const { data, error } =
                        await supabase.auth.signInWithPassword({

                            email: email,

                            password: password

                        });

                    if (error) {
                        throw error;
                    }

                    if (!data.session || !data.user) {

                        throw new Error(
                            "Login tidak menghasilkan session."
                        );

                    }

                    window.location.replace(
                        "dashboard.html"
                    );

                } catch (error) {

                    console.error(error);

                    showMessage(
                        getFriendlyError(error, "login")
                    );

                    button.disabled = false;

                    button.textContent = "Masuk ke Dunia";

                }

            }
        );

    }


    // ======================================
    // REGISTER
    // ======================================

    const registerForm =
        document.getElementById("register-form");

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                if (!registerForm.reportValidity()) {
                    return;
                }

                const username =
                    document.getElementById("username")
                    .value
                    .trim()
                    .toLowerCase();

                const email =
                    document.getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();

                const password =
                    document.getElementById("password")
                    .value;

                const confirmPassword =
                    document.getElementById("confirm-password")
                    .value;

                const button =
                    document.getElementById("register-submit");


                // VALIDATE USERNAME

                if (!/^[a-z0-9_]{3,20}$/.test(username)) {

                    showMessage(
                        "Username harus terdiri dari 3–20 huruf, angka, atau underscore."
                    );

                    return;

                }


                // VALIDATE PASSWORD

                if (password.length < 8) {

                    showMessage(
                        "Password minimal 8 karakter."
                    );

                    return;

                }


                // CONFIRM PASSWORD

                if (password !== confirmPassword) {

                    showMessage(
                        "Konfirmasi password tidak sama."
                    );

                    return;

                }


                button.disabled = true;

                button.textContent = "Membuat akun...";

                showMessage(
                    "Sedang membuat akun pemain...",
                    "success"
                );


                try {

                    // ==================================
                    // CREATE ACCOUNT
                    // ==================================

                    const { data, error } =
                        await supabase.auth.signUp({

                            email: email,

                            password: password,

                            options: {

                                data: {

                                    username: username,

                                    display_name: username

                                }

                            }

                        });


                    if (error) {
                        throw error;
                    }


                    // ==================================
                    // REQUIRE IMMEDIATE SESSION
                    // ==================================

                    if (!data.user) {

                        throw new Error(
                            "Supabase tidak mengembalikan data pengguna."
                        );

                    }


                    if (!data.session) {

                        throw new Error(
                            "NO_SESSION_CONFIRM_EMAIL_STILL_ENABLED"
                        );

                    }


                    // ==================================
                    // SUCCESS
                    // ==================================

                    showMessage(
                        "Akun berhasil dibuat. Membuka dashboard...",
                        "success"
                    );


                    window.location.replace(
                        "dashboard.html"
                    );


                } catch (error) {

                    console.error(error);

                    if (
                        error.message ===
                        "NO_SESSION_CONFIRM_EMAIL_STILL_ENABLED"
                    ) {

                        showMessage(
                            "Session tidak tersedia. Pastikan Confirm email di Supabase sudah OFF."
                        );

                    } else {

                        showMessage(
                            getFriendlyError(error, "register")
                        );

                    }

                    button.disabled = false;

                    button.textContent = "Buat Akun";

                }

            }
        );

    }

})();
