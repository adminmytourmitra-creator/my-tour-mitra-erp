/* =========================================================
   MY TOUR MITRA ERP
   ENQUIRIES MODULE
   File: modules/enquiries/enquiries.js

   Workflow:
   Customer → Enquiry → Package → Quotation → Follow-up → Booking
   ========================================================= */

(function () {

    "use strict";

    /* =====================================================
       MODULE CONFIGURATION
       ===================================================== */

    const COLLECTION = "enquiries";
    const CUSTOMER_COLLECTION = "customers";

    const ID_PREFIX = "ENQ";
    const ID_DIGITS = 4;

    let enquiryRecords = [];
    let customerRecords = [];
    let editingEnquiryId = null;


    /* =====================================================
       FIRESTORE HELPERS
       ===================================================== */

    function getFirestore() {

        if (typeof window.db !== "undefined") {
            return window.db;
        }

        if (typeof window.firebaseDB !== "undefined") {
            return window.firebaseDB;
        }

        if (typeof db !== "undefined") {
            return db;
        }

        return null;
    }


    function getFirestoreModules() {

        if (
            typeof window.collection === "function" &&
            typeof window.getDocs === "function"
        ) {
            return {
                collection: window.collection,
                getDocs: window.getDocs,
                addDoc: window.addDoc,
                updateDoc: window.updateDoc,
                deleteDoc: window.deleteDoc,
                doc: window.doc,
                query: window.query,
                orderBy: window.orderBy,
                where: window.where,
                serverTimestamp: window.serverTimestamp
            };
        }

        return null;
    }


    /* =====================================================
       DOM HELPERS
       ===================================================== */

    function $(selector) {
        return document.querySelector(selector);
    }


    function $all(selector) {
        return Array.from(document.querySelectorAll(selector));
    }


    function getElementByPossibleIds(ids) {

        for (const id of ids) {

            const element = document.getElementById(id);

            if (element) {
                return element;
            }

        }

        return null;
    }


    /* =====================================================
       SAFE VALUE HELPERS
       ===================================================== */

    function valueOf(element) {

        if (!element) {
            return "";
        }

        return String(element.value || "").trim();
    }


    function setValue(element, value) {

        if (!element) {
            return;
        }

        element.value = value ?? "";
    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       NOTIFICATION
       ===================================================== */

    function notify(message, type = "info") {

        if (typeof window.showToast === "function") {
            window.showToast(message, type);
            return;
        }

        if (typeof window.showNotification === "function") {
            window.showNotification(message, type);
            return;
        }

        console.log(`[${type}] ${message}`);

        alert(message);
    }


    /* =====================================================
       DATE HELPERS
       ===================================================== */

    function getTodayDate() {

        const now = new Date();

        const year = now.getFullYear();

        const month = String(now.getMonth() + 1).padStart(2, "0");

        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    function formatDate(value) {

        if (!value) {
            return "-";
        }

        try {

            let date;

            if (
                typeof value === "object" &&
                value.seconds
            ) {

                date = new Date(value.seconds * 1000);

            } else {

                date = new Date(value);

            }

            if (Number.isNaN(date.getTime())) {
                return value;
            }

            return date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });

        } catch (error) {

            return value;

        }

    }


    /* =====================================================
       ENQUIRY ID GENERATOR
       ===================================================== */

    function createEnquiryId(number) {

        return ID_PREFIX +
            String(number).padStart(ID_DIGITS, "0");

    }


    function extractNumericId(id) {

        if (!id) {
            return 0;
        }

        const match = String(id).match(/(\d+)$/);

        if (!match) {
            return 0;
        }

        return parseInt(match[1], 10) || 0;

    }


    async function generateNextEnquiryId() {

        const maximumFromRecords = enquiryRecords.reduce(
            (maximum, record) => {

                const numericId = extractNumericId(
                    record.enquiryId
                );

                return Math.max(maximum, numericId);

            },
            0
        );

        return createEnquiryId(
            maximumFromRecords + 1
        );

    }


    /* =====================================================
       CUSTOMER LOADING
       ===================================================== */

    async function loadCustomers() {

        const firestore = getFirestore();

        const modules = getFirestoreModules();

        if (!firestore || !modules) {

            console.warn(
                "Firestore is not available while loading customers."
            );

            return;

        }

        try {

            const reference = modules.collection(
                firestore,
                CUSTOMER_COLLECTION
            );

            const snapshot = await modules.getDocs(reference);

            customerRecords = [];

            snapshot.forEach(documentSnapshot => {

                customerRecords.push({
                    firestoreId: documentSnapshot.id,
                    ...documentSnapshot.data()
                });

            });

            customerRecords.sort((a, b) => {

                const nameA = String(
                    a.customerName ||
                    a.name ||
                    ""
                ).toLowerCase();

                const nameB = String(
                    b.customerName ||
                    b.name ||
                    ""
                ).toLowerCase();

                return nameA.localeCompare(nameB);

            });

            populateCustomerSelect();

        } catch (error) {

            console.error(
                "Error loading customers:",
                error
            );

            notify(
                "Unable to load customers.",
                "error"
            );

        }

    }


    /* =====================================================
       CUSTOMER SELECT
       ===================================================== */

    function populateCustomerSelect() {

        const select = getElementByPossibleIds([
            "enquiry-customer",
            "customer-select",
            "enquiry-customer-select",
            "customerId",
            "enquiryCustomer"
        ]);

        if (!select) {
            return;
        }

        const currentValue = select.value;

        select.innerHTML = `
            <option value="">
                Select Customer
            </option>
        `;

        customerRecords.forEach(customer => {

            const customerId =
                customer.customerId ||
                customer.id ||
                "";

            const customerName =
                customer.customerName ||
                customer.name ||
                "Unnamed Customer";

            const mobile =
                customer.mobile ||
                customer.phone ||
                customer.whatsapp ||
                "";

            const option = document.createElement("option");

            option.value = customerId;

            option.dataset.firestoreId =
                customer.firestoreId || "";

            option.textContent =
                mobile
                    ? `${customerId} — ${customerName} (${mobile})`
                    : `${customerId} — ${customerName}`;

            select.appendChild(option);

        });

        if (currentValue) {
            select.value = currentValue;
        }

    }


    /* =====================================================
       CUSTOMER DETAILS AUTO-FILL
       ===================================================== */

    function handleCustomerChange(event) {

        const customerId = event.target.value;

        const customer = customerRecords.find(
            record =>
                String(
                    record.customerId ||
                    record.id ||
                    ""
                ) === String(customerId)
        );

        if (!customer) {
            clearCustomerDetails();
            return;
        }

        const name =
            customer.customerName ||
            customer.name ||
            "";

        const mobile =
            customer.mobile ||
            customer.phone ||
            "";

        const whatsapp =
            customer.whatsapp ||
            "";

        const email =
            customer.email ||
            "";

        const city =
            customer.city ||
            "";

        const state =
            customer.state ||
            "";

        setValue(
            getElementByPossibleIds([
                "enquiry-customer-name",
                "customer-name",
                "enquiryCustomerName"
            ]),
            name
        );

        setValue(
            getElementByPossibleIds([
                "enquiry-mobile",
                "customer-mobile",
                "enquiryCustomerMobile"
            ]),
            mobile
        );

        setValue(
            getElementByPossibleIds([
                "enquiry-whatsapp",
                "customer-whatsapp",
                "enquiryCustomerWhatsapp"
            ]),
            whatsapp
        );

        setValue(
            getElementByPossibleIds([
                "enquiry-email",
                "customer-email",
                "enquiryCustomerEmail"
            ]),
            email
        );

        setValue(
            getElementByPossibleIds([
                "enquiry-city",
                "customer-city",
                "enquiryCustomerCity"
            ]),
            city
        );

        setValue(
            getElementByPossibleIds([
                "enquiry-state",
                "customer-state",
                "enquiryCustomerState"
            ]),
            state
        );

    }


    function clearCustomerDetails() {

        [
            [
                "enquiry-customer-name",
                "customer-name",
                "enquiryCustomerName"
            ],
            [
                "enquiry-mobile",
                "customer-mobile",
                "enquiryCustomerMobile"
            ],
            [
                "enquiry-whatsapp",
                "customer-whatsapp",
                "enquiryCustomerWhatsapp"
            ],
            [
                "enquiry-email",
                "customer-email",
                "enquiryCustomerEmail"
            ],
            [
                "enquiry-city",
                "customer-city",
                "enquiryCustomerCity"
            ],
            [
                "enquiry-state",
                "customer-state",
                "enquiryCustomerState"
            ]
        ].forEach(ids => {

            setValue(
                getElementByPossibleIds(ids),
                ""
            );

        });

    }


    /* =====================================================
       COLLECT ENQUIRY FORM DATA
       ===================================================== */

    function collectFormData() {

        const customerSelect =
            getElementByPossibleIds([
                "enquiry-customer",
                "customer-select",
                "enquiry-customer-select",
                "customerId",
                "enquiryCustomer"
            ]);

        const customerId =
            customerSelect?.value || "";

        const selectedCustomer =
            customerRecords.find(
                customer =>
                    String(
                        customer.customerId ||
                        customer.id ||
                        ""
                    ) === String(customerId)
            );

        const customerName =
            valueOf(
                getElementByPossibleIds([
                    "enquiry-customer-name",
                    "customer-name",
                    "enquiryCustomerName"
                ])
            ) ||
            selectedCustomer?.customerName ||
            selectedCustomer?.name ||
            "";

        const data = {

            customerId,

            customerName,

            customerFirestoreId:
                selectedCustomer?.firestoreId || "",

            customerMobile:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-mobile",
                        "customer-mobile",
                        "enquiryCustomerMobile"
                    ])
                ),

            customerWhatsapp:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-whatsapp",
                        "customer-whatsapp",
                        "enquiryCustomerWhatsapp"
                    ])
                ),

            customerEmail:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-email",
                        "customer-email",
                        "enquiryCustomerEmail"
                    ])
                ),

            enquiryDate:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-date",
                        "enquiryDate",
                        "date"
                    ])
                ) || getTodayDate(),

            destination:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-destination",
                        "destination",
                        "travel-destination"
                    ])
                ),

            travelDate:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-travel-date",
                        "travel-date",
                        "travelDate"
                    ])
                ),

            returnDate:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-return-date",
                        "return-date",
                        "returnDate"
                    ])
                ),

            duration:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-duration",
                        "duration",
                        "trip-duration"
                    ])
                ),

            adults:
                Number(
                    valueOf(
                        getElementByPossibleIds([
                            "enquiry-adults",
                            "adults"
                        ])
                    )
                ) || 0,

            children:
                Number(
                    valueOf(
                        getElementByPossibleIds([
                            "enquiry-children",
                            "children"
                        ])
                    )
                ) || 0,

            rooms:
                Number(
                    valueOf(
                        getElementByPossibleIds([
                            "enquiry-rooms",
                            "rooms"
                        ])
                    )
                ) || 0,

            budget:
                Number(
                    valueOf(
                        getElementByPossibleIds([
                            "enquiry-budget",
                            "budget"
                        ])
                    )
                ) || 0,

            travelType:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-travel-type",
                        "travel-type",
                        "travelType"
                    ])
                ),

            hotelRequired:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-hotel-required",
                        "hotel-required",
                        "hotelRequired"
                    ])
                ),

            cabRequired:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-cab-required",
                        "cab-required",
                        "cabRequired"
                    ])
                ),

            mealPlan:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-meal-plan",
                        "meal-plan",
                        "mealPlan"
                    ])
                ),

            source:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-source",
                        "source",
                        "enquirySource"
                    ])
                ),

            status:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-status",
                        "status"
                    ])
                ) || "New",

            assignedTo:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-assigned-to",
                        "assigned-to",
                        "assignedTo"
                    ])
                ),

            specialRequirements:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-special-requirements",
                        "special-requirements",
                        "specialRequirements"
                    ])
                ),

            notes:
                valueOf(
                    getElementByPossibleIds([
                        "enquiry-notes",
                        "notes",
                        "enquiryNotes"
                    ])
                )

        };

        return data;

    }


    /* =====================================================
       VALIDATION
       ===================================================== */

    function validateEnquiry(data) {

        if (!data.customerId) {

            notify(
                "Please select a customer.",
                "warning"
            );

            return false;

        }

        if (!data.destination) {

            notify(
                "Please enter the travel destination.",
                "warning"
            );

            return false;

        }

        if (!data.travelDate) {

            notify(
                "Please enter the travel date.",
                "warning"
            );

            return false;

        }

        return true;

    }


    /* =====================================================
       SAVE ENQUIRY
       ===================================================== */

    async function saveEnquiry(event) {

        if (event) {
            event.preventDefault();
        }

        const firestore = getFirestore();

        const modules = getFirestoreModules();

        if (!firestore || !modules) {

            notify(
                "Firebase/Firestore is not ready.",
                "error"
            );

            return;

        }

        const data = collectFormData();

        if (!validateEnquiry(data)) {
            return;
        }

        try {

            setFormLoading(true);

            if (editingEnquiryId) {

                await updateExistingEnquiry(
                    editingEnquiryId,
                    data
                );

                notify(
                    "Enquiry updated successfully.",
                    "success"
                );

            } else {

                const enquiryId =
                    await generateNextEnquiryId();

                const enquiryData = {

                    enquiryId,

                    ...data,

                    packageId: "",

                    quotationId: "",

                    followupId: "",

                    bookingId: "",

                    createdAt:
                        modules.serverTimestamp
                            ? modules.serverTimestamp()
                            : new Date().toISOString(),

                    updatedAt:
                        modules.serverTimestamp
                            ? modules.serverTimestamp()
                            : new Date().toISOString(),

                    createdBy:
                        getCurrentUserName()

                };

                const reference =
                    modules.collection(
                        firestore,
                        COLLECTION
                    );

                await modules.addDoc(
                    reference,
                    enquiryData
                );

                notify(
                    `Enquiry ${enquiryId} created successfully.`,
                    "success"
                );

            }

            resetForm();

            await loadEnquiries();

            if (typeof window.refreshDashboard === "function") {
                window.refreshDashboard();
            }

        } catch (error) {

            console.error(
                "Error saving enquiry:",
                error
            );

            notify(
                "Unable to save enquiry. Please try again.",
                "error"
            );

        } finally {

            setFormLoading(false);

        }

    }


    /* =====================================================
       UPDATE ENQUIRY
       ===================================================== */

    async function updateExistingEnquiry(
        firestoreId,
        data
    ) {

        const firestore = getFirestore();

        const modules = getFirestoreModules();

        const reference =
            modules.doc(
                firestore,
                COLLECTION,
                firestoreId
            );

        await modules.updateDoc(
            reference,
            {
                ...data,

                updatedAt:
                    modules.serverTimestamp
                        ? modules.serverTimestamp()
                        : new Date().toISOString(),

                updatedBy:
                    getCurrentUserName()
            }
        );

    }


    /* =====================================================
       LOAD ENQUIRIES
       ===================================================== */

    async function loadEnquiries() {

        const firestore = getFirestore();

        const modules = getFirestoreModules();

        if (!firestore || !modules) {

            console.warn(
                "Firestore is not available."
            );

            return;

        }

        try {

            const reference =
                modules.collection(
                    firestore,
                    COLLECTION
                );

            const snapshot =
                await modules.getDocs(reference);

            enquiryRecords = [];

            snapshot.forEach(documentSnapshot => {

                enquiryRecords.push({

                    firestoreId:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            });

            enquiryRecords.sort(
                compareEnquiries
            );

            renderEnquiryTable();

            updateEnquiryCounters();

        } catch (error) {

            console.error(
                "Error loading enquiries:",
                error
            );

            notify(
                "Unable to load enquiries.",
                "error"
            );

        }

    }


    function compareEnquiries(a, b) {

        const aId =
            extractNumericId(
                a.enquiryId
            );

        const bId =
            extractNumericId(
                b.enquiryId
            );

        return bId - aId;

    }


    /* =====================================================
       RENDER TABLE
       ===================================================== */

    function renderEnquiryTable(records = enquiryRecords) {

        const tbody =
            getElementByPossibleIds([
                "enquiries-table-body",
                "enquiry-table-body",
                "enquiries-list",
                "enquiry-list"
            ]);

        if (!tbody) {
            return;
        }

        if (!records.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="100%">
                        <div class="empty-state">
                            No enquiries found.
                        </div>
                    </td>
                </tr>
            `;

            return;

        }

        tbody.innerHTML =
            records.map(
                enquiry =>
                    createEnquiryRow(enquiry)
            ).join("");

    }


    function createEnquiryRow(enquiry) {

        const id =
            enquiry.enquiryId || "-";

        const customer =
            enquiry.customerName || "-";

        const destination =
            enquiry.destination || "-";

        const travelDate =
            formatDate(
                enquiry.travelDate
            );

        const status =
            enquiry.status || "New";

        const statusClass =
            String(status)
                .toLowerCase()
                .replace(/\s+/g, "-");

        return `
            <tr data-enquiry-id="${escapeHTML(
                enquiry.firestoreId || ""
            )}">

                <td>
                    <strong>
                        ${escapeHTML(id)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(customer)}
                </td>

                <td>
                    ${escapeHTML(destination)}
                </td>

                <td>
                    ${escapeHTML(travelDate)}
                </td>

                <td>
                    <span class="status-badge status-${escapeHTML(
                        statusClass
                    )}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>
                    <div class="table-actions">

                        <button
                            type="button"
                            class="btn btn-sm"
                            data-enquiry-action="view"
                            data-enquiry-firestore-id="${escapeHTML(
                                enquiry.firestoreId || ""
                            )}"
                        >
                            View
                        </button>

                        <button
                            type="button"
                            class="btn btn-sm"
                            data-enquiry-action="edit"
                            data-enquiry-firestore-id="${escapeHTML(
                                enquiry.firestoreId || ""
                            )}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="btn btn-sm btn-danger"
                            data-enquiry-action="delete"
                            data-enquiry-firestore-id="${escapeHTML(
                                enquiry.firestoreId || ""
                            )}"
                        >
                            Delete
                        </button>

                    </div>
                </td>

            </tr>
        `;

    }


    /* =====================================================
       SEARCH
       ===================================================== */

    function searchEnquiries(event) {

        const keyword =
            String(
                event?.target?.value || ""
            )
            .trim()
            .toLowerCase();

        if (!keyword) {

            renderEnquiryTable(
                enquiryRecords
            );

            return;

        }

        const filtered =
            enquiryRecords.filter(
                enquiry => {

                    const searchable = [

                        enquiry.enquiryId,

                        enquiry.customerId,

                        enquiry.customerName,

                        enquiry.customerMobile,

                        enquiry.customerEmail,

                        enquiry.destination,

                        enquiry.travelType,

                        enquiry.status,

                        enquiry.source

                    ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                    return searchable.includes(
                        keyword
                    );

                }
            );

        renderEnquiryTable(filtered);

    }


    /* =====================================================
       FILTER
       ===================================================== */

    function filterEnquiries() {

        const statusSelect =
            getElementByPossibleIds([
                "enquiry-status-filter",
                "status-filter",
                "enquiries-status-filter"
            ]);

        const selectedStatus =
            statusSelect?.value || "";

        if (!selectedStatus) {

            renderEnquiryTable(
                enquiryRecords
            );

            return;

        }

        const filtered =
            enquiryRecords.filter(
                enquiry =>
                    String(
                        enquiry.status || ""
                    ).toLowerCase() ===
                    String(
                        selectedStatus
                    ).toLowerCase()
            );

        renderEnquiryTable(filtered);

    }


    /* =====================================================
       EDIT ENQUIRY
       ===================================================== */

    function editEnquiry(firestoreId) {

        const enquiry =
            enquiryRecords.find(
                record =>
                    record.firestoreId ===
                    firestoreId
            );

        if (!enquiry) {

            notify(
                "Enquiry not found.",
                "error"
            );

            return;

        }

        editingEnquiryId =
            firestoreId;

        fillForm(enquiry);

        updateFormMode();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    /* =====================================================
       FILL FORM
       ===================================================== */

    function fillForm(enquiry) {

        const customerSelect =
            getElementByPossibleIds([
                "enquiry-customer",
                "customer-select",
                "enquiry-customer-select",
                "customerId",
                "enquiryCustomer"
            ]);

        setValue(
            customerSelect,
            enquiry.customerId || ""
        );

        const fields = {

            "enquiry-customer-name":
                enquiry.customerName,

            "customer-name":
                enquiry.customerName,

            "enquiry-mobile":
                enquiry.customerMobile,

            "customer-mobile":
                enquiry.customerMobile,

            "enquiry-whatsapp":
                enquiry.customerWhatsapp,

            "customer-whatsapp":
                enquiry.customerWhatsapp,

            "enquiry-email":
                enquiry.customerEmail,

            "customer-email":
                enquiry.customerEmail,

            "enquiry-date":
                enquiry.enquiryDate,

            "enquiry-destination":
                enquiry.destination,

            "destination":
                enquiry.destination,

            "enquiry-travel-date":
                enquiry.travelDate,

            "travel-date":
                enquiry.travelDate,

            "enquiry-return-date":
                enquiry.returnDate,

            "return-date":
                enquiry.returnDate,

            "enquiry-duration":
                enquiry.duration,

            "duration":
                enquiry.duration,

            "enquiry-adults":
                enquiry.adults,

            "adults":
                enquiry.adults,

            "enquiry-children":
                enquiry.children,

            "children":
                enquiry.children,

            "enquiry-rooms":
                enquiry.rooms,

            "rooms":
                enquiry.rooms,

            "enquiry-budget":
                enquiry.budget,

            "budget":
                enquiry.budget,

            "enquiry-travel-type":
                enquiry.travelType,

            "travel-type":
                enquiry.travelType,

            "enquiry-hotel-required":
                enquiry.hotelRequired,

            "hotel-required":
                enquiry.hotelRequired,

            "enquiry-cab-required":
                enquiry.cabRequired,

            "cab-required":
                enquiry.cabRequired,

            "enquiry-meal-plan":
                enquiry.mealPlan,

            "meal-plan":
                enquiry.mealPlan,

            "enquiry-source":
                enquiry.source,

            "source":
                enquiry.source,

            "enquiry-status":
                enquiry.status,

            "status":
                enquiry.status,

            "enquiry-assigned-to":
                enquiry.assignedTo,

            "assigned-to":
                enquiry.assignedTo,

            "enquiry-special-requirements":
                enquiry.specialRequirements,

            "special-requirements":
                enquiry.specialRequirements,

            "enquiry-notes":
                enquiry.notes,

            "notes":
                enquiry.notes

        };

        Object.entries(fields).forEach(
            ([id, value]) => {

                const element =
                    document.getElementById(id);

                if (element) {
                    element.value =
                        value ?? "";
                }

            }
        );

    }


    /* =====================================================
       VIEW ENQUIRY
       ===================================================== */

    function viewEnquiry(firestoreId) {

        const enquiry =
            enquiryRecords.find(
                record =>
                    record.firestoreId ===
                    firestoreId
            );

        if (!enquiry) {

            notify(
                "Enquiry not found.",
                "error"
            );

            return;

        }

        const message = [

            `Enquiry ID: ${enquiry.enquiryId || "-"}`,

            `Customer: ${enquiry.customerName || "-"}`,

            `Mobile: ${enquiry.customerMobile || "-"}`,

            `Destination: ${enquiry.destination || "-"}`,

            `Travel Date: ${formatDate(enquiry.travelDate)}`,

            `Return Date: ${formatDate(enquiry.returnDate)}`,

            `Duration: ${enquiry.duration || "-"}`,

            `Adults: ${enquiry.adults || 0}`,

            `Children: ${enquiry.children || 0}`,

            `Rooms: ${enquiry.rooms || 0}`,

            `Budget: ₹${Number(
                enquiry.budget || 0
            ).toLocaleString("en-IN")}`,

            `Status: ${enquiry.status || "-"}`

        ].join("\n");

        alert(message);

    }


    /* =====================================================
       DELETE ENQUIRY
       ===================================================== */

    async function deleteEnquiry(firestoreId) {

        const enquiry =
            enquiryRecords.find(
                record =>
                    record.firestoreId ===
                    firestoreId
            );

        if (!enquiry) {

            notify(
                "Enquiry not found.",
                "error"
            );

            return;

        }

        const confirmed =
            window.confirm(
                `Delete enquiry ${enquiry.enquiryId}?`
            );

        if (!confirmed) {
            return;
        }

        const firestore = getFirestore();

        const modules = getFirestoreModules();

        try {

            const reference =
                modules.doc(
                    firestore,
                    COLLECTION,
                    firestoreId
                );

            await modules.deleteDoc(
                reference
            );

            notify(
                "Enquiry deleted successfully.",
                "success"
            );

            await loadEnquiries();

            if (
                typeof window.refreshDashboard ===
                "function"
            ) {
                window.refreshDashboard();
            }

        } catch (error) {

            console.error(
                "Error deleting enquiry:",
                error
            );

            notify(
                "Unable to delete enquiry.",
                "error"
            );

        }

    }


    /* =====================================================
       RESET FORM
       ===================================================== */

    function resetForm() {

        const form =
            getElementByPossibleIds([
                "enquiry-form",
                "enquiries-form",
                "enquiryForm"
            ]);

        if (form) {
            form.reset();
        }

        editingEnquiryId = null;

        clearCustomerDetails();

        const dateField =
            getElementByPossibleIds([
                "enquiry-date",
                "enquiryDate"
            ]);

        if (dateField) {
            dateField.value =
                getTodayDate();
        }

        updateFormMode();

    }


    /* =====================================================
       FORM MODE
       ===================================================== */

    function updateFormMode() {

        const title =
            getElementByPossibleIds([
                "enquiry-form-title",
                "enquiry-modal-title",
                "form-title"
            ]);

        if (title) {

            title.textContent =
                editingEnquiryId
                    ? "Edit Enquiry"
                    : "New Enquiry";

        }

        const submitButton =
            getElementByPossibleIds([
                "save-enquiry-btn",
                "enquiry-save-btn",
                "submit-enquiry"
            ]);

        if (submitButton) {

            submitButton.textContent =
                editingEnquiryId
                    ? "Update Enquiry"
                    : "Save Enquiry";

        }

    }


    /* =====================================================
       FORM LOADING STATE
       ===================================================== */

    function setFormLoading(isLoading) {

        const submitButton =
            getElementByPossibleIds([
                "save-enquiry-btn",
                "enquiry-save-btn",
                "submit-enquiry"
            ]);

        if (!submitButton) {
            return;
        }

        submitButton.disabled =
            isLoading;

        if (isLoading) {

            submitButton.dataset.originalText =
                submitButton.textContent;

            submitButton.textContent =
                "Saving...";

        } else {

            submitButton.textContent =
                submitButton.dataset.originalText ||
                (
                    editingEnquiryId
                        ? "Update Enquiry"
                        : "Save Enquiry"
                );

        }

    }


    /* =====================================================
       COUNTERS
       ===================================================== */

    function updateEnquiryCounters() {

        const total =
            enquiryRecords.length;

        const newCount =
            enquiryRecords.filter(
                enquiry =>
                    String(
                        enquiry.status || ""
                    ).toLowerCase() === "new"
            ).length;

        const activeCount =
            enquiryRecords.filter(
                enquiry => {

                    const status =
                        String(
                            enquiry.status || ""
                        ).toLowerCase();

                    return ![
                        "closed",
                        "cancelled",
                        "lost"
                    ].includes(status);

                }
            ).length;

        setText(
            "total-enquiries",
            total
        );

        setText(
            "new-enquiries",
            newCount
        );

        setText(
            "active-enquiries",
            activeCount
        );

    }


    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent =
                value;
        }

    }


    /* =====================================================
       CURRENT USER
       ===================================================== */

    function getCurrentUserName() {

        try {

            const user =
                window.currentUser ||
                window.loggedInUser ||
                window.userData;

            if (!user) {
                return "";
            }

            return (
                user.displayName ||
                user.name ||
                user.email ||
                ""
            );

        } catch (error) {

            return "";

        }

    }


    /* =====================================================
       EVENT DELEGATION
       ===================================================== */

    function handleTableAction(event) {

        const button =
            event.target.closest(
                "[data-enquiry-action]"
            );

        if (!button) {
            return;
        }

        const action =
            button.dataset.enquiryAction;

        const firestoreId =
            button.dataset.enquiryFirestoreId;

        if (!firestoreId) {
            return;
        }

        if (action === "view") {
            viewEnquiry(firestoreId);
        }

        if (action === "edit") {
            editEnquiry(firestoreId);
        }

        if (action === "delete") {
            deleteEnquiry(firestoreId);
        }

    }


    /* =====================================================
       EVENT BINDING
       ===================================================== */

    function bindEvents() {

        const form =
            getElementByPossibleIds([
                "enquiry-form",
                "enquiries-form",
                "enquiryForm"
            ]);

        if (form) {

            form.addEventListener(
                "submit",
                saveEnquiry
            );

        }

        const customerSelect =
            getElementByPossibleIds([
                "enquiry-customer",
                "customer-select",
                "enquiry-customer-select",
                "customerId",
                "enquiryCustomer"
            ]);

        if (customerSelect) {

            customerSelect.addEventListener(
                "change",
                handleCustomerChange
            );

        }

        const searchInput =
            getElementByPossibleIds([
                "enquiry-search",
                "enquiries-search",
                "search-enquiries",
                "enquirySearch"
            ]);

        if (searchInput) {

            searchInput.addEventListener(
                "input",
                searchEnquiries
            );

        }

        const statusFilter =
            getElementByPossibleIds([
                "enquiry-status-filter",
                "status-filter",
                "enquiries-status-filter"
            ]);

        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                filterEnquiries
            );

        }

        const resetButtons =
            $all(
                "[data-enquiry-reset], #reset-enquiry, #enquiry-reset-btn"
            );

        resetButtons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    resetForm
                );

            }
        );

        const table =
            getElementByPossibleIds([
                "enquiries-table-body",
                "enquiry-table-body",
                "enquiries-list",
                "enquiry-list"
            ]);

        if (table) {

            table.addEventListener(
                "click",
                handleTableAction
            );

        }

    }


    /* =====================================================
       MODULE INITIALIZATION
       ===================================================== */

    async function initializeEnquiries() {

        bindEvents();

        const dateField =
            getElementByPossibleIds([
                "enquiry-date",
                "enquiryDate"
            ]);

        if (
            dateField &&
            !dateField.value
        ) {
            dateField.value =
                getTodayDate();
        }

        await loadCustomers();

        await loadEnquiries();

        updateFormMode();

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.EnquiriesModule = {

        init:
            initializeEnquiries,

        load:
            loadEnquiries,

        loadCustomers,

        save:
            saveEnquiry,

        reset:
            resetForm,

        edit:
            editEnquiry,

        delete:
            deleteEnquiry,

        search:
            searchEnquiries

    };


    /* =====================================================
       GLOBAL COMPATIBILITY
       ===================================================== */

    window.loadEnquiries =
        loadEnquiries;

    window.initEnquiries =
        initializeEnquiries;

    window.resetEnquiryForm =
        resetForm;


    /* =====================================================
       AUTO INITIALIZATION
       ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            /*
             * app.js can initialize modules after
             * loading their HTML.
             *
             * Therefore we only initialize automatically
             * when the enquiry page already exists.
             */

            if (
                document.querySelector(
                    "#enquiry-page, #enquiries-page, .enquiries-page"
                )
            ) {

                initializeEnquiries();

            }

        }
    );


})();
