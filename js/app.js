/* =========================================================
   MY TOUR MITRA ERP
   APPLICATION CONTROLLER
   ========================================================= */

/*
 * app.js is the central controller of the ERP.
 *
 * Responsibilities:
 *
 * 1. Application boot
 * 2. Authentication state
 * 3. Login / Logout UI
 * 4. Sidebar navigation
 * 5. Dynamic module loading
 * 6. Page title management
 * 7. User information
 * 8. Global modal
 * 9. Confirmation dialog
 * 10. Toast notifications
 * 11. Mobile navigation
 */


/* =========================================================
   1. IMPORTS
   ========================================================= */

import {
    login,
    logout,
    initializeAuthState,
    subscribeToAuthState,
    isAuthenticated,
    getUserDisplayName,
    getUserRoleDisplayName,
    getUserInitial,
    getCurrentUserProfile
} from "./auth.js";


import {
    APP_CONFIG,
    COLLECTIONS
} from "./config.js";


import {
    db
} from "./firebase.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   2. APPLICATION STATE
   ========================================================= */

const appState = {

    currentModule: null,

    currentModuleInstance: null,

    moduleCache: new Map(),

    isModuleLoading: false,

    companySettings: null,

    initialized: false,

    sidebarOpen: false

};


/* =========================================================
   3. MODULE REGISTRY
   ========================================================= */

/*
 * Every module has:
 *
 * html  → module HTML file
 * js    → module JavaScript file
 *
 * CSS is loaded globally through index.html and module CSS
 * files will be added as their respective modules are created.
 */

const MODULE_REGISTRY = Object.freeze({

    dashboard: {

        title: "Dashboard",

        subtitle: "Travel agency overview",

        html:
            "./modules/dashboard/dashboard.html",

        js:
            "./modules/dashboard/dashboard.js",

        css:
            "./css/dashboard.css"

    },


    customers: {

        title: "Customers",

        subtitle: "Manage customer records",

        html:
            "./modules/customers/customers.html",

        js:
            "./modules/customers/customers.js",

        css:
            "./css/customers.css"

    },


    enquiries: {

        title: "Enquiries",

        subtitle: "Manage travel enquiries",

        html:
            "./modules/enquiries/enquiries.html",

        js:
            "./modules/enquiries/enquiries.js",

        css:
            "./css/enquiries.css"

    },


    packages: {

        title: "Packages",

        subtitle: "Create and manage customer packages",

        html:
            "./modules/packages/packages.html",

        js:
            "./modules/packages/packages.js",

        css:
            "./css/packages.css"

    },


    quotations: {

        title: "Quotations",

        subtitle: "Create and manage quotations",

        html:
            "./modules/quotations/quotations.html",

        js:
            "./modules/quotations/quotations.js",

        css:
            "./css/quotations.css"

    },


    followups: {

        title: "Follow-ups",

        subtitle: "Track customer follow-ups",

        html:
            "./modules/followups/followups.html",

        js:
            "./modules/followups/followups.js",

        css:
            "./css/followups.css"

    },


    bookings: {

        title: "Bookings",

        subtitle: "Manage confirmed bookings",

        html:
            "./modules/bookings/bookings.html",

        js:
            "./modules/bookings/bookings.js",

        css:
            "./css/bookings.css"

    },


    invoices: {

        title: "Invoices",

        subtitle: "Create and manage invoices",

        html:
            "./modules/invoices/invoices.html",

        js:
            "./modules/invoices/invoices.js",

        css:
            "./css/invoices.css"

    },


    vouchers: {

        title: "Vouchers",

        subtitle: "Create tour, hotel and cab vouchers",

        html:
            "./modules/vouchers/vouchers.html",

        js:
            "./modules/vouchers/vouchers.js",

        css:
            "./css/vouchers.css"

    },


    payments: {

        title: "Payments",

        subtitle: "Track customer payments",

        html:
            "./modules/payments/payments.html",

        js:
            "./modules/payments/payments.js",

        css:
            "./css/payments.css"

    },


    expenses: {

        title: "Expenses",

        subtitle: "Track supplier and business expenses",

        html:
            "./modules/expenses/expenses.html",

        js:
            "./modules/expenses/expenses.js",

        css:
            "./css/expenses.css"

    },


    "profit-loss": {

        title: "Profit & Loss",

        subtitle: "View business profitability",

        html:
            "./modules/profit-loss/profit-loss.html",

        js:
            "./modules/profit-loss/profit-loss.js",

        css:
            "./css/profit-loss.css"

    },


    team: {

        title: "Team / Users",

        subtitle: "Manage ERP users and permissions",

        html:
            "./modules/team/team.html",

        js:
            "./modules/team/team.js",

        css:
            "./css/team.css"

    },


    settings: {

        title: "Settings",

        subtitle: "Manage company and ERP settings",

        html:
            "./modules/settings/settings.html",

        js:
            "./modules/settings/settings.js",

        css:
            "./css/settings.css"

    }

});


/* =========================================================
   4. DOM REFERENCES
   ========================================================= */

const DOM = {};


/* =========================================================
   5. CACHE DOM
   ========================================================= */

function cacheDOM() {

    DOM.app =
        document.getElementById("app");


    DOM.loginScreen =
        document.getElementById("login-screen");


    DOM.mainApp =
        document.getElementById("main-app");


    DOM.loginForm =
        document.getElementById("login-form");


    DOM.loginEmail =
        document.getElementById("login-email");


    DOM.loginPassword =
        document.getElementById("login-password");


    DOM.loginButton =
        document.getElementById("login-button");


    DOM.loginButtonText =
        document.getElementById("login-button-text");


    DOM.loginButtonLoader =
        document.getElementById("login-button-loader");


    DOM.loginError =
        document.getElementById("login-error");


    DOM.togglePassword =
        document.getElementById("toggle-password");


    DOM.sidebar =
        document.getElementById("sidebar");


    DOM.sidebarToggle =
        document.getElementById("sidebar-toggle");


    DOM.sidebarClose =
        document.getElementById("sidebar-close");


    DOM.sidebarLogout =
        document.getElementById("sidebar-logout");


    DOM.mainNavigation =
        document.getElementById("main-navigation");


    DOM.moduleContainer =
        document.getElementById("module-container");


    DOM.pageTitle =
        document.getElementById("page-title");


    DOM.pageSubtitle =
        document.getElementById("page-subtitle");


    DOM.sidebarCompanyName =
        document.getElementById("sidebar-company-name");


    DOM.sidebarLogo =
        document.getElementById("sidebar-logo");


    DOM.sidebarLogoPlaceholder =
        document.getElementById(
            "sidebar-logo-placeholder"
        );


    DOM.loginCompanyName =
        document.getElementById(
            "login-company-name"
        );


    DOM.loginLogo =
        document.getElementById("login-logo");


    DOM.loginLogoPlaceholder =
        document.getElementById(
            "login-logo-placeholder"
        );


    DOM.sidebarUserName =
        document.getElementById(
            "sidebar-user-name"
        );


    DOM.sidebarUserRole =
        document.getElementById(
            "sidebar-user-role"
        );


    DOM.sidebarUserInitial =
        document.getElementById(
            "sidebar-user-initial"
        );


    DOM.topbarUserName =
        document.getElementById(
            "topbar-user-name"
        );


    DOM.topbarUserRole =
        document.getElementById(
            "topbar-user-role"
        );


    DOM.topbarUserInitial =
        document.getElementById(
            "topbar-user-initial"
        );


    DOM.globalModal =
        document.getElementById(
            "global-modal"
        );


    DOM.globalModalTitle =
        document.getElementById(
            "global-modal-title"
        );


    DOM.globalModalBody =
        document.getElementById(
            "global-modal-body"
        );


    DOM.globalModalFooter =
        document.getElementById(
            "global-modal-footer"
        );


    DOM.globalModalClose =
        document.getElementById(
            "global-modal-close"
        );


    DOM.confirmDialog =
        document.getElementById(
            "confirm-dialog"
        );


    DOM.confirmTitle =
        document.getElementById(
            "confirm-title"
        );


    DOM.confirmMessage =
        document.getElementById(
            "confirm-message"
        );


    DOM.confirmCancel =
        document.getElementById(
            "confirm-cancel"
        );


    DOM.confirmOk =
        document.getElementById(
            "confirm-ok"
        );


    DOM.toastContainer =
        document.getElementById(
            "toast-container"
        );

}


/* =========================================================
   6. INITIALIZE APPLICATION
   ========================================================= */

async function initializeApplication() {

    if (appState.initialized) {

        return;

    }


    cacheDOM();

    bindGlobalEvents();

    setupNavigation();

    setupMobileNavigation();


    /*
     * Start Firebase authentication state listener.
     */

    subscribeToAuthState(
        handleAuthStateChange
    );


    try {

        await initializeAuthState();

    } catch (error) {

        console.error(
            "Authentication initialization failed:",
            error
        );


        showLoginScreen();

    }


    appState.initialized = true;

}


/* =========================================================
   7. AUTH STATE HANDLER
   ========================================================= */

async function handleAuthStateChange(
    user,
    profile
) {

    if (user) {

        await handleAuthenticatedUser(
            user,
            profile
        );

    } else {

        handleLoggedOutUser();

    }

}


/* =========================================================
   8. AUTHENTICATED USER
   ========================================================= */

async function handleAuthenticatedUser(
    user,
    profile
) {

    showMainApplication();


    updateUserInterface(
        profile
    );


    await loadCompanySettings();


    updateCompanyInterface();


    /*
     * If there is no module currently selected,
     * open Dashboard.
     */

    if (!appState.currentModule) {

        await navigateToModule(
            "dashboard"
        );

    }

}


/* =========================================================
   9. LOGGED OUT USER
   ========================================================= */

function handleLoggedOutUser() {

    appState.currentModule =
        null;

    appState.currentModuleInstance =
        null;

    appState.companySettings =
        null;


    showLoginScreen();

}


/* =========================================================
   10. SHOW LOGIN
   ========================================================= */

function showLoginScreen() {

    if (DOM.loginScreen) {

        DOM.loginScreen.classList.remove(
            "hidden"
        );

    }


    if (DOM.mainApp) {

        DOM.mainApp.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   11. SHOW MAIN APPLICATION
   ========================================================= */

function showMainApplication() {

    if (DOM.loginScreen) {

        DOM.loginScreen.classList.add(
            "hidden"
        );

    }


    if (DOM.mainApp) {

        DOM.mainApp.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   12. LOGIN FORM
   ========================================================= */

async function handleLoginSubmit(
    event
) {

    event.preventDefault();


    clearLoginError();


    const email =
        DOM.loginEmail?.value || "";


    const password =
        DOM.loginPassword?.value || "";


    setLoginLoading(
        true
    );


    try {

        await login(
            email,
            password
        );


        if (DOM.loginPassword) {

            DOM.loginPassword.value =
                "";

        }

    } catch (error) {

        showLoginError(
            error.message
        );

    } finally {

        setLoginLoading(
            false
        );

    }

}


/* =========================================================
   13. LOGIN LOADING
   ========================================================= */

function setLoginLoading(
    loading
) {

    if (
        !DOM.loginButton ||
        !DOM.loginButtonText ||
        !DOM.loginButtonLoader
    ) {

        return;

    }


    DOM.loginButton.disabled =
        loading;


    DOM.loginButtonText.classList.toggle(
        "hidden",
        loading
    );


    DOM.loginButtonLoader.classList.toggle(
        "hidden",
        !loading
    );

}


/* =========================================================
   14. LOGIN ERROR
   ========================================================= */

function showLoginError(
    message
) {

    if (!DOM.loginError) {

        return;

    }


    DOM.loginError.textContent =
        message || "Login failed.";


    DOM.loginError.classList.remove(
        "hidden"
    );

}


function clearLoginError() {

    if (!DOM.loginError) {

        return;

    }


    DOM.loginError.textContent =
        "";


    DOM.loginError.classList.add(
        "hidden"
    );

}


/* =========================================================
   15. PASSWORD VISIBILITY
   ========================================================= */

function togglePasswordVisibility() {

    if (!DOM.loginPassword) {

        return;

    }


    const isPassword =
        DOM.loginPassword.type === "password";


    DOM.loginPassword.type =
        isPassword
            ? "text"
            : "password";


    if (DOM.togglePassword) {

        DOM.togglePassword.textContent =
            isPassword
                ? "Hide"
                : "Show";

    }

}


/* =========================================================
   16. USER INTERFACE
   ========================================================= */

function updateUserInterface(
    profile
) {

    const name =
        getUserDisplayName();


    const role =
        getUserRoleDisplayName();


    const initial =
        getUserInitial();


    if (DOM.sidebarUserName) {

        DOM.sidebarUserName.textContent =
            name;

    }


    if (DOM.sidebarUserRole) {

        DOM.sidebarUserRole.textContent =
            role;

    }


    if (DOM.sidebarUserInitial) {

        DOM.sidebarUserInitial.textContent =
            initial;

    }


    if (DOM.topbarUserName) {

        DOM.topbarUserName.textContent =
            name;

    }


    if (DOM.topbarUserRole) {

        DOM.topbarUserRole.textContent =
            role;

    }


    if (DOM.topbarUserInitial) {

        DOM.topbarUserInitial.textContent =
            initial;

    }

}


/* =========================================================
   17. COMPANY SETTINGS
   ========================================================= */

async function loadCompanySettings() {

    try {

        const settingsRef =
            doc(
                db,
                COLLECTIONS.settings,
                "company"
            );


        const snapshot =
            await getDoc(
                settingsRef
            );


        if (
            snapshot.exists()
        ) {

            appState.companySettings =
                snapshot.data();

        } else {

            appState.companySettings =
                null;

        }

    } catch (error) {

        console.warn(
            "Company settings could not be loaded:",
            error
        );


        appState.companySettings =
            null;

    }

}


/* =========================================================
   18. COMPANY INTERFACE
   ========================================================= */

function updateCompanyInterface() {

    const settings =
        appState.companySettings;


    if (!settings) {

        return;

    }


    const companyName =
        settings.companyName ||
        APP_CONFIG.name;


    /*
     * Login company name
     */

    if (DOM.loginCompanyName) {

        DOM.loginCompanyName.textContent =
            companyName;

    }


    /*
     * Sidebar company name
     */

    if (DOM.sidebarCompanyName) {

        DOM.sidebarCompanyName.textContent =
            companyName;

    }


    /*
     * Login logo
     */

    updateLogo(
        DOM.loginLogo,
        DOM.loginLogoPlaceholder,
        settings.logoUrl
    );


    /*
     * Sidebar logo
     */

    updateLogo(
        DOM.sidebarLogo,
        DOM.sidebarLogoPlaceholder,
        settings.logoUrl
    );

}


/* =========================================================
   19. LOGO HANDLER
   ========================================================= */

function updateLogo(
    imageElement,
    placeholderElement,
    logoUrl
) {

    if (
        !imageElement ||
        !placeholderElement
    ) {

        return;

    }


    if (
        logoUrl &&
        typeof logoUrl === "string"
    ) {

        imageElement.src =
            logoUrl;


        imageElement.classList.remove(
            "hidden"
        );


        placeholderElement.classList.add(
            "hidden"
        );


        imageElement.onerror =
            () => {

                imageElement.classList.add(
                    "hidden"
                );


                placeholderElement.classList.remove(
                    "hidden"
                );

            };

    } else {

        imageElement.removeAttribute(
            "src"
        );


        imageElement.classList.add(
            "hidden"
        );


        placeholderElement.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   20. NAVIGATION SETUP
   ========================================================= */

function setupNavigation() {

    if (!DOM.mainNavigation) {

        return;

    }


    DOM.mainNavigation.addEventListener(
        "click",
        async event => {

            const navItem =
                event.target.closest(
                    ".nav-item"
                );


            if (!navItem) {

                return;

            }


            const moduleName =
                navItem.dataset.module;


            if (!moduleName) {

                return;

            }


            await navigateToModule(
                moduleName
            );

        }
    );

}


/* =========================================================
   21. NAVIGATE TO MODULE
   ========================================================= */

export async function navigateToModule(
    moduleName
) {

    if (
        !MODULE_REGISTRY[moduleName]
    ) {

        console.error(
            `Unknown module: ${moduleName}`
        );


        showToast(
            "error",
            "Module not found",
            `The module "${moduleName}" is not registered.`
        );


        return;

    }


    if (appState.isModuleLoading) {

        return;

    }


    const moduleConfig =
        MODULE_REGISTRY[moduleName];


    appState.isModuleLoading =
        true;


    try {

        updateNavigationState(
            moduleName
        );


        updatePageHeading(
            moduleConfig
        );


        await loadModule(
            moduleName,
            moduleConfig
        );


        appState.currentModule =
            moduleName;


        closeMobileSidebar();

    } catch (error) {

        console.error(
            `Failed to load module "${moduleName}":`,
            error
        );


        showModuleError(
            error
        );

    } finally {

        appState.isModuleLoading =
            false;

    }

}


/* =========================================================
   22. UPDATE NAVIGATION STATE
   ========================================================= */

function updateNavigationState(
    moduleName
) {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(
        item => {

            const isActive =
                item.dataset.module ===
                moduleName;


            item.classList.toggle(
                "active",
                isActive
            );

        }
    );

}


/* =========================================================
   23. UPDATE PAGE HEADING
   ========================================================= */

function updatePageHeading(
    moduleConfig
) {

    if (DOM.pageTitle) {

        DOM.pageTitle.textContent =
            moduleConfig.title;

    }


    if (DOM.pageSubtitle) {

        DOM.pageSubtitle.textContent =
            moduleConfig.subtitle;

    }

}


/* =========================================================
   24. LOAD MODULE
   ========================================================= */

async function loadModule(
    moduleName,
    moduleConfig
) {

    /*
     * Abort the previous module if it provides a destroy()
     * method.
     */

    if (
        appState.currentModuleInstance &&
        typeof appState.currentModuleInstance.destroy ===
            "function"
    ) {

        try {

            await appState.currentModuleInstance.destroy();

        } catch (error) {

            console.warn(
                "Previous module cleanup failed:",
                error
            );

        }

    }


    /*
     * Load module HTML.
     */

    const html =
        await fetchModuleHTML(
            moduleConfig.html
        );


    /*
     * Render HTML.
     */

    DOM.moduleContainer.innerHTML =
        html;


    /*
     * Load module CSS.
     */

    if (moduleConfig.css) {

        await loadModuleCSS(
            moduleConfig.css,
            moduleName
        );

    }


    /*
     * Load module JavaScript.
     */

    const module =
        await import(
            `${moduleConfig.js}?v=${APP_CONFIG.version}`
        );


    /*
     * Initialize module.
     */

    if (
        module &&
        typeof module.init === "function"
    ) {

        appState.currentModuleInstance =
            await module.init({

                app: appState,

                navigate:
                    navigateToModule,

                showToast,

                openModal,

                closeModal,

                confirmAction,

                getCompanySettings:
                    () =>
                        appState.companySettings,

                getCurrentUserProfile

            });

    } else {

        appState.currentModuleInstance =
            module || null;

    }

}


/* =========================================================
   25. FETCH MODULE HTML
   ========================================================= */

async function fetchModuleHTML(
    url
) {

    const response =
        await fetch(
            url,
            {
                cache: "no-cache"
            }
        );


    if (!response.ok) {

        throw new Error(
            `Unable to load module HTML: ${response.status}`
        );

    }


    return await response.text();

}


/* =========================================================
   26. MODULE CSS LOADER
   ========================================================= */

const loadedStylesheets =
    new Map();


async function loadModuleCSS(
    url,
    moduleName
) {

    if (
        loadedStylesheets.has(
            moduleName
        )
    ) {

        return;

    }


    /*
     * Prevent duplicate stylesheet insertion.
     */

    const existing =
        document.querySelector(
            `link[data-module-css="${moduleName}"]`
        );


    if (existing) {

        loadedStylesheets.set(
            moduleName,
            existing
        );

        return;

    }


    const link =
        document.createElement(
            "link"
        );


    link.rel =
        "stylesheet";


    link.href =
        url;


    link.dataset.moduleCss =
        moduleName;


    document.head.appendChild(
        link
    );


    loadedStylesheets.set(
        moduleName,
        link
    );

}


/* =========================================================
   27. MODULE ERROR
   ========================================================= */

function showModuleError(
    error
) {

    if (!DOM.moduleContainer) {

        return;

    }


    DOM.moduleContainer.innerHTML = `

        <div class="empty-state">

            <div class="empty-state-icon">
                !
            </div>

            <h3>
                Unable to load this module
            </h3>

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
                Try Again
            </button>

        </div>

    `;


    const retryButton =
        document.getElementById(
            "module-retry-button"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            () => {

                if (
                    appState.currentModule
                ) {

                    navigateToModule(
                        appState.currentModule
                    );

                } else {

                    navigateToModule(
                        "dashboard"
                    );

                }

            }
        );

    }

}


/* =========================================================
   28. MOBILE NAVIGATION
   ========================================================= */

function setupMobileNavigation() {

    if (DOM.sidebarToggle) {

        DOM.sidebarToggle.addEventListener(
            "click",
            openMobileSidebar
        );

    }


    if (DOM.sidebarClose) {

        DOM.sidebarClose.addEventListener(
            "click",
            closeMobileSidebar
        );

    }

}


function openMobileSidebar() {

    if (!DOM.sidebar) {

        return;

    }


    DOM.sidebar.classList.add(
        "mobile-open"
    );


    appState.sidebarOpen =
        true;


    createSidebarOverlay();

}


function closeMobileSidebar() {

    if (!DOM.sidebar) {

        return;

    }


    DOM.sidebar.classList.remove(
        "mobile-open"
    );


    appState.sidebarOpen =
        false;


    removeSidebarOverlay();

}


/* =========================================================
   29. SIDEBAR OVERLAY
   ========================================================= */

function createSidebarOverlay() {

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
            closeMobileSidebar
        );


        document.body.appendChild(
            overlay
        );

    }


    requestAnimationFrame(
        () => {

            overlay.classList.add(
                "active"
            );

        }
    );

}


function removeSidebarOverlay() {

    const overlay =
        document.querySelector(
            ".sidebar-overlay"
        );


    if (!overlay) {

        return;

    }


    overlay.classList.remove(
        "active"
    );


    setTimeout(
        () => {

            if (
                !overlay.classList.contains(
                    "active"
                )
            ) {

                overlay.remove();

            }

        },
        250
    );

}


/* =========================================================
   30. GLOBAL EVENTS
   ========================================================= */

function bindGlobalEvents() {

    if (DOM.loginForm) {

        DOM.loginForm.addEventListener(
            "submit",
            handleLoginSubmit
        );

    }


    if (DOM.togglePassword) {

        DOM.togglePassword.addEventListener(
            "click",
            togglePasswordVisibility
        );

    }


    if (DOM.sidebarLogout) {

        DOM.sidebarLogout.addEventListener(
            "click",
            handleLogout
        );

    }


    if (DOM.globalModalClose) {

        DOM.globalModalClose.addEventListener(
            "click",
            closeModal
        );

    }


    if (DOM.globalModal) {

        DOM.globalModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    DOM.globalModal
                ) {

                    closeModal();

                }

            }
        );

    }


    if (DOM.confirmCancel) {

        DOM.confirmCancel.addEventListener(
            "click",
            () => {

                resolveConfirmation(
                    false
                );

            }
        );

    }


    if (DOM.confirmOk) {

        DOM.confirmOk.addEventListener(
            "click",
            () => {

                resolveConfirmation(
                    true
                );

            }
        );

    }


    document.addEventListener(
        "keydown",
        handleKeyboardEvents
    );

}


/* =========================================================
   31. LOGOUT
   ========================================================= */

async function handleLogout() {

    const confirmed =
        await confirmAction({

            title:
                "Logout",

            message:
                "Are you sure you want to logout?",

            confirmText:
                "Logout",

            cancelText:
                "Cancel"

        });


    if (!confirmed) {

        return;

    }


    try {

        await logout();

        showToast(
            "success",
            "Logged out",
            "You have been logged out successfully."
        );

    } catch (error) {

        showToast(
            "error",
            "Logout failed",
            error.message
        );

    }

}


/* =========================================================
   32. GLOBAL MODAL
   ========================================================= */

export function openModal({
    title = "Modal",
    body = "",
    footer = ""
} = {}) {

    if (!DOM.globalModal) {

        return;

    }


    DOM.globalModalTitle.textContent =
        title;


    if (
        typeof body === "string"
    ) {

        DOM.globalModalBody.innerHTML =
            body;

    } else {

        DOM.globalModalBody.innerHTML =
            "";

        DOM.globalModalBody.appendChild(
            body
        );

    }


    if (
        typeof footer === "string"
    ) {

        DOM.globalModalFooter.innerHTML =
            footer;

    } else {

        DOM.globalModalFooter.innerHTML =
            "";

        DOM.globalModalFooter.appendChild(
            footer
        );

    }


    DOM.globalModal.classList.remove(
        "hidden"
    );


    DOM.globalModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";

}


export function closeModal() {

    if (!DOM.globalModal) {

        return;

    }


    DOM.globalModal.classList.add(
        "hidden"
    );


    DOM.globalModal.setAttribute(
        "aria-hidden",
        "true"
    );


    DOM.globalModalBody.innerHTML =
        "";


    DOM.globalModalFooter.innerHTML =
        "";


    document.body.style.overflow =
        "";

}


/* =========================================================
   33. CONFIRMATION DIALOG
   ========================================================= */

let confirmationResolver =
    null;


export function confirmAction({

    title = "Confirm Action",

    message =
        "Are you sure you want to continue?",

    confirmText =
        "Confirm",

    cancelText =
        "Cancel"

} = {}) {

    return new Promise(
        resolve => {

            confirmationResolver =
                resolve;


            if (DOM.confirmTitle) {

                DOM.confirmTitle.textContent =
                    title;

            }


            if (DOM.confirmMessage) {

                DOM.confirmMessage.textContent =
                    message;

            }


            if (DOM.confirmOk) {

                DOM.confirmOk.textContent =
                    confirmText;

            }


            if (DOM.confirmCancel) {

                DOM.confirmCancel.textContent =
                    cancelText;

            }


            if (DOM.confirmDialog) {

                DOM.confirmDialog.classList.remove(
                    "hidden"
                );


                DOM.confirmDialog.setAttribute(
                    "aria-hidden",
                    "false"
                );

            }

        }
    );

}


function resolveConfirmation(
    result
) {

    if (
        DOM.confirmDialog
    ) {

        DOM.confirmDialog.classList.add(
            "hidden"
        );


        DOM.confirmDialog.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    if (
        typeof confirmationResolver ===
        "function"
    ) {

        const resolver =
            confirmationResolver;


        confirmationResolver =
            null;


        resolver(
            Boolean(result)
        );

    }

}


/* =========================================================
   34. TOAST
   ========================================================= */

export function showToast(
    type = "info",
    title = "",
    message = ""
) {

    if (!DOM.toastContainer) {

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast toast-${type}`;


    toast.innerHTML = `

        <div class="toast-content">

            ${
                title
                    ? `<div class="toast-title">
                            ${escapeHTML(title)}
                       </div>`
                    : ""
            }

            ${
                message
                    ? `<div class="toast-message">
                            ${escapeHTML(message)}
                       </div>`
                    : ""
            }

        </div>

    `;


    DOM.toastContainer.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.style.opacity =
                "0";

            toast.style.transform =
                "translateX(20px)";


            setTimeout(
                () => {

                    toast.remove();

                },
                250
            );

        },
        4000
    );

}


/* =========================================================
   35. KEYBOARD EVENTS
   ========================================================= */

function handleKeyboardEvents(
    event
) {

    if (
        event.key === "Escape"
    ) {

        if (
            DOM.globalModal &&
            !DOM.globalModal.classList.contains(
                "hidden"
            )
        ) {

            closeModal();

            return;

        }


        if (
            DOM.confirmDialog &&
            !DOM.confirmDialog.classList.contains(
                "hidden"
            )
        ) {

            resolveConfirmation(
                false
            );

            return;

        }


        if (
            appState.sidebarOpen
        ) {

            closeMobileSidebar();

        }

    }

}


/* =========================================================
   36. ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {

    return String(value ?? "")
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


/* =========================================================
   37. GET APPLICATION STATE
   ========================================================= */

export function getAppState() {

    return appState;

}


/* =========================================================
   38. GET MODULE REGISTRY
   ========================================================= */

export function getModuleRegistry() {

    return MODULE_REGISTRY;

}


/* =========================================================
   39. GET COMPANY SETTINGS
   ========================================================= */

export function getCompanySettings() {

    return appState.companySettings;

}


/* =========================================================
   40. APPLICATION START
   ========================================================= */

initializeApplication()
    .catch(
        error => {

            console.error(
                "Critical application initialization error:",
                error
            );


            showLoginScreen();

        }
    );
