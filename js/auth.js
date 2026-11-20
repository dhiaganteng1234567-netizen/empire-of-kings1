/* ==========================================
   EMPIRE OF KINGS
   AUTHENTICATION
   VERSION 0.0.1
========================================== */

(function () {

"use strict";


const client = window.EOK_CLIENT;

if (!client) return;


const loginForm = document.getElementById("loginForm");

const registerForm = document.getElementById("registerForm");


function message(element, text, type) {

    if (!element) return;

    element.textContent = text;

    element.className = "form-message show " + type;

}


function errorText(error) {

    const text = String(error?.message || "");


    if (/invalid login credentials/i.test(text)) {

        return "Email atau password salah.";

    }


    if (/eok_username_invalid/i.test(text)) {

        return "Username tidak valid.";

    }


    if (/duplicate key|username_lower_uidx|username_key|database error saving new user/i.test(text)) {

        return "Username kemungkinan sudah digunakan.";

    }


    if (/eok_country_invalid/i.test(text)) {

        return "Kewarganegaraan tidak valid.";

    }


    if (/eok_region_invalid/i.test(text)) {

        return "Pilihan regional chat tidak valid.";

    }


    if (/email not confirmed/i.test(text)) {

        return "Akun belum aktif. Periksa pengaturan pendaftaran.";

    }


    return text || "Terjadi kesalahan.";

}


async function checkSession() {

    const { data, error } =

        await client.auth.getSession();


    if (!error && data.session) {

        window.location.replace("dashboard.html");

    }

}


if (loginForm || registerForm) {

    checkSession();

}


// ======================================
// REGISTER
// ======================================

if (registerForm) {


    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();


        const username =

            document.getElementById("registerUsername")

                .value.trim().toLowerCase();


        const email =

            document.getElementById("registerEmail")

                .value.trim().toLowerCase();


        const password =

            document.getElementById("registerPassword").value;


        const confirmation =

            document.getElementById("confirmPassword").value;


        const country =

            document.getElementById("registerCountry").value;


        const region =

            document.getElementById("registerRegion").value;


        const language =

            document.getElementById("registerLanguage").value;


        const output =

            document.getElementById("registerMessage");


        const button =

            registerForm.querySelector('button[type="submit"]');


        if (!/^[a-z0-9_]{3,20}$/.test(username)) {

            message(output, "Username harus 3–20 karakter.", "error");

            return;

        }


        if (password.length < 8) {

            message(output, "Password minimal 8 karakter.", "error");

            return;

        }


        if (password !== confirmation) {

            message(output, "Konfirmasi password tidak cocok.", "error");

            return;

        }


        if (!country || !region) {

            message(output, "Pilih kewarganegaraan dan regional chat.", "error");

            return;

        }


        if (!["id", "en", "tr"].includes(language)) {

            message(output, "Bahasa tidak valid.", "error");

            return;

        }


        button.disabled = true;

        button.textContent = "CREATING ACCOUNT...";


        try {


            const {

                data,

                error

            } = await client.auth.signUp({

                email,

                password,

                options: {

                    data: {

                        username,

                        display_name: username,

                        country_code: country,

                        chat_region: region,

                        preferred_language: language

                    }

                }

            });


            if (error) throw error;


            if (data.session) {

                message(

                    output,

                    "Account created. Welcome to the realm.",

                    "success"

                );


                window.location.replace("dashboard.html");


            } else {

                message(

                    output,

                    "Account created, but the session is not active. Check the email confirmation setting.",

                    "warning"

                );

            }


        } catch (error) {

            console.error("EOK registration error:", error);

            message(output, errorText(error), "error");

        } finally {

            button.disabled = false;

            button.textContent = "CREATE ACCOUNT →";

        }

    });

}


// ======================================
// LOGIN
// ======================================

if (loginForm) {


    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();


        const email =

            document.getElementById("loginEmail").value

                .trim().toLowerCase();


        const password =

            document.getElementById("loginPassword").value;


        const output =

            document.getElementById("loginMessage");


        const button =

            loginForm.querySelector('button[type="submit"]');


        button.disabled = true;

        button.textContent = "PLEASE WAIT...";


        try {


            const {

                data,

                error

            } = await client.auth.signInWithPassword({

                email,

                password

            });


            if (error) throw error;


            if (!data.session) {

                throw new Error("Session unavailable.");

            }


            window.location.replace("dashboard.html");


        } catch (error) {

            message(output, errorText(error), "error");

        } finally {

            button.disabled = false;

            button.textContent = "SIGN IN →";

        }

    });

}


})();
