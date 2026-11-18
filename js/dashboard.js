// ==========================================
// EMPIRE OF KINGS
// ADVANCED DASHBOARD SYSTEM
// VERSION 0.30
// ==========================================


(async function () {


    "use strict";


    // ======================================
    // SUPABASE
    // ======================================

    const supabase = window.EOK?.supabase;


    if (!supabase) {

        alert("Supabase connection failed.");

        window.location.replace("login.html");

        return;

    }


    const AVATAR_BUCKET = "eok-avatars";

    const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

    const CHAT_LIMIT = 50;


    let currentUser = null;

    let currentProfile = null;

    let currentStatistics = null;

    let chatChannel = null;

    let notificationChannel = null;

    let lastMessageTime = 0;



    // ======================================
    // DOM ELEMENTS
    // ======================================

    const el = {

        topName: document.getElementById(
            "top-user-name"
        ),

        topAvatar: document.getElementById(
            "top-avatar"
        ),

        headerProfile: document.getElementById(
            "header-profile-button"
        ),

        logout: document.getElementById(
            "logout-button"
        ),

        heroId: document.getElementById(
            "hero-player-id"
        ),

        level: document.getElementById(
            "player-level"
        ),

        xp: document.getElementById(
            "player-xp"
        ),

        gold: document.getElementById(
            "player-gold"
        ),

        badgeCount: document.getElementById(
            "player-badge-count"
        ),

        editorAvatar: document.getElementById(
            "editor-avatar"
        ),

        editorUsername: document.getElementById(
            "editor-username"
        ),

        editorTitle: document.getElementById(
            "editor-player-title"
        ),

        avatarInput: document.getElementById(
            "avatar-input"
        ),

        avatarStatus: document.getElementById(
            "avatar-status"
        ),

        profileForm: document.getElementById(
            "profile-form"
        ),

        displayNameInput: document.getElementById(
            "display-name"
        ),

        titleInput: document.getElementById(
            "profile-title"
        ),

        mottoInput: document.getElementById(
            "motto"
        ),

        bioInput: document.getElementById(
            "bio"
        ),

        profileMessage: document.getElementById(
            "profile-message"
        ),

        chatStatus: document.getElementById(
            "chat-status"
        ),

        chatMessages: document.getElementById(
            "chat-messages"
        ),

        chatForm: document.getElementById(
            "chat-form"
        ),

        chatInput: document.getElementById(
            "chat-input"
        ),

        chatSend: document.getElementById(
            "chat-send"
        ),

        notificationList: document.getElementById(
            "notification-list"
        ),

        notificationCount: document.getElementById(
            "notification-count"
        ),

        accountUsername: document.getElementById(
            "account-username"
        ),

        accountEmail: document.getElementById(
            "account-email"
        ),

        accountRole: document.getElementById(
            "account-role"
        ),

        accountCreated: document.getElementById(
            "account-created"
        ),

        accountMessages: document.getElementById(
            "account-messages"
        ),

        accountViewProfile: document.getElementById(
            "account-view-profile"
        ),

        editProfileView: document.getElementById(
            "edit-profile-view-button"
        ),

        modal: document.getElementById(
            "profile-modal"
        ),

        modalBackdrop: document.getElementById(
            "modal-backdrop"
        ),

        modalClose: document.getElementById(
            "modal-close"
        ),

        modalAvatar: document.getElementById(
            "modal-avatar"
        ),

        modalName: document.getElementById(
            "modal-display-name"
        ),

        modalUsername: document.getElementById(
            "modal-username"
        ),

        modalStatus: document.getElementById(
            "modal-status"
        ),

        modalTitle: document.getElementById(
            "modal-title"
        ),

        modalMotto: document.getElementById(
            "modal-motto"
        ),

        modalBio: document.getElementById(
            "modal-bio"
        ),

        modalPlayerId: document.getElementById(
            "modal-player-id"
        ),

        modalCreated: document.getElementById(
            "modal-created"
        ),

        modalRole: document.getElementById(
            "modal-role"
        ),

        modalLevel: document.getElementById(
            "modal-level"
        ),

        modalXP: document.getElementById(
            "modal-xp"
        ),

        modalGold: document.getElementById(
            "modal-gold"
        ),

        modalMessages: document.getElementById(
            "modal-messages"
        ),

        modalBadgeCount: document.getElementById(
            "modal-badge-count"
        ),

        modalAchievementCount: document.getElementById(
            "modal-achievement-count"
        ),

        modalBadges: document.getElementById(
            "modal-badges"
        ),

        modalAchievements: document.getElementById(
            "modal-achievements"
        )

    };



    // ======================================
    // HELPERS
    // ======================================

    function formatNumber(value) {

        return Number(value || 0).toLocaleString(
            "id-ID"
        );

    }


    function formatDate(value) {

        if (!value) return "-";

        return new Intl.DateTimeFormat(

            "id-ID",

            {

                dateStyle: "medium"

            }

        ).format(new Date(value));

    }


    function formatDateTime(value) {

        if (!value) return "-";

        return new Intl.DateTimeFormat(

            "id-ID",

            {

                dateStyle: "short",

                timeStyle: "short"

            }

        ).format(new Date(value));

    }


    function setText(element, value) {

        if (!element) return;

        element.textContent =
            value == null ? "" : String(value);

    }


    function showProfileMessage(message, success = true) {

        setText(
            el.profileMessage,
            message
        );

        el.profileMessage.style.color =
            success ? "#77d6a0" : "#df7d7d";

    }



    // ======================================
    // AUTHENTICATION
    // ======================================

    async function authenticate() {

        const { data, error } =
            await supabase.auth.getUser();


        if (error || !data.user) {

            window.location.replace("login.html");

            return null;

        }


        return data.user;

    }



    // ======================================
    // AVATAR HELPERS
    // ======================================

    function getAvatarURL(path) {

        if (!path) return null;


        if (
            typeof path === "string" &&
            /^https?:\/\//i.test(path)
        ) {

            return path;

        }


        const { data } =
            supabase.storage
                .from(AVATAR_BUCKET)
                .getPublicUrl(path);


        return data?.publicUrl || null;

    }



    function setAvatar(container, path, fallback = "♟") {

        if (!container) return;


        container.replaceChildren();


        const fallbackElement =
            document.createElement("span");

        fallbackElement.textContent = fallback;

        container.appendChild(fallbackElement);


        const url = getAvatarURL(path);

        if (!url) return;


        const image =
            document.createElement("img");

        image.src = url;

        image.alt = "Player avatar";

        image.loading = "lazy";


        image.onerror = function () {

            image.remove();

        };


        container.appendChild(image);

    }



    // ======================================
    // LOAD OWN PROFILE
    // ======================================

    async function loadOwnProfile() {


        const { data, error } =
            await supabase

                .from("profiles")

                .select(`

                    id,

                    player_id,

                    username,

                    display_name,

                    avatar_url,

                    profile_title,

                    motto,

                    bio,

                    level,

                    experience,

                    gold,

                    account_role,

                    created_at,

                    last_seen_at

                `)

                .eq("id", currentUser.id)

                .single();


        if (error) {

            console.error(
                "Profile loading failed:",
                error
            );

            throw new Error(
                "Player profile was not found."
            );

        }


        currentProfile = data;


        const { data: statistics, error: statsError } =
            await supabase

                .from("player_statistics")

                .select("total_messages")

                .eq("user_id", currentUser.id)

                .maybeSingle();


        if (statsError) {

            console.error(statsError);

        }


        currentStatistics = statistics || {
            total_messages: 0
        };


        // TOP BAR

        setText(
            el.topName,
            data.display_name
        );


        setAvatar(
            el.topAvatar,
            data.avatar_url
        );


        // HERO

        setText(
            el.heroId,
            data.player_id
        );


        // STATS

        setText(
            el.level,
            formatNumber(data.level)
        );


        setText(
            el.xp,
            formatNumber(data.experience)
        );


        setText(
            el.gold,
            formatNumber(data.gold)
        );


        setText(
            el.accountMessages,
            formatNumber(
                currentStatistics.total_messages
            )
        );


        // EDITOR

        setAvatar(
            el.editorAvatar,
            data.avatar_url
        );


        setText(
            el.editorUsername,
            "@" + data.username
        );


        setText(
            el.editorTitle,
            data.profile_title || "Wanderer"
        );


        el.displayNameInput.value =
            data.display_name || "";


        el.titleInput.value =
            data.profile_title || "Wanderer";


        el.mottoInput.value =
            data.motto || "";


        el.bioInput.value =
            data.bio || "";


        // ACCOUNT INFORMATION

        setText(
            el.accountUsername,
            "@" + data.username
        );


        setText(
            el.accountEmail,
            currentUser.email || "-"
        );


        setText(
            el.accountRole,
            String(data.account_role || "player").toUpperCase()
        );


        setText(
            el.accountCreated,
            formatDate(data.created_at)
        );


    }



    // ======================================
    // LOAD BADGES
    // ======================================

    async function getPlayerBadges(userId) {


        const { data: awarded, error } =
            await supabase

                .from("player_badges")

                .select("badge_id, awarded_at")

                .eq("user_id", userId)

                .order(
                    "awarded_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(error);

            return [];

        }


        if (!awarded || awarded.length === 0) {

            return [];

        }


        const badgeIds =
            awarded.map(item => item.badge_id);


        const { data: badges, error: badgeError } =
            await supabase

                .from("badges")

                .select("id, name, description, icon, rarity")

                .in("id", badgeIds);


        if (badgeError) {

            console.error(badgeError);

            return [];

        }


        const badgeMap = new Map(

            (badges || []).map(
                badge => [badge.id, badge]
            )

        );


        return awarded

            .map(item => ({

                ...badgeMap.get(item.badge_id),

                awarded_at: item.awarded_at

            }))

            .filter(item => item.id);

    }



    // ======================================
    // LOAD ACHIEVEMENTS
    // ======================================

    async function getPlayerAchievements(userId) {


        const { data: unlocked, error } =
            await supabase

                .from("player_achievements")

                .select("achievement_id, unlocked_at")

                .eq("user_id", userId)

                .order(
                    "unlocked_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(error);

            return [];

        }


        if (!unlocked || unlocked.length === 0) {

            return [];

        }


        const achievementIds =
            unlocked.map(item => item.achievement_id);


        const { data: achievements, error: achievementError } =
            await supabase

                .from("achievements")

                .select("id, name, description, icon, points")

                .in("id", achievementIds);


        if (achievementError) {

            console.error(achievementError);

            return [];

        }


        const achievementMap = new Map(

            (achievements || []).map(
                item => [item.id, item]
            )

        );


        return unlocked

            .map(item => ({

                ...achievementMap.get(item.achievement_id),

                unlocked_at: item.unlocked_at

            }))

            .filter(item => item.id);

    }



    // ======================================
    // PROFILE ONLINE STATUS
    // ======================================

    function isOnline(lastSeen) {

        if (!lastSeen) return false;


        const difference =
            Date.now() - new Date(lastSeen).getTime();


        return difference <= 120000;

    }



    // ======================================
    // CREATE AWARD CARD
    // ======================================

    function createAwardCard(item, kind) {


        const card =
            document.createElement("article");

        card.className = "award-card";


        const icon =
            document.createElement("div");

        icon.className = "award-icon";

        icon.textContent =
            item.icon || "✦";


        const info =
            document.createElement("div");

        info.className = "award-info";


        const name =
            document.createElement("strong");

        name.textContent =
            item.name || "Unknown";


        const description =
            document.createElement("p");

        description.textContent =
            item.description || "";


        const extra =
            document.createElement("small");


        if (kind === "badge") {

            extra.textContent =
                String(item.rarity || "common").toUpperCase();

        } else {

            extra.textContent =
                formatNumber(item.points) + " points";

        }


        info.appendChild(name);

        info.appendChild(description);

        info.appendChild(extra);


        card.appendChild(icon);

        card.appendChild(info);


        return card;

    }



    function renderAwards(container, items, kind) {


        container.replaceChildren();


        if (!items || items.length === 0) {

            const empty =
                document.createElement("div");

            empty.className = "empty-awards";

            empty.textContent =
                kind === "badge"
                    ? "This player has no badges yet."
                    : "No achievements unlocked yet.";


            container.appendChild(empty);

            return;

        }


        items.forEach(item => {

            container.appendChild(
                createAwardCard(item, kind)
            );

        });

    }



    // ======================================
    // OPEN PLAYER PROFILE
    // ======================================

    async function openPlayerProfile(userId) {


        if (!userId) return;


        el.modal.hidden = false;

        document.body.style.overflow = "hidden";


        setText(
            el.modalName,
            "Loading profile..."
        );


        el.modalBadges.replaceChildren();

        el.modalAchievements.replaceChildren();


        try {


            const [

                profileResult,

                statsResult,

                badges,

                achievements

            ] = await Promise.all([


                supabase

                    .from("profiles")

                    .select(`

                        id,

                        player_id,

                        username,

                        display_name,

                        avatar_url,

                        profile_title,

                        motto,

                        bio,

                        level,

                        experience,

                        gold,

                        account_role,

                        created_at,

                        last_seen_at

                    `)

                    .eq("id", userId)

                    .single(),


                supabase

                    .from("player_statistics")

                    .select("total_messages")

                    .eq("user_id", userId)

                    .maybeSingle(),


                getPlayerBadges(userId),


                getPlayerAchievements(userId)


            ]);


            if (profileResult.error) {

                throw profileResult.error;

            }


            const profile =
                profileResult.data;


            const statistics =
                statsResult.data || {
                    total_messages: 0
                };


            // BASIC INFORMATION

            setAvatar(
                el.modalAvatar,
                profile.avatar_url
            );


            setText(
                el.modalName,
                profile.display_name
            );


            setText(
                el.modalUsername,
                "@" + profile.username
            );


            setText(
                el.modalTitle,
                profile.profile_title || "Wanderer"
            );


            setText(
                el.modalMotto,
                profile.motto
                    ? '"' + profile.motto + '"'
                    : ""
            );


            setText(
                el.modalBio,
                profile.bio || "No biography."
            );


            setText(
                el.modalPlayerId,
                profile.player_id
            );


            setText(
                el.modalCreated,
                formatDate(profile.created_at)
            );


            setText(
                el.modalRole,
                String(profile.account_role || "player").toUpperCase()
            );


            // ONLINE STATUS

            const online =
                isOnline(profile.last_seen_at);


            setText(
                el.modalStatus,
                online ? "● Online" : "● Offline"
            );


            el.modalStatus.classList.toggle(
                "online",
                online
            );


            // STATISTICS

            setText(
                el.modalLevel,
                formatNumber(profile.level)
            );


            setText(
                el.modalXP,
                formatNumber(profile.experience)
            );


            setText(
                el.modalGold,
                formatNumber(profile.gold)
            );


            setText(
                el.modalMessages,
                formatNumber(statistics.total_messages)
            );


            setText(
                el.modalBadgeCount,
                formatNumber(badges.length)
            );


            setText(
                el.modalAchievementCount,
                formatNumber(achievements.length)
            );


            // AWARDS

            renderAwards(
                el.modalBadges,
                badges,
                "badge"
            );


            renderAwards(
                el.modalAchievements,
                achievements,
                "achievement"
            );


            // UPDATE OWN DASHBOARD BADGE COUNT

            if (userId === currentUser.id) {

                setText(
                    el.badgeCount,
                    badges.length
                );

            }


        } catch (error) {

            console.error(
                "Profile display error:",
                error
            );


            setText(
                el.modalName,
                "Profile unavailable"
            );


            setText(
                el.modalBio,
                "Could not load this player profile."
            );

        }

    }



    // ======================================
    // CLOSE PROFILE MODAL
    // ======================================

    function closeProfileModal() {

        el.modal.hidden = true;

        document.body.style.overflow = "";

    }


    el.modalClose.addEventListener(
        "click",
        closeProfileModal
    );


    el.modalBackdrop.addEventListener(
        "click",
        closeProfileModal
    );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                !el.modal.hidden
            ) {

                closeProfileModal();

            }

        }
    );



    // ======================================
    // PROFILE BUTTONS
    // ======================================

    el.headerProfile.addEventListener(
        "click",
        function () {

            openPlayerProfile(currentUser.id);

        }
    );


    el.accountViewProfile.addEventListener(
        "click",
        function () {

            openPlayerProfile(currentUser.id);

        }
    );


    el.editProfileView.addEventListener(
        "click",
        function () {

            openPlayerProfile(currentUser.id);

        }
    );



    // ======================================
    // SAVE PROFILE
    // ======================================

    el.profileForm.addEventListener(
        "submit",
        async function (event) {


            event.preventDefault();


            const displayName =
                el.displayNameInput.value.trim();


            const profileTitle =
                el.titleInput.value.trim() || "Wanderer";


            const motto =
                el.mottoInput.value.trim();


            const bio =
                el.bioInput.value.trim();


            if (
                displayName.length < 1 ||
                displayName.length > 30
            ) {

                showProfileMessage(
                    "Display name must contain 1–30 characters.",
                    false
                );

                return;

            }


            if (profileTitle.length > 30) {

                showProfileMessage(
                    "Profile title maximum is 30 characters.",
                    false
                );

                return;

            }


            if (motto.length > 80) {

                showProfileMessage(
                    "Motto maximum is 80 characters.",
                    false
                );

                return;

            }


            if (bio.length > 250) {

                showProfileMessage(
                    "Biography maximum is 250 characters.",
                    false
                );

                return;

            }


            showProfileMessage("Saving profile...");


            const { data, error } =
                await supabase

                    .from("profiles")

                    .update({

                        display_name: displayName,

                        profile_title: profileTitle,

                        motto: motto,

                        bio: bio

                    })

                    .eq("id", currentUser.id)

                    .select(`

                        display_name,

                        profile_title,

                        motto,

                        bio

                    `)

                    .single();


            if (error) {

                console.error(error);

                showProfileMessage(
                    "Could not save profile.",
                    false
                );

                return;

            }


            currentProfile = {

                ...currentProfile,

                ...data

            };


            setText(
                el.topName,
                data.display_name
            );


            setText(
                el.editorTitle,
                data.profile_title
            );


            setText(
                el.editorUsername,
                "@" + currentProfile.username
            );


            showProfileMessage(
                "Profile successfully updated."
            );


        }

    );



    // ======================================
    // AVATAR UPLOAD
    // ======================================

    el.avatarInput.addEventListener(
        "change",
        async function () {


            const file =
                this.files?.[0];


            if (!file) return;


            // CHECK TYPE

            const allowedTypes = [

                "image/jpeg",

                "image/png",

                "image/webp"

            ];


            if (!allowedTypes.includes(file.type)) {

                setText(
                    el.avatarStatus,
                    "Only JPG, PNG, and WebP are supported."
                );

                this.value = "";

                return;

            }


            // CHECK SIZE

            if (file.size > MAX_AVATAR_SIZE) {

                setText(
                    el.avatarStatus,
                    "Image exceeds the 2 MB limit."
                );

                this.value = "";

                return;

            }


            setText(
                el.avatarStatus,
                "Uploading profile photo..."
            );


            const extensionMap = {

                "image/jpeg": "jpg",

                "image/png": "png",

                "image/webp": "webp"

            };


            const extension =
                extensionMap[file.type];


            const randomId =
                window.crypto?.randomUUID
                    ? window.crypto.randomUUID()
                    : Math.random().toString(36).slice(2);


            const filePath =

                currentUser.id +

                "/" +

                Date.now() +

                "-" +

                randomId +

                "." +

                extension;


            let uploadedPath = null;


            try {


                // UPLOAD

                const { data: uploaded, error: uploadError } =

                    await supabase

                        .storage

                        .from(AVATAR_BUCKET)

                        .upload(

                            filePath,

                            file,

                            {

                                cacheControl: "3600",

                                contentType: file.type,

                                upsert: false

                            }

                        );


                if (uploadError) {

                    throw uploadError;

                }


                uploadedPath = uploaded.path;


                // UPDATE PROFILE

                const oldAvatar =
                    currentProfile.avatar_url;


                const { error: updateError } =

                    await supabase

                        .from("profiles")

                        .update({

                            avatar_url: uploadedPath

                        })

                        .eq("id", currentUser.id);


                if (updateError) {

                    throw updateError;

                }


                // UPDATE LOCAL STATE

                currentProfile.avatar_url =
                    uploadedPath;


                setAvatar(
                    el.editorAvatar,
                    uploadedPath
                );


                setAvatar(
                    el.topAvatar,
                    uploadedPath
                );


                setText(
                    el.avatarStatus,
                    "Profile photo updated successfully."
                );


                // REMOVE OLD FILE IF IT IS OUR STORAGE PATH

                if (

                    oldAvatar &&

                    !/^https?:\/\//i.test(oldAvatar)

                ) {


                    const { error: removeError } =

                        await supabase

                            .storage

                            .from(AVATAR_BUCKET)

                            .remove([oldAvatar]);


                    if (removeError) {

                        console.warn(
                            "Old avatar cleanup failed:",
                            removeError
                        );

                    }

                }


            } catch (error) {


                console.error(
                    "Avatar upload error:",
                    error
                );


                if (uploadedPath) {

                    await supabase

                        .storage

                        .from(AVATAR_BUCKET)

                        .remove([uploadedPath]);

                }


                setText(
                    el.avatarStatus,
                    "Upload failed. Check Storage policies."
                );


            }


            this.value = "";


        }

    );



    // ======================================
    // LOAD GLOBAL CHAT
    // ======================================

    async function loadChat() {


        const { data: messages, error } =

            await supabase

                .from("chat_messages")

                .select(`

                    id,

                    sender_id,

                    content,

                    created_at

                `)

                .order(

                    "created_at",

                    {

                        ascending: false

                    }

                )

                .limit(CHAT_LIMIT);


        if (error) {

            console.error(error);

            setText(
                el.chatStatus,
                "Could not load global chat."
            );

            return;

        }


        const orderedMessages =
            (messages || []).reverse();


        if (orderedMessages.length === 0) {

            el.chatMessages.replaceChildren();

            setText(
                el.chatStatus,
                "No messages yet. Start the conversation!"
            );

            return;

        }


        const senderIds = [

            ...new Set(

                orderedMessages.map(
                    message => message.sender_id
                )

            )

        ];


        const { data: profiles, error: profileError } =

            await supabase

                .from("profiles")

                .select(`

                    id,

                    username,

                    display_name,

                    avatar_url,

                    account_role

                `)

                .in("id", senderIds);


        if (profileError) {

            console.error(profileError);

        }


        const profileMap = new Map(

            (profiles || []).map(

                profile => [

                    profile.id,

                    profile

                ]

            )

        );


        el.chatMessages.replaceChildren();


        orderedMessages.forEach(message => {


            const profile =
                profileMap.get(message.sender_id);


            const item =
                document.createElement("article");

            item.className = "chat-item";


            // AVATAR BUTTON

            const avatarButton =
                document.createElement("button");

            avatarButton.type = "button";

            avatarButton.className =
                "chat-avatar-button";

            avatarButton.setAttribute(
                "aria-label",
                "View player profile"
            );


            setAvatar(
                avatarButton,
                profile?.avatar_url
            );


            avatarButton.addEventListener(
                "click",
                function () {

                    openPlayerProfile(message.sender_id);

                }
            );


            // CONTENT

            const content =
                document.createElement("div");

            content.className = "chat-content";


            // HEADER

            const header =
                document.createElement("div");

            header.className = "chat-header";


            const author =
                document.createElement("button");

            author.type = "button";

            author.className =
                "chat-author-button";


            author.textContent =
                profile?.display_name ||
                profile?.username ||
                "Unknown Player";


            author.addEventListener(
                "click",
                function () {

                    openPlayerProfile(message.sender_id);

                }
            );


            const username =
                document.createElement("span");

            username.className = "chat-username";

            username.textContent =
                profile?.username
                    ? "@" + profile.username
                    : "@unknown";


            header.appendChild(author);

            header.appendChild(username);


            // DEVELOPER / FOUNDER LABEL

            if (profile?.id === null) {

                // No action.

            }


            // TIME

            const time =
                document.createElement("time");

            time.className = "chat-time";

            time.dateTime = message.created_at;

            time.textContent =
                formatDateTime(message.created_at);


            header.appendChild(time);


            // MESSAGE

            const text =
                document.createElement("div");

            text.className = "chat-text";

            text.textContent =
                message.content;


            content.appendChild(header);

            content.appendChild(text);


            item.appendChild(avatarButton);

            item.appendChild(content);


            el.chatMessages.appendChild(item);


        });


        el.chatMessages.scrollTop =
            el.chatMessages.scrollHeight;


        setText(
            el.chatStatus,
            orderedMessages.length +
            " recent messages"
        );


    }



    // ======================================
    // SEND CHAT MESSAGE
    // ======================================

    el.chatForm.addEventListener(
        "submit",
        async function (event) {


            event.preventDefault();


            const content =
                el.chatInput.value.trim();


            if (!content) return;


            if (content.length > 500) {

                setText(
                    el.chatStatus,
                    "Message limit: 500 characters."
                );

                return;

            }


            // BASIC ANTI-SPAM COOLDOWN

            const now = Date.now();


            if (now - lastMessageTime < 1200) {

                setText(
                    el.chatStatus,
                    "Please wait before sending another message."
                );

                return;

            }


            lastMessageTime = now;


            el.chatSend.disabled = true;

            el.chatSend.textContent = "Sending...";


            const { error } =

                await supabase

                    .from("chat_messages")

                    .insert({

                        sender_id: currentUser.id,

                        content: content

                    });


            if (error) {

                console.error(error);

                setText(
                    el.chatStatus,
                    "Message could not be sent."
                );

            } else {

                el.chatInput.value = "";

                await loadChat();

            }


            el.chatSend.disabled = false;

            el.chatSend.textContent = "Send";


        }

    );



    // ======================================
    // LOAD NOTIFICATIONS
    // ======================================

    async function loadNotifications() {


        const { data, error } =

            await supabase

                .from("notifications")

                .select(`

                    id,

                    type,

                    title,

                    message,

                    is_read,

                    created_at

                `)

                .eq("user_id", currentUser.id)

                .order(

                    "created_at",

                    {

                        ascending: false

                    }

                )

                .limit(25);


        if (error) {

            console.error(error);

            setText(
                el.notificationList,
                "Could not load notifications."
            );

            return;

        }


        const notifications =
            data || [];


        const unreadCount =
            notifications.filter(
                item => !item.is_read
            ).length;


        setText(
            el.notificationCount,
            unreadCount
        );


        el.notificationList.replaceChildren();


        if (notifications.length === 0) {

            setText(
                el.notificationList,
                "No notifications yet."
            );

            return;

        }


        notifications.forEach(item => {


            const container =
                document.createElement("article");

            container.className =
                "notification-item";


            if (!item.is_read) {

                container.classList.add("unread");

            }


            const title =
                document.createElement("h3");

            title.textContent =
                item.title;


            const message =
                document.createElement("p");

            message.textContent =
                item.message;


            const date =
                document.createElement("small");

            date.textContent =
                formatDateTime(item.created_at);


            container.appendChild(title);

            container.appendChild(message);

            container.appendChild(date);


            if (!item.is_read) {


                const button =
                    document.createElement("button");


                button.type = "button";

                button.textContent = "Mark as read";


                button.addEventListener(
                    "click",
                    async function () {


                        button.disabled = true;


                        const { error } =

                            await supabase

                                .from("notifications")

                                .update({

                                    is_read: true,

                                    read_at:
                                        new Date().toISOString()

                                })

                                .eq("id", item.id)

                                .eq("user_id", currentUser.id);


                        if (error) {

                            console.error(error);

                            button.disabled = false;

                            return;

                        }


                        await loadNotifications();


                    }

                );


                container.appendChild(button);


            }


            el.notificationList.appendChild(
                container
            );


        });


    }



    // ======================================
    // LAST SEEN
    // ======================================

    async function updateLastSeen() {


        const { error } =
            await supabase.rpc("touch_last_seen");


        if (error) {

            console.warn(
                "Last seen update failed:",
                error.message
            );

        }

    }



    // ======================================
    // REALTIME CHAT
    // ======================================

    function connectChatRealtime() {


        chatChannel =

            supabase

                .channel("eok-global-chat-v030")

                .on(

                    "postgres_changes",

                    {

                        event: "INSERT",

                        schema: "public",

                        table: "chat_messages"

                    },

                    async function () {

                        await loadChat();

                    }

                )

                .subscribe(status => {


                    if (status === "SUBSCRIBED") {

                        setText(
                            el.chatStatus,
                            "Connected to global chat."
                        );

                    }


                    if (status === "CHANNEL_ERROR") {

                        setText(
                            el.chatStatus,
                            "Realtime connection error."
                        );

                    }


                });


    }



    // ======================================
    // REALTIME NOTIFICATIONS
    // ======================================

    function connectNotificationRealtime() {


        notificationChannel =

            supabase

                .channel(
                    "eok-notifications-" + currentUser.id
                )

                .on(

                    "postgres_changes",

                    {

                        event: "*",

                        schema: "public",

                        table: "notifications",

                        filter:
                            "user_id=eq." + currentUser.id

                    },

                    async function () {

                        await loadNotifications();

                    }

                )

                .subscribe();


    }



    // ======================================
    // LOGOUT
    // ======================================

    el.logout.addEventListener(
        "click",
        async function () {


            const confirmed =
                window.confirm(
                    "Are you sure you want to log out?"
                );


            if (!confirmed) return;


            el.logout.disabled = true;

            el.logout.textContent = "Logging out...";


            if (chatChannel) {

                await supabase.removeChannel(
                    chatChannel
                );

            }


            if (notificationChannel) {

                await supabase.removeChannel(
                    notificationChannel
                );

            }


            const { error } =
                await supabase.auth.signOut();


            if (error) {

                console.error(error);

                el.logout.disabled = false;

                el.logout.textContent = "Logout";

                alert("Logout failed.");

                return;

            }


            window.location.replace("login.html");


        }

    );



    // ======================================
    // INITIALIZE
    // ======================================

    try {


        currentUser = await authenticate();


        if (!currentUser) return;


        await loadOwnProfile();


        await Promise.all([

            loadChat(),

            loadNotifications(),

            updateLastSeen()

        ]);


        connectChatRealtime();

        connectNotificationRealtime();


        // BADGE COUNT

        const badges =
            await getPlayerBadges(currentUser.id);


        setText(
            el.badgeCount,
            badges.length
        );


        // LAST SEEN UPDATE

        setInterval(

            updateLastSeen,

            60000

        );


    } catch (error) {


        console.error(
            "Dashboard initialization error:",
            error
        );


        alert(
            "Dashboard could not be initialized. Check the Supabase tables and policies."
        );


    }


})();
