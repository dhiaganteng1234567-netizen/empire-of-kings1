/* ==========================================
   EMPIRE OF KINGS
   CORE CONNECTION
   VERSION 0.0.1
========================================== */

(function () {

    "use strict";


    // ======================================
    // CONNECTION CONFIGURATION
    // ======================================

    const PROJECT_URL =
        "https://rkrwuqvczpjurljimkas.supabase.co";


    const PUBLIC_KEY =
        "sb_publishable_bQZjgnt1K53oBllpypTI-w_W_Ngqvr-";


    // ======================================
    // CHECK LIBRARY
    // ======================================

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {

        console.error(
            "EOK: Core connection library unavailable."
        );

        return;

    }


    // ======================================
    // INITIALIZE CLIENT
    // ======================================

    window.EOK_CLIENT =

        window.supabase.createClient(

            PROJECT_URL,

            PUBLIC_KEY,

            {

                auth: {

                    persistSession: true,

                    autoRefreshToken: true,

                    detectSessionInUrl: true

                }

            }

        );


    console.info(
        "EOK: Core services initialized."
    );

})();
