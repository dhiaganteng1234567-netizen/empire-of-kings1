// ==========================================
// EMPIRE OF KINGS
// SYSTEM ERROR CHECKER
// GAME VERSION 0.0.1
// ==========================================

(function () {

    "use strict";

    const page = document.body.dataset.eokPage || "dashboard";

    const scripts = {

        dashboard: [
            "js/dashboard.js",
            "js/world.js",
            "js/kingdoms.js",
            "js/royal-cycle.js"
        ],

        territories: [
            "js/territories.js"
        ],

        jobs: [
            "js/jobs.js"
        ]

    };


    // ======================================
    // CREATE SYSTEM STATUS PANEL
    // ======================================

    const panel = document.createElement("div");

    panel.id = "eok-system-status";

    panel.style.cssText = `
        position:fixed;
        inset:0;
        z-index:999999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        background:#091321;
        color:#f2eddf;
        font-family:Arial,sans-serif;
    `;

    document.body.appendChild(panel);


    function render(title, description, details = [], warning = false) {

        panel.style.display = "flex";

        panel.innerHTML = "";

        const card = document.createElement("div");

        card.style.cssText = `
            width:100%;
            max-width:520px;
            padding:25px;
            border:1px solid ${warning ? "#ae894b" : "#98505c"};
            border-radius:12px;
            background:#15243a;
            box-shadow:0 20px 60px rgba(0,0,0,.45);
        `;

        const heading = document.createElement("h2");

        heading.textContent = title;

        heading.style.color =
            warning ? "#e8c77d" : "#ffaaaa";


        const body = document.createElement("p");

        body.textContent = description;

        body.style.cssText = `
            color:#c4ceda;
            line-height:1.7;
            font-size:13px;
        `;

        card.appendChild(heading);

        card.appendChild(body);


        if (details.length) {

            const list = document.createElement("div");

            list.style.cssText = `
                padding:12px;
                background:#0b192a;
                border-radius:7px;
                margin:15px 0;
                font-size:11px;
                line-height:1.8;
            `;

            details.forEach(item => {

                const line = document.createElement("p");

                line.textContent = "• " + item;

                line.style.margin = "4px 0";

                list.appendChild(line);

            });

            card.appendChild(list);

        }


        panel.appendChild(card);

    }


    function loadScript(path) {

        return new Promise((resolve, reject) => {

            const script = document.createElement("script");

            script.src = path;

            script.async = false;

            script.onload = resolve;

            script.onerror = () => {

                reject(
                    new Error("Tidak dapat memuat " + path)
                );

            };

            document.body.appendChild(script);

        });

    }


    async function initialize() {

        const db = window.EOK?.supabase;


        // ==================================
        // CHECK SUPABASE
        // ==================================

        if (!db) {

            render(
                "SUPABASE CONNECTION ERROR",
                "Supabase belum tersambung. Periksa js/supabase.js dan koneksi internet.",
                [
                    "Periksa Supabase URL.",
                    "Periksa Publishable Key.",
                    "Pastikan library Supabase berhasil dimuat."
                ]
            );

            return;

        }


        // ==================================
        // CHECK SESSION
        // ==================================

        const { data: sessionData, error: sessionError } =
            await db.auth.getSession();


        if (sessionError) {

            render(
                "AUTHENTICATION ERROR",
                sessionError.message
            );

            return;

        }


        if (!sessionData.session) {

            location.replace("login.html");

            return;

        }


        // ==================================
        // CHECK DATABASE MIGRATIONS
        // ==================================

        render(
            "CHECKING GAME DATABASE",
            "Memeriksa struktur database dan fungsi server..."
        );


        const { data, error } = await db.rpc(
            "eok_system_health"
        );


        if (error) {

            console.error(error);


            render(
                "DATABASE SQL ERROR",
                "Fungsi pemeriksaan database tidak ditemukan atau gagal dijalankan.",
                [
                    "Jalankan SQL Part 6C.",
                    "Jalankan SQL Part 7.",
                    "Jalankan SQL Part 8.",
                    "Periksa pesan error pada Supabase SQL Editor.",
                    "Pastikan eok_system_health() tersedia."
                ]
            );

            return;

        }


        // ==================================
        // CHECK REQUIRED OBJECTS
        // ==================================

        if (!data.ok) {

            render(
                "INCOMPLETE DATABASE",
                "Beberapa tabel atau fungsi belum tersedia. Game tidak akan dimuat sampai SQL yang dibutuhkan dipasang.",
                data.missing || []
            );

            return;

        }


        // ==================================
        // NON-BLOCKING WARNINGS
        // ==================================

        if (data.warnings?.length) {

            const warning = document.createElement("div");

            warning.style.cssText = `
                position:fixed;
                top:8px;
                left:8px;
                right:8px;
                z-index:99999;
                padding:12px;
                background:#493b22;
                color:#ffe0a0;
                border:1px solid #b18a48;
                border-radius:7px;
                font:11px Arial;
            `;

            warning.textContent =
                "SYSTEM WARNING: " +
                data.warnings.join(" | ");


            document.body.appendChild(warning);

        }


        // ==================================
        // LOAD PAGE SCRIPTS
        // ==================================

        const selectedScripts =
            scripts[page];


        if (!selectedScripts) {

            render(
                "PAGE CONFIGURATION ERROR",
                "Jenis halaman tidak dikenali: " + page
            );

            return;

        }


        try {

            for (const path of selectedScripts) {

                await loadScript(path);

            }

        } catch (scriptError) {

            console.error(scriptError);

            render(
                "JAVASCRIPT LOADING ERROR",
                scriptError.message,
                [
                    "Periksa apakah file tersedia.",
                    "Periksa nama folder dan nama file.",
                    "Pastikan file sudah diunggah ke GitHub.",
                    "Periksa deployment Vercel."
                ]
            );

            return;

        }


        // ==================================
        // READY
        // ==================================

        panel.remove();

        console.log(
            "EMPIRE OF KINGS 0.0.1 READY"
        );

    }


    initialize().catch(error => {

        console.error(error);

        render(
            "SYSTEM INITIALIZATION ERROR",
            error.message,
            [
                "Periksa SQL database.",
                "Periksa koneksi internet.",
                "Periksa konfigurasi Supabase."
            ]
        );

    });


})();
