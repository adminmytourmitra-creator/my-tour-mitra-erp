```javascript
/* =========================================================
   MY TOUR MITRA ERP
   SETTINGS MODULE
   File: modules/settings/settings.js

   Purpose:
   - Load settings from Firestore
   - Save company settings
   - Save taxation / GST / TDS / VAT settings
   - Save document settings
   - Save numbering settings
   - Save payment settings
   - Save currency settings
   - Save system settings
   - Save security settings
   - Handle Settings sidebar tabs

   IMPORTANT:
   - This file does NOT change other modules.
   - Firebase configuration is taken from js/firebase.js.
   ========================================================= */


/* =========================================================
   FIREBASE
   ========================================================= */

import {
    db,
    auth
} from "../../js/firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



/* =========================================================
   SETTINGS COLLECTION
   ========================================================= */

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOCUMENT = "general";



/* =========================================================
   MODULE STATE
   ========================================================= */

let settingsData = {};



/* =========================================================
   DEFAULT SETTINGS
   ========================================================= */

const DEFAULT_SETTINGS = {

    company: {
        companyName: "My Tour Mitra",
        companyEmail: "",
        companyPhone: "",
        companyWhatsApp: "",
        companyWebsite: "",
        companyAddress: "",
        companyCity: "",
        companyState: "",
        companyCountry: "India",
        companyPincode: "",
        companyGSTIN: "",
        companyPAN: "",
        companyCIN: "",
        companyRegNumber: "",
        companyLogo: ""
    },


    taxation: {
        taxSystem: "GST",
        taxInclusive: "exclusive",
        defaultTaxRate: 5,
        serviceTaxRate: 18,
        enableTax: true,
        showTaxBreakdown: true,
        showTaxNumber: true
    },


    gst: {
        gstRegistrationType: "regular",
        gstinSettings: "",
        defaultCGST: 2.5,
        defaultSGST: 2.5,
        defaultIGST: 5,

        rates: [
            {
                name: "Standard 5%",
                gst: 5,
                cgst: 2.5,
                sgst: 2.5,
                igst: 5,
                status: "Active"
            },
            {
                name: "Standard 18%",
                gst: 18,
                cgst: 9,
                sgst: 9,
                igst: 18,
                status: "Active"
            }
        ]
    },


    tds: {
        enableTDS: "disabled",
        tdsRate: 0,
        tdsSection: "",
        tdsThreshold: 0
    },


    vat: {
        enableVAT: "disabled",
        vatRegistrationNumber: "",
        defaultVATRate: 0
    },


    documents: {
        documentShowLogo: true,
        documentShowAddress: true,
        documentShowContact: true,
        documentShowGST: true,
        documentShowBank: false,
        documentShowTerms: true,
        defaultTermsConditions: ""
    },


    numbering: {
        quotationPrefix: "QT",
        quotationNextNumber: 1,

        bookingPrefix: "BK",
        bookingNextNumber: 1,

        invoicePrefix: "INV",
        invoiceNextNumber: 1,

        voucherPrefix: "VCH",
        voucherNextNumber: 1,

        paymentPrefix: "PAY",
        paymentNextNumber: 1
    },


    payments: {
        methods: {
            cash: true,
            bank: true,
            upi: true,
            card: true,
            cheque: false,
            other: false
        },

        paymentDueDays: 0,
        defaultPaymentTerms: "advance"
    },


    currency: {
        defaultCurrency: "INR",
        currencySymbol: "₹",
        decimalPlaces: 2,
        dateFormat: "DD-MM-YYYY"
    },


    system: {
        autoSaveForms: true,
        confirmBeforeDelete: true,
        activityLogging: true,
        systemNotifications: true,
        defaultFollowupDays: 2,
        followupReminder: "same-day"
    },


    security: {
        requireApprovedAccount: true,
        blockInactiveUsers: true,
        restrictTeamManagement: true,
        sessionTimeout: 60
    }

};



/* =========================================================
   DOM HELPER
   ========================================================= */

function getElement(id) {

    return document.getElementById(id);

}



function setValue(id, value) {

    const element = getElement(id);

    if (!element) return;

    if (element.type === "checkbox") {

        element.checked = Boolean(value);

    } else {

        element.value = value ?? "";

    }

}



function getValue(id) {

    const element = getElement(id);

    if (!element) return "";

    if (element.type === "checkbox") {

        return element.checked;

    }

    return element.value;

}



function getNumberValue(id) {

    const value = Number(getValue(id));

    return Number.isFinite(value) ? value : 0;

}



/* =========================================================
   DEEP MERGE
   ========================================================= */

function mergeSettings(defaults, saved) {

    const result = structuredClone(defaults);

    if (!saved || typeof saved !== "object") {

        return result;

    }

    Object.keys(saved).forEach(section => {

        if (
            saved[section] &&
            typeof saved[section] === "object" &&
            !Array.isArray(saved[section])
        ) {

            result[section] = {
                ...(result[section] || {}),
                ...saved[section]
            };

        } else {

            result[section] = saved[section];

        }

    });

    return result;

}



/* =========================================================
   LOAD SETTINGS
   ========================================================= */

async function loadSettings() {

    try {

        const settingsRef = doc(
            db,
            SETTINGS_COLLECTION,
            SETTINGS_DOCUMENT
        );

        const snapshot = await getDoc(settingsRef);

        if (snapshot.exists()) {

            settingsData = mergeSettings(
                DEFAULT_SETTINGS,
                snapshot.data()
            );

        } else {

            settingsData = structuredClone(DEFAULT_SETTINGS);

        }

        populateSettings();

        return settingsData;

    } catch (error) {

        console.error(
            "Error loading settings:",
            error
        );

        settingsData = structuredClone(DEFAULT_SETTINGS);

        populateSettings();

        showMessage(
            "Unable to load saved settings.",
            true
        );

        return settingsData;

    }

}



/* =========================================================
   SAVE SETTINGS
   ========================================================= */

async function saveSettings() {

    try {

        const settingsRef = doc(
            db,
            SETTINGS_COLLECTION,
            SETTINGS_DOCUMENT
        );

        await setDoc(
            settingsRef,
            {
                ...settingsData,
                updatedAt: serverTimestamp()
            },
            {
                merge: true
            }
        );

        showMessage(
            "Settings saved successfully."
        );

        return true;

    } catch (error) {

        console.error(
            "Error saving settings:",
            error
        );

        showMessage(
            "Unable to save settings.",
            true
        );

        return false;

    }

}



/* =========================================================
   COMPANY SETTINGS
   ========================================================= */

function collectCompanySettings() {

    settingsData.company = {

        companyName: getValue("companyName"),

        companyEmail: getValue("companyEmail"),

        companyPhone: getValue("companyPhone"),

        companyWhatsApp: getValue("companyWhatsApp"),

        companyWebsite: getValue("companyWebsite"),

        companyAddress: getValue("companyAddress"),

        companyCity: getValue("companyCity"),

        companyState: getValue("companyState"),

        companyCountry: getValue("companyCountry"),

        companyPincode: getValue("companyPincode"),

        companyGSTIN: getValue("companyGSTIN"),

        companyPAN: getValue("companyPAN"),

        companyCIN: getValue("companyCIN"),

        companyRegNumber: getValue("companyRegNumber"),

        companyLogo:
            settingsData.company?.companyLogo || ""

    };

}



async function saveCompanySettings() {

    collectCompanySettings();

    await saveSettings();

}



/* =========================================================
   TAX SETTINGS
   ========================================================= */

function collectTaxSettings() {

    settingsData.taxation = {

        taxSystem: getValue("taxSystem"),

        taxInclusive: getValue("taxInclusive"),

        defaultTaxRate:
            getNumberValue("defaultTaxRate"),

        serviceTaxRate:
            getNumberValue("serviceTaxRate"),

        enableTax:
            getValue("enableTax"),

        showTaxBreakdown:
            getValue("showTaxBreakdown"),

        showTaxNumber:
            getValue("showTaxNumber")

    };

}



async function saveTaxSettings() {

    collectTaxSettings();

    await saveSettings();

}



/* =========================================================
   GST SETTINGS
   ========================================================= */

function collectGSTSettings() {

    settingsData.gst = {

        ...settingsData.gst,

        gstRegistrationType:
            getValue("gstRegistrationType"),

        gstinSettings:
            getValue("gstinSettings"),

        defaultCGST:
            getNumberValue("defaultCGST"),

        defaultSGST:
            getNumberValue("defaultSGST"),

        defaultIGST:
            getNumberValue("defaultIGST")

    };

}



async function saveGSTSettings() {

    collectGSTSettings();

    await saveSettings();

}



/* =========================================================
   TDS SETTINGS
   ========================================================= */

function collectTDSSettings() {

    settingsData.tds = {

        enableTDS:
            getValue("enableTDS"),

        tdsRate:
            getNumberValue("tdsRate"),

        tdsSection:
            getValue("tdsSection"),

        tdsThreshold:
            getNumberValue("tdsThreshold")

    };

}



async function saveTDSSettings() {

    collectTDSSettings();

    await saveSettings();

}



/* =========================================================
   VAT SETTINGS
   ========================================================= */

function collectVATSettings() {

    settingsData.vat = {

        enableVAT:
            getValue("enableVAT"),

        vatRegistrationNumber:
            getValue("vatRegistrationNumber"),

        defaultVATRate:
            getNumberValue("defaultVATRate")

    };

}



async function saveVATSettings() {

    collectVATSettings();

    await saveSettings();

}



/* =========================================================
   DOCUMENT SETTINGS
   ========================================================= */

function collectDocumentSettings() {

    settingsData.documents = {

        documentShowLogo:
            getValue("documentShowLogo"),

        documentShowAddress:
            getValue("documentShowAddress"),

        documentShowContact:
            getValue("documentShowContact"),

        documentShowGST:
            getValue("documentShowGST"),

        documentShowBank:
            getValue("documentShowBank"),

        documentShowTerms:
            getValue("documentShowTerms"),

        defaultTermsConditions:
            getValue("defaultTermsConditions")

    };

}



async function saveDocumentSettings() {

    collectDocumentSettings();

    await saveSettings();

}



/* =========================================================
   NUMBERING SETTINGS
   ========================================================= */

function collectNumberingSettings() {

    settingsData.numbering = {

        quotationPrefix:
            getValue("quotationPrefix"),

        quotationNextNumber:
            getNumberValue("quotationNextNumber"),

        bookingPrefix:
            getValue("bookingPrefix"),

        bookingNextNumber:
            getNumberValue("bookingNextNumber"),

        invoicePrefix:
            getValue("invoicePrefix"),

        invoiceNextNumber:
            getNumberValue("invoiceNextNumber"),

        voucherPrefix:
            getValue("voucherPrefix"),

        voucherNextNumber:
            getNumberValue("voucherNextNumber"),

        paymentPrefix:
            getValue("paymentPrefix"),

        paymentNextNumber:
            getNumberValue("paymentNextNumber")

    };

}



async function saveNumberingSettings() {

    collectNumberingSettings();

    await saveSettings();

}



/* =========================================================
   PAYMENT SETTINGS
   ========================================================= */

function collectPaymentSettings() {

    settingsData.payments = {

        methods: {

            cash:
                document.querySelector(
                    '[data-payment-method="cash"]'
                )?.checked || false,

            bank:
                document.querySelector(
                    '[data-payment-method="bank"]'
                )?.checked || false,

            upi:
                document.querySelector(
                    '[data-payment-method="upi"]'
                )?.checked || false,

            card:
                document.querySelector(
                    '[data-payment-method="card"]'
                )?.checked || false,

            cheque:
                document.querySelector(
                    '[data-payment-method="cheque"]'
                )?.checked || false,

            other:
                document.querySelector(
                    '[data-payment-method="other"]'
                )?.checked || false

        },

        paymentDueDays:
            getNumberValue("paymentDueDays"),

        defaultPaymentTerms:
            getValue("defaultPaymentTerms")

    };

}



async function savePaymentSettings() {

    collectPaymentSettings();

    await saveSettings();

}



/* =========================================================
   CURRENCY SETTINGS
   ========================================================= */

function collectCurrencySettings() {

    settingsData.currency = {

        defaultCurrency:
            getValue("defaultCurrency"),

        currencySymbol:
            getValue("currencySymbol"),

        decimalPlaces:
            getNumberValue("decimalPlaces"),

        dateFormat:
            getValue("dateFormat")

    };

}



async function saveCurrencySettings() {

    collectCurrencySettings();

    await saveSettings();

}



/* =========================================================
   SYSTEM SETTINGS
   ========================================================= */

function collectSystemSettings() {

    settingsData.system = {

        autoSaveForms:
            getValue("autoSaveForms"),

        confirmBeforeDelete:
            getValue("confirmBeforeDelete"),

        activityLogging:
            getValue("activityLogging"),

        systemNotifications:
            getValue("systemNotifications"),

        defaultFollowupDays:
            getNumberValue("defaultFollowupDays"),

        followupReminder:
            getValue("followupReminder")

    };

}



async function saveSystemSettings() {

    collectSystemSettings();

    await saveSettings();

}



/* =========================================================
   SECURITY SETTINGS
   ========================================================= */

function collectSecuritySettings() {

    settingsData.security = {

        requireApprovedAccount:
            getValue("requireApprovedAccount"),

        blockInactiveUsers:
            getValue("blockInactiveUsers"),

        restrictTeamManagement:
            getValue("restrictTeamManagement"),

        sessionTimeout:
            getNumberValue("sessionTimeout")

    };

}



async function saveSecuritySettings() {

    collectSecuritySettings();

    await saveSettings();

}



/* =========================================================
   POPULATE COMPANY
   ========================================================= */

function populateCompanySettings() {

    const data =
        settingsData.company || {};

    Object.keys(data).forEach(key => {

        setValue(key, data[key]);

    });

}



/* =========================================================
   POPULATE TAXATION
   ========================================================= */

function populateTaxSettings() {

    const data =
        settingsData.taxation || {};

    Object.keys(data).forEach(key => {

        setValue(key, data[key]);

    });

}



/* =========================================================
   POPULATE GST
   ========================================================= */

function populateGSTSettings() {

    const data =
        settingsData.gst || {};

    setValue(
        "gstRegistrationType",
        data.gstRegistrationType
    );

    setValue(
        "gstinSettings",
        data.gstinSettings
    );

    setValue(
        "defaultCGST",
        data.defaultCGST
    );

    setValue(
        "defaultSGST",
        data.defaultSGST
    );

    setValue(
        "defaultIGST",
        data.defaultIGST
    );

}



/* =========================================================
   POPULATE TDS
   ========================================================= */

function populateTDSSettings() {

    const data =
        settingsData.tds || {};

    setValue(
        "enableTDS",
        data.enableTDS
    );

    setValue(
        "tdsRate",
        data.tdsRate
    );

    setValue(
        "tdsSection",
        data.tdsSection
    );

    setValue(
        "tdsThreshold",
        data.tdsThreshold
    );

}



/* =========================================================
   POPULATE VAT
   ========================================================= */

function populateVATSettings() {

    const data =
        settingsData.vat || {};

    setValue(
        "enableVAT",
        data.enableVAT
    );

    setValue(
        "vatRegistrationNumber",
        data.vatRegistrationNumber
    );

    setValue(
        "defaultVATRate",
        data.defaultVATRate
    );

}



/* =========================================================
   POPULATE DOCUMENT SETTINGS
   ========================================================= */

function populateDocumentSettings() {

    const data =
        settingsData.documents || {};

    Object.keys(data).forEach(key => {

        setValue(key, data[key]);

    });

}



/* =========================================================
   POPULATE NUMBERING
   ========================================================= */

function populateNumberingSettings() {

    const data =
        settingsData.numbering || {};

    Object.keys(data).forEach(key => {

        setValue(key, data[key]);

    });

}



/* =========================================================
   POPULATE PAYMENT SETTINGS
   ========================================================= */

function populatePaymentSettings() {

    const data =
        settingsData.payments || {};

    const methods =
        data.methods || {};

    Object.keys(methods).forEach(method => {

        const checkbox =
            document.querySelector(
                `[data-payment-method="${method}"]`
            );

        if (checkbox) {

            checkbox.checked =
                Boolean(methods[method]);

        }

    });

    setValue(
        "paymentDueDays",
        data.paymentDueDays
    );

    setValue(
        "defaultPaymentTerms",
        data.defaultPaymentTerms
    );

}



/* =========================================================
   POPULATE CURRENCY
   ========================================================= */

function populateCurrencySettings() {

    const data =
        settingsData.currency || {};

    Object.keys(data).forEach(key => {

        setValue(key, data[key]);

    });

}



/* =========================================================
   POPULATE SYSTEM
   ========================================================= */

function populateSystemSettings() {

    const data =
        settingsData.system || {};

    Object.keys(data).forEach(key => {

        setValue(key, data[key]);

    });

}



/* =========================================================
   POPULATE SECURITY
   ========================================================= */

function populateSecuritySettings() {

    const data =
        settingsData.security || {};

    Object.keys(data).forEach(key => {

        setValue(key, data[key]);

    });

}



/* =========================================================
   POPULATE ALL SETTINGS
   ========================================================= */

function populateSettings() {

    populateCompanySettings();

    populateTaxSettings();

    populateGSTSettings();

    populateTDSSettings();

    populateVATSettings();

    populateDocumentSettings();

    populateNumberingSettings();

    populatePaymentSettings();

    populateCurrencySettings();

    populateSystemSettings();

    populateSecuritySettings();

    renderGSTRates();

}



/* =========================================================
   GST RATE TABLE
   ========================================================= */

function renderGSTRates() {

    const tbody =
        getElement("gstRateTableBody");

    if (!tbody) return;

    const rates =
        settingsData.gst?.rates || [];

    tbody.innerHTML = "";

    rates.forEach(rate => {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>
                ${escapeHTML(rate.name || "")}
            </td>

            <td>
                ${Number(rate.gst || 0)}%
            </td>

            <td>
                ${Number(rate.cgst || 0)}%
            </td>

            <td>
                ${Number(rate.sgst || 0)}%
            </td>

            <td>
                ${Number(rate.igst || 0)}%
            </td>

            <td>
                ${escapeHTML(rate.status || "Active")}
            </td>

        `;

        tbody.appendChild(row);

    });

}



/* =========================================================
   SETTINGS TAB NAVIGATION
   ========================================================= */

function initializeTabs() {

    const navItems =
        document.querySelectorAll(
            ".settings-nav-item"
        );

    const sections =
        document.querySelectorAll(
            ".settings-section"
        );


    navItems.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const target =
                    button.dataset.settingsTab;

                if (!target) return;


                navItems.forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });


                sections.forEach(section => {

                    section.classList.remove(
                        "active"
                    );

                });


                button.classList.add(
                    "active"
                );


                const section =
                    document.querySelector(
                        `[data-settings-section="${target}"]`
                    );


                if (section) {

                    section.classList.add(
                        "active"
                    );

                }

            }
        );

    });

}



/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function initializeSaveButtons() {


    getElement(
        "saveCompanySettingsBtn"
    )?.addEventListener(
        "click",
        saveCompanySettings
    );


    getElement(
        "saveTaxSettingsBtn"
    )?.addEventListener(
        "click",
        saveTaxSettings
    );


    getElement(
        "saveGSTSettingsBtn"
    )?.addEventListener(
        "click",
        saveGSTSettings
    );


    getElement(
        "saveTDSSettingsBtn"
    )?.addEventListener(
        "click",
        saveTDSSettings
    );


    getElement(
        "saveVATSettingsBtn"
    )?.addEventListener(
        "click",
        saveVATSettings
    );


    getElement(
        "saveDocumentSettingsBtn"
    )?.addEventListener(
        "click",
        saveDocumentSettings
    );


    getElement(
        "saveNumberingSettingsBtn"
    )?.addEventListener(
        "click",
        saveNumberingSettings
    );


    getElement(
        "savePaymentSettingsBtn"
    )?.addEventListener(
        "click",
        savePaymentSettings
    );


    getElement(
        "saveCurrencySettingsBtn"
    )?.addEventListener(
        "click",
        saveCurrencySettings
    );


    getElement(
        "saveSystemSettingsBtn"
    )?.addEventListener(
        "click",
        saveSystemSettings
    );


    getElement(
        "saveSecuritySettingsBtn"
    )?.addEventListener(
        "click",
        saveSecuritySettings
    );

}



/* =========================================================
   COMPANY LOGO PREVIEW
   ========================================================= */

function initializeLogoUpload() {

    const input =
        getElement("companyLogo");

    const preview =
        getElement("companyLogoPreview");

    if (!input || !preview) return;


    input.addEventListener(
        "change",
        event => {

            const file =
                event.target.files?.[0];

            if (!file) return;


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                showMessage(
                    "Please select a valid image.",
                    true
                );

                input.value = "";

                return;

            }


            const reader =
                new FileReader();


            reader.onload = () => {

                preview.innerHTML = "";

                const image =
                    document.createElement("img");

                image.src =
                    reader.result;

                image.alt =
                    "Company Logo Preview";

                preview.appendChild(
                    image
                );


                /*
                 * The image itself is not uploaded to
                 * Firebase Storage here.
                 *
                 * This keeps this module independent.
                 *
                 * Later, when Storage handling is added,
                 * the uploaded URL can be stored in:
                 *
                 * settingsData.company.companyLogo
                 */

            };


            reader.readAsDataURL(file);

        }
    );

}



/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    message,
    isError = false
) {

    const element =
        getElement("settingsSaveMessage");

    if (!element) {

        console.log(message);

        return;

    }


    element.textContent =
        message;

    element.hidden = false;

    element.classList.toggle(
        "error",
        isError
    );


    clearTimeout(
        showMessage.timeout
    );


    showMessage.timeout =
        setTimeout(
            () => {

                element.hidden = true;

            },
            3000
        );

}



/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}



/* =========================================================
   GET SETTINGS
   =========================================================
   Other modules can use this function.

   Example:

   import {
       getSettings
   } from "../settings/settings.js";

   const settings = getSettings();

   ========================================================= */

export function getSettings() {

    return settingsData;

}



/* =========================================================
   GET COMPANY SETTINGS
   ========================================================= */

export function getCompanySettings() {

    return settingsData.company || {};

}



/* =========================================================
   GET TAX SETTINGS
   ========================================================= */

export function getTaxSettings() {

    return settingsData.taxation || {};

}



/* =========================================================
   GET GST SETTINGS
   ========================================================= */

export function getGSTSettings() {

    return settingsData.gst || {};

}



/* =========================================================
   GET NUMBERING SETTINGS
   ========================================================= */

export function getNumberingSettings() {

    return settingsData.numbering || {};

}



/* =========================================================
   GENERATE DOCUMENT NUMBER
   =========================================================

   Example:

   generateDocumentNumber("invoice")

   -> INV000001

   ========================================================= */

export function generateDocumentNumber(
    type
) {

    const numbering =
        settingsData.numbering || {};

    const map = {

        quotation: [
            "quotationPrefix",
            "quotationNextNumber"
        ],

        booking: [
            "bookingPrefix",
            "bookingNextNumber"
        ],

        invoice: [
            "invoicePrefix",
            "invoiceNextNumber"
        ],

        voucher: [
            "voucherPrefix",
            "voucherNextNumber"
        ],

        payment: [
            "paymentPrefix",
            "paymentNextNumber"
        ]

    };


    const config =
        map[type];

    if (!config) {

        return "";

    }


    const prefix =
        numbering[config[0]] || "";

    const nextNumber =
        Number(
            numbering[config[1]]
        ) || 1;


    return (
        prefix +
        String(nextNumber)
            .padStart(6, "0")
    );

}



/* =========================================================
   INITIALIZE MODULE
   ========================================================= */

async function initializeSettingsModule() {

    /*
     * Wait until Firebase authentication state
     * is available before loading settings.
     */

    if (auth?.currentUser) {

        await loadSettings();

    } else {

        /*
         * If authentication state is not immediately
         * available, still load the UI with defaults.
         *
         * Firebase rules will ultimately control access.
         */

        settingsData =
            structuredClone(
                DEFAULT_SETTINGS
            );

        populateSettings();

    }


    initializeTabs();

    initializeSaveButtons();

    initializeLogoUpload();

}



/* =========================================================
   START
   ========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeSettingsModule,
        {
            once: true
        }
    );

} else {

    initializeSettingsModule();

}



/* =========================================================
   EXPORT
   ========================================================= */

export {
    loadSettings,
    saveSettings
};
```
