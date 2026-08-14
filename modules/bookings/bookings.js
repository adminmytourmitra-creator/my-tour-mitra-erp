/* =========================================================
   MY TOUR MITRA ERP
   BOOKINGS MODULE
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       MODULE STATE
       ===================================================== */

    const state = {
        bookings: [],
        customers: [],
        enquiries: [],
        packages: [],
        loading: false,
        editingId: null
    };


    /* =====================================================
       FIRESTORE COLLECTIONS
       ===================================================== */

    const COLLECTIONS = {
        bookings: "bookings",
        customers: "customers",
        enquiries: "enquiries",
        packages: "packages"
    };


    /* =====================================================
       HELPERS
       ===================================================== */

    function getElement(id) {
        return document.getElementById(id);
    }


    function safeValue(value) {
        return value === undefined || value === null
            ? ""
            : String(value);
    }


    function escapeHtml(value) {

        return safeValue(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function formatCurrency(value) {

        const amount = Number(value) || 0;

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(amount);
    }


    function formatDate(value) {

        if (!value) return "-";

        try {

            let date;

            if (
                typeof value === "object" &&
                typeof value.toDate === "function"
            ) {
                date = value.toDate();
            } else {
                date = new Date(value);
            }

            if (Number.isNaN(date.getTime())) {
                return safeValue(value);
            }

            return date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });

        } catch (error) {

            return safeValue(value);
        }
    }


    function getTodayDate() {

        const date = new Date();

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    function generateBookingId() {

        const year = new Date().getFullYear();

        const random = Math.floor(
            100000 + Math.random() * 900000
        );

        return `BK-${year}-${random}`;
    }


    function showMessage(message, type = "success") {

        if (typeof window.showToast === "function") {
            window.showToast(message, type);
            return;
        }

        if (typeof window.showNotification === "function") {
            window.showNotification(message, type);
            return;
        }

        console.log(`[${type}] ${message}`);
    }


    /* =====================================================
       FIREBASE REFERENCE
       ===================================================== */

    function getDb() {

        if (window.db) {
            return window.db;
        }

        if (window.firebaseDb) {
            return window.firebaseDb;
        }

        if (
            window.firebase &&
            typeof window.firebase.firestore === "function"
        ) {
            return window.firebase.firestore();
        }

        return null;
    }


    /* =====================================================
       LOAD BOOKINGS
       ===================================================== */

    async function loadBookings() {

        const db = getDb();

        if (!db) {
            console.error("Firestore database is not available.");
            return;
        }

        state.loading = true;

        try {

            const snapshot = await db
                .collection(COLLECTIONS.bookings)
                .orderBy("createdAt", "desc")
                .get();

            state.bookings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {

            console.warn(
                "Ordered booking query failed. Trying simple query.",
                error
            );

            try {

                const snapshot = await db
                    .collection(COLLECTIONS.bookings)
                    .get();

                state.bookings = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                state.bookings.sort((a, b) => {

                    const aTime = getTimestamp(a.createdAt);
                    const bTime = getTimestamp(b.createdAt);

                    return bTime - aTime;
                });

            } catch (secondError) {

                console.error(
                    "Unable to load bookings:",
                    secondError
                );

                showMessage(
                    "Unable to load bookings.",
                    "error"
                );

            }

        } finally {

            state.loading = false;

            renderBookings();
            updateBookingSummary();
        }
    }


    /* =====================================================
       LOAD CUSTOMERS
       ===================================================== */

    async function loadCustomers() {

        const db = getDb();

        if (!db) return;

        try {

            const snapshot = await db
                .collection(COLLECTIONS.customers)
                .get();

            state.customers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            populateCustomerSelect();

        } catch (error) {

            console.error(
                "Unable to load customers:",
                error
            );
        }
    }


    /* =====================================================
       LOAD ENQUIRIES
       ===================================================== */

    async function loadEnquiries() {

        const db = getDb();

        if (!db) return;

        try {

            const snapshot = await db
                .collection(COLLECTIONS.enquiries)
                .get();

            state.enquiries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            populateEnquirySelect();

        } catch (error) {

            console.error(
                "Unable to load enquiries:",
                error
            );
        }
    }


    /* =====================================================
       LOAD PACKAGES
       ===================================================== */

    async function loadPackages() {

        const db = getDb();

        if (!db) return;

        try {

            const snapshot = await db
                .collection(COLLECTIONS.packages)
                .get();

            state.packages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            populatePackageSelect();

        } catch (error) {

            console.error(
                "Unable to load packages:",
                error
            );
        }
    }


    /* =====================================================
       TIMESTAMP HELPER
       ===================================================== */

    function getTimestamp(value) {

        if (!value) return 0;

        if (
            typeof value === "object" &&
            typeof value.toMillis === "function"
        ) {
            return value.toMillis();
        }

        if (
            typeof value === "object" &&
            typeof value.toDate === "function"
        ) {
            return value.toDate().getTime();
        }

        const timestamp = new Date(value).getTime();

        return Number.isNaN(timestamp)
            ? 0
            : timestamp;
    }


    /* =====================================================
       CUSTOMER SELECT
       ===================================================== */

    function populateCustomerSelect() {

        const select = getElement("booking-customer");

        if (!select) return;

        const currentValue = select.value;

        select.innerHTML = `
            <option value="">Select Customer</option>
        `;

        state.customers.forEach(customer => {

            const name =
                customer.name ||
                customer.customerName ||
                customer.fullName ||
                "Unnamed Customer";

            const option = document.createElement("option");

            option.value = customer.id;

            option.textContent =
                `${name}${customer.mobile ? ` — ${customer.mobile}` : ""}`;

            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    }


    /* =====================================================
       ENQUIRY SELECT
       ===================================================== */

    function populateEnquirySelect() {

        const select = getElement("booking-enquiry");

        if (!select) return;

        const currentValue = select.value;

        select.innerHTML = `
            <option value="">Select Enquiry</option>
        `;

        state.enquiries.forEach(enquiry => {

            const enquiryId =
                enquiry.enquiryId ||
                enquiry.referenceNo ||
                enquiry.id;

            const customer =
                enquiry.customerName ||
                enquiry.name ||
                "Customer";

            const destination =
                enquiry.destination ||
                enquiry.travelDestination ||
                "";

            const option = document.createElement("option");

            option.value = enquiry.id;

            option.textContent =
                `${enquiryId} — ${customer}${destination ? ` — ${destination}` : ""}`;

            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    }


    /* =====================================================
       PACKAGE SELECT
       ===================================================== */

    function populatePackageSelect() {

        const select = getElement("booking-package");

        if (!select) return;

        const currentValue = select.value;

        select.innerHTML = `
            <option value="">Select Package</option>
        `;

        state.packages.forEach(pkg => {

            const name =
                pkg.packageName ||
                pkg.name ||
                pkg.title ||
                "Unnamed Package";

            const option = document.createElement("option");

            option.value = pkg.id;

            option.textContent = name;

            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    }


    /* =====================================================
       CUSTOMER AUTO FILL
       ===================================================== */

    function handleCustomerChange() {

        const select = getElement("booking-customer");

        if (!select) return;

        const customer = state.customers.find(
            item => item.id === select.value
        );

        if (!customer) return;

        const nameInput = getElement("booking-customer-name");
        const mobileInput = getElement("booking-customer-mobile");
        const emailInput = getElement("booking-customer-email");

        if (nameInput) {
            nameInput.value =
                customer.name ||
                customer.customerName ||
                customer.fullName ||
                "";
        }

        if (mobileInput) {
            mobileInput.value =
                customer.mobile ||
                customer.phone ||
                customer.mobileNumber ||
                "";
        }

        if (emailInput) {
            emailInput.value =
                customer.email ||
                "";
        }
    }


    /* =====================================================
       FORM DATA
       ===================================================== */

    function getFormData() {

        return {

            bookingId:
                safeValue(
                    getElement("booking-id")?.value
                ).trim(),

            customerId:
                safeValue(
                    getElement("booking-customer")?.value
                ).trim(),

            customerName:
                safeValue(
                    getElement("booking-customer-name")?.value
                ).trim(),

            customerMobile:
                safeValue(
                    getElement("booking-customer-mobile")?.value
                ).trim(),

            customerEmail:
                safeValue(
                    getElement("booking-customer-email")?.value
                ).trim(),

            enquiryId:
                safeValue(
                    getElement("booking-enquiry")?.value
                ).trim(),

            packageId:
                safeValue(
                    getElement("booking-package")?.value
                ).trim(),

            destination:
                safeValue(
                    getElement("booking-destination")?.value
                ).trim(),

            travelStartDate:
                safeValue(
                    getElement("booking-start-date")?.value
                ).trim(),

            travelEndDate:
                safeValue(
                    getElement("booking-end-date")?.value
                ).trim(),

            adults:
                Number(
                    getElement("booking-adults")?.value
                ) || 0,

            children:
                Number(
                    getElement("booking-children")?.value
                ) || 0,

            totalPax:
                Number(
                    getElement("booking-total-pax")?.value
                ) || 0,

            vehicle:
                safeValue(
                    getElement("booking-vehicle")?.value
                ).trim(),

            hotel:
                safeValue(
                    getElement("booking-hotel")?.value
                ).trim(),

            totalAmount:
                Number(
                    getElement("booking-total-amount")?.value
                ) || 0,

            receivedAmount:
                Number(
                    getElement("booking-received-amount")?.value
                ) || 0,

            paymentStatus:
                safeValue(
                    getElement("booking-payment-status")?.value
                ).trim(),

            bookingStatus:
                safeValue(
                    getElement("booking-status")?.value
                ).trim(),

            remarks:
                safeValue(
                    getElement("booking-remarks")?.value
                ).trim()
        };
    }


    /* =====================================================
       VALIDATE FORM
       ===================================================== */

    function validateBooking(data) {

        if (!data.customerName) {

            showMessage(
                "Please select or enter customer.",
                "error"
            );

            return false;
        }


        if (!data.destination) {

            showMessage(
                "Please enter destination.",
                "error"
            );

            return false;
        }


        if (!data.travelStartDate) {

            showMessage(
                "Please select travel start date.",
                "error"
            );

            return false;
        }


        if (!data.bookingStatus) {

            data.bookingStatus = "Confirmed";
        }


        if (!data.paymentStatus) {

            data.paymentStatus = "Pending";
        }


        return true;
    }


    /* =====================================================
       SAVE BOOKING
       ===================================================== */

    async function saveBooking(event) {

        if (event) {
            event.preventDefault();
        }

        const db = getDb();

        if (!db) {

            showMessage(
                "Database is not available.",
                "error"
            );

            return;
        }

        const data = getFormData();

        if (!validateBooking(data)) {
            return;
        }


        const submitButton =
            getElement("booking-save-btn");

        if (submitButton) {
            submitButton.disabled = true;
        }


        try {

            const now =
                window.firebase?.firestore?.Timestamp
                    ? window.firebase.firestore.Timestamp.now()
                    : new Date();


            if (state.editingId) {

                await db
                    .collection(COLLECTIONS.bookings)
                    .doc(state.editingId)
                    .update({
                        ...data,
                        updatedAt: now
                    });

                showMessage(
                    "Booking updated successfully.",
                    "success"
                );

            } else {

                const bookingId =
                    data.bookingId ||
                    generateBookingId();

                await db
                    .collection(COLLECTIONS.bookings)
                    .add({
                        ...data,
                        bookingId,
                        createdAt: now,
                        updatedAt: now
                    });

                showMessage(
                    "Booking created successfully.",
                    "success"
                );
            }


            resetBookingForm();

            await loadBookings();

        } catch (error) {

            console.error(
                "Error saving booking:",
                error
            );

            showMessage(
                "Unable to save booking.",
                "error"
            );

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    }


    /* =====================================================
       RENDER BOOKINGS
       ===================================================== */

    function renderBookings() {

        const tbody =
            getElement("bookings-table-body");

        if (!tbody) return;


        if (!state.bookings.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="100%" class="empty-state">
                        No bookings found.
                    </td>
                </tr>
            `;

            return;
        }


        tbody.innerHTML =
            state.bookings.map(booking => {

                const status =
                    booking.bookingStatus ||
                    booking.status ||
                    "Pending";

                const paymentStatus =
                    booking.paymentStatus ||
                    "Pending";


                return `
                    <tr data-booking-id="${escapeHtml(booking.id)}">

                        <td>
                            <strong>
                                ${escapeHtml(
                                    booking.bookingId ||
                                    booking.id
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                booking.customerName ||
                                "-"
                            )}

                            ${
                                booking.customerMobile
                                    ? `<small>${escapeHtml(
                                        booking.customerMobile
                                      )}</small>`
                                    : ""
                            }
                        </td>

                        <td>
                            ${escapeHtml(
                                booking.destination ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                booking.travelStartDate
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                booking.travelEndDate
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                booking.totalPax ||
                                0
                            )}
                        </td>

                        <td>
                            ${formatCurrency(
                                booking.totalAmount
                            )}
                        </td>

                        <td>
                            <span class="status-badge booking-status-${safeValue(status).toLowerCase()}">
                                ${escapeHtml(status)}
                            </span>
                        </td>

                        <td>
                            <span class="status-badge payment-status-${safeValue(paymentStatus).toLowerCase()}">
                                ${escapeHtml(paymentStatus)}
                            </span>
                        </td>

                        <td>

                            <div class="table-actions">

                                <button
                                    type="button"
                                    class="btn-action btn-edit-booking"
                                    data-id="${escapeHtml(booking.id)}"
                                    title="Edit Booking"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="btn-action btn-view-booking"
                                    data-id="${escapeHtml(booking.id)}"
                                    title="View Booking"
                                >
                                    View
                                </button>

                                <button
                                    type="button"
                                    class="btn-action btn-delete-booking"
                                    data-id="${escapeHtml(booking.id)}"
                                    title="Delete Booking"
                                >
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>
                `;

            }).join("");
    }


    /* =====================================================
       SUMMARY
       ===================================================== */

    function updateBookingSummary() {

        const total =
            state.bookings.length;

        const confirmed =
            state.bookings.filter(
                booking =>
                    String(
                        booking.bookingStatus ||
                        booking.status ||
                        ""
                    ).toLowerCase() === "confirmed"
            ).length;


        const upcoming =
            state.bookings.filter(
                booking => {

                    if (!booking.travelStartDate) {
                        return false;
                    }

                    return (
                        booking.travelStartDate >=
                        getTodayDate()
                    );
                }
            ).length;


        const cancelled =
            state.bookings.filter(
                booking =>
                    String(
                        booking.bookingStatus ||
                        booking.status ||
                        ""
                    ).toLowerCase() === "cancelled"
            ).length;


        setText("booking-total-count", total);
        setText("booking-confirmed-count", confirmed);
        setText("booking-upcoming-count", upcoming);
        setText("booking-cancelled-count", cancelled);
    }


    function setText(id, value) {

        const element = getElement(id);

        if (element) {
            element.textContent = value;
        }
    }


    /* =====================================================
       EDIT BOOKING
       ===================================================== */

    function editBooking(id) {

        const booking =
            state.bookings.find(
                item => item.id === id
            );

        if (!booking) return;


        state.editingId = id;


        setValue(
            "booking-id",
            booking.bookingId || ""
        );

        setValue(
            "booking-customer",
            booking.customerId || ""
        );

        setValue(
            "booking-customer-name",
            booking.customerName || ""
        );

        setValue(
            "booking-customer-mobile",
            booking.customerMobile || ""
        );

        setValue(
            "booking-customer-email",
            booking.customerEmail || ""
        );

        setValue(
            "booking-enquiry",
            booking.enquiryId || ""
        );

        setValue(
            "booking-package",
            booking.packageId || ""
        );

        setValue(
            "booking-destination",
            booking.destination || ""
        );

        setValue(
            "booking-start-date",
            booking.travelStartDate || ""
        );

        setValue(
            "booking-end-date",
            booking.travelEndDate || ""
        );

        setValue(
            "booking-adults",
            booking.adults || ""
        );

        setValue(
            "booking-children",
            booking.children || ""
        );

        setValue(
            "booking-total-pax",
            booking.totalPax || ""
        );

        setValue(
            "booking-vehicle",
            booking.vehicle || ""
        );

        setValue(
            "booking-hotel",
            booking.hotel || ""
        );

        setValue(
            "booking-total-amount",
            booking.totalAmount || ""
        );

        setValue(
            "booking-received-amount",
            booking.receivedAmount || ""
        );

        setValue(
            "booking-payment-status",
            booking.paymentStatus || "Pending"
        );

        setValue(
            "booking-status",
            booking.bookingStatus ||
            booking.status ||
            "Confirmed"
        );

        setValue(
            "booking-remarks",
            booking.remarks || ""
        );


        const form =
            getElement("booking-form");

        if (form) {
            form.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }


        const saveButton =
            getElement("booking-save-btn");

        if (saveButton) {
            saveButton.textContent =
                "Update Booking";
        }
    }


    /* =====================================================
       SET VALUE
       ===================================================== */

    function setValue(id, value) {

        const element = getElement(id);

        if (element) {
            element.value = value;
        }
    }


    /* =====================================================
       VIEW BOOKING
       ===================================================== */

    function viewBooking(id) {

        const booking =
            state.bookings.find(
                item => item.id === id
            );

        if (!booking) return;


        const details = `
Booking ID: ${booking.bookingId || booking.id}

Customer: ${booking.customerName || "-"}

Mobile: ${booking.customerMobile || "-"}

Destination: ${booking.destination || "-"}

Travel Start: ${formatDate(booking.travelStartDate)}

Travel End: ${formatDate(booking.travelEndDate)}

Total Pax: ${booking.totalPax || 0}

Total Amount: ${formatCurrency(booking.totalAmount)}

Received: ${formatCurrency(booking.receivedAmount)}

Payment Status: ${booking.paymentStatus || "Pending"}

Booking Status: ${
    booking.bookingStatus ||
    booking.status ||
    "Pending"
}
        `.trim();


        if (
            typeof window.showModal === "function"
        ) {

            window.showModal(
                "Booking Details",
                details
            );

            return;
        }


        alert(details);
    }


    /* =====================================================
       DELETE BOOKING
       ===================================================== */

    async function deleteBooking(id) {

        const booking =
            state.bookings.find(
                item => item.id === id
            );

        if (!booking) return;


        const confirmed =
            window.confirm(
                `Delete booking ${
                    booking.bookingId ||
                    booking.id
                }?`
            );


        if (!confirmed) return;


        const db = getDb();

        if (!db) {

            showMessage(
                "Database is not available.",
                "error"
            );

            return;
        }


        try {

            await db
                .collection(COLLECTIONS.bookings)
                .doc(id)
                .delete();


            showMessage(
                "Booking deleted successfully.",
                "success"
            );


            await loadBookings();

        } catch (error) {

            console.error(
                "Unable to delete booking:",
                error
            );

            showMessage(
                "Unable to delete booking.",
                "error"
            );
        }
    }


    /* =====================================================
       RESET FORM
       ===================================================== */

    function resetBookingForm() {

        const form =
            getElement("booking-form");

        if (form) {
            form.reset();
        }


        state.editingId = null;


        setValue(
            "booking-status",
            "Confirmed"
        );

        setValue(
            "booking-payment-status",
            "Pending"
        );


        const idInput =
            getElement("booking-id");

        if (idInput) {
            idInput.value =
                generateBookingId();
        }


        const saveButton =
            getElement("booking-save-btn");

        if (saveButton) {
            saveButton.textContent =
                "Save Booking";
        }
    }


    /* =====================================================
       SEARCH BOOKINGS
       ===================================================== */

    function searchBookings() {

        const input =
            getElement("booking-search");

        const tbody =
            getElement("bookings-table-body");

        if (!input || !tbody) return;


        const query =
            input.value
                .trim()
                .toLowerCase();


        const filtered =
            state.bookings.filter(
                booking => {

                    const searchable = [

                        booking.bookingId,

                        booking.customerName,

                        booking.customerMobile,

                        booking.destination,

                        booking.bookingStatus,

                        booking.paymentStatus

                    ]
                        .map(safeValue)
                        .join(" ")
                        .toLowerCase();


                    return searchable.includes(query);
                }
            );


        renderBookingRows(filtered);
    }


    /* =====================================================
       RENDER FILTERED ROWS
       ===================================================== */

    function renderBookingRows(bookings) {

        const tbody =
            getElement("bookings-table-body");

        if (!tbody) return;


        if (!bookings.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="100%" class="empty-state">
                        No matching bookings found.
                    </td>
                </tr>
            `;

            return;
        }


        const original =
            state.bookings;


        state.bookings =
            bookings;


        renderBookings();


        state.bookings =
            original;
    }


    /* =====================================================
       EVENT LISTENERS
       ===================================================== */

    function bindEvents() {


        const form =
            getElement("booking-form");

        if (form) {

            form.addEventListener(
                "submit",
                saveBooking
            );
        }


        const customerSelect =
            getElement("booking-customer");

        if (customerSelect) {

            customerSelect.addEventListener(
                "change",
                handleCustomerChange
            );
        }


        const resetButton =
            getElement("booking-reset-btn");

        if (resetButton) {

            resetButton.addEventListener(
                "click",
                resetBookingForm
            );
        }


        const refreshButton =
            getElement("booking-refresh-btn");

        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                async function () {

                    await loadBookings();

                }
            );
        }


        const searchInput =
            getElement("booking-search");

        if (searchInput) {

            searchInput.addEventListener(
                "input",
                searchBookings
            );
        }


        document.addEventListener(
            "click",
            function (event) {

                const editButton =
                    event.target.closest(
                        ".btn-edit-booking"
                    );

                if (editButton) {

                    editBooking(
                        editButton.dataset.id
                    );

                    return;
                }


                const viewButton =
                    event.target.closest(
                        ".btn-view-booking"
                    );

                if (viewButton) {

                    viewBooking(
                        viewButton.dataset.id
                    );

                    return;
                }


                const deleteButton =
                    event.target.closest(
                        ".btn-delete-booking"
                    );

                if (deleteButton) {

                    deleteBooking(
                        deleteButton.dataset.id
                    );
                }

            }
        );
    }


    /* =====================================================
       MODULE INITIALIZATION
       ===================================================== */

    async function initBookings() {

        console.log(
            "Bookings module initialized."
        );


        bindEvents();

        resetBookingForm();


        await Promise.all([
            loadCustomers(),
            loadEnquiries(),
            loadPackages()
        ]);


        await loadBookings();
    }


    /* =====================================================
       PUBLIC MODULE API
       ===================================================== */

    window.BookingsModule = {

        init: initBookings,

        load: loadBookings,

        reset: resetBookingForm,

        edit: editBooking,

        view: viewBooking,

        delete: deleteBooking
    };


    /* =====================================================
       AUTO INIT
       ===================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initBookings
        );

    } else {

        initBookings();
    }

})();
