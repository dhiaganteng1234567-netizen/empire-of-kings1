// ==========================================
// EMPIRE OF KINGS
// PART 5
// WORLD MAP
// GAME VERSION 0.0.1
// ==========================================

(function () {

    "use strict";


    const db = window.EOK?.supabase;

    if (!db) return;


    const svg =
        document.getElementById("world-map-svg");


    if (!svg) return;


    const NS =
        "http://www.w3.org/2000/svg";


    let regions = [];

    let kingdoms = [];

    let selectedRegion = null;


    const layouts = [

        {

            continent: "Aurelia",

            startId: 1,

            centerX: 300,

            rows: [3, 4, 5, 5, 4, 4]

        },

        {

            continent: "Veyra",

            startId: 26,

            centerX: 880,

            rows: [4, 4, 5, 4, 4, 4]

        }

    ];


    function element(name, attributes = {}) {

        const node =
            document.createElementNS(NS, name);


        Object.entries(attributes).forEach(([key, value]) => {

            node.setAttribute(key, value);

        });


        return node;

    }


    function setText(id, value) {

        const node = document.getElementById(id);

        if (node) {

            node.textContent =
                value == null ? "" : String(value);

        }

    }


    function countdown(target) {

        if (!target) return "No countdown scheduled";


        const remaining =
            new Date(target).getTime() - Date.now();


        if (remaining <= 0) {

            return "Unlocking...";

        }


        const days =
            Math.floor(remaining / 86400000);


        const hours =
            Math.floor((remaining % 86400000) / 3600000);


        const minutes =
            Math.floor((remaining % 3600000) / 60000);


        const seconds =
            Math.floor((remaining % 60000) / 1000);


        return `${days}d ${hours}h ${minutes}m ${seconds}s`;

    }


    function getStatusLabel(region) {

        if (region.region_status === "claimed") {

            return "Kingdom Territory";

        }


        if (region.region_status === "event_locked") {

            return "Locked — Awaiting Event";

        }


        if (region.is_foundation_zone) {

            return "Founding Region";

        }


        return "Available Region";

    }


    function getOwner(region) {

        if (!region.kingdom_id) return "No Kingdom";


        const kingdom = kingdoms.find(

            item => item.id === region.kingdom_id

        );


        return kingdom?.name || "Kingdom Territory";

    }


    function regionColor(region) {

        if (region.region_status === "claimed") {

            return "#713f50";

        }


        if (region.region_status === "event_locked") {

            return "#34475c";

        }


        if (region.is_foundation_zone) {

            return "#a9894e";

        }


        return "#617a6f";

    }


    function drawMap() {


        svg.replaceChildren();


        const background = element(

            "rect",

            {

                x: 0,

                y: 0,

                width: 1200,

                height: 500,

                rx: 18,

                class: "map-background"

            }

        );


        svg.appendChild(background);


        const seaDecoration = element(

            "text",

            {

                x: 600,

                y: 465,

                "text-anchor": "middle",

                class: "map-sea-label"

            }

        );


        seaDecoration.textContent =
            "THE GRAND SEA";


        svg.appendChild(seaDecoration);


        let currentId = 1;


        for (const continent of layouts) {


            const heading = element(

                "text",

                {

                    x: continent.centerX,

                    y: 36,

                    "text-anchor": "middle",

                    class: "continent-label"

                }

            );


            heading.textContent =
                continent.continent.toUpperCase();


            svg.appendChild(heading);


            for (

                let row = 0;

                row < continent.rows.length;

                row++

            ) {


                const count =
                    continent.rows[row];


                const gap = 65;


                const offset =
                    row % 2 === 1 ? 15 : 0;


                const rowStart =

                    continent.centerX -

                    ((count - 1) * gap) / 2 +

                    offset;


                for (

                    let col = 0;

                    col < count;

                    col++

                ) {


                    const region = regions.find(

                        item => item.region_id === currentId

                    );


                    const cx =
                        rowStart + col * gap;


                    const cy =
                        88 + row * 62;


                    const points = [];


                    for (let i = 0; i < 6; i++) {


                        const angle =

                            (-90 + i * 60) *

                            Math.PI / 180;


                        const x =
                            cx + Math.cos(angle) * 36;


                        const y =
                            cy + Math.sin(angle) * 36;


                        points.push(
                            `${x},${y}`
                        );

                    }


                    if (region) {


                        const group = element("g", {

                            class:
                                "region-group region-" +
                                region.region_status,

                            "data-region-id":
                                region.region_id

                        });


                        const polygon = element(

                            "polygon",

                            {

                                points: points.join(" "),

                                fill: regionColor(region),

                                class: "region-polygon",

                                tabindex: "0",

                                role: "button"

                            }

                        );


                        const title = element("title");

                        title.textContent =

                            region.name +

                            " — " +

                            getStatusLabel(region);


                        polygon.appendChild(title);


                        polygon.addEventListener(

                            "click",

                            () => selectRegion(region.region_id)

                        );


                        polygon.addEventListener(

                            "keydown",

                            event => {

                                if (

                                    event.key === "Enter" ||

                                    event.key === " "

                                ) {

                                    event.preventDefault();

                                    selectRegion(region.region_id);

                                }

                            }

                        );


                        const label = element(

                            "text",

                            {

                                x: cx,

                                y: cy + 4,

                                "text-anchor": "middle",

                                class: "region-number"

                            }

                        );


                        label.textContent =
                            String(region.region_id);


                        group.appendChild(polygon);

                        group.appendChild(label);


                        svg.appendChild(group);


                    }


                    currentId++;

                }

            }

        }


        applyFilter();

    }



    function applyFilter() {


        const filter =
            document.getElementById("world-filter")?.value || "all";


        svg.querySelectorAll(".region-group").forEach(group => {


            const id =
                Number(group.dataset.regionId);


            const region = regions.find(

                item => item.region_id === id

            );


            group.style.display =

                filter === "all" ||

                region?.region_status === filter

                    ? ""

                    : "none";


        });

    }



    async function loadKingdomNames() {


        const { data, error } = await db

            .from("kingdoms")

            .select("id,name");


        if (error) {

            console.warn(error);

            kingdoms = [];

            return;

        }


        kingdoms = data || [];

    }



    async function loadWorld() {


        setText(
            "selected-region-description",
            "Loading world regions..."
        );


        const { data, error } = await db.rpc(

            "eok_get_world_regions"

        );


        if (error) {

            console.error(error);

            setText(
                "selected-region-description",
                "Unable to load the world map. Check Part 5 SQL."
            );

            return;

        }


        regions = data || [];


        await loadKingdomNames();


        setText(
            "world-total-regions",
            regions.length
        );


        setText(
            "world-foundation-count",

            regions.filter(
                x => x.is_foundation_zone
            ).length

        );


        setText(
            "world-locked-count",

            regions.filter(
                x => x.region_status === "event_locked"
            ).length

        );


        drawMap();


        if (selectedRegion) {

            selectRegion(selectedRegion.region_id);

        }

    }



    function selectRegion(id) {


        const region = regions.find(

            item => item.region_id === id

        );


        if (!region) return;


        selectedRegion = region;


        setText(
            "selected-region-name",
            region.name
        );


        setText(
            "selected-region-continent",
            region.continent
        );


        setText(
            "selected-region-id",
            region.region_id
        );


        setText(
            "selected-region-status",
            getStatusLabel(region)
        );


        setText(
            "selected-region-owner",
            getOwner(region)
        );


        const description =
            document.getElementById(
                "selected-region-description"
            );


        const countdownBox =
            document.getElementById("region-countdown");


        countdownBox.textContent = "";


        if (region.region_status === "claimed") {


            description.textContent =

                "This land is currently part of a kingdom.";


        } else if (region.region_status === "event_locked") {


            description.textContent =

                "This region is awaiting a world event before becoming available.";


            if (region.unlock_at) {

                countdownBox.textContent =

                    (region.unlock_event_title || "Region Opening") +

                    ": " +

                    countdown(region.unlock_at);

            } else {

                countdownBox.textContent =
                    "Waiting for an event schedule.";

            }


        } else if (region.is_foundation_zone) {


            description.textContent =

                "This territory is available for the establishment of a new kingdom.";


        } else {


            description.textContent =

                "This region is available. Kingdom expansion will be implemented in a later stage.";

        }



        const button =
            document.getElementById("found-kingdom-button");


        button.hidden = !(

            region.is_foundation_zone &&

            region.region_status === "available" &&

            !region.kingdom_id

        );


        svg.querySelectorAll(".region-group").forEach(group => {


            const polygon =
                group.querySelector("polygon");


            if (

                Number(group.dataset.regionId) === id

            ) {

                polygon.classList.add("selected");

            } else {

                polygon.classList.remove("selected");

            }

        });


    }



    document.getElementById("world-filter")

        ?.addEventListener(

            "change",

            applyFilter

        );



    document.getElementById("found-kingdom-button")

        ?.addEventListener(

            "click",

            function () {


                if (!selectedRegion) return;


                window.dispatchEvent(

                    new CustomEvent(

                        "eok:founding-region-selected",

                        {

                            detail: selectedRegion

                        }

                    )

                );

            }

        );



    // ======================================
    // COUNTDOWN DISPLAY
    // ======================================

    setInterval(

        function () {

            if (

                selectedRegion &&

                selectedRegion.unlock_at &&

                selectedRegion.region_status === "event_locked"

            ) {

                document.getElementById(

                    "region-countdown"

                ).textContent =

                    (

                        selectedRegion.unlock_event_title ||

                        "Region Opening"

                    ) +

                    ": " +

                    countdown(selectedRegion.unlock_at);

            }

        },

        1000

    );



    // ======================================
    // INITIALIZE
    // ======================================

    loadWorld();


    setInterval(

        loadWorld,

        60000

    );


    window.addEventListener(

        "eok:kingdoms-changed",

        loadWorld

    );


    window.EOK = window.EOK || {};

    window.EOK.reloadWorld = loadWorld;


})();
