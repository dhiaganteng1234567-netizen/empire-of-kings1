/* ==========================================
   EMPIRE OF KINGS
   WORLD ATLAS
   VERSION 0.0.1
========================================== */

(function () {

"use strict";


const client = window.EOK_CLIENT;

const $ = id => document.getElementById(id);


const MAP_DATA_URL =

"https://data.gtamapdata.org/data/packages/v1.1/web/global_adm1_2020.geojson";


const STATE_CODES = {

"Alabama":"AL",
"Alaska":"AK",
"Arizona":"AZ",
"Arkansas":"AR",
"California":"CA",
"Colorado":"CO",
"Connecticut":"CT",
"Delaware":"DE",
"Florida":"FL",
"Georgia":"GA",
"Hawaii":"HI",
"Idaho":"ID",
"Illinois":"IL",
"Indiana":"IN",
"Iowa":"IA",
"Kansas":"KS",
"Kentucky":"KY",
"Louisiana":"LA",
"Maine":"ME",
"Maryland":"MD",
"Massachusetts":"MA",
"Michigan":"MI",
"Minnesota":"MN",
"Mississippi":"MS",
"Missouri":"MO",
"Montana":"MT",
"Nebraska":"NE",
"Nevada":"NV",
"New Hampshire":"NH",
"New Jersey":"NJ",
"New Mexico":"NM",
"New York":"NY",
"North Carolina":"NC",
"North Dakota":"ND",
"Ohio":"OH",
"Oklahoma":"OK",
"Oregon":"OR",
"Pennsylvania":"PA",
"Rhode Island":"RI",
"South Carolina":"SC",
"South Dakota":"SD",
"Tennessee":"TN",
"Texas":"TX",
"Utah":"UT",
"Vermont":"VT",
"Virginia":"VA",
"Washington":"WA",
"West Virginia":"WV",
"Wisconsin":"WI",
"Wyoming":"WY"

};


let map;

let geoFeatures = [];

let regions = [];

let selectedRegion = null;

let featureLayer = null;


function properties(feature) {

    return feature.properties || {};

}


function getSourceId(feature) {

    const p = properties(feature);

    return String(

        p.unit_id ||

        p.id ||

        feature.id ||

        (p.iso3 + "-" + p.name)

    );

}


function getName(feature) {

    const p = properties(feature);

    return p.name || p.shapeName || p.NAME || "";

}


function getISO3(feature) {

    const p = properties(feature);

    return String(p.iso3 || p.ISO3 || "");

}


function getCenter(feature) {


    if (feature.bbox && feature.bbox.length === 4) {

        return [

            (feature.bbox[1] + feature.bbox[3]) / 2,

            (feature.bbox[0] + feature.bbox[2]) / 2

        ];

    }


    let lat = 0;

    let lon = 0;

    let count = 0;


    function walk(value) {

        if (!Array.isArray(value)) return;


        if (

            value.length >= 2

            && typeof value[0] === "number"

            && typeof value[1] === "number"

        ) {

            lon += value[0];

            lat += value[1];

            count++;

            return;

        }


        value.forEach(walk);

    }


    walk(feature.geometry.coordinates);


    if (!count) {

        return [0,0];

    }


    return [

        lat / count,

        lon / count

    ];

}


function slug(value) {

    return value

        .normalize("NFD")

        .replace(/[\u0300-\u036f]/g,"")

        .toLowerCase()

        .replace(/[^a-z0-9]+/g,"-")

        .replace(/^-|-$/g,"");

}


async function getWorldSource() {


    const response = await fetch(MAP_DATA_URL);


    if (!response.ok) {

        throw new Error("World dataset download failed.");

    }


    const collection = await response.json();


    if (!Array.isArray(collection.features)) {

        throw new Error("Invalid geographical dataset.");

    }


    return collection.features;

}


function prepareWorldData(features) {


    const states = features.filter(feature =>

        getISO3(feature) === "USA"

        && STATE_CODES[getName(feature)]

    );


    if (states.length !== 50) {

        throw new Error(

            "Expected exactly 50 United States state regions. Received " +

            states.length

        );

    }


    const stateFeatures = states.map(feature => {

        const name = getName(feature);

        const code = STATE_CODES[name];

        const p = properties(feature);

        const center = getCenter(feature);


        return {

            feature,

            source_unit_id: getSourceId(feature),

            region_code: "US-" + code,

            region_name: name,

            country_iso3: "USA",

            center_lat: center[0],

            center_lon: center[1],

            is_kingdom_eligible: true,

            source_name: "GTAmap v1.1",

            source_license: p.src_license || "CHECK_SOURCE"

        };

    });


    const others = features

        .filter(feature =>

            getISO3(feature) !== "USA"

            && getName(feature)

        )

        .sort((a,b) => {

            const aKey =

                getISO3(a) + "|" + getName(a);


            const bKey =

                getISO3(b) + "|" + getName(b);


            return aKey.localeCompare(bKey);

        })


        .slice(0,950)

        .map(feature => {


            const p = properties(feature);

            const name = getName(feature);

            const iso3 = getISO3(feature);

            const sourceId = getSourceId(feature);

            const center = getCenter(feature);


            return {

                feature,

                source_unit_id: sourceId,

                region_code:

                    iso3 + "-" + slug(name) + "-" +

                    sourceId.slice(-8),

                region_name: name,

                country_iso3: iso3,

                center_lat: center[0],

                center_lon: center[1],

                is_kingdom_eligible: false,

                source_name: "GTAmap v1.1",

                source_license: p.src_license || "CHECK_SOURCE"

            };

        });


    const all = [...stateFeatures,...others];


    if (all.length !== 1000) {

        throw new Error(

            "World registry must contain exactly 1,000 regions."

        );

    }


    return all;

}


async function initializeWorld() {


    const {data:userData,error:userError} =

        await client.auth.getUser();


    if (userError || !userData.user) {

        throw new Error("Login required.");

    }


    const {data:badge} = await client

        .from("eok_player_badges")

        .select("badge_code")

        .eq("user_id",userData.user.id)

        .eq("badge_code","developer")

        .maybeSingle();


    $("initializeWorldButton").hidden = !badge;


    geoFeatures = await getWorldSource();


    regions = prepareWorldData(geoFeatures);


    const {data:existing,error} = await client

        .from("eok_world_regions")

        .select("id");


    if (error) throw error;


    if (!existing.length && badge) {

        $("initializeWorldButton").hidden = false;

    }


    if (existing.length === 0) {

        $("mapLoading").querySelector("p").textContent =

            "World registry has not been initialized.";

        return;

    }


    await loadRegions();

}


async function loadRegions() {


    const {data,error} = await client

        .from("eok_world_regions")

        .select("*")

        .order("country_iso3")

        .order("region_name");


    if (error) throw error;


    const {data:ownership,error:ownershipError} = await client

        .from("eok_kingdom_regions")

        .select("region_id,kingdom_id,eok_kingdoms(name,flag_emoji,color_hex)");


    if (ownershipError) {

        console.error(ownershipError);

    }


    const kingdomByRegion = new Map();


    (ownership || []).forEach(item => {

        kingdomByRegion.set(item.region_id,item.eok_kingdoms);

    });


    const regionMap = new Map(

        data.map(item => [item.source_unit_id,item])

    );


    const filtered = geoFeatures.filter(feature =>

        regionMap.has(getSourceId(feature))

    );


    featureLayer = L.geoJSON(

        {

            type:"FeatureCollection",

            features:filtered

        },

        {

            style:feature => {

                const region =

                    regionMap.get(getSourceId(feature));


                const kingdom =

                    region && kingdomByRegion.get(region.id);


                return {

                    color: kingdom?.color_hex ||

                        (region?.is_kingdom_eligible ? "#d8b878" : "#748ba7"),

                    fillColor: kingdom?.color_hex ||

                        (region?.is_kingdom_eligible ? "#9d7946" : "#263c56"),

                    fillOpacity: kingdom ? 0.6 : 0.35,

                    weight: 0.7

                };

            },


            onEachFeature:(feature,layer) => {

                const region =

                    regionMap.get(getSourceId(feature));


                if (!region) return;


                layer.on("click",() => {

                    selectRegion(region);

                });

            }

        }

    ).addTo(map);


    window.EOK_WORLD_REGION_MAP = regionMap;


    $("regionCount").textContent =

        data.length.toLocaleString("en-US") + " / 1,000";


    $("mapLoading").hidden = true;


    renderDirectory(data);

}


function selectRegion(region) {


    selectedRegion = region;


    $("selectedRegionName").textContent =

        region.region_name;


    $("selectedCountry").textContent =

        region.country_iso3;


    $("selectedCode").textContent =

        region.region_code;


    $("selectedEligibility").textContent =

        region.is_kingdom_eligible

            ? "KINGDOM FOUNDING AVAILABLE"

            : "NOT CURRENTLY ELIGIBLE";


    $("selectedOwner").textContent =

        "Check kingdom ownership";


    $("regionFlag").textContent = "🌍";


    $("selectRegionButton").disabled = false;


    client

        .from("eok_player_locations")

        .select("user_id", {count:"exact",head:true})

        .eq("region_id",region.id)

        .then(({count}) => {

            $("selectedPopulation").textContent = count || 0;

        });

}


function renderDirectory(data) {


    const container = $("regionDirectory");

    container.innerHTML = "";


    data.forEach(region => {


        const button = document.createElement("button");

        button.className = "region-directory-item";

        button.textContent =

            region.region_name + " · " +

            region.country_iso3 +

            (

                region.is_kingdom_eligible

                    ? " · KINGDOM"

                    : ""

            );


        button.addEventListener("click",() => {

            selectRegion(region);

            map.setView(

                [region.center_lat,region.center_lon],

                5

            );

        });


        container.appendChild(button);

    });

}


$("regionSearch").addEventListener("input",function () {


    const query = this.value.toLowerCase();


    document

        .querySelectorAll(".region-directory-item")

        .forEach(item => {

            item.hidden =

                !item.textContent.toLowerCase().includes(query);

        });

});


$("initializeWorldButton").addEventListener("click",async function () {


    this.disabled = true;

    this.textContent = "INITIALIZING...";


    try {


        const data = regions.map(region => ({

            source_unit_id:region.source_unit_id,

            region_code:region.region_code,

            region_name:region.region_name,

            country_iso3:region.country_iso3,

            center_lat:region.center_lat,

            center_lon:region.center_lon,

            is_kingdom_eligible:region.is_kingdom_eligible,

            source_name:region.source_name,

            source_license:region.source_license

        }));


        const {data:result,error} = await client.rpc(

            "eok_import_world_regions",

            {p_regions:data}

        );


        if (error) throw error;


        alert("World registry initialized: " + result + " regions.");

        location.reload();


    } catch(error) {


        alert(error.message);

        console.error(error);


    } finally {


        this.disabled = false;

        this.textContent = "INITIALIZE WORLD DATA";

    }

});


$("selectRegionButton").addEventListener("click",async function () {


    if (!selectedRegion) return;


    const {error} = await client.rpc(

        "eok_set_player_region",

        {

            p_region_id:selectedRegion.id

        }

    );


    if (error) {

        alert(error.message);

        return;

    }


    alert(

        "Your current game location is now " +

        selectedRegion.region_name

    );

});


document.addEventListener("DOMContentLoaded",async function () {


    map = L.map("worldMap").setView([25,5],2);


    L.tileLayer(

        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            maxZoom:10,

            attribution:

                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

        }

    ).addTo(map);


    try {

        await initializeWorld();

    } catch(error) {

        console.error(error);

        $("mapLoading").querySelector("p").textContent =

            error.message;

    }

});

})();
