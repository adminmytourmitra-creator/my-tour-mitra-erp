/* =========================================================
   MY TOUR MITRA ERP
   PAYMENTS MODULE
   File:
   modules/payments/payments.js

   Purpose:
   - Record customer payments
   - Track total receivable
   - Track total received
   - Track outstanding balance
   - Customer-wise payment monitoring
   - Booking / Invoice linking
   - Payment history
   - Search & filters
   - Firestore CRUD
   ========================================================= */

(function () {
    "use strict";


    /* =====================================================
       MODULE STATE
       ===================================================== */

    const state = {

        payments: [],
        customers: [],
        bookings: [],
        invoices: [],

        editingPaymentId: null,
        selectedPaymentId: null,

        loading: false

    };


    /* =====================================================
       FIREBASE HELPERS
       ===================================================== */

    function getDB() {

        /*
         * Supports the existing firebase.js structure.
         */

        if (window.db) {
            return window.db;
        }

        if (
            window.firebase &&
            window.firebase.firestore
        ) {
            return window.firebase.firestore();
        }

        console.error(
            "Firestore database instance not found."
        );

        return null;
    }


    function getCurrentUser() {

        if (
            window.currentUser
        ) {
            return window.currentUser;
        }

        if (
            window.auth &&
            window.auth.currentUser
        ) {
            return window.auth.currentUser;
        }

        if (
            window.firebase &&
            window.firebase.auth
        ) {
            return window.firebase
                .auth()
                .currentUser;
        }

        return null;
    }


    /* =====================================================
       DOM HELPERS
       ===================================================== */

    function $(id) {
        return document.getElementById(id);
    }


    function show(element) {

        if (element) {
            element.hidden = false;
        }
    }


    function hide(element) {

        if (element) {
            element.hidden = true;
        }
    }


    function setText(
        id,
        value
    ) {

        const element = $(id);

        if (element) {
            element.textContent =
                value ?? "";
        }
    }


    /* =====================================================
       FORMATTERS
       ===================================================== */

    function toNumber(value) {

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    }


    function formatMoney(value) {

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ).format(
            toNumber(value)
        );
    }


    function formatDate(value) {

        if (!value) {
            return "-";
        }

        let date;

        if (
            value &&
            typeof value.toDate ===
                "function"
        ) {
            date =
                value.toDate();
        } else {
            date =
                new Date(value);
        }

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "-";
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


    function dateInputValue(
        value
    ) {

        if (!value) {
            return "";
        }

        let date;

        if (
            value &&
            typeof value.toDate ===
                "function"
        ) {
            date =
                value.toDate();
        } else {
            date =
                new Date(value);
        }

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            );

        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            );

        return `${year}-${month}-${day}`;
    }


    function escapeHTML(
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
    }


    /* =====================================================
       COLLECTION HELPERS
       ===================================================== */

    function collectionRef(
        collectionName
    ) {

        const db =
            getDB();

        if (!db) {
            return null;
        }

        return db.collection(
            collectionName
        );
    }


    /*
     * Payments collection is the primary collection.
     */

    function paymentsCollection() {
        return collectionRef(
            "payments"
        );
    }


    /* =====================================================
       LOAD PAYMENTS
       ===================================================== */

    async function loadPayments() {

        const collection =
            paymentsCollection();

        if (!collection) {
            return;
        }

        setLoading(
            true
        );

        try {

            const snapshot =
                await collection
                    .orderBy(
                        "paymentDate",
                        "desc"
                    )
                    .get();

            state.payments =
                snapshot.docs.map(
                    doc => ({
                        id: doc.id,
                        ...doc.data()
                    })
                );

        } catch (error) {

            /*
             * If paymentDate index/order
             * is not available, fallback to
             * normal collection query.
             */

            console.warn(
                "Ordered payment query failed. Using fallback.",
                error
            );

            try {

                const snapshot =
                    await collection
                        .get();

                state.payments =
                    snapshot.docs.map(
                        doc => ({
                            id: doc.id,
                            ...doc.data()
                        })
                    );

                sortPayments();

            } catch (fallbackError) {

                console.error(
                    "Failed to load payments:",
                    fallbackError
                );

                showError(
                    "Unable to load payment records."
                );
            }

        } finally {

            setLoading(
                false
            );
        }
    }


    function sortPayments() {

        state.payments.sort(
            (a, b) => {

                const dateA =
                    new Date(
                        a.paymentDate ||
                        0
                    ).getTime();

                const dateB =
                    new Date(
                        b.paymentDate ||
                        0
                    ).getTime();

                return dateB - dateA;
            }
        );
    }


    /* =====================================================
       LOAD CUSTOMERS
       ===================================================== */

    async function loadCustomers() {

        const collection =
            collectionRef(
                "customers"
            );

        if (!collection) {
            return;
        }

        try {

            const snapshot =
                await collection.get();

            state.customers =
                snapshot.docs.map(
                    doc => ({
                        id: doc.id,
                        ...doc.data()
                    })
                );

            populateCustomerDropdown();

        } catch (error) {

            console.error(
                "Failed to load customers:",
                error
            );
        }
    }


    /* =====================================================
       LOAD BOOKINGS
       ===================================================== */

    async function loadBookings() {

        const collection =
            collectionRef(
                "bookings"
            );

        if (!collection) {
            return;
        }

        try {

            const snapshot =
                await collection.get();

            state.bookings =
                snapshot.docs.map(
                    doc => ({
                        id: doc.id,
                        ...doc.data()
                    })
                );

            populateBookingDropdown();

        } catch (error) {

            console.error(
                "Failed to load bookings:",
                error
            );
        }
    }


    /* =====================================================
       LOAD INVOICES
       ===================================================== */

    async function loadInvoices() {

        const collection =
            collectionRef(
                "invoices"
            );

        if (!collection) {
            return;
        }

        try {

            const snapshot =
                await collection.get();

            state.invoices =
                snapshot.docs.map(
                    doc => ({
                        id: doc.id,
                        ...doc.data()
                    })
                );

            populateInvoiceDropdown();

        } catch (error) {

            console.error(
                "Failed to load invoices:",
                error
            );
        }
    }


    /* =====================================================
       CUSTOMER DROPDOWN
       ===================================================== */

    function populateCustomerDropdown() {

        const select =
            $("paymentCustomer");

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

        state.customers.forEach(
            customer => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    customer.id;

                option.textContent =
                    customer.name ||
                    customer.customerName ||
                    customer.fullName ||
                    "Unnamed Customer";

                select.appendChild(
                    option
                );
            }
        );

        if (currentValue) {
            select.value =
                currentValue;
        }
    }


    /* =====================================================
       BOOKING DROPDOWN
       ===================================================== */

    function populateBookingDropdown(
        customerId = ""
    ) {

        const select =
            $("paymentBooking");

        if (!select) {
            return;
        }

        const currentValue =
            select.value;

        const bookings =
            customerId
                ? state.bookings.filter(
                    booking =>
                        String(
                            booking.customerId ||
                            ""
                        ) ===
                        String(
                            customerId
                        )
                )
                : state.bookings;

        select.innerHTML = `
            <option value="">
                Select Booking
            </option>
        `;

        bookings.forEach(
            booking => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    booking.id;

                option.textContent =
                    booking.bookingNumber ||
                    booking.bookingId ||
                    booking.id;

                select.appendChild(
                    option
                );
            }
        );

        if (currentValue) {
            select.value =
                currentValue;
        }
    }


    /* =====================================================
       INVOICE DROPDOWN
       ===================================================== */

    function populateInvoiceDropdown(
        customerId = ""
    ) {

        const select =
            $("paymentInvoice");

        if (!select) {
            return;
        }

        const currentValue =
            select.value;

        const invoices =
            customerId
                ? state.invoices.filter(
                    invoice =>
                        String(
                            invoice.customerId ||
                            ""
                        ) ===
                        String(
                            customerId
                        )
                )
                : state.invoices;

        select.innerHTML = `
            <option value="">
                Select Invoice
            </option>
        `;

        invoices.forEach(
            invoice => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    invoice.id;

                option.textContent =
                    invoice.invoiceNumber ||
                    invoice.invoiceId ||
                    invoice.id;

                select.appendChild(
                    option
                );
            }
        );

        if (currentValue) {
            select.value =
                currentValue;
        }
    }


    /* =====================================================
       FIND RECORD
       ===================================================== */

    function findCustomer(
        id
    ) {

        return state.customers.find(
            customer =>
                String(
                    customer.id
                ) ===
                String(id)
        );
    }


    function findBooking(
        id
    ) {

        return state.bookings.find(
            booking =>
                String(
                    booking.id
                ) ===
                String(id)
        );
    }


    function findInvoice(
        id
    ) {

        return state.invoices.find(
            invoice =>
                String(
                    invoice.id
                ) ===
                String(id)
        );
    }


    /* =====================================================
       CUSTOMER NAME
       ===================================================== */

    function getCustomerName(
        payment
    ) {

        if (
            payment.customerName
        ) {
            return payment.customerName;
        }

        const customer =
            findCustomer(
                payment.customerId
            );

        if (!customer) {
            return "-";
        }

        return (
            customer.name ||
            customer.customerName ||
            customer.fullName ||
            "-"
        );
    }


    /* =====================================================
       INVOICE TOTAL
       ===================================================== */

    function getInvoiceTotal(
        invoice
    ) {

        if (!invoice) {
            return 0;
        }

        return toNumber(
            invoice.grandTotal ||
            invoice.totalAmount ||
            invoice.netAmount ||
            invoice.amount
        );
    }


    /* =====================================================
       BOOKING TOTAL
       ===================================================== */

    function getBookingTotal(
        booking
    ) {

        if (!booking) {
            return 0;
        }

        return toNumber(
            booking.grandTotal ||
            booking.totalAmount ||
            booking.packageTotal ||
            booking.finalAmount ||
            booking.amount
        );
    }


    /* =====================================================
       PAYMENT STATUS
       ===================================================== */

    function calculatePaymentStatus(
        totalAmount,
        receivedAmount
    ) {

        totalAmount =
            toNumber(
                totalAmount
            );

        receivedAmount =
            toNumber(
                receivedAmount
            );

        if (
            totalAmount <= 0
        ) {
            return "pending";
        }

        if (
            receivedAmount >=
            totalAmount
        ) {
            return "paid";
        }

        if (
            receivedAmount > 0
        ) {
            return "partial";
        }

        return "pending";
    }


    function getPaymentStatusLabel(
        status
    ) {

        const labels = {

            paid:
                "Paid",

            partial:
                "Partially Paid",

            pending:
                "Pending",

            overdue:
                "Overdue"
        };

        return (
            labels[status] ||
            "Pending"
        );
    }


    function getStatusClass(
        status
    ) {

        return `
            payment-status
            payment-status-${status}
        `;
    }


    /* =====================================================
       GET PAYMENT TOTALS
       ===================================================== */

    function calculateDashboardTotals() {

        let totalReceived =
            0;

        let totalReceivable =
            0;


        /*
         * Receivable is calculated from
         * invoices first.
         */

        state.invoices.forEach(
            invoice => {

                totalReceivable +=
                    getInvoiceTotal(
                        invoice
                    );
            }
        );


        /*
         * If no invoices are loaded,
         * use booking totals.
         */

        if (
            totalReceivable === 0
        ) {

            state.bookings.forEach(
                booking => {

                    totalReceivable +=
                        getBookingTotal(
                            booking
                        );
                }
            );
        }


        /*
         * Total received is the sum
         * of all payment transactions.
         */

        state.payments.forEach(
            payment => {

                totalReceived +=
                    toNumber(
                        payment.amount
                    );
            }
        );


        const totalBalance =
            Math.max(
                0,
                totalReceivable -
                totalReceived
            );


        return {
            totalReceivable,
            totalReceived,
            totalBalance
        };
    }


    /* =====================================================
       UPDATE SUMMARY
       ===================================================== */

    function updateSummary() {

        const totals =
            calculateDashboardTotals();

        setText(
            "totalReceivable",
            formatMoney(
                totals.totalReceivable
            )
        );

        setText(
            "totalReceived",
            formatMoney(
                totals.totalReceived
            )
        );

        setText(
            "totalBalance",
            formatMoney(
                totals.totalBalance
            )
        );

        setText(
            "totalTransactions",
            state.payments.length
        );


        const monitor =
            getCustomerMonitorData();


        let paid =
            0;

        let partial =
            0;

        let pending =
            0;

        let overdue =
            0;


        monitor.forEach(
            item => {

                switch (
                    item.status
                ) {

                    case "paid":
                        paid++;
                        break;

                    case "partial":
                        partial++;
                        break;

                    case "overdue":
                        overdue++;
                        break;

                    default:
                        pending++;
                }
            }
        );


        setText(
            "paidCount",
            paid
        );

        setText(
            "partialPaidCount",
            partial
        );

        setText(
            "pendingPaymentCount",
            pending
        );

        setText(
            "overduePaymentCount",
            overdue
        );
    }


    /* =====================================================
       RENDER PAYMENT TABLE
       ===================================================== */

    function renderPayments() {

        const tbody =
            $("paymentsTableBody");

        if (!tbody) {
            return;
        }

        const filtered =
            getFilteredPayments();


        if (!filtered.length) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="12"
                        class="empty-state"
                    >

                        <strong>
                            No payment records found
                        </strong>

                        <p>
                            Try changing the filters
                            or add a new payment.
                        </p>

                    </td>

                </tr>
            `;

            return;
        }


        tbody.innerHTML =
            filtered.map(
                payment =>
                    renderPaymentRow(
                        payment
                    )
            ).join("");
    }


    function renderPaymentRow(
        payment
    ) {

        const customerName =
            getCustomerName(
                payment
            );


        const booking =
            findBooking(
                payment.bookingId
            );


        const invoice =
            findInvoice(
                payment.invoiceId
            );


        const totalAmount =
            toNumber(
                payment.totalAmount
            );


        const received =
            toNumber(
                payment.amount
            );


        const balance =
            Math.max(
                0,
                toNumber(
                    payment.balance
                ) ||
                totalAmount -
                received
            );


        let status =
            payment.status ||
            calculatePaymentStatus(
                totalAmount,
                received
            );


        return `

            <tr
                data-payment-id="${escapeHTML(
                    payment.id
                )}"
            >

                <td>
                    ${escapeHTML(
                        payment.paymentNumber ||
                        payment.id
                    )}
                </td>


                <td>
                    ${formatDate(
                        payment.paymentDate
                    )}
                </td>


                <td>
                    <strong>
                        ${escapeHTML(
                            customerName
                        )}
                    </strong>
                </td>


                <td>
                    ${escapeHTML(
                        booking
                            ? (
                                booking.bookingNumber ||
                                booking.bookingId ||
                                booking.id
                            )
                            : (
                                payment.bookingNumber ||
                                "-"
                            )
                    )}
                </td>


                <td>
                    ${escapeHTML(
                        invoice
                            ? (
                                invoice.invoiceNumber ||
                                invoice.invoiceId ||
                                invoice.id
                            )
                            : (
                                payment.invoiceNumber ||
                                "-"
                            )
                    )}
                </td>


                <td>
                    ${formatMoney(
                        totalAmount
                    )}
                </td>


                <td>
                    <strong>
                        ${formatMoney(
                            received
                        )}
                    </strong>
                </td>


                <td>

                    <strong
                        class="${
                            balance > 0
                                ? "balance-due"
                                : "balance-clear"
                        }"
                    >
                        ${formatMoney(
                            balance
                        )}
                    </strong>

                </td>


                <td>
                    ${escapeHTML(
                        payment.paymentMethod ||
                        "-"
                    )}
                </td>


                <td>
                    ${escapeHTML(
                        payment.reference ||
                        "-"
                    )}
                </td>


                <td>

                    <span
                        class="${getStatusClass(
                            status
                        )}"
                    >
                        ${escapeHTML(
                            getPaymentStatusLabel(
                                status
                            )
                        )}
                    </span>

                </td>


                <td>

                    <div
                        class="table-actions"
                    >

                        <button
                            type="button"
                            class="btn btn-sm btn-secondary"
                            data-action="view-payment"
                            data-id="${escapeHTML(
                                payment.id
                            )}"
                        >
                            View
                        </button>


                        <button
                            type="button"
                            class="btn btn-sm btn-secondary"
                            data-action="edit-payment"
                            data-id="${escapeHTML(
                                payment.id
                            )}"
                        >
                            Edit
                        </button>


                        <button
                            type="button"
                            class="btn btn-sm btn-danger"
                            data-action="delete-payment"
                            data-id="${escapeHTML(
                                payment.id
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
       FILTER PAYMENTS
       ===================================================== */

    function getFilteredPayments() {

        const search =
            (
                $("paymentSearch")?.value ||
                ""
            )
                .trim()
                .toLowerCase();


        const status =
            $("paymentStatusFilter")?.value ||
            "";


        const method =
            $("paymentMethodFilter")?.value ||
            "";


        const fromDate =
            $("paymentFromDate")?.value ||
            "";


        const toDate =
            $("paymentToDate")?.value ||
            "";


        return state.payments.filter(
            payment => {

                const customerName =
                    getCustomerName(
                        payment
                    ).toLowerCase();


                const searchText =
                    [
                        payment.paymentNumber,
                        payment.id,
                        payment.customerName,
                        customerName,
                        payment.bookingNumber,
                        payment.invoiceNumber,
                        payment.reference,
                        payment.paymentMethod
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                if (
                    search &&
                    !searchText.includes(
                        search
                    )
                ) {
                    return false;
                }


                if (
                    status &&
                    payment.status !==
                        status
                ) {
                    return false;
                }


                if (
                    method &&
                    payment.paymentMethod !==
                        method
                ) {
                    return false;
                }


                if (
                    fromDate &&
                    dateInputValue(
                        payment.paymentDate
                    ) < fromDate
                ) {
                    return false;
                }


                if (
                    toDate &&
                    dateInputValue(
                        payment.paymentDate
                    ) > toDate
                ) {
                    return false;
                }


                return true;
            }
        );
    }


    /* =====================================================
       CUSTOMER MONITOR
       ===================================================== */

    function getCustomerMonitorData() {

        const map =
            new Map();


        /*
         * Start with invoices so even customers
         * who have not paid anything appear.
         */

        state.invoices.forEach(
            invoice => {

                const customerId =
                    invoice.customerId ||
                    "";


                if (!customerId) {
                    return;
                }


                if (
                    !map.has(
                        customerId
                    )
                {

                    map.set(
                        customerId,
                        {
                            customerId,
                            customerName:
                                invoice.customerName ||
                                getCustomerName(
                                    invoice
                                ),
                            totalAmount:
                                0,
                            received:
                                0,
                            balance:
                                0,
                            lastPayment:
                                null
                        }
                    );
                }


                const item =
                    map.get(
                        customerId
                    );


                item.totalAmount +=
                    getInvoiceTotal(
                        invoice
                    );
            }
        );


        /*
         * Add payment records.
         */

        state.payments.forEach(
            payment => {

                const customerId =
                    payment.customerId ||
                    "";


                if (!customerId) {
                    return;
                }


                if (
                    !map.has(
                        customerId
                    )
                {

                    map.set(
                        customerId,
                        {
                            customerId,
                            customerName:
                                getCustomerName(
                                    payment
                                ),
                            totalAmount:
                                0,
                            received:
                                0,
                            balance:
                                0,
                            lastPayment:
                                null
                        }
                    );
                }


                const item =
                    map.get(
                        customerId
                    );


                item.received +=
                    toNumber(
                        payment.amount
                    );


                const paymentDate =
                    payment.paymentDate
                        ? new Date(
                            payment.paymentDate
                        )
                        : null;


                if (
                    paymentDate &&
                    !Number.isNaN(
                        paymentDate.getTime()
                    )
                ) {

                    if (
                        !item.lastPayment ||
                        paymentDate >
                            new Date(
                                item.lastPayment
                            )
                    ) {

                        item.lastPayment =
                            payment.paymentDate;
                    }
                }
            }
        );


        /*
         * Calculate balances/status.
         */

        const result =
            Array.from(
                map.values()
            );


        result.forEach(
            item => {

                item.balance =
                    Math.max(
                        0,
                        item.totalAmount -
                        item.received
                    );


                item.status =
                    calculatePaymentStatus(
                        item.totalAmount,
                        item.received
                    );
            }
        );


        return result;
    }


    /* =====================================================
       RENDER CUSTOMER MONITOR
       ===================================================== */

    function renderCustomerMonitor() {

        const tbody =
            $("customerPaymentTableBody");

        if (!tbody) {
            return;
        }


        const data =
            getCustomerMonitorData();


        if (!data.length) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="empty-state"
                    >
                        No customer payment data available.
                    </td>

                </tr>
            `;

            return;
        }


        tbody.innerHTML =
            data.map(
                item => `

                    <tr>

                        <td>

                            <strong>
                                ${escapeHTML(
                                    item.customerName ||
                                    "-"
                                )}
                            </strong>

                        </td>


                        <td>
                            ${formatMoney(
                                item.totalAmount
                            )}
                        </td>


                        <td>
                            <strong>
                                ${formatMoney(
                                    item.received
                                )}
                            </strong>
                        </td>


                        <td>

                            <strong
                                class="${
                                    item.balance > 0
                                        ? "balance-due"
                                        : "balance-clear"
                                }"
                            >
                                ${formatMoney(
                                    item.balance
                                )}
                            </strong>

                        </td>


                        <td>
                            ${formatDate(
                                item.lastPayment
                            )}
                        </td>


                        <td>

                            <span
                                class="${getStatusClass(
                                    item.status
                                )}"
                            >
                                ${escapeHTML(
                                    getPaymentStatusLabel(
                                        item.status
                                    )
                                )}
                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="btn btn-sm btn-secondary"
                                data-action="customer-payment-details"
                                data-id="${escapeHTML(
                                    item.customerId
                                )}"
                            >
                                View
                            </button>

                        </td>

                    </tr>

                `
            ).join("");
    }


    /* =====================================================
       CUSTOMER SELECT CHANGE
       ===================================================== */

    function handleCustomerChange() {

        const customerId =
            $("paymentCustomer")?.value ||
            "";


        populateBookingDropdown(
            customerId
        );

        populateInvoiceDropdown(
            customerId
        );


        /*
         * Reset dependent values.
         */

        setInputValue(
            "paymentBooking",
            ""
        );

        setInputValue(
            "paymentInvoice",
            ""
        );

        setInputValue(
            "paymentPackage",
            ""
        );

        setInputValue(
            "paymentTotalAmount",
            "0"
        );

        setInputValue(
            "paymentPreviouslyReceived",
            "0"
        );

        setInputValue(
            "paymentBalance",
            "0"
        );
    }


    /* =====================================================
       BOOKING / INVOICE CHANGE
       ===================================================== */

    function handleInvoiceChange() {

        const invoiceId =
            $("paymentInvoice")?.value ||
            "";


        if (!invoiceId) {
            return;
        }


        const invoice =
            findInvoice(
                invoiceId
            );


        if (!invoice) {
            return;
        }


        populatePaymentFromInvoice(
            invoice
        );
    }


    function handleBookingChange() {

        const bookingId =
            $("paymentBooking")?.value ||
            "";


        if (!bookingId) {
            return;
        }


        const booking =
            findBooking(
                bookingId
            );


        if (!booking) {
            return;
        }


        const total =
            getBookingTotal(
                booking
            );


        setInputValue(
            "paymentTotalAmount",
            total
        );


        setInputValue(
            "paymentPackage",
            booking.packageName ||
            booking.package ||
            ""
        );


        const received =
            getCustomerReceivedForBooking(
                bookingId
            );


        setInputValue(
            "paymentPreviouslyReceived",
            received
        );


        calculateCurrentBalance();
    }


    function populatePaymentFromInvoice(
        invoice
    ) {

        const total =
            getInvoiceTotal(
                invoice
            );


        setInputValue(
            "paymentTotalAmount",
            total
        );


        setInputValue(
            "paymentPackage",
            invoice.packageName ||
            invoice.package ||
            ""
        );


        const received =
            getCustomerReceivedForInvoice(
                invoice.id
            );


        setInputValue(
            "paymentPreviouslyReceived",
            received
        );


        calculateCurrentBalance();
    }


    /* =====================================================
       PREVIOUS PAYMENT CALCULATIONS
       ===================================================== */

    function getCustomerReceivedForInvoice(
        invoiceId
    ) {

        return state.payments
            .filter(
                payment =>
                    String(
                        payment.invoiceId ||
                        ""
                    ) ===
                    String(
                        invoiceId
                    ) &&
                    String(
                        payment.id
                    ) !==
                    String(
                        state.editingPaymentId ||
                        ""
                    )
            )
            .reduce(
                (
                    total,
                    payment
                ) =>
                    total +
                    toNumber(
                        payment.amount
                    ),
                0
            );
    }


    function getCustomerReceivedForBooking(
        bookingId
    ) {

        return state.payments
            .filter(
                payment =>
                    String(
                        payment.bookingId ||
                        ""
                    ) ===
                    String(
                        bookingId
                    ) &&
                    String(
                        payment.id
                    ) !==
                    String(
                        state.editingPaymentId ||
                        ""
                    )
            )
            .reduce(
                (
                    total,
                    payment
                ) =>
                    total +
                    toNumber(
                        payment.amount
                    ),
                0
            );
    }


    /* =====================================================
       BALANCE CALCULATION
       ===================================================== */

    function calculateCurrentBalance() {

        const total =
            toNumber(
                $("paymentTotalAmount")?.value
            );


        const previous =
            toNumber(
                $("paymentPreviouslyReceived")?.value
            );


        const current =
            toNumber(
                $("paymentAmount")?.value
            );


        const balance =
            Math.max(
                0,
                total -
                previous -
                current
            );


        setInputValue(
            "paymentBalance",
            balance.toFixed(2)
        );
    }


    /* =====================================================
       INPUT HELPERS
       ===================================================== */

    function setInputValue(
        id,
        value
    ) {

        const element =
            $(id);

        if (element) {
            element.value =
                value ?? "";
        }
    }


    /* =====================================================
       OPEN PAYMENT FORM
       ===================================================== */

    function openPaymentForm(
        payment = null
    ) {

        const section =
            $("paymentFormSection");

        if (!section) {
            return;
        }


        show(
            section
        );


        state.editingPaymentId =
            payment
                ? payment.id
                : null;


        const form =
            $("paymentForm");

        if (form) {
            form.reset();
        }


        setInputValue(
            "paymentId",
            payment?.id ||
            ""
        );


        if (payment) {

            populateFormForEdit(
                payment
            );

        } else {

            const today =
                new Date()
                    .toISOString()
                    .split("T")[0];

            setInputValue(
                "paymentDate",
                today
            );


            setInputValue(
                "paymentTotalAmount",
                "0"
            );

            setInputValue(
                "paymentPreviouslyReceived",
                "0"
            );

            setInputValue(
                "paymentBalance",
                "0"
            );
        }


        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }


    function closePaymentForm() {

        hide(
            $("paymentFormSection")
        );

        state.editingPaymentId =
            null;
    }


    /* =====================================================
       EDIT FORM
       ===================================================== */

    function populateFormForEdit(
        payment
    ) {

        const customerId =
            payment.customerId ||
            "";


        setInputValue(
            "paymentCustomer",
            customerId
        );


        populateBookingDropdown(
            customerId
        );

        populateInvoiceDropdown(
            customerId
        );


        setInputValue(
            "paymentBooking",
            payment.bookingId ||
            ""
        );


        setInputValue(
            "paymentInvoice",
            payment.invoiceId ||
            ""
        );


        setInputValue(
            "paymentPackage",
            payment.packageName ||
            ""
        );


        setInputValue(
            "paymentTotalAmount",
            payment.totalAmount ||
            0
        );


        setInputValue(
            "paymentPreviouslyReceived",
            getPreviousAmountForEdit(
                payment
            )
        );


        setInputValue(
            "paymentAmount",
            payment.amount ||
            0
        );


        setInputValue(
            "paymentBalance",
            payment.balance ||
            0
        );


        setInputValue(
            "paymentDate",
            dateInputValue(
                payment.paymentDate
            )
        );


        setInputValue(
            "paymentMethod",
            payment.paymentMethod ||
            ""
        );


        setInputValue(
            "paymentReference",
            payment.reference ||
            ""
        );


        setInputValue(
            "paymentReceivedBy",
            payment.receivedBy ||
            ""
        );


        setInputValue(
            "paymentNotes",
            payment.notes ||
            ""
        );
    }


    function getPreviousAmountForEdit(
        payment
    ) {

        const amount =
            toNumber(
                payment.amount
            );


        if (
            payment.invoiceId
        ) {

            return Math.max(
                0,
                getCustomerReceivedForInvoice(
                    payment.invoiceId
                )
            );
        }


        if (
            payment.bookingId
        ) {

            return Math.max(
                0,
                getCustomerReceivedForBooking(
                    payment.bookingId
                )
            );
        }


        return 0;
    }


    /* =====================================================
       COLLECT FORM DATA
       ===================================================== */

    function collectFormData() {

        const customerId =
            $("paymentCustomer")?.value ||
            "";


        const customer =
            findCustomer(
                customerId
            );


        const bookingId =
            $("paymentBooking")?.value ||
            "";


        const booking =
            findBooking(
                bookingId
            );


        const invoiceId =
            $("paymentInvoice")?.value ||
            "";


        const invoice =
            findInvoice(
                invoiceId
            );


        const totalAmount =
            toNumber(
                $("paymentTotalAmount")?.value
            );


        const amount =
            toNumber(
                $("paymentAmount")?.value
            );


        const previous =
            toNumber(
                $("paymentPreviouslyReceived")?.value
            );


        const balance =
            Math.max(
                0,
                totalAmount -
                previous -
                amount
            );


        const status =
            calculatePaymentStatus(
                totalAmount,
                previous +
                amount
            );


        return {

            customerId,

            customerName:
                customer
                    ? (
                        customer.name ||
                        customer.customerName ||
                        customer.fullName ||
                        ""
                    )
                    : "",

            customerMobile:
                customer
                    ? (
                        customer.mobile ||
                        customer.phone ||
                        ""
                    )
                    : "",

            bookingId,

            bookingNumber:
                booking
                    ? (
                        booking.bookingNumber ||
                        booking.bookingId ||
                        booking.id ||
                        ""
                    )
                    : "",

            invoiceId,

            invoiceNumber:
                invoice
                    ? (
                        invoice.invoiceNumber ||
                        invoice.invoiceId ||
                        invoice.id ||
                        ""
                    )
                    : "",

            packageName:
                $("paymentPackage")?.value ||
                "",

            totalAmount,

            previouslyReceived:
                previous,

            amount,

            balance,

            status,

            paymentDate:
                $("paymentDate")?.value ||
                "",

            paymentMethod:
                $("paymentMethod")?.value ||
                "",

            reference:
                $("paymentReference")?.value ||
                "",

            receivedBy:
                $("paymentReceivedBy")?.value ||
                "",

            notes:
                $("paymentNotes")?.value ||
                ""
        };
    }


    /* =====================================================
       VALIDATE PAYMENT
       ===================================================== */

    function validatePayment(
        data
    ) {

        if (
            !data.customerId
        ) {

            return {
                valid: false,
                message:
                    "Please select a customer."
            };
        }


        if (
            !data.amount ||
            data.amount <= 0
        ) {

            return {
                valid: false,
                message:
                    "Payment amount must be greater than zero."
            };
        }


        if (
            !data.paymentDate
        ) {

            return {
                valid: false,
                message:
                    "Please select payment date."
            };
        }


        if (
            !data.paymentMethod
        ) {

            return {
                valid: false,
                message:
                    "Please select payment method."
            };
        }


        if (
            data.totalAmount > 0 &&
            data.amount >
                (
                    data.totalAmount -
                    data.previouslyReceived
                ) +
                0.01
        ) {

            return {
                valid: false,
                message:
                    "Payment amount cannot be greater than the outstanding balance."
            };
        }


        return {
            valid: true
        };
    }


    /* =====================================================
       SAVE PAYMENT
       ===================================================== */

    async function savePayment(
        event
    ) {

        if (event) {
            event.preventDefault();
        }


        const data =
            collectFormData();


        const validation =
            validatePayment(
                data
            );


        if (
            !validation.valid
        ) {

            showError(
                validation.message
            );

            return;
        }


        const collection =
            paymentsCollection();

        if (!collection) {
            return;
        }


        try {

            const user =
                getCurrentUser();


            const now =
                new Date();


            if (
                state.editingPaymentId
            ) {

                const oldPayment =
                    state.payments.find(
                        item =>
                            item.id ===
                            state.editingPaymentId
                    );


                await collection
                    .doc(
                        state.editingPaymentId
                    )
                    .update({

                        ...data,

                        updatedAt:
                            now,

                        updatedBy:
                            user?.uid ||
                            null
                    });


                showSuccess(
                    "Payment updated successfully."
                );

            } else {

                const paymentNumber =
                    await generatePaymentNumber();


                await collection
                    .add({

                        ...data,

                        paymentNumber,

                        createdAt:
                            now,

                        updatedAt:
                            now,

                        createdBy:
                            user?.uid ||
                            null
                    });


                showSuccess(
                    "Payment recorded successfully."
                );
            }


            closePaymentForm();

            await refreshAll();

        } catch (error) {

            console.error(
                "Failed to save payment:",
                error
            );

            showError(
                "Unable to save payment."
            );
        }
    }


    /* =====================================================
       PAYMENT NUMBER
       ===================================================== */

    async function generatePaymentNumber() {

        const prefix =
            "PAY";

        const year =
            new Date()
                .getFullYear();


        const count =
            state.payments.length +
            1;


        return `${prefix}${year}${String(
            count
        ).padStart(
            5,
            "0"
        )}`;
    }


    /* =====================================================
       DELETE PAYMENT
       ===================================================== */

    async function deletePayment(
        paymentId
    ) {

        const payment =
            state.payments.find(
                item =>
                    item.id ===
                    paymentId
            );


        if (!payment) {
            return;
        }


        const confirmed =
            window.confirm(
                `Delete payment ${
                    payment.paymentNumber ||
                    payment.id
                }?\n\nThis action cannot be undone.`
            );


        if (!confirmed) {
            return;
        }


        const collection =
            paymentsCollection();

        if (!collection) {
            return;
        }


        try {

            await collection
                .doc(
                    paymentId
                )
                .delete();


            showSuccess(
                "Payment deleted successfully."
            );


            await refreshAll();

        } catch (error) {

            console.error(
                "Failed to delete payment:",
                error
            );

            showError(
                "Unable to delete payment."
            );
        }
    }


    /* =====================================================
       VIEW PAYMENT
       ===================================================== */

    function viewPayment(
        paymentId
    ) {

        const payment =
            state.payments.find(
                item =>
                    item.id ===
                    paymentId
            );


        if (!payment) {
            return;
        }


        state.selectedPaymentId =
            paymentId;


        const customerName =
            getCustomerName(
                payment
            );


        const content =
            $("paymentDetailsContent");

        if (!content) {
            return;
        }


        content.innerHTML = `

            <div
                class="payment-detail-grid"
            >

                <div>

                    <span>
                        Payment ID
                    </span>

                    <strong>
                        ${escapeHTML(
                            payment.paymentNumber ||
                            payment.id
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Payment Date
                    </span>

                    <strong>
                        ${formatDate(
                            payment.paymentDate
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Customer
                    </span>

                    <strong>
                        ${escapeHTML(
                            customerName
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Booking
                    </span>

                    <strong>
                        ${escapeHTML(
                            payment.bookingNumber ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Invoice
                    </span>

                    <strong>
                        ${escapeHTML(
                            payment.invoiceNumber ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Payment Method
                    </span>

                    <strong>
                        ${escapeHTML(
                            payment.paymentMethod ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Total Amount
                    </span>

                    <strong>
                        ${formatMoney(
                            payment.totalAmount
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Amount Received
                    </span>

                    <strong
                        class="payment-received-value"
                    >
                        ${formatMoney(
                            payment.amount
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Balance
                    </span>

                    <strong
                        class="payment-balance-value"
                    >
                        ${formatMoney(
                            payment.balance
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Reference
                    </span>

                    <strong>
                        ${escapeHTML(
                            payment.reference ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Received By
                    </span>

                    <strong>
                        ${escapeHTML(
                            payment.receivedBy ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Status
                    </span>

                    <strong>
                        ${escapeHTML(
                            getPaymentStatusLabel(
                                payment.status
                            )
                        )}
                    </strong>

                </div>

            </div>


            ${
                payment.notes
                    ? `

                        <div
                            class="payment-detail-notes"
                        >

                            <h3>
                                Notes
                            </h3>

                            <p>
                                ${escapeHTML(
                                    payment.notes
                                )}
                            </p>

                        </div>

                      `
                    : ""
            }

        `;


        show(
            $("paymentDetailsModal")
        );
    }


    /* =====================================================
       CLOSE PAYMENT MODAL
       ===================================================== */

    function closePaymentDetails() {

        hide(
            $("paymentDetailsModal")
        );

        state.selectedPaymentId =
            null;
    }


    /* =====================================================
       CUSTOMER PAYMENT DETAILS
       ===================================================== */

    function viewCustomerPayments(
        customerId
    ) {

        const customer =
            findCustomer(
                customerId
            );


        if (!customer) {
            return;
        }


        const payments =
            state.payments.filter(
                payment =>
                    String(
                        payment.customerId
                    ) ===
                    String(
                        customerId
                    )
            );


        const totalReceived =
            payments.reduce(
                (
                    total,
                    payment
                ) =>
                    total +
                    toNumber(
                        payment.amount
                    ),
                0
            );


        const invoices =
            state.invoices.filter(
                invoice =>
                    String(
                        invoice.customerId
                    ) ===
                    String(
                        customerId
                    )
            );


        const totalReceivable =
            invoices.reduce(
                (
                    total,
                    invoice
                ) =>
                    total +
                    getInvoiceTotal(
                        invoice
                    ),
                0
            );


        const balance =
            Math.max(
                0,
                totalReceivable -
                totalReceived
            );


        const customerName =
            customer.name ||
            customer.customerName ||
            customer.fullName ||
            "Customer";


        const content =
            $("paymentDetailsContent");

        if (!content) {
            return;
        }


        content.innerHTML = `

            <div
                class="customer-payment-detail"
            >

                <h3>
                    ${escapeHTML(
                        customerName
                    )}
                </h3>


                <div
                    class="customer-payment-summary"
                >

                    <div>

                        <span>
                            Total Receivable
                        </span>

                        <strong>
                            ${formatMoney(
                                totalReceivable
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Total Received
                        </span>

                        <strong>
                            ${formatMoney(
                                totalReceived
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Balance
                        </span>

                        <strong>
                            ${formatMoney(
                                balance
                            )}
                        </strong>

                    </div>

                </div>


                <h4>
                    Payment History
                </h4>


                ${
                    payments.length
                        ? `

                            <div
                                class="table-wrapper"
                            >

                                <table
                                    class="data-table"
                                >

                                    <thead>

                                        <tr>

                                            <th>
                                                Date
                                            </th>

                                            <th>
                                                Invoice
                                            </th>

                                            <th>
                                                Method
                                            </th>

                                            <th>
                                                Reference
                                            </th>

                                            <th>
                                                Amount
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        ${payments.map(
                                            payment => `

                                                <tr>

                                                    <td>
                                                        ${formatDate(
                                                            payment.paymentDate
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${escapeHTML(
                                                            payment.invoiceNumber ||
                                                            "-"
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${escapeHTML(
                                                            payment.paymentMethod ||
                                                            "-"
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${escapeHTML(
                                                            payment.reference ||
                                                            "-"
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatMoney(
                                                            payment.amount
                                                        )}
                                                    </td>

                                                </tr>

                                            `
                                        ).join("")}

                                    </tbody>

                                </table>

                            </div>

                          `
                        : `
                            <p>
                                No payment history found.
                            </p>
                          `
                }

            </div>

        `;


        show(
            $("paymentDetailsModal")
        );
    }


    /* =====================================================
       EVENTS
       ===================================================== */

    function bindEvents() {


        $("addPaymentBtn")
            ?.addEventListener(
                "click",
                () =>
                    openPaymentForm()
            );


        $("closePaymentFormBtn")
            ?.addEventListener(
                "click",
                closePaymentForm
            );


        $("cancelPaymentBtn")
            ?.addEventListener(
                "click",
                closePaymentForm
            );


        $("paymentForm")
            ?.addEventListener(
                "submit",
                savePayment
            );


        $("paymentCustomer")
            ?.addEventListener(
                "change",
                handleCustomerChange
            );


        $("paymentBooking")
            ?.addEventListener(
                "change",
                handleBookingChange
            );


        $("paymentInvoice")
            ?.addEventListener(
                "change",
                handleInvoiceChange
            );


        $("paymentAmount")
            ?.addEventListener(
                "input",
                calculateCurrentBalance
            );


        $("paymentSearch")
            ?.addEventListener(
                "input",
                renderAll
            );


        $("paymentStatusFilter")
            ?.addEventListener(
                "change",
                renderAll
            );


        $("paymentMethodFilter")
            ?.addEventListener(
                "change",
                renderAll
            );


        $("paymentFromDate")
            ?.addEventListener(
                "change",
                renderAll
            );


        $("paymentToDate")
            ?.addEventListener(
                "change",
                renderAll
            );


        $("clearPaymentFiltersBtn")
            ?.addEventListener(
                "click",
                clearFilters
            );


        $("refreshPaymentsBtn")
            ?.addEventListener(
                "click",
                refreshAll
            );


        $("closePaymentDetailsModal")
            ?.addEventListener(
                "click",
                closePaymentDetails
            );


        $("closePaymentDetailsBtn")
            ?.addEventListener(
                "click",
                closePaymentDetails
            );


        document.addEventListener(
            "click",
            handleActionClick
        );
    }


    function handleActionClick(
        event
    ) {

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


        switch (action) {

            case "view-payment":
                viewPayment(id);
                break;


            case "edit-payment": {

                const payment =
                    state.payments.find(
                        item =>
                            item.id ===
                            id
                    );

                if (payment) {
                    openPaymentForm(
                        payment
                    );
                }

                break;
            }


            case "delete-payment":
                deletePayment(id);
                break;


            case "customer-payment-details":
                viewCustomerPayments(id);
                break;

        }
    }


    /* =====================================================
       CLEAR FILTERS
       ===================================================== */

    function clearFilters() {

        setInputValue(
            "paymentSearch",
            ""
        );

        setInputValue(
            "paymentStatusFilter",
            ""
        );

        setInputValue(
            "paymentMethodFilter",
            ""
        );

        setInputValue(
            "paymentFromDate",
            ""
        );

        setInputValue(
            "paymentToDate",
            ""
        );


        renderAll();
    }


    /* =====================================================
       RENDER ALL
       ===================================================== */

    function renderAll() {

        renderPayments();

        renderCustomerMonitor();

        updateSummary();
    }


    /* =====================================================
       REFRESH
       ===================================================== */

    async function refreshAll() {

        await Promise.all([
            loadPayments(),
            loadCustomers(),
            loadBookings(),
            loadInvoices()
        ]);

        renderAll();
    }


    /* =====================================================
       LOADING
       ===================================================== */

    function setLoading(
        loading
    ) {

        state.loading =
            loading;

        const loader =
            $("paymentsLoading");

        if (loader) {

            loader.hidden =
                !loading;
        }
    }


    /* =====================================================
       NOTIFICATIONS
       ===================================================== */

    function showSuccess(
        message
    ) {

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


        console.log(
            message
        );
    }


    function showError(
        message
    ) {

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


        alert(
            message
        );
    }


    /* =====================================================
       INITIALIZATION
       ===================================================== */

    async function init() {

        bindEvents();

        await refreshAll();
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.PaymentsModule = {

        init,

        refresh:
            refreshAll,

        load:
            loadPayments,

        add:
            openPaymentForm,

        edit:
            openPaymentForm,

        view:
            viewPayment,

        delete:
            deletePayment,

        getPayments:
            () =>
                [...state.payments],

        getCustomerMonitor:
            getCustomerMonitorData,

        calculateBalance:
            calculateCurrentBalance
    };


    /* =====================================================
       AUTO INITIALIZE
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );

    } else {

        init();
    }

})();
