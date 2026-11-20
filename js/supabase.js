// ==========================================
// EMPIRE OF KINGS
// SUPABASE CONNECTION
// PHASE 1
// ==========================================

import { createClient } from
    "https://esm.sh/@supabase/supabase-js@2";


// ==========================================
// PROJECT CONFIGURATION
// ==========================================

const SUPABASE_URL =
    "https://rkrwuqvczpjurljimkas.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_bQZjgnt1K53oBllpypTI-w_W_Ngqvr-";


// ==========================================
// CREATE SUPABASE CLIENT
// ==========================================

export const supabase = createClient(

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


// ==========================================
// CONNECTION READY
// ==========================================

console.log(
    "EMPIRE OF KINGS: Supabase initialized."
);
