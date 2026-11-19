// ==========================================
// EMPIRE OF KINGS
// PART 6
// KINGDOM SYSTEM
// GAME VERSION 0.0.1
// ==========================================

(async function () {


    "use strict";


    const db = window.EOK?.supabase;


    if (!db) return;


    const $ = id => document.getElementById(id);


    const state = {

        user: null,

        profile: null,

        regions: [],

        kingdoms: [],

        membership: null,

        selectedRegion: null,

        selectedKingdom: null,

        currentElection: null,

        electionTimer: null,

        finalizing: false

    };



    // ======================================
    // HELPERS
    // ======================================

    function text(id, value) {

        const el = $(id);

        if (el) {

            el.textContent =
                value == null ? "" : String(value);

        }

    }


    function number(value) {

        return Number(value || 0).toLocaleString("id-ID");

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


    function show(id, visible) {

        const el = $(id);

        if (el) {

            el.hidden = !visible;

        }

    }


    function message(id, value, success = true) {

        const el = $(id);

        if (!el) return;

        el.textContent = value;

        el.style.color =
            success ? "#75d9a2" : "#e38a8a";

    }


    function countdown(target) {

        const ms =
            new Date(target).getTime() - Date.now();


        if (ms <= 0) return "Election ended";


        const hours =
            Math.floor(ms / 3600000);


        const minutes =
            Math.floor((ms % 3600000) / 60000);


        const seconds =
            Math.floor((ms % 60000) / 1000);


        return `${hours}h ${minutes}m ${seconds}s`;

    }



    // ======================================
    // AUTHENTICATION
    // ======================================

    const { data: authData, error: authError } =
        await db.auth.getUser();


    if (authError || !authData.user) return;


    state.user = authData.user;



    // ======================================
    // LOAD PLAYER
    // ======================================

    const { data: player, error: playerError } =

        await db

            .from("profiles")

            .select("id,username,account_role,account_status")

            .eq("id", state.user.id)

            .single();


    if (playerError) {

        console.error(playerError);

        return;

    }


    state.profile = player;



    // ======================================
    // LOAD REGIONS
    // ======================================

    async function loadRegions() {


        const { data, error } = await db.rpc(

            "eok_get_world_regions"

        );


        if (error) {

            console.error(error);

            return;

        }


        state.regions = data || [];


    }



    // ======================================
    // LOAD KINGDOMS
    // ======================================

    async function loadKingdoms() {


        const { data, error } = await db

            .from("kingdoms")

            .select("*")

            .order("created_at", {

                ascending: true

            });


        if (error) {

            console.error(error);

            text(
                "kingdom-list",
                "Could not load kingdoms. Check Part 6 SQL."
            );

            return;

        }


        state.kingdoms = data || [];


        renderKingdomList();


        text(
            "kingdom-total-count",
            state.kingdoms.length
        );


        text(
            "kingdom-active-count",

            state.kingdoms.filter(
                x => x.status === "active"
            ).length

        );


        text(
            "kingdom-pending-count",

            state.kingdoms.filter(
                x => x.status === "awaiting_ruler"
            ).length

        );


        await loadMyMembership();


    }



    // ======================================
    // PLAYER MEMBERSHIP
    // ======================================

    async function loadMyMembership() {


        const { data, error } = await db

            .from("kingdom_members")

            .select("*")

            .eq("user_id", state.user.id)

            .maybeSingle();


        if (error) {

            console.error(error);

            return;

        }


        state.membership = data || null;


    }



    // ======================================
    // PLAYER IDENTITIES
    // ======================================

    async function getIdentities(ids) {


        const unique = [

            ...new Set(

                ids.filter(Boolean)

            )

        ];


        if (!unique.length) return new Map();


        const { data, error } = await db.rpc(

            "eok_get_chat_profiles",

            {

                p_user_ids: unique

            }

        );


        if (error) {

            console.error(error);

            return new Map();

        }


        return new Map(

            (data || []).map(

                x => [x.id, x]

            )

        );

    }



    // ======================================
    // RENDER KINGDOM LIST
    // ======================================

    async function renderKingdomList() {


        const container =
            $("kingdom-list");


        container.replaceChildren();


        if (!state.kingdoms.length) {

            container.textContent =
                "No kingdoms have been established yet.";

            return;

        }


        const identities = await getIdentities(

            state.kingdoms.flatMap(

                item => [

                    item.founder_id,

                    item.ruler_user_id

                ]

            )

        );


        for (const kingdom of state.kingdoms) {


            const card =
                document.createElement("article");

            card.className = "kingdom-card";


            card.style.setProperty(

                "--kingdom-color",

                kingdom.banner_color

            );


            const emblem =
                document.createElement("div");

            emblem.className = "kingdom-card-emblem";

            emblem.textContent =
                kingdom.banner_symbol;


            const info =
                document.createElement("div");

            info.className = "kingdom-card-info";


            const name =
                document.createElement("h3");

            name.textContent =
                kingdom.name;


            const region =
                state.regions.find(

                    item =>

                        item.region_id === kingdom.region_id

                );


            const details =
                document.createElement("p");

            details.textContent =

                (region?.name || "Unknown region") +

                " · " +

                kingdom.ideology;


            const status =
                document.createElement("span");

            status.className = "kingdom-status";

            status.textContent =

                kingdom.status === "active"

                    ? "ACTIVE MONARCHY"

                    : "AWAITING RULER";


            const ruler =
                document.createElement("small");


            const rulerProfile =
                identities.get(kingdom.ruler_user_id);


            ruler.textContent = kingdom.ruler_user_id

                ? "King: @" + (
                    rulerProfile?.username || "player"
                )

                : "No ruler appointed";


            const view =
                document.createElement("button");

            view.textContent = "Inspect Kingdom";

            view.className = "kingdom-view-button";


            view.addEventListener(

                "click",

                () => openKingdom(kingdom.id)

            );


            info.appendChild(name);

            info.appendChild(details);

            info.appendChild(status);

            info.appendChild(ruler);


            card.appendChild(emblem);

            card.appendChild(info);

            card.appendChild(view);


            container.appendChild(card);

        }

    }



    // ======================================
    // OPEN KINGDOM
    // ======================================

    async function openKingdom(id) {


        const kingdom = state.kingdoms.find(

            item => item.id === id

        );


        if (!kingdom) return;


        state.selectedKingdom = kingdom;


        show("kingdom-empty-state", false);

        show("kingdom-detail-content", true);

        show("kingdom-detail-panel", true);


        const region = state.regions.find(

            item => item.region_id === kingdom.region_id

        );


        text(
            "kingdom-detail-symbol",
            kingdom.banner_symbol
        );


        text(
            "kingdom-detail-name",
            kingdom.name
        );


        text(
            "kingdom-detail-status",
            kingdom.status.toUpperCase()
        );


        text(
            "kingdom-detail-region",
            region?.name || "Unknown"
        );


        text(
            "kingdom-detail-ideology",
            kingdom.ideology
        );


        text(
            "kingdom-detail-population",
            number(kingdom.population)
        );


        text(
            "kingdom-detail-created",
            formatDate(kingdom.created_at)
        );


        text(
            "kingdom-detail-description",
            kingdom.description || "No description."
        );


        const kingIdentity =

            await getIdentities([

                kingdom.ruler_user_id

            ]);


        const ruler =

            kingIdentity.get(kingdom.ruler_user_id);


        text(

            "kingdom-detail-ruler",

            ruler

                ? "@" + ruler.username

                : "Not appointed"

        );


        await loadKingdomMembers(kingdom.id);

        await renderElection(kingdom.id);


        const isMember =

            state.membership?.kingdom_id === kingdom.id;


        const isRuler =

            kingdom.ruler_user_id === state.user.id;


        show(
            "kingdom-join-button",
            !state.membership && kingdom.status !== "dissolved"
        );


        show(
            "kingdom-leave-button",
            isMember
        );


        show(
            "kingdom-start-election",
            isMember
        );


        show(
            "kingdom-edit-details",
            isRuler ||
            state.profile.account_role === "admin"
        );


        show(
            "admin-king-appointment",
            state.profile.account_role === "admin"
        );


        $("kingdom-edit-name").value =
            kingdom.name;


        $("kingdom-edit-ideology").value =
            kingdom.ideology;


        $("kingdom-edit-description").value =
            kingdom.description || "";


        $("kingdom-edit-banner").value =
            kingdom.banner_symbol;


        $("kingdom-edit-color").value =
            kingdom.banner_color;


    }



    // ======================================
    // LOAD KINGDOM MEMBERS
    // ======================================

    async function loadKingdomMembers(kingdomId) {


        const { data, error } = await db

            .from("kingdom_members")

            .select("kingdom_id,user_id,membership_role,joined_at")

            .eq("kingdom_id", kingdomId)

            .order("joined_at", {

                ascending: true

            });


        if (error) {

            console.error(error);

            return;

        }


        const members = data || [];


        text(
            "kingdom-detail-members",
            number(members.length)
        );


        const identities = await getIdentities(

            members.map(x => x.user_id)

        );


        const list = $("kingdom-member-list");

        list.replaceChildren();


        const select = $("admin-king-select");

        select.replaceChildren();


        for (const member of members) {


            const profile =
                identities.get(member.user_id);


            const row =
                document.createElement("div");

            row.className = "kingdom-member-row";


            const username =
                document.createElement("strong");

            username.textContent =

                profile

                    ? "@" + profile.username

                    : "@player_" +
                        member.user_id.slice(0, 8);


            const role =
                document.createElement("span");

            role.textContent =
                member.membership_role.toUpperCase();


            row.appendChild(username);

            row.appendChild(role);

            list.appendChild(row);


            const option =
                document.createElement("option");


            option.value = member.user_id;


            option.textContent =

                "@" +

                (

                    profile?.username ||

                    member.user_id.slice(0, 8)

                );


            select.appendChild(option);

        }


    }



    // ======================================
    // OPEN CREATE KINGDOM MODAL
    // ======================================

    function openCreateModal(region) {


        if (state.membership) {

            message(
                "region-action-message",
                "You already belong to a kingdom.",
                false
            );

            return;

        }


        if (

            !region ||

            !region.is_foundation_zone ||

            region.region_status !== "available"

        ) {

            return;

        }


        state.selectedRegion = region;


        $("kingdom-create-region").value =
            region.name;


        $("kingdom-create-region-id").value =
            region.region_id;


        $("kingdom-create-form").reset();


        $("kingdom-create-region").value =
            region.name;


        $("kingdom-create-region-id").value =
            region.region_id;


        $("kingdom-create-color").value =
            "#B58C49";


        show("kingdom-create-modal", true);

        document.body.style.overflow = "hidden";


    }



    function closeCreateModal() {

        show("kingdom-create-modal", false);

        document.body.style.overflow = "";

    }



    window.addEventListener(

        "eok:founding-region-selected",

        event => openCreateModal(event.detail)

    );



    $("kingdom-create-close").addEventListener(

        "click",

        closeCreateModal

    );


    $("kingdom-create-backdrop").addEventListener(

        "click",

        closeCreateModal

    );



    // ======================================
    // CREATE KINGDOM
    // ======================================

    $("kingdom-create-form").addEventListener(

        "submit",

        async function (event) {


            event.preventDefault();


            const name =
                $("kingdom-create-name").value.trim();


            const ideology =
                $("kingdom-create-ideology").value.trim();


            const description =
                $("kingdom-create-description").value.trim();


            const regionId = Number(

                $("kingdom-create-region-id").value

            );


            if (!regionId) return;


            $("kingdom-create-submit").disabled = true;


            message(
                "kingdom-create-status",
                "Establishing your kingdom..."
            );


            const { data, error } = await db.rpc(

                "eok_create_kingdom",

                {

                    p_name: name,

                    p_region_id: regionId,

                    p_ideology: ideology,

                    p_description: description,

                    p_banner_symbol:
                        $("kingdom-create-banner").value,

                    p_banner_color:
                        $("kingdom-create-color").value

                }

            );


            $("kingdom-create-submit").disabled = false;


            if (error) {

                console.error(error);

                message(
                    "kingdom-create-status",
                    error.message,
                    false
                );

                return;

            }


            message(
                "kingdom-create-status",
                "Kingdom successfully established!"
            );


            closeCreateModal();


            await loadKingdoms();


            await openKingdom(data);


            window.dispatchEvent(

                new Event("eok:kingdoms-changed")

            );


        }

    );



    // ======================================
    // JOIN KINGDOM
    // ======================================

    $("kingdom-join-button").addEventListener(

        "click",

        async function () {


            if (!state.selectedKingdom) return;


            const { error } = await db.rpc(

                "eok_join_kingdom",

                {

                    p_kingdom_id:
                        state.selectedKingdom.id

                }

            );


            if (error) {

                alert(error.message);

                return;

            }


            await loadKingdoms();

            await openKingdom(
                state.selectedKingdom.id
            );


        }

    );



    // ======================================
    // LEAVE KINGDOM
    // ======================================

    $("kingdom-leave-button").addEventListener(

        "click",

        async function () {


            if (!confirm(
                "Leave this kingdom?"
            )) {

                return;

            }


            const { error } = await db.rpc(

                "eok_leave_kingdom"

            );


            if (error) {

                alert(error.message);

                return;

            }


            await loadKingdoms();


            show(
                "kingdom-detail-content",
                false
            );


            show(
                "kingdom-empty-state",
                true
            );


        }

    );



    // ======================================
    // UPDATE KINGDOM
    // ======================================

    $("kingdom-edit-form").addEventListener(

        "submit",

        async function (event) {


            event.preventDefault();


            if (!state.selectedKingdom) return;


            const { error } = await db.rpc(

                "eok_update_kingdom",

                {

                    p_kingdom_id:
                        state.selectedKingdom.id,

                    p_name:
                        $("kingdom-edit-name").value.trim(),

                    p_ideology:
                        $("kingdom-edit-ideology").value.trim(),

                    p_description:
                        $("kingdom-edit-description").value.trim(),

                    p_banner_symbol:
                        $("kingdom-edit-banner").value,

                    p_banner_color:
                        $("kingdom-edit-color").value

                }

            );


            if (error) {

                message(
                    "kingdom-edit-message",
                    error.message,
                    false
                );

                return;

            }


            message(
                "kingdom-edit-message",
                "Kingdom updated successfully."
            );


            await loadKingdoms();

            await openKingdom(state.selectedKingdom.id);

        }

    );



    // ======================================
    // START ELECTION
    // ======================================

    $("kingdom-start-election").addEventListener(

        "click",

        async function () {


            if (!state.selectedKingdom) return;


            const { data, error } = await db.rpc(

                "eok_start_kingdom_election",

                {

                    p_kingdom_id:
                        state.selectedKingdom.id

                }

            );


            if (error) {

                alert(error.message);

                return;

            }


            alert(
                "Royal election started. It will remain open for 48 hours."
            );


            await renderElection(
                state.selectedKingdom.id
            );


        }

    );



    // ======================================
    // ELECTION DATA
    // ======================================

    async function renderElection(kingdomId) {


        if (state.electionTimer) {

            clearInterval(state.electionTimer);

        }


        const { data, error } = await db.rpc(

            "eok_get_kingdom_election",

            {

                p_kingdom_id: kingdomId

            }

        );


        if (error) {

            console.error(error);

            return;

        }


        const candidates = data || [];


        const container =
            $("kingdom-candidates");


        container.replaceChildren();


        if (!candidates.length) {


            state.currentElection = null;


            text(
                "kingdom-election-status",
                "No election has been started."
            );


            text(
                "kingdom-election-countdown",
                ""
            );


            show(
                "kingdom-nomination-form",
                false
            );


            return;

        }


        const election = candidates[0];


        state.currentElection = election;


        const isOpen =
            election.election_status === "open";


        const member =
            state.membership?.kingdom_id === kingdomId;


        text(

            "kingdom-election-status",

            isOpen

                ? "ROYAL ELECTION — OPEN"

                : "ROYAL ELECTION — CLOSED"

        );


        show(

            "kingdom-nomination-form",

            isOpen && member

        );


        for (const candidate of candidates) {


            if (!candidate.candidate_id) continue;


            const card =
                document.createElement("article");

            card.className = "candidate-card";


            const name =
                document.createElement("strong");

            name.textContent =

                candidate.display_name +

                " · @" +

                candidate.username;


            const statement =
                document.createElement("p");

            statement.textContent =
                candidate.statement || "No candidate statement.";


            const votes =
                document.createElement("span");

            votes.textContent =

                number(candidate.vote_count) +

                " votes";


            card.appendChild(name);

            card.appendChild(statement);

            card.appendChild(votes);


            if (isOpen && member) {


                const vote =
                    document.createElement("button");


                vote.className = "gold-button";

                vote.textContent = "Vote";


                vote.addEventListener(

                    "click",

                    async () => {


                        const { error } = await db.rpc(

                            "eok_vote_kingdom_candidate",

                            {

                                p_election_id:
                                    election.election_id,

                                p_candidate_id:
                                    candidate.candidate_id

                            }

                        );


                        if (error) {

                            alert(error.message);

                            return;

                        }


                        await renderElection(kingdomId);

                    }

                );


                card.appendChild(vote);

            }


            container.appendChild(card);

        }



        // Countdown

        const updateCountdown = async () => {


            if (!isOpen) return;


            const end =
                new Date(election.ends_at).getTime();


            if (Date.now() >= end) {


                text(
                    "kingdom-election-countdown",
                    "Finalizing election..."
                );


                if (!state.finalizing) {

                    state.finalizing = true;


                    const { error } = await db.rpc(

                        "eok_finalize_kingdom_election",

                        {

                            p_election_id:
                                election.election_id

                        }

                    );


                    if (error) {

                        console.error(error);

                    }


                    state.finalizing = false;


                    await loadKingdoms();

                    await openKingdom(kingdomId);

                }


                return;

            }


            text(

                "kingdom-election-countdown",

                "Time Remaining: " +

                countdown(election.ends_at)

            );

        };


        await updateCountdown();


        state.electionTimer = setInterval(

            updateCountdown,

            1000

        );

    }



    // ======================================
    // NOMINATE
    // ======================================

    $("kingdom-nomination-form").addEventListener(

        "submit",

        async function (event) {


            event.preventDefault();


            if (!state.currentElection) return;


            const statement =
                $("kingdom-nomination-statement").value.trim();


            const { error } = await db.rpc(

                "eok_nominate_kingdom_candidate",

                {

                    p_election_id:
                        state.currentElection.election_id,

                    p_statement: statement

                }

            );


            if (error) {

                alert(error.message);

                return;

            }


            $("kingdom-nomination-statement").value = "";


            await renderElection(
                state.selectedKingdom.id
            );


        }

    );



    // ======================================
    // ADMIN APPOINT KING
    // ======================================

    $("admin-appoint-king-button").addEventListener(

        "click",

        async function () {


            if (!state.selectedKingdom) return;


            const target =
                $("admin-king-select").value;


            if (!target) {

                alert("Select a kingdom member.");

                return;

            }


            if (!confirm(
                "Appoint this player as the king?"
            )) {

                return;

            }


            const { error } = await db.rpc(

                "eok_admin_appoint_king",

                {

                    p_kingdom_id:
                        state.selectedKingdom.id,

                    p_target_id: target

                }

            );


            if (error) {

                message(
                    "admin-king-status",
                    error.message,
                    false
                );

                return;

            }


            message(
                "admin-king-status",
                "King successfully appointed."
            );


            await loadKingdoms();

            await openKingdom(
                state.selectedKingdom.id
            );


        }

    );



    // ======================================
    // REFRESH
    // ======================================

    $("refresh-kingdoms").addEventListener(

        "click",

        async function () {

            await loadRegions();

            await loadKingdoms();

        }

    );



    // ======================================
    // INITIALIZATION
    // ======================================

    try {


        await loadRegions();

        await loadKingdoms();


    } catch (error) {


        console.error(error);


        text(
            "kingdom-list",
            "Kingdom system could not be initialized."
        );


    }



    // ======================================
    // REALTIME
    // ======================================

    db

        .channel("eok-kingdom-realtime")

        .on(

            "postgres_changes",

            {

                event: "*",

                schema: "public",

                table: "kingdoms"

            },

            async () => {

                await loadKingdoms();

            }

        )

        .on(

            "postgres_changes",

            {

                event: "*",

                schema: "public",

                table: "kingdom_members"

            },

            async () => {

                await loadKingdoms();

                if (state.selectedKingdom) {

                    await openKingdom(
                        state.selectedKingdom.id
                    );

                }

            }

        )

        .subscribe();



})();
