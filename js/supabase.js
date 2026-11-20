/* =========================================
   EMPIRE OF KINGS
   SUPABASE CONNECTION
   VERSION 1.0
========================================= */

(function () {

    "use strict";


    // ======================================
    // 1. SUPABASE CONFIGURATION
    // ======================================

    const SUPABASE_URL =
        "https://rkrwuqvczpjurljimkas.supabase.co";


    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_bQZjgnt1K53oBllpypTI-w_W_Ngqvr-";


    // ======================================
    // 2. CHECK SUPABASE LIBRARY
    // ======================================

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {

        console.error(
            "EMPIRE OF KINGS: Supabase library gagal dimuat."
        );

        return;

    }


    // ======================================
    // 3. CREATE SUPABASE CLIENT
    // ======================================

    window.EOK_SUPABASE =

        window.supabase.createClient(

            SUPABASE_URL,

            SUPABASE_PUBLISHABLE_KEY,

            {

                auth: {

                    persistSession: true,

                    autoRefreshToken: true,

                    detectSessionInUrl: true

                }

            }

        );


    console.log(
        "EMPIRE OF KINGS: Supabase connected."
    );

})();
