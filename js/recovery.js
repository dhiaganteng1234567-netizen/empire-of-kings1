// ==========================================
// EMPIRE OF KINGS
// PASSWORD RECOVERY
// VERSION 0.40
// ==========================================

(function () {

    "use strict";


    const db = window.EOK?.supabase;


    if (!db) {

        console.error("Supabase unavailable.");

        return;

    }


    const messageElement =
        document.getElementById("recovery-message");


    function showMessage(value, success = false) {

        if (!messageElement) return;

        messageElement.textContent = value;

        messageElement.className =
            "auth-message " +
            (success ? "success" : "error");

    }



    // ======================================
    // REQUEST RECOVERY
    // ======================================

    const forgotForm =
        document.getElementById("forgot-form");


    if (forgotForm) {


        forgotForm.addEventListener(

            "submit",

            async function (event) {


                event.preventDefault();


                const email =
                    document.getElementById("email")
                    .value
                    .trim();


                const button =
                    document.getElementById("recovery-button");


                button.disabled = true;

                button.textContent = "Sending...";


                try {


                    const redirectURL =
                        new URL(
                            "reset-password.html",
                            location.href
                        ).href;


                    const { error } =

                        await db.auth.resetPasswordForEmail(

                            email,

                            {

                                redirectTo: redirectURL

                            }

                        );


                    if (error) throw error;


                    showMessage(
                        "Jika email tersebut terdaftar, instruksi pemulihan akan dikirim.",
                        true
                    );


                } catch (error) {


                    console.error(error);


                    showMessage(
                        "Recovery request failed. Please try again."
                    );


                }


                button.disabled = false;

                button.textContent = "Send Recovery Link";


            }

        );

    }



    // ======================================
    // UPDATE PASSWORD
    // ======================================

    const resetForm =
        document.getElementById("reset-form");


    if (resetForm) {


        let recoveryReady = false;


        db.auth.getSession().then(

            ({ data, error }) => {


                recoveryReady =
                    !error && Boolean(data.session);


                if (!recoveryReady) {

                    showMessage(
                        "Recovery session is unavailable. Request a new recovery link."
                    );

                }

            }

        );


        resetForm.addEventListener(

            "submit",

            async function (event) {


                event.preventDefault();


                const password =
                    document.getElementById("password").value;


                const confirm =
                    document.getElementById("confirm-password").value;


                const button =
                    document.getElementById("reset-button");


                if (!recoveryReady) {

                    showMessage(
                        "Recovery session is unavailable."
                    );

                    return;

                }


                if (password.length < 8) {

                    showMessage(
                        "Password must be at least 8 characters."
                    );

                    return;

                }


                if (password !== confirm) {

                    showMessage(
                        "Passwords do not match."
                    );

                    return;

                }


                button.disabled = true;


                const { error } = await db.auth.updateUser({

                    password

                });


                if (error) {

                    console.error(error);

                    showMessage(
                        "Password update failed."
                    );

                    button.disabled = false;

                    return;

                }


                showMessage(
                    "Password updated. You can now log in.",
                    true
                );


                setTimeout(

                    () => location.replace("login.html"),

                    1500

                );

            }

        );

    }


})();
