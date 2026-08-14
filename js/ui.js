/* =========================================================
   MY TOUR MITRA ERP
   UI / NAVIGATION CORE
   File: /js/ui.js
   ========================================================= */

"use strict";


/* =========================================================
   1. GLOBAL UI STATE
   ========================================================= */

window.MTM_UI = {

    currentModule: "dashboard",

    sidebarOpen: false,

    loading: false,

    initialized: false

};


/* =========================================================
   2. DOM HELPERS
   ========================================================= */

window.mtmGet = function (selector) {

    return document.querySelector(selector);

};


window.mtmGetAll = function (selector) {

    return document.querySelectorAll(selector);

};


window.mtmShow = function (element) {

    if (!element) return;

    element.classList.remove("hidden");

};


window.mtmHide = function (element) {

    if (!element) return;

    element.classList.add("hidden");

};


/* =========================================================
   3. SIDEBAR
   ========================================================= */

window.mtmOpenSidebar = function () {

    const sidebar =
        document.querySelector(".sidebar");

    const overlay =
        document.querySelector(".sidebar-overlay");

    if (sidebar) {

        sidebar.classList.add(
            "mobile-open"
        );

    }

    if (overlay) {

        overlay.classList.add(
            "active"
        );

    }

    MTM_UI.sidebarOpen = true;

};


window.mtmCloseSidebar = function () {

    const sidebar =
        document.querySelector(".sidebar");

    const overlay =
        document.querySelector(".sidebar-overlay");

    if (sidebar) {

        sidebar.classList.remove(
            "mobile-open"
        );

    }

    if (overlay) {

        overlay.classList.remove(
            "active"
        );

    }

    MTM_UI.sidebarOpen = false;

};


window.mtmToggleSidebar = function () {

    if (MTM_UI.sidebarOpen) {

        mtmCloseSidebar();

    } else {

        mtmOpenSidebar();

    }

};


/* =========================================================
   4. PAGE TITLE
   ========================================================= */

window.mtmSetPageTitle = function (
    title,
    description = ""
) {

    const heading =
        document.querySelector(
            ".page-heading h1"
        );

    const subheading =
        document.querySelector(
            ".page-heading p"
        );

    if (heading) {

        heading.textContent =
            title || "Dashboard";

    }

    if (subheading) {

        subheading.textContent =
            description || "";

    }

};


/* =========================================================
   5. ACTIVE NAVIGATION
   ========================================================= */

window.mtmSetActiveNavigation =
    function (moduleName) {

        const navItems =
            document.querySelectorAll(
                ".nav-item"
            );

        navItems.forEach(
            item => {

                const target =
                    item.dataset.module ||
                    item.dataset.navigation ||
                    item.dataset.page;

                item.classList.toggle(
                    "active",
                    target === moduleName
                );

            }
        );

    };


/* =========================================================
   6. MODULE CONTAINER
   ========================================================= */

window.mtmGetModuleContainer =
    function () {

        return document.querySelector(
            "#module-container"
        ) || document.querySelector(
            ".module-container"
        );

    };


/* =========================================================
   7. LOADING STATE
   ========================================================= */

window.mtmSetLoading = function (
    isLoading
) {

    MTM_UI.loading =
        Boolean(isLoading);

    const loader =
        document.querySelector(
            "#global-loading"
        );

    if (loader) {

        loader.classList.toggle(
            "hidden",
            !MTM_UI.loading
        );

    }

};


/* =========================================================
   8. TOAST CONTAINER
   ========================================================= */

window.mtmGetToastContainer =
    function () {

        let container =
            document.querySelector(
                "#mtm-toast-container"
            );

        if (!container) {

            container =
                document.createElement(
                    "div"
                );

            container.id =
                "mtm-toast-container";

            container.className =
                "mtm-toast-container";

            document.body.appendChild(
                container
            );

        }

        return container;

    };


/* =========================================================
   9. TOAST MESSAGE
   ========================================================= */

window.mtmToast = function (
    message,
    type = "info",
    duration = 3000
) {

    const container =
        mtmGetToastContainer();

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `mtm-toast mtm-toast-${type}`;

    toast.setAttribute(
        "role",
        "status"
    );

    toast.innerHTML = `

        <span class="mtm-toast-message">
            ${mtmEscapeHTML(message)}
        </span>

        <button
            type="button"
            class="mtm-toast-close"
            aria-label="Close"
        >
            ×
        </button>

    `;

    container.appendChild(
        toast
    );

    const close =
        () => {

            toast.classList.add(
                "closing"
            );

            setTimeout(
                () => toast.remove(),
                200
            );

        };

    toast
        .querySelector(
            ".mtm-toast-close"
        )
        ?.addEventListener(
            "click",
            close
        );

    setTimeout(
        close,
        duration
    );

};


/* =========================================================
   10. SUCCESS / ERROR / WARNING / INFO
   ========================================================= */

window.mtmSuccess = function (
    message
) {

    mtmToast(
        message,
        "success"
    );

};


window.mtmError = function (
    message
) {

    mtmToast(
        message,
        "error",
        4500
    );

};


window.mtmWarning = function (
    message
) {

    mtmToast(
        message,
        "warning",
        4000
    );

};


window.mtmInfo = function (
    message
) {

    mtmToast(
        message,
        "info"
    );

};


/* =========================================================
   11. HTML ESCAPE
   ========================================================= */

window.mtmEscapeHTML = function (
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
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

};


/* =========================================================
   12. CONFIRM DIALOG
   ========================================================= */

window.mtmConfirm = function (
    message,
    title = "Confirm Action"
) {

    return new Promise(
        resolve => {

            const existing =
                document.querySelector(
                    "#mtm-confirm-modal"
                );

            if (existing) {

                existing.remove();

            }

            const modal =
                document.createElement(
                    "div"
                );

            modal.id =
                "mtm-confirm-modal";

            modal.className =
                "mtm-confirm-modal";

            modal.innerHTML = `

                <div
                    class="mtm-confirm-backdrop"
                ></div>

                <div
                    class="mtm-confirm-dialog"
                    role="dialog"
                    aria-modal="true"
                >

                    <div
                        class="mtm-confirm-header"
                    >

                        <h3>
                            ${mtmEscapeHTML(title)}
                        </h3>

                    </div>

                    <div
                        class="mtm-confirm-body"
                    >

                        <p>
                            ${mtmEscapeHTML(message)}
                        </p>

                    </div>

                    <div
                        class="mtm-confirm-actions"
                    >

                        <button
                            type="button"
                            class="mtm-confirm-cancel"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            class="mtm-confirm-ok"
                        >
                            Confirm
                        </button>

                    </div>

                </div>

            `;

            document.body.appendChild(
                modal
            );


            const finish =
                result => {

                    modal.remove();

                    resolve(result);

                };


            modal
                .querySelector(
                    ".mtm-confirm-cancel"
                )
                ?.addEventListener(
                    "click",
                    () => finish(false)
                );


            modal
                .querySelector(
                    ".mtm-confirm-ok"
                )
                ?.addEventListener(
                    "click",
                    () => finish(true)
                );


            modal
                .querySelector(
                    ".mtm-confirm-backdrop"
                )
                ?.addEventListener(
                    "click",
                    () => finish(false)
                );

        }
    );

};


/* =========================================================
   13. EMPTY STATE
   ========================================================= */

window.mtmRenderEmptyState =
    function (
        container,
        message = "No records found."
    ) {

        if (!container) return;

        container.innerHTML = `

            <div class="mtm-empty-state">

                <div class="mtm-empty-icon">
                    —
                </div>

                <p>
                    ${mtmEscapeHTML(message)}
                </p>

            </div>

        `;

    };


/* =========================================================
   14. BUTTON LOADING
   ========================================================= */

window.mtmButtonLoading =
    function (
        button,
        loading = true,
        loadingText = "Please wait..."
    ) {

        if (!button) return;

        if (loading) {

            if (
                !button.dataset.originalText
            ) {

                button.dataset.originalText =
                    button.innerHTML;

            }

            button.disabled = true;

            button.classList.add(
                "is-loading"
            );

            button.innerHTML = `
                <span class="mtm-button-spinner"></span>
                <span>
                    ${mtmEscapeHTML(
                        loadingText
                    )}
                </span>
            `;

        } else {

            button.disabled = false;

            button.classList.remove(
                "is-loading"
            );

            if (
                button.dataset.originalText
            ) {

                button.innerHTML =
                    button.dataset.originalText;

            }

        }

    };


/* =========================================================
   15. FORM RESET
   ========================================================= */

window.mtmResetForm = function (
    form
) {

    if (!form) return;

    if (
        typeof form.reset ===
        "function"
    ) {

        form.reset();

    }

    form
        .querySelectorAll(
            "input[type='hidden']"
        )
        .forEach(
            input => {

                if (
                    input.dataset.default
                    !== undefined
                ) {

                    input.value =
                        input.dataset.default;

                }

            }
        );

};


/* =========================================================
   16. FORM DATA → OBJECT
   ========================================================= */

window.mtmFormToObject =
    function (form) {

        if (!form) {

            throw new Error(
                "Form is required."
            );

        }

        const formData =
            new FormData(form);

        const data = {};

        formData.forEach(
            (value, key) => {

                if (
                    data[key] !== undefined
                ) {

                    if (
                        !Array.isArray(
                            data[key]
                        )
                    ) {

                        data[key] = [
                            data[key]
                        ];

                    }

                    data[key].push(
                        value
                    );

                } else {

                    data[key] = value;

                }

            }
        );

        return data;

    };


/* =========================================================
   17. MODAL CLOSE
   ========================================================= */

window.mtmCloseModal = function (
    modal
) {

    if (!modal) return;

    modal.classList.remove(
        "active"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

};


/* =========================================================
   18. MODAL OPEN
   ========================================================= */

window.mtmOpenModal = function (
    modal
) {

    if (!modal) return;

    modal.classList.add(
        "active"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

};


/* =========================================================
   19. GLOBAL NAVIGATION
   ========================================================= */

window.mtmNavigate = function (
    moduleName
) {

    if (!moduleName) return;

    MTM_UI.currentModule =
        moduleName;

    mtmSetActiveNavigation(
        moduleName
    );

    mtmCloseSidebar();


    /* -----------------------------------------
       Let app.js handle actual module loading
       ----------------------------------------- */

    if (
        typeof window.loadModule ===
        "function"
    ) {

        window.loadModule(
            moduleName
        );

        return;

    }


    if (
        typeof window.mtmLoadModule ===
        "function"
    ) {

        window.mtmLoadModule(
            moduleName
        );

        return;

    }


    /* -----------------------------------------
       Fallback custom event
       ----------------------------------------- */

    document.dispatchEvent(
        new CustomEvent(
            "mtm:navigate",
            {
                detail: {
                    module:
                        moduleName
                }
            }
        )
    );

};


/* =========================================================
   20. NAVIGATION EVENT HANDLERS
   ========================================================= */

window.mtmBindNavigation =
    function () {

        document.addEventListener(
            "click",
            event => {

                const navItem =
                    event.target.closest(
                        "[data-module]"
                    );

                if (!navItem) return;

                event.preventDefault();

                const moduleName =
                    navItem.dataset.module;

                mtmNavigate(
                    moduleName
                );

            }
        );


        document.addEventListener(
            "click",
            event => {

                const navigation =
                    event.target.closest(
                        "[data-dashboard-navigation]"
                    );

                if (!navigation) return;

                event.preventDefault();

                const moduleName =
                    navigation.dataset
                        .dashboardNavigation;

                mtmNavigate(
                    moduleName
                );

            }
        );


        document.addEventListener(
            "click",
            event => {

                const action =
                    event.target.closest(
                        "[data-dashboard-action]"
                    );

                if (!action) return;

                event.preventDefault();

                const moduleName =
                    action.dataset
                        .dashboardAction;

                mtmNavigate(
                    moduleName
                );

            }
        );

    };


/* =========================================================
   21. SIDEBAR EVENT HANDLERS
   ========================================================= */

window.mtmBindSidebar =
    function () {

        document.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        ".sidebar-toggle"
                    )
                ) {

                    mtmToggleSidebar();

                }

            }
        );


        document.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        ".sidebar-close"
                    )
                ) {

                    mtmCloseSidebar();

                }

            }
        );


        document.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        ".sidebar-overlay"
                    )
                ) {

                    mtmCloseSidebar();

                }

            }
        );

    };


/* =========================================================
   22. ESC KEY HANDLER
   ========================================================= */

window.mtmBindEscapeKey =
    function () {

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !== "Escape"
                ) {

                    return;

                }

                mtmCloseSidebar();


                const activeModal =
                    document.querySelector(
                        ".mtm-confirm-modal"
                    );

                if (activeModal) {

                    activeModal.remove();

                }

            }
        );

    };


/* =========================================================
   23. WINDOW RESIZE
   ========================================================= */

window.mtmBindResize =
    function () {

        window.addEventListener(
            "resize",
            () => {

                if (
                    window.innerWidth >
                    768
                ) {

                    mtmCloseSidebar();

                }

            }
        );

    };


/* =========================================================
   24. INITIALIZE UI
   ========================================================= */

window.mtmInitializeUI =
    function () {

        if (
            MTM_UI.initialized
        ) {

            return;

        }

        mtmBindNavigation();

        mtmBindSidebar();

        mtmBindEscapeKey();

        mtmBindResize();

        MTM_UI.initialized =
            true;

        console.log(
            "MTM ERP UI initialized."
        );

    };


/* =========================================================
   25. AUTO INITIALIZE
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        mtmInitializeUI
    );

} else {

    mtmInitializeUI();

}


/* =========================================================
   END OF UI.JS
   ========================================================= */
