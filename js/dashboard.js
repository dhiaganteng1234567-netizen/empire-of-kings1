/* =========================================
   EMPIRE OF KINGS
   ACCOUNT DASHBOARD
   VERSION 1.0
========================================= */

(function () {

    "use strict";


    // ======================================
    // 1. SUPABASE CLIENT
    // ======================================

    const supabase = window.EOK_SUPABASE;


    if (!supabase) {

        window.location.replace(
            "login.html"
        );

        return;

    }


    // ======================================
    // 2. ACCOUNT ELEMENTS
    // ======================================

    const usernameElement =
        document.getElementById("accountUsername");


    const emailElement =
        document.getElementById("accountEmail");


    const idElement =
        document.getElementById("accountId");


    const logoutButton =
        document.getElementById("logoutButton");


    // ======================================
    // 3. LOAD AUTHENTICATED USER
    // ======================================

    async function loadAccount() {

        try {


            const {
                data,
                error
            } = await supabase.auth.getUser();


            if (error) throw error;


            const user = data.user;


            if (!user) {

                window.location.replace(
                    "login.html"
                );

                return;

            }


            const metadata =
                user.user_metadata || {};


            const username =
                metadata.username ||
                metadata.display_name ||
                user.email ||
                "Player";


            usernameElement.textContent =
                username;


            emailElement.textContent =
                user.email || "Not available";


            idElement.textContent =
                user.id;


        } catch (error) {


            console.error(
                "Account verification failed:",
                error
            );


            window.location.replace(
                "login.html"
            );

        }

    }


    // ======================================
    // 4. LOGOUT
    // ======================================

    logoutButton.addEventListener(

        "click",

        async function () {

            logoutButton.disabled = true;

            logoutButton.textContent =
                "LOGGING OUT...";


            try {


                const {
                    error
                } = await supabase.auth.signOut();


                if (error) throw error;


                window.location.replace(
                    "index.html"
                );


            } catch (error) {


                console.error(
                    "Logout failed:",
                    error
                );


                logoutButton.disabled = false;

                logoutButton.textContent =
                    "LOG OUT";


                alert(
                    "Logout gagal. Silakan coba kembali."
                );

            }

        }

    );


    // ======================================
    // 5. INITIALIZE
    // ======================================

    loadAccount();


})();
