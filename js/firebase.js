```javascript
/* =========================================================
   MY TOUR MITRA ERP
   FIREBASE INITIALIZATION
   File: /js/firebase.js

   Handles:
   - Firebase SDK loading
   - Firebase App initialization
   - Firebase Authentication
   - Cloud Firestore
   - Global Firebase instances

   Configuration:
   /js/config.js
   ========================================================= */


// =========================================================
// FIREBASE SDK URLS
// =========================================================

const FIREBASE_APP_SDK =
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js";

const FIREBASE_AUTH_SDK =
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js";

const FIREBASE_FIRESTORE_SDK =
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js";


// =========================================================
// GLOBAL FIREBASE STATE
// =========================================================

window.MyTourMitraFirebase =
    window.MyTourMitraFirebase || {};


window.MyTourMitraFirebase.state = {

    initialized: false,

    sdkLoaded: false,

    authReady: false,

    firestoreReady: false,

    error: null

};


// =========================================================
// LOAD SCRIPT
// =========================================================

function loadFirebaseScript(src) {

    return new Promise(
        function (resolve, reject) {

            /*
               Check whether this script has already
               been loaded.
            */

            const existing =
                document.querySelector(
                    `script[src="${src}"]`
                );


            if (existing) {

                /*
                   If Firebase SDK is already available,
                   continue immediately.
                */

                if (
                    window.firebase
                ) {

                    resolve();

                    return;

                }


                existing.addEventListener(
                    "load",
                    function () {

                        resolve();

                    }
                );


                existing.addEventListener(
                    "error",
                    function () {

                        reject(
                            new Error(
                                "Failed to load Firebase SDK."
                            )
                        );

                    }
                );


                return;

            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                src;

            script.async =
                true;


            script.onload =
                function () {

                    resolve();

                };


            script.onerror =
                function () {

                    reject(
                        new Error(
                            "Unable to load Firebase SDK: "
                            + src
                        )
                    );

                };


            document.head.appendChild(
                script
            );

        }
    );

}


// =========================================================
// GET FIREBASE CONFIG
// =========================================================

function getFirebaseConfig() {

    /*
       config.js should expose:

       window.MyTourMitraConfig.firebase

       Example:

       window.MyTourMitraConfig = {
           firebase: {
               apiKey: "...",
               authDomain: "...",
               projectId: "...",
               storageBucket: "...",
               messagingSenderId: "...",
               appId: "..."
           }
       };
    */


    if (
        window.MyTourMitraConfig &&
        window.MyTourMitraConfig.firebase
    ) {

        return (
            window.MyTourMitraConfig.firebase
        );

    }


    /*
       Compatibility fallback.

       This allows config.js to expose
       window.firebaseConfig instead.
    */

    if (
        window.firebaseConfig
    ) {

        return (
            window.firebaseConfig
        );

    }


    return null;

}


// =========================================================
// VALIDATE FIREBASE CONFIG
// =========================================================

function validateFirebaseConfig(config) {

    if (!config) {

        return {
            valid: false,
            message:
                "Firebase configuration was not found."
        };

    }


    const requiredFields = [

        "apiKey",

        "authDomain",

        "projectId",

        "appId"

    ];


    for (
        const field of requiredFields
    ) {

        if (
            !config[field]
        ) {

            return {
                valid: false,

                message:
                    `Firebase configuration is missing: ${field}`
            };

        }

    }


    return {
        valid: true
    };

}


// =========================================================
// INITIALIZE FIREBASE
// =========================================================

window.MyTourMitraFirebase.init =
    async function () {

        if (
            window.MyTourMitraFirebase.state.initialized
        ) {

            return true;

        }


        try {

            console.log(
                "[FIREBASE] Loading Firebase SDK..."
            );


            // -------------------------------------------------
            // LOAD FIREBASE APP
            // -------------------------------------------------

            await loadFirebaseScript(
                FIREBASE_APP_SDK
            );


            // -------------------------------------------------
            // LOAD AUTH
            // -------------------------------------------------

            await loadFirebaseScript(
                FIREBASE_AUTH_SDK
            );


            // -------------------------------------------------
            // LOAD FIRESTORE
            // -------------------------------------------------

            await loadFirebaseScript(
                FIREBASE_FIRESTORE_SDK
            );


            window.MyTourMitraFirebase.state.sdkLoaded =
                true;


            console.log(
                "[FIREBASE] SDK loaded."
            );


            // -------------------------------------------------
            // CHECK FIREBASE GLOBAL
            // -------------------------------------------------

            if (
                !window.firebase
            ) {

                throw new Error(
                    "Firebase SDK loaded but firebase object is unavailable."
                );

            }


            // -------------------------------------------------
            // GET CONFIG
            // -------------------------------------------------

            const config =
                getFirebaseConfig();


            const validation =
                validateFirebaseConfig(
                    config
                );


            if (
                !validation.valid
            ) {

                throw new Error(
                    validation.message
                );

            }


            // -------------------------------------------------
            // INITIALIZE FIREBASE APP
            // -------------------------------------------------

            let firebaseApp;


            if (
                window.firebase.apps &&
                window.firebase.apps.length > 0
            ) {

                firebaseApp =
                    window.firebase.app();

            } else {

                firebaseApp =
                    window.firebase.initializeApp(
                        config
                    );

            }


            window.firebaseApp =
                firebaseApp;


            window.MyTourMitraFirebase.app =
                firebaseApp;


            console.log(
                "[FIREBASE] Firebase App initialized."
            );


            // -------------------------------------------------
            // AUTH
            // -------------------------------------------------

            if (
                typeof window.firebase.auth
                === "function"
            ) {

                window.firebaseAuth =
                    window.firebase.auth();


                window.MyTourMitraFirebase.auth =
                    window.firebaseAuth;


                window.MyTourMitraFirebase.state.authReady =
                    true;


                console.log(
                    "[FIREBASE] Authentication ready."
                );

            }


            // -------------------------------------------------
            // FIRESTORE
            // -------------------------------------------------

            if (
                typeof window.firebase.firestore
                === "function"
            ) {

                window.firebaseDB =
                    window.firebase.firestore();


                window.MyTourMitraFirebase.db =
                    window.firebaseDB;


                window.MyTourMitraFirebase.state.firestoreReady =
                    true;


                console.log(
                    "[FIREBASE] Firestore ready."
                );

            }


            // -------------------------------------------------
            // VALIDATE SERVICES
            // -------------------------------------------------

            if (
                !window.firebaseAuth
            ) {

                console.warn(
                    "[FIREBASE] Firebase Auth is unavailable."
                );

            }


            if (
                !window.firebaseDB
            ) {

                console.warn(
                    "[FIREBASE] Firestore is unavailable."
                );

            }


            // -------------------------------------------------
            // MARK INITIALIZED
            // -------------------------------------------------

            window.MyTourMitraFirebase.state.initialized =
                true;


            window.MyTourMitraFirebase.state.error =
                null;


            // -------------------------------------------------
            // DISPATCH READY EVENT
            // -------------------------------------------------

            window.dispatchEvent(
                new CustomEvent(
                    "mytourmitra:firebase-ready",
                    {
                        detail: {

                            app:
                                window.firebaseApp,

                            auth:
                                window.firebaseAuth
                                || null,

                            db:
                                window.firebaseDB
                                || null

                        }
                    }
                )
            );


            console.log(
                "[FIREBASE] Firebase initialization completed."
            );


            return true;


        } catch (error) {

            console.error(
                "[FIREBASE] Initialization failed:",
                error
            );


            window.MyTourMitraFirebase.state.error =
                error;


            window.MyTourMitraFirebase.state.initialized =
                false;


            /*
               Dispatch error event.

               The application can continue loading
               and show the login screen instead of
               becoming completely blank.
            */

            window.dispatchEvent(
                new CustomEvent(
                    "mytourmitra:firebase-error",
                    {
                        detail: {
                            error: error
                        }
                    }
                )
            );


            return false;

        }

    };


// =========================================================
// GET AUTH
// =========================================================

window.MyTourMitraFirebase.getAuth =
    function () {

        return (
            window.firebaseAuth
            || null
        );

    };


// =========================================================
// GET FIRESTORE
// =========================================================

window.MyTourMitraFirebase.getFirestore =
    function () {

        return (
            window.firebaseDB
            || null
        );

    };


// =========================================================
// FIREBASE READY EVENT
// =========================================================

window.addEventListener(
    "mytourmitra:firebase-ready",
    function () {

        console.log(
            "[FIREBASE] Ready event received."
        );

    }
);


// =========================================================
// FIREBASE ERROR EVENT
// =========================================================

window.addEventListener(
    "mytourmitra:firebase-error",
    function (event) {

        console.error(
            "[FIREBASE] Firebase error:",
            event.detail
                ? event.detail.error
                : "Unknown error"
        );

    }
);


// =========================================================
// START FIREBASE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "[FIREBASE] Starting Firebase..."
        );


        /*
           config.js must be loaded before this file.
        */

        await window.MyTourMitraFirebase.init();

    }
);


// =========================================================
// FINAL MESSAGE
// =========================================================

console.log(
    "[My Tour Mitra ERP] firebase.js loaded successfully."
);
```
