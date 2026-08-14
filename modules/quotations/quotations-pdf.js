/* =========================================================
   MY TOUR MITRA ERP
   QUOTATION PDF GENERATOR
   File: modules/quotations/quotations-pdf.js
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       BASIC HELPERS
       ===================================================== */

    function escapeHTML(value) {
        if (value === null || value === undefined) return "";

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function safe(value, fallback = "") {
        return value !== undefined &&
            value !== null &&
            value !== ""
            ? value
            : fallback;
    }

    function formatCurrency(value) {
        const amount = Number(value) || 0;

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(amount);
    }

    function formatDate(value) {
        if (!value) return "";

        try {
            const date = new Date(value);

            if (isNaN(date.getTime())) {
                return escapeHTML(value);
            }

            return date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        } catch (error) {
            return escapeHTML(value);
        }
    }

    function arrayValue(value) {
        return Array.isArray(value) ? value : [];
    }


    /* =====================================================
       COMPANY INFORMATION
       ===================================================== */

    function getCompanyData() {

        const settings =
            window.MTM_SETTINGS ||
            window.companySettings ||
            window.erpSettings ||
            {};

        return {
            name: safe(
                settings.companyName,
                "My Tour Mitra"
            ),

            tagline: safe(
                settings.tagline,
                "Your Trusted Travel Partner"
            ),

            address: safe(
                settings.address,
                "Assam, India"
            ),

            phone: safe(
                settings.phone,
                ""
            ),

            whatsapp: safe(
                settings.whatsapp,
                ""
            ),

            email: safe(
                settings.email,
                ""
            ),

            website: safe(
                settings.website,
                "www.mytourmitra.com"
            ),

            gst: safe(
                settings.gstNumber,
                ""
            ),

            logo: safe(
                settings.logo,
                "assets/logo/logo.png"
            ),

            signature: safe(
                settings.signature,
                "assets/signature/signature.png"
            )
        };
    }


    /* =====================================================
       CUSTOMER SECTION
       ===================================================== */

    function renderCustomer(data) {

        const customer =
            data.customer ||
            data.customerData ||
            {};

        return `
            <section class="quotation-customer-section">

                <h3 class="quotation-section-title">
                    Customer Details
                </h3>

                <div class="quotation-customer-grid">

                    <div class="quotation-customer-row">
                        <span class="quotation-customer-label">
                            Name:
                        </span>
                        <span class="quotation-customer-value">
                            ${escapeHTML(
                                safe(
                                    customer.name,
                                    data.customerName
                                )
                            )}
                        </span>
                    </div>

                    <div class="quotation-customer-row">
                        <span class="quotation-customer-label">
                            Mobile:
                        </span>
                        <span class="quotation-customer-value">
                            ${escapeHTML(
                                safe(
                                    customer.mobile,
                                    customer.phone
                                )
                            )}
                        </span>
                    </div>

                    <div class="quotation-customer-row">
                        <span class="quotation-customer-label">
                            Email:
                        </span>
                        <span class="quotation-customer-value">
                            ${escapeHTML(
                                safe(customer.email)
                            )}
                        </span>
                    </div>

                    <div class="quotation-customer-row">
                        <span class="quotation-customer-label">
                            Address:
                        </span>
                        <span class="quotation-customer-value">
                            ${escapeHTML(
                                safe(customer.address)
                            )}
                        </span>
                    </div>

                </div>

            </section>
        `;
    }


    /* =====================================================
       TOUR SUMMARY
       ===================================================== */

    function renderTourSummary(data) {

        return `
            <section class="quotation-tour-summary">

                <h3 class="quotation-section-title">
                    Tour Summary
                </h3>

                <table class="quotation-tour-table">

                    <tbody>

                        <tr>
                            <th>Destination</th>
                            <td>
                                ${escapeHTML(
                                    safe(data.destination)
                                )}
                            </td>
                        </tr>

                        <tr>
                            <th>Travel Dates</th>
                            <td>
                                ${formatDate(data.startDate)}
                                ${
                                    data.endDate
                                        ? " - " +
                                          formatDate(data.endDate)
                                        : ""
                                }
                            </td>
                        </tr>

                        <tr>
                            <th>Duration</th>
                            <td>
                                ${escapeHTML(
                                    safe(data.duration)
                                )}
                            </td>
                        </tr>

                        <tr>
                            <th>Guests</th>
                            <td>
                                ${escapeHTML(
                                    safe(
                                        data.pax,
                                        data.guests
                                    )
                                )}
                            </td>
                        </tr>

                        <tr>
                            <th>Package</th>
                            <td>
                                ${escapeHTML(
                                    safe(
                                        data.packageName
                                    )
                                )}
                            </td>
                        </tr>

                    </tbody>

                </table>

            </section>
        `;
    }


    /* =====================================================
       PACKAGE INFORMATION
       ===================================================== */

    function renderPackage(data) {

        return `
            <section class="quotation-package">

                <h3 class="quotation-section-title">
                    Package Details
                </h3>

                <div class="quotation-package-box">

                    <h2 class="quotation-package-name">
                        ${escapeHTML(
                            safe(
                                data.packageName,
                                "Tour Package"
                            )
                        )}
                    </h2>

                    <p class="quotation-package-description">
                        ${escapeHTML(
                            safe(
                                data.packageDescription
                            )
                        )}
                    </p>

                </div>

            </section>
        `;
    }


    /* =====================================================
       ITINERARY
       ===================================================== */

    function renderItinerary(data) {

        const itinerary =
            arrayValue(
                data.itinerary ||
                data.itineraryDays
            );

        if (!itinerary.length) {
            return "";
        }

        return `
            <section class="quotation-itinerary">

                <h3 class="quotation-section-title">
                    Detailed Itinerary
                </h3>

                ${itinerary.map((day, index) => {

                    const dayNumber =
                        safe(
                            day.day,
                            index + 1
                        );

                    const title =
                        safe(
                            day.title,
                            day.destination,
                            `Day ${dayNumber}`
                        );

                    const description =
                        safe(
                            day.description,
                            day.details
                        );

                    const activities =
                        arrayValue(
                            day.activities ||
                            day.sightseeing ||
                            day.points
                        );

                    return `
                        <div class="itinerary-day">

                            <div class="itinerary-day-header">

                                <span class="itinerary-day-title">
                                    Day ${escapeHTML(dayNumber)}
                                    ${
                                        title
                                            ? " - " +
                                              escapeHTML(title)
                                            : ""
                                    }
                                </span>

                            </div>

                            <div class="itinerary-day-content">

                                ${
                                    description
                                        ? `
                                            <p class="itinerary-description">
                                                ${escapeHTML(description)}
                                            </p>
                                          `
                                        : ""
                                }

                                ${
                                    activities.length
                                        ? `
                                            <ul class="itinerary-points">
                                                ${activities.map(
                                                    activity => `
                                                        <li>
                                                            ${escapeHTML(
                                                                typeof activity ===
                                                                "object"
                                                                    ? safe(
                                                                        activity.name,
                                                                        activity.title
                                                                    )
                                                                    : activity
                                                            )}
                                                        </li>
                                                    `
                                                ).join("")}
                                            </ul>
                                          `
                                        : ""
                                }

                            </div>

                        </div>
                    `;
                }).join("")}

            </section>
        `;
    }


    /* =====================================================
       HOTEL DETAILS
       ===================================================== */

    function renderHotels(data) {

        const hotels =
            arrayValue(
                data.hotels ||
                data.hotelDetails
            );

        if (!hotels.length) {
            return "";
        }

        return `
            <section class="quotation-hotels">

                <h3 class="quotation-section-title">
                    Hotel Accommodation
                </h3>

                <table class="quotation-hotel-table">

                    <thead>
                        <tr>
                            <th>City</th>
                            <th>Hotel</th>
                            <th>Room Type</th>
                            <th>Nights</th>
                            <th>Meal Plan</th>
                        </tr>
                    </thead>

                    <tbody>

                        ${hotels.map(hotel => `
                            <tr>

                                <td>
                                    ${escapeHTML(
                                        safe(
                                            hotel.city,
                                            hotel.destination
                                        )
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        safe(
                                            hotel.name,
                                            hotel.hotelName
                                        )
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        safe(
                                            hotel.roomType
                                        )
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        safe(hotel.nights)
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        safe(
                                            hotel.mealPlan,
                                            hotel.meals
                                        )
                                    )}
                                </td>

                            </tr>
                        `).join("")}

                    </tbody>

                </table>

            </section>
        `;
    }


    /* =====================================================
       CAB / TRANSPORT DETAILS
       ===================================================== */

    function renderCabs(data) {

        const cabs =
            arrayValue(
                data.cabs ||
                data.transport ||
                data.vehicles
            );

        if (!cabs.length) {
            return "";
        }

        return `
            <section class="quotation-cabs">

                <h3 class="quotation-section-title">
                    Transportation
                </h3>

                <table class="quotation-cab-table">

                    <thead>
                        <tr>
                            <th>Vehicle</th>
                            <th>Type</th>
                            <th>Route / Service</th>
                            <th>Days</th>
                        </tr>
                    </thead>

                    <tbody>

                        ${cabs.map(cab => `
                            <tr>

                                <td>
                                    ${escapeHTML(
                                        safe(
                                            cab.vehicle,
                                            cab.vehicleName
                                        )
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        safe(
                                            cab.type,
                                            cab.vehicleType
                                        )
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        safe(
                                            cab.route,
                                            cab.service
                                        )
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        safe(cab.days)
                                    )}
                                </td>

                            </tr>
                        `).join("")}

                    </tbody>

                </table>

            </section>
        `;
    }


    /* =====================================================
       INCLUSIONS / EXCLUSIONS
       ===================================================== */

    function renderInclusionsExclusions(data) {

        const inclusions =
            arrayValue(
                data.inclusions
            );

        const exclusions =
            arrayValue(
                data.exclusions
            );

        return `
            <section class="quotation-inclusions-exclusions">

                <div class="quotation-list-box">

                    <h4>
                        Inclusions
                    </h4>

                    <ul>

                        ${
                            inclusions.length
                                ? inclusions.map(item => `
                                    <li>
                                        ${escapeHTML(item)}
                                    </li>
                                  `).join("")
                                : `
                                    <li>
                                        As per package details
                                    </li>
                                  `
                        }

                    </ul>

                </div>


                <div class="quotation-list-box">

                    <h4>
                        Exclusions
                    </h4>

                    <ul>

                        ${
                            exclusions.length
                                ? exclusions.map(item => `
                                    <li>
                                        ${escapeHTML(item)}
                                    </li>
                                  `).join("")
                                : `
                                    <li>
                                        Personal expenses and other
                                        services not mentioned above
                                    </li>
                                  `
                        }

                    </ul>

                </div>

            </section>
        `;
    }


    /* =====================================================
       PRICE BREAKDOWN
       ===================================================== */

    function renderPricing(data) {

        const rows =
            arrayValue(
                data.priceBreakdown ||
                data.pricing ||
                data.items
            );

        let subtotal =
            Number(
                data.subtotal
            ) || 0;

        const tax =
            Number(
                data.tax ||
                data.gstAmount
            ) || 0;

        const discount =
            Number(
                data.discount
            ) || 0;

        const total =
            Number(
                data.total ||
                data.grandTotal ||
                data.finalAmount
            ) || 0;


        return `
            <section class="quotation-pricing">

                <h3 class="quotation-section-title">
                    Price Details
                </h3>

                <table class="quotation-price-table">

                    <thead>

                        <tr>
                            <th>Description</th>
                            <th class="amount">
                                Amount
                            </th>
                        </tr>

                    </thead>

                    <tbody>

                        ${
                            rows.length
                                ? rows.map(row => {

                                    const amount =
                                        Number(
                                            row.amount ||
                                            row.price ||
                                            row.total
                                        ) || 0;

                                    return `
                                        <tr>

                                            <td>
                                                ${escapeHTML(
                                                    safe(
                                                        row.description,
                                                        row.name
                                                    )
                                                )}
                                            </td>

                                            <td class="amount">
                                                ${formatCurrency(
                                                    amount
                                                )}
                                            </td>

                                        </tr>
                                    `;

                                }).join("")
                                : `
                                    <tr>
                                        <td>
                                            Tour Package
                                        </td>

                                        <td class="amount">
                                            ${formatCurrency(
                                                subtotal || total
                                            )}
                                        </td>
                                    </tr>
                                  `
                        }

                        ${
                            discount > 0
                                ? `
                                    <tr>
                                        <td>
                                            Discount
                                        </td>
                                        <td class="amount">
                                            -${formatCurrency(
                                                discount
                                            )}
                                        </td>
                                    </tr>
                                  `
                                : ""
                        }

                        ${
                            tax > 0
                                ? `
                                    <tr>
                                        <td>
                                            GST / Tax
                                        </td>
                                        <td class="amount">
                                            ${formatCurrency(
                                                tax
                                            )}
                                        </td>
                                    </tr>
                                  `
                                : ""
                        }

                        <tr class="quotation-total-row">

                            <td>
                                Grand Total
                            </td>

                            <td class="amount quotation-grand-total">
                                ${formatCurrency(total)}
                            </td>

                        </tr>

                    </tbody>

                </table>

            </section>
        `;
    }


    /* =====================================================
       PAYMENT SCHEDULE
       ===================================================== */

    function renderPaymentSchedule(data) {

        const payments =
            arrayValue(
                data.paymentSchedule ||
                data.payments
            );

        if (!payments.length) {
            return "";
        }

        return `
            <section class="quotation-payment">

                <h3 class="quotation-section-title">
                    Payment Schedule
                </h3>

                <table class="quotation-payment-table">

                    <thead>
                        <tr>
                            <th>Stage</th>
                            <th>Due Date</th>
                            <th>Amount</th>
                        </tr>
                    </thead>

                    <tbody>

                        ${payments.map(payment => `
                            <tr>

                                <td>
                                    ${escapeHTML(
                                        safe(
                                            payment.stage,
                                            payment.description
                                        )
                                    )}
                                </td>

                                <td>
                                    ${formatDate(
                                        payment.dueDate
                                    )}
                                </td>

                                <td>
                                    ${formatCurrency(
                                        payment.amount
                                    )}
                                </td>

                            </tr>
                        `).join("")}

                    </tbody>

                </table>

            </section>
        `;
    }


    /* =====================================================
       PAYMENT TERMS
       ===================================================== */

    function renderPaymentTerms(data) {

        if (!data.paymentTerms) {
            return "";
        }

        return `
            <section class="quotation-payment-terms">

                <h4>
                    Payment Terms
                </h4>

                <p>
                    ${escapeHTML(
                        data.paymentTerms
                    )}
                </p>

            </section>
        `;
    }


    /* =====================================================
       TERMS & CONDITIONS
       ===================================================== */

    function renderTerms(data) {

        const terms =
            arrayValue(
                data.terms ||
                data.termsConditions
            );

        if (!terms.length) {
            return "";
        }

        return `
            <section class="quotation-terms">

                <h3 class="quotation-section-title">
                    Terms & Conditions
                </h3>

                <ol>

                    ${terms.map(term => `
                        <li>
                            ${escapeHTML(term)}
                        </li>
                    `).join("")}

                </ol>

            </section>
        `;
    }


    /* =====================================================
       NOTES
       ===================================================== */

    function renderNotes(data) {

        if (!data.notes) {
            return "";
        }

        return `
            <section class="quotation-notes">

                <h4>
                    Notes
                </h4>

                <p>
                    ${escapeHTML(
                        data.notes
                    )}
                </p>

            </section>
        `;
    }


    /* =====================================================
       COMPLETE PDF HTML
       ===================================================== */

    function buildQuotationPDF(data) {

        const company = getCompanyData();

        return `
            <div class="quotation-pdf">

                <!-- HEADER -->

                <header class="quotation-pdf-header">

                    <div class="quotation-company">

                        ${
                            company.logo
                                ? `
                                    <img
                                        src="${escapeHTML(company.logo)}"
                                        class="quotation-company-logo"
                                        alt="My Tour Mitra"
                                    >
                                  `
                                : ""
                        }

                        <h1 class="quotation-company-name">
                            ${escapeHTML(company.name)}
                        </h1>

                        <p class="quotation-company-tagline">
                            ${escapeHTML(company.tagline)}
                        </p>

                        <div class="quotation-company-details">

                            ${
                                company.address
                                    ? `<div>${escapeHTML(company.address)}</div>`
                                    : ""
                            }

                            ${
                                company.phone
                                    ? `<div>Phone: ${escapeHTML(company.phone)}</div>`
                                    : ""
                            }

                            ${
                                company.whatsapp
                                    ? `<div>WhatsApp: ${escapeHTML(company.whatsapp)}</div>`
                                    : ""
                            }

                            ${
                                company.email
                                    ? `<div>Email: ${escapeHTML(company.email)}</div>`
                                    : ""
                            }

                            ${
                                company.website
                                    ? `<div>${escapeHTML(company.website)}</div>`
                                    : ""
                            }

                            ${
                                company.gst
                                    ? `<div>GSTIN: ${escapeHTML(company.gst)}</div>`
                                    : ""
                            }

                        </div>

                    </div>


                    <div class="quotation-meta">

                        <h2 class="quotation-title">
                            Quotation
                        </h2>

                        <div class="quotation-number">
                            <strong>
                                Quotation No:
                            </strong>

                            ${escapeHTML(
                                safe(
                                    data.quotationNumber,
                                    data.quotationId,
                                    "QUOTATION"
                                )
                            )}
                        </div>

                        <div class="quotation-date">
                            Date:
                            ${formatDate(
                                data.quotationDate ||
                                data.date ||
                                new Date()
                            )}
                        </div>

                    </div>

                </header>


                <!-- CUSTOMER -->

                ${renderCustomer(data)}


                <!-- TOUR SUMMARY -->

                ${renderTourSummary(data)}


                <!-- PACKAGE -->

                ${renderPackage(data)}


                <!-- ITINERARY -->

                ${renderItinerary(data)}


                <!-- HOTELS -->

                ${renderHotels(data)}


                <!-- CABS -->

                ${renderCabs(data)}


                <!-- INCLUSIONS / EXCLUSIONS -->

                ${renderInclusionsExclusions(data)}


                <!-- PRICING -->

                ${renderPricing(data)}


                <!-- PAYMENT SCHEDULE -->

                ${renderPaymentSchedule(data)}


                <!-- PAYMENT TERMS -->

                ${renderPaymentTerms(data)}


                <!-- TERMS -->

                ${renderTerms(data)}


                <!-- NOTES -->

                ${renderNotes(data)}


                <!-- SIGNATURE -->

                <section class="quotation-signature-section">

                    <div class="quotation-signature">

                        ${
                            company.signature
                                ? `
                                    <img
                                        src="${escapeHTML(
                                            company.signature
                                        )}"
                                        class="quotation-signature-image"
                                        alt="Authorized Signature"
                                    >
                                  `
                                : ""
                        }

                        <div class="quotation-signature-line">
                            Authorized Signatory
                        </div>

                        <div class="quotation-signature-role">
                            ${escapeHTML(company.name)}
                        </div>

                    </div>

                </section>


                <!-- FOOTER -->

                <footer class="quotation-pdf-footer">

                    <p>
                        Thank you for choosing
                        ${escapeHTML(company.name)}.
                    </p>

                    <p>
                        This quotation is subject to the
                        terms and conditions mentioned above.
                    </p>

                </footer>

            </div>
        `;
    }


    /* =====================================================
       PREVIEW
       ===================================================== */

    function previewQuotationPDF(data) {

        const html = buildQuotationPDF(data);

        let container =
            document.getElementById(
                "quotationPdfPreview"
            );

        if (!container) {

            container =
                document.createElement("div");

            container.id =
                "quotationPdfPreview";

            document.body.appendChild(
                container
            );
        }

        container.innerHTML = html;

        container.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        return container;
    }


    /* =====================================================
       PRINT
       ===================================================== */

    function printQuotationPDF(data) {

        previewQuotationPDF(data);

        setTimeout(() => {
            window.print();
        }, 300);
    }


    /* =====================================================
       OPEN PRINT WINDOW
       ===================================================== */

    function openQuotationPrintWindow(data) {

        const html =
            buildQuotationPDF(data);

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=1000,height=800"
            );

        if (!printWindow) {

            alert(
                "Please allow pop-ups to generate the quotation PDF."
            );

            return;
        }

        printWindow.document.open();

        printWindow.document.write(`
            <!DOCTYPE html>

            <html>

            <head>

                <meta charset="UTF-8">

                <title>
                    Quotation -
                    ${escapeHTML(
                        safe(
                            data.quotationNumber,
                            "Quotation"
                        )
                    )}
                </title>

                <link
                    rel="stylesheet"
                    href="modules/quotations/quotations-pdf.css"
                >

            </head>

            <body>

                ${html}

                <script>
                    window.onload = function () {
                        setTimeout(function () {
                            window.print();
                        }, 500);
                    };
                <\/script>

            </body>

            </html>
        `);

        printWindow.document.close();
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.QuotationPDF = {

        build:
            buildQuotationPDF,

        preview:
            previewQuotationPDF,

        print:
            printQuotationPDF,

        openPrint:
            openQuotationPrintWindow,

        formatCurrency:
            formatCurrency,

        formatDate:
            formatDate
    };


    /* =====================================================
       OPTIONAL GLOBAL FUNCTIONS
       Useful for HTML onclick=""
       ===================================================== */

    window.previewQuotationPDF =
        previewQuotationPDF;

    window.printQuotationPDF =
        printQuotationPDF;

    window.openQuotationPrintWindow =
        openQuotationPrintWindow;


})();
