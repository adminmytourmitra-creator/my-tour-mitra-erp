/* =========================================================
   MY TOUR MITRA ERP
   DASHBOARD MODULE
   dashboard.js
   ========================================================= */


/* =========================================================
   1. DASHBOARD CONFIGURATION
   ========================================================= */

const DashboardModule = (() => {

    const CONFIG = {

        collections: {
            customers: "customers",
            enquiries: "enquiries",
            packages: "packages",
            quotations: "quotations",
            followups: "followups",
            bookings: "bookings",
            invoices: "invoices",
            payments: "payments",
            expenses: "expenses"
        },

        navigation: {
            customer: "customers",
            enquiry: "enquiries",
            package: "packages",
            quotation: "quotations",
            followup: "followups",
            booking: "bookings",
            invoice: "invoices",
            payment: "payments",
            expense: "expenses"
        }

    };


    /* =====================================================
       2. INTERNAL STATE
       ===================================================== */

    let state = {

        loaded: false,

        customers: [],
        enquiries: [],
        packages: [],
        quotations: [],
        followups: [],
        bookings: [],
        invoices: [],
        payments: [],
        expenses: []

    };


    /* =====================================================
       3. INITIALIZE DASHBOARD
       ===================================================== */

    async function init() {

        bindEvents();

        setLoading(true);

        try {

            await loadDashboardData();

            renderDashboard();

            state.loaded = true;

        } catch (error) {

            console.error(
                "Dashboard initialization error:",
                error
            );

            showDashboardError(error);

        } finally {

            setLoading(false);

        }

    }


    /* =====================================================
       4. EVENT BINDINGS
       ===================================================== */

    function bindEvents() {

        const refreshButton =
            document.getElementById(
                "dashboard-refresh-btn"
            );

        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                async () => {

                    await refresh();

                }
            );

        }


        /*
         * QUICK ACTIONS
         */

        document
            .querySelectorAll(
                "[data-dashboard-action]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const action =
                            button.dataset.dashboardAction;

                        navigateToModule(action);

                    }
                );

            });


        /*
         * NORMAL DASHBOARD NAVIGATION
         */

        document
            .querySelectorAll(
                "[data-dashboard-navigation]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const module =
                            button.dataset.dashboardNavigation;

                        navigateToModule(module);

                    }
                );

            });

    }


    /* =====================================================
       5. LOAD ALL DASHBOARD DATA
       ===================================================== */

    async function loadDashboardData() {

        /*
         * IMPORTANT:
         *
         * Firebase/Firestore connection may be loaded
         * by firebase.js.
         *
         * This function safely checks for Firebase before
         * attempting to read data.
         */

        const db = getFirestoreDatabase();

        if (!db) {

            console.warn(
                "Firestore database is not available yet."
            );

            clearState();

            return;

        }


        state.customers =
            await getCollectionData(
                db,
                CONFIG.collections.customers
            );


        state.enquiries =
            await getCollectionData(
                db,
                CONFIG.collections.enquiries
            );


        state.packages =
            await getCollectionData(
                db,
                CONFIG.collections.packages
            );


        state.quotations =
            await getCollectionData(
                db,
                CONFIG.collections.quotations
            );


        state.followups =
            await getCollectionData(
                db,
                CONFIG.collections.followups
            );


        state.bookings =
            await getCollectionData(
                db,
                CONFIG.collections.bookings
            );


        state.invoices =
            await getCollectionData(
                db,
                CONFIG.collections.invoices
            );


        state.payments =
            await getCollectionData(
                db,
                CONFIG.collections.payments
            );


        state.expenses =
            await getCollectionData(
                db,
                CONFIG.collections.expenses
            );

    }


    /* =====================================================
       6. GET FIRESTORE DATABASE
       ===================================================== */

    function getFirestoreDatabase() {

        /*
         * Support different possible Firebase setups.
         *
         * We will connect this to the final firebase.js
         * architecture.
         */

        if (
            typeof window !== "undefined" &&
            window.db
        ) {

            return window.db;

        }


        if (
            typeof window !== "undefined" &&
            window.firebaseDb
        ) {

            return window.firebaseDb;

        }


        return null;

    }


    /* =====================================================
       7. GET COLLECTION DATA
       ===================================================== */

    async function getCollectionData(
        db,
        collectionName
    ) {

        try {

            /*
             * Firebase modular SDK
             */

            if (
                typeof window !== "undefined" &&
                typeof window.getDocs === "function" &&
                typeof window.collection === "function"
            ) {

                const snapshot =
                    await window.getDocs(
                        window.collection(
                            db,
                            collectionName
                        )
                    );


                return snapshot.docs.map(
                    document => ({

                        id: document.id,

                        ...document.data()

                    })
                );

            }


            /*
             * Firebase compatibility SDK
             */

            if (
                db &&
                typeof db.collection === "function"
            ) {

                const snapshot =
                    await db
                        .collection(collectionName)
                        .get();


                return snapshot.docs.map(
                    document => ({

                        id: document.id,

                        ...document.data()

                    })
                );

            }


            console.warn(
                `Unable to read collection: ${collectionName}`
            );


            return [];

        } catch (error) {

            console.error(
                `Error loading ${collectionName}:`,
                error
            );

            return [];

        }

    }


    /* =====================================================
       8. CLEAR STATE
       ===================================================== */

    function clearState() {

        state.customers = [];
        state.enquiries = [];
        state.packages = [];
        state.quotations = [];
        state.followups = [];
        state.bookings = [];
        state.invoices = [];
        state.payments = [];
        state.expenses = [];

    }


    /* =====================================================
       9. RENDER DASHBOARD
       ===================================================== */

    function renderDashboard() {

        renderKPI();

        renderFinancialOverview();

        renderProfitLoss();

        renderFollowups();

        renderPendingPayments();

        renderRecentActivity();

        renderOperationsStatus();

    }


    /* =====================================================
       10. KPI CARDS
       ===================================================== */

    function renderKPI() {

        setText(
            "kpi-customers",
            state.customers.length
        );


        setText(
            "kpi-enquiries",
            state.enquiries.length
        );


        setText(
            "kpi-packages",
            state.packages.length
        );


        setText(
            "kpi-quotations",
            state.quotations.length
        );


        setText(
            "kpi-followups",
            getPendingFollowups().length
        );


        setText(
            "kpi-bookings",
            getConfirmedBookings().length
        );


        const receivables =
            calculateOutstandingAmount();


        setText(
            "kpi-receivables",
            formatCurrency(receivables)
        );


        const expenses =
            calculateTotalExpenses();


        setText(
            "kpi-expenses",
            formatCurrency(expenses)
        );

    }


    /* =====================================================
       11. FINANCIAL OVERVIEW
       ===================================================== */

    function renderFinancialOverview() {

        const invoiceValue =
            calculateInvoiceValue();


        const received =
            calculateReceivedPayments();


        const outstanding =
            Math.max(
                invoiceValue - received,
                0
            );


        setText(
            "financial-invoice-value",
            formatCurrency(invoiceValue)
        );


        setText(
            "financial-received",
            formatCurrency(received)
        );


        setText(
            "financial-outstanding",
            formatCurrency(outstanding)
        );

    }


    /* =====================================================
       12. PROFIT & LOSS
       ===================================================== */

    function renderProfitLoss() {

        const revenue =
            calculateReceivedPayments();


        const expenses =
            calculateTotalExpenses();


        const netProfit =
            revenue - expenses;


        setText(
            "profit-revenue",
            formatCurrency(revenue)
        );


        setText(
            "profit-expenses",
            formatCurrency(expenses)
        );


        setText(
            "profit-net",
            formatCurrency(netProfit)
        );

    }


    /* =====================================================
       13. FOLLOWUPS
       ===================================================== */

    function renderFollowups() {

        const container =
            document.getElementById(
                "dashboard-followups-list"
            );


        if (!container) {

            return;

        }


        const followups =
            getPendingFollowups()
                .sort(
                    sortByDateAscending
                )
                .slice(0, 5);


        if (!followups.length) {

            container.innerHTML = getEmptyState(
                "✓",
                "No pending follow-ups."
            );

            return;

        }


        container.innerHTML =
            followups
                .map(
                    followup =>
                        createFollowupItem(
                            followup
                        )
                )
                .join("");

    }


    /* =====================================================
       14. FOLLOWUP ITEM
       ===================================================== */

    function createFollowupItem(
        followup
    ) {

        const customerName =
            getCustomerName(
                followup
            );


        const date =
            getDateFromObject(
                followup,
                [
                    "followupDate",
                    "nextFollowupDate",
                    "date",
                    "nextDate"
                ]
            );


        const status =
            getDisplayValue(
                followup,
                [
                    "status"
                ],
                "Pending"
            );


        return `

            <div class="dashboard-list-item">

                <div class="dashboard-list-main">

                    <div class="dashboard-list-title">
                        ${escapeHTML(customerName)}
                    </div>

                    <div class="dashboard-list-subtitle">
                        ${escapeHTML(
                            date
                                ? formatDate(date)
                                : "Follow-up date not set"
                        )}
                    </div>

                </div>

                <span class="dashboard-list-status">
                    ${escapeHTML(status)}
                </span>

            </div>

        `;

    }


    /* =====================================================
       15. PENDING PAYMENTS
       ===================================================== */

    function renderPendingPayments() {

        const container =
            document.getElementById(
                "dashboard-payments-list"
            );


        if (!container) {

            return;

        }


        const paymentRows =
            getPendingPaymentRows()
                .slice(0, 5);


        if (!paymentRows.length) {

            container.innerHTML = getEmptyState(
                "₹",
                "No pending payments."
            );

            return;

        }


        container.innerHTML =
            paymentRows
                .map(
                    row =>
                        createPaymentItem(row)
                )
                .join("");

    }


    /* =====================================================
       16. PAYMENT ITEM
       ===================================================== */

    function createPaymentItem(
        row
    ) {

        return `

            <div class="dashboard-list-item">

                <div class="dashboard-list-main">

                    <div class="dashboard-list-title">
                        ${escapeHTML(row.customer)}
                    </div>

                    <div class="dashboard-list-subtitle">
                        ${escapeHTML(row.package)}
                    </div>

                </div>

                <div class="dashboard-list-value">
                    ${formatCurrency(row.balance)}
                </div>

            </div>

        `;

    }


    /* =====================================================
       17. RECENT ACTIVITY
       ===================================================== */

    function renderRecentActivity() {

        const container =
            document.getElementById(
                "dashboard-activity-list"
            );


        if (!container) {

            return;

        }


        const activities =
            buildRecentActivities()
                .slice(0, 10);


        if (!activities.length) {

            container.innerHTML = getEmptyState(
                "—",
                "No recent activity."
            );

            return;

        }


        container.innerHTML =
            activities
                .map(
                    activity =>
                        createActivityItem(
                            activity
                        )
                )
                .join("");

    }


    /* =====================================================
       18. ACTIVITY ITEM
       ===================================================== */

    function createActivityItem(
        activity
    ) {

        return `

            <div class="dashboard-activity-item">

                <div class="dashboard-activity-icon">
                    ${escapeHTML(activity.icon)}
                </div>

                <div class="dashboard-activity-content">

                    <div class="dashboard-activity-title">
                        ${escapeHTML(activity.title)}
                    </div>

                    <div class="dashboard-activity-description">
                        ${escapeHTML(activity.description)}
                    </div>

                </div>

                <div class="dashboard-activity-time">
                    ${escapeHTML(activity.time)}
                </div>

            </div>

        `;

    }


    /* =====================================================
       19. BUILD RECENT ACTIVITIES
       ===================================================== */

    function buildRecentActivities() {

        const activities = [];


        state.customers.forEach(
            customer => {

                activities.push({

                    type: "customer",

                    icon: "C",

                    title: "Customer Added",

                    description:
                        getCustomerName(customer),

                    date:
                        getDateFromObject(
                            customer,
                            [
                                "createdAt",
                                "createdDate",
                                "date"
                            ]
                        )

                });

            }
        );


        state.enquiries.forEach(
            enquiry => {

                activities.push({

                    type: "enquiry",

                    icon: "E",

                    title: "Enquiry Added",

                    description:
                        getCustomerName(enquiry),

                    date:
                        getDateFromObject(
                            enquiry,
                            [
                                "createdAt",
                                "createdDate",
                                "date"
                            ]
                        )

                });

            }
        );


        state.packages.forEach(
            packageData => {

                activities.push({

                    type: "package",

                    icon: "P",

                    title: "Package Created",

                    description:
                        getDisplayValue(
                            packageData,
                            [
                                "packageName",
                                "name",
                                "title"
                            ],
                            "Travel Package"
                        ),

                    date:
                        getDateFromObject(
                            packageData,
                            [
                                "createdAt",
                                "createdDate",
                                "date"
                            ]
                        )

                });

            }
        );


        state.bookings.forEach(
            booking => {

                activities.push({

                    type: "booking",

                    icon: "B",

                    title: "Booking Created",

                    description:
                        getCustomerName(booking),

                    date:
                        getDateFromObject(
                            booking,
                            [
                                "createdAt",
                                "createdDate",
                                "bookingDate",
                                "date"
                            ]
                        )

                });

            }
        );


        state.invoices.forEach(
            invoice => {

                activities.push({

                    type: "invoice",

                    icon: "I",

                    title: "Invoice Created",

                    description:
                        getCustomerName(invoice),

                    date:
                        getDateFromObject(
                            invoice,
                            [
                                "createdAt",
                                "createdDate",
                                "invoiceDate",
                                "date"
                            ]
                        )

                });

            }
        );


        return activities
            .sort(
                (a, b) => {

                    const dateA =
                        a.date
                            ? a.date.getTime()
                            : 0;

                    const dateB =
                        b.date
                            ? b.date.getTime()
                            : 0;

                    return dateB - dateA;

                }
            )
            .map(
                activity => ({

                    ...activity,

                    time:
                        activity.date
                            ? formatRelativeTime(
                                activity.date
                            )
                            : "—"

                })
            );

    }


    /* =====================================================
       20. OPERATIONS STATUS
       ===================================================== */

    function renderOperationsStatus() {

        const newEnquiries =
            getNewEnquiries();


        const sentQuotations =
            getSentQuotations();


        const todayFollowups =
            getTodayFollowups();


        const upcomingBookings =
            getUpcomingBookings();


        const receivables =
            calculateOutstandingAmount();


        const expenses =
            calculateTotalExpenses();


        setText(
            "status-new-enquiries",
            newEnquiries.length
        );


        setText(
            "status-sent-quotations",
            sentQuotations.length
        );


        setText(
            "status-today-followups",
            todayFollowups.length
        );


        setText(
            "status-upcoming-bookings",
            upcomingBookings.length
        );


        setText(
            "status-pending-receivables",
            formatCurrency(receivables)
        );


        setText(
            "status-pending-expenses",
            formatCurrency(expenses)
        );

    }


    /* =====================================================
       21. NEW ENQUIRIES
       ===================================================== */

    function getNewEnquiries() {

        return state.enquiries.filter(
            enquiry => {

                const status =
                    normalize(
                        getDisplayValue(
                            enquiry,
                            ["status"],
                            ""
                        )
                    );


                return (
                    status === "new" ||
                    status === "pending" ||
                    status === "open" ||
                    status === ""
                );

            }
        );

    }


    /* =====================================================
       22. SENT QUOTATIONS
       ===================================================== */

    function getSentQuotations() {

        return state.quotations.filter(
            quotation => {

                const status =
                    normalize(
                        getDisplayValue(
                            quotation,
                            ["status"],
                            ""
                        )
                    );


                return (
                    status === "sent" ||
                    status === "quotation sent" ||
                    status === "pending"
                );

            }
        );

    }


    /* =====================================================
       23. PENDING FOLLOWUPS
       ===================================================== */

    function getPendingFollowups() {

        return state.followups.filter(
            followup => {

                const status =
                    normalize(
                        getDisplayValue(
                            followup,
                            ["status"],
                            "pending"
                        )
                    );


                return (
                    status !== "completed" &&
                    status !== "closed" &&
                    status !== "cancelled"
                );

            }
        );

    }


    /* =====================================================
       24. TODAY FOLLOWUPS
       ===================================================== */

    function getTodayFollowups() {

        const today =
            startOfDay(
                new Date()
            );


        return getPendingFollowups()
            .filter(
                followup => {

                    const date =
                        getDateFromObject(
                            followup,
                            [
                                "followupDate",
                                "nextFollowupDate",
                                "date"
                            ]
                        );


                    if (!date) {

                        return false;

                    }


                    return (
                        startOfDay(date).getTime() ===
                        today.getTime()
                    );

                }
            );

    }


    /* =====================================================
       25. CONFIRMED BOOKINGS
       ===================================================== */

    function getConfirmedBookings() {

        return state.bookings.filter(
            booking => {

                const status =
                    normalize(
                        getDisplayValue(
                            booking,
                            ["status"],
                            "confirmed"
                        )
                    );


                return (
                    status === "confirmed" ||
                    status === "booked" ||
                    status === "active"
                );

            }
        );

    }


    /* =====================================================
       26. UPCOMING BOOKINGS
       ===================================================== */

    function getUpcomingBookings() {

        const today =
            startOfDay(
                new Date()
            );


        return getConfirmedBookings()
            .filter(
                booking => {

                    const date =
                        getDateFromObject(
                            booking,
                            [
                                "travelDate",
                                "startDate",
                                "tourStartDate",
                                "bookingDate",
                                "date"
                            ]
                        );


                    if (!date) {

                        return true;

                    }


                    return (
                        startOfDay(date) >= today
                    );

                }
            );

    }


    /* =====================================================
       27. INVOICE VALUE
       ===================================================== */

    function calculateInvoiceValue() {

        return state.invoices.reduce(
            (total, invoice) => {

                const amount =
                    getNumericValue(
                        invoice,
                        [
                            "grandTotal",
                            "totalAmount",
                            "invoiceAmount",
                            "total",
                            "amount"
                        ]
                    );


                return total + amount;

            },
            0
        );

    }


    /* =====================================================
       28. PAYMENT TOTAL
       ===================================================== */

    function calculateReceivedPayments() {

        return state.payments.reduce(
            (total, payment) => {

                const amount =
                    getNumericValue(
                        payment,
                        [
                            "amount",
                            "paymentAmount",
                            "receivedAmount",
                            "paidAmount",
                            "total"
                        ]
                    );


                return total + amount;

            },
            0
        );

    }


    /* =====================================================
       29. EXPENSE TOTAL
       ===================================================== */

    function calculateTotalExpenses() {

        return state.expenses.reduce(
            (total, expense) => {

                const amount =
                    getNumericValue(
                        expense,
                        [
                            "amount",
                            "expenseAmount",
                            "paidAmount",
                            "total"
                        ]
                    );


                return total + amount;

            },
            0
        );

    }


    /* =====================================================
       30. OUTSTANDING AMOUNT
       ===================================================== */

    function calculateOutstandingAmount() {

        const invoiceValue =
            calculateInvoiceValue();


        const received =
            calculateReceivedPayments();


        return Math.max(
            invoiceValue - received,
            0
        );

    }


    /* =====================================================
       31. PAYMENT ROWS
       ===================================================== */

    function getPendingPaymentRows() {

        const invoiceMap =
            new Map();


        state.invoices.forEach(
            invoice => {

                const customer =
                    getCustomerName(
                        invoice
                    );


                const packageName =
                    getDisplayValue(
                        invoice,
                        [
                            "packageName",
                            "package",
                            "tourName",
                            "packageTitle"
                        ],
                        "Package"
                    );


                const invoiceAmount =
                    getNumericValue(
                        invoice,
                        [
                            "grandTotal",
                            "totalAmount",
                            "invoiceAmount",
                            "total",
                            "amount"
                        ]
                    );


                if (
                    invoiceAmount <= 0
                ) {

                    return;

                }


                const key =
                    getRecordKey(
                        invoice,
                        customer,
                        packageName
                    );


                if (!invoiceMap.has(key)) {

                    invoiceMap.set(
                        key,
                        {

                            customer,

                            package: packageName,

                            invoiceAmount,

                            paid: 0

                        }
                    );

                }

            }
        );


        state.payments.forEach(
            payment => {

                const customer =
                    getCustomerName(
                        payment
                    );


                const packageName =
                    getDisplayValue(
                        payment,
                        [
                            "packageName",
                            "package",
                            "tourName",
                            "packageTitle"
                        ],
                        ""
                    );


                const paid =
                    getNumericValue(
                        payment,
                        [
                            "amount",
                            "paymentAmount",
                            "receivedAmount",
                            "paidAmount",
                            "total"
                        ]
                    );


                /*
                 * First try invoice ID.
                 */

                const invoiceId =
                    getDisplayValue(
                        payment,
                        [
                            "invoiceId",
                            "invoiceID"
                        ],
                        ""
                    );


                let matchingEntry = null;


                if (
                    invoiceId &&
                    invoiceMap.has(invoiceId)
                ) {

                    matchingEntry =
                        invoiceMap.get(
                            invoiceId
                        );

                }


                /*
                 * Otherwise try customer/package.
                 */

                if (!matchingEntry) {

                    for (
                        const entry
                        of invoiceMap.values()
                    ) {

                        if (
                            customer &&
                            normalize(
                                entry.customer
                            ) ===
                            normalize(
                                customer
                            )
                        ) {

                            if (
                                !packageName ||
                                normalize(
                                    entry.package
                                ) ===
                                normalize(
                                    packageName
                                )
                            ) {

                                matchingEntry =
                                    entry;

                                break;

                            }

                        }

                    }

                }


                if (matchingEntry) {

                    matchingEntry.paid += paid;

                }

            }
        );


        return Array
            .from(
                invoiceMap.values()
            )
            .map(
                entry => ({

                    ...entry,

                    balance:
                        Math.max(
                            entry.invoiceAmount -
                            entry.paid,
                            0
                        )

                })
            )
            .filter(
                entry =>
                    entry.balance > 0
            )
            .sort(
                (a, b) =>
                    b.balance - a.balance
            );

    }


    /* =====================================================
       32. CUSTOMER NAME HELPER
       ===================================================== */

    function getCustomerName(
        record
    ) {

        return getDisplayValue(
            record,
            [
                "customerName",
                "clientName",
                "customer",
                "client",
                "name",
                "fullName"
            ],
            "Customer"
        );

    }


    /* =====================================================
       33. RECORD KEY
       ===================================================== */

    function getRecordKey(
        record,
        customer,
        packageName
    ) {

        const id =
            getDisplayValue(
                record,
                [
                    "invoiceId",
                    "invoiceID",
                    "id"
                ],
                ""
            );


        if (id) {

            return id;

        }


        return `${customer}|${packageName}`;

    }


    /* =====================================================
       34. GENERIC DISPLAY VALUE
       ===================================================== */

    function getDisplayValue(
        record,
        keys,
        fallback = ""
    ) {

        if (
            !record ||
            typeof record !== "object"
        ) {

            return fallback;

        }


        for (
            const key
            of keys
        ) {

            if (
                record[key] !== undefined &&
                record[key] !== null &&
                String(record[key]).trim() !== ""
            ) {

                return String(
                    record[key]
                );

            }

        }


        return fallback;

    }


    /* =====================================================
       35. NUMERIC VALUE
       ===================================================== */

    function getNumericValue(
        record,
        keys
    ) {

        const value =
            getDisplayValue(
                record,
                keys,
                0
            );


        if (
            typeof value === "number"
        ) {

            return Number.isFinite(value)
                ? value
                : 0;

        }


        const cleaned =
            String(value)
                .replace(/₹/g, "")
                .replace(/,/g, "")
                .replace(/[^\d.-]/g, "");


        const number =
            parseFloat(cleaned);


        return Number.isFinite(number)
            ? number
            : 0;

    }


    /* =====================================================
       36. DATE HELPER
       ===================================================== */

    function getDateFromObject(
        record,
        keys
    ) {

        if (
            !record ||
            typeof record !== "object"
        ) {

            return null;

        }


        for (
            const key
            of keys
        ) {

            const value =
                record[key];


            if (!value) {

                continue;

            }


            const date =
                parseDate(value);


            if (date) {

                return date;

            }

        }


        return null;

    }


    /* =====================================================
       37. PARSE DATE
       ===================================================== */

    function parseDate(
        value
    ) {

        if (
            value instanceof Date
        ) {

            return isNaN(
                value.getTime()
            )
                ? null
                : value;

        }


        /*
         * Firestore Timestamp
         */

        if (
            value &&
            typeof value.toDate === "function"
        ) {

            const date =
                value.toDate();


            return isNaN(
                date.getTime()
            )
                ? null
                : date;

        }


        /*
         * Firestore serialized timestamp
         */

        if (
            value &&
            typeof value === "object" &&
            value.seconds !== undefined
        ) {

            const date =
                new Date(
                    Number(value.seconds) * 1000
                );


            return isNaN(
                date.getTime()
            )
                ? null
                : date;

        }


        const date =
            new Date(value);


        return isNaN(
            date.getTime()
        )
            ? null
            : date;

    }


    /* =====================================================
       38. SORT BY DATE
       ===================================================== */

    function sortByDateAscending(
        a,
        b
    ) {

        const dateA =
            getDateFromObject(
                a,
                [
                    "followupDate",
                    "nextFollowupDate",
                    "date"
                ]
            );


        const dateB =
            getDateFromObject(
                b,
                [
                    "followupDate",
                    "nextFollowupDate",
                    "date"
                ]
            );


        return (
            (dateA
                ? dateA.getTime()
                : Infinity) -
            (dateB
                ? dateB.getTime()
                : Infinity)
        );

    }


    /* =====================================================
       39. START OF DAY
       ===================================================== */

    function startOfDay(
        date
    ) {

        const result =
            new Date(date);


        result.setHours(
            0,
            0,
            0,
            0
        );


        return result;

    }


    /* =====================================================
       40. FORMAT CURRENCY
       ===================================================== */

    function formatCurrency(
        amount
    ) {

        const number =
            Number(amount) || 0;


        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0
            }
        ).format(number);

    }


    /* =====================================================
       41. FORMAT DATE
       ===================================================== */

    function formatDate(
        date
    ) {

        return new Intl.DateTimeFormat(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        ).format(date);

    }


    /* =====================================================
       42. RELATIVE TIME
       ===================================================== */

    function formatRelativeTime(
        date
    ) {

        const now =
            new Date();


        const difference =
            now.getTime() -
            date.getTime();


        const minutes =
            Math.floor(
                difference /
                (1000 * 60)
            );


        if (minutes < 1) {

            return "Just now";

        }


        if (minutes < 60) {

            return `${minutes}m ago`;

        }


        const hours =
            Math.floor(
                minutes / 60
            );


        if (hours < 24) {

            return `${hours}h ago`;

        }


        const days =
            Math.floor(
                hours / 24
            );


        if (days < 7) {

            return `${days}d ago`;

        }


        return formatDate(date);

    }


    /* =====================================================
       43. NORMALIZE STRING
       ===================================================== */

    function normalize(
        value
    ) {

        return String(
            value || ""
        )
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

    }


    /* =====================================================
       44. SET TEXT
       ===================================================== */

    function setText(
        elementId,
        value
    ) {

        const element =
            document.getElementById(
                elementId
            );


        if (!element) {

            return;

        }


        element.textContent =
            value;

    }


    /* =====================================================
       45. EMPTY STATE
       ===================================================== */

    function getEmptyState(
        icon,
        message
    ) {

        return `

            <div class="dashboard-empty">

                <span class="dashboard-empty-icon">
                    ${escapeHTML(icon)}
                </span>

                <p>
                    ${escapeHTML(message)}
                </p>

            </div>

        `;

    }


    /* =====================================================
       46. ESCAPE HTML
       ===================================================== */

    function escapeHTML(
        value
    ) {

        return String(
            value ?? ""
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


    /* =====================================================
       47. NAVIGATION
       ===================================================== */

    function navigateToModule(
        moduleName
    ) {

        const target =
            CONFIG.navigation[
                moduleName
            ] ||
            moduleName;


        if (!target) {

            return;

        }


        /*
         * First try the existing ERP navigation system.
         */

        if (
            typeof window.navigateToModule ===
            "function"
        ) {

            window.navigateToModule(
                target
            );

            return;

        }


        if (
            typeof window.loadModule ===
            "function"
        ) {

            window.loadModule(
                target
            );

            return;

        }


        /*
         * Fallback event.
         */

        document.dispatchEvent(
            new CustomEvent(
                "erp:navigate",
                {
                    detail: {
                        module: target
                    }
                }
            )
        );

    }


    /* =====================================================
       48. REFRESH
       ===================================================== */

    async function refresh() {

        setLoading(true);

        try {

            await loadDashboardData();

            renderDashboard();

        } catch (error) {

            console.error(
                "Dashboard refresh error:",
                error
            );

            showDashboardError(error);

        } finally {

            setLoading(false);

        }

    }


    /* =====================================================
       49. LOADING STATE
       ===================================================== */

    function setLoading(
        loading
    ) {

        const loader =
            document.getElementById(
                "dashboard-loading"
            );


        if (!loader) {

            return;

        }


        if (loading) {

            loader.classList.remove(
                "hidden"
            );

            loader.setAttribute(
                "aria-hidden",
                "false"
            );

        } else {

            loader.classList.add(
                "hidden"
            );

            loader.setAttribute(
                "aria-hidden",
                "true"
            );

        }

    }


    /* =====================================================
       50. ERROR MESSAGE
       ===================================================== */

    function showDashboardError(
        error
    ) {

        console.error(
            error
        );


        /*
         * Do not destroy the whole dashboard if one
         * Firestore collection has an issue.
         *
         * Existing values remain visible.
         */

    }


    /* =====================================================
       51. PUBLIC API
       ===================================================== */

    return {

        init,

        refresh,

        getState: () => ({
            ...state
        }),

        getConfig: () => ({
            ...CONFIG
        })

    };

})();


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.DashboardModule =
    DashboardModule;


/* =========================================================
   AUTO INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * If dashboard is already present when this script
         * loads, initialize it.
         */

        if (
            document.getElementById(
                "dashboard-page"
            )
        ) {

            DashboardModule.init();

        }

    }
);
