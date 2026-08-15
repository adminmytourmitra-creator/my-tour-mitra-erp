```javascript
/* =========================================================
   MY TOUR MITRA ERP
   USER INTERFACE CONTROLLER
   File: /js/ui.js

   Handles:
   - Sidebar
   - Navigation
   - Module loading
   - Page title/subtitle
   - Mobile navigation
   - Modal
   - Toast
   - Confirmation dialog
   - User interface updates
   ========================================================= */


// =========================================================
// GLOBAL UI OBJECT
// =========================================================

window.MyTourMitraUI =
    window.MyTourMitraUI || {};


// =========================================================
// UI STATE
// =========================================================

window.MyTourMitraUI.state = {

    initialized: false,

    sidebarOpen: false,

    currentModule: null,

    loadingModule: false

};


// =========================================================
// MODULE INFORMATION
// =========================================================

const MODULE_CONFIG = {

    dashboard: {
        title: "Dashboard",
        subtitle: "Travel agency overview",
        path: "./modules/dashboard/dashboard.html",
        js: "./modules/dashboard/dashboard.js"
    },

    customers: {
        title: "Customers",
        subtitle: "Manage your customers",
        path: "./modules/customers/customers.html",
        js: "./modules/customers/customers.js"
    },

    enquiries: {
        title: "Enquiries",
        subtitle: "Manage customer enquiries",
        path: "./modules/enquiries/enquiries.html",
        js: "./modules/enquiries/enquiries.js"
    },

    followups: {
        title: "Follow-ups",
        subtitle: "Track customer follow-ups",
        path: "./modules/followups/followups.html",
        js: "./modules/followups/followups.js"
    },

    packages: {
        title: "Packages",
        subtitle: "Manage tour packages and itineraries",
        path: "./modules/packages/packages.html",
        js: "./modules/packages/packages.js"
    },

    quotations: {
        title: "Quotations",
        subtitle: "Create and manage customer quotations",
        path: "./modules/quotations/quotation.html",
        js: "./modules/quotations/quotation.js"
    },

    bookings: {
        title: "Bookings",
        subtitle: "Manage confirmed tour bookings",
        path: "./modules/bookings/bookings.html",
        js: "./modules/bookings/bookings.js"
    },

    invoices: {
        title: "Invoices",
        subtitle: "Manage customer invoices and balances",
        path: "./modules/invoices/invoices.html",
        js: "./modules/invoices/invoices.js"
    },

    vouchers: {
        title: "Vouchers",
        subtitle: "Create and manage travel vouchers",
        path: "./modules/vouchers/vouchers.html",
        js: "./modules/vouchers/vouchers.js"
    },

    payments: {
        title: "Payments",
        subtitle: "Monitor received payments and balances",
        path: "./modules/payments/payments.html",
        js: "./modules/payments/payments.js"
    },

    expenses: {
        title: "Expenses",
        subtitle: "Track business expenses",
        path: "./modules/expenses/expenses.html",
        js: "./modules/expenses/expenses.js"
    },

    "profit-loss": {
        title: "Profit & Loss",
        subtitle: "Monitor business profitability",
        path: "./modules/profit-loss/profit-loss.html",
        js: "./modules/profit-loss/profit-loss.js"
    },

    team: {
        title: "Team / Users",
        subtitle: "Manage team members and access",
        path: "./modules/team/team.html",
        js: "./modules/team/team.js"
    },

    settings: {
        title: "Settings",
        subtitle: "Manage ERP settings",
        path: "./modules/settings/settings.html",
        js: "./modules/settings/settings.js"
    }

};


// =========================================================
// DOM HELPERS
// =========================================================

function getElement(id) {

    return document.getElementById(id);

}


// =========================================================
// SIDEBAR
// =========================================================

function openSidebar() {

    const sidebar =
        getElement("sidebar");


    if (!sidebar) {
        return;
    }


    sidebar.classList.add(
        "sidebar-open"
    );


    window.MyTourMitraUI.state.sidebarOpen =
        true;


    document.body.classList.add(
        "sidebar-is-open"
    );

}


function closeSidebar() {

    const sidebar =
        getElement("sidebar");


    if (!sidebar) {
        return;
    }


    sidebar.classList.remove(
        "sidebar-open"
    );


    window.MyTourMitraUI.state.sidebarOpen =
        false;


    document.body.classList.remove(
        "sidebar-is-open"
    );

}


function toggleSidebar() {

    if (
        window.MyTourMitraUI.state.sidebarOpen
    ) {

        closeSidebar();

    } else {

        openSidebar();

    }

}


// =========================================================
// PAGE TITLE
// =========================================================

function updatePageHeading(
    moduleName
) {

    const config =
        MODULE_CONFIG[moduleName];


    if (!config) {
        return;
    }


    const title =
        getElement("page-title");


    const subtitle =
        getElement("page-subtitle");


    if (title) {

        title.textContent =
            config.title;

    }


    if (subtitle) {

        subtitle.textContent =
            config.subtitle;

    }

}


// =========================================================
// ACTIVE NAVIGATION
// =========================================================

function updateActiveNavigation(
    moduleName
) {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(
        function (item) {

            const itemModule =
                item.dataset.module;


            if (
                itemModule === moduleName
            ) {

                item.classList.add(
                    "active"
                );

                item.setAttribute(
                    "aria-current",
                    "page"
                );

            } else {

                item.classList.remove(
                    "active"
                );

                item.removeAttribute(
                    "aria-current"
                );

            }

        }
    );

}


// =========================================================
// MODULE LOADING MESSAGE
// =========================================================

function showModuleLoader() {

    const container =
        getElement(
            "module-container"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="module-loader">

            <div class="loader-spinner"></div>

            <p>
                Loading module...
            </p>

        </div>

    `;

}


// =========================================================
// MODULE ERROR
// =========================================================

function showModuleError(
    moduleName,
    message
) {

    const container =
        getElement(
            "module-container"
        );


    if (!container) {
        return;
    }


    const config =
        MODULE_CONFIG[moduleName];


    const title =
        config
            ? config.title
            : moduleName;


    container.innerHTML = `

        <div class="module-error">

            <div class="module-error-icon">
                !
            </div>

            <h2>
                Unable to load ${escapeHTML(title)}
            </h2>

            <p>
                ${escapeHTML(message)}
            </p>

            <button
                type="button"
                class="btn btn-primary"
                data-retry-module="${escapeHTML(moduleName)}"
            >
                Try Again
            </button>

        </div>

    `;


    const retryButton =
        container.querySelector(
            "[data-retry-module]"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            function () {

                loadModule(
                    moduleName
                );

            }
        );

    }

}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHTML(
    value
) {

    return String(value || "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =========================================================
// LOAD MODULE JAVASCRIPT
// =========================================================

function loadModuleScript(
    src,
    moduleName
) {

    return new Promise(
        function (resolve) {

            if (!src) {

                resolve(
                    true
                );

                return;

            }


            /*
               Prevent duplicate loading of the
               same module JavaScript.
            */

            const existing =
                document.querySelector(
                    `script[data-module-script="${moduleName}"]`
                );


            if (existing) {

                resolve(
                    true
                );

                return;

            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                src;


            script.dataset.moduleScript =
                moduleName;


            script.async =
                false;


            script.onload =
                function () {

                    console.log(
                        `[UI] Module JS loaded: ${moduleName}`
                    );


                    resolve(
                        true
                    );

                };


            script.onerror =
                function () {

                    console.warn(
                        `[UI] Module JS not found: ${src}`
                    );


                    /*
                       HTML module can still work
                       without its JS.

                       Therefore do not block
                       the complete module.
                    */

                    resolve(
                        false
                    );

                };


            document.body.appendChild(
                script
            );

        }
    );

}


// =========================================================
// LOAD MODULE HTML
// =========================================================

async function loadModule(
    moduleName
) {

    const config =
        MODULE_CONFIG[moduleName];


    if (!config) {

        console.error(
            `[UI] Unknown module: ${moduleName}`
        );


        showModuleError(
            moduleName,
            "This module is not registered in the ERP."
        );


        return false;

    }


    const container =
        getElement(
            "module-container"
        );


    if (!container) {

        console.error(
            "[UI] Module container not found."
        );


        return false;

    }


    window.MyTourMitraUI.state.loadingModule =
        true;


    updatePageHeading(
        moduleName
    );


    updateActiveNavigation(
        moduleName
    );


    showModuleLoader();


    try {

        console.log(
            `[UI] Loading module: ${moduleName}`
        );


        const response =
            await fetch(
                config.path,
                {
                    cache: "no-cache"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
            );

        }


        const html =
            await response.text();


        if (!html.trim()) {

            throw new Error(
                "Module HTML file is empty."
            );

        }


        /*
           Insert module HTML.
        */

        container.innerHTML =
            html;


        /*
           Load module JavaScript after
           the HTML has been inserted.
        */

        await loadModuleScript(
            config.js,
            moduleName
        );


        /*
           Initialize module if it exposes
           a compatible global controller.
        */

        initializeLoadedModule(
            moduleName
        );


        window.MyTourMitraUI.state.currentModule =
            moduleName;


        window.MyTourMitraUI.state.loadingModule =
            false;


        /*
           Notify application.
        */

        window.dispatchEvent(
            new CustomEvent(
                "mytourmitra:module-loaded",
                {
                    detail: {
                        module: moduleName
                    }
                }
            )
        );


        window.dispatchEvent(
            new CustomEvent(
                "mytourmitra:module-ready",
                {
                    detail: {
                        module: moduleName
                    }
                }
            )
        );


        /*
           Close mobile sidebar.
        */

        if (
            window.innerWidth <= 900
        ) {

            closeSidebar();

        }


        console.log(
            `[UI] Module loaded successfully: ${moduleName}`
        );


        return true;


    } catch (error) {

        console.error(
            `[UI] Failed to load module ${moduleName}:`,
            error
        );


        window.MyTourMitraUI.state.loadingModule =
            false;


        showModuleError(
            moduleName,
            error.message
                || "Unknown loading error."
        );


        return false;

    }

}


// =========================================================
// INITIALIZE LOADED MODULE
// =========================================================

function initializeLoadedModule(
    moduleName
) {

    const possibleNames = [

        moduleName,

        moduleName.replace(
            /-([a-z])/g,
            function (
                match,
                letter
            ) {

                return letter.toUpperCase();

            }
        )

    ];


    for (
        const name of possibleNames
    ) {

        /*
           Example:

           window.MyTourMitraModules.dashboard

           OR

           window.dashboardModule
        */

        if (
            window.MyTourMitraModules &&
            window.MyTourMitraModules[name]
        ) {

            const module =
                window.MyTourMitraModules[name];


            if (
                typeof module.init === "function"
            ) {

                try {

                    module.init();

                } catch (error) {

                    console.error(
                        `[UI] ${moduleName} init failed:`,
                        error
                    );

                }

            }


            return;

        }


        const globalName =
            `${name}Module`;


        if (
            window[globalName]
        ) {

            const module =
                window[globalName];


            if (
                typeof module.init === "function"
            ) {

                try {

                    module.init();

                } catch (error) {

                    console.error(
                        `[UI] ${moduleName} init failed:`,
                        error
                    );

                }

            }


            return;

        }

    }

}


// =========================================================
// NAVIGATION
// =========================================================

function initializeNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item[data-module]"
        );


    navItems.forEach(
        function (item) {

            item.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    const moduleName =
                        item.dataset.module;


                    if (!moduleName) {
                        return;
                    }


                    openModule(
                        moduleName
                    );

                }
            );

        }
    );


    console.log(
        `[UI] ${navItems.length} navigation items initialized.`
    );

}


// =========================================================
// OPEN MODULE
// =========================================================

function openModule(
    moduleName
) {

    if (!MODULE_CONFIG[moduleName]) {

        console.warn(
            `[UI] Unknown module: ${moduleName}`
        );

        return;

    }


    /*
       Update global application state
       if app.js is available.
    */

    if (
        window.MyTourMitraERP &&
        window.MyTourMitraERP.state
    ) {

        window.MyTourMitraERP.state.currentModule =
            moduleName;

    }


    /*
       Dispatch navigation event.
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


    loadModule(
        moduleName
    );

}


// =========================================================
// SIDEBAR BUTTONS
// =========================================================

function initializeSidebar() {

    const toggle =
        getElement(
            "sidebar-toggle"
        );


    const close =
        getElement(
            "sidebar-close"
        );


    if (toggle) {

        toggle.addEventListener(
            "click",
            function () {

                toggleSidebar();

            }
        );

    }


    if (close) {

        close.addEventListener(
            "click",
            function () {

                closeSidebar();

            }
        );

    }


    /*
       Close sidebar when clicking outside
       on smaller screens.
    */

    document.addEventListener(
        "click",
        function (event) {

            if (
                window.innerWidth > 900
            ) {

                return;

            }


            const sidebar =
                getElement(
                    "sidebar"
                );


            const toggleButton =
                getElement(
                    "sidebar-toggle"
                );


            if (
                !sidebar ||
                !toggleButton
            ) {

                return;

            }


            if (
                !window.MyTourMitraUI.state.sidebarOpen
            ) {

                return;

            }


            if (
                sidebar.contains(
                    event.target
                )
            ) {

                return;

            }


            if (
                toggleButton.contains(
                    event.target
                )
            ) {

                return;

            }


            closeSidebar();

        }
    );


    /*
       ESC closes sidebar.
    */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeSidebar();

                closeModal();

                closeConfirm();

            }

        }
    );

}


// =========================================================
// GLOBAL MODAL
// =========================================================

function openModal(
    title,
    body,
    footer = ""
) {

    const modal =
        getElement(
            "global-modal"
        );


    const modalTitle =
        getElement(
            "global-modal-title"
        );


    const modalBody =
        getElement(
            "global-modal-body"
        );


    const modalFooter =
        getElement(
            "global-modal-footer"
        );


    if (!modal) {
        return;
    }


    if (modalTitle) {

        modalTitle.textContent =
            title || "Modal";

    }


    if (modalBody) {

        if (
            typeof body === "string"
        ) {

            modalBody.innerHTML =
                body;

        }

    }


    if (modalFooter) {

        modalFooter.innerHTML =
            footer || "";

    }


    modal.classList.remove(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-is-open"
    );

}


function closeModal() {

    const modal =
        getElement(
            "global-modal"
        );


    if (!modal) {
        return;
    }


    modal.classList.add(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-is-open"
    );

}


// =========================================================
// MODAL BUTTON
// =========================================================

function initializeModal() {

    const closeButton =
        getElement(
            "global-modal-close"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function () {

                closeModal();

            }
        );

    }


    const modal =
        getElement(
            "global-modal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeModal();

                }

            }
        );

    }

}


// =========================================================
// TOAST
// =========================================================

function showToast(
    message,
    type = "info",
    duration = 3500
) {

    const container =
        getElement(
            "toast-container"
        );


    if (!container) {

        console.log(
            `[TOAST ${type}]`,
            message
        );

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast toast-${type}`;


    toast.innerHTML = `

        <div class="toast-message">
            ${escapeHTML(message)}
        </div>

        <button
            type="button"
            class="toast-close"
            aria-label="Close"
        >
            ×
        </button>

    `;


    container.appendChild(
        toast
    );


    const close =
        toast.querySelector(
            ".toast-close"
        );


    if (close) {

        close.addEventListener(
            "click",
            function () {

                toast.remove();

            }
        );

    }


    setTimeout(
        function () {

            if (
                toast.parentNode
            ) {

                toast.remove();

            }

        },
        duration
    );

}


// =========================================================
// CONFIRM DIALOG
// =========================================================

let confirmResolve =
    null;


function showConfirm(
    message,
    title = "Confirm Action"
) {

    return new Promise(
        function (resolve) {

            const dialog =
                getElement(
                    "confirm-dialog"
                );


            const titleElement =
                getElement(
                    "confirm-title"
                );


            const messageElement =
                getElement(
                    "confirm-message"
                );


            if (!dialog) {

                resolve(
                    window.confirm(
                        message
                    )
                );

                return;

            }


            confirmResolve =
                resolve;


            if (titleElement) {

                titleElement.textContent =
                    title;

            }


            if (messageElement) {

                messageElement.textContent =
                    message;

            }


            dialog.classList.remove(
                "hidden"
            );


            dialog.setAttribute(
                "aria-hidden",
                "false"
            );


            document.body.classList.add(
                "modal-is-open"
            );

        }
    );

}


function closeConfirm() {

    const dialog =
        getElement(
            "confirm-dialog"
        );


    if (dialog) {

        dialog.classList.add(
            "hidden"
        );


        dialog.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    document.body.classList.remove(
        "modal-is-open"
    );


    confirmResolve =
        null;

}


// =========================================================
// CONFIRM BUTTONS
// =========================================================

function initializeConfirmDialog() {

    const cancel =
        getElement(
            "confirm-cancel"
        );


    const ok =
        getElement(
            "confirm-ok"
        );


    if (cancel) {

        cancel.addEventListener(
            "click",
            function () {

                if (
                    confirmResolve
                ) {

                    confirmResolve(
                        false
                    );

                }


                closeConfirm();

            }
        );

    }


    if (ok) {

        ok.addEventListener(
            "click",
            function () {

                if (
                    confirmResolve
                ) {

                    confirmResolve(
                        true
                    );

                }


                closeConfirm();

            }
        );

    }

}


// =========================================================
// NOTIFICATIONS
// =========================================================

function initializeNotifications() {

    const button =
        getElement(
            "notification-button"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            showToast(
                "No new notifications.",
                "info"
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

            if (
                window.innerWidth > 900
            ) {

                closeSidebar();

            }

        }
    );

}


// =========================================================
// AUTH UI EVENTS
// =========================================================

function initializeAuthEvents() {

    window.addEventListener(
        "mytourmitra:auth-ready",
        function (event) {

            if (
                event.detail &&
                event.detail.user
            ) {

                updateUserInformation(
                    event.detail.user
                );

            }

        }
    );


    window.addEventListener(
        "mytourmitra:login-success",
        function (event) {

            if (
                event.detail &&
                event.detail.user
            ) {

                updateUserInformation(
                    event.detail.user
                );

            }


            /*
               Open dashboard after login.
            */

            setTimeout(
                function () {

                    openModule(
                        "dashboard"
                    );

                },
                100
            );

        }
    );


    window.addEventListener(
        "mytourmitra:auth-logout",
        function () {

            closeSidebar();

        }
    );

}


// =========================================================
// USER INFORMATION
// =========================================================

function updateUserInformation(
    user
) {

    if (!user) {
        return;
    }


    const displayName =
        user.displayName
        || user.email
        || "Admin";


    const initial =
        displayName
            .charAt(0)
            .toUpperCase();


    const sidebarName =
        getElement(
            "sidebar-user-name"
        );


    const topbarName =
        getElement(
            "topbar-user-name"
        );


    const sidebarInitial =
        getElement(
            "sidebar-user-initial"
        );


    const topbarInitial =
        getElement(
            "topbar-user-initial"
        );


    if (sidebarName) {

        sidebarName.textContent =
            displayName;

    }


    if (topbarName) {

        topbarName.textContent =
            displayName;

    }


    if (sidebarInitial) {

        sidebarInitial.textContent =
            initial;

    }


    if (topbarInitial) {

        topbarInitial.textContent =
            initial;

    }

}


// =========================================================
// INITIALIZE UI
// =========================================================

window.MyTourMitraUI.init =
    function () {

        if (
            window.MyTourMitraUI.state.initialized
        ) {

            return;

        }


        window.MyTourMitraUI.state.initialized =
            true;


        initializeNavigation();

        initializeSidebar();

        initializeModal();

        initializeConfirmDialog();

        initializeNotifications();

        initializeResizeHandler();

        initializeAuthEvents();


        /*
           Tell the rest of the application
           that UI is ready.
        */

        window.dispatchEvent(
            new CustomEvent(
                "mytourmitra:ui-ready"
            )
        );


        console.log(
            "[UI] UI system initialized."
        );

    };


// =========================================================
// GLOBAL UI HELPERS
// =========================================================

window.MyTourMitraUI.openModule =
    openModule;


window.MyTourMitraUI.loadModule =
    loadModule;


window.MyTourMitraUI.openModal =
    openModal;


window.MyTourMitraUI.closeModal =
    closeModal;


window.MyTourMitraUI.showToast =
    showToast;


window.MyTourMitraUI.showConfirm =
    showConfirm;


window.MyTourMitraUI.closeConfirm =
    closeConfirm;


window.MyTourMitraUI.openSidebar =
    openSidebar;


window.MyTourMitraUI.closeSidebar =
    closeSidebar;


window.MyTourMitraUI.toggleSidebar =
    toggleSidebar;


// =========================================================
// GLOBAL COMPATIBILITY FUNCTIONS
// =========================================================

window.openModule =
    openModule;


window.showToast =
    showToast;


window.showConfirm =
    showConfirm;


window.openModal =
    openModal;


window.closeModal =
    closeModal;


// =========================================================
// START UI
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        window.MyTourMitraUI.init();

    }
);


// =========================================================
// FINAL MESSAGE
// =========================================================

console.log(
    "[My Tour Mitra ERP] ui.js loaded successfully."
);
```
