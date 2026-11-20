/* ==========================================
   EMPIRE OF KINGS
   ROYAL COMMAND CENTER
   VERSION 0.0.1
========================================== */

(function () {

    "use strict";


    // ======================================
    // 1. CORE CLIENT
    // ======================================

    const client = window.EOK_CLIENT;


    if (!client) {

        window.location.replace("login.html");

        return;

    }


    // ======================================
    // 2. ELEMENTS
    // ======================================

    const logoutButton =
        document.getElementById("logoutButton");


    const usernameElement =
        document.getElementById("playerUsername");


    const displayNameElement =
        document.getElementById("playerDisplayName");


    const playerIdElement =
        document.getElementById("playerId");


    const greetingElement =
        document.getElementById("greetingName");


    const topUsernameElement =
        document.getElementById("topUsername");


    const topAvatarElement =
        document.getElementById("topAvatar");


    const createdAtElement =
        document.getElementById("accountCreatedAt");


    const createdShortElement =
        document.getElementById("accountCreatedShort");


    const todayDateElement =
        document.getElementById("todayDate");


    const profileErrorElement =
        document.getElementById("profileError");


    // ======================================
    // 3. DATE FORMATTER
    // ======================================

    function formatDate(dateValue) {

        if (!dateValue) {

            return "Not available";

        }


        const date = new Date(dateValue);


        if (Number.isNaN(date.getTime())) {

            return "Not available";

        }


        return new Intl.DateTimeFormat(

            "id-ID",

            {

                day: "numeric",

                month: "long",

                year: "numeric"

            }

        ).format(date);

    }


    // ======================================
    // 4. CURRENT DATE
    // ======================================

    todayDateElement.textContent =

        formatDate(new Date());


    // ======================================
    // 5. LOAD PROFILE
    // ======================================

    async function loadDashboard() {

        try {


            // VERIFY SESSION

            const {

                data: userData,

                error: userError

            } = await client.auth.getUser();


            if (userError) throw userError;


            const user = userData.user;


            if (!user) {

                window.location.replace("login.html");

                return;

            }


            // GET PLAYER PROFILE

            const {

                data: profile,

                error: profileError

            } = await client

                .from("eok_profiles")

                .select(

                    "player_id, username, display_name, created_at"

                )

                .eq("id", user.id)

                .maybeSingle();


            if (profileError) {

                throw profileError;

            }


            // PROFILE NOT FOUND

            if (!profile) {

                profileErrorElement.hidden = false;

                profileErrorElement.textContent =

                    "Player profile has not been initialized. Check that all database setup sections completed successfully.";

                return;

            }


            // ==================================
            // ACCOUNT INFORMATION
            // ==================================

            const username = profile.username;

            const displayName =
                profile.display_name || username;


            // USERNAME

            usernameElement.textContent =
                "@" + username;


            topUsernameElement.textContent =
                username.toUpperCase();


            // DISPLAY NAME

            displayNameElement.textContent =
                displayName;


            greetingElement.textContent =
                displayName;


            // PLAYER ID

            playerIdElement.textContent =
                profile.player_id;


            // ACCOUNT AVATAR INITIAL

            const initial =

                Array.from(
                    displayName.trim()
                )[0]?.toUpperCase() || "E";


            topAvatarElement.textContent =
                initial;


            // ACCOUNT CREATION DATE

            const createdDate =
                formatDate(profile.created_at);


            createdAtElement.textContent =
                createdDate;


            createdShortElement.textContent =
                createdDate;


            console.info(
                "EOK: Player dashboard initialized."
            );


        } catch (error) {


            console.error(
                "EOK: Dashboard initialization failed.",
                error
            );


            profileErrorElement.hidden = false;

            profileErrorElement.textContent =

                "Unable to load your player information. Check your connection and database security configuration.";

        }

    }


    // ======================================
    // 6. LOGOUT
    // ======================================

    logoutButton.addEventListener(

        "click",

        async function () {


            logoutButton.disabled = true;

            logoutButton.textContent =
                "SIGNING OUT...";


            try {


                const {

                    error

                } = await client.auth.signOut();


                if (error) throw error;


                window.location.replace(
                    "index.html"
                );


            } catch (error) {


                console.error(
                    "EOK: Logout failed.",
                    error
                );


                logoutButton.disabled = false;

                logoutButton.textContent =
                    "SIGN OUT";

                alert(
                    "Unable to sign out. Please try again."
                );

            }

        }

    );


    // ======================================
    // 7. INITIALIZE DASHBOARD
    // ======================================

    loadDashboard();


})();
