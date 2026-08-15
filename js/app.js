```javascript
/* =========================================================
   MY TOUR MITRA ERP
   APPLICATION CONTROLLER
   File: /js/app.js

   RESPONSIBILITIES
   ---------------------------------------------------------
   - Load Firebase core
   - Load UI core
   - Load Authentication
   - Load module HTML
   - Load module JS
   - Load module CSS
   - Handle navigation
   - Update page title
   - Initialize modules
   - Keep application state
   ========================================================= */

"use strict";


// =========================================================
// GLOBAL ERP OBJECT
// =========================================================

window.MyTourMitraERP =
    window.MyTourMitraERP || {};

window.MyTourMitraERP.version =
    "1.0.0";

window.MyTourMitraERP.modules =
    window.MyTourMitraERP.modules || {};


// =========================================================
// APPLICATION STATE
// =========================================================

window.MyTourMitraERP.state = {

    currentModule: "dashboard",

    currentUser: null,

    initialized: false,

    moduleLoading: false

};


// =========================================================
// MODULE CONFIGURATION
// =========================================================

const MODULE_CONFIG = {

    dashboard: {
        folder: "dashboard",
        html: "dashboard.html",
        js: "dashboard.js",
        css: "dashboard.css",
        title: "Dashboard",
        subtitle: "Travel agency overview"
    },

    customers: {
        folder: "customers",
        html: "customers.html",
        js: "customers.js",
        css: "customers.css",
        title: "Customers",
        subtitle: "Manage customer information"
    },

    enquiries: {
        folder: "enquiries",
        html: "enquiries.html",
        js: "enquiries.js",
        css: "enquiries.css",
        title: "Enquiries",
        subtitle: "Manage travel enquiries"
    },

    followups: {
        folder: "followups",
        html: "followups.html",
        js: "followups.js",
        css: "followups.css",
        title: "Follow-ups",
        subtitle: "Track customer follow-ups"
    },

    packages: {
        folder: "packages",
        html: "packages.html",
        js: "packages.js",
        css: "packages.css",
        title: "Packages",
        subtitle: "Manage travel packages"
    },

    quotations: {
        folder: "quotations",
        html: "quotation.html",
        js: "quotation.js",
        css: "quotations.css",
        title: "Quotations",
        subtitle: "Create and manage quotations"
    },

    bookings: {
        folder: "bookings",
        html: "bookings.html",
        js: "bookings.js",
        css: "bookings.css",
        title: "Bookings",
        subtitle: "Manage tour bookings"
    },

    invoices: {
        folder: "invoices",
        html: "invoices.html",
        js: "invoices.js",
        css: "invoices.css",
        title: "Invoices",
        subtitle: "Manage customer invoices"
    },

    vouchers: {
        folder: "vouchers",
        html: "vouchers.html",
        js: "vouchers.js",
        css: "vouchers.css",
        title: "Vouchers",
        subtitle: "Manage tour vouchers"
    },

    payments: {
        folder: "payments",
        html: "payments.html",
        js: "payments.js",
        css: "payments.css",
        title: "Payments",
        subtitle: "Track received payments and balances"
    },

    expenses: {
        folder: "expenses",
        html: "expenses.html",
        js: "expenses.js",
        css: "expenses.css",
        title: "Expenses",
        subtitle: "Manage business expenses"
    },

    "profit-loss": {
        folder: "profit-loss",
        html: "profit-loss.html",
        js: "profit-loss.js",
        css: "profit-loss.css",
        title: "Profit & Loss",
        subtitle: "Monitor business profitability"
    },

    team: {
        folder: "team",
        html: "team.html",
        js: "team.js",
        css: "team.css",
        title: "Team / Users",
        subtitle: "Manage team members and access"
    },

    settings: {
        folder: "settings",
        html: "settings.html",
        js: "settings.js",
        css: "settings.css",
        title: "Settings",
        subtitle: "Manage ERP settings"
    }

};


// =========================================================
// PATH HELPERS
// =========================================================

function getModuleBasePath(moduleName) {

    const config =
        MODULE_CONFIG[moduleName];

    if (!config) {
        return null;
    }

    return `./modules/${config.folder}/`;

}


// =========================================================
// REGISTER MODULE
// =========================================================

window.MyTourMitraERP.registerModule =
    function (
        moduleName,
        moduleObject
    ) {

        if (
            !moduleName ||
            !moduleObject
        ) {
            return;
        }

        window.MyTourMitraERP.modules[
            moduleName
        ] = moduleObject;

    };


// =========================================================
// GET MODULE
// =========================================================

window.MyTourMitraERP.getModule =
    function (
        moduleName
    ) {

        return (
            window.MyTourMitraERP.modules[
                moduleName
            ] || null
        );

    };


// =========================================================
// LOAD CSS
// =========================================================

function loadModuleCSS(
    moduleName
) {

    const config =
        MODULE_CONFIG[moduleName];

    if (!config || !config.css) {
        return;
    }


    const existing =
        document.querySelector(
            `link[data-module-css="${moduleName}"]`
        );


    if (existing) {
        return;
    }


    const link =
        document.createElement("link");

    link.rel = "stylesheet";

    link.href =
        `${getModuleBasePath(moduleName)}${config.css}`;

    link.dataset.moduleCss =
        moduleName;


    document.head.appendChild(link);

}


// =========================================================
// REMOVE MODULE CSS
// =========================================================

function removeModuleCSS(
    exceptModule
) {

    document
        .querySelectorAll(
            "link[data-module-css]"
        )
        .forEach(
            link => {

                if (
                    link.dataset.moduleCss !==
                    exceptModule
                ) {

                    link.remove();

                }

            }
        );

}


// =========================================================
// LOAD MODULE HTML
// =========================================================

async function loadModuleHTML(
    moduleName
) {

    const config =
        MODULE_CONFIG[moduleName];

    if (!config) {

        throw new Error(
            `Module configuration not found: ${moduleName}`
        );

    }


    const container =
        document.getElementById(
            "module-container"
        );


    if (!container) {

        throw new Error(
            "Module container not found."
        );

    }


    const path =
        `${getModuleBasePath(moduleName)}${config.html}`;


    const response =
        await fetch(path, {
            cache: "no-cache"
        });


    if (!response.ok) {

        throw new Error(
            `Unable to load ${path} (${response.status})`
        );

    }


    const html =
        await response.text();


    container.innerHTML =
        html;


    return true;

}


// =========================================================
// LOAD MODULE JAVASCRIPT
// =========================================================

async function loadModuleJS(
    moduleName
) {

    const config =
        MODULE_CONFIG[moduleName];

    if (!config || !config.js) {
        return;
    }


    const path =
        `${getModuleBasePath(moduleName)}${config.js}`;


    /*
       Import with a cache-busting query.

       This helps during development so that
       updated module files are loaded after
       deployment without forcing a hard-coded
       script element for every module.
    */

    await import(
        `${path}?v=${Date.now()}`
    );

}


// =========================================================
// INITIALIZE MODULE
// =========================================================

function initializeLoadedModule(
    moduleName
) {

    const module =
        window.MyTourMitraERP.getModule(
            moduleName
        );


    if (
        module &&
        typeof module.init === "function"
    ) {

        try {

            module.init();

        } catch (error) {

            console.error(
                `[ERP] Failed to initialize ${moduleName}:`,
                error
            );

        }

    }


    /*
       Some existing module files may initialize
       themselves when loaded.

       Therefore we do not treat absence of
       module.init() as an error.
    */

}


// =========================================================
// SET PAGE HEADER
// =========================================================

function updatePageHeader(
    moduleName
) {

    const config =
        MODULE_CONFIG[moduleName];

    if (!config) {
        return;
    }


    const title =
        document.getElementById(
            "page-title"
        );

    const subtitle =
        document.getElementById(
            "page-subtitle"
        );


    if (title) {

        title.textContent =
            config.title;

    }


    if (subtitle) {

        subtitle.textContent =
            config.subtitle;

    }


    if (
        typeof window.mtmSetPageTitle ===
        "function"
    ) {

        window.mtmSetPageTitle(
            config.title,
            config.subtitle
        );

    }

}


// =========================================================
// SET ACTIVE NAVIGATION
// =========================================================

function updateActiveNavigation(
    moduleName
) {

    document
        .querySelectorAll(
            ".nav-item[data-module]"
        )
        .forEach(
            item => {

                item.classList.toggle(
                    "active",
                    item.dataset.module ===
                    moduleName
                );

            }
        );


    if (
        typeof window.mtmSetActiveNavigation ===
        "function"
    ) {

        window.mtmSetActiveNavigation(
            moduleName
        );

    }

}


// =========================================================
// MODULE LOADING MESSAGE
// =========================================================

function showModuleLoading() {

    const container =
        document.getElementById(
            "module-container"
        );

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="initial-loader">

            <div class="loader-spinner"></div>

            <p>
                Loading module...
            </p>

        </div>

    `;

}


// =========================================================
// MODULE ERROR MESSAGE
// =========================================================

function showModuleError(
    moduleName,
    error
) {

    const container =
        document.getElementById(
            "module-container"
        );

    if (!container) {
        return;
    }


    console.error(
        `[ERP] Module loading failed: ${moduleName}`,
        error
    );


    container.innerHTML = `

        <div class="module-error">

            <div class="module-error-icon">
                !
            </div>

            <h2>
                Unable to load module
            </h2>

            <p>
                ${escapeHTML(
                    error?.message ||
                    "An unexpected error occurred."
                )}
            </p>

            <button
                type="button"
                class="btn btn-primary"
                id="module-retry-button"
            >
                Retry
            </button>

        </div>

    `;


    document
        .getElementById(
            "module-retry-button"
        )
        ?.addEventListener(
            "click",
            () => {

                window.loadModule(
                    moduleName
                );

            }
        );

}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// =========================================================
// MAIN MODULE LOADER
// =========================================================

window.loadModule =
    async function (
        moduleName
    ) {

        if (
            !MODULE_CONFIG[moduleName]
        ) {

            console.error(
                `[ERP] Unknown module: ${moduleName}`
            );

            return false;

        }


        if (
            window.MyTourMitraERP.state.moduleLoading
        ) {

            return false;

        }


        window.MyTourMitraERP.state.moduleLoading =
            true;


        window.MyTourMitraERP.state.currentModule =
            moduleName;


        try {

            showModuleLoading();


            updateActiveNavigation(
                moduleName
            );


            updatePageHeader(
                moduleName
            );


            removeModuleCSS(
                moduleName
            );


            loadModuleCSS(
                moduleName
            );


            await loadModuleHTML(
                moduleName
            );


            await loadModuleJS(
                moduleName
            );


            initializeLoadedModule(
                moduleName
            );


            window.dispatchEvent(
                new CustomEvent(
                    "mytourmitra:module-ready",
                    {
                        detail: {
                            module:
                                moduleName
                        }
                    }
                )
            );


            return true;

        } catch (error) {

            showModuleError(
                moduleName,
                error
            );

            return false;

        } finally {

            window.MyTourMitraERP.state.moduleLoading =
                false;

        }

    };


// =========================================================
// COMPATIBILITY ALIAS
// =========================================================

window.mtmLoadModule =
    window.loadModule;


// =========================================================
// OPEN MODULE
// =========================================================

window.MyTourMitraERP.openModule =
    function (
        moduleName
    ) {

        if (
            !MODULE_CONFIG[moduleName]
        ) {
            return;
        }


        window.MyTourMitraERP.state.currentModule =
            moduleName;


        window.loadModule(
            moduleName
        );

    };


// =========================================================
// NAVIGATION EVENT
// =========================================================

window.addEventListener(
    "mytourmitra:navigate",
    function (
        event
    ) {

        const moduleName =
            event.detail?.module;


        if (!moduleName) {
            return;
        }


        window.loadModule(
            moduleName
        );

    }
);


// =========================================================
// AUTH READY
// =========================================================

window.addEventListener(
    "mytourmitra:auth-ready",
    function (
        event
    ) {

        const user =
            event.detail?.user ||
            event.detail ||
            null;


        window.MyTourMitraERP.state.currentUser =
            user;


        /*
           Load Dashboard after successful login.
        */

        window.loadModule(
            "dashboard"
        );

    }
);


// =========================================================
// FIREBASE / CORE LOADER
// =========================================================

async function loadCoreSystems() {

    /*
       Firebase must load first because Auth
       depends on Firebase.
    */

    try {

        await import(
            "./firebase.js"
        );

        console.log(
            "[ERP] Firebase core loaded."
        );

    } catch (error) {

        console.error(
            "[ERP] Firebase failed to load:",
            error
        );

    }


    /*
       UI system.
    */

    try {

        await import(
            "./ui.js"
        );

        console.log(
            "[ERP] UI core loaded."
        );

    } catch (error) {

        console.error(
            "[ERP] UI failed to load:",
            error
        );

    }


    /*
       Authentication system.

       auth.js uses global window objects,
       so importing it executes the file.
    */

    try {

        await import(
            "./auth.js"
        );

        console.log(
            "[ERP] Authentication core loaded."
        );

    } catch (error) {

        console.error(
            "[ERP] Authentication failed to load:",
            error
        );

    }

}


// =========================================================
// INITIALIZE APPLICATION
// =========================================================

async function initializeApplication() {

    if (
        window.MyTourMitraERP.state.initialized
    ) {

        return;

    }


    console.log(
        "[ERP] Application starting..."
    );


    await loadCoreSystems();


    /*
       UI.js normally initializes itself on
       DOMContentLoaded.

       Because app.js is also a module loaded
       after the HTML has already been parsed,
       initialize it manually if necessary.
    */

    if (
        typeof window.mtmInitializeUI ===
        "function"
    ) {

        window.mtmInitializeUI();

    }


    /*
       Auth.js also initializes itself on
       DOMContentLoaded.

       If the event has already happened,
       initialize it manually.
    */

    if (
        typeof window.initAuth ===
        "function"
    ) {

        window.initAuth();

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

}


// =========================================================
// GLOBAL ERROR HANDLER
// =========================================================

window.addEventListener(
    "error",
    function (
        event
    ) {

        console.error(
            "[ERP ERROR]",
            event.error ||
            event.message
        );

    }
);


// =========================================================
// PROMISE ERROR HANDLER
// =========================================================

window.addEventListener(
    "unhandledrejection",
    function (
        event
    ) {

        console.error(
            "[ERP PROMISE ERROR]",
            event.reason
        );

    }
);


// =========================================================
// START
// =========================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApplication,
        {
            once: true
        }
    );

} else {

    initializeApplication();

}


// =========================================================
// CONSOLE
// =========================================================

console.log(
    "[My Tour Mitra ERP] app.js loaded successfully."
);
```
