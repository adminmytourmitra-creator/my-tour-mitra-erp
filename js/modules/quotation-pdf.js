// ============================================================
// MY TOUR MITRA ERP
// QUOTATION PDF GENERATOR
// File: quotation-pdf.js
// ============================================================
//
// This file is responsible ONLY for:
// 1. Building quotation PDF HTML
// 2. Generating PDF
// 3. Sharing PDF
//
// Company settings are intentionally stored in localStorage.
// Firebase Storage is NOT required for logo / QR.
//
// Future Settings page should save:
// localStorage.setItem(
//   "myTourMitraSettings",
//   JSON.stringify(settings)
// );
//
// ============================================================


// ============================================================
// SETTINGS KEY
// ============================================================

const SETTINGS_KEY = "myTourMitraSettings";


// ============================================================
// DEFAULT SETTINGS
// ============================================================

const DEFAULT_SETTINGS = {

  companyName: "My Tour Mitra",

  tagline: "Travel & Tours",

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
// GET SETTINGS
// ============================================================

function getCompanySettings() {

  try {

    const saved =
      localStorage.getItem(
        SETTINGS_KEY
      );

    if (!saved) {

      return {
        ...DEFAULT_SETTINGS
      };

    }

    const parsed =
      JSON.parse(saved);

    return {

      ...DEFAULT_SETTINGS,

      ...parsed

    };

  } catch (error) {

    console.error(
      "My Tour Mitra settings error:",
      error
    );

    return {
      ...DEFAULT_SETTINGS
    };

  }

}


// ============================================================
// SAFE VALUE
// ============================================================

function firstValue(
  object,
  keys,
  fallback = ""
) {

  if (!object) {
    return fallback;
  }

  for (const key of keys) {

    if (
      object[key] !== undefined &&
      object[key] !== null &&
      object[key] !== ""
    ) {

      return object[key];

    }

  }

  return fallback;

}


// ============================================================
// ESCAPE HTML
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
// RENDER RICH TEXT
// ============================================================
//
// Package Master itinerary may contain:
// <p>
// <ul>
// <li>
// <strong>
// <b>
// <em>
// <br>
// etc.
//
// We allow formatting but remove dangerous elements.
// ============================================================

function renderRichText(value) {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {

    return "";

  }

  const wrapper =
    document.createElement("div");

  wrapper.innerHTML =
    String(value);

  wrapper
    .querySelectorAll(
      "script, style, iframe, object, embed, form"
    )
    .forEach(
      element => element.remove()
    );

  wrapper
    .querySelectorAll("*")
    .forEach(
      element => {

        [
          "onclick",
          "onload",
          "onerror",
          "onmouseover",
          "onfocus",
          "onmouseenter"
        ].forEach(
          attribute => {

            element.removeAttribute(
              attribute
            );

          }
        );

      }
    );

  return wrapper.innerHTML;

}


// ============================================================
// CURRENCY
// ============================================================

function formatCurrency(value) {

  const number =
    Number(value || 0);

  return (
    "₹" +
    number.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )
  );

}


// ============================================================
// DATE
// ============================================================

function formatDate(value) {

  if (!value) {

    return "-";

  }

  const stringValue =
    String(value);

  let date;

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      stringValue
    )
  ) {

    date =
      new Date(
        stringValue + "T00:00:00"
      );

  } else {

    date =
      new Date(stringValue);

  }

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return escapeHtml(
      stringValue
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


// ============================================================
// LOAD HTML2PDF
// ============================================================

function loadHtml2Pdf() {

  return new Promise(
    (resolve, reject) => {

      if (
        typeof window.html2pdf ===
        "function"
      ) {

        resolve(
          window.html2pdf
        );

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

              resolve(
                window.html2pdf
              );

            } else {

              reject(
                new Error(
                  "html2pdf.js loaded but unavailable."
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
                "Could not load html2pdf.js."
              )
            );

          }
        );

        return;

      }


      const script =
        document.createElement(
          "script"
        );


      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.12.1/html2pdf.bundle.min.js";


      script.async =
        true;


      script.dataset.mytourmitraHtml2pdf =
        "true";


      script.onload =
        () => {

          if (
            typeof window.html2pdf ===
            "function"
          ) {

            resolve(
              window.html2pdf
            );

          } else {

            reject(
              new Error(
                "html2pdf.js unavailable."
              )
            );

          }

        };


      script.onerror =
        () => {

          reject(
            new Error(
              "Unable to load html2pdf.js."
            )
          );

        };


      document.head.appendChild(
        script
      );

    }
  );

}


// ============================================================
// GET ITINERARY
// ============================================================

function getItinerary(quotation) {

  const value =
    firstValue(
      quotation,
      [
        "itinerary",
        "packageItinerary",
        "itineraryDays",
        "dayWiseItinerary",
        "days"
      ],
      []
    );


  if (
    Array.isArray(value)
  ) {

    return value;

  }


  if (
    typeof value ===
    "string" &&
    value.trim()
  ) {

    return [
      {
        day: 1,
        title: "Tour Itinerary",
        description: value
      }
    ];

  }


  return [];

}


// ============================================================
// GET HOTELS
// ============================================================

function getHotels(quotation) {

  const value =
    firstValue(
      quotation,
      [
        "hotels",
        "hotelDetails",
        "selectedHotels",
        "hotelData"
      ],
      []
    );


  if (
    Array.isArray(value)
  ) {

    return value;

  }


  if (
    typeof value ===
    "string" &&
    value.trim()
  ) {

    return [
      {
        hotelName: value
      }
    ];

  }


  return [];

}


// ============================================================
// GET CABS
// ============================================================

function getCabs(quotation) {

  const value =
    firstValue(
      quotation,
      [
        "cabs",
        "cab",
        "cabDetails",
        "selectedCabs",
        "selectedCab",
        "transport",
        "transportation",
        "vehicle"
      ],
      []
    );


  if (
    Array.isArray(value)
  ) {

    return value;

  }


  if (
    typeof value ===
    "string" &&
    value.trim()
  ) {

    return [
      {
        vehicle: value
      }
    ];

  }


  if (
    value &&
    typeof value ===
    "object"
  ) {

    return [value];

  }


  return [];

}


// ============================================================
// GET LIST
// ============================================================

function getList(
  quotation,
  keys
) {

  const value =
    firstValue(
      quotation,
      keys,
      []
    );


  if (
    Array.isArray(value)
  ) {

    return value
      .filter(
        item =>
          item !== null &&
          item !== undefined &&
          String(item).trim()
      )
      .map(
        item =>
          typeof item === "object"
            ? firstValue(
                item,
                [
                  "name",
                  "title",
                  "text",
                  "description"
                ],
                ""
              )
            : String(item)
      );

  }


  if (
    typeof value ===
    "string"
  ) {

    return value
      .split(/\r?\n/)
      .map(
        item =>
          item.trim()
      )
      .filter(Boolean);

  }


  return [];

}


// ============================================================
// COMPANY ADDRESS
// ============================================================

function getCompanyAddress(
  settings
) {

  const parts = [

    settings.address,

    settings.city,

    settings.state,

    settings.pincode,

    settings.country

  ];


  return parts
    .filter(
      item =>
        item !== undefined &&
        item !== null &&
        String(item).trim() !== ""
    )
    .join(", ");

}


// ============================================================
// COMPANY CONTACT
// ============================================================

function getCompanyContact(
  settings
) {

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


  return parts.join(
    "  |  "
  );

}


// ============================================================
// BUILD HOTEL HTML
// ============================================================
//
// IMPORTANT:
// Hotel RATE is deliberately NOT displayed.
//
// Hotel master is used only to show selected hotel data.
// ============================================================

function buildHotelHTML(
  hotels
) {

  if (!hotels.length) {

    return `
      <div class="empty-box">
        No hotel details added.
      </div>
    `;

  }


  return hotels
    .map(
      (hotel, index) => {

        if (
          typeof hotel ===
          "string"
        ) {

          return `
            <div class="hotel-card">

              <div class="hotel-number">
                ${index + 1}
              </div>

              <div class="hotel-main">

                <div class="hotel-name">
                  ${escapeHtml(hotel)}
                </div>

              </div>

            </div>
          `;

        }


        const city =
          firstValue(
            hotel,
            [
              "city",
              "destination",
              "location"
            ],
            ""
          );


        const hotelName =
          firstValue(
            hotel,
            [
              "hotelName",
              "hotel",
              "name",
              "propertyName"
            ],
            "Hotel / Similar"
          );


        const roomType =
          firstValue(
            hotel,
            [
              "roomType",
              "room",
              "category"
            ],
            ""
          );


        const mealPlan =
          firstValue(
            hotel,
            [
              "mealPlan",
              "meal",
              "meals"
            ],
            ""
          );


        return `
          <div class="hotel-card">

            <div class="hotel-number">
              ${index + 1}
            </div>

            <div class="hotel-main">

              <div class="hotel-name">
                ${escapeHtml(hotelName)}
              </div>

              <div class="hotel-meta">

                ${
                  city
                    ? `
                      <span>
                        ${escapeHtml(city)}
                      </span>
                    `
                    : ""
                }

                ${
                  roomType
                    ? `
                      <span>
                        ${escapeHtml(roomType)}
                      </span>
                    `
                    : ""
                }

                ${
                  mealPlan
                    ? `
                      <span>
                        ${escapeHtml(mealPlan)}
                      </span>
                    `
                    : ""
                }

              </div>

            </div>

          </div>
        `;

      }
    )
    .join("");

}


// ============================================================
// BUILD CAB HTML
// ============================================================

function buildCabHTML(
  cabs
) {

  if (!cabs.length) {

    return `
      <div class="empty-box">
        No transportation details added.
      </div>
    `;

  }


  return cabs
    .map(
      (cab, index) => {

        if (
          typeof cab ===
          "string"
        ) {

          return `
            <div class="cab-card">

              <div class="cab-number">
                ${index + 1}
              </div>

              <div>

                <div class="cab-name">
                  ${escapeHtml(cab)}
                </div>

              </div>

            </div>
          `;

        }


        const vehicle =
          firstValue(
            cab,
            [
              "vehicle",
              "vehicleName",
              "cab",
              "cabName",
              "name",
              "vehicleType"
            ],
            "Vehicle"
          );


        const category =
          firstValue(
            cab,
            [
              "category",
              "type",
              "vehicleType"
            ],
            ""
          );


        const capacity =
          firstValue(
            cab,
            [
              "capacity",
              "seating",
              "pax"
            ],
            ""
          );


        const details =
          firstValue(
            cab,
            [
              "details",
              "description"
            ],
            ""
          );


        return `
          <div class="cab-card">

            <div class="cab-number">
              ${index + 1}
            </div>

            <div class="cab-main">

              <div class="cab-name">
                ${escapeHtml(vehicle)}
              </div>

              <div class="cab-meta">

                ${
                  category
                    ? `
                      <span>
                        ${escapeHtml(category)}
                      </span>
                    `
                    : ""
                }

                ${
                  capacity
                    ? `
                      <span>
                        ${escapeHtml(capacity)}
                      </span>
                    `
                    : ""
                }

              </div>

              ${
                details
                  ? `
                    <div class="cab-details">
                      ${escapeHtml(details)}
                    </div>
                  `
                  : ""
              }

            </div>

          </div>
        `;

      }
    )
    .join("");

}


// ============================================================
// BUILD ITINERARY HTML
// ============================================================

function buildItineraryHTML(
  itinerary
) {

  if (!itinerary.length) {

    return `
      <div class="empty-box">
        Itinerary details are not available.
      </div>
    `;

  }


  return itinerary
    .map(
      (day, index) => {

        if (
          typeof day ===
          "string"
        ) {

          return `
            <div class="itinerary-day">

              <div class="day-header">

                <span class="day-number">
                  DAY ${index + 1}
                </span>

              </div>

              <div class="day-content">

                ${renderRichText(day)}

              </div>

            </div>
          `;

        }


        const dayNumber =
          firstValue(
            day,
            [
              "day",
              "dayNumber",
              "number"
            ],
            index + 1
          );


        const title =
          firstValue(
            day,
            [
              "title",
              "heading",
              "dayTitle",
              "name"
            ],
            ""
          );


        const description =
          firstValue(
            day,
            [
              "description",
              "details",
              "content",
              "itinerary"
            ],
            ""
          );


        return `
          <div class="itinerary-day">

            <div class="day-header">

              <span class="day-number">
                DAY ${escapeHtml(dayNumber)}
              </span>

              ${
                title
                  ? `
                    <span class="day-title">
                      ${escapeHtml(title)}
                    </span>
                  `
                  : ""
              }

            </div>

            <div class="day-content">

              ${
                description
                  ? renderRichText(
                      description
                    )
                  : `
                    <span class="muted">
                      No itinerary description.
                    </span>
                  `
              }

            </div>

          </div>
        `;

      }
    )
    .join("");

}


// ============================================================
// BUILD LIST HTML
// ============================================================

function buildListHTML(
  items
) {

  if (!items.length) {

    return `
      <div class="muted">
        -
      </div>
    `;

  }


  return `
    <ul class="quotation-list">

      ${items
        .map(
          item =>
            `
              <li>
                ${escapeHtml(item)}
              </li>
            `
        )
        .join("")}

    </ul>
  `;

}


// ============================================================
// BUILD PAYMENT HTML
// ============================================================

function buildPaymentHTML(
  settings
) {

  const hasBankDetails =
    settings.bankName ||
    settings.accountName ||
    settings.accountNumber ||
    settings.ifsc ||
    settings.upiId;


  const qrCode =
    firstValue(
      settings,
      [
        "qrCodeDataUrl",
        "upiQrCode",
        "qrCode",
        "paymentQr"
      ],
      ""
    );


  if (
    !hasBankDetails &&
    !qrCode
  ) {

    return `
      <div class="payment-empty">

        Payment details will appear here
        after they are configured in
        Settings.

      </div>
    `;

  }


  return `

    <div class="payment-layout">

      <div class="bank-details">

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
            <div class="qr-section">

              <div class="qr-title">
                SCAN TO PAY
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

  `;

}


// ============================================================
// BUILD QUOTATION HTML
// ============================================================

function buildQuotationHTML(
  quotation
) {

  const settings =
    getCompanySettings();


  // ----------------------------------------------------------
  // BASIC DETAILS
  // ----------------------------------------------------------

  const quotationId =
    firstValue(
      quotation,
      [
        "quotationId",
        "id"
      ],
      "-"
    );


  const customer =
    firstValue(
      quotation,
      [
        "customerName",
        "customer",
        "name"
      ],
      "-"
    );


  const customerPhone =
    firstValue(
      quotation,
      [
        "customerPhone",
        "phone",
        "mobile",
        "contactNumber"
      ],
      ""
    );


  const customerEmail =
    firstValue(
      quotation,
      [
        "customerEmail",
        "email"
      ],
      ""
    );


  const enquiryReference =
    firstValue(
      quotation,
      [
        "enquiryReference",
        "enquiryId",
        "enquiry"
      ],
      "-"
    );


  const packageName =
    firstValue(
      quotation,
      [
        "packageName",
        "package",
        "tourName"
      ],
      "-"
    );


  const destination =
    firstValue(
      quotation,
      [
        "destination",
        "destinations"
      ],
      "-"
    );


  const startDate =
    firstValue(
      quotation,
      [
        "travelStartDate",
        "startDate"
      ],
      ""
    );


  const endDate =
    firstValue(
      quotation,
      [
        "travelEndDate",
        "endDate"
      ],
      ""
    );


  const adults =
    Number(
      firstValue(
        quotation,
        ["adults"],
        0
      )
    );


  const children =
    Number(
      firstValue(
        quotation,
        ["children"],
        0
      )
    );


  const rooms =
    Number(
      firstValue(
        quotation,
        ["rooms"],
        0
      )
    );


  const pax =
    adults + children;


  // ----------------------------------------------------------
  // PRICING
  // ----------------------------------------------------------

  const packageCost =
    Number(
      firstValue(
        quotation,
        [
          "packageCost",
          "totalPackageCost",
          "baseCost"
        ],
        0
      )
    );


  const discount =
    Number(
      firstValue(
        quotation,
        ["discount"],
        0
      )
    );


  const gst =
    Number(
      firstValue(
        quotation,
        [
          "gst",
          "gstAmount"
        ],
        0
      )
    );


  const calculatedGrandTotal =
    packageCost -
    discount +
    gst;


  const grandTotal =
    Number(
      firstValue(
        quotation,
        [
          "grandTotal",
          "totalAmount",
          "total"
        ],
        calculatedGrandTotal
      )
    );


  const calculatedPerPerson =
    pax > 0
      ? grandTotal / pax
      : 0;


  const perPerson =
    Number(
      firstValue(
        quotation,
        [
          "perPerson",
          "perPersonAmount"
        ],
        calculatedPerPerson
      )
    );


  // ----------------------------------------------------------
  // OTHER DATA
  // ----------------------------------------------------------

  const validUntil =
    firstValue(
      quotation,
      [
        "validUntil"
      ],
      ""
    );


  const status =
    firstValue(
      quotation,
      [
        "status"
      ],
      "Draft"
    );


  const notes =
    firstValue(
      quotation,
      [
        "internalNotes",
        "notes",
        "remarks"
      ],
      ""
    );


  const terms =
    firstValue(
      quotation,
      [
        "terms",
        "termsAndConditions"
      ],
      settings.quotationTerms
    );


  // ----------------------------------------------------------
  // DATA COLLECTION
  // ----------------------------------------------------------

  const itinerary =
    getItinerary(
      quotation
    );


  const hotels =
    getHotels(
      quotation
    );


  const cabs =
    getCabs(
      quotation
    );


  const inclusions =
    getList(
      quotation,
      [
        "inclusions",
        "included"
      ]
    );


  const exclusions =
    getList(
      quotation,
      [
        "exclusions",
        "excluded"
      ]
    );


  // ----------------------------------------------------------
  // COMPANY DATA
  // ----------------------------------------------------------

  const logo =
    firstValue(
      settings,
      [
        "logoDataUrl",
        "companyLogo",
        "logo"
      ],
      ""
    );


  const companyAddress =
    getCompanyAddress(
      settings
    );


  const companyContact =
    getCompanyContact(
      settings
    );


  // ----------------------------------------------------------
  // LOGO
  // ----------------------------------------------------------

  const logoHTML =
    logo
      ? `
        <img
          src="${escapeHtml(logo)}"
          class="company-logo"
          alt="My Tour Mitra"
        >
      `
      : `
        <div class="logo-placeholder">
          MTM
        </div>
      `;


  // ----------------------------------------------------------
  // CUSTOMER CONTACT
  // ----------------------------------------------------------

  const customerContactHTML =
    customerPhone ||
    customerEmail
      ? `
        <div class="customer-contact">

          ${
            customerPhone
              ? `
                <span>
                  ${escapeHtml(customerPhone)}
                </span>
              `
              : ""
          }

          ${
            customerEmail
              ? `
                <span>
                  ${escapeHtml(customerEmail)}
                </span>
              `
              : ""
          }

        </div>
      `
      : "";


  // ----------------------------------------------------------
  // CUSTOMER PAX TEXT
  // ----------------------------------------------------------

  let paxText =
    String(pax || 0);


  const paxParts = [];


  if (adults > 0) {

    paxParts.push(
      `${adults} Adult${adults > 1 ? "s" : ""}`
    );

  }


  if (children > 0) {

    paxParts.push(
      `${children} Child${children > 1 ? "ren" : ""}`
    );

  }


  if (paxParts.length) {

    paxText +=
      ` (${paxParts.join(", ")})`;

  }


  // ----------------------------------------------------------
  // RETURN COMPLETE HTML
  // ----------------------------------------------------------

  return `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
  My Tour Mitra Quotation
  ${escapeHtml(quotationId)}
</title>


<style>

/* ==========================================================
   PAGE
========================================================== */

@page {

  size: A4;

  margin: 0;

}


* {

  box-sizing:
    border-box;

}


html,
body {

  margin:
    0;

  padding:
    0;

  background:
    #ffffff;

  color:
    #1f2937;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  font-size:
    10px;

  line-height:
    1.45;

}


/* ==========================================================
   MAIN DOCUMENT
========================================================== */

.quotation-document {

  width:
    210mm;

  min-height:
    297mm;

  padding:
    13mm 13mm 15mm 13mm;

  background:
    #ffffff;

}


/* ==========================================================
   HEADER
========================================================== */

.company-header {

  display:
    flex;

  justify-content:
    space-between;

  align-items:
    flex-start;

  gap:
    15px;

  padding-bottom:
    10px;

  border-bottom:
    3px solid #2563eb;

}


.company-left {

  display:
    flex;

  align-items:
    center;

  gap:
    11px;

  min-width:
    0;

}


.company-logo,
.logo-placeholder {

  width:
    65px;

  height:
    65px;

  flex:
    0 0 65px;

}


.company-logo {

  object-fit:
    contain;

}


.logo-placeholder {

  border:
    2px solid #2563eb;

  border-radius:
    8px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  color:
    #2563eb;

  font-size:
    16px;

  font-weight:
    800;

}


.company-name {

  margin:
    0;

  color:
    #111827;

  font-size:
    21px;

  line-height:
    1.1;

  font-weight:
    800;

}


.company-tagline {

  margin-top:
    3px;

  color:
    #6b7280;

  font-size:
    9px;

}


.company-address {

  margin-top:
    4px;

  max-width:
    390px;

  color:
    #4b5563;

  font-size:
    8px;

}


.company-contact {

  margin-top:
    3px;

  max-width:
    400px;

  color:
    #4b5563;

  font-size:
    8px;

}


.quotation-title {

  min-width:
    145px;

  text-align:
    right;

}


.quotation-title h1 {

  margin:
    0;

  color:
    #2563eb;

  font-size:
    24px;

  line-height:
    1;

  letter-spacing:
    1px;

}


.quotation-id {

  margin-top:
    6px;

  color:
    #111827;

  font-size:
    9px;

  font-weight:
    700;

}


.quotation-date {

  margin-top:
    3px;

  color:
    #6b7280;

  font-size:
    8px;

}


/* ==========================================================
   SECTION
========================================================== */

.section {

  margin-top:
    12px;

}


.section-title {

  margin-bottom:
    6px;

  padding:
    6px 8px;

  border-left:
    4px solid #2563eb;

  background:
    #eff6ff;

  color:
    #1d4ed8;

  font-size:
    11px;

  font-weight:
    800;

}


.section-subtitle {

  margin:
    -2px 0 6px 0;

  color:
    #6b7280;

  font-size:
    8px;

}


/* ==========================================================
   DETAILS TABLE
========================================================== */

.details-table {

  width:
    100%;

  border-collapse:
    collapse;

}


.details-table td {

  padding:
    5px 7px;

  border:
    1px solid #dbe2ea;

  vertical-align:
    top;

}


.details-label {

  width:
    17%;

  background:
    #f8fafc;

  color:
    #4b5563;

  font-weight:
    700;

}


.details-value {

  width:
    33%;

  color:
    #111827;

}


.customer-contact {

  display:
    flex;

  flex-wrap:
    wrap;

  gap:
    8px;

  margin-top:
    2px;

  color:
    #6b7280;

  font-size:
    8px;

}


/* ==========================================================
   HOTEL
========================================================== */

.hotel-card {

  display:
    flex;

  gap:
    8px;

  padding:
    8px;

  margin-bottom:
    6px;

  border:
    1px solid #dbe2ea;

  border-radius:
    6px;

  page-break-inside:
    avoid;

}


.hotel-number {

  width:
    24px;

  height:
    24px;

  flex:
    0 0 24px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  border-radius:
    50%;

  background:
    #eff6ff;

  color:
    #1d4ed8;

  font-weight:
    800;

}


.hotel-name {

  color:
    #111827;

  font-size:
    10px;

  font-weight:
    800;

}


.hotel-meta {

  display:
    flex;

  flex-wrap:
    wrap;

  gap:
    8px;

  margin-top:
    3px;

  color:
    #6b7280;

  font-size:
    8px;

}


.hotel-meta span:not(:last-child)::after {

  content:
    " • ";

}


.hotel-main {

  min-width:
    0;

}


/* ==========================================================
   CAB
========================================================== */

.cab-card {

  display:
    flex;

  gap:
    8px;

  padding:
    8px;

  margin-bottom:
    6px;

  border:
    1px solid #dbe2ea;

  border-radius:
    6px;

  page-break-inside:
    avoid;

}


.cab-number {

  width:
    24px;

  height:
    24px;

  flex:
    0 0 24px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  border-radius:
    50%;

  background:
    #eff6ff;

  color:
    #1d4ed8;

  font-weight:
    800;

}


.cab-name {

  color:
    #111827;

  font-size:
    10px;

  font-weight:
    800;

}


.cab-meta {

  display:
    flex;

  gap:
    10px;

  margin-top:
    3px;

  color:
    #6b7280;

  font-size:
    8px;

}


.cab-details {

  margin-top:
    3px;

  color:
    #4b5563;

  font-size:
    8px;

}


.cab-main {

  min-width:
    0;

}


/* ==========================================================
   ITINERARY
========================================================== */

.itinerary-day {

  margin-bottom:
    7px;

  border:
    1px solid #dbe2ea;

  border-radius:
    6px;

  overflow:
    hidden;

  page-break-inside:
    avoid;

}


.day-header {

  display:
    flex;

  align-items:
    center;

  gap:
    7px;

  padding:
    6px 8px;

  background:
    #f8fafc;

  border-bottom:
    1px solid #e2e8f0;

}


.day-number {

  color:
    #1d4ed8;

  font-size:
    9px;

  font-weight:
    800;

}


.day-title {

  color:
    #111827;

  font-size:
    10px;

  font-weight:
    800;

}


.day-content {

  padding:
    7px 9px;

  color:
    #374151;

  font-size:
    9px;

}


.day-content p {

  margin:
    2px 0 5px 0;

}


.day-content ul,
.day-content ol {

  margin:
    3px 0 5px 17px;

  padding:
    0;

}


.day-content li {

  margin-bottom:
    2px;

}


.day-content strong,
.day-content b {

  color:
    #111827;

}


.day-content img {

  max-width:
    100%;

  height:
    auto;

}


/* ==========================================================
   PRICING
========================================================== */

.pricing-table {

  width:
    100%;

  border-collapse:
    collapse;

}


.pricing-table td {

  padding:
    7px 9px;

  border:
    1px solid #d1d5db;

}


.pricing-label {

  width:
    70%;

  color:
    #374151;

}


.pricing-value {

  text-align:
    right;

  font-weight:
    700;

}


.grand-total td {

  background:
    #2563eb;

  color:
    #ffffff;

  font-size:
    11px;

  font-weight:
    800;

}


.per-person td {

  background:
    #eff6ff;

  color:
    #1d4ed8;

  font-weight:
    800;

}


/* ==========================================================
   INCLUSION / EXCLUSION
========================================================== */

.list-grid {

  display:
    flex;

  gap:
    10px;

}


.list-box {

  flex:
    1;

  padding:
    8px;

  border:
    1px solid #dbe2ea;

  border-radius:
    6px;

  page-break-inside:
    avoid;

}


.list-box h4 {

  margin:
    0 0 4px 0;

  color:
    #1d4ed8;

  font-size:
    9px;

}


.quotation-list {

  margin:
    2px 0 0 16px;

  padding:
    0;

}


.quotation-list li {

  margin-bottom:
    2px;

  font-size:
    8.5px;

}


/* ==========================================================
   PAYMENT
========================================================== */

.payment-box {

  padding:
    9px;

  border:
    1px solid #dbe2ea;

  border-radius:
    6px;

  page-break-inside:
    avoid;

}


.payment-layout {

  display:
    flex;

  justify-content:
    space-between;

  align-items:
    flex-start;

  gap:
    20px;

}


.bank-details {

  line-height:
    1.8;

  color:
    #374151;

  font-size:
    8.5px;

}


.qr-section {

  min-width:
    105px;

  text-align:
    center;

}


.qr-title {

  margin-bottom:
    4px;

  color:
    #374151;

  font-size:
    8px;

  font-weight:
    800;

}


.qr-image {

  width:
    90px;

  height:
    90px;

  object-fit:
    contain;

}


/* ==========================================================
   TERMS
========================================================== */

.terms-box {

  padding:
    8px 9px;

  border:
    1px solid #dbe2ea;

  border-radius:
    6px;

  color:
    #4b5563;

  font-size:
    8px;

  page-break-inside:
    avoid;

}


.terms-box p {

  margin:
    2px 0 5px 0;

}


.terms-box ul,
.terms-box ol {

  margin:
    3px 0 5px 16px;

}


/* ==========================================================
   NOTES
========================================================== */

.notes-box {

  padding:
    8px 9px;

  border:
    1px dashed #cbd5e1;

  border-radius:
    6px;

  background:
    #f8fafc;

  color:
    #4b5563;

  font-size:
    8px;

}


/* ==========================================================
   EMPTY
========================================================== */

.empty-box {

  padding:
    9px;

  border:
    1px dashed #cbd5e1;

  color:
    #6b7280;

  font-size:
    8px;

}


.muted {

  color:
    #6b7280;

}


/* ==========================================================
   FOOTER
========================================================== */

.document-footer {

  margin-top:
    14px;

  padding-top:
    7px;

  border-top:
    1px solid #dbe2ea;

  text-align:
    center;

  color:
    #6b7280;

  font-size:
    7.5px;

}


.footer-company {

  color:
    #374151;

  font-weight:
    700;

}


/* ==========================================================
   PDF PAGE BREAK HELP
========================================================== */

.page-break-avoid {

  page-break-inside:
    avoid;

}


h1,
h2,
h3,
h4 {

  page-break-after:
    avoid;

}


table {

  page-break-inside:
    auto;

}


tr {

  page-break-inside:
    avoid;

}


img {

  page-break-inside:
    avoid;

}

</style>

</head>


<body>


<div class="quotation-document">


  <!-- ======================================================
       COMPANY HEADER
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
          companyContact
            ? `
              <div class="company-contact">
                ${escapeHtml(
                  companyContact
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


      <div class="quotation-id">

        ${escapeHtml(
          quotationId
        )}

      </div>


      <div class="quotation-date">

        Date:
        ${formatDate(
          new Date()
            .toISOString()
            .slice(0, 10)
        )}

      </div>


      <div class="quotation-date">

        Status:
        ${escapeHtml(status)}

      </div>

    </div>


  </div>


  <!-- ======================================================
       CUSTOMER & TOUR DETAILS
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

          <strong>
            ${escapeHtml(customer)}
          </strong>

          ${customerContactHTML}

        </td>


        <td class="details-label">
          Enquiry
        </td>

        <td class="details-value">

          ${escapeHtml(
            enquiryReference
          )}

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

          ${escapeHtml(paxText)}

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

          ${formatDate(validUntil)}

        </td>

      </tr>


    </table>


  </div>


  <!-- ======================================================
       HOTEL DETAILS
  ====================================================== -->

  <div class="section">


    <div class="section-title">

      Hotel Details

    </div>


    ${buildHotelHTML(hotels)}


  </div>


  <!-- ======================================================
       TRANSPORT DETAILS
  ====================================================== -->

  <div class="section">


    <div class="section-title">

      Transportation

    </div>


    ${buildCabHTML(cabs)}


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


    ${buildItineraryHTML(itinerary)}


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


          <div class="list-grid">


            <div class="list-box">

              <h4>
                Inclusions
              </h4>

              ${buildListHTML(inclusions)}

            </div>


            <div class="list-box">

              <h4>
                Exclusions
              </h4>

              ${buildListHTML(exclusions)}

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
       PAYMENT DETAILS
  ====================================================== -->

  <div class="section">


    <div class="section-title">

      Payment Details

    </div>


    <div class="payment-box">

      ${buildPaymentHTML(settings)}

    </div>


  </div>


  <!-- ======================================================
       NOTES
  ====================================================== -->

  ${
    notes
      ? `

        <div class="section">

          <div class="section-title">

            Additional Information

          </div>


          <div class="notes-box">

            ${renderRichText(notes)}

          </div>

        </div>

      `
      : ""
  }


  <!-- ======================================================
       TERMS
  ====================================================== -->

  <div class="section">


    <div class="section-title">

      Terms & Conditions

    </div>


    <div class="terms-box">

      ${
        terms
          ? renderRichText(terms)
          : `
            <p>
              Package is subject to availability.
              Hotels and transportation are subject
              to confirmation.
            </p>

            <p>
              Final booking confirmation will be
              provided after receipt of the required
              advance payment.
            </p>

            <p>
              Prices may be revised if there is any
              change in travel dates, passenger count,
              hotel category or inclusions.
            </p>
          `
      }

    </div>


  </div>


  <!-- ======================================================
       FOOTER
  ====================================================== -->

  <div class="document-footer">


    <div class="footer-company">

      ${escapeHtml(
        settings.companyName ||
        "My Tour Mitra"
      )}

    </div>


    ${
      settings.quotationFooter
        ? `
          <div>
            ${renderRichText(
              settings.quotationFooter
            )}
          </div>
        `
        : `
          <div>
            Thank you for choosing us.
          </div>
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

function createPdfContainer(
  html
) {

  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.innerHTML =
    html;


  wrapper.style.position =
    "fixed";


  wrapper.style.left =
    "-100000px";


  wrapper.style.top =
    "0";


  wrapper.style.width =
    "210mm";


  wrapper.style.background =
    "#ffffff";


  wrapper.style.zIndex =
    "-9999";


  document.body.appendChild(
    wrapper
  );


  return wrapper;

}


// ============================================================
// CREATE PDF OPTIONS
// ============================================================

function getPdfOptions(
  quotation
) {

  const quotationId =
    firstValue(
      quotation,
      [
        "quotationId",
        "id"
      ],
      "Quotation"
    );


  const customer =
    firstValue(
      quotation,
      [
        "customerName",
        "customer"
      ],
      "Customer"
    );


  const safeQuotationId =
    String(quotationId)
      .replace(
        /[^a-z0-9-_]+/gi,
        "-"
      );


  const safeCustomer =
    String(customer)
      .replace(
        /[^a-z0-9-_]+/gi,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );


  return {

    margin: [
      0,
      0,
      0,
      0
    ],


    filename:
      `My-Tour-Mitra-Quotation-${safeQuotationId}-${safeCustomer || "Customer"}.pdf`,


    image: {

      type:
        "jpeg",

      quality:
        0.98

    },


    html2canvas: {

      scale:
        2,

      useCORS:
        true,

      allowTaint:
        false,

      backgroundColor:
        "#ffffff",

      logging:
        false,

      scrollX:
        0,

      scrollY:
        0

    },


    jsPDF: {

      unit:
        "mm",

      format:
        "a4",

      orientation:
        "portrait",

      compress:
        true

    },


    pagebreak: {

      mode: [
        "css",
        "legacy"
      ]

    }

  };

}


// ============================================================
// GENERATE / DOWNLOAD PDF
// ============================================================

async function generateQuotationPDF(
  quotation
) {

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
        "Quotation document could not be created."
      );

    }


    // Give images a moment to load.
    await waitForImages(
      element
    );


    const options =
      getPdfOptions(
        quotation
      );


    await html2pdf()

      .set(options)

      .from(element)

      .save();


  } catch (error) {

    console.error(
      "Quotation PDF generation failed:",
      error
    );


    alert(
      "Could not generate quotation PDF. Please check the browser console."
    );


  } finally {

    if (container) {

      container.remove();

    }

  }

}


// ============================================================
// WAIT FOR IMAGES
// ============================================================

function waitForImages(
  element
) {

  const images =
    Array.from(
      element.querySelectorAll(
        "img"
      )
    );


  if (!images.length) {

    return Promise.resolve();

  }


  return Promise.all(

    images.map(
      image =>
        new Promise(
          resolve => {

            if (
              image.complete
            ) {

              resolve();

              return;

            }


            image.onload =
              () => resolve();


            image.onerror =
              () => resolve();


            setTimeout(
              () => resolve(),
              3000
            );

          }
        )
    )

  );

}


// ============================================================
// GENERATE PDF BLOB
// ============================================================

async function createQuotationPdfBlob(
  quotation
) {

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


    await waitForImages(
      element
    );


    const options =
      getPdfOptions(
        quotation
      );


    const worker =
      html2pdf()

        .set(options)

        .from(element);


    const blob =
      await worker.output(
        "blob"
      );


    return blob;


  } finally {

    if (container) {

      container.remove();

    }

  }

}


// ============================================================
// SHARE PDF
// ============================================================

async function shareQuotationPDF(
  quotation
) {

  if (!quotation) {

    alert(
      "Quotation data not found."
    );

    return;

  }


  try {

    const blob =
      await createQuotationPdfBlob(
        quotation
      );


    const quotationId =
      firstValue(
        quotation,
        [
          "quotationId",
          "id"
        ],
        "Quotation"
      );


    const customer =
      firstValue(
        quotation,
        [
          "customerName",
          "customer"
        ],
        "Customer"
      );


    const safeQuotationId =
      String(quotationId)
        .replace(
          /[^a-z0-9-_]+/gi,
          "-"
        );


    const safeCustomer =
      String(customer)
        .replace(
          /[^a-z0-9-_]+/gi,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        );


    const filename =
      `My-Tour-Mitra-Quotation-${safeQuotationId}-${safeCustomer || "Customer"}.pdf`;


    // ========================================================
    // NATIVE FILE SHARE
    // ========================================================

    if (
      navigator.share &&
      navigator.canShare
    ) {

      const file =
        new File(
          [
            blob
          ],
          filename,
          {
            type:
              "application/pdf"
          }
        );


      if (
        navigator.canShare(
          {
            files: [
              file
            ]
          }
        )
      ) {

        await navigator.share(
          {

            title:
              `Quotation ${quotationId}`,

            text:
              `Quotation from My Tour Mitra`,

            files: [
              file
            ]

          }
        );


        return;

      }

    }


    // ========================================================
    // DESKTOP DOWNLOAD FALLBACK
    // ========================================================

    const url =
      URL.createObjectURL(
        blob
      );


    const anchor =
      document.createElement(
        "a"
      );


    anchor.href =
      url;


    anchor.download =
      filename;


    document.body.appendChild(
      anchor
    );


    anchor.click();


    anchor.remove();


    setTimeout(
      () => {

        URL.revokeObjectURL(
          url
        );

      },
      5000
    );


    // ========================================================
    // WHATSAPP MESSAGE
    // ========================================================

    const customerPhone =
      firstValue(
        quotation,
        [
          "customerPhone",
          "phone",
          "mobile"
        ],
        ""
      );


    const message =
      encodeURIComponent(

        `Hello ${customer},\n\nPlease find your quotation ${quotationId} from My Tour Mitra.\n\nThank you.`

      );


    if (customerPhone) {

      const whatsappUrl =
        `https://wa.me/${String(customerPhone).replace(/\D/g, "")}?text=${message}`;


      setTimeout(
        () => {

          window.open(
            whatsappUrl,
            "_blank"
          );

        },
        800
      );

    }


  } catch (error) {

    console.error(
      "Quotation sharing failed:",
      error
    );


    alert(
      "Could not prepare quotation PDF for sharing."
    );

  }

}


// ============================================================
// PREVIEW PDF IN NEW TAB
// ============================================================

async function previewQuotationPDF(
  quotation
) {

  if (!quotation) {

    alert(
      "Quotation data not found."
    );

    return;

  }


  try {

    const blob =
      await createQuotationPdfBlob(
        quotation
      );


    const url =
      URL.createObjectURL(
        blob
      );


    window.open(
      url,
      "_blank"
    );


    setTimeout(
      () => {

        URL.revokeObjectURL(
          url
        );

      },
      60000
    );


  } catch (error) {

    console.error(
      "Quotation PDF preview failed:",
      error
    );


    alert(
      "Could not preview quotation PDF."
    );

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
// previewQuotationPDF(quotation)
//
// ============================================================

window.generateQuotationPDF =
  generateQuotationPDF;


window.shareQuotationPDF =
  shareQuotationPDF;


window.previewQuotationPDF =
  previewQuotationPDF;


// ============================================================
// EXPORTS
// ============================================================

export {

  generateQuotationPDF,

  shareQuotationPDF,

  previewQuotationPDF,

  createQuotationPdfBlob,

  buildQuotationHTML,

  getCompanySettings

};
