/* =========================================================
   MY TOUR MITRA ERP
   EXPENSES MODULE
   File: modules/expenses/expenses.js
   ========================================================= */

(function () {
    "use strict";

    const state = {
        expenses: [],
        editingExpenseId: null,
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


    function getCurrentUser() {

        if (window.currentUser) {
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
            return window.firebase.auth().currentUser;
        }

        return null;
    }


    function expensesCollection() {

        const db = getDB();

        if (!db) {
            return null;
        }

        return db.collection("expenses");
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


    function formatDate(value) {

        if (!value) {
            return "-";
        }

        let date;

        if (
            value &&
            typeof value.toDate === "function"
        ) {
            date = value.toDate();
        } else {
            date = new Date(value);
        }

        if (Number.isNaN(date.getTime())) {
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


    function dateInputValue(value) {

        if (!value) {
            return "";
        }

        let date;

        if (
            value &&
            typeof value.toDate === "function"
        ) {
            date = value.toDate();
        } else {
            date = new Date(value);
        }

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
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


    function setValue(id, value) {

        const element = $(id);

        if (element) {
            element.value = value ?? "";
        }
    }


    function setText(id, value) {

        const element = $(id);

        if (element) {
            element.textContent = value ?? "";
        }
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


    /* =====================================================
       LOAD EXPENSES
       ===================================================== */

    async function loadExpenses() {

        const collection = expensesCollection();

        if (!collection) {
            return;
        }

        setLoading(true);

        try {

            const snapshot =
                await collection
                    .orderBy("expenseDate", "desc")
                    .get();

            state.expenses =
                snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

        } catch (error) {

            console.warn(
                "Ordered expense query failed. Using fallback.",
                error
            );

            try {

                const snapshot =
                    await collection.get();

                state.expenses =
                    snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                sortExpenses();

            } catch (fallbackError) {

                console.error(
                    "Failed to load expenses:",
                    fallbackError
                );

                showError(
                    "Unable to load expenses."
                );
            }

        } finally {

            setLoading(false);
        }

        renderAll();
    }


    function sortExpenses() {

        state.expenses.sort(
            (a, b) => {

                const dateA =
                    new Date(
                        a.expenseDate || 0
                    ).getTime();

                const dateB =
                    new Date(
                        b.expenseDate || 0
                    ).getTime();

                return dateB - dateA;
            }
        );
    }


    /* =====================================================
       SUMMARY
       ===================================================== */

    function calculateTotals() {

        const total =
            state.expenses.reduce(
                (sum, expense) =>
                    sum +
                    toNumber(expense.amount),
                0
            );


        const thisMonth =
            state.expenses.reduce(
                (sum, expense) => {

                    if (!expense.expenseDate) {
                        return sum;
                    }

                    const date =
                        new Date(
                            expense.expenseDate
                        );

                    const now =
                        new Date();

                    if (
                        date.getMonth() ===
                            now.getMonth() &&
                        date.getFullYear() ===
                            now.getFullYear()
                    ) {
                        return (
                            sum +
                            toNumber(
                                expense.amount
                            )
                        );
                    }

                    return sum;
                },
                0
            );


        const today =
            new Date()
                .toISOString()
                .split("T")[0];


        const todayTotal =
            state.expenses.reduce(
                (sum, expense) => {

                    if (
                        dateInputValue(
                            expense.expenseDate
                        ) === today
                    ) {
                        return (
                            sum +
                            toNumber(
                                expense.amount
                            )
                        );
                    }

                    return sum;
                },
                0
            );


        return {
            total,
            thisMonth,
            today: todayTotal,
            count: state.expenses.length
        };
    }


    function renderSummary() {

        const totals =
            calculateTotals();


        setText(
            "totalExpenses",
            formatMoney(totals.total)
        );


        setText(
            "monthlyExpenses",
            formatMoney(totals.thisMonth)
        );


        setText(
            "todayExpenses",
            formatMoney(totals.today)
        );


        setText(
            "expenseCount",
            totals.count
        );
    }


    /* =====================================================
       FILTER
       ===================================================== */

    function getFilteredExpenses() {

        const search =
            (
                $("expenseSearch")?.value ||
                ""
            )
                .trim()
                .toLowerCase();


        const category =
            $("expenseCategoryFilter")?.value ||
            "";


        const paymentMethod =
            $("expensePaymentMethodFilter")?.value ||
            "";


        const fromDate =
            $("expenseFromDate")?.value ||
            "";


        const toDate =
            $("expenseToDate")?.value ||
            "";


        return state.expenses.filter(
            expense => {

                const searchText =
                    [
                        expense.expenseNumber,
                        expense.category,
                        expense.subCategory,
                        expense.description,
                        expense.vendorName,
                        expense.paidTo,
                        expense.reference,
                        expense.paymentMethod
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                if (
                    search &&
                    !searchText.includes(search)
                ) {
                    return false;
                }


                if (
                    category &&
                    expense.category !== category
                ) {
                    return false;
                }


                if (
                    paymentMethod &&
                    expense.paymentMethod !==
                        paymentMethod
                ) {
                    return false;
                }


                if (
                    fromDate &&
                    dateInputValue(
                        expense.expenseDate
                    ) < fromDate
                ) {
                    return false;
                }


                if (
                    toDate &&
                    dateInputValue(
                        expense.expenseDate
                    ) > toDate
                ) {
                    return false;
                }


                return true;
            }
        );
    }


    /* =====================================================
       TABLE
       ===================================================== */

    function renderExpenses() {

        const tbody =
            $("expensesTableBody");

        if (!tbody) {
            return;
        }


        const expenses =
            getFilteredExpenses();


        if (!expenses.length) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="10"
                        class="empty-state"
                    >

                        <strong>
                            No expenses found
                        </strong>

                        <p>
                            Add an expense or change
                            the filters.
                        </p>

                    </td>

                </tr>

            `;

            return;
        }


        tbody.innerHTML =
            expenses
                .map(
                    expense =>
                        renderExpenseRow(
                            expense
                        )
                )
                .join("");
    }


    function renderExpenseRow(expense) {

        return `

            <tr
                data-expense-id="${escapeHTML(
                    expense.id
                )}"
            >

                <td>
                    ${escapeHTML(
                        expense.expenseNumber ||
                        expense.id
                    )}
                </td>


                <td>
                    ${formatDate(
                        expense.expenseDate
                    )}
                </td>


                <td>

                    <strong>
                        ${escapeHTML(
                            expense.category ||
                            "-"
                        )}
                    </strong>

                    ${
                        expense.subCategory
                            ? `
                                <small>
                                    ${escapeHTML(
                                        expense.subCategory
                                    )}
                                </small>
                              `
                            : ""
                    }

                </td>


                <td>
                    ${escapeHTML(
                        expense.description ||
                        "-"
                    )}
                </td>


                <td>
                    ${escapeHTML(
                        expense.vendorName ||
                        expense.paidTo ||
                        "-"
                    )}
                </td>


                <td>
                    <strong>
                        ${formatMoney(
                            expense.amount
                        )}
                    </strong>
                </td>


                <td>
                    ${escapeHTML(
                        expense.paymentMethod ||
                        "-"
                    )}
                </td>


                <td>
                    ${escapeHTML(
                        expense.reference ||
                        "-"
                    )}
                </td>


                <td>

                    <span
                        class="expense-status expense-status-${escapeHTML(
                            expense.status ||
                            "paid"
                        )}"
                    >
                        ${escapeHTML(
                            expense.status ||
                            "Paid"
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
                            data-action="view-expense"
                            data-id="${escapeHTML(
                                expense.id
                            )}"
                        >
                            View
                        </button>


                        <button
                            type="button"
                            class="btn btn-sm btn-secondary"
                            data-action="edit-expense"
                            data-id="${escapeHTML(
                                expense.id
                            )}"
                        >
                            Edit
                        </button>


                        <button
                            type="button"
                            class="btn btn-sm btn-danger"
                            data-action="delete-expense"
                            data-id="${escapeHTML(
                                expense.id
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
       FORM
       ===================================================== */

    function openExpenseForm(expense = null) {

        const section =
            $("expenseFormSection");

        if (!section) {
            return;
        }


        const form =
            $("expenseForm");

        if (form) {
            form.reset();
        }


        state.editingExpenseId =
            expense
                ? expense.id
                : null;


        show(section);


        if (expense) {

            setValue(
                "expenseId",
                expense.id
            );


            setValue(
                "expenseDate",
                dateInputValue(
                    expense.expenseDate
                )
            );


            setValue(
                "expenseCategory",
                expense.category
            );


            setValue(
                "expenseSubCategory",
                expense.subCategory
            );


            setValue(
                "expenseDescription",
                expense.description
            );


            setValue(
                "expenseAmount",
                expense.amount
            );


            setValue(
                "expenseVendor",
                expense.vendorName ||
                expense.paidTo
            );


            setValue(
                "expensePaymentMethod",
                expense.paymentMethod
            );


            setValue(
                "expenseReference",
                expense.reference
            );


            setValue(
                "expenseStatus",
                expense.status ||
                "Paid"
            );


            setValue(
                "expenseNotes",
                expense.notes
            );


            setValue(
                "expenseReceipt",
                expense.receiptUrl ||
                ""
            );

        } else {

            const today =
                new Date()
                    .toISOString()
                    .split("T")[0];


            setValue(
                "expenseDate",
                today
            );


            setValue(
                "expenseStatus",
                "Paid"
            );
        }


        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }


    function closeExpenseForm() {

        hide(
            $("expenseFormSection")
        );

        state.editingExpenseId =
            null;
    }


    /* =====================================================
       FORM DATA
       ===================================================== */

    function collectFormData() {

        return {

            expenseDate:
                $("expenseDate")?.value ||
                "",

            category:
                $("expenseCategory")?.value ||
                "",

            subCategory:
                $("expenseSubCategory")?.value ||
                "",

            description:
                $("expenseDescription")?.value ||
                "",

            amount:
                toNumber(
                    $("expenseAmount")?.value
                ),

            vendorName:
                $("expenseVendor")?.value ||
                "",

            paymentMethod:
                $("expensePaymentMethod")?.value ||
                "",

            reference:
                $("expenseReference")?.value ||
                "",

            status:
                $("expenseStatus")?.value ||
                "Paid",

            notes:
                $("expenseNotes")?.value ||
                "",

            receiptUrl:
                $("expenseReceipt")?.value ||
                ""
        };
    }


    /* =====================================================
       VALIDATION
       ===================================================== */

    function validateExpense(data) {

        if (!data.expenseDate) {

            return {
                valid: false,
                message:
                    "Please select expense date."
            };
        }


        if (!data.category) {

            return {
                valid: false,
                message:
                    "Please select expense category."
            };
        }


        if (
            !data.amount ||
            data.amount <= 0
        ) {

            return {
                valid: false,
                message:
                    "Expense amount must be greater than zero."
            };
        }


        if (!data.paymentMethod) {

            return {
                valid: false,
                message:
                    "Please select payment method."
            };
        }


        return {
            valid: true
        };
    }


    /* =====================================================
       SAVE
       ===================================================== */

    async function saveExpense(event) {

        if (event) {
            event.preventDefault();
        }


        const data =
            collectFormData();


        const validation =
            validateExpense(data);


        if (!validation.valid) {

            showError(
                validation.message
            );

            return;
        }


        const collection =
            expensesCollection();

        if (!collection) {
            return;
        }


        try {

            const user =
                getCurrentUser();


            const now =
                new Date();


            if (
                state.editingExpenseId
            ) {

                await collection
                    .doc(
                        state.editingExpenseId
                    )
                    .update({

                        ...data,

                        updatedAt: now,

                        updatedBy:
                            user?.uid ||
                            null
                    });


                showSuccess(
                    "Expense updated successfully."
                );

            } else {

                const expenseNumber =
                    await generateExpenseNumber();


                await collection.add({

                    ...data,

                    expenseNumber,

                    createdAt: now,

                    updatedAt: now,

                    createdBy:
                        user?.uid ||
                        null
                });


                showSuccess(
                    "Expense added successfully."
                );
            }


            closeExpenseForm();

            await loadExpenses();

        } catch (error) {

            console.error(
                "Failed to save expense:",
                error
            );

            showError(
                "Unable to save expense."
            );
        }
    }


    /* =====================================================
       EXPENSE NUMBER
       ===================================================== */

    async function generateExpenseNumber() {

        const year =
            new Date()
                .getFullYear();


        const number =
            state.expenses.length +
            1;


        return `EXP${year}${String(
            number
        ).padStart(
            5,
            "0"
        )}`;
    }


    /* =====================================================
       DELETE
       ===================================================== */

    async function deleteExpense(expenseId) {

        const expense =
            state.expenses.find(
                item =>
                    item.id ===
                    expenseId
            );


        if (!expense) {
            return;
        }


        const confirmed =
            window.confirm(
                `Delete expense ${
                    expense.expenseNumber ||
                    expense.id
                }?\n\nThis action cannot be undone.`
            );


        if (!confirmed) {
            return;
        }


        const collection =
            expensesCollection();

        if (!collection) {
            return;
        }


        try {

            await collection
                .doc(expenseId)
                .delete();


            showSuccess(
                "Expense deleted successfully."
            );


            await loadExpenses();

        } catch (error) {

            console.error(
                "Failed to delete expense:",
                error
            );

            showError(
                "Unable to delete expense."
            );
        }
    }


    /* =====================================================
       VIEW
       ===================================================== */

    function viewExpense(expenseId) {

        const expense =
            state.expenses.find(
                item =>
                    item.id ===
                    expenseId
            );


        if (!expense) {
            return;
        }


        const content =
            $("expenseDetailsContent");

        if (!content) {
            return;
        }


        content.innerHTML = `

            <div
                class="expense-detail-grid"
            >

                <div>

                    <span>
                        Expense ID
                    </span>

                    <strong>
                        ${escapeHTML(
                            expense.expenseNumber ||
                            expense.id
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Date
                    </span>

                    <strong>
                        ${formatDate(
                            expense.expenseDate
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Category
                    </span>

                    <strong>
                        ${escapeHTML(
                            expense.category ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Sub Category
                    </span>

                    <strong>
                        ${escapeHTML(
                            expense.subCategory ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Description
                    </span>

                    <strong>
                        ${escapeHTML(
                            expense.description ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Paid To / Vendor
                    </span>

                    <strong>
                        ${escapeHTML(
                            expense.vendorName ||
                            expense.paidTo ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Amount
                    </span>

                    <strong
                        class="expense-amount-value"
                    >
                        ${formatMoney(
                            expense.amount
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Payment Method
                    </span>

                    <strong>
                        ${escapeHTML(
                            expense.paymentMethod ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Reference
                    </span>

                    <strong>
                        ${escapeHTML(
                            expense.reference ||
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
                            expense.status ||
                            "Paid"
                        )}
                    </strong>

                </div>

            </div>


            ${
                expense.notes
                    ? `

                        <div
                            class="expense-detail-notes"
                        >

                            <h3>
                                Notes
                            </h3>

                            <p>
                                ${escapeHTML(
                                    expense.notes
                                )}
                            </p>

                        </div>

                      `
                    : ""
            }

        `;


        show(
            $("expenseDetailsModal")
        );
    }


    function closeExpenseDetails() {

        hide(
            $("expenseDetailsModal")
        );
    }


    /* =====================================================
       EVENTS
       ===================================================== */

    function bindEvents() {

        $("addExpenseBtn")
            ?.addEventListener(
                "click",
                () =>
                    openExpenseForm()
            );


        $("closeExpenseFormBtn")
            ?.addEventListener(
                "click",
                closeExpenseForm
            );


        $("cancelExpenseBtn")
            ?.addEventListener(
                "click",
                closeExpenseForm
            );


        $("expenseForm")
            ?.addEventListener(
                "submit",
                saveExpense
            );


        $("expenseSearch")
            ?.addEventListener(
                "input",
                renderAll
            );


        $("expenseCategoryFilter")
            ?.addEventListener(
                "change",
                renderAll
            );


        $("expensePaymentMethodFilter")
            ?.addEventListener(
                "change",
                renderAll
            );


        $("expenseFromDate")
            ?.addEventListener(
                "change",
                renderAll
            );


        $("expenseToDate")
            ?.addEventListener(
                "change",
                renderAll
            );


        $("clearExpenseFiltersBtn")
            ?.addEventListener(
                "click",
                clearFilters
            );


        $("refreshExpensesBtn")
            ?.addEventListener(
                "click",
                loadExpenses
            );


        $("closeExpenseDetailsModal")
            ?.addEventListener(
                "click",
                closeExpenseDetails
            );


        $("closeExpenseDetailsBtn")
            ?.addEventListener(
                "click",
                closeExpenseDetails
            );


        document.addEventListener(
            "click",
            handleActionClick
        );
    }


    function handleActionClick(event) {

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


        if (
            action ===
            "view-expense"
        ) {

            viewExpense(id);

            return;
        }


        if (
            action ===
            "edit-expense"
        ) {

            const expense =
                state.expenses.find(
                    item =>
                        item.id === id
                );

            if (expense) {
                openExpenseForm(
                    expense
                );
            }

            return;
        }


        if (
            action ===
            "delete-expense"
        ) {

            deleteExpense(id);

            return;
        }
    }


    /* =====================================================
       FILTER RESET
       ===================================================== */

    function clearFilters() {

        setValue(
            "expenseSearch",
            ""
        );

        setValue(
            "expenseCategoryFilter",
            ""
        );

        setValue(
            "expensePaymentMethodFilter",
            ""
        );

        setValue(
            "expenseFromDate",
            ""
        );

        setValue(
            "expenseToDate",
            ""
        );


        renderAll();
    }


    /* =====================================================
       LOADING
       ===================================================== */

    function setLoading(loading) {

        state.loading =
            loading;


        const loader =
            $("expensesLoading");

        if (loader) {
            loader.hidden =
                !loading;
        }
    }


    /* =====================================================
       RENDER ALL
       ===================================================== */

    function renderAll() {

        renderSummary();

        renderExpenses();
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
       INITIALIZE
       ===================================================== */

    async function init() {

        bindEvents();

        await loadExpenses();
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.ExpensesModule = {

        init,

        refresh:
            loadExpenses,

        add:
            openExpenseForm,

        edit:
            openExpenseForm,

        view:
            viewExpense,

        delete:
            deleteExpense,

        getExpenses:
            () =>
                [...state.expenses],

        getTotal:
            () =>
                calculateTotals().total
    };


    /* =====================================================
       AUTO INIT
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
