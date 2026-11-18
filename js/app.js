/* =========================================
   EMPIRE OF KINGS
   MAIN JAVASCRIPT
   VERSION 1.0
========================================= */


/* =========================================
   1. MOBILE NAVIGATION
========================================= */

const menuToggle = document.getElementById("menuToggle");

const mainNav = document.getElementById("mainNav");


if (menuToggle && mainNav) {

    menuToggle.addEventListener("click", function () {

        const isOpen = mainNav.classList.toggle("is-open");

        menuToggle.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

    });


    const navLinks = mainNav.querySelectorAll("a");


    navLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            mainNav.classList.remove("is-open");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

        });

    });

}



/* =========================================
   2. PASSWORD VISIBILITY
========================================= */

const passwordButtons = document.querySelectorAll(
    "[data-password-toggle]"
);


passwordButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const inputId = button.dataset.passwordToggle;

        const input = document.getElementById(inputId);


        if (!input) {

            return;

        }


        if (input.type === "password") {

            input.type = "text";

            button.textContent = "Hide";

            button.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            input.type = "password";

            button.textContent = "Show";

            button.setAttribute(
                "aria-label",
                "Show password"
            );

        }

    });

});



/* =========================================
   3. FORM FEEDBACK
========================================= */

function showFeedback(form, message) {

    const feedback = form.querySelector(
        "[data-form-feedback]"
    );


    if (!feedback) {

        return;

    }


    feedback.textContent = message;

    feedback.hidden = false;

}



/* =========================================
   4. PASSWORD MATCH VALIDATION
========================================= */

const registerPassword = document.getElementById(
    "registerPassword"
);

const confirmPassword = document.getElementById(
    "confirmPassword"
);


function validatePasswordMatch() {

    if (!registerPassword || !confirmPassword) {

        return;

    }


    if (
        confirmPassword.value !== "" &&
        registerPassword.value !== confirmPassword.value
    ) {

        confirmPassword.setCustomValidity(
            "Passwords do not match."
        );

    } else {

        confirmPassword.setCustomValidity("");

    }

}


if (registerPassword && confirmPassword) {

    registerPassword.addEventListener(
        "input",
        validatePasswordMatch
    );


    confirmPassword.addEventListener(
        "input",
        validatePasswordMatch
    );

}



/* =========================================
   5. AUTHENTICATION FORM
========================================= */

const authForms = document.querySelectorAll(
    "[data-auth-form]"
);


authForms.forEach(function (form) {

    form.addEventListener("submit", function (event) {

        event.preventDefault();


        const formType = form.dataset.authForm;


        if (formType === "register") {

            validatePasswordMatch();

        }


        if (!form.checkValidity()) {

            form.reportValidity();

            return;

        }


        if (formType === "login") {

            showFeedback(

                form,

                "The login interface is ready, but account authentication has not been activated yet. Supabase Auth will be connected in Stage 2."

            );

        }


        if (formType === "register") {

            showFeedback(

                form,

                "The registration interface is ready, but account creation has not been activated yet. Real account registration and database storage will be implemented in Stage 2."

            );

        }

    });

});



/* =========================================
   6. PROJECT INITIALIZATION
========================================= */

console.log(
    "EMPIRE OF KINGS - Project initialized."
);

console.log(
    "Version: 1.0"
);

console.log(
    "Current Phase: Stage 1 - Project Foundation"
);

console.log(
    "Authentication: Not connected yet."
);
