// ==========================================
// EMPIRE OF KINGS
// PHASE 1 - APPLICATION CORE
// ==========================================

import { supabase } from "./supabase.js";


// ==========================================
// DOM HELPERS
// ==========================================

const $ = (selector) =>
    document.querySelector(selector);


const authView = $("#auth-view");

const appView = $("#app-view");

const authMessage = $("#auth-message");

const toast = $("#toast");


let currentUser = null;

let currentProfile = null;

let activePage = "overview";

let toastTimer = null;


// ==========================================
// HELPERS
// ==========================================

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}


function setAuthMessage(message, type = "success") {

    authMessage.textContent = message;

    authMessage.className = "message";

    if (type === "error") {

        authMessage.classList.add("error");

    }

}


function formatNumber(number) {

    return Number(number || 0).toLocaleString("id-ID");

}


function setBusy(form, busy, label = "") {

    const button = form.querySelector(
        'button[type="submit"]'
    );

    if (!button) return;

    if (busy) {

        button.dataset.originalText = button.textContent;

        button.disabled = true;

        button.textContent = label || "PROCESSING...";

    } else {

        button.disabled = false;

        button.textContent =
            button.dataset.originalText || "SUBMIT";

    }

}


function getFriendlyError(error) {

    const message = String(
        error?.message || ""
    ).toLowerCase();


    if (
        message.includes("duplicate key") ||
        message.includes("unique constraint")
    ) {

        return "Username tersebut sudah digunakan.";

    }


    if (
        message.includes("invalid login credentials")
    ) {

        return "Email atau password tidak benar.";

    }


    if (
        message.includes("database error saving new user")
    ) {

        return "Pendaftaran gagal. Periksa username dan pengaturan database.";

    }


    if (
        message.includes("password")
    ) {

        return "Password tidak memenuhi persyaratan.";

    }


    return "Terjadi kesalahan. Periksa koneksi dan konfigurasi Supabase.";

}


function setAvatar(element, symbol, color) {

    element.textContent = symbol;

    element.style.backgroundColor = color;

}


// ==========================================
// AUTHENTICATION VIEW
// ==========================================

function showAuth() {

    authView.classList.remove("hidden");

    appView.classList.add("hidden");

    currentUser = null;

    currentProfile = null;

}


function showApp() {

    authView.classList.add("hidden");

    appView.classList.remove("hidden");

}


// ==========================================
// AUTH TABS
// ==========================================

function switchAuthMode(mode) {

    const loginForm = $("#login-form");

    const registerForm = $("#register-form");


    const isLogin = mode === "login";


    loginForm.classList.toggle(
        "hidden",
        !isLogin
    );


    registerForm.classList.toggle(
        "hidden",
        isLogin
    );


    document.querySelectorAll(".auth-tab").forEach(
        (button) => {

            button.classList.toggle(

                "active",

                button.dataset.authMode === mode

            );

        }
    );


    authMessage.textContent = "";

}


document.querySelectorAll("[data-auth-mode]").forEach(
    (button) => {

        button.addEventListener("click", () => {

            switchAuthMode(
                button.dataset.authMode
            );

        });

    }
);


// ==========================================
// REGISTER
// ==========================================

$("#register-form").addEventListener(
    "submit",

    async (event) => {

        event.preventDefault();

        const form = event.currentTarget;


        const username = $(
            "#register-username"
        ).value.trim().toLowerCase();


        const email = $(
            "#register-email"
        ).value.trim();


        const password = $(
            "#register-password"
        ).value;


        const confirmPassword = $(
            "#register-confirm-password"
        ).value;


        // USERNAME VALIDATION

        if (!/^[a-z0-9_]{3,20}$/.test(username)) {

            setAuthMessage(

                "Username harus 3–20 karakter dan hanya boleh menggunakan huruf, angka, serta underscore.",

                "error"

            );

            return;

        }


        // PASSWORD VALIDATION

        if (password.length < 8) {

            setAuthMessage(

                "Password minimal 8 karakter.",

                "error"

            );

            return;

        }


        if (password !== confirmPassword) {

            setAuthMessage(

                "Konfirmasi password tidak cocok.",

                "error"

            );

            return;

        }


        setBusy(
            form,
            true,
            "CREATING ACCOUNT..."
        );


        try {

            const { data, error } =

                await supabase.auth.signUp({

                    email: email,

                    password: password,

                    options: {

                        data: {

                            username: username,

                            display_name: username

                        }

                    }

                });


            if (error) {

                console.error(error);

                setAuthMessage(

                    getFriendlyError(error),

                    "error"

                );

                return;

            }


            if (!data.session) {

                setAuthMessage(

                    "Akun dibuat, tetapi sesi belum aktif. Pastikan Email Confirmations sudah dinonaktifkan di Supabase.",

                    "error"

                );

                return;

            }


            setAuthMessage(

                "Account successfully created. Welcome to the realm."

            );


            await loadDashboard(
                data.user.id
            );


        } catch (error) {

            console.error(error);

            setAuthMessage(

                getFriendlyError(error),

                "error"

            );

        } finally {

            setBusy(form, false);

        }

    }

);


// ==========================================
// LOGIN
// ==========================================

$("#login-form").addEventListener(

    "submit",

    async (event) => {

        event.preventDefault();

        const form = event.currentTarget;


        const email = $(
            "#login-email"
        ).value.trim();


        const password = $(
            "#login-password"
        ).value;


        setBusy(
            form,
            true,
            "ENTERING REALM..."
        );


        try {

            const { data, error } =

                await supabase.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            if (error) {

                console.error(error);

                setAuthMessage(

                    getFriendlyError(error),

                    "error"

                );

                return;

            }


            if (data.user) {

                await loadDashboard(
                    data.user.id
                );

            }


        } catch (error) {

            console.error(error);

            setAuthMessage(

                getFriendlyError(error),

                "error"

            );

        } finally {

            setBusy(form, false);

        }

    }

);


// ==========================================
// LOAD PLAYER DASHBOARD
// ==========================================

async function loadDashboard(userId) {

    try {

        // VERIFY AUTHENTICATED USER

        const {

            data: userData,

            error: userError

        } = await supabase.auth.getUser();


        if (userError || !userData.user) {

            throw userError || new Error(
                "Authentication session not found."
            );

        }


        const user = userData.user;


        if (user.id !== userId) {

            throw new Error(
                "Invalid account session."
            );

        }


        // FETCH PLAYER PROFILE

        const {

            data: profile,

            error: profileError

        } = await supabase

            .from("eok_profiles")

            .select(`

                id,

                player_id,

                username,

                display_name,

                bio,

                avatar_symbol,

                avatar_color,

                level,

                experience,

                created_at,

                updated_at

            `)

            .eq("id", user.id)

            .single();


        if (profileError) {

            throw profileError;

        }


        currentUser = user;

        currentProfile = profile;


        renderProfile();


        showApp();

        showPage("overview");


    } catch (error) {

        console.error(error);

        showToast(
            "Gagal memuat profil pemain."
        );

    }

}


// ==========================================
// RENDER PLAYER DATA
// ==========================================

function renderProfile() {

    if (!currentUser || !currentProfile) {

        return;

    }


    const p = currentProfile;


    // TOPBAR

    $("#topbar-player-name").textContent =
        p.display_name;


    setAvatar(

        $("#topbar-avatar"),

        p.avatar_symbol,

        p.avatar_color

    );


    // OVERVIEW

    $("#welcome-title").textContent =
        `Welcome, ${p.display_name}`;


    $("#overview-display-name").textContent =
        p.display_name;


    $("#overview-username").textContent =
        `@${p.username}`;


    $("#overview-player-id").textContent =
        p.player_id;


    $("#overview-level").textContent =
        formatNumber(p.level);


    $("#overview-xp").textContent =
        formatNumber(p.experience);


    setAvatar(

        $("#overview-avatar"),

        p.avatar_symbol,

        p.avatar_color

    );


    // PROFILE

    $("#profile-display-name").textContent =
        p.display_name;


    $("#profile-username").textContent =
        `@${p.username}`;


    $("#profile-player-id").textContent =
        p.player_id;


    $("#profile-email").textContent =
        currentUser.email || "-";


    $("#profile-level").textContent =
        formatNumber(p.level);


    $("#profile-xp").textContent =
        formatNumber(p.experience);


    $("#profile-created").textContent =

        new Date(
            p.created_at
        ).toLocaleDateString("id-ID", {

            day: "2-digit",

            month: "long",

            year: "numeric"

        });


    $("#profile-uuid").textContent =
        p.id;


    $("#profile-bio").textContent =

        p.bio || "Belum ada biography.";


    setAvatar(

        $("#profile-avatar"),

        p.avatar_symbol,

        p.avatar_color

    );


    // SETTINGS

    $("#edit-username").value =
        p.username;


    $("#edit-display-name").value =
        p.display_name;


    $("#edit-bio").value =
        p.bio;


    $("#edit-avatar-symbol").value =
        p.avatar_symbol;


    $("#edit-avatar-color").value =
        p.avatar_color;

}


// ==========================================
// NAVIGATION
// ==========================================

function showPage(page) {

    activePage = page;


    document.querySelectorAll(".page").forEach(
        (section) => {

            section.classList.toggle(

                "hidden",

                section.id !== `page-${page}`

            );

        }
    );


    document.querySelectorAll(".nav-button").forEach(
        (button) => {

            button.classList.toggle(

                "active",

                button.dataset.page === page

            );

        }
    );

}


document.querySelectorAll("[data-page]").forEach(
    (button) => {

        button.addEventListener("click", () => {

            showPage(
                button.dataset.page
            );

        });

    }
);


// ==========================================
// UPDATE PLAYER PROFILE
// ==========================================

$("#profile-form").addEventListener(

    "submit",

    async (event) => {

        event.preventDefault();

        const form = event.currentTarget;


        if (!currentUser) {

            return;

        }


        const username = $(
            "#edit-username"
        ).value.trim().toLowerCase();


        const displayName = $(
            "#edit-display-name"
        ).value.trim();


        const bio = $(
            "#edit-bio"
        ).value.trim();


        const avatarSymbol = $(
            "#edit-avatar-symbol"
        ).value;


        const avatarColor = $(
            "#edit-avatar-color"
        ).value;


        // VALIDATION

        if (!/^[a-z0-9_]{3,20}$/.test(username)) {

            showToast(
                "Format username tidak valid."
            );

            return;

        }


        if (
            displayName.length < 2 ||
            displayName.length > 28
        ) {

            showToast(
                "Display name harus 2–28 karakter."
            );

            return;

        }


        if (bio.length > 180) {

            showToast(
                "Bio terlalu panjang."
            );

            return;

        }


        setBusy(
            form,
            true,
            "SAVING..."
        );


        try {

            const {

                data,

                error

            } = await supabase

                .from("eok_profiles")

                .update({

                    username: username,

                    display_name: displayName,

                    bio: bio,

                    avatar_symbol: avatarSymbol,

                    avatar_color: avatarColor

                })

                .eq("id", currentUser.id)

                .select()

                .single();


            if (error) {

                console.error(error);

                showToast(
                    getFriendlyError(error)
                );

                return;

            }


            currentProfile = data;


            renderProfile();


            showToast(
                "Player profile successfully updated."
            );


        } catch (error) {

            console.error(error);

            showToast(
                "Gagal memperbarui profil."
            );

        } finally {

            setBusy(form, false);

        }

    }

);


// ==========================================
// CHANGE PASSWORD
// ==========================================

$("#change-password-form").addEventListener(

    "submit",

    async (event) => {

        event.preventDefault();

        const form = event.currentTarget;


        const password = $(
            "#new-password"
        ).value;


        const confirmation = $(
            "#confirm-password"
        ).value;


        if (password.length < 8) {

            showToast(
                "Password minimal 8 karakter."
            );

            return;

        }


        if (password !== confirmation) {

            showToast(
                "Konfirmasi password tidak cocok."
            );

            return;

        }


        setBusy(
            form,
            true,
            "UPDATING..."
        );


        try {

            const { error } =

                await supabase.auth.updateUser({

                    password: password

                });


            if (error) {

                console.error(error);

                showToast(
                    getFriendlyError(error)
                );

                return;

            }


            form.reset();


            showToast(
                "Password berhasil diperbarui."
            );


        } catch (error) {

            console.error(error);

            showToast(
                "Gagal memperbarui password."
            );

        } finally {

            setBusy(form, false);

        }

    }

);


// ==========================================
// LOGOUT
// ==========================================

$("#logout-button").addEventListener(

    "click",

    async () => {

        const { error } =
            await supabase.auth.signOut();


        if (error) {

            console.error(error);

            showToast(
                "Gagal logout."
            );

            return;

        }


        showAuth();

        switchAuthMode("login");

        showToast(
            "You have left the realm."
        );

    }

);


// ==========================================
// AUTH SESSION LISTENER
// ==========================================

supabase.auth.onAuthStateChange(

    (event, session) => {

        setTimeout(() => {

            if (session?.user) {

                loadDashboard(
                    session.user.id
                );

            }

            else if (
                event === "INITIAL_SESSION" ||
                event === "SIGNED_OUT"
            ) {

                showAuth();

            }

        }, 0);

    }

);


// ==========================================
// APPLICATION INITIALIZATION
// ==========================================

console.log(
    "EMPIRE OF KINGS: Phase 1 initialized."
);
