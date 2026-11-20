/* ==========================================
   EMPIRE OF KINGS
   INTERFACE LANGUAGE SYSTEM
   VERSION 0.0.1
========================================== */

(function () {

    "use strict";


    const translations = {

        id: {

            overview: "Ringkasan",

            playerProfile: "Profil Pemain",

            globalChat: "Chat Global",

            regionalChat: "Chat Regional",

            messages: "Pesan",

            settings: "Pengaturan",

            logout: "Keluar",

            editProfile: "Edit Profil",

            viewProfile: "Lihat Profil",

            sendMessage: "Kirim pesan",

            searchPlayers: "Cari pemain",

            citizenship: "Kewarganegaraan",

            chatRegion: "Wilayah Chat",

            language: "Bahasa",

            achievements: "Pencapaian",

            badges: "Lencana",

            level: "Level",

            experience: "Pengalaman",

            reputation: "Reputasi"

        },


        en: {

            overview: "Overview",

            playerProfile: "Player Profile",

            globalChat: "Global Chat",

            regionalChat: "Regional Chat",

            messages: "Messages",

            settings: "Settings",

            logout: "Sign Out",

            editProfile: "Edit Profile",

            viewProfile: "View Profile",

            sendMessage: "Send a message",

            searchPlayers: "Search players",

            citizenship: "Citizenship",

            chatRegion: "Chat Region",

            language: "Language",

            achievements: "Achievements",

            badges: "Badges",

            level: "Level",

            experience: "Experience",

            reputation: "Reputation"

        },


        tr: {

            overview: "Genel Bakış",

            playerProfile: "Oyuncu Profili",

            globalChat: "Küresel Sohbet",

            regionalChat: "Bölgesel Sohbet",

            messages: "Mesajlar",

            settings: "Ayarlar",

            logout: "Çıkış Yap",

            editProfile: "Profili Düzenle",

            viewProfile: "Profili Görüntüle",

            sendMessage: "Mesaj gönder",

            searchPlayers: "Oyuncu ara",

            citizenship: "Vatandaşlık",

            chatRegion: "Sohbet Bölgesi",

            language: "Dil",

            achievements: "Başarımlar",

            badges: "Rozetler",

            level: "Seviye",

            experience: "Deneyim",

            reputation: "İtibar"

        }

    };


    window.EOKApplyLanguage = function (language) {

        const lang =

            translations[language]

                ? language

                : "id";


        document.documentElement.lang = lang;


        document

            .querySelectorAll("[data-i18n]")

            .forEach(element => {

                const key = element.dataset.i18n;

                if (translations[lang][key]) {

                    element.textContent =

                        translations[lang][key];

                }

            });


        document

            .querySelectorAll("[data-i18n-placeholder]")

            .forEach(element => {

                const key =

                    element.dataset.i18nPlaceholder;


                if (translations[lang][key]) {

                    element.placeholder =

                        translations[lang][key];

                }

            });


        localStorage.setItem(

            "eok_language",

            lang

        );

    };


    window.EOKTranslations = translations;


})();
