/* =========================================================
   MY TOUR MITRA ERP
   QUOTATION MODULE
   File: modules/quotations/quotation.js
   ========================================================= */

"use strict";


/* =========================================================
   1. MODULE STATE
   ========================================================= */

const QuotationsModule = {

    quotations: [],
    filteredQuotations: [],

    customers: [],
    packages: [],

    currentQuotationId: null,
    deletingQuotationId: null,

    initialized: false,
    loading: false

};


/* =========================================================
   2. FIRESTORE COLLECTION
   ========================================================= */

const QUOTATIONS_COLLECTION = "quotations";
const CUSTOMERS_COLLECTION = "customers";
const PACKAGES_COLLECTION = "packages";


/* =========================================================
   3. DOM HELPERS
   ========================================================= */

function quotationEl(id) {

    return document.getElementById(id);

}


function quotationQuery(selector, parent = document) {

    return parent.querySelector(selector);

}


function quotationQueryAll(selector, parent = document) {

    return Array.from(
        parent.querySelectorAll(selector)
    );

}


/* =========================================================
   4. FIREBASE HELPER
   ========================================================= */

function getQuotationsFirestore() {

    if (
        typeof db !== "undefined" &&
        db
    ) {

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
   5. INITIALIZE MODULE
   ========================================================= */

async function initQuotationsModule() {

    if (
        QuotationsModule.initialized
    ) {

        await loadQuotationData();

        return;

    }


    bindQuotationEvents();

    QuotationsModule.initialized = true;

    setQuotationToday();

    await loadQuotationData();

}


/* =========================================================
   6. EVENT BINDINGS
   ========================================================= */

function bindQuotationEvents() {


    /* NEW QUOTATION */

    const newButton =
        quotationEl(
            "quotation-new-btn"
        );

    if (newButton) {

        newButton.addEventListener(
            "click",
            openNewQuotation
        );

    }


    /* REFRESH */

    const refreshButton =
        quotationEl(
            "quotation-refresh-btn"
        );

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                await loadQuotationData();

            }
        );

    }


    /* CLOSE FORM */

    const closeButton =
        quotationEl(
            "quotation-close-btn"
        );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeQuotationForm
        );

    }


    /* CANCEL */

    const cancelButton =
        quotationEl(
            "quotation-cancel-btn"
        );

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeQuotationForm
        );

    }


    /* FORM */

    const form =
        quotationEl(
            "quotation-form"
        );

    if (form) {

        form.addEventListener(
            "submit",
            handleQuotationSubmit
        );

    }


    /* SEARCH */

    const search =
        quotationEl(
            "quotation-search"
        );

    if (search) {

        search.addEventListener(
            "input",
            applyQuotationFilters
        );

    }


    /* STATUS FILTER */

    const statusFilter =
        quotationEl(
            "quotation-status-filter"
        );

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyQuotationFilters
        );

    }


    /* DATE FILTER */

    const dateFilter =
        quotationEl(
            "quotation-date-filter"
        );

    if (dateFilter) {

        dateFilter.addEventListener(
            "change",
            applyQuotationFilters
        );

    }


    /* CUSTOMER */

    const customerSelect =
        quotationEl(
            "quotation-customer"
        );

    if (customerSelect) {

        customerSelect.addEventListener(
            "change",
            handleQuotationCustomerChange
        );

    }


    /* PACKAGE */

    const packageSelect =
        quotationEl(
            "quotation-package"
        );

    if (packageSelect) {

        packageSelect.addEventListener(
            "change",
            handleQuotationPackageChange
        );

    }


    /* ADD ITINERARY DAY */

    const addDayButton =
        quotationEl(
            "quotation-add-day-btn"
        );

    if (addDayButton) {

        addDayButton.addEventListener(
            "click",
            addQuotationItineraryDay
        );

    }


    /* ADD HOTEL */

    const addHotelButton =
        quotationEl(
            "quotation-add-hotel-btn"
        );

    if (addHotelButton) {

        addHotelButton.addEventListener(
            "click",
            addQuotationHotel
        );

    }


    /* ADD CAB */

    const addCabButton =
        quotationEl(
            "quotation-add-cab-btn"
        );

    if (addCabButton) {

        addCabButton.addEventListener(
            "click",
            addQuotationCab
        );

    }


    /* ADD PAYMENT */

    const addPaymentButton =
        quotationEl(
            "quotation-add-payment-btn"
        );

    if (addPaymentButton) {

        addPaymentButton.addEventListener(
            "click",
            addQuotationPayment
        );

    }


    /* PRICING INPUTS */

    [
        "quotation-base-price",
        "quotation-extra-charges",
        "quotation-discount",
        "quotation-gst-rate",
        "quotation-round-off"
    ].forEach(id => {

        const element =
            quotationEl(id);

        if (element) {

            element.addEventListener(
                "input",
                calculateQuotationTotals
            );

            element.addEventListener(
                "change",
                calculateQuotationTotals
            );

        }

    });


    /* PAX */

    [
        "quotation-adults",
        "quotation-children",
        "quotation-infants"
    ].forEach(id => {

        const element =
            quotationEl(id);

        if (element) {

            element.addEventListener(
                "input",
                calculateQuotationPax
            );

        }

    });


    /* TABLE ACTIONS */

    const tableBody =
        quotationEl(
            "quotations-table-body"
        );

    if (tableBody) {

        tableBody.addEventListener(
            "click",
            handleQuotationTableAction
        );

    }


    /* ITINERARY ACTIONS */

    const itineraryContainer =
        quotationEl(
            "quotation-itinerary-container"
        );

    if (itineraryContainer) {

        itineraryContainer.addEventListener(
            "click",
            handleQuotationItineraryAction
        );

    }


    /* HOTEL ACTIONS */

    const hotelsBody =
        quotationEl(
            "quotation-hotels-body"
        );

    if (hotelsBody) {

        hotelsBody.addEventListener(
            "click",
            handleQuotationHotelAction
        );

    }


    /* CAB ACTIONS */

    const cabsBody =
        quotationEl(
            "quotation-cabs-body"
        );

    if (cabsBody) {

        cabsBody.addEventListener(
            "click",
            handleQuotationCabAction
        );

    }


    /* PAYMENT ACTIONS */

    const paymentsBody =
        quotationEl(
            "quotation-payments-body"
        );

    if (paymentsBody) {

        paymentsBody.addEventListener(
            "click",
            handleQuotationPaymentAction
        );

    }


    /* DELETE MODAL */

    const deleteCancel =
        quotationEl(
            "quotation-delete-cancel"
        );

    if (deleteCancel) {

        deleteCancel.addEventListener(
            "click",
            closeQuotationDeleteModal
        );

    }


    const deleteConfirm =
        quotationEl(
            "quotation-delete-confirm"
        );

    if (deleteConfirm) {

        deleteConfirm.addEventListener(
            "click",
            confirmDeleteQuotation
        );

    }


    /* PREVIEW */

    const previewButton =
        quotationEl(
            "quotation-preview-btn"
        );

    if (previewButton) {

        previewButton.addEventListener(
            "click",
            previewQuotation
        );

    }

}


/* =========================================================
   7. LOAD ALL QUOTATION DATA
   ========================================================= */

async function loadQuotationData() {

    showQuotationLoading(true);

    try {

        await Promise.all([
            loadQuotations(),
            loadQuotationCustomers(),
            loadQuotationPackages()
        ]);

        populateQuotationCustomerSelect();
        populateQuotationPackageSelect();

        applyQuotationFilters();

    }
    catch (error) {

        console.error(
            "Error loading quotation data:",
            error
        );

        showQuotationMessage(
            "Unable to load quotation data.",
            "error"
        );

    }
    finally {

        showQuotationLoading(false);

    }

}


/* =========================================================
   8. LOAD QUOTATIONS
   ========================================================= */

async function loadQuotations() {

    const firestore =
        getQuotationsFirestore();

    if (!firestore) {

        console.warn(
            "Firestore instance not found."
        );

        QuotationsModule.quotations = [];

        return;

    }


    let snapshot;


    if (
        typeof collection === "function" &&
        typeof getDocs === "function"
    ) {

        snapshot =
            await getDocs(
                collection(
                    firestore,
                    QUOTATIONS_COLLECTION
                )
            );

    }
    else if (
        firestore.collection
    ) {

        snapshot =
            await firestore
                .collection(
                    QUOTATIONS_COLLECTION
                )
                .get();

    }
    else {

        throw new Error(
            "Firestore API unavailable."
        );

    }


    const quotations = [];


    if (
        snapshot &&
        typeof snapshot.forEach === "function"
    ) {

        snapshot.forEach(
            documentSnapshot => {

                const data =
                    typeof documentSnapshot.data === "function"
                        ? documentSnapshot.data()
                        : documentSnapshot.data;

                quotations.push({

                    firestoreId:
                        documentSnapshot.id,

                    ...data

                });

            }
        );

    }


    QuotationsModule.quotations =
        quotations.sort(
            (a, b) =>
                quotationDateValue(
                    b.createdAt ||
                    b.quotationDate
                ) -
                quotationDateValue(
                    a.createdAt ||
                    a.quotationDate
                )
        );

}


/* =========================================================
   9. LOAD CUSTOMERS
   ========================================================= */

async function loadQuotationCustomers() {

    const firestore =
        getQuotationsFirestore();

    if (!firestore) {

        QuotationsModule.customers = [];

        return;

    }


    let snapshot;


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
    else {

        throw new Error(
            "Firestore API unavailable."
        );

    }


    const customers = [];


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


    QuotationsModule.customers =
        customers;

}


/* =========================================================
   10. LOAD PACKAGES
   ========================================================= */

async function loadQuotationPackages() {

    const firestore =
        getQuotationsFirestore();

    if (!firestore) {

        QuotationsModule.packages = [];

        return;

    }


    let snapshot;


    if (
        typeof collection === "function" &&
        typeof getDocs === "function"
    ) {

        snapshot =
            await getDocs(
                collection(
                    firestore,
                    PACKAGES_COLLECTION
                )
            );

    }
    else if (
        firestore.collection
    ) {

        snapshot =
            await firestore
                .collection(
                    PACKAGES_COLLECTION
                )
                .get();

    }
    else {

        throw new Error(
            "Firestore API unavailable."
        );

    }


    const packages = [];


    snapshot.forEach(
        documentSnapshot => {

            const data =
                typeof documentSnapshot.data === "function"
                    ? documentSnapshot.data()
                    : documentSnapshot.data;

            packages.push({

                firestoreId:
                    documentSnapshot.id,

                ...data

            });

        }
    );


    QuotationsModule.packages =
        packages;

}


/* =========================================================
   11. CUSTOMER DROPDOWN
   ========================================================= */

function populateQuotationCustomerSelect() {

    const select =
        quotationEl(
            "quotation-customer"
        );

    if (!select) {

        return;

    }


    select.innerHTML = `
        <option value="">
            Select Customer
        </option>
    `;


    QuotationsModule.customers
        .sort(
            (a, b) =>
                String(
                    a.name || ""
                ).localeCompare(
                    String(
                        b.name || ""
                    )
                )
        )
        .forEach(customer => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                customer.firestoreId ||
                customer.customerId ||
                "";

            option.textContent =
                `${customer.name || "Unnamed"}${
                    customer.customerId
                        ? ` (${customer.customerId})`
                        : ""
                }`;

            select.appendChild(option);

        });

}


/* =========================================================
   12. PACKAGE DROPDOWN
   ========================================================= */

function populateQuotationPackageSelect() {

    const select =
        quotationEl(
            "quotation-package"
        );

    if (!select) {

        return;

    }


    select.innerHTML = `
        <option value="">
            Select Package
        </option>
    `;


    QuotationsModule.packages
        .sort(
            (a, b) =>
                String(
                    a.packageName ||
                    a.name ||
                    ""
                ).localeCompare(
                    String(
                        b.packageName ||
                        b.name ||
                        ""
                    )
                )
        )
        .forEach(pkg => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                pkg.firestoreId ||
                pkg.packageId ||
                "";

            option.textContent =
                `${
                    pkg.packageName ||
                    pkg.name ||
                    "Unnamed Package"
                }${
                    pkg.packageId
                        ? ` (${pkg.packageId})`
                        : ""
                }`;

            select.appendChild(option);

        });

}


/* =========================================================
   13. CUSTOMER CHANGE
   ========================================================= */

function handleQuotationCustomerChange(event) {

    const selectedId =
        event.target.value;

    const customer =
        QuotationsModule.customers.find(
            item =>
                item.firestoreId === selectedId ||
                item.customerId === selectedId
        );


    if (!customer) {

        clearQuotationCustomerFields();

        return;

    }


    setQuotationValue(
        "quotation-customer-id",
        customer.customerId || ""
    );

    setQuotationValue(
        "quotation-customer-name",
        customer.name || ""
    );

    setQuotationValue(
        "quotation-customer-mobile",
        customer.mobile || ""
    );

    setQuotationValue(
        "quotation-customer-whatsapp",
        customer.whatsapp || ""
    );

    setQuotationValue(
        "quotation-customer-email",
        customer.email || ""
    );


    const address = [
        customer.address,
        customer.city,
        customer.state,
        customer.country
    ]
        .filter(Boolean)
        .join(", ");


    setQuotationValue(
        "quotation-customer-address",
        address
    );

}


/* =========================================================
   14. PACKAGE CHANGE
   ========================================================= */

function handleQuotationPackageChange(event) {

    const selectedId =
        event.target.value;

    const pkg =
        QuotationsModule.packages.find(
            item =>
                item.firestoreId === selectedId ||
                item.packageId === selectedId
        );


    if (!pkg) {

        clearQuotationPackageFields();

        return;

    }


    setQuotationValue(
        "quotation-package-id",
        pkg.packageId || ""
    );


    setQuotationValue(
        "quotation-destination",
        pkg.destination ||
        pkg.destinations ||
        pkg.location ||
        ""
    );


    /*
     * Package duration
     */

    const days =
        Number(
            pkg.days ||
            pkg.durationDays ||
            0
        );

    const nights =
        Number(
            pkg.nights ||
            pkg.durationNights ||
            Math.max(
                days - 1,
                0
            )
        );


    setQuotationValue(
        "quotation-days",
        days || ""
    );

    setQuotationValue(
        "quotation-nights",
        nights || ""
    );


    /*
     * Package price
     */

    const price =
        Number(
            pkg.price ||
            pkg.packagePrice ||
            pkg.totalPrice ||
            0
        );


    if (price > 0) {

        setQuotationValue(
            "quotation-base-price",
            price
        );

    }


    /*
     * Package itinerary
     */

    const itinerary =
        Array.isArray(
            pkg.itinerary
        )
            ? pkg.itinerary
            : [];


    if (itinerary.length) {

        loadPackageItinerary(
            itinerary
        );

    }


    /*
     * Package inclusions
     */

    if (
        pkg.inclusions
    ) {

        setQuotationValue(
            "quotation-inclusions",
            formatListValue(
                pkg.inclusions
            )
        );

    }


    /*
     * Package exclusions
     */

    if (
        pkg.exclusions
    ) {

        setQuotationValue(
            "quotation-exclusions",
            formatListValue(
                pkg.exclusions
            )
        );

    }


    calculateQuotationTotals();

}


/* =========================================================
   15. CLEAR CUSTOMER
   ========================================================= */

function clearQuotationCustomerFields() {

    [
        "quotation-customer-id",
        "quotation-customer-name",
        "quotation-customer-mobile",
        "quotation-customer-whatsapp",
        "quotation-customer-email",
        "quotation-customer-address"
    ].forEach(id => {

        setQuotationValue(
            id,
            ""
        );

    });

}


/* =========================================================
   16. CLEAR PACKAGE
   ========================================================= */

function clearQuotationPackageFields() {

    [
        "quotation-package-id",
        "quotation-destination"
    ].forEach(id => {

        setQuotationValue(
            id,
            ""
        );

    });

}


/* =========================================================
   17. NEW QUOTATION
   ========================================================= */

function openNewQuotation() {

    QuotationsModule.currentQuotationId =
        null;


    const formCard =
        quotationEl(
            "quotation-form-card"
        );

    const listCard =
        quotationEl(
            "quotations-list-card"
        );


    if (listCard) {

        listCard.classList.add(
            "hidden"
        );

    }


    if (formCard) {

        formCard.classList.remove(
            "hidden"
        );

    }


    resetQuotationForm();

}


/* =========================================================
   18. RESET FORM
   ========================================================= */

function resetQuotationForm() {

    const form =
        quotationEl(
            "quotation-form"
        );

    if (form) {

        form.reset();

    }


    setQuotationValue(
        "quotation-id",
        ""
    );


    setQuotationValue(
        "quotation-display-id",
        generateQuotationId()
    );


    setQuotationToday();


    setQuotationValue(
        "quotation-status",
        "Draft"
    );


    clearQuotationCustomerFields();
    clearQuotationPackageFields();


    const itinerary =
        quotationEl(
            "quotation-itinerary-container"
        );

    if (itinerary) {

        itinerary.innerHTML = `
            <div
                id="quotation-itinerary-empty"
                class="nested-empty-state">

                <div class="empty-icon">
                    🗓️
                </div>

                <strong>
                    No itinerary added
                </strong>

                <p>
                    Select a package or add
                    itinerary days manually.
                </p>

            </div>
        `;

    }


    [
        "quotation-hotels-body",
        "quotation-cabs-body",
        "quotation-payments-body"
    ].forEach(id => {

        const element =
            quotationEl(id);

        if (element) {

            element.innerHTML = "";

        }

    });


    [
        "quotation-hotels-empty",
        "quotation-cabs-empty",
        "quotation-payments-empty"
    ].forEach(id => {

        const element =
            quotationEl(id);

        if (element) {

            element.classList.remove(
                "hidden"
            );

        }

    });


    calculateQuotationPax();
    calculateQuotationTotals();

}


/* =========================================================
   19. CLOSE FORM
   ========================================================= */

function closeQuotationForm() {

    const formCard =
        quotationEl(
            "quotation-form-card"
        );

    const listCard =
        quotationEl(
            "quotations-list-card"
        );


    if (formCard) {

        formCard.classList.add(
            "hidden"
        );

    }


    if (listCard) {

        listCard.classList.remove(
            "hidden"
        );

    }


    QuotationsModule.currentQuotationId =
        null;

}


/* =========================================================
   20. GENERATE QUOTATION ID
   ========================================================= */

function generateQuotationId() {

    const year =
        new Date()
            .getFullYear();

    const existingNumbers =
        QuotationsModule.quotations
            .map(
                quotation =>
                    String(
                        quotation.quotationId || ""
                    )
            )
            .map(
                id => {

                    const match =
                        id.match(
                            /(\d+)$/
                        );

                    return match
                        ? Number(match[1])
                        : 0;

                }
            );


    const nextNumber =
        Math.max(
            0,
            ...existingNumbers
        ) + 1;


    return `QT-${year}-${String(
        nextNumber
    ).padStart(5, "0")}`;

}


/* =========================================================
   21. TODAY
   ========================================================= */

function setQuotationToday() {

    const dateInput =
        quotationEl(
            "quotation-date"
        );

    if (
        dateInput &&
        !dateInput.value
    ) {

        dateInput.value =
            getTodayDate();

    }

}


/* =========================================================
   22. SUBMIT QUOTATION
   ========================================================= */

async function handleQuotationSubmit(event) {

    event.preventDefault();


    const form =
        event.target;

    if (
        !form.checkValidity()
    ) {

        form.reportValidity();

        return;

    }


    const saveButton =
        quotationEl(
            "quotation-save-btn"
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Saving...
        `;

    }


    try {

        calculateQuotationPax();
        calculateQuotationTotals();


        const quotation =
            collectQuotationFormData();


        await saveQuotationToFirestore(
            quotation
        );


        showQuotationMessage(
            "Quotation saved successfully.",
            "success"
        );


        await loadQuotationData();

        closeQuotationForm();

    }
    catch (error) {

        console.error(
            "Error saving quotation:",
            error
        );

        showQuotationMessage(
            error.message ||
            "Unable to save quotation.",
            "error"
        );

    }
    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.innerHTML = `
                <i class="fa-solid fa-floppy-disk"></i>
                Save Quotation
            `;

        }

    }

}


/* =========================================================
   23. COLLECT FORM DATA
   ========================================================= */

function collectQuotationFormData() {

    const quotationId =
        getQuotationValue(
            "quotation-id"
        ) ||
        getQuotationValue(
            "quotation-display-id"
        );


    const customerId =
        getQuotationValue(
            "quotation-customer"
        );


    const packageId =
        getQuotationValue(
            "quotation-package"
        );


    const quotation = {

        quotationId,

        quotationDate:
            getQuotationValue(
                "quotation-date"
            ),

        validUntil:
            getQuotationValue(
                "quotation-valid-until"
            ),

        status:
            getQuotationValue(
                "quotation-status"
            ) ||
            "Draft",

        preparedBy:
            getQuotationValue(
                "quotation-prepared-by"
            ),


        customer: {

            firestoreId:
                customerId,

            customerId:
                getQuotationValue(
                    "quotation-customer-id"
                ),

            name:
                getQuotationValue(
                    "quotation-customer-name"
                ),

            mobile:
                getQuotationValue(
                    "quotation-customer-mobile"
                ),

            whatsapp:
                getQuotationValue(
                    "quotation-customer-whatsapp"
                ),

            email:
                getQuotationValue(
                    "quotation-customer-email"
                ),

            address:
                getQuotationValue(
                    "quotation-customer-address"
                )

        },


        package: {

            firestoreId:
                packageId,

            packageId:
                getQuotationValue(
                    "quotation-package-id"
                ),

            name:
                getSelectedPackageName(),

            destination:
                getQuotationValue(
                    "quotation-destination"
                )

        },


        trip: {

            travelDate:
                getQuotationValue(
                    "quotation-travel-date"
                ),

            returnDate:
                getQuotationValue(
                    "quotation-return-date"
                ),

            days:
                numberValue(
                    "quotation-days"
                ),

            nights:
                numberValue(
                    "quotation-nights"
                ),

            adults:
                numberValue(
                    "quotation-adults"
                ),

            children:
                numberValue(
                    "quotation-children"
                ),

            infants:
                numberValue(
                    "quotation-infants"
                ),

            totalPax:
                numberValue(
                    "quotation-total-pax"
                ),

            startingPoint:
                getQuotationValue(
                    "quotation-start-city"
                ),

            endingPoint:
                getQuotationValue(
                    "quotation-end-city"
                )

        },


        itinerary:
            collectQuotationItinerary(),


        hotels:
            collectQuotationHotels(),


        transportation:
            collectQuotationCabs(),


        pricing: {

            basePrice:
                numberValue(
                    "quotation-base-price"
                ),

            extraCharges:
                numberValue(
                    "quotation-extra-charges"
                ),

            discount:
                numberValue(
                    "quotation-discount"
                ),

            taxableAmount:
                numberValue(
                    "quotation-taxable-amount"
                ),

            gstRate:
                numberValue(
                    "quotation-gst-rate"
                ),

            gstAmount:
                numberValue(
                    "quotation-gst-amount"
                ),

            roundOff:
                numberValue(
                    "quotation-round-off"
                ),

            grandTotal:
                numberValue(
                    "quotation-grand-total"
                )

        },


        paymentSchedule:
            collectQuotationPayments(),


        inclusions:
            getQuotationValue(
                "quotation-inclusions"
            ),

        exclusions:
            getQuotationValue(
                "quotation-exclusions"
            ),

        terms:
            getQuotationValue(
                "quotation-terms"
            ),

        internalNotes:
            getQuotationValue(
                "quotation-internal-notes"
            )

    };


    return quotation;

}


/* =========================================================
   24. SAVE FIRESTORE
   ========================================================= */

async function saveQuotationToFirestore(
    quotation
) {

    const firestore =
        getQuotationsFirestore();

    if (!firestore) {

        throw new Error(
            "Firestore is not available."
        );

    }


    const existingId =
        QuotationsModule.currentQuotationId;


    const payload = {

        ...quotation,

        updatedAt:
            typeof serverTimestamp === "function"
                ? serverTimestamp()
                : new Date().toISOString()

    };


    if (existingId) {

        if (
            typeof updateDoc === "function" &&
            typeof doc === "function"
        ) {

            await updateDoc(
                doc(
                    firestore,
                    QUOTATIONS_COLLECTION,
                    existingId
                ),
                payload
            );

        }
        else if (
            firestore
                .collection
        ) {

            await firestore
                .collection(
                    QUOTATIONS_COLLECTION
                )
                .doc(existingId)
                .update(payload);

        }

        return;

    }


    payload.createdAt =
        typeof serverTimestamp === "function"
            ? serverTimestamp()
            : new Date().toISOString();


    if (
        typeof addDoc === "function" &&
        typeof collection === "function"
    ) {

        await addDoc(
            collection(
                firestore,
                QUOTATIONS_COLLECTION
            ),
            payload
        );

    }
    else if (
        firestore.collection
    ) {

        await firestore
            .collection(
                QUOTATIONS_COLLECTION
            )
            .add(payload);

    }
    else {

        throw new Error(
            "Firestore write API unavailable."
        );

    }

}


/* =========================================================
   25. FILTERS
   ========================================================= */

function applyQuotationFilters() {

    const search =
        (
            getQuotationValue(
                "quotation-search"
            ) || ""
        )
            .trim()
            .toLowerCase();


    const status =
        getQuotationValue(
            "quotation-status-filter"
        ) ||
        "all";


    const dateFilter =
        getQuotationValue(
            "quotation-date-filter"
        ) ||
        "all";


    QuotationsModule.filteredQuotations =
        QuotationsModule.quotations.filter(
            quotation => {


                const searchableText = [

                    quotation.quotationId,

                    quotation.customer?.name,

                    quotation.customerName,

                    quotation.package?.name,

                    quotation.packageName,

                    quotation.package?.destination,

                    quotation.destination

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchableText.includes(
                        search
                    );


                const quotationStatus =
                    String(
                        quotation.status ||
                        "Draft"
                    )
                        .toLowerCase();


                const matchesStatus =
                    status === "all" ||
                    quotationStatus ===
                        status.toLowerCase();


                const matchesDate =
                    quotationMatchesDateFilter(
                        quotation,
                        dateFilter
                    );


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesDate
                );

            }
        );


    renderQuotations();
    updateQuotationSummary();

}


/* =========================================================
   26. DATE FILTER
   ========================================================= */

function quotationMatchesDateFilter(
    quotation,
    filter
) {

    if (
        filter === "all"
    ) {

        return true;

    }


    const quotationDate =
        quotationDateValue(
            quotation.quotationDate ||
            quotation.createdAt
        );


    if (!quotationDate) {

        return false;

    }


    const now =
        new Date();


    const startOfToday =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        )
            .getTime();


    if (
        filter === "today"
    ) {

        return quotationDate >=
            startOfToday;

    }


    const days =
        Number(filter);


    if (
        Number.isFinite(days)
    ) {

        return quotationDate >=
            (
                startOfToday -
                (
                    days *
                    24 *
                    60 *
                    60 *
                    1000
                )
            );

    }


    return true;

}


/* =========================================================
   27. RENDER QUOTATIONS
   ========================================================= */

function renderQuotations() {

    const tableBody =
        quotationEl(
            "quotations-table-body"
        );

    if (!tableBody) {

        return;

    }


    const quotations =
        QuotationsModule.filteredQuotations;


    if (
        quotations.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="table-empty">

                    No quotations found.

                </td>
            </tr>
        `;

        updateQuotationRecordCount();

        return;

    }


    tableBody.innerHTML =
        quotations
            .map(
                createQuotationRow
            )
            .join("");


    updateQuotationRecordCount();

}


/* =========================================================
   28. QUOTATION ROW
   ========================================================= */

function createQuotationRow(
    quotation
) {

    const quotationId =
        quotation.quotationId ||
        "—";


    const customerName =
        quotation.customer?.name ||
        quotation.customerName ||
        "—";


    const packageName =
        quotation.package?.name ||
        quotation.packageName ||
        "—";


    const travelDate =
        quotation.trip?.travelDate ||
        quotation.travelDate ||
        "";


    const pax =
        quotation.trip?.totalPax ??
        quotation.totalPax ??
        0;


    const total =
        quotation.pricing?.grandTotal ??
        quotation.grandTotal ??
        0;


    const status =
        quotation.status ||
        "Draft";


    return `
        <tr
            data-quotation-id="${escapeQuotationHtml(
                quotation.firestoreId || ""
            )}">

            <td>
                <span class="quotation-id-badge">
                    ${escapeQuotationHtml(
                        quotationId
                    )}
                </span>
            </td>

            <td>
                ${formatQuotationDate(
                    quotation.quotationDate
                )}
            </td>

            <td>
                <strong>
                    ${escapeQuotationHtml(
                        customerName
                    )}
                </strong>
            </td>

            <td>
                ${escapeQuotationHtml(
                    packageName
                )}
            </td>

            <td>
                ${formatQuotationDate(
                    travelDate
                )}
            </td>

            <td>
                ${Number(pax)}
            </td>

            <td>
                <strong>
                    ${formatCurrency(
                        total
                    )}
                </strong>
            </td>

            <td>
                <span class="status-badge ${quotationStatusClass(
                    status
                )}">
                    ${escapeQuotationHtml(
                        status
                    )}
                </span>
            </td>

            <td>

                <div class="table-actions">

                    <button
                        type="button"
                        class="icon-btn"
                        data-action="view"
                        title="View">

                        <i class="fa-solid fa-eye"></i>

                    </button>

                    <button
                        type="button"
                        class="icon-btn"
                        data-action="edit"
                        title="Edit">

                        <i class="fa-solid fa-pen"></i>

                    </button>

                    <button
                        type="button"
                        class="icon-btn"
                        data-action="pdf"
                        title="PDF">

                        <i class="fa-solid fa-file-pdf"></i>

                    </button>

                    <button
                        type="button"
                        class="icon-btn"
                        data-action="delete"
                        title="Delete">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>

            </td>

        </tr>
    `;

}


/* =========================================================
   29. TABLE ACTION
   ========================================================= */

function handleQuotationTableAction(
    event
) {

    const button =
        event.target.closest(
            "[data-action]"
        );


    if (!button) {

        return;

    }


    const row =
        button.closest(
            "tr[data-quotation-id]"
        );


    if (!row) {

        return;

    }


    const id =
        row.dataset.quotationId;


    const action =
        button.dataset.action;


    const quotation =
        QuotationsModule.quotations.find(
            item =>
                item.firestoreId === id
        );


    if (!quotation) {

        return;

    }


    if (
        action === "view"
    ) {

        viewQuotation(
            quotation
        );

    }


    if (
        action === "edit"
    ) {

        editQuotation(
            quotation
        );

    }


    if (
        action === "pdf"
    ) {

        generateQuotationPdf(
            quotation
        );

    }


    if (
        action === "delete"
    ) {

        openQuotationDeleteModal(
            quotation.firestoreId
        );

    }

}


/* =========================================================
   30. EDIT QUOTATION
   ========================================================= */

function editQuotation(
    quotation
) {

    QuotationsModule.currentQuotationId =
        quotation.firestoreId;


    const listCard =
        quotationEl(
            "quotations-list-card"
        );

    const formCard =
        quotationEl(
            "quotation-form-card"
        );


    if (listCard) {

        listCard.classList.add(
            "hidden"
        );

    }


    if (formCard) {

        formCard.classList.remove(
            "hidden"
        );

    }


    populateQuotationForm(
        quotation
    );

}


/* =========================================================
   31. POPULATE FORM
   ========================================================= */

function populateQuotationForm(
    quotation
) {

    setQuotationValue(
        "quotation-id",
        quotation.firestoreId || ""
    );


    setQuotationValue(
        "quotation-display-id",
        quotation.quotationId || ""
    );


    setQuotationValue(
        "quotation-date",
        quotation.quotationDate || ""
    );


    setQuotationValue(
        "quotation-valid-until",
        quotation.validUntil || ""
    );


    setQuotationValue(
        "quotation-status",
        quotation.status || "Draft"
    );


    setQuotationValue(
        "quotation-prepared-by",
        quotation.preparedBy || ""
    );


    /* CUSTOMER */

    const customerSelect =
        quotationEl(
            "quotation-customer"
        );


    if (customerSelect) {

        const customerId =
            quotation.customer?.firestoreId ||
            quotation.customer?.customerId ||
            "";


        customerSelect.value =
            findSelectValue(
                customerSelect,
                customerId
            );


        handleQuotationCustomerChange({
            target: customerSelect
        });

    }


    /* PACKAGE */

    const packageSelect =
        quotationEl(
            "quotation-package"
        );


    if (packageSelect) {

        const packageId =
            quotation.package?.firestoreId ||
            quotation.package?.packageId ||
            "";


        packageSelect.value =
            findSelectValue(
                packageSelect,
                packageId
            );

    }


    setQuotationValue(
        "quotation-package-id",
        quotation.package?.packageId || ""
    );


    setQuotationValue(
        "quotation-destination",
        quotation.package?.destination || ""
    );


    /* TRIP */

    const trip =
        quotation.trip || {};


    setQuotationValue(
        "quotation-travel-date",
        trip.travelDate || ""
    );

    setQuotationValue(
        "quotation-return-date",
        trip.returnDate || ""
    );

    setQuotationValue(
        "quotation-days",
        trip.days ?? ""
    );

    setQuotationValue(
        "quotation-nights",
        trip.nights ?? ""
    );

    setQuotationValue(
        "quotation-adults",
        trip.adults ?? 0
    );

    setQuotationValue(
        "quotation-children",
        trip.children ?? 0
    );

    setQuotationValue(
        "quotation-infants",
        trip.infants ?? 0
    );

    setQuotationValue(
        "quotation-total-pax",
        trip.totalPax ?? 0
    );

    setQuotationValue(
        "quotation-start-city",
        trip.startingPoint || ""
    );

    setQuotationValue(
        "quotation-end-city",
        trip.endingPoint || ""
    );


    /* ITINERARY */

    renderQuotationItinerary(
        quotation.itinerary || []
    );


    /* HOTELS */

    renderQuotationHotels(
        quotation.hotels || []
    );


    /* CABS */

    renderQuotationCabs(
        quotation.transportation || []
    );


    /* PRICING */

    const pricing =
        quotation.pricing || {};


    setQuotationValue(
        "quotation-base-price",
        pricing.basePrice ?? 0
    );

    setQuotationValue(
        "quotation-extra-charges",
        pricing.extraCharges ?? 0
    );

    setQuotationValue(
        "quotation-discount",
        pricing.discount ?? 0
    );

    setQuotationValue(
        "quotation-taxable-amount",
        pricing.taxableAmount ?? 0
    );

    setQuotationValue(
        "quotation-gst-rate",
        pricing.gstRate ?? 0
    );

    setQuotationValue(
        "quotation-gst-amount",
        pricing.gstAmount ?? 0
    );

    setQuotationValue(
        "quotation-round-off",
        pricing.roundOff ?? 0
    );

    setQuotationValue(
        "quotation-grand-total",
        pricing.grandTotal ?? 0
    );


    /* PAYMENTS */

    renderQuotationPayments(
        quotation.paymentSchedule || []
    );


    /* TEXT */

    setQuotationValue(
        "quotation-inclusions",
        quotation.inclusions || ""
    );

    setQuotationValue(
        "quotation-exclusions",
        quotation.exclusions || ""
    );

    setQuotationValue(
        "quotation-terms",
        quotation.terms || ""
    );

    setQuotationValue(
        "quotation-internal-notes",
        quotation.internalNotes || ""
    );


    calculateQuotationPax();
    calculateQuotationTotals();

}


/* =========================================================
   32. ITINERARY
   ========================================================= */

function addQuotationItineraryDay(
    data = {}
) {

    const container =
        quotationEl(
            "quotation-itinerary-container"
        );

    const template =
        quotationEl(
            "quotation-itinerary-template"
        );


    if (
        !container ||
        !template
    ) {

        return;

    }


    const empty =
        quotationEl(
            "quotation-itinerary-empty"
        );

    if (empty) {

        empty.remove();

    }


    const fragment =
        template.content.cloneNode(
            true
        );


    const dayElement =
        fragment.querySelector(
            ".quotation-itinerary-day"
        );


    if (!dayElement) {

        return;

    }


    const currentCount =
        container.querySelectorAll(
            ".quotation-itinerary-day"
        ).length;


    const dayNumber =
        Number(
            data.dayNumber ||
            currentCount + 1
        );


    dayElement.querySelector(
        ".quotation-itinerary-day-number"
    ).value =
        dayNumber;


    dayElement.querySelector(
        ".quotation-day-number"
    ).textContent =
        dayNumber;


    setNestedValue(
        dayElement,
        ".quotation-itinerary-title",
        data.title || ""
    );


    setNestedValue(
        dayElement,
        ".quotation-itinerary-route",
        data.route || ""
    );


    setNestedValue(
        dayElement,
        ".quotation-itinerary-sightseeing",
        data.sightseeing || ""
    );


    setNestedValue(
        dayElement,
        ".quotation-itinerary-overnight",
        data.overnight || ""
    );


    setNestedValue(
        dayElement,
        ".quotation-itinerary-notes",
        data.notes || ""
    );


    const breakfast =
        dayElement.querySelector(
            ".quotation-meal-breakfast"
        );

    const lunch =
        dayElement.querySelector(
            ".quotation-meal-lunch"
        );

    const dinner =
        dayElement.querySelector(
            ".quotation-meal-dinner"
        );


    const meals =
        Array.isArray(data.meals)
            ? data.meals
            : [];


    if (breakfast) {

        breakfast.checked =
            meals.includes(
                "Breakfast"
            );

    }


    if (lunch) {

        lunch.checked =
            meals.includes(
                "Lunch"
            );

    }


    if (dinner) {

        dinner.checked =
            meals.includes(
                "Dinner"
            );

    }


    container.appendChild(
        dayElement
    );

}


/* =========================================================
   33. LOAD PACKAGE ITINERARY
   ========================================================= */

function loadPackageItinerary(
    itinerary
) {

    renderQuotationItinerary(
        itinerary
    );

}


/* =========================================================
   34. RENDER ITINERARY
   ========================================================= */

function renderQuotationItinerary(
    itinerary
) {

    const container =
        quotationEl(
            "quotation-itinerary-container"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (
        !Array.isArray(itinerary) ||
        itinerary.length === 0
    ) {

        container.innerHTML = `
            <div
                id="quotation-itinerary-empty"
                class="nested-empty-state">

                <div class="empty-icon">
                    🗓️
                </div>

                <strong>
                    No itinerary added
                </strong>

                <p>
                    Select a package or add
                    itinerary days manually.
                </p>

            </div>
        `;

        return;

    }


    itinerary.forEach(
        (day, index) => {

            addQuotationItineraryDay({

                ...day,

                dayNumber:
                    day.dayNumber ||
                    day.day ||
                    index + 1,

                title:
                    day.title ||
                    day.dayTitle ||
                    "",

                sightseeing:
                    day.sightseeing ||
                    day.activities ||
                    "",

                notes:
                    day.notes ||
                    ""

            });

        }
    );

}


/* =========================================================
   35. ITINERARY ACTION
   ========================================================= */

function handleQuotationItineraryAction(
    event
) {

    const removeButton =
        event.target.closest(
            ".quotation-remove-day-btn"
        );


    if (
        removeButton
    ) {

        const day =
            removeButton.closest(
                ".quotation-itinerary-day"
            );


        if (day) {

            day.remove();

        }


        renumberQuotationItinerary();

    }

}


/* =========================================================
   36. RENUMBER ITINERARY
   ========================================================= */

function renumberQuotationItinerary() {

    const days =
        quotationQueryAll(
            ".quotation-itinerary-day",
            quotationEl(
                "quotation-itinerary-container"
            ) || document
        );


    days.forEach(
        (day, index) => {

            const number =
                index + 1;


            const label =
                day.querySelector(
                    ".quotation-day-number"
                );

            const input =
                day.querySelector(
                    ".quotation-itinerary-day-number"
                );


            if (label) {

                label.textContent =
                    number;

            }


            if (input) {

                input.value =
                    number;

            }

        }
    );


    if (
        days.length === 0
    ) {

        renderQuotationItinerary(
            []
        );

    }

}


/* =========================================================
   37. COLLECT ITINERARY
   ========================================================= */

function collectQuotationItinerary() {

    return quotationQueryAll(
        ".quotation-itinerary-day",
        quotationEl(
            "quotation-itinerary-container"
        ) || document
    )
        .map(
            (day, index) => {

                const meals = [];


                if (
                    day.querySelector(
                        ".quotation-meal-breakfast"
                    )?.checked
                ) {

                    meals.push(
                        "Breakfast"
                    );

                }


                if (
                    day.querySelector(
                        ".quotation-meal-lunch"
                    )?.checked
                ) {

                    meals.push(
                        "Lunch"
                    );

                }


                if (
                    day.querySelector(
                        ".quotation-meal-dinner"
                    )?.checked
                ) {

                    meals.push(
                        "Dinner"
                    );

                }


                return {

                    dayNumber:
                        numberFromNested(
                            day,
                            ".quotation-itinerary-day-number",
                            index + 1
                        ),

                    title:
                        nestedValue(
                            day,
                            ".quotation-itinerary-title"
                        ),

                    route:
                        nestedValue(
                            day,
                            ".quotation-itinerary-route"
                        ),

                    sightseeing:
                        nestedValue(
                            day,
                            ".quotation-itinerary-sightseeing"
                        ),

                    overnight:
                        nestedValue(
                            day,
                            ".quotation-itinerary-overnight"
                        ),

                    meals,

                    notes:
                        nestedValue(
                            day,
                            ".quotation-itinerary-notes"
                        )

                };

            }
        );

}


/* =========================================================
   38. HOTELS
   ========================================================= */

function addQuotationHotel(
    data = {}
) {

    const body =
        quotationEl(
            "quotation-hotels-body"
        );

    const template =
        quotationEl(
            "quotation-hotel-template"
        );


    if (
        !body ||
        !template
    ) {

        return;

    }


    const empty =
        quotationEl(
            "quotation-hotels-empty"
        );

    if (empty) {

        empty.classList.add(
            "hidden"
        );

    }


    const fragment =
        template.content.cloneNode(
            true
        );


    const row =
        fragment.querySelector(
            ".quotation-hotel-row"
        );


    setNestedValue(
        row,
        ".quotation-hotel-city",
        data.city || ""
    );

    setNestedValue(
        row,
        ".quotation-hotel-name",
        data.hotel || data.name || ""
    );

    setNestedValue(
        row,
        ".quotation-hotel-room",
        data.room || ""
    );

    setNestedValue(
        row,
        ".quotation-hotel-meal",
        data.mealPlan || data.meal || "CP"
    );

    setNestedValue(
        row,
        ".quotation-hotel-nights",
        data.nights ?? 0
    );

    setNestedValue(
        row,
        ".quotation-hotel-rooms",
        data.rooms ?? 1
    );

    setNestedValue(
        row,
        ".quotation-hotel-remarks",
        data.remarks || ""
    );


    body.appendChild(
        row
    );

}


function renderQuotationHotels(
    hotels
) {

    const body =
        quotationEl(
            "quotation-hotels-body"
        );


    if (!body) {

        return;

    }


    body.innerHTML = "";


    if (
        !Array.isArray(hotels) ||
        hotels.length === 0
    ) {

        updateQuotationNestedEmptyState(
            "quotation-hotels-empty",
            true
        );

        return;

    }


    hotels.forEach(
        hotel =>
            addQuotationHotel(
                hotel
            )
    );

}


function handleQuotationHotelAction(
    event
) {

    const button =
        event.target.closest(
            ".quotation-remove-hotel-btn"
        );


    if (!button) {

        return;

    }


    const row =
        button.closest(
            ".quotation-hotel-row"
        );


    if (row) {

        row.remove();

    }


    const body =
        quotationEl(
            "quotation-hotels-body"
        );


    updateQuotationNestedEmptyState(
        "quotation-hotels-empty",
        !body ||
        body.children.length === 0
    );

}


function collectQuotationHotels() {

    return quotationQueryAll(
        ".quotation-hotel-row",
        quotationEl(
            "quotation-hotels-body"
        ) || document
    )
        .map(
            row => ({

                city:
                    nestedValue(
                        row,
                        ".quotation-hotel-city"
                    ),

                hotel:
                    nestedValue(
                        row,
                        ".quotation-hotel-name"
                    ),

                room:
                    nestedValue(
                        row,
                        ".quotation-hotel-room"
                    ),

                mealPlan:
                    nestedValue(
                        row,
                        ".quotation-hotel-meal"
                    ),

                nights:
                    numberFromNested(
                        row,
                        ".quotation-hotel-nights"
                    ),

                rooms:
                    numberFromNested(
                        row,
                        ".quotation-hotel-rooms"
                    ),

                remarks:
                    nestedValue(
                        row,
                        ".quotation-hotel-remarks"
                    )

            })
        );

}


/* =========================================================
   39. CABS / TRANSPORTATION
   ========================================================= */

function addQuotationCab(
    data = {}
) {

    const body =
        quotationEl(
            "quotation-cabs-body"
        );

    const template =
        quotationEl(
            "quotation-cab-template"
        );


    if (
        !body ||
        !template
    ) {

        return;

    }


    updateQuotationNestedEmptyState(
        "quotation-cabs-empty",
        false
    );


    const fragment =
        template.content.cloneNode(
            true
        );


    const row =
        fragment.querySelector(
            ".quotation-cab-row"
        );


    setNestedValue(
        row,
        ".quotation-cab-day",
        data.day ?? ""
    );

    setNestedValue(
        row,
        ".quotation-cab-route",
        data.route || ""
    );

    setNestedValue(
        row,
        ".quotation-cab-vehicle",
        data.vehicle || ""
    );

    setNestedValue(
        row,
        ".quotation-cab-capacity",
        data.capacity ?? ""
    );

    setNestedValue(
        row,
        ".quotation-cab-pickup",
        data.pickup || ""
    );

    setNestedValue(
        row,
        ".quotation-cab-drop",
        data.drop || ""
    );

    setNestedValue(
        row,
        ".quotation-cab-remarks",
        data.remarks || ""
    );


    body.appendChild(
        row
    );

}


function renderQuotationCabs(
    cabs
) {

    const body =
        quotationEl(
            "quotation-cabs-body"
        );


    if (!body) {

        return;

    }


    body.innerHTML = "";


    if (
        !Array.isArray(cabs) ||
        cabs.length === 0
    ) {

        updateQuotationNestedEmptyState(
            "quotation-cabs-empty",
            true
        );

        return;

    }


    cabs.forEach(
        cab =>
            addQuotationCab(
                cab
            )
    );

}


function handleQuotationCabAction(
    event
) {

    const button =
        event.target.closest(
            ".quotation-remove-cab-btn"
        );


    if (!button) {

        return;

    }


    const row =
        button.closest(
            ".quotation-cab-row"
        );


    if (row) {

        row.remove();

    }


    const body =
        quotationEl(
            "quotation-cabs-body"
        );


    updateQuotationNestedEmptyState(
        "quotation-cabs-empty",
        !body ||
        body.children.length === 0
    );

}


function collectQuotationCabs() {

    return quotationQueryAll(
        ".quotation-cab-row",
        quotationEl(
            "quotation-cabs-body"
        ) || document
    )
        .map(
            row => ({

                day:
                    numberFromNested(
                        row,
                        ".quotation-cab-day"
                    ),

                route:
                    nestedValue(
                        row,
                        ".quotation-cab-route"
                    ),

                vehicle:
                    nestedValue(
                        row,
                        ".quotation-cab-vehicle"
                    ),

                capacity:
                    numberFromNested(
                        row,
                        ".quotation-cab-capacity"
                    ),

                pickup:
                    nestedValue(
                        row,
                        ".quotation-cab-pickup"
                    ),

                drop:
                    nestedValue(
                        row,
                        ".quotation-cab-drop"
                    ),

                remarks:
                    nestedValue(
                        row,
                        ".quotation-cab-remarks"
                    )

            })
        );

}


/* =========================================================
   40. PAYMENT SCHEDULE
   ========================================================= */

function addQuotationPayment(
    data = {}
) {

    const body =
        quotationEl(
            "quotation-payments-body"
        );

    const template =
        quotationEl(
            "quotation-payment-template"
        );


    if (
        !body ||
        !template
    ) {

        return;

    }


    updateQuotationNestedEmptyState(
        "quotation-payments-empty",
        false
    );


    const fragment =
        template.content.cloneNode(
            true
        );


    const row =
        fragment.querySelector(
            ".quotation-payment-row"
        );


    setNestedValue(
        row,
        ".quotation-payment-milestone",
        data.milestone || ""
    );

    setNestedValue(
        row,
        ".quotation-payment-due-date",
        data.dueDate || ""
    );

    setNestedValue(
        row,
        ".quotation-payment-amount",
        data.amount ?? ""
    );

    setNestedValue(
        row,
        ".quotation-payment-percentage",
        data.percentage ?? ""
    );

    setNestedValue(
        row,
        ".quotation-payment-remarks",
        data.remarks || ""
    );


    body.appendChild(
        row
    );

}


function renderQuotationPayments(
    payments
) {

    const body =
        quotationEl(
            "quotation-payments-body"
        );


    if (!body) {

        return;

    }


    body.innerHTML = "";


    if (
        !Array.isArray(payments) ||
        payments.length === 0
    ) {

        updateQuotationNestedEmptyState(
            "quotation-payments-empty",
            true
        );

        return;

    }


    payments.forEach(
        payment =>
            addQuotationPayment(
                payment
            )
    );

}


function handleQuotationPaymentAction(
    event
) {

    const button =
        event.target.closest(
            ".quotation-remove-payment-btn"
        );


    if (!button) {

        return;

    }


    const row =
        button.closest(
            ".quotation-payment-row"
        );


    if (row) {

        row.remove();

    }


    const body =
        quotationEl(
            "quotation-payments-body"
        );


    updateQuotationNestedEmptyState(
        "quotation-payments-empty",
        !body ||
        body.children.length === 0
    );

}


function collectQuotationPayments() {

    return quotationQueryAll(
        ".quotation-payment-row",
        quotationEl(
            "quotation-payments-body"
        ) || document
    )
        .map(
            row => ({

                milestone:
                    nestedValue(
                        row,
                        ".quotation-payment-milestone"
                    ),

                dueDate:
                    nestedValue(
                        row,
                        ".quotation-payment-due-date"
                    ),

                amount:
                    numberFromNested(
                        row,
                        ".quotation-payment-amount"
                    ),

                percentage:
                    numberFromNested(
                        row,
                        ".quotation-payment-percentage"
                    ),

                remarks:
                    nestedValue(
                        row,
                        ".quotation-payment-remarks"
                    )

            })
        );

}


/* =========================================================
   41. PAX CALCULATION
   ========================================================= */

function calculateQuotationPax() {

    const adults =
        numberValue(
            "quotation-adults"
        );

    const children =
        numberValue(
            "quotation-children"
        );

    const infants =
        numberValue(
            "quotation-infants"
        );


    const total =
        adults +
        children +
        infants;


    setQuotationValue(
        "quotation-total-pax",
        total
    );

}


/* =========================================================
   42. PRICE CALCULATION
   ========================================================= */

function calculateQuotationTotals() {

    const base =
        numberValue(
            "quotation-base-price"
        );

    const extra =
        numberValue(
            "quotation-extra-charges"
        );

    const discount =
        numberValue(
            "quotation-discount"
        );


    const taxable =
        Math.max(
            0,
            base +
            extra -
            discount
        );


    const gstRate =
        numberValue(
            "quotation-gst-rate"
        );


    const gst =
        taxable *
        gstRate /
        100;


    const roundOff =
        numberValue(
            "quotation-round-off"
        );


    const grandTotal =
        taxable +
        gst +
        roundOff;


    setQuotationValue(
        "quotation-taxable-amount",
        roundNumber(
            taxable
        )
    );


    setQuotationValue(
        "quotation-gst-amount",
        roundNumber(
            gst
        )
    );


    setQuotationValue(
        "quotation-grand-total",
        roundNumber(
            grandTotal
        )
    );


    setText(
        "quotation-summary-base",
        formatCurrency(base)
    );


    setText(
        "quotation-summary-discount",
        formatCurrency(discount)
    );


    setText(
        "quotation-summary-gst",
        formatCurrency(gst)
    );


    setText(
        "quotation-summary-total",
        formatCurrency(grandTotal)
    );

}


/* =========================================================
   43. SUMMARY
   ========================================================= */

function updateQuotationSummary() {

    const quotations =
        QuotationsModule.quotations;


    const total =
        quotations.length;


    const sent =
        quotations.filter(
            q =>
                String(
                    q.status
                ).toLowerCase() ===
                "sent"
        ).length;


    const accepted =
        quotations.filter(
            q =>
                String(
                    q.status
                ).toLowerCase() ===
                "accepted"
        ).length;


    const pending =
        quotations.filter(
            q => {

                const status =
                    String(
                        q.status ||
                        "Draft"
                    ).toLowerCase();

                return (
                    status === "draft" ||
                    status === "sent"
                );

            }
        ).length;


    setText(
        "quotation-total-count",
        total
    );

    setText(
        "quotation-sent-count",
        sent
    );

    setText(
        "quotation-accepted-count",
        accepted
    );

    setText(
        "quotation-pending-count",
        pending
    );

}


/* =========================================================
   44. RECORD COUNT
   ========================================================= */

function updateQuotationRecordCount() {

    const element =
        quotationEl(
            "quotation-record-count"
        );


    if (element) {

        const count =
            QuotationsModule.filteredQuotations.length;


        element.textContent =
            `${count} ${
                count === 1
                    ? "record"
                    : "records"
            }`;

    }

}


/* =========================================================
   45. VIEW
   ========================================================= */

function viewQuotation(
    quotation
) {

    /*
     * For now use the same editor in
     * read-only mode.
     */

    editQuotation(
        quotation
    );


    const form =
        quotationEl(
            "quotation-form"
        );


    if (!form) {

        return;

    }


    quotationQueryAll(
        "input, textarea, select",
        form
    )
        .forEach(
            element => {

                if (
                    element.id ===
                    "quotation-id"
                ) {

                    return;

                }

                element.dataset.originalDisabled =
                    element.disabled
                        ? "true"
                        : "false";

                element.disabled =
                    true;

            }
        );


    const saveButton =
        quotationEl(
            "quotation-save-btn"
        );

    if (saveButton) {

        saveButton.classList.add(
            "hidden"
        );

    }


    const title =
        quotationEl(
            "quotation-form-title"
        );

    if (title) {

        title.textContent =
            "View Quotation";

    }

}


/* =========================================================
   46. DELETE MODAL
   ========================================================= */

function openQuotationDeleteModal(
    id
) {

    QuotationsModule.deletingQuotationId =
        id;


    const modal =
        quotationEl(
            "quotation-delete-modal"
        );


    if (modal) {

        modal.classList.remove(
            "hidden"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

    }

}


function closeQuotationDeleteModal() {

    QuotationsModule.deletingQuotationId =
        null;


    const modal =
        quotationEl(
            "quotation-delete-modal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }

}


/* =========================================================
   47. CONFIRM DELETE
   ========================================================= */

async function confirmDeleteQuotation() {

    const id =
        QuotationsModule.deletingQuotationId;


    if (!id) {

        return;

    }


    try {

        const firestore =
            getQuotationsFirestore();


        if (!firestore) {

            throw new Error(
                "Firestore is not available."
            );

        }


        if (
            typeof deleteDoc === "function" &&
            typeof doc === "function"
        ) {

            await deleteDoc(
                doc(
                    firestore,
                    QUOTATIONS_COLLECTION,
                    id
                )
            );

        }
        else if (
            firestore.collection
        ) {

            await firestore
                .collection(
                    QUOTATIONS_COLLECTION
                )
                .doc(id)
                .delete();

        }
        else {

            throw new Error(
                "Firestore delete API unavailable."
            );

        }


        closeQuotationDeleteModal();


        showQuotationMessage(
            "Quotation deleted successfully.",
            "success"
        );


        await loadQuotationData();

    }
    catch (error) {

        console.error(
            "Delete quotation error:",
            error
        );


        showQuotationMessage(
            "Unable to delete quotation.",
            "error"
        );

    }

}


/* =========================================================
   48. PDF
   ========================================================= */

function generateQuotationPdf(
    quotation
) {

    /*
     * PDF engine will be connected here.
     * Existing quotations-pdf.css remains separate.
     */

    const quotationData =
        quotation ||
        collectQuotationFormData();


    const printableHtml =
        buildQuotationPrintableHtml(
            quotationData
        );


    const printWindow =
        window.open(
            "",
            "_blank"
        );


    if (!printWindow) {

        showQuotationMessage(
            "Please allow pop-ups to generate the quotation PDF.",
            "error"
        );

        return;

    }


    printWindow.document.open();

    printWindow.document.write(
        printableHtml
    );

    printWindow.document.close();


    printWindow.focus();

    setTimeout(
        () => {

            printWindow.print();

        },
        500
    );

}


/* =========================================================
   49. PRINTABLE QUOTATION
   ========================================================= */

function buildQuotationPrintableHtml(
    quotation
) {

    const customer =
        quotation.customer || {};


    const pkg =
        quotation.package || {};


    const trip =
        quotation.trip || {};


    const pricing =
        quotation.pricing || {};


    const itinerary =
        quotation.itinerary || [];


    const hotels =
        quotation.hotels || [];


    const cabs =
        quotation.transportation || [];


    return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
    ${escapeQuotationHtml(
        quotation.quotationId ||
        "Quotation"
    )}
</title>

<link
    rel="stylesheet"
    href="../../modules/quotations/quotations-pdf.css"
>

<style>

body {
    font-family:
        Arial,
        Helvetica,
        sans-serif;
    margin: 0;
    padding: 30px;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th,
td {
    border: 1px solid #ddd;
    padding: 8px;
    vertical-align: top;
}

th {
    text-align: left;
}

.section {
    margin-top: 25px;
}

.total {
    font-size: 20px;
    font-weight: 700;
}

@media print {

    body {
        padding: 0;
    }

}

</style>

</head>

<body>

<h1>
    MY TOUR MITRA
</h1>

<h2>
    TOUR QUOTATION
</h2>

<table>

<tr>

<td>
    <strong>Quotation ID</strong>
</td>

<td>
    ${escapeQuotationHtml(
        quotation.quotationId || ""
    )}
</td>

<td>
    <strong>Date</strong>
</td>

<td>
    ${formatQuotationDate(
        quotation.quotationDate
    )}
</td>

</tr>

</table>


<div class="section">

<h3>
    Customer Details
</h3>

<table>

<tr>
<td><strong>Name</strong></td>
<td>${escapeQuotationHtml(
    customer.name || ""
)}</td>
</tr>

<tr>
<td><strong>Mobile</strong></td>
<td>${escapeQuotationHtml(
    customer.mobile || ""
)}</td>
</tr>

<tr>
<td><strong>Email</strong></td>
<td>${escapeQuotationHtml(
    customer.email || ""
)}</td>
</tr>

<tr>
<td><strong>Address</strong></td>
<td>${escapeQuotationHtml(
    customer.address || ""
)}</td>
</tr>

</table>

</div>


<div class="section">

<h3>
    Trip Details
</h3>

<table>

<tr>
<td><strong>Package</strong></td>
<td>${escapeQuotationHtml(
    pkg.name || ""
)}</td>
</tr>

<tr>
<td><strong>Destination</strong></td>
<td>${escapeQuotationHtml(
    pkg.destination || ""
)}</td>
</tr>

<tr>
<td><strong>Travel Date</strong></td>
<td>${formatQuotationDate(
    trip.travelDate
)}</td>
</tr>

<tr>
<td><strong>Return Date</strong></td>
<td>${formatQuotationDate(
    trip.returnDate
)}</td>
</tr>

<tr>
<td><strong>Pax</strong></td>
<td>${Number(
    trip.totalPax || 0
)}</td>
</tr>

</table>

</div>


<div class="section">

<h3>
    Itinerary
</h3>

<table>

<thead>

<tr>

<th>
    Day
</th>

<th>
    Title
</th>

<th>
    Route
</th>

<th>
    Sightseeing / Activities
</th>

<th>
    Overnight
</th>

</tr>

</thead>

<tbody>

${
    itinerary
        .map(
            day => `
<tr>

<td>
    ${day.dayNumber || ""}
</td>

<td>
    ${escapeQuotationHtml(
        day.title || ""
    )}
</td>

<td>
    ${escapeQuotationHtml(
        day.route || ""
    )}
</td>

<td>
    ${escapeQuotationHtml(
        day.sightseeing || ""
    )}
</td>

<td>
    ${escapeQuotationHtml(
        day.overnight || ""
    )}
</td>

</tr>
`
        )
        .join("")
}

</tbody>

</table>

</div>


${
    hotels.length
        ? `
<div class="section">

<h3>
    Accommodation
</h3>

<table>

<thead>

<tr>

<th>City</th>
<th>Hotel</th>
<th>Room</th>
<th>Meal Plan</th>
<th>Nights</th>

</tr>

</thead>

<tbody>

${hotels
    .map(
        hotel => `
<tr>

<td>
${escapeQuotationHtml(
    hotel.city || ""
)}
</td>

<td>
${escapeQuotationHtml(
    hotel.hotel || ""
)}
</td>

<td>
${escapeQuotationHtml(
    hotel.room || ""
)}
</td>

<td>
${escapeQuotationHtml(
    hotel.mealPlan || ""
)}
</td>

<td>
${hotel.nights || 0}
</td>

</tr>
`
    )
    .join("")}

</tbody>

</table>

</div>
`
        : ""
}


${
    cabs.length
        ? `
<div class="section">

<h3>
    Transportation
</h3>

<table>

<thead>

<tr>

<th>Day</th>
<th>Route</th>
<th>Vehicle</th>
<th>Capacity</th>

</tr>

</thead>

<tbody>

${cabs
    .map(
        cab => `
<tr>

<td>
${cab.day || ""}
</td>

<td>
${escapeQuotationHtml(
    cab.route || ""
)}
</td>

<td>
${escapeQuotationHtml(
    cab.vehicle || ""
)}
</td>

<td>
${cab.capacity || ""}
</td>

</tr>
`
    )
    .join("")}

</tbody>

</table>

</div>
`
        : ""
}


<div class="section">

<h3>
    Price Summary
</h3>

<table>

<tr>

<td>
    Base Package Price
</td>

<td>
    ${formatCurrency(
        pricing.basePrice || 0
    )}
</td>

</tr>

<tr>

<td>
    Extra Charges
</td>

<td>
    ${formatCurrency(
        pricing.extraCharges || 0
    )}
</td>

</tr>

<tr>

<td>
    Discount
</td>

<td>
    ${formatCurrency(
        pricing.discount || 0
    )}
</td>

</tr>

<tr>

<td>
    GST (${pricing.gstRate || 0}%)
</td>

<td>
    ${formatCurrency(
        pricing.gstAmount || 0
    )}
</td>

</tr>

<tr class="total">

<td>
    Grand Total
</td>

<td>
    ${formatCurrency(
        pricing.grandTotal || 0
    )}
</td>

</tr>

</table>

</div>


<div class="section">

<h3>
    Inclusions
</h3>

<p>
${formatPrintableText(
    quotation.inclusions || ""
)}
</p>

<h3>
    Exclusions
</h3>

<p>
${formatPrintableText(
    quotation.exclusions || ""
)}
</p>

<h3>
    Terms & Conditions
</h3>

<p>
${formatPrintableText(
    quotation.terms || ""
)}
</p>

</div>


</body>

</html>
`;

}


/* =========================================================
   50. PREVIEW
   ========================================================= */

function previewQuotation() {

    const quotation =
        collectQuotationFormData();


    generateQuotationPdf(
        quotation
    );

}


/* =========================================================
   51. HELPER FUNCTIONS
   ========================================================= */

function setQuotationValue(
    id,
    value
) {

    const element =
        quotationEl(id);

    if (element) {

        element.value =
            value ?? "";

    }

}


function getQuotationValue(
    id
) {

    const element =
        quotationEl(id);

    return element
        ? element.value
        : "";

}


function setText(
    id,
    value
) {

    const element =
        quotationEl(id);

    if (element) {

        element.textContent =
            value ?? "";

    }

}


function numberValue(
    id
) {

    const value =
        Number(
            getQuotationValue(id)
        );


    return Number.isFinite(value)
        ? value
        : 0;

}


function numberFromNested(
    parent,
    selector,
    fallback = 0
) {

    const value =
        Number(
            nestedValue(
                parent,
                selector
            )
        );


    return Number.isFinite(value)
        ? value
        : fallback;

}


function nestedValue(
    parent,
    selector
) {

    const element =
        parent?.querySelector(
            selector
        );


    return element
        ? element.value
        : "";

}


function setNestedValue(
    parent,
    selector,
    value
) {

    const element =
        parent?.querySelector(
            selector
        );


    if (element) {

        element.value =
            value ?? "";

    }

}


function updateQuotationNestedEmptyState(
    id,
    show
) {

    const element =
        quotationEl(id);

    if (!element) {

        return;

    }


    element.classList.toggle(
        "hidden",
        !show
    );

}


function getSelectedPackageName() {

    const select =
        quotationEl(
            "quotation-package"
        );


    if (!select) {

        return "";

    }


    const option =
        select.options[
            select.selectedIndex
        ];


    return option
        ? option.textContent
            .replace(
                /\s*\([^)]*\)\s*$/,
                ""
            )
            .trim()
        : "";

}


function findSelectValue(
    select,
    value
) {

    if (!select) {

        return "";

    }


    const option =
        Array.from(
            select.options
        ).find(
            item =>
                item.value === value
        );


    return option
        ? option.value
        : "";

}


function quotationDateValue(
    value
) {

    if (!value) {

        return 0;

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value
            .toDate()
            .getTime();

    }


    if (
        value instanceof Date
    ) {

        return value.getTime();

    }


    const timestamp =
        new Date(
            value
        ).getTime();


    return Number.isNaN(
        timestamp
    )
        ? 0
        : timestamp;

}


function formatQuotationDate(
    value
) {

    if (!value) {

        return "—";

    }


    const date =
        typeof value.toDate ===
        "function"
            ? value.toDate()
            : new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return escapeQuotationHtml(
            String(value)
        );

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


function getTodayDate() {

    const date =
        new Date();


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


function formatCurrency(
    value
) {

    const number =
        Number(value) || 0;


    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(number);

}


function roundNumber(
    value
) {

    return Math.round(
        (
            Number(value) || 0
        ) * 100
    ) / 100;

}


function quotationStatusClass(
    status
) {

    return String(
        status || "Draft"
    )
        .toLowerCase()
        .replace(
            /\s+/g,
            "-"
        );

}


function escapeQuotationHtml(
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


function formatPrintableText(
    value
) {

    return escapeQuotationHtml(
        value
    )
        .replace(
            /\n/g,
            "<br>"
        );

}


function formatListValue(
    value
) {

    if (
        Array.isArray(value)
    ) {

        return value
            .map(
                item =>
                    `• ${item}`
            )
            .join("\n");

    }


    return String(
        value || ""
    );

}


/* =========================================================
   52. LOADING
   ========================================================= */

function showQuotationLoading(
    show
) {

    const loading =
        quotationEl(
            "quotations-loading"
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
   53. MESSAGE
   ========================================================= */

function showQuotationMessage(
    message,
    type = "info"
) {

    console.log(
        `[Quotation ${type}]`,
        message
    );


    /*
     * Use existing global UI toast if available.
     */

    if (
        typeof showToast ===
        "function"
    ) {

        showToast(
            message,
            type
        );

        return;

    }


    if (
        typeof window !==
        "undefined" &&
        typeof window.showToast ===
        "function"
    ) {

        window.showToast(
            message,
            type
        );

        return;

    }


    alert(message);

}


/* =========================================================
   54. INITIALIZATION HOOKS
   ========================================================= */

window.initQuotationsModule =
    initQuotationsModule;


window.QuotationsModule =
    QuotationsModule;


/* =========================================================
   55. AUTO INIT
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            /*
             * App.js may load modules dynamically.
             * Therefore we do not force initialization
             * before the module HTML exists.
             */

            if (
                quotationEl(
                    "quotations-page"
                )
            ) {

                initQuotationsModule();

            }

        }
    );

}
else {

    if (
        quotationEl(
            "quotations-page"
        )
    ) {

        initQuotationsModule();

    }

}
