/* =========================================================
   MY TOUR MITRA ERP
   INVOICES MODULE
   File: modules/invoices/invoices.js

   Purpose:
   - Customer invoices
   - Billing
   - Payment collection
   - Outstanding balance
   - Invoice status
   - Firestore integration
   - Search / filter
   - View / edit
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       FIREBASE
       ===================================================== */

    const db =
        window.db ||
        window.firebaseDb ||
        window.firestore;

    if (!db) {
        console.error(
            "Invoices Module: Firestore database not found."
        );
    }


    /* =====================================================
       STATE
       ===================================================== */

    let invoices = [];
    let customers = [];
    let bookings = [];
    let packages = [];

    let editingInvoiceId = null;
    let currentInvoice = null;


    /* =====================================================
       COLLECTION NAMES
       ===================================================== */

    const COLLECTIONS = {
        invoices: "invoices",
        customers: "customers",
        bookings: "bookings",
        packages: "packages",
        payments: "payments"
    };


    /* =====================================================
       HELPERS
       ===================================================== */

    function $(id) {
        return document.getElementById(id);
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


    function number(value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    }


    function money(value) {

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ).format(number(value));
    }


    function today() {

        const date = new Date();

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    function formatDate(value) {

        if (!value) return "-";

        let date;

        if (
            value &&
            typeof value.toDate === "function"
        ) {
            date = value.toDate();
        } else {
            date = new Date(value);
        }

        if (isNaN(date.getTime())) {
            return escapeHTML(value);
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


    function getFirestoreTimestamp() {

        if (
            window.firebase &&
            window.firebase.firestore &&
            window.firebase.firestore.Timestamp
        ) {
            return window.firebase.firestore.Timestamp.now();
        }

        if (
            window.Timestamp &&
            typeof window.Timestamp.now === "function"
        ) {
            return window.Timestamp.now();
        }

        return new Date();
    }


    function showMessage(message, type = "success") {

        if (
            typeof window.showToast === "function"
        ) {
            window.showToast(
                message,
                type
            );
            return;
        }

        if (
            typeof window.showNotification === "function"
        ) {
            window.showNotification(
                message,
                type
            );
            return;
        }

        console.log(
            `[${type}] ${message}`
        );
    }


    /* =====================================================
       FIRESTORE HELPERS
       ===================================================== */

    async function getCollection(name) {

        if (!db) {
            throw new Error(
                "Firestore is not initialized."
            );
        }

        const snapshot =
            await db
                .collection(name)
                .get();

        return snapshot.docs.map(
            doc => ({
                id: doc.id,
                ...doc.data()
            })
        );
    }


    async function saveDocument(
        collection,
        id,
        data
    ) {

        if (!db) {
            throw new Error(
                "Firestore is not initialized."
            );
        }

        if (id) {

            await db
                .collection(collection)
                .doc(id)
                .set(
                    data,
                    {
                        merge: true
                    }
                );

            return id;
        }

        const ref =
            await db
                .collection(collection)
                .add(data);

        return ref.id;
    }


    /* =====================================================
       LOAD ALL DATA
       ===================================================== */

    async function loadInvoiceModule() {

        try {

            await Promise.all([
                loadInvoices(),
                loadCustomers(),
                loadBookings(),
                loadPackages()
            ]);

            populateCustomerDropdown();
            populatePackageDropdown();

            renderInvoices();
            updateSummary();

            initializeDefaults();

        } catch (error) {

            console.error(
                "Invoice module loading error:",
                error
            );

            showMessage(
                "Unable to load invoice data.",
                "error"
            );
        }
    }


    /* =====================================================
       LOAD INVOICES
       ===================================================== */

    async function loadInvoices() {

        invoices =
            await getCollection(
                COLLECTIONS.invoices
            );

        invoices.sort(
            (a, b) => {

                const aDate =
                    new Date(
                        a.invoiceDate ||
                        a.createdAt ||
                        0
                    );

                const bDate =
                    new Date(
                        b.invoiceDate ||
                        b.createdAt ||
                        0
                    );

                return bDate - aDate;
            }
        );
    }


    /* =====================================================
       LOAD CUSTOMERS
       ===================================================== */

    async function loadCustomers() {

        customers =
            await getCollection(
                COLLECTIONS.customers
            );
    }


    /* =====================================================
       LOAD BOOKINGS
       ===================================================== */

    async function loadBookings() {

        bookings =
            await getCollection(
                COLLECTIONS.bookings
            );
    }


    /* =====================================================
       LOAD PACKAGES
       ===================================================== */

    async function loadPackages() {

        packages =
            await getCollection(
                COLLECTIONS.packages
            );
    }


    /* =====================================================
       CUSTOMER DROPDOWN
       ===================================================== */

    function populateCustomerDropdown() {

        const select =
            $("invoiceCustomer");

        if (!select) return;

        select.innerHTML = `
            <option value="">
                Select Customer
            </option>
        `;

        customers.forEach(
            customer => {

                const name =
                    customer.name ||
                    customer.customerName ||
                    customer.fullName ||
                    "Unnamed Customer";

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    customer.id;

                option.textContent =
                    name;

                select.appendChild(
                    option
                );
            }
        );
    }


    /* =====================================================
       PACKAGE DROPDOWN
       ===================================================== */

    function populatePackageDropdown() {

        const select =
            $("invoicePackage");

        if (!select) return;

        select.innerHTML = `
            <option value="">
                Select Package
            </option>
        `;

        packages.forEach(
            pkg => {

                const name =
                    pkg.name ||
                    pkg.packageName ||
                    pkg.title ||
                    "Unnamed Package";

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    pkg.id;

                option.textContent =
                    name;

                select.appendChild(
                    option
                );
            }
        );
    }


    /* =====================================================
       BOOKING DROPDOWN
       ===================================================== */

    function populateBookingDropdown(
        customerId = ""
    ) {

        const select =
            $("invoiceBooking");

        if (!select) return;

        select.innerHTML = `
            <option value="">
                Select Booking
            </option>
        `;

        const filtered =
            customerId
                ? bookings.filter(
                    booking =>
                        booking.customerId ===
                        customerId
                )
                : bookings;

        filtered.forEach(
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
                    booking.reference ||
                    `Booking ${booking.id}`;

                select.appendChild(
                    option
                );
            }
        );
    }


    /* =====================================================
       CUSTOMER SELECTION
       ===================================================== */

    function handleCustomerChange() {

        const customerId =
            $("invoiceCustomer")?.value;

        populateBookingDropdown(
            customerId
        );

        const customer =
            customers.find(
                item =>
                    item.id === customerId
            );

        if (!customer) return;

        setValue(
            "invoiceCustomerName",
            customer.name ||
            customer.customerName ||
            customer.fullName ||
            ""
        );

        setValue(
            "invoiceCustomerMobile",
            customer.mobile ||
            customer.phone ||
            customer.whatsapp ||
            ""
        );

        setValue(
            "invoiceCustomerEmail",
            customer.email ||
            ""
        );

        setValue(
            "invoiceCustomerGST",
            customer.gstNumber ||
            customer.gstin ||
            ""
        );

        setValue(
            "invoiceCustomerAddress",
            customer.address ||
            ""
        );
    }


    /* =====================================================
       BOOKING SELECTION
       ===================================================== */

    function handleBookingChange() {

        const bookingId =
            $("invoiceBooking")?.value;

        const booking =
            bookings.find(
                item =>
                    item.id === bookingId
            );

        if (!booking) return;

        setValue(
            "invoiceDestination",
            booking.destination ||
            booking.destinations ||
            ""
        );

        setValue(
            "invoicePax",
            booking.pax ||
            booking.guests ||
            booking.numberOfGuests ||
            ""
        );

        if (
            booking.packageId &&
            $("invoicePackage")
        ) {

            $("invoicePackage").value =
                booking.packageId;
        }
    }


    /* =====================================================
       PACKAGE SELECTION
       ===================================================== */

    function handlePackageChange() {

        const packageId =
            $("invoicePackage")?.value;

        const pkg =
            packages.find(
                item =>
                    item.id === packageId
            );

        if (!pkg) return;

        setValue(
            "invoiceDestination",
            pkg.destination ||
            pkg.location ||
            ""
        );
    }


    /* =====================================================
       SET VALUE
       ===================================================== */

    function setValue(
        id,
        value
    ) {

        const element =
            $(id);

        if (!element) return;

        element.value =
            value ?? "";
    }


    /* =====================================================
       GET VALUE
       ===================================================== */

    function getValue(id) {

        return $(
            id
        )?.value?.trim() || "";
    }


    /* =====================================================
       INVOICE NUMBER
       ===================================================== */

    function generateInvoiceNumber() {

        const year =
            new Date()
                .getFullYear();

        const prefix =
            `MTM/INV/${year}/`;

        let max = 0;

        invoices.forEach(
            invoice => {

                const value =
                    invoice.invoiceNumber ||
                    "";

                if (
                    value.startsWith(prefix)
                ) {

                    const parts =
                        value.split("/");

                    const serial =
                        parseInt(
                            parts[3],
                            10
                        );

                    if (
                        Number.isFinite(
                            serial
                        ) &&
                        serial > max
                    ) {
                        max = serial;
                    }
                }
            }
        );

        return (
            prefix +
            String(
                max + 1
            ).padStart(
                4,
                "0"
            )
        );
    }


    /* =====================================================
       DEFAULT FORM VALUES
       ===================================================== */

    function initializeDefaults() {

        if (
            $("invoiceDate") &&
            !$("invoiceDate").value
        ) {
            $("invoiceDate").value =
                today();
        }

        if (
            $("invoicePaymentDate") &&
            !$("invoicePaymentDate").value
        ) {
            $("invoicePaymentDate").value =
                today();
        }

        if (
            $("invoiceNumber") &&
            !$("invoiceNumber").value
        ) {
            $("invoiceNumber").value =
                generateInvoiceNumber();
        }
    }


    /* =====================================================
       OPEN CREATE MODAL
       ===================================================== */

    function openCreateInvoice() {

        editingInvoiceId = null;

        resetInvoiceForm();

        const title =
            $("invoiceModalTitle");

        if (title) {
            title.textContent =
                "Create Invoice";
        }

        $("invoiceModal")?.classList.add(
            "show"
        );

        $("invoiceModal")?.setAttribute(
            "aria-hidden",
            "false"
        );

        initializeDefaults();

        calculateInvoice();
    }


    /* =====================================================
       CLOSE CREATE MODAL
       ===================================================== */

    function closeInvoiceModal() {

        $("invoiceModal")?.classList.remove(
            "show"
        );

        $("invoiceModal")?.setAttribute(
            "aria-hidden",
            "true"
        );
    }


    /* =====================================================
       RESET FORM
       ===================================================== */

    function resetInvoiceForm() {

        const form =
            $("invoiceForm");

        if (form) {
            form.reset();
        }

        editingInvoiceId = null;

        setValue(
            "invoiceId",
            ""
        );

        setValue(
            "invoiceNumber",
            generateInvoiceNumber()
        );

        setValue(
            "invoiceDate",
            today()
        );

        setValue(
            "invoicePaymentDate",
            today()
        );

        setValue(
            "invoiceAmountReceived",
            "0"
        );

        setValue(
            "invoiceDiscount",
            "0"
        );

        setValue(
            "invoiceStatus",
            "draft"
        );

        setValue(
            "invoicePaymentStatus",
            "pending"
        );

        const body =
            $("invoiceItemsBody");

        if (body) {

            body.innerHTML =
                createItemRowHTML(
                    0
                );
        }

        populateBookingDropdown();

        calculateInvoice();
    }


    /* =====================================================
       CREATE ITEM ROW
       ===================================================== */

    function createItemRowHTML(
        index
    ) {

        return `
            <tr
                class="invoice-item-row"
                data-item-index="${index}"
            >

                <td>
                    <input
                        type="text"
                        name="itemDescription[]"
                        class="form-control"
                        placeholder="Tour package / service"
                    >
                </td>

                <td>
                    <input
                        type="text"
                        name="itemHSN[]"
                        class="form-control"
                        placeholder="HSN/SAC"
                    >
                </td>

                <td>
                    <input
                        type="number"
                        name="itemQty[]"
                        class="form-control invoice-item-qty"
                        value="1"
                        min="1"
                        step="1"
                    >
                </td>

                <td>
                    <input
                        type="number"
                        name="itemRate[]"
                        class="form-control invoice-item-rate"
                        value="0"
                        min="0"
                        step="0.01"
                    >
                </td>

                <td>
                    <input
                        type="number"
                        name="itemTax[]"
                        class="form-control invoice-item-tax"
                        value="0"
                        min="0"
                        step="0.01"
                    >
                </td>

                <td>
                    <input
                        type="text"
                        name="itemAmount[]"
                        class="form-control invoice-item-amount"
                        value="₹0.00"
                        readonly
                    >
                </td>

                <td>
                    <button
                        type="button"
                        class="btn btn-danger btn-remove-invoice-item"
                        title="Remove Item"
                    >
                        ×
                    </button>
                </td>

            </tr>
        `;
    }


    /* =====================================================
       ADD ITEM
       ===================================================== */

    function addInvoiceItem() {

        const body =
            $("invoiceItemsBody");

        if (!body) return;

        const index =
            body.querySelectorAll(
                ".invoice-item-row"
            ).length;

        body.insertAdjacentHTML(
            "beforeend",
            createItemRowHTML(index)
        );
    }


    /* =====================================================
       REMOVE ITEM
       ===================================================== */

    function removeInvoiceItem(
        button
    ) {

        const body =
            $("invoiceItemsBody");

        if (!body) return;

        const rows =
            body.querySelectorAll(
                ".invoice-item-row"
            );

        if (rows.length <= 1) {

            showMessage(
                "At least one invoice item is required.",
                "warning"
            );

            return;
        }

        button
            .closest(
                ".invoice-item-row"
            )
            ?.remove();

        calculateInvoice();
    }


    /* =====================================================
       READ ITEMS
       ===================================================== */

    function getInvoiceItems() {

        const rows =
            document.querySelectorAll(
                "#invoiceItemsBody .invoice-item-row"
            );

        const items = [];

        rows.forEach(
            row => {

                const description =
                    row.querySelector(
                        '[name="itemDescription[]"]'
                    )?.value?.trim() || "";

                const hsn =
                    row.querySelector(
                        '[name="itemHSN[]"]'
                    )?.value?.trim() || "";

                const qty =
                    number(
                        row.querySelector(
                            '[name="itemQty[]"]'
                        )?.value
                    );

                const rate =
                    number(
                        row.querySelector(
                            '[name="itemRate[]"]'
                        )?.value
                    );

                const taxRate =
                    number(
                        row.querySelector(
                            '[name="itemTax[]"]'
                        )?.value
                    );

                const baseAmount =
                    qty * rate;

                const taxAmount =
                    baseAmount *
                    taxRate /
                    100;

                const amount =
                    baseAmount +
                    taxAmount;

                items.push({
                    description,
                    hsn,
                    qty,
                    rate,
                    taxRate,
                    taxAmount,
                    baseAmount,
                    amount
                });
            }
        );

        return items;
    }


    /* =====================================================
       CALCULATE INVOICE
       ===================================================== */

    function calculateInvoice() {

        const items =
            getInvoiceItems();

        let subtotal = 0;
        let tax = 0;

        items.forEach(
            item => {

                subtotal +=
                    item.baseAmount;

                tax +=
                    item.taxAmount;
            }
        );

        const discount =
            number(
                $("invoiceDiscount")?.value
            );

        const taxableAmount =
            Math.max(
                0,
                subtotal - discount
            );

        /*
         * Tax already calculated on item level.
         * This keeps item-wise tax visible.
         */

        const grandTotal =
            Math.max(
                0,
                subtotal +
                tax -
                discount
            );

        const received =
            number(
                $("invoiceAmountReceived")?.value
            );

        const balance =
            Math.max(
                0,
                grandTotal -
                received
            );

        updateText(
            "invoiceSubtotal",
            money(subtotal)
        );

        updateText(
            "invoiceDiscountAmount",
            money(discount)
        );

        updateText(
            "invoiceTaxAmount",
            money(tax)
        );

        updateText(
            "invoiceGrandTotal",
            money(grandTotal)
        );

        updateText(
            "paymentInvoiceTotal",
            money(grandTotal)
        );

        updateText(
            "paymentReceivedAmount",
            money(received)
        );

        updateText(
            "paymentBalanceAmount",
            money(balance)
        );

        /*
         * Update item amount columns
         */

        const rows =
            document.querySelectorAll(
                "#invoiceItemsBody .invoice-item-row"
            );

        rows.forEach(
            (row, index) => {

                const item =
                    items[index];

                if (!item) return;

                const amount =
                    row.querySelector(
                        ".invoice-item-amount"
                    );

                if (amount) {
                    amount.value =
                        money(
                            item.amount
                        );
                }
            }
        );

        updatePaymentStatusPreview(
            grandTotal,
            received
        );

        return {
            items,
            subtotal,
            tax,
            discount,
            grandTotal,
            received,
            balance,
            taxableAmount
        };
    }


    /* =====================================================
       PAYMENT STATUS
       ===================================================== */

    function calculatePaymentStatus(
        total,
        received,
        dueDate
    ) {

        total =
            number(total);

        received =
            number(received);

        if (total <= 0) {
            return "pending";
        }

        if (received >= total) {
            return "paid";
        }

        if (received > 0) {
            return "partial";
        }

        if (
            dueDate &&
            dueDate < today()
        ) {
            return "overdue";
        }

        return "pending";
    }


    function calculateInvoiceStatus(
        total,
        received,
        dueDate
    ) {

        total =
            number(total);

        received =
            number(received);

        if (total <= 0) {
            return "draft";
        }

        if (received >= total) {
            return "paid";
        }

        if (received > 0) {
            return "partial";
        }

        if (
            dueDate &&
            dueDate < today()
        ) {
            return "overdue";
        }

        return "unpaid";
    }


    function updatePaymentStatusPreview(
        total,
        received
    ) {

        const dueDate =
            getValue(
                "invoiceDueDate"
            );

        const status =
            calculatePaymentStatus(
                total,
                received,
                dueDate
            );

        const paymentStatus =
            $("invoicePaymentStatus");

        if (paymentStatus) {

            paymentStatus.value =
                status === "paid"
                    ? "paid"
                    : status === "partial"
                        ? "partial"
                        : "pending";
        }

        const invoiceStatus =
            $("invoiceStatus");

        if (
            invoiceStatus &&
            invoiceStatus.value !== "cancelled" &&
            invoiceStatus.value !== "draft"
        ) {

            invoiceStatus.value =
                calculateInvoiceStatus(
                    total,
                    received,
                    dueDate
                );
        }
    }


    /* =====================================================
       UPDATE TEXT
       ===================================================== */

    function updateText(
        id,
        text
    ) {

        const element =
            $(id);

        if (element) {
            element.textContent =
                text;
        }
    }


    /* =====================================================
       COLLECT FORM DATA
       ===================================================== */

    function collectInvoiceData() {

        const calculation =
            calculateInvoice();

        const customerId =
            getValue(
                "invoiceCustomer"
            );

        const bookingId =
            getValue(
                "invoiceBooking"
            );

        const packageId =
            getValue(
                "invoicePackage"
            );

        const dueDate =
            getValue(
                "invoiceDueDate"
            );

        const status =
            getValue(
                "invoiceStatus"
            ) ||
            calculateInvoiceStatus(
                calculation.grandTotal,
                calculation.received,
                dueDate
            );

        const paymentStatus =
            calculatePaymentStatus(
                calculation.grandTotal,
                calculation.received,
                dueDate
            );

        return {

            invoiceNumber:
                getValue(
                    "invoiceNumber"
                ),

            invoiceDate:
                getValue(
                    "invoiceDate"
                ),

            dueDate,

            customerId,

            customerName:
                getValue(
                    "invoiceCustomerName"
                ),

            customerMobile:
                getValue(
                    "invoiceCustomerMobile"
                ),

            customerEmail:
                getValue(
                    "invoiceCustomerEmail"
                ),

            customerGST:
                getValue(
                    "invoiceCustomerGST"
                ),

            customerAddress:
                getValue(
                    "invoiceCustomerAddress"
                ),

            bookingId,

            packageId,

            destination:
                getValue(
                    "invoiceDestination"
                ),

            pax:
                number(
                    getValue(
                        "invoicePax"
                    )
                ),

            items:
                calculation.items,

            subtotal:
                calculation.subtotal,

            discount:
                calculation.discount,

            tax:
                calculation.tax,

            grandTotal:
                calculation.grandTotal,

            amountReceived:
                calculation.received,

            balanceDue:
                calculation.balance,

            paymentDate:
                getValue(
                    "invoicePaymentDate"
                ),

            paymentMethod:
                getValue(
                    "invoicePaymentMethod"
                ),

            paymentReference:
                getValue(
                    "invoicePaymentReference"
                ),

            status,

            paymentStatus,

            notes:
                getValue(
                    "invoiceNotes"
                ),

            updatedAt:
                getFirestoreTimestamp()
        };
    }


    /* =====================================================
       VALIDATION
       ===================================================== */

    function validateInvoice(
        data
    ) {

        if (!data.customerId) {

            showMessage(
                "Please select a customer.",
                "warning"
            );

            return false;
        }

        if (!data.invoiceDate) {

            showMessage(
                "Please select invoice date.",
                "warning"
            );

            return false;
        }

        if (!data.items.length) {

            showMessage(
                "Please add at least one invoice item.",
                "warning"
            );

            return false;
        }

        const hasDescription =
            data.items.some(
                item =>
                    item.description
            );

        if (!hasDescription) {

            showMessage(
                "Please enter an invoice item description.",
                "warning"
            );

            return false;
        }

        if (
            data.amountReceived >
            data.grandTotal
        ) {

            showMessage(
                "Received amount cannot be greater than invoice total.",
                "warning"
            );

            return false;
        }

        return true;
    }


    /* =====================================================
       SAVE INVOICE
       ===================================================== */

    async function saveInvoice(
        event
    ) {

        if (event) {
            event.preventDefault();
        }

        try {

            const data =
                collectInvoiceData();

            if (!validateInvoice(data)) {
                return;
            }

            const existing =
                editingInvoiceId
                    ? invoices.find(
                        invoice =>
                            invoice.id ===
                            editingInvoiceId
                    )
                    : null;

            if (!existing) {

                data.createdAt =
                    getFirestoreTimestamp();

                data.createdBy =
                    window.currentUser?.uid ||
                    window.currentUser?.id ||
                    "";

                data.paymentHistory = [];

                if (
                    data.amountReceived > 0
                ) {

                    data.paymentHistory.push({
                        amount:
                            data.amountReceived,

                        paymentDate:
                            data.paymentDate ||
                            today(),

                        paymentMethod:
                            data.paymentMethod ||
                            "",

                        reference:
                            data.paymentReference ||
                            "",

                        notes:
                            "",

                        createdAt:
                            getFirestoreTimestamp()
                    });
                }
            }

            const id =
                await saveDocument(
                    COLLECTIONS.invoices,
                    editingInvoiceId,
                    data
                );

            /*
             * Create payment record when
             * initial payment is received.
             */

            if (
                !existing &&
                data.amountReceived > 0
            ) {

                await createPaymentRecord(
                    id,
                    data
                );
            }

            showMessage(
                editingInvoiceId
                    ? "Invoice updated successfully."
                    : "Invoice created successfully.",
                "success"
            );

            closeInvoiceModal();

            await loadInvoices();

            renderInvoices();

            updateSummary();

        } catch (error) {

            console.error(
                "Save invoice error:",
                error
            );

            showMessage(
                "Unable to save invoice.",
                "error"
            );
        }
    }


    /* =====================================================
       CREATE PAYMENT RECORD
       ===================================================== */

    async function createPaymentRecord(
        invoiceId,
        data
    ) {

        if (
            !data.amountReceived ||
            data.amountReceived <= 0
        ) {
            return;
        }

        try {

            await db
                .collection(
                    COLLECTIONS.payments
                )
                .add({

                    invoiceId,

                    invoiceNumber:
                        data.invoiceNumber,

                    customerId:
                        data.customerId,

                    customerName:
                        data.customerName,

                    amount:
                        data.amountReceived,

                    paymentDate:
                        data.paymentDate ||
                        today(),

                    paymentMethod:
                        data.paymentMethod ||
                        "",

                    reference:
                        data.paymentReference ||
                        "",

                    type:
                        "customer_payment",

                    status:
                        "received",

                    notes:
                        "",

                    createdAt:
                        getFirestoreTimestamp(),

                    createdBy:
                        window.currentUser?.uid ||
                        ""
                });

        } catch (error) {

            console.error(
                "Payment record creation error:",
                error
            );
        }
    }


    /* =====================================================
       RECORD PAYMENT
       ===================================================== */

    async function recordPayment(
        event
    ) {

        if (event) {
            event.preventDefault();
        }

        try {

            const invoiceId =
                getValue(
                    "paymentInvoiceId"
                );

            if (!invoiceId) {

                showMessage(
                    "Invoice not found.",
                    "error"
                );

                return;
            }

            const invoice =
                invoices.find(
                    item =>
                        item.id ===
                        invoiceId
                );

            if (!invoice) {

                showMessage(
                    "Invoice not found.",
                    "error"
                );

                return;
            }

            const amount =
                number(
                    getValue(
                        "recordPaymentAmount"
                    )
                );

            const balance =
                number(
                    invoice.balanceDue
                );

            if (amount <= 0) {

                showMessage(
                    "Enter a valid payment amount.",
                    "warning"
                );

                return;
            }

            if (amount > balance) {

                showMessage(
                    "Payment cannot be greater than outstanding balance.",
                    "warning"
                );

                return;
            }

            const paymentDate =
                getValue(
                    "recordPaymentDate"
                ) ||
                today();

            const paymentMethod =
                getValue(
                    "recordPaymentMethod"
                );

            if (!paymentMethod) {

                showMessage(
                    "Please select payment method.",
                    "warning"
                );

                return;
            }

            const reference =
                getValue(
                    "recordPaymentReference"
                );

            const notes =
                getValue(
                    "recordPaymentNotes"
                );

            const newReceived =
                number(
                    invoice.amountReceived
                ) +
                amount;

            const newBalance =
                Math.max(
                    0,
                    number(
                        invoice.grandTotal
                    ) -
                    newReceived
                );

            const newStatus =
                calculateInvoiceStatus(
                    invoice.grandTotal,
                    newReceived,
                    invoice.dueDate
                );

            const newPaymentStatus =
                calculatePaymentStatus(
                    invoice.grandTotal,
                    newReceived,
                    invoice.dueDate
                );

            const history =
                Array.isArray(
                    invoice.paymentHistory
                )
                    ? [
                        ...invoice.paymentHistory
                    ]
                    : [];

            history.push({

                amount,

                paymentDate,

                paymentMethod,

                reference,

                notes,

                createdAt:
                    getFirestoreTimestamp(),

                createdBy:
                    window.currentUser?.uid ||
                    ""
            });


            await db
                .collection(
                    COLLECTIONS.invoices
                )
                .doc(invoiceId)
                .update({

                    amountReceived:
                        newReceived,

                    balanceDue:
                        newBalance,

                    status:
                        newStatus,

                    paymentStatus:
                        newPaymentStatus,

                    paymentHistory:
                        history,

                    updatedAt:
                        getFirestoreTimestamp()
                });


            /*
             * Also save into Payments collection.
             */

            await db
                .collection(
                    COLLECTIONS.payments
                )
                .add({

                    invoiceId,

                    invoiceNumber:
                        invoice.invoiceNumber,

                    customerId:
                        invoice.customerId,

                    customerName:
                        invoice.customerName,

                    amount,

                    paymentDate,

                    paymentMethod,

                    reference,

                    notes,

                    type:
                        "customer_payment",

                    status:
                        "received",

                    createdAt:
                        getFirestoreTimestamp(),

                    createdBy:
                        window.currentUser?.uid ||
                        ""
                });


            showMessage(
                "Payment recorded successfully.",
                "success"
            );

            closeRecordPaymentModal();

            await loadInvoices();

            renderInvoices();

            updateSummary();

        } catch (error) {

            console.error(
                "Record payment error:",
                error
            );

            showMessage(
                "Unable to record payment.",
                "error"
            );
        }
    }


    /* =====================================================
       OPEN RECORD PAYMENT
       ===================================================== */

    function openRecordPayment(
        invoiceId
    ) {

        const invoice =
            invoices.find(
                item =>
                    item.id === invoiceId
            );

        if (!invoice) return;

        currentInvoice =
            invoice;

        setValue(
            "paymentInvoiceId",
            invoice.id
        );

        updateText(
            "paymentInvoiceNumber",
            invoice.invoiceNumber ||
            "-"
        );

        updateText(
            "paymentCustomerName",
            invoice.customerName ||
            "-"
        );

        updateText(
            "paymentInvoiceBalance",
            money(
                invoice.balanceDue
            )
        );

        setValue(
            "recordPaymentAmount",
            ""
        );

        setValue(
            "recordPaymentDate",
            today()
        );

        setValue(
            "recordPaymentMethod",
            ""
        );

        setValue(
            "recordPaymentReference",
            ""
        );

        setValue(
            "recordPaymentNotes",
            ""
        );

        $("recordPaymentModal")
            ?.classList.add(
                "show"
            );

        $("recordPaymentModal")
            ?.setAttribute(
                "aria-hidden",
                "false"
            );
    }


    /* =====================================================
       CLOSE RECORD PAYMENT
       ===================================================== */

    function closeRecordPaymentModal() {

        $("recordPaymentModal")
            ?.classList.remove(
                "show"
            );

        $("recordPaymentModal")
            ?.setAttribute(
                "aria-hidden",
                "true"
            );
    }


    /* =====================================================
       RENDER INVOICES
       ===================================================== */

    function renderInvoices() {

        const tbody =
            $("invoicesTableBody");

        if (!tbody) return;

        const search =
            getValue(
                "invoiceSearch"
            ).toLowerCase();

        const status =
            getValue(
                "invoiceStatusFilter"
            );

        const dateFilter =
            getValue(
                "invoiceDateFilter"
            );

        let filtered =
            [...invoices];

        if (search) {

            filtered =
                filtered.filter(
                    invoice => {

                        const text =
                            [
                                invoice.invoiceNumber,
                                invoice.customerName,
                                invoice.customerMobile,
                                invoice.bookingId,
                                invoice.destination
                            ]
                            .join(" ")
                            .toLowerCase();

                        return text.includes(
                            search
                        );
                    }
                );
        }


        if (status) {

            filtered =
                filtered.filter(
                    invoice =>
                        invoice.status ===
                        status
                );
        }


        if (dateFilter) {

            filtered =
                filtered.filter(
                    invoice =>
                        matchesDateFilter(
                            invoice.invoiceDate,
                            dateFilter
                        )
                );
        }


        if (!filtered.length) {

            tbody.innerHTML = `
                <tr>

                    <td
                        colspan="9"
                        class="empty-state"
                    >

                        <div class="empty-state-content">

                            <div class="empty-state-icon">
                                📄
                            </div>

                            <h3>
                                No invoices found
                            </h3>

                            <p>
                                No invoice matches the
                                selected filters.
                            </p>

                        </div>

                    </td>

                </tr>
            `;

            return;
        }


        tbody.innerHTML =
            filtered.map(
                invoice =>
                    renderInvoiceRow(
                        invoice
                    )
            ).join("");
    }


    /* =====================================================
       RENDER INVOICE ROW
       ===================================================== */

    function renderInvoiceRow(
        invoice
    ) {

        const status =
            invoice.status ||
            "draft";

        const received =
            number(
                invoice.amountReceived
            );

        const total =
            number(
                invoice.grandTotal
            );

        const balance =
            Math.max(
                0,
                number(
                    invoice.balanceDue ??
                    total - received
                )
            );

        return `
            <tr data-invoice-id="${escapeHTML(invoice.id)}">

                <td>
                    <strong>
                        ${escapeHTML(
                            invoice.invoiceNumber ||
                            "-"
                        )}
                    </strong>
                </td>

                <td>
                    ${formatDate(
                        invoice.invoiceDate
                    )}
                </td>

                <td>

                    <strong>
                        ${escapeHTML(
                            invoice.customerName ||
                            "-"
                        )}
                    </strong>

                    ${
                        invoice.customerMobile
                            ? `
                                <small>
                                    ${escapeHTML(
                                        invoice.customerMobile
                                    )}
                                </small>
                              `
                            : ""
                    }

                </td>

                <td>
                    ${escapeHTML(
                        invoice.bookingId ||
                        invoice.destination ||
                        "-"
                    )}
                </td>

                <td>
                    ${money(total)}
                </td>

                <td>
                    ${money(received)}
                </td>

                <td>
                    <strong>
                        ${money(balance)}
                    </strong>
                </td>

                <td>
                    ${getStatusBadge(status)}
                </td>

                <td>

                    <div class="table-actions">

                        <button
                            type="button"
                            class="btn btn-sm btn-secondary btn-view-invoice"
                            data-id="${escapeHTML(invoice.id)}"
                            title="View Invoice"
                        >
                            View
                        </button>

                        ${
                            balance > 0 &&
                            status !== "cancelled"
                                ? `
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-primary btn-record-payment"
                                        data-id="${escapeHTML(invoice.id)}"
                                        title="Record Payment"
                                    >
                                        Payment
                                    </button>
                                  `
                                : ""
                        }

                        <button
                            type="button"
                            class="btn btn-sm btn-secondary btn-edit-invoice"
                            data-id="${escapeHTML(invoice.id)}"
                            title="Edit Invoice"
                        >
                            Edit
                        </button>

                    </div>

                </td>

            </tr>
        `;
    }


    /* =====================================================
       STATUS BADGE
       ===================================================== */

    function getStatusBadge(
        status
    ) {

        const labels = {
            draft: "Draft",
            unpaid: "Unpaid",
            partial: "Partially Paid",
            paid: "Paid",
            overdue: "Overdue",
            cancelled: "Cancelled"
        };

        const label =
            labels[status] ||
            status;

        return `
            <span
                class="status-badge status-${escapeHTML(status)}"
            >
                ${escapeHTML(label)}
            </span>
        `;
    }


    /* =====================================================
       DATE FILTER
       ===================================================== */

    function matchesDateFilter(
        value,
        filter
    ) {

        if (!value) return false;

        const invoiceDate =
            new Date(value);

        if (
            isNaN(
                invoiceDate.getTime()
            )
        ) {
            return false;
        }

        const now =
            new Date();

        switch (filter) {

            case "today":

                return (
                    invoiceDate.toDateString() ===
                    now.toDateString()
                );


            case "7days": {

                const date =
                    new Date();

                date.setDate(
                    date.getDate() - 7
                );

                return invoiceDate >= date;
            }


            case "30days": {

                const date =
                    new Date();

                date.setDate(
                    date.getDate() - 30
                );

                return invoiceDate >= date;
            }


            case "thisMonth":

                return (
                    invoiceDate.getMonth() ===
                    now.getMonth() &&
                    invoiceDate.getFullYear() ===
                    now.getFullYear()
                );


            case "lastMonth": {

                const date =
                    new Date(
                        now.getFullYear(),
                        now.getMonth() - 1,
                        1
                    );

                return (
                    invoiceDate.getMonth() ===
                    date.getMonth() &&
                    invoiceDate.getFullYear() ===
                    date.getFullYear()
                );
            }


            default:
                return true;
        }
    }


    /* =====================================================
       SUMMARY
       ===================================================== */

    function updateSummary() {

        let billed = 0;
        let received = 0;
        let outstanding = 0;

        invoices.forEach(
            invoice => {

                billed +=
                    number(
                        invoice.grandTotal
                    );

                received +=
                    number(
                        invoice.amountReceived
                    );

                outstanding +=
                    Math.max(
                        0,
                        number(
                            invoice.balanceDue ??
                            invoice.grandTotal -
                            invoice.amountReceived
                        )
                    );
            }
        );

        updateText(
            "invoiceTotalCount",
            invoices.length
        );

        updateText(
            "invoiceTotalBilled",
            money(billed)
        );

        updateText(
            "invoiceTotalReceived",
            money(received)
        );

        updateText(
            "invoiceTotalOutstanding",
            money(outstanding)
        );
    }


    /* =====================================================
       VIEW INVOICE
       ===================================================== */

    function viewInvoice(
        invoiceId
    ) {

        const invoice =
            invoices.find(
                item =>
                    item.id === invoiceId
            );

        if (!invoice) return;

        currentInvoice =
            invoice;

        const container =
            $("invoiceDetailsContainer");

        if (!container) return;

        const total =
            number(
                invoice.grandTotal
            );

        const received =
            number(
                invoice.amountReceived
            );

        const balance =
            Math.max(
                0,
                number(
                    invoice.balanceDue ??
                    total - received
                )
            );

        container.innerHTML = `

            <div class="invoice-view-header">

                <div>

                    <h3>
                        ${escapeHTML(
                            invoice.invoiceNumber ||
                            "Invoice"
                        )}
                    </h3>

                    <p>
                        Date:
                        ${formatDate(
                            invoice.invoiceDate
                        )}
                    </p>

                </div>

                <div>
                    ${getStatusBadge(
                        invoice.status ||
                        "draft"
                    )}
                </div>

            </div>


            <div class="invoice-view-customer">

                <h4>
                    Customer
                </h4>

                <p>
                    <strong>
                        ${escapeHTML(
                            invoice.customerName ||
                            "-"
                        )}
                    </strong>
                </p>

                ${
                    invoice.customerMobile
                        ? `<p>${escapeHTML(invoice.customerMobile)}</p>`
                        : ""
                }

                ${
                    invoice.customerEmail
                        ? `<p>${escapeHTML(invoice.customerEmail)}</p>`
                        : ""
                }

                ${
                    invoice.customerAddress
                        ? `<p>${escapeHTML(invoice.customerAddress)}</p>`
                        : ""
                }

            </div>


            <div class="invoice-view-items">

                <h4>
                    Invoice Items
                </h4>

                <table class="data-table">

                    <thead>

                        <tr>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Tax</th>
                            <th>Amount</th>
                        </tr>

                    </thead>

                    <tbody>

                        ${
                            Array.isArray(
                                invoice.items
                            )
                                ? invoice.items.map(
                                    item => `
                                        <tr>

                                            <td>
                                                ${escapeHTML(
                                                    item.description ||
                                                    "-"
                                                )}
                                            </td>

                                            <td>
                                                ${number(
                                                    item.qty
                                                )}
                                            </td>

                                            <td>
                                                ${money(
                                                    item.rate
                                                )}
                                            </td>

                                            <td>
                                                ${number(
                                                    item.taxRate
                                                )}%
                                            </td>

                                            <td>
                                                ${money(
                                                    item.amount
                                                )}
                                            </td>

                                        </tr>
                                    `
                                ).join("")
                                : ""
                        }

                    </tbody>

                </table>

            </div>


            <div class="invoice-view-total">

                <div>
                    <span>
                        Subtotal
                    </span>

                    <strong>
                        ${money(
                            invoice.subtotal
                        )}
                    </strong>
                </div>

                <div>
                    <span>
                        Discount
                    </span>

                    <strong>
                        ${money(
                            invoice.discount
                        )}
                    </strong>
                </div>

                <div>
                    <span>
                        Tax
                    </span>

                    <strong>
                        ${money(
                            invoice.tax
                        )}
                    </strong>
                </div>

                <div>
                    <span>
                        Grand Total
                    </span>

                    <strong>
                        ${money(total)}
                    </strong>
                </div>

                <div>
                    <span>
                        Amount Received
                    </span>

                    <strong>
                        ${money(received)}
                    </strong>
                </div>

                <div>
                    <span>
                        Balance Due
                    </span>

                    <strong>
                        ${money(balance)}
                    </strong>
                </div>

            </div>


            ${
                Array.isArray(
                    invoice.paymentHistory
                ) &&
                invoice.paymentHistory.length
                    ? `
                        <div class="invoice-payment-history">

                            <h4>
                                Payment History
                            </h4>

                            <table class="data-table">

                                <thead>

                                    <tr>
                                        <th>Date</th>
                                        <th>Method</th>
                                        <th>Reference</th>
                                        <th>Amount</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    ${invoice.paymentHistory.map(
                                        payment => `
                                            <tr>

                                                <td>
                                                    ${formatDate(
                                                        payment.paymentDate
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
                                                    ${money(
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
                    : ""
            }

        `;

        $("viewInvoiceModal")
            ?.classList.add(
                "show"
            );

        $("viewInvoiceModal")
            ?.setAttribute(
                "aria-hidden",
                "false"
            );
    }


    /* =====================================================
       CLOSE VIEW
       ===================================================== */

    function closeViewInvoiceModal() {

        $("viewInvoiceModal")
            ?.classList.remove(
                "show"
            );

        $("viewInvoiceModal")
            ?.setAttribute(
                "aria-hidden",
                "true"
            );
    }


    /* =====================================================
       EDIT INVOICE
       ===================================================== */

    function editInvoice(
        invoiceId
    ) {

        const invoice =
            invoices.find(
                item =>
                    item.id === invoiceId
            );

        if (!invoice) return;

        editingInvoiceId =
            invoice.id;

        setValue(
            "invoiceId",
            invoice.id
        );

        setValue(
            "invoiceNumber",
            invoice.invoiceNumber
        );

        setValue(
            "invoiceDate",
            invoice.invoiceDate
        );

        setValue(
            "invoiceDueDate",
            invoice.dueDate
        );

        setValue(
            "invoiceCustomer",
            invoice.customerId
        );

        populateBookingDropdown(
            invoice.customerId
        );

        setValue(
            "invoiceBooking",
            invoice.bookingId
        );

        setValue(
            "invoiceCustomerName",
            invoice.customerName
        );

        setValue(
            "invoiceCustomerMobile",
            invoice.customerMobile
        );

        setValue(
            "invoiceCustomerEmail",
            invoice.customerEmail
        );

        setValue(
            "invoiceCustomerGST",
            invoice.customerGST
        );

        setValue(
            "invoiceCustomerAddress",
            invoice.customerAddress
        );

        setValue(
            "invoicePackage",
            invoice.packageId
        );

        setValue(
            "invoiceDestination",
            invoice.destination
        );

        setValue(
            "invoicePax",
            invoice.pax
        );

        setValue(
            "invoiceDiscount",
            invoice.discount || 0
        );

        setValue(
            "invoiceAmountReceived",
            invoice.amountReceived || 0
        );

        setValue(
            "invoicePaymentDate",
            invoice.paymentDate || today()
        );

        setValue(
            "invoicePaymentMethod",
            invoice.paymentMethod || ""
        );

        setValue(
            "invoicePaymentReference",
            invoice.paymentReference || ""
        );

        setValue(
            "invoiceStatus",
            invoice.status || "draft"
        );

        setValue(
            "invoicePaymentStatus",
            invoice.paymentStatus || "pending"
        );

        setValue(
            "invoiceNotes",
            invoice.notes || ""
        );


        const body =
            $("invoiceItemsBody");

        if (body) {

            body.innerHTML = "";

            const items =
                Array.isArray(
                    invoice.items
                )
                    ? invoice.items
                    : [];

            if (!items.length) {

                body.innerHTML =
                    createItemRowHTML(
                        0
                    );

            } else {

                items.forEach(
                    (item, index) => {

                        body.insertAdjacentHTML(
                            "beforeend",
                            createItemRowHTML(
                                index
                            )
                        );

                        const row =
                            body.lastElementChild;

                        row.querySelector(
                            '[name="itemDescription[]"]'
                        ).value =
                            item.description || "";

                        row.querySelector(
                            '[name="itemHSN[]"]'
                        ).value =
                            item.hsn || "";

                        row.querySelector(
                            '[name="itemQty[]"]'
                        ).value =
                            item.qty || 1;

                        row.querySelector(
                            '[name="itemRate[]"]'
                        ).value =
                            item.rate || 0;

                        row.querySelector(
                            '[name="itemTax[]"]'
                        ).value =
                            item.taxRate || 0;
                    }
                );
            }
        }


        const title =
            $("invoiceModalTitle");

        if (title) {
            title.textContent =
                "Edit Invoice";
        }

        $("invoiceModal")
            ?.classList.add(
                "show"
            );

        $("invoiceModal")
            ?.setAttribute(
                "aria-hidden",
                "false"
            );

        calculateInvoice();
    }


    /* =====================================================
       PRINT / PDF HOOK
       ===================================================== */

    function printInvoice() {

        if (!currentInvoice) {
            showMessage(
                "Please select an invoice first.",
                "warning"
            );
            return;
        }

        /*
         * Future PDF module will expose:
         *
         * window.InvoicePDF.print(invoice)
         *
         */

        if (
            window.InvoicePDF &&
            typeof window.InvoicePDF.print ===
                "function"
        ) {

            window.InvoicePDF.print(
                currentInvoice
            );

            return;
        }

        /*
         * Fallback until PDF JS is added.
         */

        window.print();
    }


    /* =====================================================
       EVENT DELEGATION - TABLE
       ===================================================== */

    function handleTableClick(
        event
    ) {

        const viewButton =
            event.target.closest(
                ".btn-view-invoice"
            );

        if (viewButton) {

            viewInvoice(
                viewButton.dataset.id
            );

            return;
        }


        const paymentButton =
            event.target.closest(
                ".btn-record-payment"
            );

        if (paymentButton) {

            openRecordPayment(
                paymentButton.dataset.id
            );

            return;
        }


        const editButton =
            event.target.closest(
                ".btn-edit-invoice"
            );

        if (editButton) {

            editInvoice(
                editButton.dataset.id
            );

            return;
        }
    }


    /* =====================================================
       EVENT LISTENERS
       ===================================================== */

    function bindEvents() {

        $("btnCreateInvoice")
            ?.addEventListener(
                "click",
                openCreateInvoice
            );

        $("btnCreateFirstInvoice")
            ?.addEventListener(
                "click",
                openCreateInvoice
            );

        $("closeInvoiceModal")
            ?.addEventListener(
                "click",
                closeInvoiceModal
            );

        $("btnCancelInvoice")
            ?.addEventListener(
                "click",
                closeInvoiceModal
            );

        $("invoiceForm")
            ?.addEventListener(
                "submit",
                saveInvoice
            );

        $("btnSaveInvoiceDraft")
            ?.addEventListener(
                "click",
                () => {

                    setValue(
                        "invoiceStatus",
                        "draft"
                    );

                    saveInvoice();
                }
            );

        $("invoiceCustomer")
            ?.addEventListener(
                "change",
                handleCustomerChange
            );

        $("invoiceBooking")
            ?.addEventListener(
                "change",
                handleBookingChange
            );

        $("invoicePackage")
            ?.addEventListener(
                "change",
                handlePackageChange
            );

        $("btnAddInvoiceItem")
            ?.addEventListener(
                "click",
                addInvoiceItem
            );

        $("invoiceItemsBody")
            ?.addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            ".btn-remove-invoice-item"
                        );

                    if (button) {
                        removeInvoiceItem(
                            button
                        );
                    }
                }
            );

        $("invoiceItemsBody")
            ?.addEventListener(
                "input",
                calculateInvoice
            );

        $("invoiceDiscount")
            ?.addEventListener(
                "input",
                calculateInvoice
            );

        $("invoiceAmountReceived")
            ?.addEventListener(
                "input",
                calculateInvoice
            );

        $("invoiceSearch")
            ?.addEventListener(
                "input",
                renderInvoices
            );

        $("invoiceStatusFilter")
            ?.addEventListener(
                "change",
                renderInvoices
            );

        $("invoiceDateFilter")
            ?.addEventListener(
                "change",
                renderInvoices
            );

        $("invoicesTableBody")
            ?.addEventListener(
                "click",
                handleTableClick
            );


        /* View Invoice */

        $("closeViewInvoiceModal")
            ?.addEventListener(
                "click",
                closeViewInvoiceModal
            );

        $("btnCloseInvoiceDetails")
            ?.addEventListener(
                "click",
                closeViewInvoiceModal
            );

        $("btnPrintInvoice")
            ?.addEventListener(
                "click",
                printInvoice
            );


        /* Record Payment */

        $("closeRecordPaymentModal")
            ?.addEventListener(
                "click",
                closeRecordPaymentModal
            );

        $("btnCancelRecordPayment")
            ?.addEventListener(
                "click",
                closeRecordPaymentModal
            );

        $("recordPaymentForm")
            ?.addEventListener(
                "submit",
                recordPayment
            );


        /* Modal overlays */

        document
            .querySelectorAll(
                "#invoiceModal .modal-overlay"
            )
            .forEach(
                overlay => {

                    overlay.addEventListener(
                        "click",
                        closeInvoiceModal
                    );
                }
            );

        document
            .querySelectorAll(
                "#viewInvoiceModal .modal-overlay"
            )
            .forEach(
                overlay => {

                    overlay.addEventListener(
                        "click",
                        closeViewInvoiceModal
                    );
                }
            );

        document
            .querySelectorAll(
                "#recordPaymentModal .modal-overlay"
            )
            .forEach(
                overlay => {

                    overlay.addEventListener(
                        "click",
                        closeRecordPaymentModal
                    );
                }
            );


        /* Escape key */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !==
                    "Escape"
                ) {
                    return;
                }

                closeInvoiceModal();

                closeViewInvoiceModal();

                closeRecordPaymentModal();
            }
        );
    }


    /* =====================================================
       MODULE INITIALIZATION
       ===================================================== */

    async function initInvoicesModule() {

        bindEvents();

        await loadInvoiceModule();
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.InvoicesModule = {

        init:
            initInvoicesModule,

        load:
            loadInvoiceModule,

        create:
            openCreateInvoice,

        edit:
            editInvoice,

        view:
            viewInvoice,

        recordPayment:
            openRecordPayment,

        refresh:
            loadInvoiceModule,

        calculate:
            calculateInvoice
    };


    /*
     * Automatically initialize when this module
     * is loaded directly.
     *
     * If app.js controls module initialization,
     * duplicate initialization is prevented.
     */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => {

                if (
                    $("invoicesModule")
                ) {
                    initInvoicesModule();
                }
            },
            {
                once: true
            }
        );

    } else {

        if (
            $("invoicesModule")
        ) {
            initInvoicesModule();
        }
    }

})();
