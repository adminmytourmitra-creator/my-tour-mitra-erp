/* =========================================================
   MY TOUR MITRA ERP
   APPLICATION CONTROLLER
   File: /js/app.js
   ========================================================= */

/*
   CORE JS FILES
   ---------------------------------------------------------
   /js/app.js
   /js/auth.js
   /js/config.js
   /js/firebase.js
   /js/ui.js

   MODULES
   ---------------------------------------------------------
   /modules/
*/


// =========================================================
// GLOBAL ERP APPLICATION OBJECT
// =========================================================

window.MyTourMitraERP = window.MyTourMitraERP || {};

window.MyTourMitraERP.version = "1.0.0";

window.MyTourMitraERP.modules = {};


// =========================================================
// APPLICATION STATE
// =========================================================

window.MyTourMitraERP.state = {

    currentModule: "dashboard",

    currentUser: null,

    initialized: false

};


// =========================================================
// MODULE REGISTRY
// =========================================================

window.MyTourMitraERP.registerModule = function (
    moduleName,
    moduleObject
) {

    if (!moduleName || !moduleObject) {
        return;
    }

    window.MyTourMitraERP.modules[moduleName] =
        moduleObject;

};


// =========================================================
// MODULE GETTER
// =========================================================

window.MyTourMitraERP.getModule = function (
    moduleName
) {

    return window.MyTourMitraERP.modules[
        moduleName
    ] || null;

};


// =========================================================
// MODULE INITIALIZER
// =========================================================

window.MyTourMitraERP.initializeModule = function (
    moduleName
) {

    const module =
        window.MyTourMitraERP.getModule(moduleName);

    if (!module) {

        console.warn(
            `[ERP] Module not registered: ${moduleName}`
        );

        return false;

    }


    try {

        if (
            typeof module.init === "function"
        ) {

            module.init();

        }

        return true;

    } catch (error) {

        console.error(
            `[ERP] Failed to initialize ${moduleName}:`,
            error
        );

        return false;

    }

};


// =========================================================
// MODULE NAVIGATION
// =========================================================

window.MyTourMitraERP.openModule = function (
    moduleName
) {

    if (!moduleName) {
        return;
    }


    console.log(
        `[ERP] Opening module: ${moduleName}`
    );


    window.MyTourMitraERP.state.currentModule =
        moduleName;


    /*
       The actual UI navigation is handled by ui.js.

       We dispatch a custom event so that UI/module
       controllers can respond without tightly coupling
       every module together.
    */

    window.dispatchEvent(
        new CustomEvent(
            "mytourmitra:navigate",
            {
                detail: {
                    module: moduleName
                }
            }
        )
    );

};


// =========================================================
// APPLICATION READY EVENT
// =========================================================

window.MyTourMitraERP.ready = function () {

    if (
        window.MyTourMitraERP.state.initialized
    ) {
        return;
    }


    window.MyTourMitraERP.state.initialized =
        true;


    window.dispatchEvent(
        new CustomEvent(
            "mytourmitra:ready"
        )
    );


    console.log(
        "========================================"
    );

    console.log(
        "MY TOUR MITRA ERP"
    );

    console.log(
        "ERP Application Ready"
    );

    console.log(
        "Version:",
        window.MyTourMitraERP.version
    );

    console.log(
        "========================================"
    );

};


// =========================================================
// GLOBAL ERROR HANDLER
// =========================================================

window.addEventListener(
    "error",
    function (event) {

        console.error(
            "[ERP ERROR]",
            event.error || event.message
        );

    }
);


// =========================================================
// PROMISE ERROR HANDLER
// =========================================================

window.addEventListener(
    "unhandledrejection",
    function (event) {

        console.error(
            "[ERP PROMISE ERROR]",
            event.reason
        );

    }
);


// =========================================================
// APPLICATION START
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "[ERP] Application starting..."
        );


        /*
           Core systems are loaded separately through
           index.html.

           app.js acts as the central controller.
        */


        // -------------------------------------------------
        // AUTHENTICATION READY
        // -------------------------------------------------

        window.addEventListener(
            "mytourmitra:auth-ready",
            function (event) {

                if (event.detail) {

                    window.MyTourMitraERP.state.currentUser =
                        event.detail.user || null;

                }

            }
        );


        // -------------------------------------------------
        // UI READY
        // -------------------------------------------------

        window.addEventListener(
            "mytourmitra:ui-ready",
            function () {

                console.log(
                    "[ERP] UI system ready."
                );

            }
        );


        // -------------------------------------------------
        // MODULE READY
        // -------------------------------------------------

        window.addEventListener(
            "mytourmitra:module-ready",
            function (event) {

                if (!event.detail) {
                    return;
                }


                console.log(
                    `[ERP] Module ready: ${event.detail.module}`
                );

            }
        );


        // -------------------------------------------------
        // NAVIGATION
        // -------------------------------------------------

        window.addEventListener(
            "mytourmitra:navigate",
            function (event) {

                if (!event.detail) {
                    return;
                }


                const moduleName =
                    event.detail.module;


                console.log(
                    `[ERP] Navigation requested: ${moduleName}`
                );

            }
        );


        // -------------------------------------------------
        // APPLICATION READY
        // -------------------------------------------------

        window.MyTourMitraERP.ready();

    }
);


// =========================================================
// CONSOLE MESSAGE
// =========================================================

console.log(
    "[My Tour Mitra ERP] app.js loaded successfully."
);
