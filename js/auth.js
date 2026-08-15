```javascript
/* =========================================================
   MY TOUR MITRA ERP
   AUTHENTICATION CONTROLLER
   File: /js/auth.js

   Handles:
   - Firebase Authentication
   - Login
   - Logout
   - Authentication state
   - Login form
   - Password visibility
   - User information
   - Auth events
   ========================================================= */


// =========================================================
// GLOBAL AUTH OBJECT
// =========================================================

window.MyTourMitraAuth =
    window.MyTourMitraAuth || {};


// =========================================================
// AUTH STATE
// =========================================================

window.MyTourMitraAuth.state = {

    initialized: false,

    loading: false,

    authenticated: false,

    user: null

};


// =========================================================
// GET FIREBASE AUTH
// =========================================================

function getFirebaseAuth() {

    /*
       firebase.js should expose:

           window.firebaseAuth

       This is the preferred method.
    */

    if (window.firebaseAuth) {

        return window.firebaseAuth;

    }


    /*
       Compatibility fallback.
    */

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
            "login-screen"
        );


    const appScreen =
        document.getElementById(
            "main-app"
        );


    if (loginScreen) {

        loginScreen.classList.remove(
            "hidden"
        );

        loginScreen.style.display = "";

    }


    if (appScreen) {

        appScreen.classList.add(
            "hidden"
        );

        appScreen.style.display = "none";

    }

}


// =========================================================
// SHOW APPLICATION
// =========================================================

function showApplication() {

    const loginScreen =
        document.getElementById(
            "login-screen"
        );


    const appScreen =
        document.getElementById(
            "main-app"
        );


    if (loginScreen) {

        loginScreen.classList.add(
            "hidden"
        );

        loginScreen.style.display = "none";

    }


    if (appScreen) {

        appScreen.classList.remove(
            "hidden"
        );

        appScreen.style.display = "";

    }

}


// =========================================================
// AUTH ERROR
// =========================================================

function showAuthError(message) {

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

    errorElement.style.display = "";

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


    errorElement.textContent = "";

    errorElement.classList.add(
        "hidden"
    );

}


// =========================================================
// LOGIN BUTTON STATE
// =========================================================

function setLoginLoading(loading) {

    const loginButton =
        document.getElementById("login-button");

    const loginButtonText =
        document.getElementById("login-button-text");

    const loginButtonLoader =
        document.getElementById("login-button-loader");

    if (!loginButton) {
        return;
    }

    loginButton.disabled = loading;

    if (loading) {

        if (loginButtonText) {
            loginButtonText.textContent =
                "Signing in...";
        }

        if (loginButtonLoader) {
            loginButtonLoader.classList.remove("hidden");
        }

    } else {

        if (loginButtonText) {
            loginButtonText.textContent =
                "Login";
        }

        if (loginButtonLoader) {
            loginButtonLoader.classList.add("hidden");
        }

    }

}

// =========================================================
// FIREBASE ERROR MESSAGE
// =========================================================

function getFriendlyAuthError(error) {

    if (!error) {

        return "Unable to sign in.";

    }


    switch (error.code) {

        case "auth/invalid-email":

            return "Please enter a valid email address.";


        case "auth/user-disabled":

            return "This account has been disabled.";


        case "auth/user-not-found":

            return "No account was found with this email.";


        case "auth/wrong-password":

            return "Incorrect password.";


        case "auth/invalid-credential":

            return "Invalid email or password.";


        case "auth/too-many-requests":

            return "Too many login attempts. Please try again later.";


        case "auth/network-request-failed":

            return "Network error. Please check your internet connection.";


        case "auth/operation-not-allowed":

            return "Email/password login is not enabled in Firebase.";


        default:

            return (
                error.message
                || "Unable to sign in."
            );

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


        email =
            String(email || "").trim();


        password =
            String(password || "");


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
                "Firebase Authentication is not available. Please check firebase.js and Firebase configuration."
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
                    email,
                    password
                );


            const user =
                result.user;


            window.MyTourMitraAuth.state.user =
                user;


            window.MyTourMitraAuth.state.authenticated =
                true;


            showApplication();


            updateUserInterface(
                user
            );


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


            showAuthError(
                getFriendlyAuthError(
                    error
                )
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

            /*
               Even if Firebase is unavailable,
               return the UI to login.
            */

            window.MyTourMitraAuth.state.user =
                null;

            window.MyTourMitraAuth.state.authenticated =
                false;

            showLoginScreen();

            return false;

        }


        try {

            await auth.signOut();


            window.MyTourMitraAuth.state.user =
                null;


            window.MyTourMitraAuth.state.authenticated =
                false;


            showLoginScreen();


            updateUserInterface(
                null
            );


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
// UPDATE USER INTERFACE
// =========================================================

function updateUserInterface(user) {

    const name =
        user && (
            user.displayName
            || user.email
            || "Admin"
        );


    const email =
        user
            ? user.email || ""
            : "";


    const displayName =
        name || "Admin";


    const initial =
        displayName
            .charAt(0)
            .toUpperCase();


    const sidebarName =
        document.getElementById(
            "sidebar-user-name"
        );


    const sidebarRole =
        document.getElementById(
            "sidebar-user-role"
        );


    const sidebarInitial =
        document.getElementById(
            "sidebar-user-initial"
        );


    const topbarName =
        document.getElementById(
            "topbar-user-name"
        );


    const topbarRole =
        document.getElementById(
            "topbar-user-role"
        );


    const topbarInitial =
        document.getElementById(
            "topbar-user-initial"
        );


    if (sidebarName) {

        sidebarName.textContent =
            displayName;

    }


    if (sidebarInitial) {

        sidebarInitial.textContent =
            initial;

    }


    if (topbarName) {

        topbarName.textContent =
            displayName;

    }


    if (topbarInitial) {

        topbarInitial.textContent =
            initial;

    }


    /*
       Role will later come from Firestore
       /users/{uid}.

       For now, keep a safe default.
    */

    if (sidebarRole) {

        sidebarRole.textContent =
            user
                ? "Administrator"
                : "Administrator";

    }


    if (topbarRole) {

        topbarRole.textContent =
            user
                ? "Administrator"
                : "Administrator";

    }


    /*
       Keep email available for future use.
    */

    if (user && email) {

        console.log(
            "[AUTH] Current user:",
            email
        );

    }

}


// =========================================================
// LOGIN FORM
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


    console.log(
        "[AUTH] Login form initialized."
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

            const showing =
                passwordInput.type === "text";


            if (showing) {

                passwordInput.type =
                    "password";

                toggle.textContent =
                    "Show";

                toggle.setAttribute(
                    "aria-label",
                    "Show password"
                );

            } else {

                passwordInput.type =
                    "text";

                toggle.textContent =
                    "Hide";

                toggle.setAttribute(
                    "aria-label",
                    "Hide password"
                );

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


    /*
       Firebase is not available yet.

       Do NOT hide the login screen.
       This is important during initial setup.
    */

    if (!auth) {

        console.warn(
            "[AUTH] Firebase Auth is not available yet."
        );


        showLoginScreen();


        dispatchAuthEvent(
            "mytourmitra:auth-unavailable"
        );


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


                updateUserInterface(
                    user
                );


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


                updateUserInterface(
                    null
                );


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

function initializeLogoutButton() {

    const logoutButton =
        document.getElementById(
            "sidebar-logout"
        );


    if (!logoutButton) {

        console.warn(
            "[AUTH] Logout button not found."
        );

        return;

    }


    logoutButton.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();


            await window.MyTourMitraAuth.logout();

        }
    );


    console.log(
        "[AUTH] Logout button initialized."
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

        initializeLogoutButton();

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
// FINAL MESSAGE
// =========================================================

console.log(
    "[My Tour Mitra ERP] auth.js loaded successfully."
);
```
