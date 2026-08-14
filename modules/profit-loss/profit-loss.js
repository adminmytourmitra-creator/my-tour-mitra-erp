/* =========================================================
   MY TOUR MITRA ERP
   PROFIT & LOSS MODULE
   File: modules/profit-loss/profit-loss.js
   ========================================================= */

(function () {
    "use strict";

    const state = {
        payments: [],
        expenses: [],
        fromDate: "",
        toDate: "",
        loading: false
    };


    /* =====================================================
       HELPERS
       ===================================================== */

    function $(id) {
        return document.getElementById(id);
    }


    function getDB() {

        if (window.db) {
            return window.db;
        }

        if (
            window.firebase &&
            typeof window.firebase.firestore === "function"
        ) {
            return window.firebase.firestore();
        }

        console.error("Firestore database not found.");
        return null;
    }


    function getCollection(name) {

        const db = getDB();

        if (!db) {
            return null;
        }

        return db.collection(name);
    }


    function toNumber(value) {

        const number = Number(value);

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
        ).format(toNumber(value));
    }


    function formatPercent(value) {

        return `${toNumber(value).toFixed(2)}%`;
    }


    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function getDateValue(value) {

        if (!value) {
            return null;
        }

        if (
            value &&
            typeof value.toDate === "function"
        ) {
            return value.toDate();
        }

        if (
            value &&
            typeof value.toDate === "function"
        ) {
            return value.toDate();
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return date;
    }


    function dateInputValue(value) {

        const date = getDateValue(value);

        if (!date) {
            return "";
        }

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }


    function formatDate(value) {

        const date = getDateValue(value);

        if (!date) {
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


    function formatMonth(date) {

        return date.toLocaleDateString(
            "en-IN",
            {
                month: "short",
                year: "numeric"
            }
        );
    }


    function startOfMonth(date) {

        return new Date(
            date.getFullYear(),
            date.getMonth(),
            1
        );
    }


    function endOfMonth(date) {

        return new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0
        );
    }


    function todayString() {

        return new Date()
            .toISOString()
            .split("T")[0];
    }


    /* =====================================================
       PAYMENT DATE / AMOUNT NORMALIZATION
       ===================================================== */

    function getPaymentDate(payment) {

        return (
            payment.paymentDate ||
            payment.receivedDate ||
            payment.date ||
            payment.createdAt ||
            null
        );
    }


    function getPaymentAmount(payment) {

        return toNumber(
            payment.amount ??
            payment.paymentAmount ??
            payment.paidAmount ??
            payment.receivedAmount ??
            0
        );
    }


    function getExpenseDate(expense) {

        return (
            expense.expenseDate ||
            expense.date ||
            expense.createdAt ||
            null
        );
    }


    function getExpenseAmount(expense) {

        return toNumber(
            expense.amount ??
            expense.expenseAmount ??
            0
        );
    }


    /* =====================================================
       LOAD PAYMENTS
       ===================================================== */

    async function loadPayments() {

        const collection =
            getCollection("payments");

        if (!collection) {
            return;
        }


        try {

            const snapshot =
                await collection.get();


            state.payments =
                snapshot.docs.map(
                    doc => ({
                        id: doc.id,
                        ...doc.data()
                    })
                );

        } catch (error) {

            console.error(
                "Failed to load payments:",
                error
            );

            state.payments = [];
        }
    }


    /* =====================================================
       LOAD EXPENSES
       ===================================================== */

    async function loadExpenses() {

        const collection =
            getCollection("expenses");

        if (!collection) {
            return;
        }


        try {

            const snapshot =
                await collection.get();


            state.expenses =
                snapshot.docs.map(
                    doc => ({
                        id: doc.id,
                        ...doc.data()
                    })
                );

        } catch (error) {

            console.error(
                "Failed to load expenses:",
                error
            );

            state.expenses = [];
        }
    }


    /* =====================================================
       DATE RANGE
       ===================================================== */

    function setDefaultDateRange() {

        const now = new Date();

        const firstDay =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );


        state.fromDate =
            dateInputValue(firstDay);

        state.toDate =
            dateInputValue(now);


        setValue(
            "profitLossFromDate",
            state.fromDate
        );

        setValue(
            "profitLossToDate",
            state.toDate
        );
    }


    function setValue(id, value) {

        const element = $(id);

        if (element) {
            element.value = value ?? "";
        }
    }


    function setText(id, value) {

        const element = $(id);

        if (element) {
            element.textContent =
                value ?? "";
        }
    }


    /* =====================================================
       FILTER RECORDS BY DATE
       ===================================================== */

    function isDateInRange(
        value,
        fromDate,
        toDate
    ) {

        const date =
            getDateValue(value);

        if (!date) {
            return false;
        }


        const dateString =
            dateInputValue(date);


        if (
            fromDate &&
            dateString < fromDate
        ) {
            return false;
        }


        if (
            toDate &&
            dateString > toDate
        ) {
            return false;
        }


        return true;
    }


    function getFilteredPayments() {

        return state.payments.filter(
            payment =>
                isDateInRange(
                    getPaymentDate(payment),
                    state.fromDate,
                    state.toDate
                )
        );
    }


    function getFilteredExpenses() {

        return state.expenses.filter(
            expense =>
                isDateInRange(
                    getExpenseDate(expense),
                    state.fromDate,
                    state.toDate
                )
        );
    }


    /* =====================================================
       REVENUE
       ===================================================== */

    function calculateRevenue() {

        const payments =
            getFilteredPayments();


        return payments.reduce(
            (total, payment) => {

                /*
                 * Cancelled / reversed payments
                 * should not be counted as revenue.
                 */

                const status =
                    String(
                        payment.status ||
                        ""
                    ).toLowerCase();


                if (
                    status === "cancelled" ||
                    status === "canceled" ||
                    status === "reversed" ||
                    status === "failed"
                ) {
                    return total;
                }


                return (
                    total +
                    getPaymentAmount(payment)
                );
            },
            0
        );
    }


    /* =====================================================
       EXPENSES
       ===================================================== */

    function calculateExpenses() {

        const expenses =
            getFilteredExpenses();


        return expenses.reduce(
            (total, expense) => {

                const status =
                    String(
                        expense.status ||
                        ""
                    ).toLowerCase();


                /*
                 * Cancelled expenses are excluded.
                 */

                if (
                    status === "cancelled" ||
                    status === "canceled"
                ) {
                    return total;
                }


                return (
                    total +
                    getExpenseAmount(expense)
                );
            },
            0
        );
    }


    /* =====================================================
       PROFIT CALCULATION
       ===================================================== */

    function calculateProfitData() {

        const revenue =
            calculateRevenue();


        const expenses =
            calculateExpenses();


        const netProfit =
            revenue -
            expenses;


        const profitMargin =
            revenue > 0
                ? (
                    netProfit /
                    revenue
                ) * 100
                : 0;


        return {
            revenue,
            expenses,
            netProfit,
            profitMargin
        };
    }


    /* =====================================================
       SUMMARY CARDS
       ===================================================== */

    function renderSummary() {

        const data =
            calculateProfitData();


        setText(
            "plTotalRevenue",
            formatMoney(
                data.revenue
            )
        );


        setText(
            "plTotalExpenses",
            formatMoney(
                data.expenses
            )
        );


        setText(
            "plNetProfit",
            formatMoney(
                data.netProfit
            )
        );


        setText(
            "plProfitMargin",
            formatPercent(
                data.profitMargin
            )
        );


        const status =
            $("plProfitStatus");


        if (status) {

            if (data.netProfit > 0) {

                status.textContent =
                    "Business is profitable";

            } else if (
                data.netProfit < 0
            ) {

                status.textContent =
                    "Business is running at a loss";

            } else {

                status.textContent =
                    "Break-even";
            }
        }


        setText(
            "plRevenueSectionTotal",
            formatMoney(
                data.revenue
            )
        );


        setText(
            "plExpenseSectionTotal",
            formatMoney(
                data.expenses
            )
        );


        setText(
            "plStatementNetProfit",
            formatMoney(
                data.netProfit
            )
        );
    }


    /* =====================================================
       REVENUE ITEMS
       ===================================================== */

    function renderRevenueItems() {

        const container =
            $("plRevenueItems");

        if (!container) {
            return;
        }


        const payments =
            getFilteredPayments();


        if (!payments.length) {

            container.innerHTML = `

                <div class="pl-line-item">

                    <span>
                        No payments received
                    </span>

                    <strong>
                        ₹0.00
                    </strong>

                </div>

            `;

            return;
        }


        const grouped = {};


        payments.forEach(
            payment => {

                const source =
                    payment.paymentFor ||
                    payment.type ||
                    payment.source ||
                    "Tour / Booking Payments";


                const status =
                    String(
                        payment.status ||
                        ""
                    ).toLowerCase();


                if (
                    status === "cancelled" ||
                    status === "canceled" ||
                    status === "reversed" ||
                    status === "failed"
                ) {
                    return;
                }


                if (!grouped[source]) {
                    grouped[source] = 0;
                }


                grouped[source] +=
                    getPaymentAmount(
                        payment
                    );
            }
        );


        const keys =
            Object.keys(grouped);


        if (!keys.length) {

            container.innerHTML = `

                <div class="pl-line-item">

                    <span>
                        No revenue
                    </span>

                    <strong>
                        ₹0.00
                    </strong>

                </div>

            `;

            return;
        }


        container.innerHTML =
            keys.map(
                key => `

                    <div
                        class="pl-line-item"
                    >

                        <span>
                            ${escapeHTML(key)}
                        </span>

                        <strong>
                            ${formatMoney(
                                grouped[key]
                            )}
                        </strong>

                    </div>

                `
            ).join("");
    }


    /* =====================================================
       EXPENSE CATEGORY BREAKDOWN
       ===================================================== */

    function getExpenseBreakdown() {

        const expenses =
            getFilteredExpenses();


        const categories = {};


        expenses.forEach(
            expense => {

                const status =
                    String(
                        expense.status ||
                        ""
                    ).toLowerCase();


                if (
                    status === "cancelled" ||
                    status === "canceled"
                ) {
                    return;
                }


                const category =
                    expense.category ||
                    "Uncategorized";


                if (!categories[category]) {

                    categories[category] = {

                        amount: 0,

                        transactions: 0
                    };
                }


                categories[category]
                    .amount +=
                    getExpenseAmount(
                        expense
                    );


                categories[category]
                    .transactions += 1;
            }
        );


        return categories;
    }


    function renderExpenseItems() {

        const container =
            $("plExpenseItems");

        if (!container) {
            return;
        }


        const breakdown =
            getExpenseBreakdown();


        const keys =
            Object.keys(
                breakdown
            );


        if (!keys.length) {

            container.innerHTML = `

                <div
                    class="pl-line-item"
                >

                    <span>
                        No expenses
                    </span>

                    <strong>
                        ₹0.00
                    </strong>

                </div>

            `;

            return;
        }


        keys.sort(
            (a, b) =>
                breakdown[b].amount -
                breakdown[a].amount
        );


        container.innerHTML =
            keys.map(
                key => `

                    <div
                        class="pl-line-item"
                    >

                        <span>
                            ${escapeHTML(key)}
                        </span>

                        <strong>
                            ${formatMoney(
                                breakdown[key]
                                    .amount
                            )}
                        </strong>

                    </div>

                `
            ).join("");
    }


    function renderExpenseBreakdown() {

        const tbody =
            $("plExpenseBreakdownBody");

        if (!tbody) {
            return;
        }


        const breakdown =
            getExpenseBreakdown();


        const total =
            Object.values(
                breakdown
            ).reduce(
                (sum, item) =>
                    sum + item.amount,
                0
            );


        const keys =
            Object.keys(
                breakdown
            );


        if (!keys.length) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        class="empty-state"
                    >
                        No expense data available.
                    </td>

                </tr>

            `;

            setText(
                "plExpenseTransactionTotal",
                "0"
            );

            setText(
                "plExpenseBreakdownTotal",
                formatMoney(0)
            );

            return;
        }


        keys.sort(
            (a, b) =>
                breakdown[b].amount -
                breakdown[a].amount
        );


        let transactionTotal = 0;


        tbody.innerHTML =
            keys.map(
                category => {

                    const item =
                        breakdown[
                            category
                        ];


                    transactionTotal +=
                        item.transactions;


                    const percentage =
                        total > 0
                            ? (
                                item.amount /
                                total
                            ) * 100
                            : 0;


                    return `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    category
                                )}
                            </td>

                            <td>
                                ${item.transactions}
                            </td>

                            <td>
                                <strong>
                                    ${formatMoney(
                                        item.amount
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${formatPercent(
                                    percentage
                                )}
                            </td>

                        </tr>

                    `;
                }
            ).join("");


        setText(
            "plExpenseTransactionTotal",
            transactionTotal
        );


        setText(
            "plExpenseBreakdownTotal",
            formatMoney(total)
        );
    }


    /* =====================================================
       MONTHLY PERFORMANCE
       ===================================================== */

    function getMonthKey(date) {

        return [
            date.getFullYear(),
            String(
                date.getMonth() + 1
            ).padStart(2, "0")
        ].join("-");
    }


    function createMonthlyBuckets() {

        const buckets = {};


        const from =
            state.fromDate
                ? new Date(
                    `${state.fromDate}T00:00:00`
                )
                : new Date();


        const to =
            state.toDate
                ? new Date(
                    `${state.toDate}T00:00:00`
                )
                : new Date();


        let cursor =
            startOfMonth(from);


        const lastMonth =
            startOfMonth(to);


        while (
            cursor <=
            lastMonth
        ) {

            const key =
                getMonthKey(cursor);


            buckets[key] = {

                date:
                    new Date(cursor),

                revenue: 0,

                expenses: 0
            };


            cursor =
                new Date(
                    cursor.getFullYear(),
                    cursor.getMonth() + 1,
                    1
                );
        }


        return buckets;
    }


    function renderMonthlyPerformance() {

        const tbody =
            $("plMonthlyPerformanceBody");

        if (!tbody) {
            return;
        }


        const buckets =
            createMonthlyBuckets();


        getFilteredPayments()
            .forEach(
                payment => {

                    const date =
                        getDateValue(
                            getPaymentDate(
                                payment
                            )
                        );


                    if (!date) {
                        return;
                    }


                    const status =
                        String(
                            payment.status ||
                            ""
                        ).toLowerCase();


                    if (
                        status === "cancelled" ||
                        status === "canceled" ||
                        status === "reversed" ||
                        status === "failed"
                    ) {
                        return;
                    }


                    const key =
                        getMonthKey(date);


                    if (!buckets[key]) {
                        return;
                    }


                    buckets[key].revenue +=
                        getPaymentAmount(
                            payment
                        );
                }
            );


        getFilteredExpenses()
            .forEach(
                expense => {

                    const date =
                        getDateValue(
                            getExpenseDate(
                                expense
                            )
                        );


                    if (!date) {
                        return;
                    }


                    const status =
                        String(
                            expense.status ||
                            ""
                        ).toLowerCase();


                    if (
                        status === "cancelled" ||
                        status === "canceled"
                    ) {
                        return;
                    }


                    const key =
                        getMonthKey(date);


                    if (!buckets[key]) {
                        return;
                    }


                    buckets[key].expenses +=
                        getExpenseAmount(
                            expense
                        );
                }
            );


        const months =
            Object.values(
                buckets
            );


        if (!months.length) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        class="empty-state"
                    >
                        No monthly data available.
                    </td>

                </tr>

            `;

            return;
        }


        tbody.innerHTML =
            months.map(
                month => {

                    const profit =
                        month.revenue -
                        month.expenses;


                    const margin =
                        month.revenue > 0
                            ? (
                                profit /
                                month.revenue
                            ) * 100
                            : 0;


                    return `

                        <tr>

                            <td>
                                <strong>
                                    ${escapeHTML(
                                        formatMonth(
                                            month.date
                                        )
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${formatMoney(
                                    month.revenue
                                )}
                            </td>

                            <td>
                                ${formatMoney(
                                    month.expenses
                                )}
                            </td>

                            <td>
                                <strong>
                                    ${formatMoney(
                                        profit
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${formatPercent(
                                    margin
                                )}
                            </td>

                        </tr>

                    `;
                }
            ).join("");
    }


    /* =====================================================
       PERIOD LABEL
       ===================================================== */

    function renderPeriodLabels() {

        const from =
            state.fromDate
                ? formatDate(
                    `${state.fromDate}T00:00:00`
                )
                : "-";


        const to =
            state.toDate
                ? formatDate(
                    `${state.toDate}T00:00:00`
                )
                : "-";


        const label =
            `${from} – ${to}`;


        setText(
            "plReportPeriodLabel",
            label
        );


        setText(
            "plFooterPeriod",
            label
        );
    }


    /* =====================================================
       REPORT STATUS
       ===================================================== */

    function updateReportStatus() {

        setText(
            "plGeneratedDate",
            formatDate(
                new Date()
            )
        );


        setText(
            "plReportStatus",
            "Generated"
        );
    }


    /* =====================================================
       GENERATE REPORT
       ===================================================== */

    async function generateReport() {

        const from =
            $("profitLossFromDate")
                ?.value ||
            "";


        const to =
            $("profitLossToDate")
                ?.value ||
            "";


        if (
            from &&
            to &&
            from > to
        ) {

            showError(
                "From Date cannot be later than To Date."
            );

            return;
        }


        state.fromDate = from;

        state.toDate = to;


        setLoading(true);


        try {

            /*
             * Reload latest records so that
             * the report always uses fresh data.
             */

            await Promise.all([
                loadPayments(),
                loadExpenses()
            ]);


            renderAll();

            updateReportStatus();

            showSuccess(
                "Profit & Loss report generated successfully."
            );

        } catch (error) {

            console.error(
                "Profit & Loss generation failed:",
                error
            );

            showError(
                "Unable to generate Profit & Loss report."
            );

        } finally {

            setLoading(false);
        }
    }


    /* =====================================================
       QUICK PERIODS
       ===================================================== */

    function applyQuickPeriod(period) {

        const now =
            new Date();


        let from;
        let to;


        switch (period) {

            case "today":

                from =
                    new Date(
                        now
                    );

                to =
                    new Date(
                        now
                    );

                break;


            case "this-week": {

                const day =
                    now.getDay();


                const diff =
                    day === 0
                        ? 6
                        : day - 1;


                from =
                    new Date(
                        now
                    );


                from.setDate(
                    now.getDate() -
                    diff
                );


                to =
                    new Date(
                        now
                    );

                break;
            }


            case "this-month":

                from =
                    startOfMonth(
                        now
                    );

                to =
                    new Date(
                        now
                    );

                break;


            case "last-month":

                from =
                    new Date(
                        now.getFullYear(),
                        now.getMonth() - 1,
                        1
                    );


                to =
                    new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        0
                    );

                break;


            case "this-year":

                from =
                    new Date(
                        now.getFullYear(),
                        0,
                        1
                    );


                to =
                    new Date(
                        now
                    );

                break;


            case "last-year":

                from =
                    new Date(
                        now.getFullYear() - 1,
                        0,
                        1
                    );


                to =
                    new Date(
                        now.getFullYear() - 1,
                        11,
                        31
                    );

                break;


            default:

                return;
        }


        state.fromDate =
            dateInputValue(from);


        state.toDate =
            dateInputValue(to);


        setValue(
            "profitLossFromDate",
            state.fromDate
        );


        setValue(
            "profitLossToDate",
            state.toDate
        );


        generateReport();
    }


    /* =====================================================
       RENDER ALL
       ===================================================== */

    function renderAll() {

        renderPeriodLabels();

        renderSummary();

        renderRevenueItems();

        renderExpenseItems();

        renderExpenseBreakdown();

        renderMonthlyPerformance();
    }


    /* =====================================================
       LOADING
       ===================================================== */

    function setLoading(value) {

        state.loading =
            Boolean(value);


        const loader =
            $("profitLossLoading");


        if (loader) {

            loader.hidden =
                !state.loading;
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

        console.log(message);
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

        alert(message);
    }


    /* =====================================================
       EVENTS
       ===================================================== */

    function bindEvents() {

        $("refreshProfitLossBtn")
            ?.addEventListener(
                "click",
                generateReport
            );


        $("generateProfitLossBtn")
            ?.addEventListener(
                "click",
                generateReport
            );


        $("profitLossFromDate")
            ?.addEventListener(
                "change",
                function () {

                    state.fromDate =
                        this.value;

                    setValue(
                        "profitLossPeriod",
                        ""
                    );

                    renderAll();
                }
            );


        $("profitLossToDate")
            ?.addEventListener(
                "change",
                function () {

                    state.toDate =
                        this.value;

                    setValue(
                        "profitLossPeriod",
                        ""
                    );

                    renderAll();
                }
            );


        $("profitLossPeriod")
            ?.addEventListener(
                "change",
                function () {

                    if (this.value) {

                        applyQuickPeriod(
                            this.value
                        );
                    }
                }
            );
    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    async function init() {

        setDefaultDateRange();

        bindEvents();

        setLoading(true);


        try {

            await Promise.all([
                loadPayments(),
                loadExpenses()
            ]);


            renderAll();

            updateReportStatus();

        } catch (error) {

            console.error(
                "Profit & Loss initialization failed:",
                error
            );

        } finally {

            setLoading(false);
        }
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.ProfitLossModule = {

        init,

        refresh:
            generateReport,

        generateReport,

        getData:
            calculateProfitData,

        getPayments:
            () =>
                [...state.payments],

        getExpenses:
            () =>
                [...state.expenses]
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
