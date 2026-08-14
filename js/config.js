/* =========================================================
   MY TOUR MITRA ERP
   APPLICATION CONFIGURATION
   ========================================================= */

/**
 * Central configuration file.
 *
 * IMPORTANT:
 * - Do not put passwords here.
 * - Do not put service-account private keys here.
 * - Firebase Web App configuration is safe to use in frontend.
 * - Firestore Security Rules and Firebase Authentication
 *   are responsible for actual access protection.
 */


/* =========================================================
   1. APPLICATION INFORMATION
   ========================================================= */

export const APP_CONFIG = Object.freeze({

    name: "My Tour Mitra",

    shortName: "MTM",

    productName: "My Tour Mitra ERP",

    version: "1.0.0",

    environment: "production",

    currency: "INR",

    currencySymbol: "₹",

    country: "India",

    timezone: "Asia/Kolkata",

    dateFormat: "DD/MM/YYYY",

    timeFormat: "12-hour"

});


/* =========================================================
   2. FIREBASE CONFIGURATION
   ========================================================= */

/**
 * Replace these placeholder values with the Firebase Web App
 * configuration from:
 *
 * Firebase Console
 * → Project Settings
 * → Your apps
 * → Web App
 * → SDK setup and configuration
 *
 * Do NOT add:
 * - Firebase Admin SDK private key
 * - Service account JSON
 * - API secrets
 * - Private credentials
 */

export const FIREBASE_CONFIG = Object.freeze({

    apiKey: "YOUR_FIREBASE_API_KEY",

    authDomain:
        "YOUR_PROJECT_ID.firebaseapp.com",

    projectId:
        "YOUR_PROJECT_ID",

    storageBucket:
        "YOUR_PROJECT_ID.firebasestorage.app",

    messagingSenderId:
        "YOUR_MESSAGING_SENDER_ID",

    appId:
        "YOUR_FIREBASE_APP_ID"

});


/* =========================================================
   3. FIRESTORE COLLECTION NAMES
   ========================================================= */

/**
 * Central collection registry.
 *
 * Never hard-code collection names throughout modules.
 * All modules will import COLLECTIONS from this file.
 */

export const COLLECTIONS = Object.freeze({

    customers: "customers",

    enquiries: "enquiries",

    packages: "packages",

    quotations: "quotations",

    followups: "followups",

    bookings: "bookings",

    invoices: "invoices",

    vouchers: "vouchers",

    payments: "payments",

    expenses: "expenses",

    users: "users",

    settings: "settings",

    counters: "counters"

});


/* =========================================================
   4. BUSINESS ID PREFIXES
   ========================================================= */

/**
 * Every business record receives a human-readable ID.
 *
 * Examples:
 *
 * CUS0001
 * ENQ0001
 * PKG0001
 * QTN0001
 * FUP0001
 * BKG0001
 * INV0001
 * VCH0001
 * PAY0001
 * EXP0001
 * USR0001
 *
 * IDs will be generated centrally using Firestore
 * transactions. Modules must NOT generate IDs themselves.
 */

export const ID_PREFIXES = Object.freeze({

    customers: "CUS",

    enquiries: "ENQ",

    packages: "PKG",

    quotations: "QTN",

    followups: "FUP",

    bookings: "BKG",

    invoices: "INV",

    vouchers: "VCH",

    payments: "PAY",

    expenses: "EXP",

    users: "USR"

});


/* =========================================================
   5. ID FORMAT SETTINGS
   ========================================================= */

export const ID_CONFIG = Object.freeze({

    digits: 4,

    separator: "",

    startingNumber: 1

});


/* =========================================================
   6. USER ROLES
   ========================================================= */

/**
 * Roles will be enforced through application permissions
 * AND Firestore Security Rules.
 */

export const USER_ROLES = Object.freeze({

    ADMIN: "admin",

    MANAGER: "manager",

    STAFF: "staff",

    ACCOUNTS: "accounts",

    VIEWER: "viewer"

});


/* =========================================================
   7. RECORD STATUS
   ========================================================= */

export const RECORD_STATUS = Object.freeze({

    ACTIVE: "active",

    INACTIVE: "inactive",

    DRAFT: "draft",

    CANCELLED: "cancelled",

    DELETED: "deleted"

});


/* =========================================================
   8. ENQUIRY STATUS
   ========================================================= */

export const ENQUIRY_STATUS = Object.freeze({

    NEW: "new",

    CONTACTED: "contacted",

    PACKAGE_CREATED: "package_created",

    QUOTED: "quoted",

    FOLLOW_UP: "follow_up",

    WON: "won",

    LOST: "lost",

    CANCELLED: "cancelled"

});


/* =========================================================
   9. QUOTATION STATUS
   ========================================================= */

export const QUOTATION_STATUS = Object.freeze({

    DRAFT: "draft",

    SENT: "sent",

    FOLLOW_UP: "follow_up",

    ACCEPTED: "accepted",

    REJECTED: "rejected",

    EXPIRED: "expired",

    CANCELLED: "cancelled"

});


/* =========================================================
   10. BOOKING STATUS
   ========================================================= */

export const BOOKING_STATUS = Object.freeze({

    PENDING: "pending",

    CONFIRMED: "confirmed",

    PARTIALLY_PAID: "partially_paid",

    FULLY_PAID: "fully_paid",

    CANCELLED: "cancelled",

    COMPLETED: "completed"

});


/* =========================================================
   11. PAYMENT STATUS
   ========================================================= */

export const PAYMENT_STATUS = Object.freeze({

    PENDING: "pending",

    PARTIAL: "partial",

    PAID: "paid",

    REFUNDED: "refunded",

    CANCELLED: "cancelled"

});


/* =========================================================
   12. PAYMENT METHODS
   ========================================================= */

export const PAYMENT_METHODS = Object.freeze({

    CASH: "cash",

    UPI: "upi",

    BANK_TRANSFER: "bank_transfer",

    CARD: "card",

    CHEQUE: "cheque",

    ONLINE: "online",

    OTHER: "other"

});


/* =========================================================
   13. VOUCHER TYPES
   ========================================================= */

export const VOUCHER_TYPES = Object.freeze({

    TOUR: "tour",

    HOTEL: "hotel",

    CAB: "cab",

    ACTIVITY: "activity",

    OTHER: "other"

});


/* =========================================================
   14. EXPENSE TYPES
   ========================================================= */

export const EXPENSE_TYPES = Object.freeze({

    HOTEL: "hotel",

    CAB: "cab",

    ACTIVITY: "activity",

    FLIGHT: "flight",

    TRAIN: "train",

    VISA: "visa",

    DMC: "dmc",

    FOOD: "food",

    OFFICE: "office",

    MARKETING: "marketing",

    SALARY: "salary",

    OTHER: "other"

});


/* =========================================================
   15. DATE / TIME SETTINGS
   ========================================================= */

export const DATE_TIME_CONFIG = Object.freeze({

    locale: "en-IN",

    timezone: "Asia/Kolkata",

    dateOptions: Object.freeze({

        day: "2-digit",

        month: "2-digit",

        year: "numeric"

    }),

    dateTimeOptions: Object.freeze({

        day: "2-digit",

        month: "2-digit",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit"

    })

});


/* =========================================================
   16. PAGINATION
   ========================================================= */

export const PAGINATION = Object.freeze({

    defaultPageSize: 25,

    pageSizeOptions: Object.freeze([
        10,
        25,
        50,
        100
    ])

});


/* =========================================================
   17. FILE UPLOAD SETTINGS
   ========================================================= */

export const FILE_CONFIG = Object.freeze({

    maxFileSizeMB: 10,

    allowedImageTypes: Object.freeze([
        "image/jpeg",
        "image/png",
        "image/webp"
    ]),

    allowedDocumentTypes: Object.freeze([
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp"
    ])

});


/* =========================================================
   18. PDF SETTINGS
   ========================================================= */

export const PDF_CONFIG = Object.freeze({

    quotationFilePrefix: "Quotation",

    invoiceFilePrefix: "Invoice",

    voucherFilePrefix: "Voucher",

    paperSize: "A4",

    orientation: "portrait"

});


/* =========================================================
   19. DASHBOARD SETTINGS
   ========================================================= */

export const DASHBOARD_CONFIG = Object.freeze({

    recentRecordsLimit: 10,

    upcomingFollowupsLimit: 10,

    pendingPaymentsLimit: 10,

    pendingExpensesLimit: 10

});


/* =========================================================
   20. APPLICATION FEATURES
   ========================================================= */

export const FEATURES = Object.freeze({

    quotations: true,

    quotationPDF: true,

    followups: true,

    bookings: true,

    invoices: true,

    invoicePDF: true,

    vouchers: true,

    voucherPDF: true,

    payments: true,

    expenses: true,

    profitLoss: true,

    teamManagement: true,

    companySettings: true

});


/* =========================================================
   21. VALIDATION
   ========================================================= */

/**
 * Checks whether Firebase configuration has been replaced
 * with real project values.
 *
 * This prevents the application from silently trying to
 * connect with placeholder configuration.
 */

export function isFirebaseConfigured() {

    const placeholderValues = [

        "YOUR_FIREBASE_API_KEY",

        "YOUR_PROJECT_ID",

        "YOUR_MESSAGING_SENDER_ID",

        "YOUR_FIREBASE_APP_ID"

    ];


    return !Object.values(FIREBASE_CONFIG).some(
        value => placeholderValues.includes(value)
    );

}


/* =========================================================
   22. ENVIRONMENT HELPERS
   ========================================================= */

export function isProduction() {

    return APP_CONFIG.environment === "production";

}


export function isDevelopment() {

    return APP_CONFIG.environment === "development";

}


/* =========================================================
   23. ID FORMATTER
   ========================================================= */

/**
 * Converts a number into the required ERP ID.
 *
 * Example:
 *
 * formatBusinessId("CUS", 1)
 * → CUS0001
 *
 * formatBusinessId("BKG", 25)
 * → BKG0025
 */

export function formatBusinessId(prefix, number) {

    const numericValue = Number(number);


    if (
        !prefix ||
        !Number.isInteger(numericValue) ||
        numericValue < 1
    ) {
        throw new Error(
            "Invalid business ID parameters."
        );
    }


    const paddedNumber = String(numericValue)
        .padStart(ID_CONFIG.digits, "0");


    return `${prefix}${ID_CONFIG.separator}${paddedNumber}`;

}


/* =========================================================
   24. GET PREFIX
   ========================================================= */

export function getIdPrefix(collectionName) {

    const prefix = ID_PREFIXES[collectionName];


    if (!prefix) {

        throw new Error(
            `No ID prefix configured for collection: ${collectionName}`
        );

    }


    return prefix;

}


/* =========================================================
   25. GET COLLECTION
   ========================================================= */

export function getCollectionName(moduleName) {

    const collection = COLLECTIONS[moduleName];


    if (!collection) {

        throw new Error(
            `No Firestore collection configured for module: ${moduleName}`
        );

    }


    return collection;

}
