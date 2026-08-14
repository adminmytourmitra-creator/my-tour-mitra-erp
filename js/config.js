/* =========================================================
   MY TOUR MITRA ERP
   CONFIGURATION
   File: /js/config.js
   ========================================================= */

"use strict";


/* =========================================================
   1. APPLICATION INFORMATION
   ========================================================= */

window.MTM_CONFIG = {

    APP_NAME: "My Tour Mitra ERP",

    APP_SHORT_NAME: "MTM ERP",

    VERSION: "1.0.0",

    CURRENCY: "INR",

    CURRENCY_SYMBOL: "₹",

    DATE_FORMAT: "DD-MM-YYYY",

    TIMEZONE: "Asia/Kolkata",

    COUNTRY: "India",

    DEFAULT_PAGE: "dashboard"

};


/* =========================================================
   2. FIRESTORE COLLECTION NAMES
   ========================================================= */

window.MTM_COLLECTIONS = {

    USERS: "users",

    CUSTOMERS: "customers",

    ENQUIRIES: "enquiries",

    FOLLOWUPS: "followups",

    PACKAGES: "packages",

    HOTELS: "hotels",

    CABS: "cabs",

    AGENCIES: "agencies",

    QUOTATIONS: "quotations",

    BOOKINGS: "bookings",

    INVOICES: "invoices",

    VOUCHERS: "vouchers",

    PAYMENTS: "payments",

    EXPENSES: "expenses",

    PROFIT_LOSS: "profit_loss",

    TEAM: "team",

    SETTINGS: "settings",

    SUPPLIERS: "suppliers",

    ACTIVITIES: "activities"

};


/* =========================================================
   3. STANDARD DOCUMENT ID PREFIXES
   ========================================================= */

window.MTM_ID_PREFIXES = {

    CUSTOMER: "CUS",

    ENQUIRY: "ENQ",

    FOLLOWUP: "FUP",

    PACKAGE: "PKG",

    HOTEL: "HTL",

    CAB: "CAB",

    AGENCY: "AGN",

    QUOTATION: "QUO",

    BOOKING: "BKG",

    INVOICE: "INV",

    VOUCHER: "VCH",

    PAYMENT: "PAY",

    EXPENSE: "EXP",

    SUPPLIER: "SUP",

    TEAM: "TM"

};


/* =========================================================
   4. ID NUMBER FORMAT
   =========================================================
   
   Examples:

   CUS0001
   ENQ0001
   FUP0001
   PKG0001
   QUO0001
   BKG0001
   INV0001
   VCH0001
   PAY0001
   EXP0001
   SUP0001
   ========================================================= */

window.MTM_ID_SETTINGS = {

    DIGITS: 4,

    START_NUMBER: 1

};


/* =========================================================
   5. MODULE DEFINITIONS
   ========================================================= */

window.MTM_MODULES = {

    dashboard: {
        name: "Dashboard",
        collection: null
    },

    customers: {
        name: "Customers",
        collection: MTM_COLLECTIONS.CUSTOMERS
    },

    enquiries: {
        name: "Enquiries",
        collection: MTM_COLLECTIONS.ENQUIRIES
    },

    followups: {
        name: "Follow-ups",
        collection: MTM_COLLECTIONS.FOLLOWUPS
    },

    packages: {
        name: "Packages",
        collection: MTM_COLLECTIONS.PACKAGES
    },

    hotels: {
        name: "Hotels",
        collection: MTM_COLLECTIONS.HOTELS
    },

    cabs: {
        name: "Cabs",
        collection: MTM_COLLECTIONS.CABS
    },

    agencies: {
        name: "Agencies",
        collection: MTM_COLLECTIONS.AGENCIES
    },

    quotations: {
        name: "Quotations",
        collection: MTM_COLLECTIONS.QUOTATIONS
    },

    bookings: {
        name: "Bookings",
        collection: MTM_COLLECTIONS.BOOKINGS
    },

    invoices: {
        name: "Invoices",
        collection: MTM_COLLECTIONS.INVOICES
    },

    vouchers: {
        name: "Vouchers",
        collection: MTM_COLLECTIONS.VOUCHERS
    },

    payments: {
        name: "Payments",
        collection: MTM_COLLECTIONS.PAYMENTS
    },

    expenses: {
        name: "Expenses",
        collection: MTM_COLLECTIONS.EXPENSES
    },

    profitLoss: {
        name: "Profit & Loss",
        collection: MTM_COLLECTIONS.PROFIT_LOSS
    },

    team: {
        name: "Team",
        collection: MTM_COLLECTIONS.TEAM
    },

    settings: {
        name: "Settings",
        collection: MTM_COLLECTIONS.SETTINGS
    }

};


/* =========================================================
   6. STATUS VALUES
   ========================================================= */

window.MTM_STATUS = {

    ACTIVE: "active",

    INACTIVE: "inactive",

    PENDING: "pending",

    CONFIRMED: "confirmed",

    CANCELLED: "cancelled",

    COMPLETED: "completed",

    DRAFT: "draft",

    SENT: "sent",

    ACCEPTED: "accepted",

    REJECTED: "rejected",

    PAID: "paid",

    PARTIAL: "partial",

    UNPAID: "unpaid"

};


/* =========================================================
   7. ENQUIRY STATUS
   ========================================================= */

window.MTM_ENQUIRY_STATUS = [

    "New",

    "Contacted",

    "Follow-up",

    "Quotation Sent",

    "Negotiation",

    "Converted",

    "Lost",

    "Cancelled"

];


/* =========================================================
   8. BOOKING STATUS
   ========================================================= */

window.MTM_BOOKING_STATUS = [

    "Draft",

    "Confirmed",

    "Partially Paid",

    "Fully Paid",

    "Cancelled",

    "Completed"

];


/* =========================================================
   9. QUOTATION STATUS
   ========================================================= */

window.MTM_QUOTATION_STATUS = [

    "Draft",

    "Sent",

    "Accepted",

    "Rejected",

    "Expired",

    "Converted"

];


/* =========================================================
   10. PAYMENT STATUS
   ========================================================= */

window.MTM_PAYMENT_STATUS = [

    "Pending",

    "Partial",

    "Paid",

    "Overdue",

    "Cancelled"

];


/* =========================================================
   11. SUPPLIER TYPES
   ========================================================= */

window.MTM_SUPPLIER_TYPES = [

    "Hotel",

    "Cab",

    "Flight",

    "Activity",

    "Visa",

    "DMC",

    "Other"

];


/* =========================================================
   12. CUSTOMER TYPES
   ========================================================= */

window.MTM_CUSTOMER_TYPES = [

    "Individual",

    "Family",

    "Corporate",

    "Group",

    "B2B"

];


/* =========================================================
   13. PAYMENT METHODS
   ========================================================= */

window.MTM_PAYMENT_METHODS = [

    "Cash",

    "UPI",

    "Bank Transfer",

    "Credit Card",

    "Debit Card",

    "Cheque",

    "Other"

];


/* =========================================================
   14. ID GENERATOR
   =========================================================
   
   This function only creates the DISPLAY FORMAT.

   Actual sequential number generation will be handled
   centrally through Firestore so duplicate IDs are avoided.

   Example:
   
   generateDocumentId("CUS", 1)
   => CUS0001
   ========================================================= */

window.generateDocumentId = function (prefix, number) {

    const safePrefix = String(prefix || "").toUpperCase();

    const numericNumber = Number(number);

    if (!safePrefix) {
        throw new Error("Document ID prefix is required.");
    }

    if (!Number.isFinite(numericNumber)) {
        throw new Error("Valid document number is required.");
    }

    const paddedNumber = String(
        Math.floor(numericNumber)
    ).padStart(
        MTM_ID_SETTINGS.DIGITS,
        "0"
    );

    return safePrefix + paddedNumber;

};


/* =========================================================
   15. FORMAT STANDARD IDS
   ========================================================= */

window.MTM_ID = {

    customer: function (number) {
        return generateDocumentId(
            MTM_ID_PREFIXES.CUSTOMER,
            number
        );
    },

    enquiry: function (number) {
        return generateDocumentId(
            MTM_ID_PREFIXES.ENQUIRY,
            number
        );
    },

    followup: function (number) {
        return generateDocumentId(
            MTM_ID_PREFIXES.FOLLOWUP,
            number
        );
    },

    package: function (number) {
        return generateDocumentId(
            MTM_ID_PREFIXES.PACKAGE,
            number
        );
    },

    hotel: function (number) {
        return generateDocumentId(
            MTM_ID_PREFIXES.HOTEL,
            number
        );
    },

    cab: function (number) {
        return generateDocumentId(
            MTM_ID_PREFIXES.CAB,
            number
        );
    },

    agency: function (number) {
        return generateDocumentId(
            MTM_ID_PREFIXES.AGENCY,
            number
        );
    },

    quotation: function (number) {
        return generateDocumentId(
            MTM_ID_PREFIXES.QUOTATION,
            number
        );
    },

    booking: function (number) {
        return generateDocumentId(
            MTM_ID_PREFIXES.BOOKING,
            number
        );
    },

    invoice: function (number) {
        return generateDocumentId(
            MTM_ID_PREFIXES.INVOICE,
            number
        );
    },

    voucher: function (number) {
        return generateDocumentId(
            MTM_ID_PREFIXES.VOUCHER,
            number
        );
    },

    payment: function (number) {
        return generateDocumentId(
            MTM_ID_PREFIXES.PAYMENT,
            number
        );
    },

    expense: function (number) {
        return generateDocumentId(
            MTM_ID_PREFIXES.EXPENSE,
            number
        );
    },

    supplier: function (number) {
        return generateDocumentId(
            MTM_ID_PREFIXES.SUPPLIER,
            number
        );

    },

    team: function (number) {
        return generateDocumentId(
            MTM_ID_PREFIXES.TEAM,
            number
        );
    }

};


/* =========================================================
   16. APPLICATION ROUTES
   ========================================================= */

window.MTM_ROUTES = {

    dashboard: "dashboard",

    customers: "customers",

    enquiries: "enquiries",

    followups: "followups",

    packages: "packages",

    hotels: "hotels",

    cabs: "cabs",

    agencies: "agencies",

    quotations: "quotations",

    bookings: "bookings",

    invoices: "invoices",

    vouchers: "vouchers",

    payments: "payments",

    expenses: "expenses",

    profitLoss: "profit-loss",

    team: "team",

    settings: "settings"

};


/* =========================================================
   17. DATE / TIME HELPERS
   ========================================================= */

window.MTM_DATE = {

    today: function () {

        const now = new Date();

        return now.toISOString()
            .split("T")[0];

    },

    timestamp: function () {

        return new Date();

    }

};


/* =========================================================
   18. CURRENCY FORMATTER
   ========================================================= */

window.formatCurrency = function (value) {

    const amount = Number(value) || 0;

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(amount);

};


/* =========================================================
   19. NUMBER FORMATTER
   ========================================================= */

window.formatNumber = function (value) {

    const number = Number(value) || 0;

    return new Intl.NumberFormat(
        "en-IN"
    ).format(number);

};


/* =========================================================
   20. APPLICATION ERROR LOGGER
   ========================================================= */

window.mtmLogError = function (error, context) {

    console.error(
        "[MTM ERP ERROR]",
        context || "Unknown Context",
        error
    );

};


/* =========================================================
   21. CONFIGURATION READY FLAG
   ========================================================= */

window.MTM_CONFIG_READY = true;


/* =========================================================
   END OF CONFIGURATION
   ========================================================= */
