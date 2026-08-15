```javascript
/* =========================================================
   MY TOUR MITRA ERP
   APPLICATION CONTROLLER
   File: /js/app.js

   PURPOSE
   ---------------------------------------------------------
   1. Start the ERP application
   2. Handle sidebar navigation
   3. Handle mobile sidebar
   4. Update page title
   5. Provide global ERP object
   6. Keep startup simple and stable

   Firebase authentication is handled separately by auth.js.
   ========================================================= */


// =========================================================
// GLOBAL ERP OBJECT
// =========================================================

window.MyTourMitraERP =
    window.MyTourMitraERP || {};


// =========================================================
// APPLICATION VERSION
// =========================================================

window.MyTourMitraERP.version = "1.0.0";


// =========================================================
// APPLICATION STATE
// =========================================================

window.MyTourMitraERP.state = {

    initialized: false,

    currentModule: "dashboard",

    currentUser: null

};


// =========================================================
// MODULE REGISTRY
// =========================================================

window.MyTourMitraERP.modules =
    window.MyTourMitraERP.modules || {};


// =========================================================
// REGISTER MODULE
// =========================================================

window.MyTourMitraERP.registerModule =
    function (moduleName, moduleObject) {

        if (!moduleName || !moduleObject) {
            return;
        }

        window.MyTourMitraERP.modules[moduleName] =
            moduleObject;

        console.log(
            "[ERP] Module registered:",
            moduleName
        );

    };


// =========================================================
// GET MODULE
// =========================================================

window.MyTourMitraERP.getModule =
    function (moduleName) {

        return (
            window.MyTourMitraERP.modules[moduleName]
            || null
        );

    };


// =========================================================
// PAGE TITLE DATA
// =========================================================

const ERP_PAGE_INFO = {

    dashboard: {
        title: "Dashboard",
        subtitle: "Travel agency overview"
    },

    customers: {
        title: "Customers",
        subtitle: "Manage customer information"
    },

    enquiries: {
        title: "Enquiries",
        subtitle: "Manage travel enquiries"
    },

    packages: {
        title: "Packages",
        subtitle: "Manage tour packages and itineraries"
    },

    quotations: {
        title: "Quotations",
        subtitle: "Create and manage quotations"
    },

    followups: {
        title: "Follow-ups",
        subtitle: "Manage customer follow-ups"
    },

    bookings: {
        title: "Bookings",
        subtitle: "Manage confirmed bookings"
    },

    invoices: {
        title: "Invoices",
        subtitle: "Manage customer invoices"
    },

    vouchers: {
        title: "Vouchers",
        subtitle: "Manage tour and service vouchers"
    },

    payments: {
        title: "Payments",
        subtitle: "Monitor received payments and balances"
    },

    expenses: {
        title: "Expenses",
        subtitle: "Manage business expenses"
    },

    "profit-loss": {
        title: "Profit & Loss",
        subtitle: "Monitor business profitability"
    },

    team: {
        title: "Team / Users",
        subtitle: "Manage team members and access"
    },

    settings: {
        title: "Settings",
        subtitle: "Manage ERP settings"
    }

};


// =========================================================
// UPDATE PAGE HEADING
// =========================================================

function updatePageHeading(moduleName) {

    const pageTitle =
        document.getElementById(
            "page-title"
        );

    const pageSubtitle =
        document.getElementById(
            "page-subtitle"
        );


    const info =
        ERP_PAGE_INFO[moduleName]
        || {
            title: moduleName,
            subtitle: ""
        };


    if (pageTitle) {

        pageTitle.textContent =
            info.title;

    }


    if (pageSubtitle) {

        pageSubtitle.textContent =
            info.subtitle;

    }

}


// =========================================================
// UPDATE ACTIVE NAVIGATION
// =========================================================

function updateActiveNavigation(moduleName) {

    const navItems =
        document.querySelectorAll(
            ".nav-item[data-module]"
        );


    navItems.forEach(
        function (item) {

            const itemModule =
                item.dataset.module;


            if (itemModule === moduleName) {

                item.classList.add(
                    "active"
                );

            } else {

                item.classList.remove(
                    "active"
                );

            }

        }
    );

}


// =========================================================
// CLOSE MOBILE SIDEBAR
// =========================================================

function closeMobileSidebar() {

    const appScreen =
        document.getElementById(
            "main-app"
        );


    if (!appScreen) {
        return;
    }


    appScreen.classList.remove(
        "sidebar-open"
    );


    const overlay =
        document.querySelector(
            ".sidebar-overlay"
        );


    if (overlay) {

        overlay.remove();

    }

}


// =========================================================
// OPEN MOBILE SIDEBAR
// =========================================================

function openMobileSidebar() {

    const appScreen =
        document.getElementById(
            "main-app"
        );


    if (!appScreen) {
        return;
    }


    appScreen.classList.add(
        "sidebar-open"
    );


    let overlay =
        document.querySelector(
            ".sidebar-overlay"
        );


    if (!overlay) {

        overlay =
            document.createElement(
                "div"
            );

        overlay.className =
            "sidebar-overlay";

        overlay.addEventListener(
            "click",
            function () {

                closeMobileSidebar();

            }
        );


        appScreen.appendChild(
            overlay
        );

    }

}


// =========================================================
// SIDEBAR TOGGLE
// =========================================================

function toggleSidebar() {

    const appScreen =
        document.getElementById(
            "main-app"
        );


    if (!appScreen) {
        return;
    }


    if (
        window.innerWidth <= 768
    ) {

        if (
            appScreen.classList.contains(
                "sidebar-open"
            )
        ) {

            closeMobileSidebar();

        } else {

            openMobileSidebar();

        }

        return;

    }


    appScreen.classList.toggle(
        "sidebar-collapsed"
    );

}


// =========================================================
// NAVIGATION
// =========================================================

window.MyTourMitraERP.openModule =
    function (moduleName) {

        if (!moduleName) {
            return;
        }


        const moduleExists =
            ERP_PAGE_INFO[moduleName];


        if (!moduleExists) {

            console.warn(
                "[ERP] Unknown module:",
                moduleName
            );

            return;

        }


        window.MyTourMitraERP.state.currentModule =
            moduleName;


        updateActiveNavigation(
            moduleName
        );


        updatePageHeading(
            moduleName
        );


        closeMobileSidebar();


        console.log(
            "[ERP] Opening module:",
            moduleName
        );


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
// NAVIGATION CLICK HANDLER
// =========================================================

function initializeNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item[data-module]"
        );


    if (!navItems.length) {

        console.warn(
            "[ERP] Navigation items not found."
        );

        return;

    }


    navItems.forEach(
        function (item) {

            item.addEventListener(
                "click",
                function () {

                    const moduleName =
                        item.dataset.module;


                    window.MyTourMitraERP.openModule(
                        moduleName
                    );

                }
            );

        }
    );


    console.log(
        "[ERP] Navigation initialized."
    );

}


// =========================================================
// SIDEBAR CONTROLS
// =========================================================

function initializeSidebar() {

    const toggleButton =
        document.getElementById(
            "sidebar-toggle"
        );


    const closeButton =
        document.getElementById(
            "sidebar-close"
        );


    if (toggleButton) {

        toggleButton.addEventListener(
            "click",
            function () {

                toggleSidebar();

            }
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function () {

                closeMobileSidebar();

            }
        );

    }

}


// =========================================================
// INITIAL DASHBOARD STATE
// =========================================================

function initializeDefaultPage() {

    const currentModule =
        window.MyTourMitraERP.state.currentModule
        || "dashboard";


    updateActiveNavigation(
        currentModule
    );


    updatePageHeading(
        currentModule
    );

}


// =========================================================
// AUTH EVENT
// =========================================================

function initializeAuthEvents() {

    window.addEventListener(
        "mytourmitra:auth-ready",
        function (event) {

            if (
                event &&
                event.detail
            ) {

                window.MyTourMitraERP.state.currentUser =
                    event.detail.user
                    || null;

            }


            console.log(
                "[ERP] Authentication ready."
            );

        }
    );


    window.addEventListener(
        "mytourmitra:auth-logout",
        function () {

            window.MyTourMitraERP.state.currentUser =
                null;


            console.log(
                "[ERP] Authentication cleared."
            );

        }
    );

}


// =========================================================
// WINDOW RESIZE
// =========================================================

function initializeResizeHandler() {

    window.addEventListener(
        "resize",
        function () {

            const appScreen =
                document.getElementById(
                    "main-app"
                );


            if (!appScreen) {
                return;
            }


            if (
                window.innerWidth > 768
            ) {

                appScreen.classList.remove(
                    "sidebar-open"
                );


                const overlay =
                    document.querySelector(
                        ".sidebar-overlay"
                    );


                if (overlay) {

                    overlay.remove();

                }

            }

        }
    );

}


// =========================================================
// APPLICATION READY
// =========================================================

window.MyTourMitraERP.ready =
    function () {

        if (
            window.MyTourMitraERP.state.initialized
        ) {

            return;

        }


        window.MyTourMitraERP.state.initialized =
            true;


        console.log(
            "========================================"
        );

        console.log(
            "MY TOUR MITRA ERP"
        );

        console.log(
            "Application Ready"
        );

        console.log(
            "Version:",
            window.MyTourMitraERP.version
        );

        console.log(
            "========================================"
        );


        window.dispatchEvent(
            new CustomEvent(
                "mytourmitra:ready"
            )
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
// DOM READY
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "[ERP] DOM loaded."
        );


        initializeNavigation();

        initializeSidebar();

        initializeDefaultPage();

        initializeAuthEvents();

        initializeResizeHandler();


        window.MyTourMitraERP.ready();

    }
);


// =========================================================
// FINAL LOAD MESSAGE
// =========================================================

console.log(
    "[My Tour Mitra ERP] app.js loaded successfully."
);
```
