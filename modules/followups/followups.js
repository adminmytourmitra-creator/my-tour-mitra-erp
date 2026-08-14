/* =========================================================
   MY TOUR MITRA ERP
   FOLLOW-UPS MODULE
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       STATE
       ===================================================== */

    let followups = [];
    let customers = [];
    let enquiries = [];

    let editingFollowupId = null;
    let deletingFollowupId = null;

    let initialized = false;


    /* =====================================================
       FIREBASE HELPERS
       ===================================================== */

    function getDB() {
        return (
            window.db ||
            window.firebaseDB ||
            window.firebaseDb ||
            window.firestoreDB ||
            null
        );
    }


    function getFirebaseFunction(name) {
        return window[name] || null;
    }


    async function getCollectionData(collectionName) {

        const db = getDB();

        const collectionFn = getFirebaseFunction("collection");
        const getDocsFn = getFirebaseFunction("getDocs");

        if (!db || !collectionFn || !getDocsFn) {
            throw new Error(
                "Firebase Firestore is not available."
            );
        }

        const snapshot = await getDocsFn(
            collectionFn(db, collectionName)
        );

        const records = [];

        snapshot.forEach(function (docSnapshot) {

            records.push({
                id: docSnapshot.id,
                ...docSnapshot.data()
            });

        });

        return records;
    }


    /* =====================================================
       DOM HELPERS
       ===================================================== */

    function $(id) {
        return document.getElementById(id);
    }


    function show(element) {

        if (!element) return;

        element.classList.remove("hidden");

    }


    function hide(element) {

        if (!element) return;

        element.classList.add("hidden");

    }


    function escapeHTML(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function normalize(value) {

        return String(value || "")
            .trim()
            .toLowerCase();

    }


    /* =====================================================
       DATE HELPERS
       ===================================================== */

    function getTodayString() {

        const date = new Date();

        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    function formatDate(dateValue) {

        if (!dateValue) {
            return "-";
        }

        let date;

        if (
            typeof dateValue === "object" &&
            typeof dateValue.toDate === "function"
        ) {
            date = dateValue.toDate();
        } else {
            date = new Date(dateValue);
        }

        if (Number.isNaN(date.getTime())) {
            return escapeHTML(dateValue);
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    function getDateOnly(value) {

        if (!value) {
            return "";
        }

        if (
            typeof value === "object" &&
            typeof value.toDate === "function"
        ) {
            const date = value.toDate();

            const year = date.getFullYear();

            const month = String(
                date.getMonth() + 1
            ).padStart(2, "0");

            const day = String(
                date.getDate()
            ).padStart(2, "0");

            return `${year}-${month}-${day}`;
        }

        return String(value).substring(0, 10);
    }


    function isToday(value) {

        return getDateOnly(value) === getTodayString();

    }


    function isOverdue(value) {

        const date = getDateOnly(value);

        if (!date) {
            return false;
        }

        return date < getTodayString();

    }


    function isUpcoming(value) {

        const date = getDateOnly(value);

        if (!date) {
            return false;
        }

        return date > getTodayString();

    }


    /* =====================================================
       FOLLOW-UP ID
       ===================================================== */

    function generateFollowupId() {

        let highest = 0;

        followups.forEach(function (item) {

            const id = String(
                item.followupCode ||
                item.followupId ||
                item.displayId ||
                ""
            );

            const match = id.match(
                /(\d+)$/
            );

            if (match) {

                const number = parseInt(
                    match[1],
                    10
                );

                if (number > highest) {
                    highest = number;
                }

            }

        });

        return "FUP" +
            String(highest + 1).padStart(
                6,
                "0"
            );
    }


    /* =====================================================
       CUSTOMER HELPERS
       ===================================================== */

    function getCustomerById(customerId) {

        if (!customerId) {
            return null;
        }

        return customers.find(function (customer) {

            return (
                customer.id === customerId ||
                customer.customerId === customerId ||
                customer.customerCode === customerId
            );

        }) || null;
    }


    function getCustomerName(customer) {

        if (!customer) {
            return "";
        }

        return (
            customer.name ||
            customer.customerName ||
            customer.fullName ||
            [
                customer.firstName,
                customer.lastName
            ].filter(Boolean).join(" ") ||
            ""
        );
    }


    function getCustomerCode(customer) {

        if (!customer) {
            return "";
        }

        return (
            customer.customerId ||
            customer.customerCode ||
            customer.code ||
            customer.id ||
            ""
        );
    }


    function getCustomerMobile(customer) {

        if (!customer) {
            return "";
        }

        return (
            customer.mobile ||
            customer.phone ||
            customer.mobileNumber ||
            customer.whatsapp ||
            ""
        );
    }


    function getCustomerEmail(customer) {

        if (!customer) {
            return "";
        }

        return (
            customer.email ||
            customer.emailAddress ||
            ""
        );
    }


    /* =====================================================
       LOAD CUSTOMERS
       ===================================================== */

    async function loadCustomers() {

        try {

            customers = await getCollectionData(
                "customers"
            );

            populateCustomerDropdown();

        } catch (error) {

            console.error(
                "Error loading customers:",
                error
            );

            customers = [];

        }

    }


    function populateCustomerDropdown() {

        const select = $(
            "followup-customer"
        );

        if (!select) {
            return;
        }

        const currentValue =
            select.value;

        select.innerHTML = `
            <option value="">
                Select Customer
            </option>
        `;

        customers
            .slice()
            .sort(function (a, b) {

                return normalize(
                    getCustomerName(a)
                ).localeCompare(
                    normalize(
                        getCustomerName(b)
                    )
                );

            })
            .forEach(function (customer) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    customer.id ||
                    customer.customerId ||
                    customer.customerCode ||
                    "";

                option.textContent =
                    getCustomerName(customer) ||
                    getCustomerCode(customer) ||
                    "Unnamed Customer";

                select.appendChild(
                    option
                );

            });

        if (currentValue) {
            select.value =
                currentValue;
        }

    }


    /* =====================================================
       LOAD ENQUIRIES
       ===================================================== */

    async function loadEnquiries() {

        try {

            enquiries = await getCollectionData(
                "enquiries"
            );

            populateEnquiryDropdown();

        } catch (error) {

            console.error(
                "Error loading enquiries:",
                error
            );

            enquiries = [];

        }

    }


    function populateEnquiryDropdown() {

        const select = $(
            "followup-enquiry"
        );

        if (!select) {
            return;
        }

        const currentValue =
            select.value;

        select.innerHTML = `
            <option value="">
                Select Enquiry
            </option>
        `;

        enquiries
            .slice()
            .sort(function (a, b) {

                return normalize(
                    a.enquiryId ||
                    a.enquiryCode ||
                    a.id
                ).localeCompare(
                    normalize(
                        b.enquiryId ||
                        b.enquiryCode ||
                        b.id
                    )
                );

            })
            .forEach(function (enquiry) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    enquiry.id ||
                    enquiry.enquiryId ||
                    enquiry.enquiryCode ||
                    "";

                const enquiryCode =
                    enquiry.enquiryId ||
                    enquiry.enquiryCode ||
                    enquiry.id ||
                    "";

                const destination =
                    enquiry.destination ||
                    "";

                option.textContent =
                    destination
                        ? `${enquiryCode} - ${destination}`
                        : enquiryCode;

                select.appendChild(
                    option
                );

            });

        if (currentValue) {
            select.value =
                currentValue;
        }

    }


    /* =====================================================
       CUSTOMER CHANGE
       ===================================================== */

    function handleCustomerChange() {

        const select = $(
            "followup-customer"
        );

        if (!select) {
            return;
        }

        const customer =
            getCustomerById(
                select.value
            );

        const customerId =
            $("followup-customer-id");

        const mobile =
            $("followup-customer-mobile");

        const email =
            $("followup-customer-email");

        if (!customer) {

            if (customerId) {
                customerId.value = "";
            }

            if (mobile) {
                mobile.value = "";
            }

            if (email) {
                email.value = "";
            }

            return;
        }

        if (customerId) {
            customerId.value =
                getCustomerCode(
                    customer
                );
        }

        if (mobile) {
            mobile.value =
                getCustomerMobile(
                    customer
                );
        }

        if (email) {
            email.value =
                getCustomerEmail(
                    customer
                );
        }

    }


    /* =====================================================
       ENQUIRY CHANGE
       ===================================================== */

    function handleEnquiryChange() {

        const select = $(
            "followup-enquiry"
        );

        if (!select) {
            return;
        }

        const enquiry =
            enquiries.find(
                function (item) {

                    return (
                        item.id === select.value ||
                        item.enquiryId === select.value ||
                        item.enquiryCode === select.value
                    );

                }
            );

        if (!enquiry) {
            return;
        }

        const destination =
            $("followup-destination");

        const travelDate =
            $("followup-travel-date");

        const customerSelect =
            $("followup-customer");

        if (destination) {

            destination.value =
                enquiry.destination ||
                "";

        }

        if (travelDate) {

            travelDate.value =
                getDateOnly(
                    enquiry.travelDate ||
                    enquiry.travelStartDate ||
                    ""
                );

        }

        if (
            customerSelect &&
            !customerSelect.value
        ) {

            const enquiryCustomerId =
                enquiry.customerId ||
                enquiry.customer ||
                "";

            if (enquiryCustomerId) {

                const matchingCustomer =
                    customers.find(
                        function (customer) {

                            return (
                                customer.id === enquiryCustomerId ||
                                customer.customerId === enquiryCustomerId ||
                                customer.customerCode === enquiryCustomerId
                            );

                        }
                    );

                if (matchingCustomer) {

                    customerSelect.value =
                        matchingCustomer.id ||
                        matchingCustomer.customerId ||
                        matchingCustomer.customerCode ||
                        "";

                    handleCustomerChange();

                }

            }

        }

    }


    /* =====================================================
       LOAD FOLLOW-UPS
       ===================================================== */

    async function loadFollowups() {

        showLoading();

        try {

            followups =
                await getCollectionData(
                    "followups"
                );

            followups.sort(
                function (a, b) {

                    const dateA =
                        getDateOnly(
                            a.followupDate ||
                            a.date
                        );

                    const dateB =
                        getDateOnly(
                            b.followupDate ||
                            b.date
                        );

                    return (
                        dateA.localeCompare(
                            dateB
                        )
                    );

                }
            );

            renderFollowups();
            updateSummary();

        } catch (error) {

            console.error(
                "Error loading follow-ups:",
                error
            );

            followups = [];

            renderFollowups();
            updateSummary();

            showError(
                "Unable to load follow-ups."
            );

        } finally {

            hideLoading();

        }

    }


    /* =====================================================
       RENDER FOLLOW-UPS
       ===================================================== */

    function renderFollowups() {

        const tbody =
            $("followups-table-body");

        if (!tbody) {
            return;
        }

        const search =
            normalize(
                $("followup-search")?.value
            );

        const statusFilter =
            $("followup-status-filter")
                ?.value || "all";

        const dateFilter =
            $("followup-date-filter")
                ?.value || "all";


        const filtered =
            followups.filter(
                function (item) {

                    const customer =
                        getCustomerById(
                            item.customerId ||
                            item.customer ||
                            ""
                        );

                    const customerName =
                        item.customerName ||
                        getCustomerName(
                            customer
                        );

                    const customerMobile =
                        item.customerMobile ||
                        getCustomerMobile(
                            customer
                        );

                    const followupCode =
                        item.followupCode ||
                        item.followupId ||
                        item.displayId ||
                        item.id ||
                        "";

                    const destination =
                        item.destination ||
                        "";

                    const subject =
                        item.subject ||
                        "";

                    const searchText =
                        [
                            followupCode,
                            customerName,
                            customerMobile,
                            destination,
                            subject,
                            item.notes,
                            item.type ||
                            item.followupType
                        ]
                            .join(" ");

                    if (
                        search &&
                        !normalize(
                            searchText
                        ).includes(search)
                    ) {
                        return false;
                    }


                    const status =
                        item.status ||
                        "Pending";

                    if (
                        statusFilter !== "all" &&
                        normalize(status) !==
                        normalize(statusFilter)
                    ) {
                        return false;
                    }


                    const date =
                        item.followupDate ||
                        item.date ||
                        "";

                    if (
                        dateFilter === "today" &&
                        !isToday(date)
                    ) {
                        return false;
                    }

                    if (
                        dateFilter === "upcoming" &&
                        !isUpcoming(date)
                    ) {
                        return false;
                    }

                    if (
                        dateFilter === "overdue" &&
                        !isOverdue(date)
                    ) {
                        return false;
                    }

                    return true;

                }
            );


        const recordCount =
            $("followup-record-count");

        if (recordCount) {

            recordCount.textContent =
                `${filtered.length} record${filtered.length === 1 ? "" : "s"}`;

        }


        if (!filtered.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="10"
                        class="followups-empty-cell">

                        <div class="followups-empty">

                            <span class="followups-empty-icon">
                                ✓
                            </span>

                            <strong>
                                No follow-ups found
                            </strong>

                            <p>
                                No follow-ups match the current filters.
                            </p>

                        </div>

                    </td>
                </tr>
            `;

            return;
        }


        tbody.innerHTML =
            filtered.map(
                renderFollowupRow
            ).join("");

    }


    function renderFollowupRow(item) {

        const customer =
            getCustomerById(
                item.customerId ||
                item.customer ||
                ""
            );

        const customerName =
            item.customerName ||
            getCustomerName(customer) ||
            "-";

        const mobile =
            item.customerMobile ||
            getCustomerMobile(customer) ||
            "-";

        const code =
            item.followupCode ||
            item.followupId ||
            item.displayId ||
            item.id ||
            "-";

        const date =
            item.followupDate ||
            item.date ||
            "";

        const type =
            item.followupType ||
            item.type ||
            "-";

        const subject =
            item.subject ||
            "-";

        const destination =
            item.destination ||
            "-";

        const status =
            item.status ||
            "Pending";

        const priority =
            item.priority ||
            "Normal";


        return `
            <tr>

                <td>
                    <strong>
                        ${escapeHTML(code)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        formatDate(date)
                    )}

                    ${
                        isToday(date)
                            ? `<span class="followup-today-badge">Today</span>`
                            : ""
                    }

                    ${
                        status === "Pending" &&
                        isOverdue(date)
                            ? `<span class="followup-overdue-badge">Overdue</span>`
                            : ""
                    }
                </td>

                <td>
                    ${escapeHTML(customerName)}
                </td>

                <td>
                    ${escapeHTML(mobile)}
                </td>

                <td>
                    ${escapeHTML(type)}
                </td>

                <td>
                    ${escapeHTML(subject)}
                </td>

                <td>
                    ${escapeHTML(destination)}
                </td>

                <td>
                    <span class="followup-status-badge status-${normalize(status).replace(/\s+/g, "-")}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>
                    <span class="followup-priority-badge priority-${normalize(priority)}">
                        ${escapeHTML(priority)}
                    </span>
                </td>

                <td>

                    <div class="followup-action-buttons">

                        <button
                            type="button"
                            class="followup-action-btn edit"
                            data-action="edit"
                            data-id="${escapeHTML(item.id)}"
                            title="Edit"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="followup-action-btn complete"
                            data-action="complete"
                            data-id="${escapeHTML(item.id)}"
                            title="Mark Completed"
                        >
                            ✓
                        </button>

                        <button
                            type="button"
                            class="followup-action-btn delete"
                            data-action="delete"
                            data-id="${escapeHTML(item.id)}"
                            title="Delete"
                        >
                            Delete
                        </button>

                    </div>

                </td>

            </tr>
        `;

    }


    /* =====================================================
       SUMMARY
       ===================================================== */

    function updateSummary() {

        const total =
            followups.length;

        const pending =
            followups.filter(
                function (item) {

                    return normalize(
                        item.status ||
                        "Pending"
                    ) === "pending";

                }
            ).length;

        const completed =
            followups.filter(
                function (item) {

                    return normalize(
                        item.status
                    ) === "completed";

                }
            ).length;

        const today =
            followups.filter(
                function (item) {

                    return (
                        normalize(
                            item.status ||
                            "Pending"
                        ) !== "completed" &&
                        normalize(
                            item.status ||
                            "Pending"
                        ) !== "cancelled" &&
                        isToday(
                            item.followupDate ||
                            item.date
                        )
                    );

                }
            ).length;


        setText(
            "followup-total-count",
            total
        );

        setText(
            "followup-pending-count",
            pending
        );

        setText(
            "followup-today-count",
            today
        );

        setText(
            "followup-completed-count",
            completed
        );

    }


    function setText(id, value) {

        const element = $(id);

        if (element) {
            element.textContent =
                value;
        }

    }


    /* =====================================================
       OPEN NEW FORM
       ===================================================== */

    function openNewFollowup() {

        editingFollowupId = null;

        const form =
            $("followup-form");

        if (form) {
            form.reset();
        }


        const hiddenId =
            $("followup-id");

        if (hiddenId) {
            hiddenId.value = "";
        }


        const displayId =
            $("followup-display-id");

        if (displayId) {

            displayId.value =
                generateFollowupId();

        }


        const status =
            $("followup-status");

        if (status) {
            status.value =
                "Pending";
        }


        const priority =
            $("followup-priority");

        if (priority) {
            priority.value =
                "Normal";
        }


        const formTitle =
            $("followup-form-title");

        if (formTitle) {

            formTitle.textContent =
                "New Follow-up";

        }


        const saveButton =
            $("followup-save-btn");

        if (saveButton) {

            saveButton.textContent =
                "Save Follow-up";

        }


        show(
            $("followup-form-card")
        );

        handleCustomerChange();

        const date =
            $("followup-date");

        if (date) {
            date.value =
                getTodayString();
        }


        const formCard =
            $("followup-form-card");

        if (formCard) {

            formCard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }


    /* =====================================================
       EDIT FOLLOW-UP
       ===================================================== */

    function editFollowup(id) {

        const item =
            followups.find(
                function (followup) {

                    return followup.id === id;

                }
            );

        if (!item) {
            return;
        }

        editingFollowupId =
            item.id;


        setValue(
            "followup-id",
            item.id
        );

        setValue(
            "followup-display-id",
            item.followupCode ||
            item.followupId ||
            item.displayId ||
            generateFollowupId()
        );

        setValue(
            "followup-date",
            getDateOnly(
                item.followupDate ||
                item.date ||
                ""
            )
        );

        setValue(
            "followup-time",
            item.followupTime ||
            item.time ||
            ""
        );

        setValue(
            "followup-type",
            item.followupType ||
            item.type ||
            ""
        );

        setValue(
            "followup-status",
            item.status ||
            "Pending"
        );

        setValue(
            "followup-priority",
            item.priority ||
            "Normal"
        );


        setValue(
            "followup-customer",
            item.customerId ||
            item.customer ||
            ""
        );

        handleCustomerChange();


        setValue(
            "followup-enquiry",
            item.enquiryId ||
            item.enquiry ||
            ""
        );

        setValue(
            "followup-destination",
            item.destination ||
            ""
        );

        setValue(
            "followup-travel-date",
            getDateOnly(
                item.travelDate ||
                ""
            )
        );

        setValue(
            "followup-reference",
            item.reference ||
            ""
        );

        setValue(
            "followup-subject",
            item.subject ||
            ""
        );

        setValue(
            "followup-notes",
            item.notes ||
            ""
        );

        setValue(
            "followup-outcome",
            item.outcome ||
            item.remarks ||
            ""
        );


        const formTitle =
            $("followup-form-title");

        if (formTitle) {

            formTitle.textContent =
                "Edit Follow-up";

        }


        const saveButton =
            $("followup-save-btn");

        if (saveButton) {

            saveButton.textContent =
                "Update Follow-up";

        }


        show(
            $("followup-form-card")
        );


        const formCard =
            $("followup-form-card");

        if (formCard) {

            formCard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }


    function setValue(id, value) {

        const element = $(id);

        if (element) {
            element.value =
                value ?? "";
        }

    }


    /* =====================================================
       SAVE FOLLOW-UP
       ===================================================== */

    async function saveFollowup(event) {

        event.preventDefault();

        const db = getDB();

        const collectionFn =
            getFirebaseFunction(
                "collection"
            );

        const addDocFn =
            getFirebaseFunction(
                "addDoc"
            );

        const updateDocFn =
            getFirebaseFunction(
                "updateDoc"
            );

        const docFn =
            getFirebaseFunction(
                "doc"
            );

        if (
            !db ||
            !collectionFn ||
            !addDocFn ||
            !updateDocFn ||
            !docFn
        ) {

            showError(
                "Firebase Firestore is not available."
            );

            return;
        }


        const customerSelect =
            $("followup-customer");

        const customer =
            getCustomerById(
                customerSelect?.value
            );


        const followupCode =
            $("followup-display-id")
                ?.value ||
            generateFollowupId();


        const data = {

            followupCode: followupCode,

            followupDate:
                $("followup-date")
                    ?.value || "",

            followupTime:
                $("followup-time")
                    ?.value || "",

            followupType:
                $("followup-type")
                    ?.value || "",

            status:
                $("followup-status")
                    ?.value || "Pending",

            priority:
                $("followup-priority")
                    ?.value || "Normal",

            customerId:
                $("followup-customer")
                    ?.value || "",

            customerName:
                getCustomerName(customer),

            customerMobile:
                getCustomerMobile(customer),

            customerEmail:
                getCustomerEmail(customer),

            enquiryId:
                $("followup-enquiry")
                    ?.value || "",

            destination:
                $("followup-destination")
                    ?.value || "",

            travelDate:
                $("followup-travel-date")
                    ?.value || "",

            reference:
                $("followup-reference")
                    ?.value || "",

            subject:
                $("followup-subject")
                    ?.value || "",

            notes:
                $("followup-notes")
                    ?.value || "",

            outcome:
                $("followup-outcome")
                    ?.value || "",

            updatedAt:
                new Date().toISOString()

        };


        if (!data.customerId) {

            showError(
                "Please select a customer."
            );

            return;
        }


        if (!data.followupDate) {

            showError(
                "Please select follow-up date."
            );

            return;
        }


        if (!data.followupType) {

            showError(
                "Please select follow-up type."
            );

            return;
        }


        if (!data.subject) {

            showError(
                "Please enter follow-up subject."
            );

            return;
        }


        showLoading();


        try {

            if (editingFollowupId) {

                await updateDocFn(
                    docFn(
                        db,
                        "followups",
                        editingFollowupId
                    ),
                    data
                );

                showSuccess(
                    "Follow-up updated successfully."
                );

            } else {

                data.createdAt =
                    new Date().toISOString();

                await addDocFn(
                    collectionFn(
                        db,
                        "followups"
                    ),
                    data
                );

                showSuccess(
                    "Follow-up created successfully."
                );

            }


            hide(
                $("followup-form-card")
            );

            editingFollowupId = null;

            await loadFollowups();

            notifyDashboard();

        } catch (error) {

            console.error(
                "Error saving follow-up:",
                error
            );

            showError(
                "Unable to save follow-up."
            );

        } finally {

            hideLoading();

        }

    }


    /* =====================================================
       MARK COMPLETED
       ===================================================== */

    async function completeFollowup(id) {

        const db = getDB();

        const updateDocFn =
            getFirebaseFunction(
                "updateDoc"
            );

        const docFn =
            getFirebaseFunction(
                "doc"
            );

        if (
            !db ||
            !updateDocFn ||
            !docFn
        ) {

            showError(
                "Firebase Firestore is not available."
            );

            return;
        }


        try {

            showLoading();

            await updateDocFn(
                docFn(
                    db,
                    "followups",
                    id
                ),
                {
                    status: "Completed",
                    completedAt:
                        new Date().toISOString(),
                    updatedAt:
                        new Date().toISOString()
                }
            );


            showSuccess(
                "Follow-up marked as completed."
            );

            await loadFollowups();

            notifyDashboard();

        } catch (error) {

            console.error(
                "Error completing follow-up:",
                error
            );

            showError(
                "Unable to update follow-up."
            );

        } finally {

            hideLoading();

        }

    }


    /* =====================================================
       DELETE
       ===================================================== */

    function openDeleteModal(id) {

        deletingFollowupId =
            id;

        show(
            $("followup-delete-modal")
        );

        const modal =
            $("followup-delete-modal");

        if (modal) {

            modal.setAttribute(
                "aria-hidden",
                "false"
            );

        }

    }


    function closeDeleteModal() {

        deletingFollowupId =
            null;

        hide(
            $("followup-delete-modal")
        );

        const modal =
            $("followup-delete-modal");

        if (modal) {

            modal.setAttribute(
                "aria-hidden",
                "true"
            );

        }

    }


    async function deleteFollowup() {

        if (!deletingFollowupId) {
            return;
        }

        const db = getDB();

        const deleteDocFn =
            getFirebaseFunction(
                "deleteDoc"
            );

        const docFn =
            getFirebaseFunction(
                "doc"
            );

        if (
            !db ||
            !deleteDocFn ||
            !docFn
        ) {

            showError(
                "Firebase Firestore is not available."
            );

            return;
        }


        try {

            showLoading();

            await deleteDocFn(
                docFn(
                    db,
                    "followups",
                    deletingFollowupId
                )
            );


            closeDeleteModal();

            showSuccess(
                "Follow-up deleted successfully."
            );

            await loadFollowups();

            notifyDashboard();

        } catch (error) {

            console.error(
                "Error deleting follow-up:",
                error
            );

            showError(
                "Unable to delete follow-up."
            );

        } finally {

            hideLoading();

        }

    }


    /* =====================================================
       FORM RESET / CANCEL
       ===================================================== */

    function cancelForm() {

        editingFollowupId =
            null;

        const form =
            $("followup-form");

        if (form) {
            form.reset();
        }

        hide(
            $("followup-form-card")
        );

    }


    /* =====================================================
       EVENT DELEGATION
       ===================================================== */

    function handleTableClick(event) {

        const button =
            event.target.closest(
                "[data-action]"
            );

        if (!button) {
            return;
        }

        const action =
            button.dataset.action;

        const id =
            button.dataset.id;

        if (!id) {
            return;
        }


        if (action === "edit") {

            editFollowup(id);

        } else if (
            action === "complete"
        ) {

            completeFollowup(id);

        } else if (
            action === "delete"
        ) {

            openDeleteModal(id);

        }

    }


    /* =====================================================
       DASHBOARD NOTIFICATION
       ===================================================== */

    function notifyDashboard() {

        try {

            window.dispatchEvent(
                new CustomEvent(
                    "erp:followups-updated"
                )
            );

        } catch (error) {

            console.warn(
                "Dashboard notification failed:",
                error
            );

        }

    }


    /* =====================================================
       LOADING
       ===================================================== */

    function showLoading() {

        show(
            $("followups-loading")
        );

        const overlay =
            $("followups-loading");

        if (overlay) {

            overlay.setAttribute(
                "aria-hidden",
                "false"
            );

        }

    }


    function hideLoading() {

        hide(
            $("followups-loading")
        );

        const overlay =
            $("followups-loading");

        if (overlay) {

            overlay.setAttribute(
                "aria-hidden",
                "true"
            );

        }

    }


    /* =====================================================
       NOTIFICATIONS
       ===================================================== */

    function showSuccess(message) {

        if (
            typeof window.showToast ===
            "function"
        ) {

            window.showToast(
                message,
                "success"
            );

            return;
        }

        if (
            typeof window.showNotification ===
            "function"
        ) {

            window.showNotification(
                message,
                "success"
            );

            return;
        }

        console.log(
            "SUCCESS:",
            message
        );

    }


    function showError(message) {

        if (
            typeof window.showToast ===
            "function"
        ) {

            window.showToast(
                message,
                "error"
            );

            return;
        }

        if (
            typeof window.showNotification ===
            "function"
        ) {

            window.showNotification(
                message,
                "error"
            );

            return;
        }

        console.error(
            "ERROR:",
            message
        );

    }


    /* =====================================================
       EVENT LISTENERS
       ===================================================== */

    function bindEvents() {

        const newButton =
            $("followup-new-btn");

        if (newButton) {

            newButton.addEventListener(
                "click",
                openNewFollowup
            );

        }


        const cancelButton =
            $("followup-cancel-btn");

        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                cancelForm
            );

        }


        const form =
            $("followup-form");

        if (form) {

            form.addEventListener(
                "submit",
                saveFollowup
            );

        }


        const customer =
            $("followup-customer");

        if (customer) {

            customer.addEventListener(
                "change",
                handleCustomerChange
            );

        }


        const enquiry =
            $("followup-enquiry");

        if (enquiry) {

            enquiry.addEventListener(
                "change",
                handleEnquiryChange
            );

        }


        const search =
            $("followup-search");

        if (search) {

            search.addEventListener(
                "input",
                renderFollowups
            );

        }


        const statusFilter =
            $("followup-status-filter");

        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                renderFollowups
            );

        }


        const dateFilter =
            $("followup-date-filter");

        if (dateFilter) {

            dateFilter.addEventListener(
                "change",
                renderFollowups
            );

        }


        const refresh =
            $("followup-refresh-btn");

        if (refresh) {

            refresh.addEventListener(
                "click",
                async function () {

                    await loadCustomers();
                    await loadEnquiries();
                    await loadFollowups();

                }
            );

        }


        const tbody =
            $("followups-table-body");

        if (tbody) {

            tbody.addEventListener(
                "click",
                handleTableClick
            );

        }


        const deleteClose =
            $("followup-delete-close");

        if (deleteClose) {

            deleteClose.addEventListener(
                "click",
                closeDeleteModal
            );

        }


        const deleteCancel =
            $("followup-delete-cancel");

        if (deleteCancel) {

            deleteCancel.addEventListener(
                "click",
                closeDeleteModal
            );

        }


        const deleteConfirm =
            $("followup-delete-confirm");

        if (deleteConfirm) {

            deleteConfirm.addEventListener(
                "click",
                deleteFollowup
            );

        }


        const deleteModal =
            $("followup-delete-modal");

        if (deleteModal) {

            const backdrop =
                deleteModal.querySelector(
                    ".followup-modal-backdrop"
                );

            if (backdrop) {

                backdrop.addEventListener(
                    "click",
                    closeDeleteModal
                );

            }

        }

    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    async function initFollowups() {

        if (initialized) {

            await loadFollowups();

            return;

        }

        initialized = true;

        bindEvents();

        await loadCustomers();

        await loadEnquiries();

        await loadFollowups();

    }


    /* =====================================================
       MODULE PUBLIC API
       ===================================================== */

    window.FollowupsModule = {

        init: initFollowups,

        refresh: async function () {

            await loadCustomers();

            await loadEnquiries();

            await loadFollowups();

        },

        openNew: openNewFollowup,

        edit: editFollowup

    };


    /* =====================================================
       AUTO INITIALIZATION
       ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            const page =
                $("followups-page");

            if (page) {

                initFollowups();

            }

        }
    );


    /* =====================================================
       SPA / ERP MODULE LOADER SUPPORT
       ===================================================== */

    window.addEventListener(
        "erp:module-loaded",
        function (event) {

            if (
                event.detail &&
                (
                    event.detail.module ===
                    "followups" ||
                    event.detail.name ===
                    "followups"
                )
            ) {

                initFollowups();

            }

        }
    );


})();
