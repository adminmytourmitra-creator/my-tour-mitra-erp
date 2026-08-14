/* =========================================================
   MY TOUR MITRA ERP
   AUTHENTICATION CONTROLLER
   File: /js/auth.js
   ========================================================= */


/*
   Firebase Authentication is initialized in:

       /js/firebase.js

   Firebase configuration is stored in:

       /js/config.js

   This file handles:

   - Login
   - Logout
   - Authentication state
   - Current user
   - Login form
   - Password visibility
   - Auth events
*/


// =========================================================
// AUTH STATE
// =========================================================

window.MyTourMitraAuth =
    window.MyTourMitraAuth || {};


// =========================================================
// INTERNAL STATE
// =========================================================

window.MyTourMitraAuth.state = {

    initialized: false,

    loading: false,

    authenticated: false,

    user: null

};


// =========================================================
// FIREBASE AUTH INSTANCE
// =========================================================

function getFirebaseAuth() {

    /*
       firebase.js should expose the Firebase auth
       instance globally as:

           window.firebaseAuth

       If it is not available yet, try Firebase
       compat API as fallback.
    */

    if (window.firebaseAuth) {

        return window.firebaseAuth;

    }


    if (
        window.firebase &&
        typeof window.firebase.auth === "function"
    ) {

        return window.firebase.auth();

    }


    return null;

}


// =========================================================
// GET CURRENT USER
// =========================================================

window.MyTourMitraAuth.getCurrentUser =
    function () {

        return (
            window.MyTourMitraAuth.state.user
            || null
        );

    };


// =========================================================
// CHECK AUTHENTICATION
// =========================================================

window.MyTourMitraAuth.isAuthenticated =
    function () {

        return (
            window.MyTourMitraAuth.state.authenticated
            === true
        );

    };


// =========================================================
// DISPATCH AUTH EVENT
// =========================================================

function dispatchAuthEvent(
    eventName,
    user = null
) {

    window.dispatchEvent(
        new CustomEvent(
            eventName,
            {
                detail: {
                    user: user
                }
            }
        )
    );

}


// =========================================================
// SHOW LOGIN SCREEN
// =========================================================

function showLoginScreen() {

    const loginScreen =
        document.getElementById(
            "screen-login"
        );

    const appScreen =
        document.getElementById(
            "screen-app"
        );


    if (loginScreen) {

        loginScreen.classList.remove(
            "hidden"
        );

        loginScreen.style.display =
            "";

    }


    if (appScreen) {

        appScreen.classList.add(
            "hidden"
        );

        appScreen.style.display =
            "none";

    }

}


// =========================================================
// SHOW APPLICATION
// =========================================================

function showApplication() {

    const loginScreen =
        document.getElementById(
            "screen-login"
        );

    const appScreen =
        document.getElementById(
            "screen-app"
        );


    if (loginScreen) {

        loginScreen.classList.add(
            "hidden"
        );

        loginScreen.style.display =
            "none";

    }


    if (appScreen) {

        appScreen.classList.remove(
            "hidden"
        );

        appScreen.style.display =
            "";

    }

}


// =========================================================
// AUTH ERROR MESSAGE
// =========================================================

function showAuthError(
    message
) {

    const errorElement =
        document.getElementById(
            "login-error"
        );


    if (!errorElement) {

        console.error(
            "[AUTH]",
            message
        );

        return;

    }


    errorElement.textContent =
        message;

    errorElement.classList.remove(
        "hidden"
    );


    errorElement.style.display =
        "";


}


// =========================================================
// CLEAR AUTH ERROR
// =========================================================

function clearAuthError() {

    const errorElement =
        document.getElementById(
            "login-error"
        );


    if (!errorElement) {
        return;
    }


    errorElement.textContent =
        "";

    errorElement.classList.add(
        "hidden"
    );

}


// =========================================================
// LOGIN BUTTON STATE
// =========================================================

function setLoginLoading(
    loading
) {

    const loginButton =
        document.getElementById(
            "login-submit"
        );


    if (!loginButton) {
        return;
    }


    loginButton.disabled =
        loading;


    if (loading) {

        loginButton.dataset.originalText =
            loginButton.textContent;

        loginButton.textContent =
            "Signing in...";

    } else {

        loginButton.textContent =
            loginButton.dataset.originalText
            || "Sign In";

    }

}


// =========================================================
// LOGIN
// =========================================================

window.MyTourMitraAuth.login =
    async function (
        email,
        password
    ) {

        clearAuthError();


        if (!email) {

            showAuthError(
                "Please enter your email address."
            );

            return false;

        }


        if (!password) {

            showAuthError(
                "Please enter your password."
            );

            return false;

        }


        const auth =
            getFirebaseAuth();


        if (!auth) {

            showAuthError(
                "Authentication service is not available."
            );

            console.error(
                "[AUTH] Firebase Auth instance not found."
            );

            return false;

        }


        try {

            window.MyTourMitraAuth.state.loading =
                true;


            setLoginLoading(
                true
            );


            const result =
                await auth.signInWithEmailAndPassword(
                    email.trim(),
                    password
                );


            const user =
                result.user;


            window.MyTourMitraAuth.state.user =
                user;

            window.MyTourMitraAuth.state.authenticated =
                true;


            showApplication();


            dispatchAuthEvent(
                "mytourmitra:auth-ready",
                user
            );


            dispatchAuthEvent(
                "mytourmitra:login-success",
                user
            );


            console.log(
                "[AUTH] Login successful:",
                user.email
            );


            return true;


        } catch (error) {

            console.error(
                "[AUTH] Login failed:",
                error
            );


            let message =
                "Unable to sign in.";


            switch (
                error.code
            ) {

                case "auth/invalid-email":

                    message =
                        "Please enter a valid email address.";

                    break;


                case "auth/user-disabled":

                    message =
                        "This account has been disabled.";

                    break;


                case "auth/user-not-found":

                    message =
                        "No account was found with this email.";

                    break;


                case "auth/wrong-password":

                    message =
                        "Incorrect password.";

                    break;


                case "auth/invalid-credential":

                    message =
                        "Invalid email or password.";

                    break;


                case "auth/too-many-requests":

                    message =
                        "Too many login attempts. Please try again later.";

                    break;


                case "auth/network-request-failed":

                    message =
                        "Network error. Please check your internet connection.";

                    break;


                default:

                    if (
                        error.message
                    ) {

                        message =
                            error.message;

                    }

            }


            showAuthError(
                message
            );


            return false;


        } finally {

            window.MyTourMitraAuth.state.loading =
                false;


            setLoginLoading(
                false
            );

        }

    };


// =========================================================
// LOGOUT
// =========================================================

window.MyTourMitraAuth.logout =
    async function () {

        const auth =
            getFirebaseAuth();


        if (!auth) {

            console.error(
                "[AUTH] Firebase Auth instance not found."
            );

            return false;

        }


        try {

            await auth.signOut();


            window.MyTourMitraAuth.state.user =
                null;

            window.MyTourMitraAuth.state.authenticated =
                false;


            showLoginScreen();


            dispatchAuthEvent(
                "mytourmitra:logout"
            );


            console.log(
                "[AUTH] User logged out."
            );


            return true;


        } catch (error) {

            console.error(
                "[AUTH] Logout failed:",
                error
            );


            return false;

        }

    };


// =========================================================
// LOGIN FORM HANDLER
// =========================================================

function initializeLoginForm() {

    const form =
        document.getElementById(
            "login-form"
        );


    if (!form) {

        console.warn(
            "[AUTH] Login form not found."
        );

        return;

    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const emailInput =
                document.getElementById(
                    "login-email"
                );


            const passwordInput =
                document.getElementById(
                    "login-password"
                );


            const email =
                emailInput
                    ? emailInput.value
                    : "";


            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            await window.MyTourMitraAuth.login(
                email,
                password
            );

        }
    );

}


// =========================================================
// PASSWORD VISIBILITY
// =========================================================

function initializePasswordToggle() {

    const toggle =
        document.getElementById(
            "toggle-password"
        );


    const passwordInput =
        document.getElementById(
            "login-password"
        );


    if (
        !toggle ||
        !passwordInput
    ) {

        return;

    }


    toggle.addEventListener(
        "click",
        function () {

            if (
                passwordInput.type
                === "password"
            ) {

                passwordInput.type =
                    "text";


                toggle.textContent =
                    "Hide";

            } else {

                passwordInput.type =
                    "password";


                toggle.textContent =
                    "Show";

            }

        }
    );

}


// =========================================================
// AUTH STATE LISTENER
// =========================================================

function initializeAuthStateListener() {

    const auth =
        getFirebaseAuth();


    if (!auth) {

        console.error(
            "[AUTH] Firebase Auth is not available."
        );

        showLoginScreen();

        return;

    }


    auth.onAuthStateChanged(
        function (user) {

            if (user) {

                window.MyTourMitraAuth.state.user =
                    user;

                window.MyTourMitraAuth.state.authenticated =
                    true;


                showApplication();


                dispatchAuthEvent(
                    "mytourmitra:auth-ready",
                    user
                );


                console.log(
                    "[AUTH] Authenticated:",
                    user.email
                );


            } else {

                window.MyTourMitraAuth.state.user =
                    null;

                window.MyTourMitraAuth.state.authenticated =
                    false;


                showLoginScreen();


                dispatchAuthEvent(
                    "mytourmitra:auth-logout"
                );


                console.log(
                    "[AUTH] No authenticated user."
                );

            }

        }
    );

}


// =========================================================
// LOGOUT BUTTON
// =========================================================

function initializeLogoutButtons() {

    const logoutButtons =
        document.querySelectorAll(
            "[data-action='logout'], #logout-button, .logout-button"
        );


    logoutButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                async function (event) {

                    event.preventDefault();


                    await window.MyTourMitraAuth.logout();

                }
            );

        }
    );

}


// =========================================================
// AUTH INITIALIZATION
// =========================================================

window.MyTourMitraAuth.init =
    function () {

        if (
            window.MyTourMitraAuth.state.initialized
        ) {

            return;

        }


        window.MyTourMitraAuth.state.initialized =
            true;


        initializeLoginForm();

        initializePasswordToggle();

        initializeLogoutButtons();

        initializeAuthStateListener();


        dispatchAuthEvent(
            "mytourmitra:auth-initialized"
        );


        console.log(
            "[AUTH] Authentication system initialized."
        );

    };


// =========================================================
// GLOBAL COMPATIBILITY FUNCTION
// =========================================================

window.initAuth =
    window.MyTourMitraAuth.init;


// =========================================================
// START AUTH
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        window.MyTourMitraAuth.init();

    }
);


// =========================================================
// READY MESSAGE
// =========================================================

console.log(
    "[My Tour Mitra ERP] auth.js loaded successfully."
);
