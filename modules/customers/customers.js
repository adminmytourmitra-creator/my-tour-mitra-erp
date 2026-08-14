/* =========================================================
   MY TOUR MITRA ERP
   CUSTOMERS MODULE
   customers.js
   ========================================================= */

"use strict";


/* =========================================================
   1. MODULE STATE
   ========================================================= */

const CustomersModule = {

    customers: [],

    filteredCustomers: [],

    currentPage: 1,

    pageSize: 10,

    editingCustomerId: null,

    deletingCustomerId: null,

    viewingCustomerId: null,

    initialized: false

};


/* =========================================================
   2. FIRESTORE COLLECTION
   ========================================================= */

const CUSTOMERS_COLLECTION = "customers";


/* =========================================================
   3. DOM HELPERS
   ========================================================= */

function customerEl(id) {

    return document.getElementById(id);

}


function customerQuery(selector, parent = document) {

    return parent.querySelector(selector);

}


function customerQueryAll(selector, parent = document) {

    return Array.from(parent.querySelectorAll(selector));

}


/* =========================================================
   4. FIREBASE HELPERS
   ========================================================= */

function getCustomersFirestore() {

    if (typeof db !== "undefined") {

        return db;

    }

    if (
        typeof window !== "undefined" &&
        window.db
    ) {

        return window.db;

    }

    return null;

}


/* =========================================================
   5. MODULE INITIALIZATION
   ========================================================= */

async function initCustomersModule() {

    if (CustomersModule.initialized) {

        await loadCustomers();

        return;

    }


    bindCustomerEvents();


    CustomersModule.initialized = true;


    await loadCustomers();

}


/* =========================================================
   6. EVENT BINDINGS
   ========================================================= */

function bindCustomerEvents() {


    /* ADD CUSTOMER */

    const addButton = customerEl("customers-add-btn");

    if (addButton) {

        addButton.addEventListener(
            "click",
            () => openCustomerModal()
        );

    }


    /* EMPTY STATE ADD */

    const emptyAddButton =
        customerEl("customers-empty-add-btn");

    if (emptyAddButton) {

        emptyAddButton.addEventListener(
            "click",
            () => openCustomerModal()
        );

    }


    /* REFRESH */

    const refreshButton =
        customerEl("customers-refresh-btn");

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                await loadCustomers();

            }
        );

    }


    /* SEARCH */

    const searchInput =
        customerEl("customers-search");

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            handleCustomerSearch
        );

    }


    /* CLEAR SEARCH */

    const searchClear =
        customerEl("customers-search-clear");

    if (searchClear) {

        searchClear.addEventListener(
            "click",
            clearCustomerSearch
        );

    }


    /* STATUS FILTER */

    const statusFilter =
        customerEl("customers-status-filter");

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyCustomerFilters
        );

    }


    /* CITY FILTER */

    const cityFilter =
        customerEl("customers-city-filter");

    if (cityFilter) {

        cityFilter.addEventListener(
            "change",
            applyCustomerFilters
        );

    }


    /* CUSTOMER FORM */

    const customerForm =
        customerEl("customer-form");

    if (customerForm) {

        customerForm.addEventListener(
            "submit",
            handleCustomerSubmit
        );

    }


    /* CLOSE FORM */

    const modalClose =
        customerEl("customer-modal-close");

    if (modalClose) {

        modalClose.addEventListener(
            "click",
            closeCustomerModal
        );

    }


    const cancelButton =
        customerEl("customer-cancel-btn");

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeCustomerModal
        );

    }


    /* FORM BACKDROP */

    const formBackdrop =
        customerQuery(
            "[data-customer-modal-close]"
        );

    if (formBackdrop) {

        formBackdrop.addEventListener(
            "click",
            closeCustomerModal
        );

    }


    /* VIEW MODAL */

    const viewClose =
        customerEl("customer-view-close");

    if (viewClose) {

        viewClose.addEventListener(
            "click",
            closeCustomerViewModal
        );

    }


    const viewCloseButton =
        customerEl("customer-view-close-btn");

    if (viewCloseButton) {

        viewCloseButton.addEventListener(
            "click",
            closeCustomerViewModal
        );

    }


    const viewBackdrop =
        customerQuery(
            "[data-customer-view-close]"
        );

    if (viewBackdrop) {

        viewBackdrop.addEventListener(
            "click",
            closeCustomerViewModal
        );

    }


    /* EDIT FROM VIEW */

    const viewEditButton =
        customerEl("customer-view-edit-btn");

    if (viewEditButton) {

        viewEditButton.addEventListener(
            "click",
            () => {

                if (
                    CustomersModule.viewingCustomerId
                ) {

                    closeCustomerViewModal();

                    openCustomerModal(
                        CustomersModule.viewingCustomerId
                    );

                }

            }
        );

    }


    /* DELETE */

    const deleteCancel =
        customerEl("customer-delete-cancel");

    if (deleteCancel) {

        deleteCancel.addEventListener(
            "click",
            closeDeleteCustomerModal
        );

    }


    const deleteConfirm =
        customerEl("customer-delete-confirm");

    if (deleteConfirm) {

        deleteConfirm.addEventListener(
            "click",
            confirmDeleteCustomer
        );

    }


    const deleteBackdrop =
        customerQuery(
            "[data-customer-delete-close]"
        );

    if (deleteBackdrop) {

        deleteBackdrop.addEventListener(
            "click",
            closeDeleteCustomerModal
        );

    }


    /* PAGINATION */

    const previousButton =
        customerEl("customers-prev-page");

    if (previousButton) {

        previousButton.addEventListener(
            "click",
            () => changeCustomerPage(-1)
        );

    }


    const nextButton =
        customerEl("customers-next-page");

    if (nextButton) {

        nextButton.addEventListener(
            "click",
            () => changeCustomerPage(1)
        );

    }


    /* TOAST */

    const toastClose =
        customerEl("customers-toast-close");

    if (toastClose) {

        toastClose.addEventListener(
            "click",
            hideCustomerToast
        );

    }


    /* TABLE ACTIONS */

    const tableBody =
        customerEl("customers-table-body");

    if (tableBody) {

        tableBody.addEventListener(
            "click",
            handleCustomerTableAction
        );

    }


    /* ESCAPE KEY */

    document.addEventListener(
        "keydown",
        handleCustomerEscapeKey
    );

}


/* =========================================================
   7. LOAD CUSTOMERS
   ========================================================= */

async function loadCustomers() {

    showCustomersLoading(true);


    try {

        const firestore = getCustomersFirestore();


        if (!firestore) {

            console.warn(
                "Firebase Firestore instance not found."
            );

            CustomersModule.customers = [];

            applyCustomerFilters();

            return;

        }


        let snapshot;


        /*
         * Firebase v9 modular SDK
         */

        if (
            typeof collection === "function" &&
            typeof getDocs === "function"
        ) {

            snapshot = await getDocs(
                collection(
                    firestore,
                    CUSTOMERS_COLLECTION
                )
            );

        }

        /*
         * Firebase compat SDK
         */

        else if (
            firestore.collection
        ) {

            snapshot = await firestore
                .collection(CUSTOMERS_COLLECTION)
                .get();

        }

        else {

            throw new Error(
                "Firestore API is not available."
            );

        }


        const customers = [];


        if (snapshot && snapshot.forEach) {

            snapshot.forEach(
                documentSnapshot => {

                    const data =
                        typeof documentSnapshot.data === "function"
                            ? documentSnapshot.data()
                            : documentSnapshot.data;


                    customers.push({

                        firestoreId:
                            documentSnapshot.id,

                        ...data

                    });

                }
            );

        }


        CustomersModule.customers =
            customers.sort(
                compareCustomersByCreatedDate
            );


        updateCustomerSummary();


        populateCityFilter();


        applyCustomerFilters();


    }
    catch (error) {

        console.error(
            "Error loading customers:",
            error
        );


        showCustomerToast(
            "Unable to load customers.",
            "error"
        );

    }
    finally {

        showCustomersLoading(false);

    }

}


/* =========================================================
   8. CUSTOMER SORT
   ========================================================= */

function compareCustomersByCreatedDate(a, b) {

    const dateA =
        getCustomerDateValue(
            a.createdAt
        );

    const dateB =
        getCustomerDateValue(
            b.createdAt
        );


    return dateB - dateA;

}


/* =========================================================
   9. DATE VALUE
   ========================================================= */

function getCustomerDateValue(value) {

    if (!value) {

        return 0;

    }


    if (
        typeof value.toDate === "function"
    ) {

        return value.toDate().getTime();

    }


    if (
        value instanceof Date
    ) {

        return value.getTime();

    }


    const parsed =
        new Date(value).getTime();


    return Number.isNaN(parsed)
        ? 0
        : parsed;

}


/* =========================================================
   10. SEARCH
   ========================================================= */

function handleCustomerSearch(event) {

    const value =
        event.target.value
            .trim()
            .toLowerCase();


    const clearButton =
        customerEl("customers-search-clear");


    if (clearButton) {

        clearButton.classList.toggle(
            "hidden",
            value.length === 0
        );

    }


    CustomersModule.currentPage = 1;

    applyCustomerFilters();

}


/* =========================================================
   11. CLEAR SEARCH
   ========================================================= */

function clearCustomerSearch() {

    const searchInput =
        customerEl("customers-search");


    if (searchInput) {

        searchInput.value = "";

        searchInput.focus();

    }


    const clearButton =
        customerEl("customers-search-clear");


    if (clearButton) {

        clearButton.classList.add(
            "hidden"
        );

    }


    CustomersModule.currentPage = 1;

    applyCustomerFilters();

}


/* =========================================================
   12. APPLY FILTERS
   ========================================================= */

function applyCustomerFilters() {

    const searchInput =
        customerEl("customers-search");


    const statusFilter =
        customerEl("customers-status-filter");


    const cityFilter =
        customerEl("customers-city-filter");


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const status =
        statusFilter
            ? statusFilter.value
            : "all";


    const city =
        cityFilter
            ? cityFilter.value
            : "all";


    CustomersModule.filteredCustomers =
        CustomersModule.customers.filter(
            customer => {


                /* SEARCH */

                const searchableText = [

                    customer.customerId,

                    customer.name,

                    customer.mobile,

                    customer.whatsapp,

                    customer.email,

                    customer.city,

                    customer.state

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchableText.includes(search);


                /* STATUS */

                const customerStatus =
                    String(
                        customer.status || "active"
                    ).toLowerCase();


                const matchesStatus =
                    status === "all" ||
                    customerStatus === status;


                /* CITY */

                const customerCity =
                    String(
                        customer.city || ""
                    ).trim().toLowerCase();


                const matchesCity =
                    city === "all" ||
                    customerCity ===
                        city.toLowerCase();


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesCity
                );

            }
        );


    renderCustomers();

}


/* =========================================================
   13. POPULATE CITY FILTER
   ========================================================= */

function populateCityFilter() {

    const select =
        customerEl("customers-city-filter");


    if (!select) {

        return;

    }


    const currentValue =
        select.value;


    const cities = Array.from(

        new Set(

            CustomersModule.customers

                .map(
                    customer =>
                        String(
                            customer.city || ""
                        ).trim()
                )

                .filter(Boolean)

        )

    ).sort(
        (a, b) =>
            a.localeCompare(b)
    );


    select.innerHTML = `

        <option value="all">
            All Cities
        </option>

    `;


    cities.forEach(
        city => {

            const option =
                document.createElement("option");


            option.value = city;

            option.textContent = city;


            select.appendChild(option);

        }
    );


    if (
        cities.includes(currentValue)
    ) {

        select.value =
            currentValue;

    }

}


/* =========================================================
   14. RENDER CUSTOMERS
   ========================================================= */

function renderCustomers() {

    const tableBody =
        customerEl("customers-table-body");


    const emptyState =
        customerEl("customers-empty");


    const tableWrapper =
        customerQuery(
            ".customers-table-wrapper"
        );


    if (!tableBody) {

        return;

    }


    const customers =
        CustomersModule.filteredCustomers;


    if (customers.length === 0) {

        tableBody.innerHTML = "";


        if (tableWrapper) {

            tableWrapper.classList.add(
                "hidden"
            );

        }


        if (emptyState) {

            emptyState.classList.remove(
                "hidden"
            );

        }


        updateCustomerPagination();


        return;

    }


    if (tableWrapper) {

        tableWrapper.classList.remove(
            "hidden"
        );

    }


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                customers.length /
                CustomersModule.pageSize
            )
        );


    if (
        CustomersModule.currentPage >
        totalPages
    ) {

        CustomersModule.currentPage =
            totalPages;

    }


    const start =
        (
            CustomersModule.currentPage - 1
        ) *
        CustomersModule.pageSize;


    const end =
        start +
        CustomersModule.pageSize;


    const pageCustomers =
        customers.slice(
            start,
            end
        );


    tableBody.innerHTML =
        pageCustomers
            .map(
                customer =>
                    createCustomerRow(
                        customer
                    )
            )
            .join("");


    updateCustomerPagination();

}


/* =========================================================
   15. CREATE CUSTOMER TABLE ROW
   ========================================================= */

function createCustomerRow(customer) {

    const customerId =
        escapeCustomerHtml(
            customer.customerId || "—"
        );


    const name =
        escapeCustomerHtml(
            customer.name || "Unnamed"
        );


    const mobile =
        escapeCustomerHtml(
            customer.mobile || "—"
        );


    const email =
        escapeCustomerHtml(
            customer.email || ""
        );


    const city =
        escapeCustomerHtml(
            customer.city || "—"
        );


    const state =
        escapeCustomerHtml(
            customer.state || ""
        );


    const enquiries =
        Number(
            customer.totalEnquiries || 0
        );


    const bookings =
        Number(
            customer.totalBookings || 0
        );


    const status =
        String(
            customer.status || "active"
        ).toLowerCase();


    const statusLabel =
        status === "inactive"
            ? "Inactive"
            : "Active";


    const statusClass =
        status === "inactive"
            ? "inactive"
            : "active";


    const initials =
        getCustomerInitials(
            customer.name
        );


    return `

        <tr
            data-customer-row-id="${escapeCustomerHtml(
                customer.customerId || ""
            )}"
        >

            <td>

                <span class="customer-id-badge">
                    ${customerId}
                </span>

            </td>


            <td>

                <div class="customer-table-name">

                    <span class="customer-avatar">
                        ${initials}
                    </span>

                    <div>

                        <strong>
                            ${name}
                        </strong>

                        ${
                            email
                                ? `
                                    <small>
                                        ${email}
                                    </small>
                                  `
                                : ""
                        }

                    </div>

                </div>

            </td>


            <td>

                <div class="customer-contact-cell">

                    <strong>
                        ${mobile}
                    </strong>

                    ${
                        customer.whatsapp
                            ? `
                                <small>
                                    WhatsApp:
                                    ${escapeCustomerHtml(
                                        customer.whatsapp
                                    )}
                                </small>
                              `
                            : ""
                    }

                </div>

            </td>


            <td>

                <div class="customer-location-cell">

                    <strong>
                        ${city}
                    </strong>

                    ${
                        state
                            ? `
                                <small>
                                    ${state}
                                </small>
                              `
                            : ""
                    }

                </div>

            </td>


            <td>

                <span class="customer-count-badge">
                    ${enquiries}
                </span>

            </td>


            <td>

                <span class="customer-count-badge">
                    ${bookings}
                </span>

            </td>


            <td>

                <span
                    class="customer-status-badge ${statusClass}"
                >
                    ${statusLabel}
                </span>

            </td>


            <td>

                <div class="customer-row-actions">

                    <button
                        type="button"
                        class="customer-row-action view"
                        data-customer-action="view"
                        data-customer-id="${escapeCustomerHtml(
                            customer.customerId || ""
                        )}"
                        title="View customer"
                        aria-label="View customer"
                    >
                        View
                    </button>


                    <button
                        type="button"
                        class="customer-row-action edit"
                        data-customer-action="edit"
                        data-customer-id="${escapeCustomerHtml(
                            customer.customerId || ""
                        )}"
                        title="Edit customer"
                        aria-label="Edit customer"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        class="customer-row-action delete"
                        data-customer-action="delete"
                        data-customer-id="${escapeCustomerHtml(
                            customer.customerId || ""
                        )}"
                        title="Delete customer"
                        aria-label="Delete customer"
                    >
                        Delete
                    </button>

                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   16. HANDLE TABLE ACTION
   ========================================================= */

function handleCustomerTableAction(event) {

    const button =
        event.target.closest(
            "[data-customer-action]"
        );


    if (!button) {

        return;

    }


    const action =
        button.dataset.customerAction;


    const customerId =
        button.dataset.customerId;


    if (!customerId) {

        return;

    }


    if (action === "view") {

        viewCustomer(
            customerId
        );

    }


    else if (action === "edit") {

        openCustomerModal(
            customerId
        );

    }


    else if (action === "delete") {

        openDeleteCustomerModal(
            customerId
        );

    }

}


/* =========================================================
   17. FIND CUSTOMER
   ========================================================= */

function findCustomerById(customerId) {

    return CustomersModule.customers.find(
        customer =>
            String(
                customer.customerId
            ) === String(customerId)
    );

}


/* =========================================================
   18. OPEN CUSTOMER MODAL
   ========================================================= */

async function openCustomerModal(customerId = null) {

    const modal =
        customerEl("customer-modal");


    const form =
        customerEl("customer-form");


    if (!modal || !form) {

        return;

    }


    resetCustomerForm();


    CustomersModule.editingCustomerId =
        customerId;


    const title =
        customerEl("customer-modal-title");


    const description =
        customerEl("customer-modal-description");


    const saveText =
        customerEl("customer-save-text");


    if (customerId) {

        const customer =
            findCustomerById(
                customerId
            );


        if (!customer) {

            showCustomerToast(
                "Customer not found.",
                "error"
            );

            return;

        }


        if (title) {

            title.textContent =
                "Edit Customer";

        }


        if (description) {

            description.textContent =
                "Update customer information.";

        }


        if (saveText) {

            saveText.textContent =
                "Update Customer";

        }


        populateCustomerForm(
            customer
        );

    }

    else {

        if (title) {

            title.textContent =
                "Add Customer";

        }


        if (description) {

            description.textContent =
                "Create a new customer profile.";

        }


        if (saveText) {

            saveText.textContent =
                "Save Customer";

        }


        const status =
            customerEl("customer-status");


        if (status) {

            status.value =
                "active";

        }


        const country =
            customerEl("customer-country");


        if (country) {

            country.value =
                "India";

        }


        const idInput =
            customerEl("customer-id");


        if (idInput) {

            idInput.value =
                "Auto-generated";

        }

    }


    modal.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "customer-modal-open"
    );


    setTimeout(
        () => {

            const nameInput =
                customerEl("customer-name");


            if (nameInput) {

                nameInput.focus();

            }

        },
        50
    );

}


/* =========================================================
   19. CLOSE CUSTOMER MODAL
   ========================================================= */

function closeCustomerModal() {

    const modal =
        customerEl("customer-modal");


    if (!modal) {

        return;

    }


    modal.classList.add(
        "hidden"
    );


    document.body.classList.remove(
        "customer-modal-open"
    );


    CustomersModule.editingCustomerId =
        null;


    resetCustomerForm();

}


/* =========================================================
   20. RESET FORM
   ========================================================= */

function resetCustomerForm() {

    const form =
        customerEl("customer-form");


    if (form) {

        form.reset();

    }


    clearCustomerValidation();


    const formError =
        customerEl("customer-form-error");


    if (formError) {

        formError.textContent =
            "";

        formError.classList.add(
            "hidden"
        );

    }


    const saveSpinner =
        customerEl("customer-save-spinner");


    if (saveSpinner) {

        saveSpinner.classList.add(
            "hidden"
        );

    }


    const saveButton =
        customerEl("customer-save-btn");


    if (saveButton) {

        saveButton.disabled =
            false;

    }


    const country =
        customerEl("customer-country");


    if (country) {

        country.value =
            "India";

    }

}


/* =========================================================
   21. POPULATE FORM
   ========================================================= */

function populateCustomerForm(customer) {

    setCustomerField(
        "customer-id",
        customer.customerId
    );


    setCustomerField(
        "customer-name",
        customer.name
    );


    setCustomerField(
        "customer-mobile",
        customer.mobile
    );


    setCustomerField(
        "customer-whatsapp",
        customer.whatsapp
    );


    setCustomerField(
        "customer-email",
        customer.email
    );


    setCustomerField(
        "customer-dob",
        customer.dateOfBirth
    );


    setCustomerField(
        "customer-address",
        customer.address
    );


    setCustomerField(
        "customer-city",
        customer.city
    );


    setCustomerField(
        "customer-state",
        customer.state
    );


    setCustomerField(
        "customer-country",
        customer.country || "India"
    );


    setCustomerField(
        "customer-pincode",
        customer.pincode
    );


    setCustomerField(
        "customer-source",
        customer.source
    );


    setCustomerField(
        "customer-preferred-contact",
        customer.preferredContact
    );


    setCustomerField(
        "customer-notes",
        customer.notes
    );


    setCustomerField(
        "customer-status",
        customer.status || "active"
    );

}


/* =========================================================
   22. SET FORM FIELD
   ========================================================= */

function setCustomerField(
    elementId,
    value
) {

    const element =
        customerEl(elementId);


    if (!element) {

        return;

    }


    element.value =
        value == null
            ? ""
            : value;

}


/* =========================================================
   23. HANDLE CUSTOMER SUBMIT
   ========================================================= */

async function handleCustomerSubmit(event) {

    event.preventDefault();


    clearCustomerValidation();


    const data =
        getCustomerFormData();


    const validation =
        validateCustomerData(
            data
        );


    if (!validation.valid) {

        showCustomerFormError(
            validation.message
        );

        return;

    }


    setCustomerSavingState(true);


    try {

        if (
            CustomersModule.editingCustomerId
        ) {

            await updateCustomer(
                CustomersModule.editingCustomerId,
                data
            );


            showCustomerToast(
                "Customer updated successfully.",
                "success"
            );

        }

        else {

            await createCustomer(
                data
            );


            showCustomerToast(
                "Customer created successfully.",
                "success"
            );

        }


        closeCustomerModal();


        await loadCustomers();


        notifyDashboardCustomerChange();


    }
    catch (error) {

        console.error(
            "Customer save error:",
            error
        );


        showCustomerFormError(
            getCustomerErrorMessage(
                error
            )
        );

    }
    finally {

        setCustomerSavingState(false);

    }

}


/* =========================================================
   24. GET FORM DATA
   ========================================================= */

function getCustomerFormData() {

    return {

        name:
            getCustomerFieldValue(
                "customer-name"
            ),

        mobile:
            getCustomerFieldValue(
                "customer-mobile"
            ),

        whatsapp:
            getCustomerFieldValue(
                "customer-whatsapp"
            ),

        email:
            getCustomerFieldValue(
                "customer-email"
            ),

        dateOfBirth:
            getCustomerFieldValue(
                "customer-dob"
            ),

        address:
            getCustomerFieldValue(
                "customer-address"
            ),

        city:
            getCustomerFieldValue(
                "customer-city"
            ),

        state:
            getCustomerFieldValue(
                "customer-state"
            ),

        country:
            getCustomerFieldValue(
                "customer-country"
            ) || "India",

        pincode:
            getCustomerFieldValue(
                "customer-pincode"
            ),

        source:
            getCustomerFieldValue(
                "customer-source"
            ),

        preferredContact:
            getCustomerFieldValue(
                "customer-preferred-contact"
            ),

        notes:
            getCustomerFieldValue(
                "customer-notes"
            ),

        status:
            getCustomerFieldValue(
                "customer-status"
            ) || "active"

    };

}


/* =========================================================
   25. GET FIELD VALUE
   ========================================================= */

function getCustomerFieldValue(
    elementId
) {

    const element =
        customerEl(elementId);


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


/* =========================================================
   26. VALIDATE CUSTOMER
   ========================================================= */

function validateCustomerData(data) {


    if (!data.name) {

        showCustomerFieldError(
            "customer-name",
            "Customer name is required."
        );


        return {

            valid: false,

            message:
                "Please enter customer name."

        };

    }


    if (!data.mobile) {

        showCustomerFieldError(
            "customer-mobile",
            "Mobile number is required."
        );


        return {

            valid: false,

            message:
                "Please enter mobile number."

        };

    }


    const mobileDigits =
        data.mobile.replace(
            /\D/g,
            ""
        );


    if (
        mobileDigits.length < 10
    ) {

        showCustomerFieldError(
            "customer-mobile",
            "Please enter a valid mobile number."
        );


        return {

            valid: false,

            message:
                "Please enter a valid mobile number."

        };

    }


    if (
        data.email &&
        !isValidCustomerEmail(
            data.email
        )
    ) {

        showCustomerFieldError(
            "customer-email",
            "Please enter a valid email address."
        );


        return {

            valid: false,

            message:
                "Please enter a valid email address."

        };

    }


    return {

        valid: true,

        message: ""

    };

}


/* =========================================================
   27. EMAIL VALIDATION
   ========================================================= */

function isValidCustomerEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


/* =========================================================
   28. CREATE CUSTOMER
   ========================================================= */

async function createCustomer(data) {

    const firestore =
        getCustomersFirestore();


    if (!firestore) {

        throw new Error(
            "Firebase is not connected."
        );

    }


    const customerId =
        await generateCustomerId();


    const now =
        getCustomerServerTimestamp();


    const customerData = {

        customerId,

        name: data.name,

        mobile: normalizeCustomerPhone(
            data.mobile
        ),

        whatsapp:
            normalizeCustomerPhone(
                data.whatsapp
            ),

        email:
            data.email.toLowerCase(),

        dateOfBirth:
            data.dateOfBirth,

        address:
            data.address,

        city:
            data.city,

        state:
            data.state,

        country:
            data.country || "India",

        pincode:
            data.pincode,

        source:
            data.source,

        preferredContact:
            data.preferredContact,

        notes:
            data.notes,

        status:
            data.status || "active",

        totalEnquiries: 0,

        totalPackages: 0,

        totalQuotations: 0,

        totalBookings: 0,

        totalInvoices: 0,

        totalPayments: 0,

        totalOutstanding: 0,

        createdAt:
            now,

        updatedAt:
            now

    };


    await firestoreAddCustomer(
        firestore,
        customerData
    );


    return customerData;

}


/* =========================================================
   29. UPDATE CUSTOMER
   ========================================================= */

async function updateCustomer(
    customerId,
    data
) {

    const firestore =
        getCustomersFirestore();


    if (!firestore) {

        throw new Error(
            "Firebase is not connected."
        );

    }


    const existing =
        findCustomerById(
            customerId
        );


    if (!existing) {

        throw new Error(
            "Customer record not found."
        );

    }


    const updateData = {

        name: data.name,

        mobile:
            normalizeCustomerPhone(
                data.mobile
            ),

        whatsapp:
            normalizeCustomerPhone(
                data.whatsapp
            ),

        email:
            data.email.toLowerCase(),

        dateOfBirth:
            data.dateOfBirth,

        address:
            data.address,

        city:
            data.city,

        state:
            data.state,

        country:
            data.country || "India",

        pincode:
            data.pincode,

        source:
            data.source,

        preferredContact:
            data.preferredContact,

        notes:
            data.notes,

        status:
            data.status || "active",

        updatedAt:
            getCustomerServerTimestamp()

    };


    await firestoreUpdateCustomer(
        firestore,
        existing.firestoreId,
        updateData
    );


    return updateData;

}


/* =========================================================
   30. FIRESTORE ADD
   ========================================================= */

async function firestoreAddCustomer(
    firestore,
    data
) {

    if (
        typeof collection === "function" &&
        typeof addDoc === "function"
    ) {

        await addDoc(
            collection(
                firestore,
                CUSTOMERS_COLLECTION
            ),
            data
        );

        return;

    }


    if (
        firestore.collection
    ) {

        await firestore
            .collection(
                CUSTOMERS_COLLECTION
            )
            .add(data);

        return;

    }


    throw new Error(
        "Firestore add operation unavailable."
    );

}


/* =========================================================
   31. FIRESTORE UPDATE
   ========================================================= */

async function firestoreUpdateCustomer(
    firestore,
    firestoreId,
    data
) {

    if (
        typeof doc === "function" &&
        typeof updateDoc === "function"
    ) {

        await updateDoc(
            doc(
                firestore,
                CUSTOMERS_COLLECTION,
                firestoreId
            ),
            data
        );

        return;

    }


    if (
        firestore.collection
    ) {

        await firestore
            .collection(
                CUSTOMERS_COLLECTION
            )
            .doc(firestoreId)
            .update(data);

        return;

    }


    throw new Error(
        "Firestore update operation unavailable."
    );

}


/* =========================================================
   32. GENERATE CUSTOMER ID
   ========================================================= */

async function generateCustomerId() {

    const firestore =
        getCustomersFirestore();


    /*
     * We use the existing customer records
     * and calculate the next sequence.
     *
     * Format:
     *
     * CUS0001
     * CUS0002
     * CUS0003
     *
     */


    let highestNumber = 0;


    CustomersModule.customers.forEach(
        customer => {

            const id =
                String(
                    customer.customerId || ""
                ).toUpperCase();


            const match =
                id.match(
                    /^CUS(\d+)$/
                );


            if (match) {

                const number =
                    parseInt(
                        match[1],
                        10
                    );


                if (
                    Number.isFinite(number) &&
                    number > highestNumber
                ) {

                    highestNumber =
                        number;

                }

            }

        }
    );


    /*
     * Also check Firestore directly
     * if no local records are available.
     */

    if (
        highestNumber === 0 &&
        firestore
    ) {

        try {

            let snapshot = null;


            if (
                typeof collection === "function" &&
                typeof getDocs === "function"
            ) {

                snapshot =
                    await getDocs(
                        collection(
                            firestore,
                            CUSTOMERS_COLLECTION
                        )
                    );

            }

            else if (
                firestore.collection
            ) {

                snapshot =
                    await firestore
                        .collection(
                            CUSTOMERS_COLLECTION
                        )
                        .get();

            }


            if (
                snapshot &&
                snapshot.forEach
            ) {

                snapshot.forEach(
                    documentSnapshot => {

                        const data =
                            documentSnapshot.data();


                        const id =
                            String(
                                data.customerId || ""
                            ).toUpperCase();


                        const match =
                            id.match(
                                /^CUS(\d+)$/
                            );


                        if (match) {

                            const number =
                                parseInt(
                                    match[1],
                                    10
                                );


                            if (
                                Number.isFinite(
                                    number
                                ) &&
                                number >
                                    highestNumber
                            ) {

                                highestNumber =
                                    number;

                            }

                        }

                    }
                );

            }

        }
        catch (error) {

            console.warn(
                "Could not verify customer sequence:",
                error
            );

        }

    }


    return (
        "CUS" +
        String(
            highestNumber + 1
        ).padStart(
            4,
            "0"
        )
    );

}


/* =========================================================
   33. SERVER TIMESTAMP
   ========================================================= */

function getCustomerServerTimestamp() {

    if (
        typeof serverTimestamp ===
        "function"
    ) {

        return serverTimestamp();

    }


    if (
        typeof firebase !== "undefined" &&
        firebase.firestore &&
        firebase.firestore.FieldValue
    ) {

        return firebase.firestore
            .FieldValue
            .serverTimestamp();

    }


    return new Date();

}


/* =========================================================
   34. NORMALIZE PHONE
   ========================================================= */

function normalizeCustomerPhone(
    value
) {

    if (!value) {

        return "";

    }


    return String(value)
        .trim()
        .replace(
            /\s+/g,
            " "
        );

}


/* =========================================================
   35. VIEW CUSTOMER
   ========================================================= */

function viewCustomer(customerId) {

    const customer =
        findCustomerById(
            customerId
        );


    if (!customer) {

        showCustomerToast(
            "Customer not found.",
            "error"
        );

        return;

    }


    CustomersModule.viewingCustomerId =
        customerId;


    const profile =
        customerEl("customer-profile");


    if (profile) {

        profile.innerHTML =
            createCustomerProfile(
                customer
            );

    }


    const modal =
        customerEl("customer-view-modal");


    if (modal) {

        modal.classList.remove(
            "hidden"
        );

    }


    document.body.classList.add(
        "customer-modal-open"
    );

}


/* =========================================================
   36. CUSTOMER PROFILE
   ========================================================= */

function createCustomerProfile(
    customer
) {

    const initials =
        getCustomerInitials(
            customer.name
        );


    const status =
        String(
            customer.status || "active"
        ).toLowerCase();


    const statusLabel =
        status === "inactive"
            ? "Inactive"
            : "Active";


    return `

        <div class="customer-profile-header">

            <div class="customer-profile-avatar">
                ${initials}
            </div>

            <div class="customer-profile-main">

                <h4>
                    ${escapeCustomerHtml(
                        customer.name ||
                        "Unnamed Customer"
                    )}
                </h4>

                <span class="customer-profile-id">
                    ${escapeCustomerHtml(
                        customer.customerId ||
                        "—"
                    )}
                </span>

                <span
                    class="customer-status-badge ${status}"
                >
                    ${statusLabel}
                </span>

            </div>

        </div>


        <div class="customer-profile-grid">


            <div class="customer-profile-item">

                <span>
                    Mobile
                </span>

                <strong>
                    ${escapeCustomerHtml(
                        customer.mobile ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="customer-profile-item">

                <span>
                    WhatsApp
                </span>

                <strong>
                    ${escapeCustomerHtml(
                        customer.whatsapp ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="customer-profile-item">

                <span>
                    Email
                </span>

                <strong>
                    ${escapeCustomerHtml(
                        customer.email ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="customer-profile-item">

                <span>
                    Location
                </span>

                <strong>
                    ${escapeCustomerHtml(
                        [
                            customer.city,
                            customer.state,
                            customer.country
                        ]
                            .filter(Boolean)
                            .join(", ") ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="customer-profile-item">

                <span>
                    Enquiries
                </span>

                <strong>
                    ${Number(
                        customer.totalEnquiries ||
                        0
                    )}
                </strong>

            </div>


            <div class="customer-profile-item">

                <span>
                    Packages
                </span>

                <strong>
                    ${Number(
                        customer.totalPackages ||
                        0
                    )}
                </strong>

            </div>


            <div class="customer-profile-item">

                <span>
                    Quotations
                </span>

                <strong>
                    ${Number(
                        customer.totalQuotations ||
                        0
                    )}
                </strong>

            </div>


            <div class="customer-profile-item">

                <span>
                    Bookings
                </span>

                <strong>
                    ${Number(
                        customer.totalBookings ||
                        0
                    )}
                </strong>

            </div>


            <div class="customer-profile-item">

                <span>
                    Total Payments
                </span>

                <strong>
                    ₹${formatCustomerNumber(
                        customer.totalPayments ||
                        0
                    )}
                </strong>

            </div>


            <div class="customer-profile-item">

                <span>
                    Outstanding
                </span>

                <strong>
                    ₹${formatCustomerNumber(
                        customer.totalOutstanding ||
                        0
                    )}
                </strong>

            </div>


            <div class="customer-profile-item">

                <span>
                    Source
                </span>

                <strong>
                    ${escapeCustomerHtml(
                        customer.source ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="customer-profile-item">

                <span>
                    Preferred Contact
                </span>

                <strong>
                    ${escapeCustomerHtml(
                        customer.preferredContact ||
                        "—"
                    )}
                </strong>

            </div>

        </div>


        <div class="customer-profile-notes">

            <span>
                Internal Notes
            </span>

            <p>
                ${escapeCustomerHtml(
                    customer.notes ||
                    "No internal notes."
                )}
            </p>

        </div>

    `;

}


/* =========================================================
   37. CLOSE VIEW MODAL
   ========================================================= */

function closeCustomerViewModal() {

    const modal =
        customerEl("customer-view-modal");


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }


    document.body.classList.remove(
        "customer-modal-open"
    );


    CustomersModule.viewingCustomerId =
        null;

}


/* =========================================================
   38. OPEN DELETE MODAL
   ========================================================= */

function openDeleteCustomerModal(
    customerId
) {

    const customer =
        findCustomerById(
            customerId
        );


    if (!customer) {

        showCustomerToast(
            "Customer not found.",
            "error"
        );

        return;

    }


    CustomersModule.deletingCustomerId =
        customerId;


    const message =
        customerEl(
            "customer-delete-message"
        );


    if (message) {

        message.textContent =
            `Are you sure you want to delete ${customer.name || "this customer"}? This action cannot be undone.`;

    }


    const modal =
        customerEl(
            "customer-delete-modal"
        );


    if (modal) {

        modal.classList.remove(
            "hidden"
        );

    }


    document.body.classList.add(
        "customer-modal-open"
    );

}


/* =========================================================
   39. CLOSE DELETE MODAL
   ========================================================= */

function closeDeleteCustomerModal() {

    const modal =
        customerEl(
            "customer-delete-modal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }


    document.body.classList.remove(
        "customer-modal-open"
    );


    CustomersModule.deletingCustomerId =
        null;

}


/* =========================================================
   40. CONFIRM DELETE
   ========================================================= */

async function confirmDeleteCustomer() {

    const customerId =
        CustomersModule.deletingCustomerId;


    if (!customerId) {

        return;

    }


    const customer =
        findCustomerById(
            customerId
        );


    if (!customer) {

        closeDeleteCustomerModal();

        return;

    }


    const firestore =
        getCustomersFirestore();


    if (!firestore) {

        showCustomerToast(
            "Firebase is not connected.",
            "error"
        );

        return;

    }


    const deleteButton =
        customerEl(
            "customer-delete-confirm"
        );


    if (deleteButton) {

        deleteButton.disabled =
            true;

        deleteButton.textContent =
            "Deleting...";

    }


    try {

        await firestoreDeleteCustomer(
            firestore,
            customer.firestoreId
        );


        closeDeleteCustomerModal();


        showCustomerToast(
            "Customer deleted successfully.",
            "success"
        );


        await loadCustomers();


        notifyDashboardCustomerChange();


    }
    catch (error) {

        console.error(
            "Customer delete error:",
            error
        );


        showCustomerToast(
            "Unable to delete customer.",
            "error"
        );

    }
    finally {

        if (deleteButton) {

            deleteButton.disabled =
                false;

            deleteButton.textContent =
                "Delete Customer";

        }

    }

}


/* =========================================================
   41. FIRESTORE DELETE
   ========================================================= */

async function firestoreDeleteCustomer(
    firestore,
    firestoreId
) {

    if (
        typeof doc === "function" &&
        typeof deleteDoc === "function"
    ) {

        await deleteDoc(
            doc(
                firestore,
                CUSTOMERS_COLLECTION,
                firestoreId
            )
        );

        return;

    }


    if (
        firestore.collection
    ) {

        await firestore
            .collection(
                CUSTOMERS_COLLECTION
            )
            .doc(firestoreId)
            .delete();

        return;

    }


    throw new Error(
        "Firestore delete operation unavailable."
    );

}


/* =========================================================
   42. SUMMARY
   ========================================================= */

function updateCustomerSummary() {

    const customers =
        CustomersModule.customers;


    const total =
        customers.length;


    const active =
        customers.filter(
            customer =>
                String(
                    customer.status ||
                    "active"
                ).toLowerCase() ===
                "active"
        ).length;


    const enquiryCustomers =
        customers.filter(
            customer =>
                Number(
                    customer.totalEnquiries ||
                    0
                ) > 0
        ).length;


    const bookingCustomers =
        customers.filter(
            customer =>
                Number(
                    customer.totalBookings ||
                    0
                ) > 0
        ).length;


    setCustomerText(
        "customers-total-count",
        total
    );


    setCustomerText(
        "customers-active-count",
        active
    );


    setCustomerText(
        "customers-enquiry-count",
        enquiryCustomers
    );


    setCustomerText(
        "customers-booking-count",
        bookingCustomers
    );

}


/* =========================================================
   43. PAGINATION
   ========================================================= */

function updateCustomerPagination() {

    const total =
        CustomersModule.filteredCustomers.length;


    const pageSize =
        CustomersModule.pageSize;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                pageSize
            )
        );


    if (
        CustomersModule.currentPage >
        totalPages
    ) {

        CustomersModule.currentPage =
            totalPages;

    }


    const from =
        total === 0
            ? 0
            : (
                (
                    CustomersModule.currentPage -
                    1
                ) *
                pageSize
            ) + 1;


    const to =
        total === 0
            ? 0
            : Math.min(
                CustomersModule.currentPage *
                pageSize,
                total
            );


    setCustomerText(
        "customers-pagination-from",
        from
    );


    setCustomerText(
        "customers-pagination-to",
        to
    );


    setCustomerText(
        "customers-pagination-total",
        total
    );


    setCustomerText(
        "customers-visible-count",
        total
    );


    setCustomerText(
        "customers-page-number",
        CustomersModule.currentPage
    );


    const previousButton =
        customerEl(
            "customers-prev-page"
        );


    const nextButton =
        customerEl(
            "customers-next-page"
        );


    if (previousButton) {

        previousButton.disabled =
            CustomersModule.currentPage <= 1;

    }


    if (nextButton) {

        nextButton.disabled =
            CustomersModule.currentPage >=
            totalPages;

    }

}


/* =========================================================
   44. CHANGE PAGE
   ========================================================= */

function changeCustomerPage(
    direction
) {

    const total =
        CustomersModule.filteredCustomers.length;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                CustomersModule.pageSize
            )
        );


    const newPage =
        CustomersModule.currentPage +
        direction;


    if (
        newPage < 1 ||
        newPage > totalPages
    ) {

        return;

    }


    CustomersModule.currentPage =
        newPage;


    renderCustomers();

}


/* =========================================================
   45. CUSTOMER LOADING
   ========================================================= */

function showCustomersLoading(
    show
) {

    const loading =
        customerEl(
            "customers-loading"
        );


    if (!loading) {

        return;

    }


    loading.classList.toggle(
        "hidden",
        !show
    );

}


/* =========================================================
   46. FORM SAVING STATE
   ========================================================= */

function setCustomerSavingState(
    saving
) {

    const button =
        customerEl(
            "customer-save-btn"
        );


    const spinner =
        customerEl(
            "customer-save-spinner"
        );


    const text =
        customerEl(
            "customer-save-text"
        );


    if (button) {

        button.disabled =
            saving;

    }


    if (spinner) {

        spinner.classList.toggle(
            "hidden",
            !saving
        );

    }


    if (text) {

        if (saving) {

            text.textContent =
                "Saving...";

        }
        else {

            text.textContent =
                CustomersModule.editingCustomerId
                    ? "Update Customer"
                    : "Save Customer";

        }

    }

}


/* =========================================================
   47. VALIDATION HELPERS
   ========================================================= */

function showCustomerFieldError(
    fieldId,
    message
) {

    const input =
        customerEl(fieldId);


    if (input) {

        input.classList.add(
            "customer-field-invalid"
        );

    }


    const error =
        customerEl(
            `${fieldId}-error`
        );


    if (error) {

        error.textContent =
            message;

    }

}


function clearCustomerValidation() {

    customerQueryAll(
        ".customer-field-invalid"
    ).forEach(
        element => {

            element.classList.remove(
                "customer-field-invalid"
            );

        }
    );


    customerQueryAll(
        ".customer-field-error"
    ).forEach(
        element => {

            element.textContent =
                "";

        }
    );

}


function showCustomerFormError(
    message
) {

    const error =
        customerEl(
            "customer-form-error"
        );


    if (!error) {

        return;

    }


    error.textContent =
        message;


    error.classList.remove(
        "hidden"
    );

}


/* =========================================================
   48. TOAST
   ========================================================= */

let customerToastTimer = null;


function showCustomerToast(
    message,
    type = "success"
) {

    const toast =
        customerEl(
            "customers-toast"
        );


    const toastMessage =
        customerEl(
            "customers-toast-message"
        );


    const toastIcon =
        customerEl(
            "customers-toast-icon"
        );


    if (!toast) {

        return;

    }


    if (toastMessage) {

        toastMessage.textContent =
            message;

    }


    if (toastIcon) {

        toastIcon.textContent =
            type === "error"
                ? "!"
                : "✓";

    }


    toast.classList.remove(
        "hidden"
    );


    toast.classList.remove(
        "success",
        "error"
    );


    toast.classList.add(
        type
    );


    if (customerToastTimer) {

        clearTimeout(
            customerToastTimer
        );

    }


    customerToastTimer =
        setTimeout(
            hideCustomerToast,
            4000
        );

}


function hideCustomerToast() {

    const toast =
        customerEl(
            "customers-toast"
        );


    if (toast) {

        toast.classList.add(
            "hidden"
        );

    }


    customerToastTimer =
        null;

}


/* =========================================================
   49. ESCAPE KEY
   ========================================================= */

function handleCustomerEscapeKey(
    event
) {

    if (
        event.key !== "Escape"
    ) {

        return;

    }


    const deleteModal =
        customerEl(
            "customer-delete-modal"
        );


    if (
        deleteModal &&
        !deleteModal.classList.contains(
            "hidden"
        )
    ) {

        closeDeleteCustomerModal();

        return;

    }


    const viewModal =
        customerEl(
            "customer-view-modal"
        );


    if (
        viewModal &&
        !viewModal.classList.contains(
            "hidden"
        )
    ) {

        closeCustomerViewModal();

        return;

    }


    const modal =
        customerEl(
            "customer-modal"
        );


    if (
        modal &&
        !modal.classList.contains(
            "hidden"
        )
    ) {

        closeCustomerModal();

    }

}


/* =========================================================
   50. DASHBOARD NOTIFICATION
   ========================================================= */

function notifyDashboardCustomerChange() {

    try {

        window.dispatchEvent(
            new CustomEvent(
                "mytourmitra:customers-updated"
            )
        );

    }
    catch (error) {

        console.warn(
            "Dashboard customer update event failed:",
            error
        );

    }

}


/* =========================================================
   51. SET TEXT
   ========================================================= */

function setCustomerText(
    elementId,
    value
) {

    const element =
        customerEl(elementId);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   52. INITIALS
   ========================================================= */

function getCustomerInitials(
    name
) {

    if (!name) {

        return "C";

    }


    const words =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();

}


/* =========================================================
   53. FORMAT NUMBER
   ========================================================= */

function formatCustomerNumber(
    value
) {

    const number =
        Number(value) || 0;


    return number.toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 2
        }
    );

}


/* =========================================================
   54. ESCAPE HTML
   ========================================================= */

function escapeCustomerHtml(
    value
) {

    return String(
        value == null
            ? ""
            : value
    )
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
   55. ERROR MESSAGE
   ========================================================= */

function getCustomerErrorMessage(
    error
) {

    if (!error) {

        return "Something went wrong.";

    }


    if (
        error.code ===
        "permission-denied"
    ) {

        return "You do not have permission to perform this action.";

    }


    if (
        error.code ===
        "failed-precondition"
    ) {

        return "Firebase configuration is incomplete.";

    }


    if (
        error.message
    ) {

        return error.message;

    }


    return "Unable to complete the operation.";

}


/* =========================================================
   56. MODULE EXPORT / GLOBAL ACCESS
   ========================================================= */

window.CustomersModule =
    CustomersModule;


window.initCustomersModule =
    initCustomersModule;


window.loadCustomers =
    loadCustomers;


window.openCustomerModal =
    openCustomerModal;


window.viewCustomer =
    viewCustomer;


/* =========================================================
   END OF CUSTOMERS MODULE
   ========================================================= */
