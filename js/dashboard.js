// ==========================================
// EMPIRE OF KINGS
// COMMUNITY DASHBOARD
// VERSION 0.40
// ==========================================

(async function () {

    "use strict";


    const db = window.EOK?.supabase;

    if (!db) {

        alert("Supabase connection failed.");

        location.replace("login.html");

        return;

    }


    const AVATAR_BUCKET = "eok-avatars";

    const current = {

        user: null,

        profile: null,

        settings: null,

        selectedProfileId: null,

        reportTargetId: null,

        reportMessageId: null,

        privateTargetId: null,

        chatChannel: null,

        dmChannel: null,

        notificationChannel: null,

        lastGlobalMessage: 0

    };


    const $ = id => document.getElementById(id);


    // ======================================
    // HELPERS
    // ======================================

    function text(id, value) {

        const element = $(id);

        if (element) {

            element.textContent =
                value == null ? "" : String(value);

        }

    }


    function number(value) {

        return Number(value || 0).toLocaleString("id-ID");

    }


    function date(value) {

        if (!value) return "-";

        return new Intl.DateTimeFormat("id-ID", {

            dateStyle: "medium"

        }).format(new Date(value));

    }


    function dateTime(value) {

        if (!value) return "";

        return new Intl.DateTimeFormat("id-ID", {

            dateStyle: "short",

            timeStyle: "short"

        }).format(new Date(value));

    }


    function avatarURL(path) {

        if (!path) return null;

        if (/^https?:\/\//i.test(path)) {

            return path;

        }

        return db.storage

            .from(AVATAR_BUCKET)

            .getPublicUrl(path)

            .data.publicUrl;

    }


    function setAvatar(container, path) {

        if (!container) return;

        container.replaceChildren();

        container.textContent = "♟";

        const url = avatarURL(path);

        if (!url) return;

        const img = document.createElement("img");

        img.src = url;

        img.alt = "Player avatar";

        img.loading = "lazy";

        img.onerror = () => img.remove();

        container.appendChild(img);

    }


    function show(id, visible) {

        const element = $(id);

        if (element) {

            element.hidden = !visible;

        }

    }


    function message(id, value, success = true) {

        const element = $(id);

        if (!element) return;

        element.textContent = value;

        element.style.color =
            success ? "#75d9a2" : "#e38a8a";

    }



    // ======================================
    // AUTHENTICATION
    // ======================================

    const authResult = await db.auth.getUser();

    if (authResult.error || !authResult.data.user) {

        location.replace("login.html");

        return;

    }

    current.user = authResult.data.user;



    // ======================================
    // LOAD PROFILE
    // ======================================

    async function loadOwnProfile() {

        const { data, error } = await db

            .from("profiles")

            .select("*")

            .eq("id", current.user.id)

            .single();


        if (error) {

            console.error(error);

            throw new Error("Player profile could not be loaded.");

        }


        current.profile = data;


        const suspended =

            data.account_status === "suspended"

            && (

                !data.suspended_until

                || new Date(data.suspended_until) > new Date()

            );


        if (suspended) {

            alert(
                "Your account is currently suspended."
            );

            await db.auth.signOut();

            location.replace("login.html");

            return false;

        }


        text(
            "top-user-name",
            data.display_name
        );


        setAvatar(
            $("top-avatar"),
            data.avatar_url
        );


        setAvatar(
            $("editor-avatar"),
            data.avatar_url
        );


        text(
            "hero-player-id",
            data.player_id
        );


        text(
            "editor-username",
            "@" + data.username
        );


        text(
            "editor-title",
            data.profile_title || "Wanderer"
        );


        text(
            "player-level",
            number(data.level)
        );


        text(
            "player-xp",
            number(data.experience)
        );


        text(
            "player-gold",
            number(data.gold)
        );


        text(
            "account-username",
            "@" + data.username
        );


        text(
            "account-email",
            current.user.email || "-"
        );


        text(
            "account-role",
            String(data.account_role).toUpperCase()
        );


        text(
            "account-created",
            date(data.created_at)
        );


        $("display-name").value =
            data.display_name || "";


        $("profile-title").value =
            data.profile_title || "Wanderer";


        $("motto").value =
            data.motto || "";


        $("bio").value =
            data.bio || "";


        if (data.account_role === "admin") {

            show("admin-nav-link", true);

            show("admin-panel", true);

        }


        return true;

    }



    // ======================================
    // PLAYER SETTINGS
    // ======================================

    async function loadSettings() {

        const { data, error } = await db

            .from("player_settings")

            .select("*")

            .eq("user_id", current.user.id)

            .single();


        if (error) {

            console.error(error);

            return;

        }


        current.settings = data;


        $("profile-visibility").value =
            data.profile_visibility;


        $("private-message-policy").value =
            data.private_message_policy;


        $("show-online-status").checked =
            data.show_online_status;


        $("show-activity").checked =
            data.show_activity;


        $("notifications-enabled").checked =
            data.notifications_enabled;

    }



    // ======================================
    // SAVE SETTINGS
    // ======================================

    $("settings-form").addEventListener(

        "submit",

        async function (event) {

            event.preventDefault();


            const values = {

                profile_visibility:
                    $("profile-visibility").value,

                private_message_policy:
                    $("private-message-policy").value,

                show_online_status:
                    $("show-online-status").checked,

                show_activity:
                    $("show-activity").checked,

                notifications_enabled:
                    $("notifications-enabled").checked

            };


            const { error } = await db

                .from("player_settings")

                .update(values)

                .eq("user_id", current.user.id);


            if (error) {

                console.error(error);

                message(
                    "settings-message",
                    "Failed to save settings.",
                    false
                );

                return;

            }


            current.settings = {

                ...current.settings,

                ...values

            };


            message(
                "settings-message",
                "Settings successfully saved."
            );


        }

    );



    // ======================================
    // SAVE PROFILE
    // ======================================

    $("profile-form").addEventListener(

        "submit",

        async function (event) {

            event.preventDefault();


            const displayName =
                $("display-name").value.trim();


            const profileTitle =
                $("profile-title").value.trim();


            const motto =
                $("motto").value.trim();


            const bio =
                $("bio").value.trim();


            if (
                displayName.length < 1 ||
                displayName.length > 30
            ) {

                message(
                    "profile-message",
                    "Display name must be 1–30 characters.",
                    false
                );

                return;

            }


            if (profileTitle.length > 30) {

                message(
                    "profile-message",
                    "Profile title is too long.",
                    false
                );

                return;

            }


            const { data, error } = await db

                .from("profiles")

                .update({

                    display_name: displayName,

                    profile_title: profileTitle || "Wanderer",

                    motto,

                    bio

                })

                .eq("id", current.user.id)

                .select()

                .single();


            if (error) {

                console.error(error);

                message(
                    "profile-message",
                    "Could not save profile.",
                    false
                );

                return;

            }


            current.profile = {

                ...current.profile,

                ...data

            };


            text(
                "top-user-name",
                displayName
            );


            text(
                "editor-title",
                profileTitle || "Wanderer"
            );


            message(
                "profile-message",
                "Profile successfully updated."
            );

        }

    );



    // ======================================
    // AVATAR UPLOAD
    // ======================================

    $("avatar-input").addEventListener(

        "change",

        async function () {


            const file = this.files?.[0];

            if (!file) return;


            const validTypes = [

                "image/jpeg",

                "image/png",

                "image/webp"

            ];


            if (!validTypes.includes(file.type)) {

                text(
                    "avatar-status",
                    "Unsupported image format."
                );

                this.value = "";

                return;

            }


            if (file.size > 2 * 1024 * 1024) {

                text(
                    "avatar-status",
                    "Image maximum size is 2 MB."
                );

                this.value = "";

                return;

            }


            text(
                "avatar-status",
                "Uploading..."
            );


            const extension = {

                "image/jpeg": "jpg",

                "image/png": "png",

                "image/webp": "webp"

            }[file.type];


            const path =

                current.user.id +

                "/" +

                Date.now() +

                "-" +

                crypto.randomUUID() +

                "." +

                extension;


            let uploadedPath = null;


            try {


                const { data, error } = await db.storage

                    .from(AVATAR_BUCKET)

                    .upload(path, file, {

                        cacheControl: "3600",

                        contentType: file.type,

                        upsert: false

                    });


                if (error) throw error;


                uploadedPath = data.path;


                const oldPath = current.profile.avatar_url;


                const { error: profileError } = await db

                    .from("profiles")

                    .update({

                        avatar_url: uploadedPath

                    })

                    .eq("id", current.user.id);


                if (profileError) throw profileError;


                current.profile.avatar_url = uploadedPath;


                setAvatar(
                    $("editor-avatar"),
                    uploadedPath
                );


                setAvatar(
                    $("top-avatar"),
                    uploadedPath
                );


                text(
                    "avatar-status",
                    "Profile photo updated."
                );


                if (
                    oldPath &&
                    !/^https?:\/\//i.test(oldPath)
                ) {

                    const { error: removeError } = await db.storage

                        .from(AVATAR_BUCKET)

                        .remove([oldPath]);


                    if (removeError) {

                        console.warn(removeError);

                    }

                }


            } catch (error) {


                console.error(error);


                if (uploadedPath) {

                    await db.storage

                        .from(AVATAR_BUCKET)

                        .remove([uploadedPath]);

                }


                text(
                    "avatar-status",
                    "Photo upload failed."
                );


            }


            this.value = "";

        }

    );



    // ======================================
    // LOAD STATISTICS
    // ======================================

    async function loadOwnStatistics() {

        const { data: statistics } = await db

            .from("player_statistics")

            .select("total_messages")

            .eq("user_id", current.user.id)

            .maybeSingle();


        text(
            "account-messages",
            number(statistics?.total_messages)
        );


        const { data: badges } = await db

            .from("player_badges")

            .select("badge_id")

            .eq("user_id", current.user.id);


        text(
            "player-badge-count",
            badges?.length || 0
        );

    }



    // ======================================
    // AWARD DATA
    // ======================================

    async function loadBadges(userId) {

        const { data: awarded, error } = await db

            .from("player_badges")

            .select("badge_id, awarded_at")

            .eq("user_id", userId)

            .order("awarded_at", {
                ascending: false
            });


        if (error || !awarded?.length) return [];


        const ids = awarded.map(x => x.badge_id);


        const { data: catalog } = await db

            .from("badges")

            .select("*")

            .in("id", ids);


        const map = new Map(

            (catalog || []).map(x => [x.id, x])

        );


        return awarded

            .map(x => ({

                ...map.get(x.badge_id),

                awarded_at: x.awarded_at

            }))

            .filter(x => x.id);

    }



    async function loadAchievements(userId) {

        const { data: awarded, error } = await db

            .from("player_achievements")

            .select("achievement_id, unlocked_at")

            .eq("user_id", userId)

            .order("unlocked_at", {
                ascending: false
            });


        if (error || !awarded?.length) return [];


        const ids = awarded.map(x => x.achievement_id);


        const { data: catalog } = await db

            .from("achievements")

            .select("*")

            .in("id", ids);


        const map = new Map(

            (catalog || []).map(x => [x.id, x])

        );


        return awarded

            .map(x => ({

                ...map.get(x.achievement_id),

                unlocked_at: x.unlocked_at

            }))

            .filter(x => x.id);

    }



    function renderAwards(id, items) {

        const container = $(id);

        container.replaceChildren();


        if (!items.length) {

            container.textContent = "Nothing unlocked yet.";

            return;

        }


        for (const item of items) {


            const card = document.createElement("div");

            card.className = "award-item";


            const title = document.createElement("strong");

            title.textContent =

                (item.icon || "✦") +

                " " +

                item.name;


            const description = document.createElement("p");

            description.textContent =
                item.description || "";


            card.appendChild(title);

            card.appendChild(description);


            container.appendChild(card);

        }

    }



    // ======================================
    // OPEN PUBLIC PROFILE
    // ======================================

    async function openProfile(userId) {


        current.selectedProfileId = userId;


        show("profile-modal", true);

        document.body.style.overflow = "hidden";


        text(
            "modal-display-name",
            "Loading..."
        );


        $("modal-badges").replaceChildren();

        $("modal-achievements").replaceChildren();

        $("modal-activity").replaceChildren();


        try {


            const { data: rows, error } = await db.rpc(

                "eok_get_player_profile",

                {

                    p_user_id: userId

                }

            );


            if (error) throw error;


            const profile = rows?.[0];


            if (!profile) {

                throw new Error("Profile not found.");

            }


            const privateProfile = profile.is_private;


            setAvatar(
                $("modal-avatar"),
                profile.avatar_url
            );


            text(
                "modal-display-name",
                profile.display_name
            );


            text(
                "modal-username",
                "@" + profile.username
            );


            text(
                "modal-role",
                String(profile.account_role).toUpperCase()
            );


            text(
                "modal-player-id",
                profile.player_id
            );


            text(
                "modal-created",
                date(profile.created_at)
            );


            text(
                "modal-title",
                privateProfile
                    ? "Private Profile"
                    : profile.profile_title || "Wanderer"
            );


            text(
                "modal-motto",
                privateProfile
                    ? ""
                    : profile.motto || ""
            );


            text(
                "modal-bio",
                privateProfile
                    ? "This player has a private profile."
                    : profile.bio || "No biography."
            );


            const online =

                profile.last_seen_at &&

                Date.now() -
                    new Date(profile.last_seen_at).getTime()
                    < 120000;


            text(
                "modal-status",
                profile.last_seen_at
                    ? online ? "● Online" : "● Offline"
                    : "Status hidden"
            );


            text(
                "modal-level",
                privateProfile ? "—" : number(profile.level)
            );


            text(
                "modal-xp",
                privateProfile ? "—" : number(profile.experience)
            );


            text(
                "modal-gold",
                privateProfile ? "—" : number(profile.gold)
            );


            if (privateProfile) {

                for (const id of [

                    "modal-messages",

                    "modal-badge-count",

                    "modal-achievement-count"

                ]) {

                    text(id, "—");

                }


                $("modal-badges").textContent =
                    "Profile details are private.";

                $("modal-achievements").replaceChildren();

                $("modal-activity").replaceChildren();

            } else {


                const [

                    statistics,

                    badges,

                    achievements,

                    activities

                ] = await Promise.all([


                    db.from("player_statistics")

                        .select("total_messages")

                        .eq("user_id", userId)

                        .maybeSingle(),


                    loadBadges(userId),


                    loadAchievements(userId),


                    db.rpc(
                        "eok_get_player_activity",
                        {
                            p_user_id: userId
                        }
                    )


                ]);


                text(
                    "modal-messages",
                    number(statistics.data?.total_messages)
                );


                text(
                    "modal-badge-count",
                    badges.length
                );


                text(
                    "modal-achievement-count",
                    achievements.length
                );


                renderAwards(
                    "modal-badges",
                    badges
                );


                renderAwards(
                    "modal-achievements",
                    achievements
                );


                const activityData =
                    activities.data || [];


                $("modal-activity").replaceChildren();


                for (const item of activityData) {

                    const card = document.createElement("div");

                    card.className = "activity-item";


                    const heading = document.createElement("strong");

                    heading.textContent = item.title;


                    const detail = document.createElement("p");

                    detail.textContent = item.details;


                    card.appendChild(heading);

                    card.appendChild(detail);


                    $("modal-activity").appendChild(card);

                }


                if (!activityData.length) {

                    $("modal-activity").textContent =
                        "No recent activity.";

                }

            }



            // PROFILE ACTIONS

            const isSelf =
                userId === current.user.id;


            show(
                "profile-chat-button",
                !isSelf
            );


            show(
                "profile-block-button",
                !isSelf
            );


            show(
                "profile-report-button",
                !isSelf
            );


            if (!isSelf) {

                await updateProfileActions(userId);

            }


        } catch (error) {


            console.error(error);


            text(
                "modal-display-name",
                "Profile unavailable"
            );


            text(
                "modal-bio",
                "Unable to load profile information."
            );

        }

    }



    // ======================================
    // PROFILE ACTION BUTTON STATE
    // ======================================

    async function updateProfileActions(userId) {


        const { data, error } = await db.rpc(

            "eok_get_private_chat_status",

            {

                p_target_id: userId

            }

        );


        if (error) {

            console.error(error);

            return;

        }


        const status = data?.[0];

        if (!status) return;


        const blockButton =
            $("profile-block-button");


        if (status.blocked_by_me) {

            blockButton.textContent = "Unblock";

        } else {

            blockButton.textContent = "Block";

        }


        const chatButton =
            $("profile-chat-button");


        chatButton.disabled = !status.can_chat;


        if (status.blocked_me) {

            chatButton.textContent =
                "This player blocked you";

        } else if (!status.recipient_allows) {

            chatButton.textContent =
                "Private Messages Disabled";

        } else if (status.blocked_by_me) {

            chatButton.textContent =
                "Unblock to Chat";

        } else if (!status.target_active) {

            chatButton.textContent =
                "Player Unavailable";

        } else {

            chatButton.textContent =
                "Private Chat";

        }

    }



    // ======================================
    // PROFILE MODAL CLOSE
    // ======================================

    $("profile-close").addEventListener(
        "click",
        closeProfile
    );


    $("profile-backdrop").addEventListener(
        "click",
        closeProfile
    );


    function closeProfile() {

        show("profile-modal", false);

        document.body.style.overflow = "";

    }


    $("header-profile-button").addEventListener(
        "click",
        () => openProfile(current.user.id)
    );


    $("profile-preview-button").addEventListener(
        "click",
        () => openProfile(current.user.id)
    );



    // ======================================
    // BLOCK / UNBLOCK
    // ======================================

    $("profile-block-button").addEventListener(

        "click",

        async function () {


            const target = current.selectedProfileId;

            if (!target || target === current.user.id) return;


            const { data: stateData } = await db.rpc(

                "eok_get_private_chat_status",

                {

                    p_target_id: target

                }

            );


            const state = stateData?.[0];

            if (!state) return;


            let result;


            if (state.blocked_by_me) {


                result = await db

                    .from("player_blocks")

                    .delete()

                    .eq("blocker_id", current.user.id)

                    .eq("blocked_id", target);


            } else {


                result = await db

                    .from("player_blocks")

                    .insert({

                        blocker_id: current.user.id,

                        blocked_id: target

                    });


            }


            if (result.error) {

                console.error(result.error);

                alert("Could not update block status.");

                return;

            }


            await updateProfileActions(target);

            await loadBlockedPlayers();


            if (current.privateTargetId === target) {

                closePrivateChat();

            }

        }

    );



    // ======================================
    // PRIVATE CHAT
    // ======================================

    $("profile-chat-button").addEventListener(

        "click",

        async function () {


            const target = current.selectedProfileId;

            if (!target) return;


            await openPrivateChat(target);

        }

    );


    async function openPrivateChat(targetId) {


        const { data, error } = await db.rpc(

            "eok_get_private_chat_status",

            {

                p_target_id: targetId

            }

        );


        if (error || !data?.[0]?.can_chat) {

            alert(
                "Private chat is unavailable. The player may have blocked you or disabled private messages."
            );

            return;

        }


        current.privateTargetId = targetId;


        const { data: profileRows } = await db.rpc(

            "eok_get_chat_profiles",

            {

                p_user_ids: [targetId]

            }

        );


        const targetProfile = profileRows?.[0];


        text(
            "dm-title",
            targetProfile?.display_name ||
            "@" + targetProfile?.username
        );


        text(
            "dm-status",
            targetProfile?.username
                ? "@" + targetProfile.username
                : "Private conversation"
        );


        show("dm-modal", true);

        document.body.style.overflow = "hidden";


        await loadPrivateMessages();


        await db.rpc(

            "eok_mark_private_messages_read",

            {

                p_sender_id: targetId

            }

        );


        connectPrivateRealtime();

    }



    async function loadPrivateMessages() {


        if (!current.privateTargetId) return;


        const me = current.user.id;

        const other = current.privateTargetId;


        const condition =

            `and(sender_id.eq.${me},recipient_id.eq.${other}),` +

            `and(sender_id.eq.${other},recipient_id.eq.${me})`;


        const { data, error } = await db

            .from("direct_messages")

            .select("*")

            .or(condition)

            .order("created_at", {
                ascending: true
            })

            .limit(100);


        if (error) {

            console.error(error);

            text(
                "dm-status",
                "Conversation unavailable."
            );

            return;

        }


        const container = $("dm-messages");

        container.replaceChildren();


        for (const item of data || []) {


            const bubble = document.createElement("div");

            bubble.className =

                "dm-message" +

                (

                    item.sender_id === me
                        ? " mine"
                        : ""

                );


            const body = document.createElement("div");

            body.textContent = item.content;


            const time = document.createElement("small");

            time.textContent =
                dateTime(item.created_at);


            bubble.appendChild(body);

            bubble.appendChild(time);


            container.appendChild(bubble);

        }


        container.scrollTop =
            container.scrollHeight;

    }



    $("dm-form").addEventListener(

        "submit",

        async function (event) {


            event.preventDefault();


            const target =
                current.privateTargetId;


            const content =
                $("dm-input").value.trim();


            if (!target || !content) return;


            $("dm-send").disabled = true;


            const { error } = await db.rpc(

                "eok_send_private_message",

                {

                    p_recipient_id: target,

                    p_content: content

                }

            );


            if (error) {

                console.error(error);

                text(
                    "dm-status",
                    "Message could not be sent."
                );

            } else {

                $("dm-input").value = "";

                await loadPrivateMessages();

                text(
                    "dm-status",
                    "Connected"
                );

            }


            $("dm-send").disabled = false;

        }

    );



    function connectPrivateRealtime() {


        if (current.dmChannel) {

            db.removeChannel(current.dmChannel);

        }


        current.dmChannel = db

            .channel(
                "eok-dm-" + current.user.id
            )

            .on(

                "postgres_changes",

                {

                    event: "INSERT",

                    schema: "public",

                    table: "direct_messages"

                },

                async payload => {


                    const item = payload.new;


                    if (

                        item.sender_id === current.privateTargetId

                        || item.recipient_id === current.privateTargetId

                    ) {

                        await loadPrivateMessages();

                        await db.rpc(

                            "eok_mark_private_messages_read",

                            {

                                p_sender_id:
                                    current.privateTargetId

                            }

                        );

                    }

                }

            )

            .subscribe();

    }



    function closePrivateChat() {

        show("dm-modal", false);

        document.body.style.overflow = "";


        if (current.dmChannel) {

            db.removeChannel(current.dmChannel);

            current.dmChannel = null;

        }


        current.privateTargetId = null;

    }


    $("dm-close").addEventListener(
        "click",
        closePrivateChat
    );


    $("dm-backdrop").addEventListener(
        "click",
        closePrivateChat
    );



    // ======================================
    // BLOCKED PLAYERS
    // ======================================

    async function loadBlockedPlayers() {


        const { data, error } = await db

            .from("player_blocks")

            .select("blocked_id, created_at")

            .eq("blocker_id", current.user.id)

            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.error(error);

            text(
                "blocked-list",
                "Could not load blocked players."
            );

            return;

        }


        const container = $("blocked-list");

        container.replaceChildren();


        if (!data?.length) {

            container.textContent =
                "You have not blocked any players.";

            return;

        }


        const ids =
            data.map(x => x.blocked_id);


        const { data: profiles } = await db.rpc(

            "eok_get_chat_profiles",

            {

                p_user_ids: ids

            }

        );


        const map = new Map(

            (profiles || []).map(x => [x.id, x])

        );


        for (const item of data) {


            const profile = map.get(item.blocked_id);


            const row = document.createElement("div");

            row.className = "blocked-player";


            const info = document.createElement("div");


            const name = document.createElement("strong");

            name.textContent =

                "@" +

                (

                    profile?.username ||

                    item.blocked_id.slice(0, 8)

                );


            info.appendChild(name);


            const button = document.createElement("button");

            button.className = "secondary-button";

            button.textContent = "Unblock";


            button.addEventListener(

                "click",

                async () => {


                    const { error } = await db

                        .from("player_blocks")

                        .delete()

                        .eq("blocker_id", current.user.id)

                        .eq("blocked_id", item.blocked_id);


                    if (error) {

                        console.error(error);

                        return;

                    }


                    await loadBlockedPlayers();

                }

            );


            row.appendChild(info);

            row.appendChild(button);

            container.appendChild(row);

        }

    }



    // ======================================
    // REPORTS
    // ======================================

    function openReport(targetId, messageId = null) {

        current.reportTargetId = targetId;

        current.reportMessageId = messageId;


        show("report-modal", true);

    }


    $("profile-report-button").addEventListener(

        "click",

        () => {

            openReport(
                current.selectedProfileId
            );

        }

    );


    $("report-close").addEventListener(

        "click",

        () => show("report-modal", false)

    );


    $("report-backdrop").addEventListener(

        "click",

        () => show("report-modal", false)

    );


    $("report-form").addEventListener(

        "submit",

        async function (event) {


            event.preventDefault();


            if (!current.reportTargetId) return;


            const { error } = await db.rpc(

                "eok_submit_report",

                {

                    p_reported_user_id:
                        current.reportTargetId,

                    p_message_id:
                        current.reportMessageId,

                    p_reason:
                        $("report-reason").value,

                    p_details:
                        $("report-details").value.trim()

                }

            );


            if (error) {

                console.error(error);

                message(
                    "report-status",
                    "Report could not be submitted.",
                    false
                );

                return;

            }


            message(
                "report-status",
                "Report submitted successfully."
            );


            $("report-form").reset();

            current.reportTargetId = null;

            current.reportMessageId = null;


            setTimeout(
                () => show("report-modal", false),
                900
            );

        }

    );



    // ======================================
    // GLOBAL CHAT
    // ======================================

    async function loadGlobalChat() {


        const { data: messages, error } = await db

            .from("chat_messages")

            .select("id,sender_id,content,created_at")

            .order("created_at", {
                ascending: false
            })

            .limit(50);


        if (error) {

            console.error(error);

            text(
                "chat-status",
                "Chat could not be loaded."
            );

            return;

        }


        const ordered =
            (messages || []).reverse();


        const ids = [

            ...new Set(

                ordered.map(x => x.sender_id)

            )

        ];


        const { data: profiles, error: identityError } =

            await db.rpc(

                "eok_get_chat_profiles",

                {

                    p_user_ids: ids

                }

            );


        if (identityError) {

            console.error(
                "Chat identity loading failed:",
                identityError
            );

        }


        const profileMap = new Map(

            (profiles || []).map(x => [x.id, x])

        );


        const container = $("chat-messages");

        container.replaceChildren();


        for (const item of ordered) {


            const profile = profileMap.get(item.sender_id);


            const row = document.createElement("article");

            row.className = "chat-row";


            const avatar = document.createElement("div");

            avatar.className = "chat-avatar";


            setAvatar(
                avatar,
                profile?.avatar_url
            );


            const body = document.createElement("div");

            body.className = "chat-body";


            const userLine = document.createElement("div");

            userLine.className = "chat-user-line";


            const displayName = document.createElement("button");

            displayName.className = "chat-name-button";

            displayName.textContent =

                profile?.display_name ||

                "Player " + item.sender_id.slice(0, 8);


            displayName.addEventListener(

                "click",

                () => openProfile(item.sender_id)

            );


            const handle = document.createElement("span");

            handle.className = "chat-handle";


            // Username is always shown when available.
            // Fallback uses a unique ID fragment,
            // never "Unknown Player".

            handle.textContent =

                profile?.username

                    ? "@" + profile.username

                    : "@player_" + item.sender_id.slice(0, 8);


            userLine.appendChild(displayName);

            userLine.appendChild(handle);


            if (profile?.account_role === "admin") {

                const badge = document.createElement("span");

                badge.className = "chat-badge-mini";

                badge.textContent = "ADMIN";

                userLine.appendChild(badge);

            }


            const time = document.createElement("span");

            time.className = "chat-time";

            time.textContent = dateTime(item.created_at);


            userLine.appendChild(time);


            const content = document.createElement("div");

            content.className = "chat-message-text";

            content.textContent = item.content;


            const report = document.createElement("button");

            report.className = "chat-report-button";

            report.textContent = "Report";


            report.addEventListener(

                "click",

                () => openReport(
                    item.sender_id,
                    item.id
                )

            );


            body.appendChild(userLine);

            body.appendChild(content);

            body.appendChild(report);


            row.appendChild(avatar);

            row.appendChild(body);


            container.appendChild(row);

        }


        container.scrollTop =
            container.scrollHeight;


        text(
            "chat-status",
            ordered.length + " recent messages"
        );

    }



    // ======================================
    // SEND GLOBAL CHAT
    // ======================================

    $("chat-form").addEventListener(

        "submit",

        async function (event) {


            event.preventDefault();


            const content =
                $("chat-input").value.trim();


            if (!content) return;


            if (content.length > 500) return;


            const now = Date.now();


            if (
                now - current.lastGlobalMessage < 1200
            ) {

                text(
                    "chat-status",
                    "Please wait before sending another message."
                );

                return;

            }


            current.lastGlobalMessage = now;


            $("chat-send").disabled = true;


            const { error } = await db

                .from("chat_messages")

                .insert({

                    sender_id: current.user.id,

                    content

                });


            if (error) {

                console.error(error);

                text(
                    "chat-status",
                    "Message could not be sent."
                );

            } else {

                $("chat-input").value = "";

                await loadGlobalChat();

            }


            $("chat-send").disabled = false;

        }

    );



    // ======================================
    // REALTIME GLOBAL CHAT
    // ======================================

    function connectGlobalRealtime() {


        current.chatChannel = db

            .channel("eok-global-community-040")

            .on(

                "postgres_changes",

                {

                    event: "INSERT",

                    schema: "public",

                    table: "chat_messages"

                },

                async () => {

                    await loadGlobalChat();

                    await loadOwnStatistics();

                }

            )

            .subscribe(

                status => {

                    if (status === "SUBSCRIBED") {

                        text(
                            "chat-status",
                            "Connected to global chat."
                        );

                    }

                }

            );

    }



    // ======================================
    // NOTIFICATIONS
    // ======================================

    async function loadNotifications() {


        const { data, error } = await db

            .from("notifications")

            .select("*")

            .eq("user_id", current.user.id)

            .order("created_at", {
                ascending: false
            })

            .limit(20);


        if (error) {

            console.error(error);

            return;

        }


        const unread =
            (data || []).filter(x => !x.is_read).length;


        text(
            "notification-count",
            unread
        );


        const container = $("notification-list");

        container.replaceChildren();


        if (!data?.length) {

            container.textContent =
                "No notifications yet.";

            return;

        }


        for (const item of data) {


            const row = document.createElement("div");

            row.className = "notification-item";


            if (!item.is_read) {

                row.classList.add("unread");

            }


            const title = document.createElement("h3");

            title.textContent = item.title;


            const body = document.createElement("p");

            body.textContent = item.message;


            const time = document.createElement("small");

            time.textContent = dateTime(item.created_at);


            row.appendChild(title);

            row.appendChild(body);

            row.appendChild(time);


            if (!item.is_read) {


                const button = document.createElement("button");

                button.className = "secondary-button";

                button.textContent = "Mark Read";


                button.addEventListener(

                    "click",

                    async () => {


                        const { error } = await db

                            .from("notifications")

                            .update({

                                is_read: true,

                                read_at: new Date().toISOString()

                            })

                            .eq("id", item.id)

                            .eq("user_id", current.user.id);


                        if (!error) {

                            await loadNotifications();

                        }

                    }

                );


                row.appendChild(button);

            }


            container.appendChild(row);

        }

    }



    // ======================================
    // PLAYER DIRECTORY
    // ======================================

    async function loadDirectory() {


        const query =
            $("directory-search").value.trim();


        const sort =
            $("directory-sort").value;


        let request = db

            .from("profiles")

            .select(`

                id,

                player_id,

                username,

                display_name,

                avatar_url,

                level,

                experience,

                gold,

                created_at,

                account_role

            `);


        if (query) {

            const safeQuery =
                query.replace(/[(),]/g, "");

            request = request.or(

                `username.ilike.%${safeQuery}%,` +

                `display_name.ilike.%${safeQuery}%,` +

                `player_id.ilike.%${safeQuery}%`

            );

        }


        const { data, error } = await request

            .order(sort, {
                ascending: false
            })

            .limit(40);


        if (error) {

            console.error(error);

            text(
                "directory-results",
                "Player search failed."
            );

            return;

        }


        const container = $("directory-results");

        container.replaceChildren();


        if (!data?.length) {

            container.textContent =
                "No visible players found.";

            return;

        }


        for (const player of data) {


            const card = document.createElement("article");

            card.className = "directory-card";


            const avatar = document.createElement("div");

            avatar.className = "directory-avatar";

            setAvatar(avatar, player.avatar_url);


            const info = document.createElement("div");

            info.className = "directory-info";


            const name = document.createElement("strong");

            name.textContent =
                player.display_name;


            const handle = document.createElement("span");

            handle.textContent =

                "@" + player.username +

                " · Level " + number(player.level);


            info.appendChild(name);

            info.appendChild(handle);


            const view = document.createElement("button");

            view.textContent = "Profile";

            view.addEventListener(

                "click",

                () => openProfile(player.id)

            );


            card.appendChild(avatar);

            card.appendChild(info);

            card.appendChild(view);


            container.appendChild(card);

        }

    }


    $("directory-search-button").addEventListener(
        "click",
        loadDirectory
    );


    $("directory-sort").addEventListener(
        "change",
        loadDirectory
    );


    $("directory-search").addEventListener(

        "keydown",

        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                loadDirectory();

            }

        }

    );



    // ======================================
    // COMMUNITY STATISTICS
    // ======================================

    async function loadCommunityStatistics() {


        const { data, error } = await db.rpc(

            "eok_get_community_stats"

        );


        if (error) {

            console.error(error);

            return;

        }


        text(
            "community-players",
            number(data.total_players)
        );


        text(
            "community-online",
            number(data.online_players)
        );


        text(
            "community-messages",
            number(data.total_messages)
        );


        text(
            "community-achievements",
            number(data.total_achievements)
        );

    }



    // ======================================
    // USERNAME CHANGE
    // ======================================

    $("username-form").addEventListener(

        "submit",

        async function (event) {


            event.preventDefault();


            const username =
                $("new-username").value.trim().toLowerCase();


            if (!/^[a-z0-9_]{3,20}$/.test(username)) {

                message(
                    "username-message",
                    "Invalid username format.",
                    false
                );

                return;

            }


            const { data, error } = await db.rpc(

                "eok_change_username",

                {

                    p_new_username: username

                }

            );


            if (error) {

                console.error(error);

                message(
                    "username-message",
                    error.message,
                    false
                );

                return;

            }


            message(
                "username-message",
                "Username changed. Your next change will be available in 30 days."
            );


            $("new-username").value = "";


            await loadOwnProfile();

        }

    );



    // ======================================
    // ADMIN PLAYER SEARCH
    // ======================================

    async function adminSearchPlayers() {


        if (current.profile.account_role !== "admin") return;


        const query =
            $("admin-player-search").value.trim();


        const { data, error } = await db.rpc(

            "eok_admin_search_players",

            {

                p_query: query

            }

        );


        if (error) {

            console.error(error);

            return;

        }


        const container = $("admin-player-results");

        container.replaceChildren();


        for (const player of data || []) {


            const card = document.createElement("article");

            card.className = "admin-result";


            const name = document.createElement("strong");

            name.textContent =
                player.display_name + " · @" + player.username;


            const details = document.createElement("p");

            details.textContent =

                player.player_id +

                " · " +

                player.account_status +

                " · Level " +

                player.level;


            card.appendChild(name);

            card.appendChild(details);


            const actions = document.createElement("div");

            actions.className = "admin-result-actions";


            const activate = document.createElement("button");

            activate.textContent = "Activate";


            activate.addEventListener(

                "click",

                async () => {


                    const { error } = await db.rpc(

                        "eok_admin_set_player_status",

                        {

                            p_target_id: player.id,

                            p_status: "active",

                            p_suspended_until: null,

                            p_note: "Reactivated by administrator"

                        }

                    );


                    if (error) {

                        alert(error.message);

                        return;

                    }


                    await adminSearchPlayers();

                    await adminLoadAudit();

                }

            );


            const suspend = document.createElement("button");

            suspend.textContent = "Suspend 24 Hours";


            suspend.addEventListener(

                "click",

                async () => {


                    const reason = prompt(
                        "Suspension reason:"
                    );


                    if (reason === null) return;


                    const until = new Date(

                        Date.now() + 24 * 60 * 60 * 1000

                    ).toISOString();


                    const { error } = await db.rpc(

                        "eok_admin_set_player_status",

                        {

                            p_target_id: player.id,

                            p_status: "suspended",

                            p_suspended_until: until,

                            p_note: reason

                        }

                    );


                    if (error) {

                        alert(error.message);

                        return;

                    }


                    await adminSearchPlayers();

                    await adminLoadAudit();

                }

            );


            const notice = document.createElement("button");

            notice.textContent = "Send Notice";


            notice.addEventListener(

                "click",

                async () => {


                    const title = prompt("Notification title:");

                    if (!title) return;


                    const body = prompt("Notification message:");

                    if (!body) return;


                    const { error } = await db.rpc(

                        "eok_admin_send_notification",

                        {

                            p_target_id: player.id,

                            p_title: title,

                            p_message: body

                        }

                    );


                    if (error) {

                        alert(error.message);

                        return;

                    }


                    alert("Notification sent.");

                    await adminLoadAudit();

                }

            );


            actions.appendChild(activate);

            actions.appendChild(suspend);

            actions.appendChild(notice);


            card.appendChild(actions);

            container.appendChild(card);

        }

    }


    $("admin-search-button").addEventListener(
        "click",
        adminSearchPlayers
    );



    // ======================================
    // ADMIN REPORTS
    // ======================================

    async function adminLoadReports() {


        if (current.profile.account_role !== "admin") return;


        const { data, error } = await db

            .from("player_reports")

            .select("*")

            .order("created_at", {
                ascending: false
            })

            .limit(50);


        if (error) {

            console.error(error);

            return;

        }


        const container = $("admin-report-results");

        container.replaceChildren();


        if (!data?.length) {

            container.textContent = "No reports.";

            return;

        }


        for (const report of data) {


            const card = document.createElement("article");

            card.className = "admin-result";


            const title = document.createElement("strong");

            title.textContent =
                report.reason.toUpperCase();


            const detail = document.createElement("p");

            detail.textContent =

                report.details ||

                "No additional details.";


            const status = document.createElement("p");

            status.textContent =
                "Status: " + report.status;


            card.appendChild(title);

            card.appendChild(detail);

            card.appendChild(status);


            const actions = document.createElement("div");

            actions.className = "admin-result-actions";


            for (const state of ["reviewed", "resolved", "rejected"]) {


                const button = document.createElement("button");

                button.textContent = state;


                button.addEventListener(

                    "click",

                    async () => {


                        const { error } = await db.rpc(

                            "eok_admin_update_report",

                            {

                                p_report_id: report.id,

                                p_status: state

                            }

                        );


                        if (error) {

                            alert(error.message);

                            return;

                        }


                        await adminLoadReports();

                        await adminLoadAudit();

                    }

                );


                actions.appendChild(button);

            }


            if (report.chat_message_id) {


                const remove = document.createElement("button");

                remove.textContent = "Delete Reported Message";


                remove.addEventListener(

                    "click",

                    async () => {


                        if (!confirm(
                            "Delete the reported global chat message?"
                        )) {

                            return;

                        }


                        const { error } = await db.rpc(

                            "eok_admin_delete_chat_message",

                            {

                                p_message_id:
                                    report.chat_message_id

                            }

                        );


                        if (error) {

                            alert(error.message);

                            return;

                        }


                        await adminLoadReports();

                        await adminLoadAudit();

                        await loadGlobalChat();

                    }

                );


                actions.appendChild(remove);

            }


            card.appendChild(actions);

            container.appendChild(card);

        }

    }


    $("admin-load-reports").addEventListener(
        "click",
        adminLoadReports
    );



    // ======================================
    // ADMIN SEND NOTIFICATION FORM
    // ======================================

    $("admin-notification-form").addEventListener(

        "submit",

        async function (event) {


            event.preventDefault();


            const target =
                $("admin-notification-user").value.trim();


            const title =
                $("admin-notification-title").value.trim();


            const body =
                $("admin-notification-message").value.trim();


            const { error } = await db.rpc(

                "eok_admin_send_notification",

                {

                    p_target_id: target,

                    p_title: title,

                    p_message: body

                }

            );


            if (error) {

                console.error(error);

                message(
                    "admin-notification-status",
                    error.message,
                    false
                );

                return;

            }


            message(
                "admin-notification-status",
                "Notification sent successfully."
            );


            this.reset();


            await adminLoadAudit();

        }

    );



    // ======================================
    // ADMIN AUDIT LOGS
    // ======================================

    async function adminLoadAudit() {


        if (current.profile.account_role !== "admin") return;


        const { data, error } = await db

            .from("admin_audit_logs")

            .select("*")

            .order("created_at", {
                ascending: false
            })

            .limit(40);


        if (error) {

            console.error(error);

            return;

        }


        const container = $("admin-audit-results");

        container.replaceChildren();


        for (const item of data || []) {


            const card = document.createElement("article");

            card.className = "admin-result";


            const title = document.createElement("strong");

            title.textContent = item.action_type;


            const detail = document.createElement("p");

            detail.textContent =
                item.description + " · " + dateTime(item.created_at);


            card.appendChild(title);

            card.appendChild(detail);


            container.appendChild(card);

        }

    }


    $("admin-load-audit").addEventListener(
        "click",
        adminLoadAudit
    );



    // ======================================
    // LAST SEEN
    // ======================================

    async function updateLastSeen() {

        const { error } = await db.rpc("touch_last_seen");

        if (error) {

            console.warn(error);

        }

    }



    // ======================================
    // REALTIME NOTIFICATIONS
    // ======================================

    function connectNotificationRealtime() {


        current.notificationChannel = db

            .channel(
                "eok-user-notifications-" + current.user.id
            )

            .on(

                "postgres_changes",

                {

                    event: "*",

                    schema: "public",

                    table: "notifications",

                    filter: "user_id=eq." + current.user.id

                },

                loadNotifications

            )

            .subscribe();

    }



    // ======================================
    // LOGOUT
    // ======================================

    $("logout-button").addEventListener(

        "click",

        async function () {


            if (!confirm("Are you sure you want to log out?")) {

                return;

            }


            this.disabled = true;


            const channels = [

                current.chatChannel,

                current.dmChannel,

                current.notificationChannel

            ].filter(Boolean);


            for (const channel of channels) {

                await db.removeChannel(channel);

            }


            const { error } = await db.auth.signOut();


            if (error) {

                console.error(error);

                this.disabled = false;

                return;

            }


            location.replace("login.html");

        }

    );



    // ======================================
    // INITIALIZATION
    // ======================================

    try {


        const loaded = await loadOwnProfile();

        if (!loaded) return;


        await Promise.all([

            loadSettings(),

            loadOwnStatistics(),

            loadGlobalChat(),

            loadNotifications(),

            loadBlockedPlayers(),

            loadDirectory(),

            loadCommunityStatistics(),

            updateLastSeen()

        ]);


        connectGlobalRealtime();

        connectNotificationRealtime();


        if (current.profile.account_role === "admin") {

            await Promise.all([

                adminSearchPlayers(),

                adminLoadReports(),

                adminLoadAudit()

            ]);

        }


        setInterval(

            updateLastSeen,

            60000

        );


        setInterval(

            loadCommunityStatistics,

            60000

        );


    } catch (error) {


        console.error(error);

        alert(
            "Dashboard initialization failed. Check the SQL migration and database policies."
        );

    }


})();
