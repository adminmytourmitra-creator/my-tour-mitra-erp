// ======================================================
// MY TOUR MITRA
// QUOTATION PDF GENERATOR
// ======================================================
//
// IMPORTANT:
// Company settings are NOT stored in Firebase Storage.
//
// Future Settings page will save company information in:
// localStorage key = "myTourMitraSettings"
//
// Logo and QR code will be stored as Data URLs.
// This PDF module automatically reads them.
//
// ======================================================


// ======================================================
// SETTINGS STORAGE KEY
// ======================================================

const SETTINGS_KEY =
  "myTourMitraSettings";


// ======================================================
// DEFAULT COMPANY SETTINGS
// ======================================================

const DEFAULT_SETTINGS = {

  companyName:
    "My Tour Mitra",

  tagline:
    "Travel ERP",

  logoDataUrl:
    "",

  phone:
    "",

  whatsapp:
    "",

  email:
    "",

  website:
    "",

  address:
    "",

  city:
    "",

  state:
    "",

  country:
    "India",

  pincode:
    "",

  gstNumber:
    "",

  panNumber:
    "",

  bankName:
    "",

  accountName:
    "",

  accountNumber:
    "",

  ifsc:
    "",

  upiId:
    "",

  qrCodeDataUrl:
    "",

  quotationTerms:
    "",

  quotationFooter:
    ""

};


// ======================================================
// LOAD COMPANY SETTINGS
// ======================================================

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
      "Could not load company settings:",
      error
    );

    return {
      ...DEFAULT_SETTINGS
    };

  }

}


// ======================================================
// LOAD HTML2PDF
// ======================================================

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
                  "html2pdf loaded but is unavailable."
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
                "html2pdf library unavailable."
              )
            );

          }

        };


      script.onerror =
        () => {

          reject(
            new Error(
              "Unable to load PDF library."
            )
          );

        };


      document.head.appendChild(
        script
      );

    }
  );

}


// ======================================================
// SAFE TEXT
// ======================================================

function escapeHtml(
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


// ======================================================
// FORMAT CURRENCY
// ======================================================

function formatCurrency(
  value
) {

  const number =
    Number(
      value || 0
    );

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


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(
  value
) {

  if (!value) {

    return "-";

  }


  const date =
    new Date(
      value + (
        String(value).length === 10
          ? "T00:00:00"
          : ""
      )
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return escapeHtml(
      value
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


// ======================================================
// GET FIRST AVAILABLE VALUE
// ======================================================

function firstValue(
  object,
  keys,
  fallback = ""
) {

  for (
    const key of keys
  ) {

    if (
      object &&
      object[key] !== undefined &&
      object[key] !== null &&
      object[key] !== ""
    ) {

      return object[key];

    }

  }


  return fallback;

}


// ======================================================
// HTML CONTENT CLEANER
// ======================================================
//
// Package Master may contain:
// <ul>
// <li>
// <b>
// <strong>
// <u>
// <span>
// etc.
//
// We want the PDF to RENDER the HTML,
// not print the tags.
//
// ======================================================

function renderRichText(
  value
) {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {

    return "";

  }


  const container =
    document.createElement(
      "div"
    );


  container.innerHTML =
    String(value);


  container
    .querySelectorAll(
      "script, style"
    )
    .forEach(
      (element) =>
        element.remove()
    );


  return container.innerHTML;

}


// ======================================================
// ITINERARY NORMALIZER
// ======================================================

function getItinerary(
  quotation
) {

  const possible =
    firstValue(
      quotation,
      [
        "itinerary",
        "packageItinerary",
        "itineraryDays",
        "days",
        "dayWiseItinerary"
      ],
      []
    );


  if (
    Array.isArray(possible)
  ) {

    return possible;

  }


  if (
    typeof possible ===
    "string"
  ) {

    return [
      {
        title:
          "Tour Itinerary",
        description:
          possible
      }
    ];

  }


  return [];

}


// ======================================================
// HOTEL NORMALIZER
// ======================================================

function getHotels(
  quotation
) {

  const hotels =
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
    Array.isArray(hotels)
  ) {

    return hotels;

  }


  if (
    typeof hotels ===
    "string" &&
    hotels.trim()
  ) {

    return [
      {
        hotel:
          hotels
      }
    ];

  }


  return [];

}


// ======================================================
// TRANSPORT NORMALIZER
// ======================================================

function getTransport(
  quotation
) {

  const transport =
    firstValue(
      quotation,
      [
        "transport",
        "transportation",
        "cab",
        "cabDetails",
        "selectedCab",
        "vehicle"
      ],
      ""
    );


  if (
    typeof transport ===
    "string"
  ) {

    return [
      {
        vehicle:
          transport
      }
    ];

  }


  if (
    Array.isArray(transport)
  ) {

    return transport;

  }


  if (
    transport &&
    typeof transport ===
    "object"
  ) {

    return [
      transport
    ];

  }


  return [];

}


// ======================================================
// GET INCLUSIONS
// ======================================================

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

    return value;

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


// ======================================================
// LOGO
// ======================================================

function getLogo(
  settings
) {

  return firstValue(
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


// ======================================================
// QR CODE
// ======================================================

function getQrCode(
  settings
) {

  return firstValue(
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


// ======================================================
// COMPANY ADDRESS
// ======================================================

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


// ======================================================
// COMPANY CONTACT LINE
// ======================================================

function getContactLine(
  settings
) {

  const parts = [];


  if (
    settings.phone
  ) {

    parts.push(
      `Phone: ${settings.phone}`
    );

  }


  if (
    settings.whatsapp
  ) {

    parts.push(
      `WhatsApp: ${settings.whatsapp}`
    );

  }


  if (
    settings.email
  ) {

    parts.push(
      `Email: ${settings.email}`
    );

  }


  if (
    settings.website
  ) {

    parts.push(
      `Website: ${settings.website}`
    );

  }


  return parts.join(
    "  |  "
  );

}


// ======================================================
// QUOTATION HTML
// ======================================================

function buildQuotationHTML(
  quotation
) {

  const settings =
    getCompanySettings();


  const logo =
    getLogo(
      settings
    );


  const qrCode =
    getQrCode(
      settings
    );


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
        "customer",
        "customerName",
        "name"
      ],
      "-"
    );


  const enquiry =
    firstValue(
      quotation,
      [
        "enquiry",
        "enquiryId",
        "enquiryReference"
      ],
      ""
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
        "startDate",
        "travelStartDate"
      ],
      ""
    );


  const endDate =
    firstValue(
      quotation,
      [
        "endDate",
        "travelEndDate"
      ],
      ""
    );


  const adults =
    Number(
      firstValue(
        quotation,
        [
          "adults"
        ],
        0
      )
    );


  const children =
    Number(
      firstValue(
        quotation,
        [
          "children"
        ],
        0
      )
    );


  const rooms =
    Number(
      firstValue(
        quotation,
        [
          "rooms"
        ],
        0
      )
    );


  const pax =
    adults +
    children;


  const packageCost =
    Number(
      firstValue(
        quotation,
        [
          "packageCost",
          "cost",
          "baseCost",
          "totalPackageCost"
        ],
        0
      )
    );


  const discount =
    Number(
      firstValue(
        quotation,
        [
          "discount"
        ],
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


  const grandTotal =
    Number(
      firstValue(
        quotation,
        [
          "grandTotal",
          "total",
          "totalAmount"
        ],
        packageCost -
        discount +
        gst
      )
    );


  const perPerson =
    Number(
      firstValue(
        quotation,
        [
          "perPerson",
          "perPersonAmount"
        ],
        pax > 0
          ? grandTotal / pax
          : 0
      )
    );


  const itinerary =
    getItinerary(
      quotation
    );


  const hotels =
    getHotels(
      quotation
    );


  const transport =
    getTransport(
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


  const terms =
    firstValue(
      quotation,
      [
        "terms",
        "termsAndConditions"
      ],
      settings.quotationTerms
    );


  const contactLine =
    getContactLine(
      settings
    );


  const companyAddress =
    getCompanyAddress(
      settings
    );


  // ==================================================
  // LOGO HTML
  // ==================================================

  const logoHTML =
    logo
      ? `
        <img
          src="${escapeHtml(logo)}"
          class="company-logo"
          alt="Company Logo"
        >
      `
      : `
        <div class="logo-placeholder">
          ${escapeHtml(
            settings.companyName ||
            "My Tour Mitra"
          )}
        </div>
      `;


  // ==================================================
  // HOTEL HTML
  // ==================================================

  const hotelHTML =
    hotels.length
      ? hotels
          .map(
            (hotel, index) => {

              if (
                typeof hotel ===
                "string"
              ) {

                return `
                  <tr>
                    <td>
                      ${escapeHtml(
                        String(index + 1)
                      )}
                    </td>
                    <td colspan="3">
                      ${escapeHtml(
                        hotel
                      )}
                    </td>
                  </tr>
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
                  "-"
                );


              const hotelName =
                firstValue(
                  hotel,
                  [
                    "hotel",
                    "hotelName",
                    "name"
                  ],
                  "-"
                );


              const room =
                firstValue(
                  hotel,
                  [
                    "room",
                    "roomType",
                    "rooms"
                  ],
                  "-"
                );


              const meal =
                firstValue(
                  hotel,
                  [
                    "meal",
                    "mealPlan",
                    "meals"
                  ],
                  "-"
                );


              return `
                <tr>

                  <td>
                    ${escapeHtml(
                      city
                    )}
                  </td>

                  <td>
                    <strong>
                      ${escapeHtml(
                        hotelName
                      )}
                    </strong>
                  </td>

                  <td>
                    ${escapeHtml(
                      room
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      meal
                    )}
                  </td>

                </tr>
              `;

            }
          )
          .join("")
      : `
        <tr>
          <td
            colspan="4"
            class="muted-cell"
          >
            No hotel details added.
          </td>
        </tr>
      `;


  // ==================================================
  // TRANSPORT HTML
  // ==================================================

  const transportHTML =
    transport.length
      ? transport
          .map(
            (item) => {

              if (
                typeof item ===
                "string"
              ) {

                return `
                  <tr>
                    <td colspan="4">
                      ${escapeHtml(
                        item
                      )}
                    </td>
                  </tr>
                `;

              }


              const vehicle =
                firstValue(
                  item,
                  [
                    "vehicle",
                    "vehicleName",
                    "cab",
                    "cabName",
                    "name"
                  ],
                  "-"
                );


              const category =
                firstValue(
                  item,
                  [
                    "category",
                    "type",
                    "vehicleType"
                  ],
                  "-"
                );


              const capacity =
                firstValue(
                  item,
                  [
                    "capacity",
                    "pax",
                    "seating"
                  ],
                  "-"
                );


              const details =
                firstValue(
                  item,
                  [
                    "details",
                    "description"
                  ],
                  "-"
                );


              return `
                <tr>

                  <td>
                    <strong>
                      ${escapeHtml(
                        vehicle
                      )}
                    </strong>
                  </td>

                  <td>
                    ${escapeHtml(
                      category
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      capacity
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      details
                    )}
                  </td>

                </tr>
              `;

            }
          )
          .join("")
      : `
        <tr>
          <td
            colspan="4"
            class="muted-cell"
          >
            No transportation details added.
          </td>
        </tr>
      `;


  // ==================================================
  // ITINERARY HTML
  // ==================================================

  const itineraryHTML =
    itinerary.length
      ? itinerary
          .map(
            (day, index) => {

              if (
                typeof day ===
                "string"
              ) {

                return `
                  <div
                    class="itinerary-day"
                  >

                    <div
                      class="day-heading"
                    >
                      Day ${index + 1}
                    </div>

                    <div
                      class="day-description"
                    >
                      ${renderRichText(
                        day
                      )}
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
                    "name",
                    "dayTitle"
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
                <div
                  class="itinerary-day"
                >

                  <div
                    class="day-heading"
                  >

                    Day ${escapeHtml(
                      dayNumber
                    )}

                    ${
                      title
                        ? `
                          <span>
                            — ${escapeHtml(
                              title
                            )}
                          </span>
                        `
                        : ""
                    }

                  </div>


                  <div
                    class="day-description"
                  >

                    ${renderRichText(
                      description
                    )}

                  </div>

                </div>
              `;

            }
          )
          .join("")
      : `
        <div class="empty-section">
          Itinerary details are not available.
        </div>
      `;


  // ==================================================
  // INCLUSIONS
  // ==================================================

  const inclusionHTML =
    inclusions.length
      ? `
        <ul>
          ${inclusions
            .map(
              item =>
                `<li>${escapeHtml(item)}</li>`
            )
            .join("")}
        </ul>
      `
      : `
        <p class="muted-cell">
          -
        </p>
      `;


  // ==================================================
  // EXCLUSIONS
  // ==================================================

  const exclusionHTML =
    exclusions.length
      ? `
        <ul>
          ${exclusions
            .map(
              item =>
                `<li>${escapeHtml(item)}</li>`
            )
            .join("")}
        </ul>
      `
      : `
        <p class="muted-cell">
          -
        </p>
      `;


  // ==================================================
  // PAYMENT DETAILS
  // ==================================================

  const paymentHTML =
    (
      settings.bankName ||
      settings.accountName ||
      settings.accountNumber ||
      settings.ifsc ||
      settings.upiId
    )
      ? `
        <div class="payment-grid">

          <div>

            ${
              settings.bankName
                ? `
                  <div>
                    <strong>
                      Bank:
                    </strong>
                    ${escapeHtml(
                      settings.bankName
                    )}
                  </div>
                `
                : ""
            }


            ${
              settings.accountName
                ? `
                  <div>
                    <strong>
                      Account Name:
                    </strong>
                    ${escapeHtml(
                      settings.accountName
                    )}
                  </div>
                `
                : ""
            }


            ${
              settings.accountNumber
                ? `
                  <div>
                    <strong>
                      Account Number:
                    </strong>
                    ${escapeHtml(
                      settings.accountNumber
                    )}
                  </div>
                `
                : ""
            }


            ${
              settings.ifsc
                ? `
                  <div>
                    <strong>
                      IFSC:
                    </strong>
                    ${escapeHtml(
                      settings.ifsc
                    )}
                  </div>
                `
                : ""
            }


            ${
              settings.upiId
                ? `
                  <div>
                    <strong>
                      UPI ID:
                    </strong>
                    ${escapeHtml(
                      settings.upiId
                    )}
                  </div>
                `
                : ""
            }

          </div>


          ${
            qrCode
              ? `
                <div
                  class="qr-box"
                >

                  <div>
                    Scan to Pay
                  </div>

                  <img
                    src="${escapeHtml(
                      qrCode
                    )}"
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
        <p class="muted-cell">
          Payment details will appear here once configured in Settings.
        </p>
      `;


  // ==================================================
  // TERMS
  // ==================================================

  const termsHTML =
    terms
      ? renderRichText(
          terms
        )
      : `
        <p>
          Package is subject to availability.
          Hotel and transportation are subject to confirmation.
          Final booking is confirmed only after receipt of the required advance payment.
        </p>
      `;


  // ==================================================
  // FINAL HTML
  // ==================================================

  return `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
Quotation ${escapeHtml(
  quotationId
)}
</title>


<style>

/* ==================================================
   PAGE
================================================== */

@page {

  size: A4;

  margin: 12mm 12mm 14mm 12mm;

}


* {

  box-sizing:
    border-box;

}


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
    10.5px;

  line-height:
    1.5;

}


/* ==================================================
   DOCUMENT
================================================== */

.quotation-document {

  width:
    100%;

  max-width:
    100%;

  background:
    #ffffff;

}


/* ==================================================
   HEADER
================================================== */

.company-header {

  display:
    flex;

  justify-content:
    space-between;

  align-items:
    flex-start;

  gap:
    20px;

  padding-bottom:
    12px;

  border-bottom:
    3px solid #2563eb;

}


.company-left {

  display:
    flex;

  align-items:
    center;

  gap:
    12px;

  min-width:
    0;

}


.company-logo {

  width:
    70px;

  height:
    70px;

  object-fit:
    contain;

}


.logo-placeholder {

  width:
    70px;

  height:
    70px;

  border:
    2px solid #2563eb;

  border-radius:
    10px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  text-align:
    center;

  font-size:
    10px;

  font-weight:
    bold;

  color:
    #2563eb;

  padding:
    5px;

}


.company-name {

  font-size:
    22px;

  font-weight:
    800;

  color:
    #111827;

  margin:
    0 0 2px 0;

}


.company-tagline {

  font-size:
    10px;

  color:
    #6b7280;

  margin-bottom:
    3px;

}


.company-address {

  font-size:
    9px;

  color:
    #4b5563;

  max-width:
    360px;

}


.company-contact {

  font-size:
    8.5px;

  color:
    #4b5563;

  margin-top:
    2px;

}


.quotation-title {

  text-align:
    right;

  min-width:
    150px;

}


.quotation-title h1 {

  margin:
    0;

  font-size:
    24px;

  letter-spacing:
    1px;

  color:
    #2563eb;

}


.quotation-meta {

  font-size:
    9px;

  color:
    #374151;

  margin-top:
    4px;

}


/* ==================================================
   SECTION
================================================== */

.section {

  margin-top:
    14px;

}


.section-title {

  margin:
    0 0 7px 0;

  padding:
    6px 9px;

  background:
    #eff6ff;

  border-left:
    4px solid #2563eb;

  color:
    #1d4ed8;

  font-size:
    12px;

  font-weight:
    800;

}


.section-subtitle {

  font-size:
    10px;

  color:
    #6b7280;

  margin:
    -2px 0 7px 0;

}


/* ==================================================
   CUSTOMER DETAILS
================================================== */

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
    1px solid #e5e7eb;

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


/* ==================================================
   STANDARD TABLE
================================================== */

.data-table {

  width:
    100%;

  border-collapse:
    collapse;

}


.data-table th {

  background:
    #2563eb;

  color:
    #ffffff;

  text-align:
    left;

  padding:
    7px;

  font-size:
    9px;

  font-weight:
    700;

}


.data-table td {

  border:
    1px solid #dbe2ea;

  padding:
    6px 7px;

  vertical-align:
    top;

}


.data-table tr {

  page-break-inside:
    avoid;

}


.muted-cell {

  color:
    #6b7280;

}


/* ==================================================
   ITINERARY
================================================== */

.itinerary-day {

  border:
    1px solid #e2e8f0;

  border-radius:
    7px;

  margin-bottom:
    8px;

  padding:
    8px 10px;

  page-break-inside:
    avoid;

}


.day-heading {

  color:
    #1d4ed8;

  font-weight:
    800;

  font-size:
    11px;

  margin-bottom:
    4px;

}


.day-heading span {

  color:
    #111827;

}


.day-description {

  color:
    #374151;

}


.day-description p {

  margin:
    2px 0 5px 0;

}


.day-description ul {

  margin:
    3px 0 5px 18px;

  padding:
    0;

}


.day-description ol {

  margin:
    3px 0 5px 18px;

  padding:
    0;

}


.day-description li {

  margin-bottom:
    2px;

}


.day-description strong {

  color:
    #111827;

}


.empty-section {

  color:
    #6b7280;

  border:
    1px dashed #d1d5db;

  padding:
    10px;

}


/* ==================================================
   PRICING
================================================== */

.pricing-table {

  width:
    100%;

  border-collapse:
    collapse;

}


.pricing-table td {

  border:
    1px solid #d1d5db;

  padding:
    7px 9px;

}


.pricing-label {

  width:
    65%;

  color:
    #374151;

}


.pricing-value {

  text-align:
    right;

  font-weight:
    600;

}


.grand-total td {

  background:
    #eff6ff;

  color:
    #1d4ed8;

  font-size:
    12px;

  font-weight:
    800;

}


.per-person td {

  background:
    #f8fafc;

  font-weight:
    700;

}


/* ==================================================
   PAYMENT
================================================== */

.payment-box {

  border:
    1px solid #dbe2ea;

  border-radius:
    8px;

  padding:
    10px;

  page-break-inside:
    avoid;

}


.payment-grid {

  display:
    flex;

  justify-content:
    space-between;

  align-items:
    flex-start;

  gap:
    20px;

}


.payment-grid > div:first-child {

  line-height:
    1.8;

}


.qr-box {

  text-align:
    center;

  min-width:
    110px;

  font-weight:
    700;

  color:
    #374151;

}


.qr-image {

  width:
    95px;

  height:
    95px;

  object-fit:
    contain;

  margin-top:
    5px;

}


/* ==================================================
   LISTS
================================================== */

.list-columns {

  display:
    flex;

  gap:
    20px;

}


.list-column {

  flex:
    1;

  border:
    1px solid #e5e7eb;

  border-radius:
    7px;

  padding:
    8px 10px;

  page-break-inside:
    avoid;

}


.list-column h4 {

  margin:
    0 0 5px 0;

  color:
    #1d4ed8;

  font-size:
    10px;

}


.list-column ul {

  margin:
    3px 0 0 16px;

  padding:
    0;

}


.list-column li {

  margin-bottom:
    2px;

}


/* ==================================================
   TERMS
================================================== */

.terms-box {

  border:
    1px solid #e5e7eb;

  border-radius:
    7px;

  padding:
    9px 10px;

  font-size:
    9px;

  color:
    #4b5563;

  page-break-inside:
    avoid;

}


.terms-box p {

  margin:
    3px 0 5px 0;

}


.terms-box ul {

  margin:
    3px 0 5px 16px;

  padding:
    0;

}


/* ==================================================
   FOOTER
================================================== */

.document-footer {

  margin-top:
    18px;

  padding-top:
    8px;

  border-top:
    1px solid #dbe2ea;

  text-align:
    center;

  font-size:
    8.5px;

  color:
    #6b7280;

}


.gst-line {

  margin-top:
    3px;

}


</style>

</head>


<body>


<div
  class="quotation-document"
>


  <!-- ==================================================
       COMPANY HEADER
  ================================================== -->

  <div
    class="company-header"
  >

    <div
      class="company-left"
    >

      ${logoHTML}


      <div>

        <div
          class="company-name"
        >
          ${escapeHtml(
            settings.companyName ||
            "My Tour Mitra"
          )}
        </div>


        ${
          settings.tagline
            ? `
              <div
                class="company-tagline"
              >
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
              <div
                class="company-address"
              >
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
              <div
                class="company-contact"
              >
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
              <div
                class="company-contact"
              >
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


    <div
      class="quotation-title"
    >

      <h1>
        QUOTATION
      </h1>


      <div
        class="quotation-meta"
      >

        <strong>
          Quotation ID:
        </strong>

        ${escapeHtml(
          quotationId
        )}

      </div>


      <div
        class="quotation-meta"
      >

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


  <!-- ==================================================
       CUSTOMER DETAILS
  ================================================== -->

  <div
    class="section"
  >

    <div
      class="section-title"
    >
      Customer & Tour Details
    </div>


    <table
      class="details-table"
    >

      <tr>

        <td
          class="details-label"
        >
          Customer
        </td>

        <td
          class="details-value"
        >
          ${escapeHtml(
            customer
          )}
        </td>


        <td
          class="details-label"
        >
          Enquiry
        </td>

        <td
          class="details-value"
        >
          ${escapeHtml(
            enquiry || "-"
          )}
        </td>

      </tr>


      <tr>

        <td
          class="details-label"
        >
          Package
        </td>

        <td
          class="details-value"
        >
          <strong>
            ${escapeHtml(
              packageName
            )}
          </strong>
        </td>


        <td
          class="details-label"
        >
          Destination
        </td>

        <td
          class="details-value"
        >
          ${escapeHtml(
            destination
          )}
        </td>

      </tr>


      <tr>

        <td
          class="details-label"
        >
          Travel Date
        </td>

        <td
          class="details-value"
        >

          ${formatDate(
            startDate
          )}

          ${
            endDate
              ? `
                &nbsp;–&nbsp;
                ${formatDate(
                  endDate
                )}
              `
              : ""
          }

        </td>


        <td
          class="details-label"
        >
          Pax
        </td>

        <td
          class="details-value"
        >

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

        <td
          class="details-label"
        >
          Rooms
        </td>

        <td
          class="details-value"
        >
          ${rooms || "-"}
        </td>


        <td
          class="details-label"
        >
          Valid Until
        </td>

        <td
          class="details-value"
        >
          ${formatDate(
            quotation.validUntil
          )}
        </td>

      </tr>

    </table>

  </div>


  <!-- ==================================================
       TRANSPORT
  ================================================== -->

  <div
    class="section"
  >

    <div
      class="section-title"
    >
      Transportation
    </div>


    <table
      class="data-table"
    >

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


  <!-- ==================================================
       HOTELS
  ================================================== -->

  <div
    class="section"
  >

    <div
      class="section-title"
    >
      Hotel Details
    </div>


    <table
      class="data-table"
    >

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


  <!-- ==================================================
       ITINERARY
  ================================================== -->

  <div
    class="section"
  >

    <div
      class="section-title"
    >
      Tour Itinerary
    </div>


    <div
      class="section-subtitle"
    >
      Day-wise tour plan
    </div>


    ${itineraryHTML}

  </div>


  <!-- ==================================================
       INCLUSIONS / EXCLUSIONS
  ================================================== -->

  ${
    inclusions.length ||
    exclusions.length
      ? `

        <div
          class="section"
        >

          <div
            class="section-title"
          >
            Package Inclusions & Exclusions
          </div>


          <div
            class="list-columns"
          >

            <div
              class="list-column"
            >

              <h4>
                Inclusions
              </h4>

              ${inclusionHTML}

            </div>


            <div
              class="list-column"
            >

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


  <!-- ==================================================
       PRICING
  ================================================== -->

  <div
    class="section"
  >

    <div
      class="section-title"
    >
      Quotation Summary
    </div>


    <table
      class="pricing-table"
    >

      <tr>

        <td
          class="pricing-label"
        >
          Package Cost
        </td>

        <td
          class="pricing-value"
        >
          ${formatCurrency(
            packageCost
          )}
        </td>

      </tr>


      <tr>

        <td
          class="pricing-label"
        >
          Discount
        </td>

        <td
          class="pricing-value"
        >
          ${formatCurrency(
            discount
          )}
        </td>

      </tr>


      <tr>

        <td
          class="pricing-label"
        >
          GST
        </td>

        <td
          class="pricing-value"
        >
          ${formatCurrency(
            gst
          )}
        </td>

      </tr>


      <tr
        class="grand-total"
      >

        <td>
          GRAND TOTAL
        </td>

        <td
          class="pricing-value"
        >
          ${formatCurrency(
            grandTotal
          )}
        </td>

      </tr>


      <tr
        class="per-person"
      >

        <td>
          Total Package Cost / Per Person
        </td>

        <td
          class="pricing-value"
        >
          ${formatCurrency(
            perPerson
          )}
        </td>

      </tr>

    </table>

  </div>


  <!-- ==================================================
       PAYMENT DETAILS
  ================================================== -->

  <div
    class="section"
  >

    <div
      class="section-title"
    >
      Payment Details
    </div>


    <div
      class="payment-box"
    >

      ${paymentHTML}

    </div>

  </div>


  <!-- ==================================================
       TERMS
  ================================================== -->

  <div
    class="section"
  >

    <div
      class="section-title"
    >
      Terms & Conditions
    </div>


    <div
      class="terms-box"
    >

      ${termsHTML}

    </div>

  </div>


  <!-- ==================================================
       FOOTER
  ================================================== -->

  <div
    class="document-footer"
  >

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
            Thank you for choosing
            ${escapeHtml(
              settings.companyName ||
              "My Tour Mitra"
            )}.
          </div>
        `
    }


    ${
      settings.panNumber
        ? `
          <div
            class="gst-line"
          >
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


// ======================================================
// CREATE TEMPORARY PDF CONTAINER
// ======================================================

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
    "794px";


  wrapper.style.background =
    "#ffffff";


  wrapper.style.zIndex =
    "-1";


  document.body.appendChild(
    wrapper
  );


  return wrapper;

}


// ======================================================
// GENERATE PDF
// ======================================================

async function generateQuotationPDF(
  quotation
) {

  if (!quotation) {

    alert(
      "Quotation data not found."
    );

    return;

  }


  try {

    const html2pdf =
      await loadHtml2Pdf();


    const html =
      buildQuotationHTML(
        quotation
      );


    const container =
      createPdfContainer(
        html
      );


    const element =
      container.querySelector(
        ".quotation-document"
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
          "customer",
          "customerName"
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


    const filename =
      `My-Tour-Mitra-Quotation-${quotationId}-${safeCustomer}.pdf`;


    const options = {

      margin: [
        10,
        10,
        12,
        10
      ],

      filename:
        filename,

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

        backgroundColor:
          "#ffffff",

        logging:
          false

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


    await html2pdf()
      .set(options)
      .from(element)
      .save();


    container.remove();


  } catch (error) {

    console.error(
      "Quotation PDF generation error:",
      error
    );


    alert(
      "Could not generate quotation PDF. Please check the browser console."
    );

  }

}


// ======================================================
// SHARE QUOTATION PDF
// ======================================================

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

    const html2pdf =
      await loadHtml2Pdf();


    const html =
      buildQuotationHTML(
        quotation
      );


    const container =
      createPdfContainer(
        html
      );


    const element =
      container.querySelector(
        ".quotation-document"
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
          "customer",
          "customerName"
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


    const filename =
      `My-Tour-Mitra-Quotation-${quotationId}-${safeCustomer}.pdf`;


    const options = {

      margin: [
        10,
        10,
        12,
        10
      ],

      filename:
        filename,

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

        backgroundColor:
          "#ffffff",

        logging:
          false

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


    const worker =
      html2pdf()
        .set(options)
        .from(element);


    const pdfBlob =
      await worker.output(
        "blob"
      );


    container.remove();


    // ==================================================
    // MOBILE / SUPPORTED WEB SHARE
    // ==================================================

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
          files: [
            file
          ]
        })
      ) {

        await navigator.share({

          title:
            `Quotation ${quotationId}`,

          text:
            `Quotation from My Tour Mitra`,

          files: [
            file
          ]

        });


        return;

      }

    }


    // ==================================================
    // DESKTOP FALLBACK
    // ==================================================

    const url =
      URL.createObjectURL(
        pdfBlob
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
      3000
    );


    const phone =
      getCompanySettings()
        .whatsapp;


    const message =
      encodeURIComponent(
        `Hello ${customer},\n\nPlease find your quotation ${quotationId} from My Tour Mitra.\n\nThank you.`
      );


    if (phone) {

      const whatsappUrl =
        `https://wa.me/${String(phone).replace(/\D/g, "")}?text=${message}`;


      window.open(
        whatsappUrl,
        "_blank"
      );

    }


  } catch (error) {

    console.error(
      "Quotation sharing error:",
      error
    );


    alert(
      "Could not prepare quotation for sharing."
    );

  }

}


// ======================================================
// GLOBAL FUNCTIONS
// ======================================================
//
// quotations.js currently calls:
//
// generateQuotationPDF(quotation)
// shareQuotationPDF(quotation)
//
// Therefore expose them globally.
// ======================================================

window.generateQuotationPDF =
  generateQuotationPDF;


window.shareQuotationPDF =
  shareQuotationPDF;


// ======================================================
// EXPORTS
// ======================================================

export {

  generateQuotationPDF,

  shareQuotationPDF,

  getCompanySettings

};
