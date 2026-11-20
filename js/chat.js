/* ==========================================
   EMPIRE OF KINGS
   REAL-TIME CHAT SYSTEM
   VERSION 0.0.1
========================================== */

(function () {

"use strict";


const client = window.EOK_CLIENT;

const $ = id => document.getElementById(id);


let activeChat = {

    type: "global",

    roomKey: "global",

    conversationId: null,

    otherUser: null

};


let realtimeChannel = null;

let searchOffset = 0;

let searchQuery = "";

let searchTimer = null;


function flag(code) {

    if (!code) return "🌐";

    return window.EOKFlagEmoji(code);

}


function publicAvatar(path) {

    if (!path) return null;


    return client.storage

        .from("eok-avatars")

        .getPublicUrl(path)

        .data.publicUrl;

}


function showNotice(text) {

    const element = $("chatNotice");

    element.textContent = text;

    element.hidden = false;

    setTimeout(() => {

        element.hidden = true;

    }, 4500);

}


// ======================================
// CHAT RENDERING
// ======================================

function renderMessage(message) {


    const container = $("chatMessages");


    const placeholder = container.querySelector(".chat-placeholder");

    if (placeholder) placeholder.remove();


    const sender = message.sender || {};


    const name = sender.display_name || sender.username || "Player";


    const row = document.createElement("div");

    row.className = "chat-message";


    if (message.sender_id === window.EOK_STATE.user.id) {

        row.classList.add("message-own");

    }


    // AVATAR

    const avatar = document.createElement("button");

    avatar.className = "message-avatar";

    avatar.title = "View player profile";

    avatar.addEventListener("click", () => {

        window.EOKOpenProfile(message.sender_id);

    });


    const avatarURL = publicAvatar(sender.avatar_path);


    if (avatarURL) {

        const image = document.createElement("img");

        image.src = avatarURL;

        image.alt = name;

        image.onerror = () => {

            avatar.textContent = Array.from(name)[0].toUpperCase();

        };

        avatar.appendChild(image);

    } else {

        avatar.textContent = Array.from(name)[0]?.toUpperCase() || "E";

    }


    // MESSAGE CONTENT

    const content = document.createElement("div");

    content.className = "message-content";


    const meta = document.createElement("div");

    meta.className = "message-meta";


    const author = document.createElement("button");

    author.className = "message-author";

    author.textContent = name;

    author.addEventListener("click", () => {

        window.EOKOpenProfile(message.sender_id);

    });


    const username = document.createElement("span");

    username.className = "message-username";

    username.textContent = "@" + (sender.username || "player");


    const country = document.createElement("span");

    country.className = "message-country";

    country.textContent = flag(sender.country_code);


    const time = document.createElement("span");

    time.className = "message-time";


    time.textContent = new Intl.DateTimeFormat("id-ID", {

        hour: "2-digit",

        minute: "2-digit"

    }).format(new Date(message.created_at));


    meta.append(

        author,

        username,

        country,

        time

    );


    const body = document.createElement("div");

    body.className = "message-body";

    body.textContent = message.body;


    content.append(meta,body);

    row.append(avatar,content);

    container.appendChild(row);

}


function renderEmptyMessages() {


    $("chatMessages").innerHTML = `

        <div class="chat-placeholder">

            <div>♜</div>

            <strong>THE REALM IS WAITING</strong>

            <p>No messages have been recorded yet.</p>

        </div>

    `;

}


// ======================================
// LOAD MESSAGES
// ======================================

async function loadMessages() {


    const container = $("chatMessages");

    container.innerHTML = "";


    let query = client

        .from("eok_messages")

        .select(`

            id,

            room_type,

            room_key,

            conversation_id,

            sender_id,

            recipient_id,

            body,

            created_at,

            sender:eok_profiles!eok_messages_sender_id_fkey(

                username,

                display_name,

                avatar_path,

                country_code

            )

        `);


    if (activeChat.type === "global") {


        query = query

            .eq("room_type","global")

            .eq("room_key","global");


    } else if (activeChat.type === "region") {


        query = query

            .eq("room_type","region")

            .eq("room_key",activeChat.roomKey);


    } else {


        query = query

            .eq("room_type","direct")

            .eq("conversation_id",activeChat.conversationId);

    }


    const {data,error} = await query

        .order("created_at",{ascending:true})

        .limit(80);


    if (error) {

        console.error(error);

        showNotice("Unable to load messages.");

        return;

    }


    if (!data?.length) {

        renderEmptyMessages();

        return;

    }


    data.forEach(renderMessage);


    container.scrollTop = container.scrollHeight;

}


// ======================================
// CHAT ROOM SELECTOR
// ======================================

async function selectRoom(type) {


    activeChat.type = type;

    activeChat.conversationId = null;

    activeChat.otherUser = null;


    $("chatBackButton").hidden = true;

    $("chatBlockButton").hidden = true;


    $("chatTabs").hidden = false;


    $("chatHeaderTitle").textContent =

        type === "global"

            ? "Global Chat"

            : "Regional Chat";


    $("regionSelectorContainer").hidden =

        type !== "region";


    $("chatRoomLabel").textContent =

        type === "global"

            ? "GLOBAL COMMUNICATION"

            : "REGIONAL COMMUNICATION";


    $("messageInput").placeholder =

        "Write your message...";


    document

        .querySelectorAll("[data-chat-room]")

        .forEach(button => {

            button.classList.toggle(

                "active",

                button.dataset.chatRoom === type

            );

        });


    if (type === "region") {


        let region =

            window.EOK_STATE.profile.chat_region;


        if (!region) {

            region = "ID";

        }


        $("regionSelector").value = region;

        activeChat.roomKey = region;


        $("chatRoomLabel").textContent =

            "REGION: " + window.EOKCountryName(region);


    } else {

        activeChat.roomKey = "global";

    }


    await loadMessages();

}


document

    .querySelectorAll("[data-chat-room]")

    .forEach(button => {

        button.addEventListener("click", function () {

            selectRoom(this.dataset.chatRoom);

        });

    });


// ======================================
// REGION CHANGE
// ======================================

$("regionSelector").addEventListener("change", async function () {


    const region = this.value;

    if (!region) return;


    activeChat.type = "region";

    activeChat.roomKey = region;


    const {error} = await client.rpc(

        "eok_set_chat_region",

        {

            p_chat_region: region

        }

    );


    if (error) {

        console.error(error);

        showNotice("Unable to update regional preference.");

        return;

    }


    window.EOK_STATE.profile.chat_region = region;


    $("chatRoomLabel").textContent =

        "REGION: " + window.EOKCountryName(region);


    await loadMessages();

});


// ======================================
// SEND MESSAGE
// ======================================

$("messageForm").addEventListener("submit", async function (event) {


    event.preventDefault();


    const input = $("messageInput");

    const body = input.value.trim();


    if (!body) return;


    const button = $("sendMessageButton");

    button.disabled = true;


    try {


        const {error} = await client.rpc(

            "eok_send_message",

            {

                p_room_type: activeChat.type,

                p_room_key: activeChat.roomKey,

                p_conversation_id: activeChat.conversationId,

                p_recipient_id: activeChat.otherUser?.id || null,

                p_body: body

            }

        );


        if (error) throw error;


        input.value = "";


        await loadMessages();


    } catch (error) {


        console.error(error);


        showNotice(

            error.message || "Unable to send message."

        );

    } finally {


        button.disabled = false;

        input.focus();

    }

});


// ======================================
// PRIVATE CHAT
// ======================================

window.EOKOpenDirectChat = async function (userId) {


    if (!userId) return;


    try {


        const {data: conversationId,error} = await client.rpc(

            "eok_get_or_create_conversation",

            {

                p_other_user: userId

            }

        );


        if (error) throw error;


        const {data: other,error: profileError} = await client

            .from("eok_profiles")

            .select("id,username,display_name,avatar_path,country_code")

            .eq("id",userId)

            .single();


        if (profileError) throw profileError;


        activeChat = {

            type: "direct",

            roomKey: "direct",

            conversationId,

            otherUser: other

        };


        $("chatTabs").hidden = true;

        $("regionSelectorContainer").hidden = true;


        $("chatHeaderTitle").textContent =

            other.display_name;


        $("chatRoomLabel").textContent =

            "PRIVATE CONVERSATION";


        $("chatRoomLanguage").textContent =

            "@" + other.username;


        $("chatBackButton").hidden = false;

        $("chatBlockButton").hidden = false;


        document.getElementById("communication")

            .scrollIntoView({

                behavior:"smooth",

                block:"start"

            });


        await loadMessages();


        closeInbox();


    } catch (error) {


        console.error(error);


        showNotice(

            "Private conversation unavailable. The player may have blocked you or you may have blocked them."

        );

    }

};


// ======================================
// RETURN FROM PRIVATE CHAT
// ======================================

$("chatBackButton").addEventListener("click", function () {

    selectRoom("global");

});


$("chatBlockButton").addEventListener("click", async function () {


    if (!activeChat.otherUser) return;


    const profile = activeChat.otherUser;


    await window.EOKOpenProfile(profile.id);

});


// ======================================
// INBOX MODAL
// ======================================

function openInbox() {

    $("inboxModal").classList.add("is-open");

    $("inboxModal").setAttribute("aria-hidden","false");

    document.body.style.overflow = "hidden";

    loadInbox();

}


function closeInbox() {

    $("inboxModal").classList.remove("is-open");

    $("inboxModal").setAttribute("aria-hidden","true");

    document.body.style.overflow = "";

}


window.EOKOpenInbox = openInbox;

window.EOKRefreshInbox = loadInbox;


$("inboxModal").addEventListener("click", function (event) {

    if (event.target === this) closeInbox();

});


// ======================================
// LOAD CONVERSATION LIST
// ======================================

async function loadInbox() {


    const container = $("conversationList");

    container.innerHTML = "Loading conversations...";


    const uid = window.EOK_STATE.user.id;


    const {data: conversations,error} = await client

        .from("eok_conversations")

        .select("*")

        .or(`user_one.eq.${uid},user_two.eq.${uid}`)

        .order("last_message_at",{ascending:false})

        .limit(30);


    if (error) {

        container.textContent = "Unable to load conversations.";

        console.error(error);

        return;

    }


    container.innerHTML = "";


    if (!conversations?.length) {

        container.textContent = "No private conversations yet.";

        return;

    }


    for (const conversation of conversations) {


        const otherId =

            conversation.user_one === uid

                ? conversation.user_two

                : conversation.user_one;


        const {data: profile} = await client

            .from("eok_profiles")

            .select("id,username,display_name,avatar_path")

            .eq("id",otherId)

            .maybeSingle();


        if (!profile) continue;


        const row = document.createElement("div");

        row.className = "inbox-player-row";


        const button = document.createElement("button");

        button.className = "mini-action";

        button.textContent = "OPEN";


        button.addEventListener("click", () => {

            window.EOKOpenDirectChat(otherId);

        });


        const info = document.createElement("div");

        info.className = "inbox-player-info";


        const name = document.createElement("strong");

        name.textContent = profile.display_name;


        const user = document.createElement("small");

        user.textContent = "@" + profile.username;


        info.append(name,user);


        row.append(info,button);


        row.addEventListener("click", () => {

            window.EOKOpenProfile(otherId);

        });


        container.appendChild(row);

    }

}


// ======================================
// PLAYER SEARCH
// ======================================

async function searchPlayers(append = false) {


    const query = $("playerSearchInput").value.trim();


    if (!query) {

        $("playerSearchResults").textContent =

            "Type at least one character to search.";

        $("loadMoreSearchButton").hidden = true;

        return;

    }


    if (!append) {

        searchOffset = 0;

        searchQuery = query;

        $("playerSearchResults").innerHTML = "Searching...";

    }


    const {data,error} = await client.rpc(

        "eok_search_players",

        {

            p_query: query,

            p_offset: searchOffset,

            p_limit: 50

        }

    );


    if (error) {

        console.error(error);

        $("playerSearchResults").textContent =

            "Player search unavailable.";

        return;

    }


    if (!append) {

        $("playerSearchResults").innerHTML = "";

    }


    if (!data?.length && !append) {

        $("playerSearchResults").textContent =

            "No matching players found.";

        $("loadMoreSearchButton").hidden = true;

        return;

    }


    data.forEach(player => {


        const row = document.createElement("div");

        row.className = "inbox-player-row";


        const info = document.createElement("div");

        info.className = "inbox-player-info";


        const name = document.createElement("strong");

        name.textContent = player.display_name;


        const username = document.createElement("small");

        username.textContent =

            "@" + player.username +

            " • Level " + player.level;


        info.append(name,username);


        const profileButton = document.createElement("button");

        profileButton.className = "mini-action";

        profileButton.textContent = "PROFILE";


        profileButton.addEventListener("click", () => {

            window.EOKOpenProfile(player.user_id);

        });


        row.addEventListener("click", () => {

            window.EOKOpenProfile(player.user_id);

        });


        row.append(info,profileButton);


        $("playerSearchResults").appendChild(row);

    });


    searchOffset += data.length;


    $("loadMoreSearchButton").hidden = data.length < 50;

}


$("playerSearchInput").addEventListener("input", function () {


    clearTimeout(searchTimer);


    searchTimer = setTimeout(() => {

        searchPlayers(false);

    },250);


});


$("loadMoreSearchButton").addEventListener("click", function () {

    searchPlayers(true);

});


// ======================================
// REAL-TIME SUBSCRIPTION
// ======================================

function subscribeRealtime() {


    if (realtimeChannel) {

        client.removeChannel(realtimeChannel);

    }


    realtimeChannel = client

        .channel("eok-world-chat-" + window.EOK_STATE.user.id)


        .on(

            "postgres_changes",

            {

                event: "INSERT",

                schema: "public",

                table: "eok_messages"

            },


            function (payload) {


                const message = payload.new;


                if (

                    activeChat.type === "global"

                    && message.room_type === "global"

                ) {

                    loadMessages();

                }


                if (

                    activeChat.type === "region"

                    && message.room_type === "region"

                    && message.room_key === activeChat.roomKey

                ) {

                    loadMessages();

                }


                if (

                    activeChat.type === "direct"

                    && message.conversation_id === activeChat.conversationId

                ) {

                    loadMessages();

                }

            }

        )


        .subscribe(status => {

            if (status === "SUBSCRIBED") {

                console.info("EOK: Chat connection established.");

            }

        });

}


// ======================================
// INITIALIZATION
// ======================================

window.EOKChatInit = async function () {


    window.EOKPopulateCountrySelect(

        $("regionSelector"),

        window.EOK_STATE.profile.chat_region || ""

    );


    await selectRoom("global");


    subscribeRealtime();


};


})();
