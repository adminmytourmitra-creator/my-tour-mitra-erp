// ============================================================
// MY TOUR MITRA ERP
// QUOTATION PDF GENERATOR
// ============================================================
//
// This file ONLY handles quotation PDF generation/sharing.
//
// Company Settings will later be connected through:
// localStorage key = "myTourMitraSettings"
//
// Logo and QR Code:
// Data URL stored in localStorage.
// NO Firebase Storage required.
//
// ============================================================


// ============================================================
// SETTINGS
// ============================================================

const SETTINGS_KEY = "myTourMitraSettings";

const DEFAULT_SETTINGS = {
    companyName: "My Tour Mitra",
    tagline: "Travel ERP",

    logoDataUrl: "",

    phone: "",
    whatsapp: "",
    email: "",
    website: "",

    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",

    gstNumber: "",
    panNumber: "",

    bankName: "",
    accountName: "",
    accountNumber: "",
    ifsc: "",
    upiId: "",

    qrCodeDataUrl: "",

    quotationTerms: "",
    quotationFooter: ""
};


// ============================================================
// LOAD SETTINGS
// ============================================================

function getCompanySettings() {

    try {

        const saved = localStorage.getItem(SETTINGS_KEY);

        if (!saved) {
            return { ...DEFAULT_SETTINGS };
        }

        const parsed = JSON.parse(saved);

        return {
            ...DEFAULT_SETTINGS,
            ...parsed
        };

    } catch (error) {

        console.error(
            "My Tour Mitra Settings Error:",
            error
        );

        return {
            ...DEFAULT_SETTINGS
        };
    }
}


// ============================================================
// SAFE HTML
// ============================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// RICH TEXT
// ============================================================
//
// Package Master itinerary may contain:
// <ul>
// <li>
// <b>
// <strong>
// <u>
// <span>
// etc.
//
// We want HTML rendered, NOT displayed as text.
// ============================================================

function renderRichText(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "";
    }

    const container = document.createElement("div");

    container.innerHTML = String(value);

    container
        .querySelectorAll("script, style")
        .forEach(element => element.remove());

    return container.innerHTML;
}


// ============================================================
// DEEP VALUE HELPER
// ============================================================
//
// This is important.
//
// Different quotation versions may save data like:
//
// quotation.packageCost
// quotation.pricing.packageCost
// quotation.costing.packageCost
// quotation.package_cost
//
// This function checks all of them.
// ============================================================

function getValue(object, paths, fallback = "") {

    for (const path of paths) {

        if (!path) continue;

        const parts = path.split(".");

        let current = object;

        let found = true;

        for (const part of parts) {

            if (
                current === undefined ||
                current === null ||
                current[part] === undefined ||
                current[part] === null
            ) {
                found = false;
                break;
            }

            current = current[part];
        }

        if (
            found &&
            current !== "" &&
            current !== null &&
            current !== undefined
        ) {

            return current;
        }
    }

    return fallback;
}


// ============================================================
// NUMBER
// ============================================================

function getNumber(object, paths, fallback = 0) {

    const value = getValue(
        object,
        paths,
        fallback
    );

    const number = Number(
        String(value)
            .replace(/₹/g, "")
            .replace(/,/g, "")
            .trim()
    );

    return Number.isFinite(number)
        ? number
        : fallback;
}


// ============================================================
// CURRENCY
// ============================================================

function formatCurrency(value) {

    const number = Number(value || 0);

    return "₹" + number.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


// ============================================================
// DATE
// ============================================================

function formatDate(value) {

    if (!value) {
        return "-";
    }

    try {

        const stringValue = String(value);

        const date = new Date(
            stringValue.length === 10
                ? stringValue + "T00:00:00"
                : stringValue
        );

        if (Number.isNaN(date.getTime())) {
            return escapeHtml(value);
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    } catch {
        return escapeHtml(value);
    }
}


// ============================================================
// HTML2PDF LOADER
// ============================================================

function loadHtml2Pdf() {

    return new Promise((resolve, reject) => {

        if (
            typeof window.html2pdf === "function"
        ) {

            resolve(window.html2pdf);
            return;
        }


        const existingScript =
            document.querySelector(
                'script[data-mytourmitra-html2pdf="true"]'
            );


        if (existingScript) {

            existingScript.addEventListener(
                "load",
                () => {

                    if (
                        typeof window.html2pdf ===
                        "function"
                    ) {

                        resolve(window.html2pdf);

                    } else {

                        reject(
                            new Error(
                                "html2pdf loaded but unavailable."
                            )
                        );
                    }
                }
            );


            existingScript.addEventListener(
                "error",
                () => {

                    reject(
                        new Error(
                            "Could not load html2pdf."
                        )
                    );
                }
            );

            return;
        }


        const script =
            document.createElement("script");


        script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";


        script.async = true;


        script.dataset.mytourmitraHtml2pdf =
            "true";


        script.onload = () => {

            if (
                typeof window.html2pdf ===
                "function"
            ) {

                resolve(window.html2pdf);

            } else {

                reject(
                    new Error(
                        "PDF library unavailable."
                    )
                );
            }
        };


        script.onerror = () => {

            reject(
                new Error(
                    "Unable to load PDF library."
                )
            );
        };


        document.head.appendChild(script);

    });
}


// ============================================================
// ARRAY NORMALIZER
// ============================================================

function normalizeArray(value) {

    if (Array.isArray(value)) {
        return value;
    }

    if (
        value &&
        typeof value === "object"
    ) {

        return Object.values(value);
    }

    return [];
}


// ============================================================
// ITINERARY
// ============================================================

function getItinerary(quotation) {

    const value = getValue(
        quotation,
        [
            "itinerary",
            "packageItinerary",
            "itineraryDays",
            "days",
            "dayWiseItinerary",
            "package.itinerary",
            "package.itineraryDays",
            "package.days"
        ],
        []
    );

    return normalizeArray(value);
}


// ============================================================
// HOTELS
// ============================================================

function getHotels(quotation) {

    const value = getValue(
        quotation,
        [
            "hotels",
            "hotelDetails",
            "selectedHotels",
            "hotelData",
            "hotelSelections",
            "packageHotels"
        ],
        []
    );

    return normalizeArray(value);
}


// ============================================================
// TRANSPORT
// ============================================================

function getTransport(quotation) {

    const value = getValue(
        quotation,
        [
            "transportation",
            "transport",
            "cabDetails",
            "selectedCabs",
            "selectedCab",
            "cab",
            "vehicle",
            "vehicles"
        ],
        []
    );


    if (Array.isArray(value)) {
        return value;
    }


    if (
        value &&
        typeof value === "object"
    ) {

        return [value];
    }


    if (
        typeof value === "string" &&
        value.trim()
    ) {

        return [
            {
                vehicle: value
            }
        ];
    }


    return [];
}


// ============================================================
// INCLUSIONS / EXCLUSIONS
// ============================================================

function getList(
    quotation,
    paths
) {

    const value =
        getValue(
            quotation,
            paths,
            []
        );


    if (Array.isArray(value)) {
        return value;
    }


    if (
        typeof value === "string"
    ) {

        return value
            .split(/\r?\n/)
            .map(item => item.trim())
            .filter(Boolean);
    }


    return [];
}


// ============================================================
// LOGO
// ============================================================

function getLogo(settings) {

    return getValue(
        settings,
        [
            "logoDataUrl",
            "companyLogo",
            "logo",
            "logoUrl"
        ],
        ""
    );
}


// ============================================================
// QR
// ============================================================

function getQrCode(settings) {

    return getValue(
        settings,
        [
            "qrCodeDataUrl",
            "upiQrCode",
            "qrCode",
            "paymentQr"
        ],
        ""
    );
}


// ============================================================
// COMPANY ADDRESS
// ============================================================

function getCompanyAddress(settings) {

    return [
        settings.address,
        settings.city,
        settings.state,
        settings.pincode,
        settings.country
    ]
        .filter(
            value =>
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
        )
        .join(", ");
}


// ============================================================
// COMPANY CONTACT
// ============================================================

function getContactLine(settings) {

    const parts = [];

    if (settings.phone) {
        parts.push(
            `Phone: ${settings.phone}`
        );
    }

    if (settings.whatsapp) {
        parts.push(
            `WhatsApp: ${settings.whatsapp}`
        );
    }

    if (settings.email) {
        parts.push(
            `Email: ${settings.email}`
        );
    }

    if (settings.website) {
        parts.push(
            `Website: ${settings.website}`
        );
    }

    return parts.join("  |  ");
}


// ============================================================
// QUOTATION HTML
// ============================================================

function buildQuotationHTML(quotation) {

    const settings =
        getCompanySettings();


    // --------------------------------------------------------
    // BASIC DETAILS
    // --------------------------------------------------------

    const quotationId =
        getValue(
            quotation,
            [
                "quotationId",
                "quotationID",
                "id"
            ],
            "-"
        );


    const customer =
        getValue(
            quotation,
            [
                "customerName",
                "customer",
                "customer.name",
                "name"
            ],
            "-"
        );


    const enquiry =
        getValue(
            quotation,
            [
                "enquiryReference",
                "enquiryId",
                "enquiry",
                "enquiry.id",
                "enquiry.reference"
            ],
            "-"
        );


    const packageName =
        getValue(
            quotation,
            [
                "packageName",
                "package",
                "tourName",
                "package.name"
            ],
            "-"
        );


    const destination =
        getValue(
            quotation,
            [
                "destination",
                "destinations",
                "packageDestination",
                "package.destination"
            ],
            "-"
        );


    const startDate =
        getValue(
            quotation,
            [
                "travelStartDate",
                "startDate",
                "travel.startDate"
            ],
            ""
        );


    const endDate =
        getValue(
            quotation,
            [
                "travelEndDate",
                "endDate",
                "travel.endDate"
            ],
            ""
        );


    const adults =
        getNumber(
            quotation,
            [
                "adults",
                "adultCount",
                "pax.adults",
                "travel.adults"
            ],
            0
        );


    const children =
        getNumber(
            quotation,
            [
                "children",
                "childCount",
                "pax.children",
                "travel.children"
            ],
            0
        );


    const rooms =
        getNumber(
            quotation,
            [
                "rooms",
                "roomCount",
                "travel.rooms"
            ],
            0
        );


    const pax =
        getNumber(
            quotation,
            [
                "pax",
                "totalPax",
                "passengers"
            ],
            adults + children
        );


    // --------------------------------------------------------
    // PRICING
    // --------------------------------------------------------

    const packageCost =
        getNumber(
            quotation,
            [
                "packageCost",
                "package_cost",
                "cost",
                "baseCost",
                "totalPackageCost",
                "pricing.packageCost",
                "pricing.package_cost",
                "pricing.cost",
                "pricing.baseCost",
                "costing.packageCost",
                "costing.package_cost",
                "amount.packageCost"
            ],
            0
        );


    const discount =
        getNumber(
            quotation,
            [
                "discount",
                "discountAmount",
                "pricing.discount",
                "pricing.discountAmount",
                "costing.discount"
            ],
            0
        );


    const gst =
        getNumber(
            quotation,
            [
                "gst",
                "gstAmount",
                "gstValue",
                "pricing.gst",
                "pricing.gstAmount",
                "costing.gst"
            ],
            0
        );


    const grandTotal =
        getNumber(
            quotation,
            [
                "grandTotal",
                "totalAmount",
                "total",
                "finalAmount",
                "pricing.grandTotal",
                "pricing.totalAmount",
                "pricing.total",
                "costing.grandTotal"
            ],
            packageCost - discount + gst
        );


    const perPerson =
        getNumber(
            quotation,
            [
                "perPerson",
                "perPersonAmount",
                "pricePerPerson",
                "pricing.perPerson",
                "pricing.perPersonAmount"
            ],
            pax > 0
                ? grandTotal / pax
                : 0
        );


    // --------------------------------------------------------
    // DATA
    // --------------------------------------------------------

    const itinerary =
        getItinerary(quotation);


    const hotels =
        getHotels(quotation);


    const transport =
        getTransport(quotation);


    const inclusions =
        getList(
            quotation,
            [
                "inclusions",
                "included",
                "packageInclusions"
            ]
        );


    const exclusions =
        getList(
            quotation,
            [
                "exclusions",
                "excluded",
                "packageExclusions"
            ]
        );


    const terms =
        getValue(
            quotation,
            [
                "terms",
                "termsAndConditions"
            ],
            settings.quotationTerms
        );


    const logo =
        getLogo(settings);


    const qrCode =
        getQrCode(settings);


    const companyAddress =
        getCompanyAddress(settings);


    const contactLine =
        getContactLine(settings);


    // ========================================================
    // LOGO
    // ========================================================

    const logoHTML =
        logo
            ? `
                <img
                    src="${escapeHtml(logo)}"
                    class="company-logo"
                    alt="My Tour Mitra Logo"
                >
            `
            : `
                <div class="logo-placeholder">
                    My Tour<br>Mitra
                </div>
            `;


    // ========================================================
    // TRANSPORT HTML
    // ========================================================

    const transportHTML =
        transport.length
            ? transport
                .map(item => {

                    if (
                        typeof item === "string"
                    ) {

                        return `
                            <tr>
                                <td>
                                    ${escapeHtml(item)}
                                </td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                        `;
                    }


                    const vehicle =
                        getValue(
                            item,
                            [
                                "vehicleName",
                                "vehicle",
                                "cabName",
                                "cab",
                                "name",
                                "vehicle.name"
                            ],
                            "-"
                        );


                    const type =
                        getValue(
                            item,
                            [
                                "vehicleType",
                                "type",
                                "category",
                                "cabType",
                                "vehicleCategory"
                            ],
                            "-"
                        );


                    const capacity =
                        getValue(
                            item,
                            [
                                "capacity",
                                "seatingCapacity",
                                "pax",
                                "seating",
                                "vehicleCapacity"
                            ],
                            "-"
                        );


                    const details =
                        getValue(
                            item,
                            [
                                "details",
                                "description",
                                "remarks",
                                "note"
                            ],
                            "-"
                        );


                    return `
                        <tr>

                            <td>
                                <strong>
                                    ${escapeHtml(vehicle)}
                                </strong>
                            </td>

                            <td>
                                ${escapeHtml(type)}
                            </td>

                            <td>
                                ${escapeHtml(capacity)}
                            </td>

                            <td>
                                ${escapeHtml(details)}
                            </td>

                        </tr>
                    `;

                })
                .join("")
            : `
                <tr>
                    <td colspan="4" class="muted">
                        Transportation details not added.
                    </td>
                </tr>
            `;


    // ========================================================
    // HOTEL HTML
    // ========================================================

    const hotelHTML =
        hotels.length
            ? hotels
                .map(hotel => {

                    if (
                        typeof hotel === "string"
                    ) {

                        return `
                            <tr>

                                <td>-</td>

                                <td>
                                    <strong>
                                        ${escapeHtml(hotel)}
                                    </strong>
                                </td>

                                <td>-</td>

                                <td>-</td>

                            </tr>
                        `;
                    }


                    const city =
                        getValue(
                            hotel,
                            [
                                "destination",
                                "city",
                                "location",
                                "place",
                                "destinationName"
                            ],
                            "-"
                        );


                    const hotelName =
                        getValue(
                            hotel,
                            [
                                "hotelName",
                                "hotel",
                                "name",
                                "propertyName",
                                "selectedHotel",
                                "hotel.name"
                            ],
                            "-"
                        );


                    const room =
                        getValue(
                            hotel,
                            [
                                "roomType",
                                "room",
                                "roomCategory",
                                "rooms",
                                "category"
                            ],
                            "-"
                        );


                    const meal =
                        getValue(
                            hotel,
                            [
                                "mealPlan",
                                "meal",
                                "meals",
                                "mealType"
                            ],
                            "-"
                        );


                    return `
                        <tr>

                            <td>
                                ${escapeHtml(city)}
                            </td>

                            <td>
                                <strong>
                                    ${escapeHtml(hotelName)}
                                </strong>
                            </td>

                            <td>
                                ${escapeHtml(room)}
                            </td>

                            <td>
                                ${escapeHtml(meal)}
                            </td>

                        </tr>
                    `;

                })
                .join("")
            : `
                <tr>
                    <td colspan="4" class="muted">
                        Hotel details not added.
                    </td>
                </tr>
            `;


    // ========================================================
    // ITINERARY HTML
    // ========================================================

    const itineraryHTML =
        itinerary.length
            ? itinerary
                .map((day, index) => {

                    if (
                        typeof day === "string"
                    ) {

                        return `
                            <div class="itinerary-day">

                                <div class="day-heading">
                                    Day ${index + 1}
                                </div>

                                <div class="day-description">
                                    ${renderRichText(day)}
                                </div>

                            </div>
                        `;
                    }


                    const dayNumber =
                        getValue(
                            day,
                            [
                                "dayNumber",
                                "day",
                                "number"
                            ],
                            index + 1
                        );


                    const title =
                        getValue(
                            day,
                            [
                                "title",
                                "heading",
                                "name",
                                "dayTitle"
                            ],
                            ""
                        );


                    const description =
                        getValue(
                            day,
                            [
                                "description",
                                "details",
                                "content",
                                "itinerary",
                                "activities",
                                "plan"
                            ],
                            ""
                        );


                    return `
                        <div class="itinerary-day">

                            <div class="day-heading">

                                Day ${escapeHtml(dayNumber)}

                                ${
                                    title
                                        ? `
                                            <span>
                                                — ${escapeHtml(title)}
                                            </span>
                                        `
                                        : ""
                                }

                            </div>

                            <div class="day-description">

                                ${renderRichText(description)}

                            </div>

                        </div>
                    `;

                })
                .join("")
            : `
                <div class="empty-box">
                    Itinerary details are not available.
                </div>
            `;


    // ========================================================
    // INCLUSIONS
    // ========================================================

    const inclusionHTML =
        inclusions.length
            ? `
                <ul>
                    ${
                        inclusions
                            .map(
                                item =>
                                    `<li>${escapeHtml(item)}</li>`
                            )
                            .join("")
                    }
                </ul>
            `
            : `<div class="muted">-</div>`;


    // ========================================================
    // EXCLUSIONS
    // ========================================================

    const exclusionHTML =
        exclusions.length
            ? `
                <ul>
                    ${
                        exclusions
                            .map(
                                item =>
                                    `<li>${escapeHtml(item)}</li>`
                            )
                            .join("")
                    }
                </ul>
            `
            : `<div class="muted">-</div>`;


    // ========================================================
    // PAYMENT DETAILS
    // ========================================================

    const paymentAvailable =
        settings.bankName ||
        settings.accountName ||
        settings.accountNumber ||
        settings.ifsc ||
        settings.upiId ||
        qrCode;


    const paymentHTML =
        paymentAvailable
            ? `
                <div class="payment-grid">

                    <div class="payment-info">

                        ${
                            settings.bankName
                                ? `
                                    <div>
                                        <strong>Bank:</strong>
                                        ${escapeHtml(settings.bankName)}
                                    </div>
                                `
                                : ""
                        }

                        ${
                            settings.accountName
                                ? `
                                    <div>
                                        <strong>Account Name:</strong>
                                        ${escapeHtml(settings.accountName)}
                                    </div>
                                `
                                : ""
                        }

                        ${
                            settings.accountNumber
                                ? `
                                    <div>
                                        <strong>Account Number:</strong>
                                        ${escapeHtml(settings.accountNumber)}
                                    </div>
                                `
                                : ""
                        }

                        ${
                            settings.ifsc
                                ? `
                                    <div>
                                        <strong>IFSC:</strong>
                                        ${escapeHtml(settings.ifsc)}
                                    </div>
                                `
                                : ""
                        }

                        ${
                            settings.upiId
                                ? `
                                    <div>
                                        <strong>UPI ID:</strong>
                                        ${escapeHtml(settings.upiId)}
                                    </div>
                                `
                                : ""
                        }

                    </div>


                    ${
                        qrCode
                            ? `
                                <div class="qr-box">

                                    <div class="qr-title">
                                        Scan & Pay
                                    </div>

                                    <img
                                        src="${escapeHtml(qrCode)}"
                                        class="qr-image"
                                        alt="Payment QR"
                                    >

                                </div>
                            `
                            : ""
                    }

                </div>
            `
            : `
                <div class="muted">
                    Payment details will appear here once configured in Settings.
                </div>
            `;


    // ========================================================
    // TERMS
    // ========================================================

    const termsHTML =
        terms
            ? renderRichText(terms)
            : `
                <p>
                    Package is subject to availability.
                    Hotel and transportation are subject to confirmation.
                    Final booking is confirmed only after receipt
                    of the required advance payment.
                </p>
            `;


    // ========================================================
    // FINAL DOCUMENT
    // ========================================================

    return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
    Quotation ${escapeHtml(quotationId)}
</title>


<style>

/* ==========================================================
   PAGE
========================================================== */

@page {
    size: A4;
    margin: 12mm;
}


/* ==========================================================
   GLOBAL
========================================================== */

* {
    box-sizing: border-box;
}


html,
body {
    margin: 0;
    padding: 0;
}


body {

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    color: #1f2937;

    background: #ffffff;

    font-size: 10px;

    line-height: 1.45;
}


.quotation-document {

    width: 100%;

    max-width: 100%;

    background: #ffffff;
}


/* ==========================================================
   HEADER
========================================================== */

.company-header {

    display: flex;

    justify-content: space-between;

    align-items: flex-start;

    gap: 20px;

    padding-bottom: 10px;

    border-bottom:
        3px solid #2563eb;

    page-break-inside: avoid;
}


.company-left {

    display: flex;

    align-items: center;

    gap: 10px;

    min-width: 0;
}


.company-logo {

    width: 62px;

    height: 62px;

    object-fit: contain;

    flex-shrink: 0;
}


.logo-placeholder {

    width: 62px;

    height: 62px;

    border:
        2px solid #2563eb;

    border-radius: 8px;

    display: flex;

    align-items: center;

    justify-content: center;

    text-align: center;

    font-size: 9px;

    font-weight: bold;

    color: #2563eb;

    flex-shrink: 0;
}


.company-name {

    font-size: 20px;

    font-weight: 800;

    color: #111827;

    margin-bottom: 2px;
}


.company-tagline {

    font-size: 9px;

    color: #6b7280;

    margin-bottom: 2px;
}


.company-address {

    font-size: 8px;

    color: #4b5563;
}


.company-contact {

    font-size: 8px;

    color: #4b5563;

    margin-top: 2px;
}


.quotation-title {

    text-align: right;

    min-width: 145px;
}


.quotation-title h1 {

    margin: 0;

    color: #2563eb;

    font-size: 23px;

    letter-spacing: 1px;
}


.quotation-meta {

    font-size: 8px;

    color: #374151;

    margin-top: 3px;
}


/* ==========================================================
   SECTIONS
========================================================== */

.section {

    margin-top: 10px;
}


.section-title {

    padding:
        5px 8px;

    margin-bottom: 5px;

    background: #eff6ff;

    border-left:
        4px solid #2563eb;

    color: #1d4ed8;

    font-size: 10.5px;

    font-weight: 800;

    page-break-after: avoid;
}


.section-subtitle {

    font-size: 8px;

    color: #6b7280;

    margin:
        0 0 5px 0;
}


/* ==========================================================
   CUSTOMER DETAILS
========================================================== */

.details-table {

    width: 100%;

    border-collapse: collapse;

    table-layout: fixed;
}


.details-table td {

    border:
        1px solid #dbe2ea;

    padding:
        5px 6px;

    vertical-align: top;

    word-break: break-word;
}


.details-label {

    width: 14%;

    background: #f8fafc;

    font-weight: 700;

    color: #4b5563;
}


.details-value {

    width: 36%;

    color: #111827;
}


/* ==========================================================
   STANDARD TABLE
========================================================== */

.data-table {

    width: 100%;

    border-collapse: collapse;

    table-layout: fixed;
}


.data-table th {

    background: #2563eb;

    color: white;

    text-align: left;

    padding:
        5px 6px;

    font-size: 8px;

    font-weight: 700;
}


.data-table td {

    border:
        1px solid #dbe2ea;

    padding:
        5px 6px;

    vertical-align: top;

    word-break: break-word;
}


.data-table tr {

    page-break-inside: avoid;
}


.muted {

    color: #6b7280;
}


/* ==========================================================
   HOTEL WIDTHS
========================================================== */

.data-table.hotel-table th:nth-child(1),
.data-table.hotel-table td:nth-child(1) {

    width: 24%;
}


.data-table.hotel-table th:nth-child(2),
.data-table.hotel-table td:nth-child(2) {

    width: 36%;
}


.data-table.hotel-table th:nth-child(3),
.data-table.hotel-table td:nth-child(3) {

    width: 20%;
}


.data-table.hotel-table th:nth-child(4),
.data-table.hotel-table td:nth-child(4) {

    width: 20%;
}


/* ==========================================================
   TRANSPORT WIDTHS
========================================================== */

.transport-table th:nth-child(1),
.transport-table td:nth-child(1) {

    width: 25%;
}


.transport-table th:nth-child(2),
.transport-table td:nth-child(2) {

    width: 20%;
}


.transport-table th:nth-child(3),
.transport-table td:nth-child(3) {

    width: 15%;
}


.transport-table th:nth-child(4),
.transport-table td:nth-child(4) {

    width: 40%;
}


/* ==========================================================
   ITINERARY
========================================================== */

.itinerary-day {

    border:
        1px solid #dbe2ea;

    border-radius: 6px;

    padding:
        7px 9px;

    margin-bottom: 7px;

    page-break-inside: avoid;

    background: #ffffff;
}


.day-heading {

    color: #1d4ed8;

    font-size: 10px;

    font-weight: 800;

    margin-bottom: 4px;
}


.day-heading span {

    color: #111827;
}


.day-description {

    color: #374151;

    font-size: 9px;
}


.day-description p {

    margin:
        2px 0 4px 0;
}


.day-description ul {

    margin:
        3px 0 4px 17px;

    padding: 0;
}


.day-description ol {

    margin:
        3px 0 4px 17px;

    padding: 0;
}


.day-description li {

    margin-bottom: 2px;
}


.day-description strong {

    color: #111827;
}


.day-description span {

    color: inherit;
}


.empty-box {

    border:
        1px dashed #cbd5e1;

    padding: 8px;

    color: #6b7280;
}


/* ==========================================================
   INCLUSIONS / EXCLUSIONS
========================================================== */

.list-columns {

    display: flex;

    gap: 8px;

    width: 100%;
}


.list-column {

    flex: 1;

    border:
        1px solid #dbe2ea;

    border-radius: 6px;

    padding:
        7px 9px;

    page-break-inside: avoid;
}


.list-column h4 {

    margin:
        0 0 4px 0;

    color: #1d4ed8;

    font-size: 9px;
}


.list-column ul {

    margin:
        2px 0 0 16px;

    padding: 0;
}


.list-column li {

    margin-bottom: 2px;

    font-size: 8.5px;
}


/* ==========================================================
   PRICING
========================================================== */

.pricing-table {

    width: 100%;

    border-collapse: collapse;
}


.pricing-table td {

    border:
        1px solid #d1d5db;

    padding:
        6px 8px;
}


.pricing-label {

    width: 70%;

    color: #374151;
}


.pricing-value {

    width: 30%;

    text-align: right;

    font-weight: 600;
}


.grand-total td {

    background: #eff6ff;

    color: #1d4ed8;

    font-size: 11px;

    font-weight: 800;
}


.per-person td {

    background: #f8fafc;

    font-weight: 700;
}


/* ==========================================================
   PAYMENT
========================================================== */

.payment-box {

    border:
        1px solid #dbe2ea;

    border-radius: 6px;

    padding: 8px;

    page-break-inside: avoid;
}


.payment-grid {

    display: flex;

    justify-content: space-between;

    align-items: flex-start;

    gap: 20px;
}


.payment-info {

    line-height: 1.8;

    font-size: 9px;
}


.qr-box {

    text-align: center;

    min-width: 100px;

    font-size: 8px;

    font-weight: 700;

    color: #374151;
}


.qr-title {

    margin-bottom: 3px;
}


.qr-image {

    width: 85px;

    height: 85px;

    object-fit: contain;
}


/* ==========================================================
   TERMS
========================================================== */

.terms-box {

    border:
        1px solid #e5e7eb;

    border-radius: 6px;

    padding:
        7px 9px;

    font-size: 8px;

    color: #4b5563;

    page-break-inside: avoid;
}


.terms-box p {

    margin:
        2px 0 4px 0;
}


.terms-box ul {

    margin:
        2px 0 4px 16px;

    padding: 0;
}


/* ==========================================================
   FOOTER
========================================================== */

.document-footer {

    margin-top: 12px;

    padding-top: 6px;

    border-top:
        1px solid #dbe2ea;

    text-align: center;

    font-size: 7.5px;

    color: #6b7280;

    page-break-inside: avoid;
}


</style>

</head>


<body>

<div class="quotation-document">


    <!-- ======================================================
         HEADER
    ====================================================== -->

    <div class="company-header">

        <div class="company-left">

            ${logoHTML}

            <div>

                <div class="company-name">
                    ${escapeHtml(
                        settings.companyName ||
                        "My Tour Mitra"
                    )}
                </div>


                ${
                    settings.tagline
                        ? `
                            <div class="company-tagline">
                                ${escapeHtml(
                                    settings.tagline
                                )}
                            </div>
                        `
                        : ""
                }


                ${
                    companyAddress
                        ? `
                            <div class="company-address">
                                ${escapeHtml(
                                    companyAddress
                                )}
                            </div>
                        `
                        : ""
                }


                ${
                    contactLine
                        ? `
                            <div class="company-contact">
                                ${escapeHtml(
                                    contactLine
                                )}
                            </div>
                        `
                        : ""
                }


                ${
                    settings.gstNumber
                        ? `
                            <div class="company-contact">
                                GSTIN:
                                ${escapeHtml(
                                    settings.gstNumber
                                )}
                            </div>
                        `
                        : ""
                }

            </div>

        </div>


        <div class="quotation-title">

            <h1>
                QUOTATION
            </h1>


            <div class="quotation-meta">

                <strong>
                    Quotation ID:
                </strong>

                ${escapeHtml(quotationId)}

            </div>


            <div class="quotation-meta">

                <strong>
                    Date:
                </strong>

                ${formatDate(
                    new Date()
                        .toISOString()
                        .slice(0, 10)
                )}

            </div>

        </div>

    </div>



    <!-- ======================================================
         CUSTOMER DETAILS
    ====================================================== -->

    <div class="section">

        <div class="section-title">
            Customer & Tour Details
        </div>


        <table class="details-table">

            <tr>

                <td class="details-label">
                    Customer
                </td>

                <td class="details-value">
                    ${escapeHtml(customer)}
                </td>


                <td class="details-label">
                    Enquiry
                </td>

                <td class="details-value">
                    ${escapeHtml(enquiry)}
                </td>

            </tr>


            <tr>

                <td class="details-label">
                    Package
                </td>

                <td class="details-value">

                    <strong>
                        ${escapeHtml(packageName)}
                    </strong>

                </td>


                <td class="details-label">
                    Destination
                </td>

                <td class="details-value">
                    ${escapeHtml(destination)}
                </td>

            </tr>


            <tr>

                <td class="details-label">
                    Travel Date
                </td>

                <td class="details-value">

                    ${formatDate(startDate)}

                    ${
                        endDate
                            ? `
                                &nbsp;–&nbsp;
                                ${formatDate(endDate)}
                            `
                            : ""
                    }

                </td>


                <td class="details-label">
                    Pax
                </td>

                <td class="details-value">

                    ${pax}

                    ${
                        adults
                            ? ` (${adults} Adult${adults > 1 ? "s" : ""}`
                            : ""
                    }

                    ${
                        children
                            ? `, ${children} Child${children > 1 ? "ren" : ""})`
                            : adults
                                ? ")"
                                : ""
                    }

                </td>

            </tr>


            <tr>

                <td class="details-label">
                    Rooms
                </td>

                <td class="details-value">
                    ${rooms || "-"}
                </td>


                <td class="details-label">
                    Valid Until
                </td>

                <td class="details-value">

                    ${formatDate(
                        getValue(
                            quotation,
                            [
                                "validUntil",
                                "validityDate"
                            ],
                            ""
                        )
                    )}

                </td>

            </tr>

        </table>

    </div>



    <!-- ======================================================
         TRANSPORTATION
    ====================================================== -->

    <div class="section">

        <div class="section-title">
            Transportation
        </div>


        <table class="data-table transport-table">

            <thead>

                <tr>

                    <th>
                        Vehicle
                    </th>

                    <th>
                        Type
                    </th>

                    <th>
                        Capacity
                    </th>

                    <th>
                        Details
                    </th>

                </tr>

            </thead>


            <tbody>

                ${transportHTML}

            </tbody>

        </table>

    </div>



    <!-- ======================================================
         HOTELS
    ====================================================== -->

    <div class="section">

        <div class="section-title">
            Hotel Details
        </div>


        <table class="data-table hotel-table">

            <thead>

                <tr>

                    <th>
                        Destination
                    </th>

                    <th>
                        Hotel
                    </th>

                    <th>
                        Room
                    </th>

                    <th>
                        Meal Plan
                    </th>

                </tr>

            </thead>


            <tbody>

                ${hotelHTML}

            </tbody>

        </table>

    </div>



    <!-- ======================================================
         ITINERARY
    ====================================================== -->

    <div class="section">

        <div class="section-title">
            Tour Itinerary
        </div>


        <div class="section-subtitle">
            Day-wise tour plan
        </div>


        ${itineraryHTML}

    </div>



    <!-- ======================================================
         INCLUSIONS / EXCLUSIONS
    ====================================================== -->

    ${
        inclusions.length ||
        exclusions.length
            ? `

                <div class="section">

                    <div class="section-title">
                        Package Inclusions & Exclusions
                    </div>


                    <div class="list-columns">

                        <div class="list-column">

                            <h4>
                                Inclusions
                            </h4>

                            ${inclusionHTML}

                        </div>


                        <div class="list-column">

                            <h4>
                                Exclusions
                            </h4>

                            ${exclusionHTML}

                        </div>

                    </div>

                </div>

            `
            : ""
    }



    <!-- ======================================================
         PRICING
    ====================================================== -->

    <div class="section">

        <div class="section-title">
            Quotation Summary
        </div>


        <table class="pricing-table">

            <tr>

                <td class="pricing-label">
                    Package Cost
                </td>

                <td class="pricing-value">
                    ${formatCurrency(packageCost)}
                </td>

            </tr>


            <tr>

                <td class="pricing-label">
                    Discount
                </td>

                <td class="pricing-value">
                    ${formatCurrency(discount)}
                </td>

            </tr>


            <tr>

                <td class="pricing-label">
                    GST
                </td>

                <td class="pricing-value">
                    ${formatCurrency(gst)}
                </td>

            </tr>


            <tr class="grand-total">

                <td>
                    GRAND TOTAL
                </td>

                <td class="pricing-value">
                    ${formatCurrency(grandTotal)}
                </td>

            </tr>


            <tr class="per-person">

                <td>
                    Total Package Cost / Per Person
                </td>

                <td class="pricing-value">
                    ${formatCurrency(perPerson)}
                </td>

            </tr>

        </table>

    </div>



    <!-- ======================================================
         PAYMENT
    ====================================================== -->

    <div class="section">

        <div class="section-title">
            Payment Details
        </div>


        <div class="payment-box">

            ${paymentHTML}

        </div>

    </div>



    <!-- ======================================================
         TERMS
    ====================================================== -->

    <div class="section">

        <div class="section-title">
            Terms & Conditions
        </div>


        <div class="terms-box">

            ${termsHTML}

        </div>

    </div>



    <!-- ======================================================
         FOOTER
    ====================================================== -->

    <div class="document-footer">

        ${
            settings.quotationFooter
                ? renderRichText(
                    settings.quotationFooter
                )
                : `
                    Thank you for choosing
                    ${escapeHtml(
                        settings.companyName ||
                        "My Tour Mitra"
                    )}.
                `
        }


        ${
            settings.panNumber
                ? `
                    <div>
                        PAN:
                        ${escapeHtml(
                            settings.panNumber
                        )}
                    </div>
                `
                : ""
        }

    </div>


</div>

</body>

</html>
`;
}


// ============================================================
// CREATE PDF CONTAINER
// ============================================================

function createPdfContainer(html) {

    const wrapper =
        document.createElement("div");


    wrapper.innerHTML = html;


    wrapper.style.position = "fixed";

    wrapper.style.left = "-100000px";

    wrapper.style.top = "0";

    wrapper.style.width = "794px";

    wrapper.style.background = "#ffffff";

    wrapper.style.zIndex = "-1";


    document.body.appendChild(wrapper);


    return wrapper;
}


// ============================================================
// FILENAME
// ============================================================

function getPdfFilename(quotation) {

    const quotationId =
        getValue(
            quotation,
            [
                "quotationId",
                "id"
            ],
            "Quotation"
        );


    const customer =
        getValue(
            quotation,
            [
                "customerName",
                "customer"
            ],
            "Customer"
        );


    const safeCustomer =
        String(customer)
            .replace(
                /[^a-z0-9]+/gi,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            );


    return (
        `My-Tour-Mitra-Quotation-${quotationId}-${safeCustomer}.pdf`
    );
}


// ============================================================
// PDF OPTIONS
// ============================================================

function getPdfOptions(filename) {

    return {

        margin: [
            8,
            8,
            10,
            8
        ],

        filename: filename,

        image: {

            type: "jpeg",

            quality: 0.98
        },

        html2canvas: {

            scale: 2,

            useCORS: true,

            allowTaint: true,

            backgroundColor: "#ffffff",

            logging: false
        },

        jsPDF: {

            unit: "mm",

            format: "a4",

            orientation: "portrait",

            compress: true
        },

        pagebreak: {

            mode: [
                "css",
                "legacy"
            ],

            avoid: [
                ".itinerary-day",
                ".data-table tr",
                ".payment-box",
                ".list-column",
                ".terms-box"
            ]
        }
    };
}


// ============================================================
// GENERATE / DOWNLOAD PDF
// ============================================================

async function generateQuotationPDF(quotation) {

    if (!quotation) {

        alert(
            "Quotation data not found."
        );

        return;
    }


    let container = null;


    try {

        const html2pdf =
            await loadHtml2Pdf();


        const html =
            buildQuotationHTML(
                quotation
            );


        container =
            createPdfContainer(
                html
            );


        const element =
            container.querySelector(
                ".quotation-document"
            );


        if (!element) {

            throw new Error(
                "Quotation document element not found."
            );
        }


        const filename =
            getPdfFilename(
                quotation
            );


        const options =
            getPdfOptions(
                filename
            );


        await html2pdf()
            .set(options)
            .from(element)
            .save();


    } catch (error) {

        console.error(
            "Quotation PDF Error:",
            error
        );


        alert(
            "Could not generate quotation PDF. Please check browser console."
        );


    } finally {

        if (container) {
            container.remove();
        }
    }
}


// ============================================================
// SHARE PDF
// ============================================================

async function shareQuotationPDF(quotation) {

    if (!quotation) {

        alert(
            "Quotation data not found."
        );

        return;
    }


    let container = null;


    try {

        const html2pdf =
            await loadHtml2Pdf();


        const html =
            buildQuotationHTML(
                quotation
            );


        container =
            createPdfContainer(
                html
            );


        const element =
            container.querySelector(
                ".quotation-document"
            );


        const filename =
            getPdfFilename(
                quotation
            );


        const options =
            getPdfOptions(
                filename
            );


        const worker =
            html2pdf()
                .set(options)
                .from(element);


        const pdfBlob =
            await worker.output(
                "blob"
            );


        // ====================================================
        // WEB SHARE
        // ====================================================

        if (
            navigator.share &&
            navigator.canShare
        ) {

            const file =
                new File(
                    [
                        pdfBlob
                    ],
                    filename,
                    {
                        type:
                            "application/pdf"
                    }
                );


            if (
                navigator.canShare({
                    files: [file]
                })
            ) {

                await navigator.share({

                    title:
                        `Quotation ${getValue(
                            quotation,
                            [
                                "quotationId",
                                "id"
                            ],
                            ""
                        )}`,

                    text:
                        "Quotation from My Tour Mitra",

                    files: [file]
                });


                return;
            }
        }


        // ====================================================
        // DESKTOP DOWNLOAD FALLBACK
        // ====================================================

        const url =
            URL.createObjectURL(
                pdfBlob
            );


        const anchor =
            document.createElement("a");


        anchor.href = url;

        anchor.download = filename;


        document.body.appendChild(anchor);


        anchor.click();


        anchor.remove();


        setTimeout(
            () => {
                URL.revokeObjectURL(url);
            },
            3000
        );


        // ====================================================
        // WHATSAPP
        // ====================================================

        const settings =
            getCompanySettings();


        const phone =
            settings.whatsapp ||
            settings.phone;


        const customer =
            getValue(
                quotation,
                [
                    "customerName",
                    "customer"
                ],
                "Customer"
            );


        const quotationId =
            getValue(
                quotation,
                [
                    "quotationId",
                    "id"
                ],
                ""
            );


        if (phone) {

            const cleanPhone =
                String(phone)
                    .replace(/\D/g, "");


            const message =
                encodeURIComponent(
                    `Hello ${customer},

Please find your quotation ${quotationId} from My Tour Mitra.

Thank you.`
                );


            const whatsappUrl =
                `https://wa.me/${cleanPhone}?text=${message}`;


            window.open(
                whatsappUrl,
                "_blank"
            );
        }


    } catch (error) {

        console.error(
            "Quotation Share Error:",
            error
        );


        alert(
            "Could not prepare quotation for sharing."
        );


    } finally {

        if (container) {
            container.remove();
        }
    }
}


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================
//
// quotations.js can call:
//
// generateQuotationPDF(quotation)
// shareQuotationPDF(quotation)
//
// ============================================================

window.generateQuotationPDF =
    generateQuotationPDF;


window.shareQuotationPDF =
    shareQuotationPDF;


// ============================================================
// EXPORT
// ============================================================

export {

    generateQuotationPDF,

    shareQuotationPDF,

    getCompanySettings,

    buildQuotationHTML

};
