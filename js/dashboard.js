/* ==========================================
   EMPIRE OF KINGS
   DASHBOARD CORE
   VERSION 0.0.1
========================================== */

(function () {

"use strict";


const client = window.EOK_CLIENT;


if (!client) {

    window.location.replace("login.html");

    return;

}


const $ = id => document.getElementById(id);


window.EOK_STATE = {

    user: null,

    profile: null,

    character: null,

    badges: [],

    achievements: []

};


function dateFormat(value) {

    if (!value) return "Not available";


    const date = new Date(value);


    return new Intl.DateTimeFormat("id-ID", {

        day: "numeric",

        month: "long",

        year: "numeric"

    }).format(date);

}


function avatarURL(path) {

    if (!path) return null;


    return client.storage

        .from("eok-avatars")

        .getPublicUrl(path)

        .data.publicUrl;

}


function setAvatar(image, fallback, path, initial) {

    const url = avatarURL(path);


    fallback.textContent = initial || "E";


    if (!url) {

        image.hidden = true;

        fallback.hidden = false;

        return;

    }


    image.onload = function () {

        image.hidden = false;

        fallback.hidden = true;

    };


    image.onerror = function () {

        image.hidden = true;

        fallback.hidden = false;

    };


    image.src = url;

}


function setFlag(element, countryCode) {

    if (!element) return;


    if (!countryCode) {

        element.textContent = "🌐 Citizenship not selected";

        return;

    }


    element.innerHTML =

        window.EOKFlagHTML(countryCode, "eok-flag")

        + " " +

        window.EOKCountryName(countryCode);

}


async function loadDashboard() {


    const {

        data: userData,

        error: userError

    } = await client.auth.getUser();


    if (userError || !userData.user) {

        window.location.replace("login.html");

        return;

    }


    const user = userData.user;


    const {

        data: profile,

        error: profileError

    } = await client

        .from("eok_profiles")

        .select("*")

        .eq("id", user.id)

        .maybeSingle();


    if (profileError) {

        console.error(profileError);

        alert("Unable to load player profile.");

        return;

    }


    if (!profile) {

        alert("Player profile is not available. Check the account database.");

        return;

    }


    const {

        data: character,

        error: characterError

    } = await client

        .from("eok_characters")

        .select("*")

        .eq("user_id", user.id)

        .maybeSingle();


    if (characterError) {

        console.error(characterError);

    }


    const {

        data: badges,

        error: badgeError

    } = await client

        .from("eok_player_badges")

        .select(

            "badge_code, awarded_at, eok_badges(label,description,icon,rarity)"

        )

        .eq("user_id", user.id)

        .order("awarded_at", {ascending:true});


    const {

        data: achievements,

        error: achievementError

    } = await client

        .from("eok_player_achievements")

        .select(

            "achievement_code, progress, unlocked_at, eok_achievements(label,description,icon)"

        )

        .eq("user_id", user.id);


    if (badgeError) console.error(badgeError);

    if (achievementError) console.error(achievementError);


    window.EOK_STATE = {

        user,

        profile,

        character,

        badges: badges || [],

        achievements: achievements || []

    };


    renderDashboard();


    if (window.EOKApplyLanguage) {

        window.EOKApplyLanguage(

            profile.preferred_language || "id"

        );

    }


    if (window.EOKProfileInit) {

        window.EOKProfileInit();

    }


    if (window.EOKChatInit) {

        window.EOKChatInit();

    }

}


function renderDashboard() {


    const state = window.EOK_STATE;

    const profile = state.profile;

    const character = state.character || {};


    const name = profile.display_name || profile.username;


    $("greetingName").textContent = name;

    $("playerDisplayName").textContent = name;

    $("playerUsername").textContent = "@" + profile.username;

    $("playerId").textContent = profile.player_id;


    $("todayDate").textContent = dateFormat(new Date());


    $("playerLevel").textContent = character.level || 1;

    $("playerXP").textContent = character.experience || 0;

    $("playerReputation").textContent = character.reputation || 0;

    $("playerBadgeCount").textContent = state.badges.length;


    const initial = Array.from(name)[0]?.toUpperCase() || "E";


    setAvatar(

        $("ownAvatar"),

        $("ownAvatarFallback"),

        profile.avatar_path,

        initial

    );


    setAvatar(

        document.createElement("img"),

        $("quickAvatar"),

        profile.avatar_path,

        initial

    );


    const quickAvatar = $("quickAvatar");

    quickAvatar.innerHTML = "";

    const quickImageURL = avatarURL(profile.avatar_path);


    if (quickImageURL) {

        const img = document.createElement("img");

        img.src = quickImageURL;

        img.alt = "Profile picture";

        img.onerror = function () {

            quickAvatar.textContent = initial;

        };

        quickAvatar.appendChild(img);

    } else {

        quickAvatar.textContent = initial;

    }


    $("quickDisplayName").textContent = name;

    $("quickUsername").textContent = "@" + profile.username;


    setFlag($("playerCountry"), profile.country_code);

    setFlag($("quickCountry"), profile.country_code);


    $("citizenshipNotice").hidden =

        Boolean(profile.country_code);


    $("quickBadgeList").innerHTML = "";

    $("quickAchievementList").innerHTML = "";


    if (state.badges.length === 0) {

        $("quickBadgeList").textContent = "No badges yet.";

    }


    state.badges.slice(0, 3).forEach(item => {

        const badge = item.eok_badges;

        if (!badge) return;


        const row = document.createElement("div");

        row.className = "quick-badge";


        row.innerHTML = `

            <span class="quick-badge-icon">

                ${badge.icon}

            </span>

            <div>

                <strong>${badge.label}</strong>

                <small>${badge.rarity}</small>

            </div>

        `;


        $("quickBadgeList").appendChild(row);

    });


    if (!state.achievements.length) {

        $("quickAchievementList").textContent =

            "No achievements yet.";

    }


    state.achievements.slice(0, 3).forEach(item => {

        const achievement = item.eok_achievements;

        if (!achievement) return;


        const row = document.createElement("div");

        row.className = "quick-badge";


        row.innerHTML = `

            <span class="quick-badge-icon">

                ${achievement.icon}

            </span>

            <div>

                <strong>${achievement.label}</strong>

                <small>UNLOCKED</small>

            </div>

        `;


        $("quickAchievementList").appendChild(row);

    });

}


window.EOKRefreshDashboard = loadDashboard;


document.addEventListener("DOMContentLoaded", async function () {


    try {

        await loadDashboard();

    } catch (error) {

        console.error(error);

    }


    $("logoutButton").addEventListener("click", async function () {


        this.disabled = true;


        const {error} = await client.auth.signOut();


        if (error) {

            this.disabled = false;

            alert("Unable to sign out.");

            return;

        }


        window.location.replace("index.html");

    });


    $("viewProfileButton").addEventListener("click", function () {

        window.EOKOpenProfile(window.EOK_STATE.user.id);

    });


    $("quickProfileButton").addEventListener("click", function () {

        window.EOKOpenProfile(window.EOK_STATE.user.id);

    });


    $("sidebarProfileButton").addEventListener("click", function () {

        window.EOKOpenProfile(window.EOK_STATE.user.id);

    });


    $("ownAvatarButton").addEventListener("click", function () {

        window.EOKOpenSettings();

    });


    $("editProfileButton").addEventListener("click", function () {

        window.EOKOpenSettings();

    });


    $("settingsIconButton").addEventListener("click", function () {

        window.EOKOpenSettings();

    });


    $("sidebarSettingsButton").addEventListener("click", function () {

        window.EOKOpenSettings();

    });


    $("chooseCitizenshipButton").addEventListener("click", function () {

        window.EOKOpenSettings();

    });


    $("chatIconButton").addEventListener("click", function () {

        window.EOKOpenInbox();

    });


});
})();
