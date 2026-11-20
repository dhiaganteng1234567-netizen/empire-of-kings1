/* ==========================================
   EMPIRE OF KINGS
   COUNTRY DATABASE
   198 GAME COUNTRY OPTIONS
   VERSION 0.0.1
========================================== */

(function () {

    "use strict";

    window.EOK_COUNTRIES = [

        ["Afghanistan","AF"],
        ["Albania","AL"],
        ["Algeria","DZ"],
        ["Andorra","AD"],
        ["Angola","AO"],
        ["Antigua and Barbuda","AG"],
        ["Argentina","AR"],
        ["Armenia","AM"],
        ["Australia","AU"],
        ["Austria","AT"],
        ["Azerbaijan","AZ"],
        ["Bahamas","BS"],
        ["Bahrain","BH"],
        ["Bangladesh","BD"],
        ["Barbados","BB"],
        ["Belarus","BY"],
        ["Belgium","BE"],
        ["Belize","BZ"],
        ["Benin","BJ"],
        ["Bhutan","BT"],
        ["Bolivia","BO"],
        ["Bosnia and Herzegovina","BA"],
        ["Botswana","BW"],
        ["Brazil","BR"],
        ["Brunei","BN"],
        ["Bulgaria","BG"],
        ["Burkina Faso","BF"],
        ["Burundi","BI"],
        ["Cabo Verde","CV"],
        ["Cambodia","KH"],
        ["Cameroon","CM"],
        ["Canada","CA"],
        ["Central African Republic","CF"],
        ["Chad","TD"],
        ["Chile","CL"],
        ["China","CN"],
        ["Colombia","CO"],
        ["Comoros","KM"],
        ["Congo","CG"],
        ["Costa Rica","CR"],
        ["Côte d’Ivoire","CI"],
        ["Croatia","HR"],
        ["Cuba","CU"],
        ["Cyprus","CY"],
        ["Czechia","CZ"],
        ["Denmark","DK"],
        ["Djibouti","DJ"],
        ["Dominica","DM"],
        ["Dominican Republic","DO"],
        ["Democratic Republic of the Congo","CD"],
        ["Ecuador","EC"],
        ["Egypt","EG"],
        ["El Salvador","SV"],
        ["Equatorial Guinea","GQ"],
        ["Eritrea","ER"],
        ["Estonia","EE"],
        ["Eswatini","SZ"],
        ["Ethiopia","ET"],
        ["Fiji","FJ"],
        ["Finland","FI"],
        ["France","FR"],
        ["Gabon","GA"],
        ["Gambia","GM"],
        ["Georgia","GE"],
        ["Germany","DE"],
        ["Ghana","GH"],
        ["Greece","GR"],
        ["Grenada","GD"],
        ["Guatemala","GT"],
        ["Guinea","GN"],
        ["Guinea-Bissau","GW"],
        ["Guyana","GY"],
        ["Haiti","HT"],
        ["Honduras","HN"],
        ["Hungary","HU"],
        ["Iceland","IS"],
        ["India","IN"],
        ["Indonesia","ID"],
        ["Iran","IR"],
        ["Iraq","IQ"],
        ["Ireland","IE"],
        ["Israel","IL"],
        ["Italy","IT"],
        ["Jamaica","JM"],
        ["Japan","JP"],
        ["Jordan","JO"],
        ["Kazakhstan","KZ"],
        ["Kenya","KE"],
        ["Kiribati","KI"],
        ["Kuwait","KW"],
        ["Kyrgyzstan","KG"],
        ["Laos","LA"],
        ["Latvia","LV"],
        ["Lebanon","LB"],
        ["Lesotho","LS"],
        ["Liberia","LR"],
        ["Libya","LY"],
        ["Liechtenstein","LI"],
        ["Lithuania","LT"],
        ["Luxembourg","LU"],
        ["Madagascar","MG"],
        ["Malawi","MW"],
        ["Malaysia","MY"],
        ["Maldives","MV"],
        ["Mali","ML"],
        ["Malta","MT"],
        ["Marshall Islands","MH"],
        ["Mauritania","MR"],
        ["Mauritius","MU"],
        ["Mexico","MX"],
        ["Micronesia","FM"],
        ["Moldova","MD"],
        ["Monaco","MC"],
        ["Mongolia","MN"],
        ["Montenegro","ME"],
        ["Morocco","MA"],
        ["Mozambique","MZ"],
        ["Myanmar","MM"],
        ["Namibia","NA"],
        ["Nauru","NR"],
        ["Nepal","NP"],
        ["Netherlands","NL"],
        ["New Zealand","NZ"],
        ["Nicaragua","NI"],
        ["Niger","NE"],
        ["Nigeria","NG"],
        ["North Korea","KP"],
        ["North Macedonia","MK"],
        ["Norway","NO"],
        ["Oman","OM"],
        ["Pakistan","PK"],
        ["Palau","PW"],
        ["Palestine","PS"],
        ["Panama","PA"],
        ["Papua New Guinea","PG"],
        ["Paraguay","PY"],
        ["Peru","PE"],
        ["Philippines","PH"],
        ["Poland","PL"],
        ["Portugal","PT"],
        ["Qatar","QA"],
        ["Romania","RO"],
        ["Russia","RU"],
        ["Rwanda","RW"],
        ["Saint Kitts and Nevis","KN"],
        ["Saint Lucia","LC"],
        ["Saint Vincent and the Grenadines","VC"],
        ["Samoa","WS"],
        ["San Marino","SM"],
        ["Sao Tome and Principe","ST"],
        ["Saudi Arabia","SA"],
        ["Senegal","SN"],
        ["Serbia","RS"],
        ["Seychelles","SC"],
        ["Sierra Leone","SL"],
        ["Singapore","SG"],
        ["Slovakia","SK"],
        ["Slovenia","SI"],
        ["Solomon Islands","SB"],
        ["Somalia","SO"],
        ["South Africa","ZA"],
        ["South Korea","KR"],
        ["South Sudan","SS"],
        ["Spain","ES"],
        ["Sri Lanka","LK"],
        ["Sudan","SD"],
        ["Suriname","SR"],
        ["Sweden","SE"],
        ["Switzerland","CH"],
        ["Syria","SY"],
        ["Tajikistan","TJ"],
        ["Tanzania","TZ"],
        ["Thailand","TH"],
        ["Timor-Leste","TL"],
        ["Togo","TG"],
        ["Tonga","TO"],
        ["Trinidad and Tobago","TT"],
        ["Tunisia","TN"],
        ["Turkey","TR"],
        ["Turkmenistan","TM"],
        ["Tuvalu","TV"],
        ["Uganda","UG"],
        ["Ukraine","UA"],
        ["United Arab Emirates","AE"],
        ["United Kingdom","GB"],
        ["United States","US"],
        ["Uruguay","UY"],
        ["Uzbekistan","UZ"],
        ["Vanuatu","VU"],
        ["Vatican City","VA"],
        ["Venezuela","VE"],
        ["Vietnam","VN"],
        ["Yemen","YE"],
        ["Zambia","ZM"],
        ["Zimbabwe","ZW"],

        ["Taiwan","TW"],
        ["Kosovo","XK"],
        ["Western Sahara","EH"]

    ];


    // ======================================
    // FLAG EMOJI
    // ======================================

    window.EOKFlagEmoji = function (code) {

        if (!code || !/^[A-Z]{2}$/.test(code)) {

            return "🌐";

        }

        return Array.from(code)

            .map(char =>

                String.fromCodePoint(
                    127397 + char.charCodeAt(0)
                )

            )

            .join("");

    };


    // ======================================
    // COUNTRY NAME
    // ======================================

    window.EOKCountryName = function (code) {

        const country =

            window.EOK_COUNTRIES.find(

                item => item[1] === code

            );


        return country

            ? country[0]

            : "Not selected";

    };


    // ======================================
    // FLAG HTML
    // ======================================

    window.EOKFlagHTML = function (code, className) {

        if (!code || !/^[A-Z]{2}$/.test(code)) {

            return '<span class="flag-empty">🌐</span>';

        }


        const emoji = window.EOKFlagEmoji(code);


        return `

            <span class="${className || "eok-flag"}">

                <img

                    src="https://flagcdn.com/w80/${code.toLowerCase()}.png"

                    alt="${emoji}"

                    loading="lazy"

                    onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"

                >

                <span class="flag-fallback">${emoji}</span>

            </span>

        `;

    };


    // ======================================
    // POPULATE SELECT
    // ======================================

    window.EOKPopulateCountrySelect = function (

        select,

        selectedCode = ""

    ) {

        if (!select) return;


        const placeholder =

            select.dataset.placeholder || "Choose a country";


        select.innerHTML = "";


        const empty = document.createElement("option");

        empty.value = "";

        empty.textContent = placeholder;

        select.appendChild(empty);


        window.EOK_COUNTRIES.forEach(country => {

            const option = document.createElement("option");

            option.value = country[1];

            option.textContent =

                `${window.EOKFlagEmoji(country[1])} ${country[0]}`;


            if (country[1] === selectedCode) {

                option.selected = true;

            }


            select.appendChild(option);

        });

    };


    // ======================================
    // AUTO INITIALIZATION
    // ======================================

    document.addEventListener("DOMContentLoaded", function () {

        document

            .querySelectorAll("[data-country-select]")

            .forEach(select => {

                window.EOKPopulateCountrySelect(

                    select,

                    select.value

                );

            });


        console.info(

            "EOK: Country directory loaded.",

            window.EOK_COUNTRIES.length

        );

    });


})();
