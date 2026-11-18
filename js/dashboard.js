// ==========================================
// EMPIRE OF KINGS
// PLAYER DASHBOARD SYSTEM
// VERSION 0.20
// ==========================================


(async function () {


    const supabase = window.EOK?.supabase;


    if (!supabase) {

        alert("Koneksi Supabase gagal.");

        return;

    }


    let currentUser = null;

    let currentProfile = null;



    // ======================================
    // ELEMENTS
    // ======================================

    const displayNameElement =
        document.getElementById("player-display-name");

    const usernameElement =
        document.getElementById("player-username");

    const playerIdElement =
        document.getElementById("player-id");

    const emailElement =
        document.getElementById("player-email");

    const createdElement =
        document.getElementById("player-created");

    const levelElement =
        document.getElementById("player-level");

    const xpElement =
        document.getElementById("player-xp");

    const goldElement =
        document.getElementById("player-gold");

    const roleElement =
        document.getElementById("role-label");

    const topNameElement =
        document.getElementById("top-user-name");

    const profileForm =
        document.getElementById("profile-form");

    const profileMessage =
        document.getElementById("profile-message");

    const chatForm =
        document.getElementById("chat-form");

    const chatInput =
        document.getElementById("chat-input");

    const chatMessages =
        document.getElementById("chat-messages");

    const chatStatus =
        document.getElementById("chat-status");

    const notificationList =
        document.getElementById("notification-list");

    const notificationCount =
        document.getElementById("notification-count");

    const logoutButton =
        document.getElementById("logout-button");



    // ======================================
    // FORMAT DATE
    // ======================================

    function formatDate(date) {

        if (!date) return "-";

        return new Intl.DateTimeFormat(
            "id-ID",
            {
                dateStyle: "medium"
            }
        ).format(new Date(date));

    }



    function formatTime(date) {

        if (!date) return "";

        return new Intl.DateTimeFormat(
            "id-ID",
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        ).format(new Date(date));

    }



    // ======================================
    // AUTH CHECK
    // ======================================

    async function checkAuthentication() {

        const { data, error } =
            await supabase.auth.getUser();


        if (error || !data.user) {

            window.location.replace(
                "login.html"
            );

            return null;

        }


        return data.user;

    }



    // ======================================
    // LOAD PLAYER PROFILE
    // ======================================

    async function loadProfile() {


        const { data, error } =
            await supabase

                .from("profiles")

                .select(`

                    id,

                    player_id,

                    username,

                    display_name,

                    bio,

                    level,

                    experience,

                    gold,

                    account_role,

                    created_at

                `)

                .eq("id", currentUser.id)

                .single();


        if (error) {

            console.error(error);

            alert(
                "Profil belum ditemukan. Periksa Query 2A."
            );

            return false;

        }


        currentProfile = data;


        displayNameElement.textContent =
            data.display_name;


        usernameElement.textContent =
            "@" + data.username;


        playerIdElement.textContent =
            data.player_id;


        emailElement.textContent =
            currentUser.email || "-";


        createdElement.textContent =
            formatDate(data.created_at);


        levelElement.textContent =
            data.level;


        xpElement.textContent =
            Number(data.experience).toLocaleString("id-ID");


        goldElement.textContent =
            Number(data.gold).toLocaleString("id-ID");


        roleElement.textContent =
            data.account_role.toUpperCase();


        topNameElement.textContent =
            data.display_name;


        document.getElementById("display-name").value =
            data.display_name;


        document.getElementById("bio").value =
            data.bio || "";


        return true;

    }



    // ======================================
    // EDIT PROFILE
    // ======================================

    profileForm.addEventListener(
        "submit",
        async function (event) {


            event.preventDefault();


            const displayName =
                document
                .getElementById("display-name")
                .value
                .trim();


            const bio =
                document
                .getElementById("bio")
                .value
                .trim();


            if (!displayName) {

                profileMessage.textContent =
                    "Display name tidak boleh kosong.";

                return;

            }


            if (displayName.length > 30) {

                profileMessage.textContent =
                    "Display name maksimal 30 karakter.";

                return;

            }


            if (bio.length > 160) {

                profileMessage.textContent =
                    "Bio maksimal 160 karakter.";

                return;

            }


            profileMessage.textContent =
                "Menyimpan profil...";


            const { error } =
                await supabase

                    .from("profiles")

                    .update({

                        display_name: displayName,

                        bio: bio

                    })

                    .eq("id", currentUser.id);


            if (error) {

                console.error(error);

                profileMessage.textContent =
                    "Gagal menyimpan profil.";

                return;

            }


            profileMessage.textContent =
                "Profil berhasil diperbarui.";


            displayNameElement.textContent =
                displayName;


            topNameElement.textContent =
                displayName;


        }

    );



    // ======================================
    // LOAD GLOBAL CHAT
    // ======================================

    async function loadChat() {


        chatStatus.textContent =
            "Memuat pesan...";


        const { data, error } =
            await supabase

                .from("chat_messages")

                .select(`

                    id,

                    sender_id,

                    content,

                    created_at,

                    profiles!chat_messages_sender_id_fkey(

                        username,

                        player_id

                    )

                `)

                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )

                .limit(50);


        if (error) {

            console.error(error);

            chatStatus.textContent =
                "Chat gagal dimuat. Periksa Query 3.";

            return;

        }


        chatMessages.innerHTML = "";


        const messages = (data || []).reverse();


        if (messages.length === 0) {

            chatStatus.textContent =
                "Belum ada pesan. Jadilah pemain pertama yang menyapa!";

            return;

        }


        chatStatus.textContent =
            "Menampilkan " +
            messages.length +
            " pesan terakhir.";


        messages.forEach(message => {


            const container =
                document.createElement("article");

            container.className =
                "chat-message";


            const header =
                document.createElement("div");

            header.className =
                "chat-message-header";


            const sender =
                document.createElement("span");

            sender.className =
                "chat-message-name";


            const profile =
                message.profiles || {};


            sender.textContent =
                profile.username
                ? "@" + profile.username
                : "Unknown Player";


            const time =
                document.createElement("span");

            time.className =
                "chat-message-time";


            time.textContent =
                formatTime(message.created_at);


            const content =
                document.createElement("div");

            content.className =
                "chat-message-text";


            content.textContent =
                message.content;


            header.appendChild(sender);

            header.appendChild(time);


            container.appendChild(header);

            container.appendChild(content);


            chatMessages.appendChild(container);


        });


        chatMessages.scrollTop =
            chatMessages.scrollHeight;


    }



    // ======================================
    // SEND GLOBAL CHAT MESSAGE
    // ======================================

    chatForm.addEventListener(
        "submit",
        async function (event) {


            event.preventDefault();


            const content =
                chatInput.value.trim();


            if (!content) return;


            if (content.length > 500) {

                chatStatus.textContent =
                    "Pesan maksimal 500 karakter.";

                return;

            }


            const sendButton =
                document.getElementById("chat-send");


            sendButton.disabled = true;

            sendButton.textContent =
                "Mengirim...";


            const { error } =
                await supabase

                    .from("chat_messages")

                    .insert({

                        sender_id: currentUser.id,

                        content: content

                    });


            if (error) {

                console.error(error);

                chatStatus.textContent =
                    "Pesan gagal dikirim.";

            } else {

                chatInput.value = "";

                await loadChat();

            }


            sendButton.disabled = false;

            sendButton.textContent =
                "Kirim";


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

                .limit(20);


        if (error) {

            console.error(error);

            notificationList.textContent =
                "Notifikasi gagal dimuat.";

            return;

        }


        notificationList.innerHTML = "";


        const notifications = data || [];


        const unread =
            notifications.filter(
                item => !item.is_read
            ).length;


        notificationCount.textContent =
            unread;


        if (notifications.length === 0) {

            notificationList.textContent =
                "Belum ada notifikasi.";

            return;

        }


        notifications.forEach(item => {


            const container =
                document.createElement("div");


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


            const time =
                document.createElement("small");

            time.textContent =
                formatTime(item.created_at);


            container.appendChild(title);

            container.appendChild(message);

            container.appendChild(time);


            if (!item.is_read) {


                const button =
                    document.createElement("button");


                button.textContent =
                    "Tandai sudah dibaca";


                button.addEventListener(
                    "click",
                    async function () {


                        const { error } =
                            await supabase

                                .from("notifications")

                                .update({

                                    is_read: true,

                                    read_at: new Date().toISOString()

                                })

                                .eq("id", item.id)

                                .eq("user_id", currentUser.id);


                        if (error) {

                            console.error(error);

                            return;

                        }


                        await loadNotifications();


                    }

                );


                container.appendChild(button);


            }


            notificationList.appendChild(container);


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
    // REALTIME SUBSCRIPTIONS
    // ======================================

    function connectRealtime() {


        supabase

            .channel("eok-global-chat")

            .on(

                "postgres_changes",

                {

                    event: "INSERT",

                    schema: "public",

                    table: "chat_messages"

                },

                function () {

                    loadChat();

                }

            )

            .subscribe();



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

                function () {

                    loadNotifications();

                }

            )

            .subscribe();


    }



    // ======================================
    // LOGOUT
    // ======================================

    logoutButton.addEventListener(
        "click",
        async function () {


            logoutButton.disabled = true;


            const { error } =
                await supabase.auth.signOut();


            if (error) {

                console.error(error);

                logoutButton.disabled = false;

                alert("Logout gagal.");

                return;

            }


            window.location.replace(
                "login.html"
            );


        }

    );



    // ======================================
    // INITIALIZE DASHBOARD
    // ======================================

    currentUser = await checkAuthentication();


    if (!currentUser) return;


    const profileLoaded =
        await loadProfile();


    if (!profileLoaded) return;


    await Promise.all([

        loadChat(),

        loadNotifications(),

        updateLastSeen()

    ]);


    connectRealtime();


    setInterval(

        updateLastSeen,

        60000

    );


})();
