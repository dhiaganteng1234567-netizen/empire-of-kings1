/* ==========================================
   EMPIRE OF KINGS
   PLAYER PROFILE SYSTEM
   VERSION 0.0.1
========================================== */

(function () {

"use strict";


const client = window.EOK_CLIENT;

const $ = id => document.getElementById(id);


function openModal(id) {

    const modal = $(id);

    modal.classList.add("is-open");

    modal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

}


function closeModal(id) {

    const modal = $(id);

    modal.classList.remove("is-open");

    modal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";

}


document

    .querySelectorAll("[data-close-modal]")

    .forEach(button => {

        button.addEventListener("click", function () {

            closeModal(button.dataset.closeModal);

        });

    });


document.querySelectorAll(".modal-overlay").forEach(modal => {

    modal.addEventListener("click", function (event) {

        if (event.target === modal) {

            closeModal(modal.id);

        }

    });

});


document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        document.querySelectorAll(".modal-overlay.is-open")

            .forEach(modal => closeModal(modal.id));

    }

});


function formatDate(value) {

    if (!value) return "Not available";


    return new Intl.DateTimeFormat("id-ID", {

        day: "numeric",

        month: "long",

        year: "numeric"

    }).format(new Date(value));

}


function publicURL(path) {

    if (!path) return null;


    return client.storage

        .from("eok-avatars")

        .getPublicUrl(path)

        .data.publicUrl;

}


function setProfileAvatar(path, initial) {


    const img = $("profileAvatarImage");

    const fallback = $("profileAvatarFallback");


    fallback.textContent = initial;


    const url = publicURL(path);


    if (!url) {

        img.hidden = true;

        fallback.hidden = false;

        return;

    }


    img.onload = () => {

        img.hidden = false;

        fallback.hidden = true;

    };


    img.onerror = () => {

        img.hidden = true;

        fallback.hidden = false;

    };


    img.src = url;

}


function collectionItem(icon, title, description) {

    const item = document.createElement("div");

    item.className = "collection-item";


    const iconElement = document.createElement("span");

    iconElement.className = "collection-icon";

    iconElement.textContent = icon;


    const detail = document.createElement("div");


    const titleElement = document.createElement("strong");

    titleElement.textContent = title;


    const descriptionElement = document.createElement("small");

    descriptionElement.textContent = description;


    detail.appendChild(titleElement);

    detail.appendChild(descriptionElement);


    item.appendChild(iconElement);

    item.appendChild(detail);


    return item;

}


window.EOKOpenProfile = async function (userId) {


    if (!userId) return;


    openModal("profileModal");


    $("profileModalName").textContent = "Loading...";

    $("profileModalUsername").textContent = "";

    $("profileModalBadges").textContent = "Loading...";

    $("profileModalAchievements").textContent = "Loading...";


    try {


        const {data: profile, error} = await client

            .from("eok_profiles")

            .select("*")

            .eq("id", userId)

            .maybeSingle();


        if (error) throw error;


        if (!profile) {

            throw new Error("Player not found.");

        }


        const {data: character} = await client

            .from("eok_characters")

            .select("*")

            .eq("user_id", userId)

            .maybeSingle();


        const {data: badges} = await client

            .from("eok_player_badges")

            .select(

                "badge_code,awarded_at,eok_badges(label,description,icon,rarity)"

            )

            .eq("user_id", userId);


        const {data: achievements} = await client

            .from("eok_player_achievements")

            .select(

                "achievement_code,progress,unlocked_at,eok_achievements(label,description,icon)"

            )

            .eq("user_id", userId);


        const name = profile.display_name || profile.username;

        const initial = Array.from(name)[0]?.toUpperCase() || "E";


        $("profileModalName").textContent = name;

        $("profileModalUsername").textContent = "@" + profile.username;

        $("profileModalId").textContent = profile.player_id;


        $("profileModalBio").textContent =

            profile.bio || "This player has not written a biography yet.";


        $("profileModalLevel").textContent = character?.level ?? 1;

        $("profileModalXP").textContent = character?.experience ?? 0;

        $("profileModalReputation").textContent = character?.reputation ?? 0;


        $("profileModalOccupation").textContent =

            character?.occupation || "Unemployed";


        $("profileModalSocialStatus").textContent =

            character?.social_status || "Commoner";


        $("profileModalTitle").textContent =

            character?.title || "Wanderer";


        $("profileModalLocation").textContent =

            character?.location_name || "Unassigned";


        $("profileModalCreated").textContent =

            formatDate(profile.created_at);


        $("profileModalCountry").innerHTML =

            window.EOKFlagHTML(profile.country_code, "eok-flag")

            + " " +

            window.EOKCountryName(profile.country_code);


        setProfileAvatar(profile.avatar_path, initial);


        // BADGES

        $("profileModalBadges").innerHTML = "";


        if (!badges?.length) {

            $("profileModalBadges").textContent = "No badges earned.";

        }


        badges?.forEach(item => {

            const badge = item.eok_badges;

            if (!badge) return;


            $("profileModalBadges").appendChild(

                collectionItem(

                    badge.icon,

                    badge.label,

                    badge.description + " • " + badge.rarity

                )

            );

        });


        // ACHIEVEMENTS

        $("profileModalAchievements").innerHTML = "";


        if (!achievements?.length) {

            $("profileModalAchievements").textContent =

                "No achievements unlocked.";

        }


        achievements?.forEach(item => {

            const achievement = item.eok_achievements;

            if (!achievement) return;


            $("profileModalAchievements").appendChild(

                collectionItem(

                    achievement.icon,

                    achievement.label,

                    achievement.description

                )

            );

        });


        window.EOK_CURRENT_VIEWED_PROFILE = profile;


        const ownId = window.EOK_STATE.user.id;

        const messageButton = $("profileMessageButton");

        const blockButton = $("profileBlockButton");


        messageButton.hidden = userId === ownId;

        blockButton.hidden = userId === ownId;


        if (userId !== ownId) {


            const {data: mine} = await client

                .from("eok_user_blocks")

                .select("id")

                .eq("blocker_id", ownId)

                .eq("blocked_id", userId)

                .maybeSingle();


            const {data: theirs} = await client

                .from("eok_user_blocks")

                .select("id")

                .eq("blocker_id", userId)

                .eq("blocked_id", ownId)

                .maybeSingle();


            blockButton.textContent = mine

                ? "⊘ UNBLOCK PLAYER"

                : theirs

                    ? "BLOCKED YOU"

                    : "⊘ BLOCK PLAYER";


            blockButton.disabled = Boolean(theirs && !mine);


            messageButton.disabled = Boolean(mine || theirs);


        }


    } catch (error) {


        console.error("Profile loading error:", error);

        $("profileModalName").textContent = "Unable to load profile.";

    }

};


// ======================================
// PROFILE MESSAGE BUTTON
// ======================================

$("profileMessageButton").addEventListener("click", async function () {

    const profile = window.EOK_CURRENT_VIEWED_PROFILE;

    if (!profile) return;


    closeModal("profileModal");


    if (window.EOKOpenDirectChat) {

        await window.EOKOpenDirectChat(profile.id);

    }

});


// ======================================
// BLOCK / UNBLOCK PLAYER
// ======================================

$("profileBlockButton").addEventListener("click", async function () {


    const target = window.EOK_CURRENT_VIEWED_PROFILE;

    if (!target) return;


    const ownId = window.EOK_STATE.user.id;


    this.disabled = true;


    try {


        const {data: existing, error} = await client

            .from("eok_user_blocks")

            .select("id")

            .eq("blocker_id", ownId)

            .eq("blocked_id", target.id)

            .maybeSingle();


        if (error) throw error;


        if (existing) {


            const {error: deleteError} = await client

                .from("eok_user_blocks")

                .delete()

                .eq("blocker_id", ownId)

                .eq("blocked_id", target.id);


            if (deleteError) throw deleteError;


        } else {


            const {error: insertError} = await client

                .from("eok_user_blocks")

                .insert({

                    blocker_id: ownId,

                    blocked_id: target.id

                });


            if (insertError && insertError.code !== "23505") {

                throw insertError;

            }

        }


        await window.EOKOpenProfile(target.id);


        if (window.EOKRefreshInbox) {

            window.EOKRefreshInbox();

        }


    } catch (error) {


        console.error(error);

        alert("Unable to update block status.");

    } finally {

        this.disabled = false;

    }

});


// ======================================
// OPEN SETTINGS
// ======================================

window.EOKOpenSettings = async function () {


    const profile = window.EOK_STATE.profile;


    if (!profile) return;


    $("settingsDisplayName").value = profile.display_name || "";

    $("settingsUsername").value = profile.username || "";

    $("settingsBio").value = profile.bio || "";

    $("settingsLanguage").value =

        profile.preferred_language || "id";


    window.EOKPopulateCountrySelect(

        $("settingsCountry"),

        profile.country_code || ""

    );


    window.EOKPopulateCountrySelect(

        $("settingsRegion"),

        profile.chat_region || ""

    );


    const url = publicURL(profile.avatar_path);


    if (url) {

        $("settingsAvatarPreview").src = url;

        $("settingsAvatarPreview").hidden = false;

        $("settingsAvatarFallback").hidden = true;

    } else {

        $("settingsAvatarPreview").hidden = true;

        $("settingsAvatarFallback").hidden = false;

    }


    $("settingsAvatarFallback").textContent =

        Array.from(profile.display_name || profile.username)[0]


            ?.toUpperCase() || "E";


    await loadBlockedPlayers();


    openModal("settingsModal");

};


// ======================================
// AVATAR PREVIEW
// ======================================

$("profileAvatarFile").addEventListener("change", function () {


    const file = this.files[0];

    if (!file) return;


    if (file.size > 2 * 1024 * 1024) {

        alert("Maximum avatar size is 2 MB.");

        this.value = "";

        return;

    }


    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) {

        alert("Only JPG, PNG, or WebP images are accepted.");

        this.value = "";

        return;

    }


    const url = URL.createObjectURL(file);


    $("settingsAvatarPreview").src = url;

    $("settingsAvatarPreview").hidden = false;

    $("settingsAvatarFallback").hidden = true;

});


// ======================================
// SAVE SETTINGS
// ======================================

$("settingsForm").addEventListener("submit", async function (event) {


    event.preventDefault();


    const button = this.querySelector('button[type="submit"]');

    const output = $("settingsMessage");


    const username = $("settingsUsername").value.trim().toLowerCase();

    const displayName = $("settingsDisplayName").value.trim();

    const bio = $("settingsBio").value.trim();

    const country = $("settingsCountry").value;

    const region = $("settingsRegion").value;

    const language = $("settingsLanguage").value;


    if (!/^[a-z0-9_]{3,20}$/.test(username)) {

        output.textContent = "Invalid username format.";

        output.className = "form-message show error";

        return;

    }


    if (!country || !region) {

        output.textContent = "Choose citizenship and chat region.";

        output.className = "form-message show error";

        return;

    }


    button.disabled = true;

    button.textContent = "SAVING...";


    try {


        let newAvatarPath = null;


        const file = $("profileAvatarFile").files[0];


        if (file) {


            const ext =

                file.type === "image/png"

                    ? "png"

                    : file.type === "image/webp"

                        ? "webp"

                        : "jpg";


            const path =

                window.EOK_STATE.user.id +

                "/avatar-" +

                Date.now() +

                "." +

                ext;


            const {error: uploadError} = await client.storage

                .from("eok-avatars")

                .upload(path, file, {

                    contentType: file.type,

                    cacheControl: "3600",

                    upsert: false

                });


            if (uploadError) throw uploadError;


            newAvatarPath = path;

        }


        const {data, error} = await client.rpc(

            "eok_update_my_profile",

            {

                p_username: username,

                p_display_name: displayName,

                p_bio: bio,

                p_country_code: country,

                p_chat_region: region,

                p_preferred_language: language,

                p_avatar_path: newAvatarPath

            }

        );


        if (error) throw error;


        output.textContent = "Profile successfully updated.";

        output.className = "form-message show success";


        closeModal("settingsModal");


        await window.EOKRefreshDashboard();


        window.EOKApplyLanguage(language);


    } catch (error) {


        console.error(error);


        output.textContent =

            error.message || "Unable to update profile.";


        output.className = "form-message show error";


    } finally {


        button.disabled = false;

        button.textContent = "SAVE CHANGES →";

    }

});


// ======================================
// BLOCKED PLAYER LIST
// ======================================

async function loadBlockedPlayers() {


    const userId = window.EOK_STATE.user.id;

    const container = $("blockedPlayersList");


    const {data: blocks, error} = await client

        .from("eok_user_blocks")

        .select("blocked_id")

        .eq("blocker_id", userId);


    if (error) {

        container.textContent = "Unable to load blocked players.";

        return;

    }


    container.innerHTML = "";


    if (!blocks?.length) {

        container.textContent = "No blocked players.";

        return;

    }


    for (const block of blocks) {


        const {data: profile} = await client

            .from("eok_profiles")

            .select("id,username,display_name")

            .eq("id", block.blocked_id)

            .maybeSingle();


        if (!profile) continue;


        const row = document.createElement("div");

        row.className = "blocked-player-row";


        const info = document.createElement("div");

        info.className = "blocked-player-info";


        const name = document.createElement("strong");

        name.textContent = profile.display_name;


        const username = document.createElement("small");

        username.textContent = "@" + profile.username;


        info.append(name,username);


        const button = document.createElement("button");

        button.className = "mini-action";

        button.textContent = "UNBLOCK";


        button.addEventListener("click", async function () {


            const {error} = await client

                .from("eok_user_blocks")

                .delete()

                .eq("blocker_id", userId)

                .eq("blocked_id", profile.id);


            if (!error) {

                await loadBlockedPlayers();

            }

        });


        row.append(info,button);

        container.appendChild(row);

    }

}


// ======================================
// INITIALIZATION
// ======================================

window.EOKProfileInit = function () {

    $("profileAvatarFile").value = "";

};

})();
