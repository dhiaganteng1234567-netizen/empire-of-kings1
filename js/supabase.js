// ==========================================
// EMPIRE OF KINGS
// SUPABASE CONNECTION
// VERSION 0.20
// ==========================================


(function () {

    if (
        !window.supabase ||
        !window.supabase.createClient
    ) {

        console.error(
            "Supabase library failed to load."
        );

        return;

    }


    const SUPABASE_URL =
        "https://morhlwmhevhhvwsytyuq.supabase.co";


    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_Hh8-Mkg_K6UMDqQCoYhr3w_fJevQMho";


    const client = window.supabase.createClient(

        SUPABASE_URL,

        SUPABASE_PUBLISHABLE_KEY,

        {

            auth: {

                autoRefreshToken: true,

                persistSession: true,

                detectSessionInUrl: true

            }

        }

    );


    window.EOK = window.EOK || {};

    window.EOK.supabase = client;


    console.log(
        "EMPIRE OF KINGS: Supabase connected."
    );


})();
