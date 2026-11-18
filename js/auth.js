// ==========================================
// EMPIRE OF KINGS
// AUTHENTICATION SYSTEM
// VERSION 0.20
// ==========================================


(function () {


    const supabase = window.EOK?.supabase;

    const messageElement =
        document.getElementById("auth-message");


    function showMessage(message, type = "error") {

        if (!messageElement) return;

        messageElement.textContent = message;

        messageElement.className =
            "auth-message " + type;

    }



    if (!supabase) {

        showMessage(
            "Koneksi Supabase gagal. Periksa konfigurasi."
        );

        return;

    }



    // ======================================
    // PASSWORD TOGGLE
    // ======================================

    document
        .querySelectorAll("[data-toggle-password]")
        .forEach(button => {

            button.addEventListener("click", function () {

                const inputId =
                    this.dataset.togglePassword;

                const input =
                    document.getElementById(inputId);

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
    // REDIRECT IF ALREADY LOGGED IN
    // ======================================

    async function redirectIfLoggedIn() {

        const { data, error } =
            await supabase.auth.getSession();

        if (!error && data.session) {

            window.location.replace(
                "dashboard.html"
            );

        }

    }



    redirectIfLoggedIn();



    // ======================================
    // FRIENDLY ERROR MESSAGES
    // ======================================

    function getFriendlyError(error, mode) {

        const text =
            String(error?.message || "").toLowerCase();


        if (
            mode === "login" &&
            text.includes("invalid login credentials")
        ) {

            return "Email atau password salah.";

        }


        if (
            text.includes("email not confirmed")
        ) {

            return "Email belum diverifikasi. Periksa kotak masuk email kamu.";

        }


        if (
            text.includes("duplicate key") ||
            text.includes("profiles_username")
        ) {

            return "Username sudah digunakan. Gunakan username lain.";

        }


        if (
            text.includes("password")
        ) {

            return "Password tidak memenuhi ketentuan.";

        }


        if (mode === "register") {

            return "Pendaftaran gagal. Pastikan Query 2A sudah berhasil dan username belum digunakan.";

        }


        return "Terjadi kesalahan. Periksa koneksi internet dan data login.";

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
                    document
                    .getElementById("email")
                    .value
                    .trim();


                const password =
                    document
                    .getElementById("password")
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

                            email,

                            password

                        });


                    if (error) {

                        throw error;

                    }


                    if (!data.user) {

                        throw new Error(
                            "Login gagal."
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
                    document
                    .getElementById("username")
                    .value
                    .trim()
                    .toLowerCase();


                const email =
                    document
                    .getElementById("email")
                    .value
                    .trim();


                const password =
                    document
                    .getElementById("password")
                    .value;


                const confirmPassword =
                    document
                    .getElementById("confirm-password")
                    .value;


                const button =
                    document.getElementById("register-submit");


                if (!/^[a-z0-9_]{3,20}$/.test(username)) {

                    showMessage(
                        "Username harus terdiri dari 3–20 huruf, angka, atau underscore."
                    );

                    return;

                }


                if (password.length < 8) {

                    showMessage(
                        "Password minimal 8 karakter."
                    );

                    return;

                }


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


                    const redirectURL =
                        new URL(
                            "login.html",
                            window.location.href
                        ).href;


                    const { data, error } =
                        await supabase.auth.signUp({

                            email,

                            password,

                            options: {

                                data: {

                                    username: username,

                                    display_name: username

                                },

                                emailRedirectTo: redirectURL

                            }

                        });


                    if (error) {

                        throw error;

                    }


                    if (data.session) {

                        window.location.replace(
                            "dashboard.html"
                        );

                        return;

                    }


                    showMessage(
                        "Pendaftaran berhasil. Periksa email untuk verifikasi, lalu login.",
                        "success"
                    );


                    button.disabled = false;

                    button.textContent = "Buat Akun";


                } catch (error) {

                    console.error(error);

                    showMessage(
                        getFriendlyError(error, "register")
                    );


                    button.disabled = false;

                    button.textContent = "Buat Akun";

                }

            }

        );


    }



})();
