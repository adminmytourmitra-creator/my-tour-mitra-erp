/* =========================================================
   MY TOUR MITRA ERP
   VOUCHER PDF MODULE
   File: modules/vouchers/vouchers-pdf.js

   Purpose:
   - Generate printable voucher
   - Use vouchers-pdf.css
   - Hotel / Cab / Tour voucher layouts
   - Print / Save as PDF
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIG
       ===================================================== */

    const CONFIG = {

        companyName:
            "My Tour Mitra",

        website:
            "mytourmitra.com",

        phone:
            "",

        email:
            "",

        address:
            "",

        logo:
            ""

    };


    /* =====================================================
       HELPERS
       ===================================================== */

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


    function getDateValue(value) {

        if (!value) {

            return null;

        }


        if (
            value &&
            typeof value.toDate ===
            "function"
        ) {

            return value.toDate();

        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return null;

        }


        return date;

    }


    function formatDate(value) {

        const date =
            getDateValue(value);


        if (!date) {

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


    function safe(value) {

        return escapeHTML(
            value ||
            "-"
        );

    }


    function statusClass(status) {

        const normalized =
            String(
                status ||
                "Draft"
            )
                .toLowerCase();


        if (
            normalized ===
            "confirmed"
        ) {

            return "voucher-status-confirmed";

        }


        if (
            normalized ===
            "issued"
        ) {

            return "voucher-status-issued";

        }


        if (
            normalized ===
            "cancelled"
        ) {

            return "voucher-status-cancelled";

        }


        return "voucher-status-draft";

    }


    /* =====================================================
       CUSTOMER NAME
       ===================================================== */

    function getCustomerName(voucher) {

        if (
            voucher.customerName
        ) {

            return voucher.customerName;

        }


        if (
            voucher.guestName
        ) {

            return voucher.guestName;

        }


        return "-";

    }


    /* =====================================================
       COMPANY HEADER
       ===================================================== */

    function companyHeader() {

        const logo =
            CONFIG.logo
                ? `

                    <img
                        class="voucher-company-logo"
                        src="${escapeHTML(
                            CONFIG.logo
                        )}"
                        alt="${escapeHTML(
                            CONFIG.companyName
                        )}"
                    >

                  `
                : "";


        return `

            <div class="voucher-pdf-header">

                <div class="voucher-company-info">

                    ${logo}

                    <h1
                        class="voucher-company-name"
                    >
                        ${safe(
                            CONFIG.companyName
                        )}
                    </h1>

                    <div
                        class="voucher-company-details"
                    >

                        ${
                            CONFIG.address
                                ? `${safe(
                                    CONFIG.address
                                )}<br>`
                                : ""
                        }

                        ${
                            CONFIG.phone
                                ? `Phone: ${safe(
                                    CONFIG.phone
                                )}<br>`
                                : ""
                        }

                        ${
                            CONFIG.email
                                ? `Email: ${safe(
                                    CONFIG.email
                                )}<br>`
                                : ""
                        }

                        ${
                            CONFIG.website
                                ? safe(
                                    CONFIG.website
                                )
                                : ""
                        }

                    </div>

                </div>


                <div class="voucher-title-box">

                    <h2
                        class="voucher-title"
                    >
                        ${getVoucherTitle()}
                    </h2>


                    <div
                        class="voucher-number"
                    >
                        Voucher No:
                        ${safe(
                            currentVoucher?.voucherNumber
                        )}
                    </div>


                    <div
                        class="voucher-date"
                    >
                        Date:
                        ${formatDate(
                            currentVoucher?.voucherDate
                        )}
                    </div>


                    <span
                        class="
                            voucher-status
                            ${statusClass(
                                currentVoucher?.status
                            )}
                        "
                    >
                        ${safe(
                            currentVoucher?.status ||
                            "Draft"
                        )}
                    </span>

                </div>

            </div>

        `;

    }


    /* =====================================================
       CURRENT VOUCHER
       ===================================================== */

    let currentVoucher = null;


    /* =====================================================
       VOUCHER TITLE
       ===================================================== */

    function getVoucherTitle() {

        const type =
            currentVoucher?.voucherType;


        if (type === "Hotel") {

            return "Hotel Voucher";

        }


        if (type === "Cab") {

            return "Cab Voucher";

        }


        if (type === "Tour") {

            return "Tour Voucher";

        }


        return "Service Voucher";

    }


    /* =====================================================
       CUSTOMER SECTION
       ===================================================== */

    function customerSection(voucher) {

        return `

            <section
                class="voucher-pdf-section"
            >

                <h3
                    class="voucher-pdf-section-title"
                >
                    Guest / Customer Details
                </h3>


                <div
                    class="voucher-customer-box"
                >

                    <h3
                        class="voucher-customer-name"
                    >
                        ${safe(
                            getCustomerName(
                                voucher
                            )
                        )}
                    </h3>


                    <div
                        class="voucher-customer-contact"
                    >

                        ${
                            voucher.guestMobile
                                ? `Mobile:
                                   ${safe(
                                       voucher.guestMobile
                                   )}`
                                : ""
                        }


                        ${
                            voucher.pax
                                ? ` &nbsp; | &nbsp;
                                   Guests:
                                   ${safe(
                                       voucher.pax
                                   )}`
                                : ""
                        }

                    </div>

                </div>

            </section>

        `;

    }


    /* =====================================================
       GENERAL SERVICE DETAILS
       ===================================================== */

    function serviceSection(voucher) {

        return `

            <section
                class="voucher-pdf-section"
            >

                <h3
                    class="voucher-pdf-section-title"
                >
                    Service Details
                </h3>


                <table
                    class="voucher-service-table"
                >

                    <thead>

                        <tr>

                            <th>
                                Service
                            </th>

                            <th>
                                Supplier
                            </th>

                            <th>
                                Location
                            </th>

                            <th>
                                Confirmation No.
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        <tr>

                            <td>
                                ${safe(
                                    voucher.serviceName
                                )}
                            </td>

                            <td>
                                ${safe(
                                    voucher.supplier
                                )}
                            </td>

                            <td>
                                ${safe(
                                    voucher.location
                                )}
                            </td>

                            <td>
                                ${safe(
                                    voucher.confirmationNo
                                )}
                            </td>

                        </tr>

                    </tbody>

                </table>

            </section>

        `;

    }


    /* =====================================================
       HOTEL SECTION
       ===================================================== */

    function hotelSection(voucher) {

        return `

            <section
                class="voucher-pdf-section"
            >

                <h3
                    class="voucher-pdf-section-title"
                >
                    Hotel Details
                </h3>


                <table
                    class="voucher-hotel-details"
                >

                    <tbody>

                        <tr>

                            <td>

                                <span
                                    class="voucher-hotel-label"
                                >
                                    Hotel
                                </span>

                                <span
                                    class="voucher-hotel-value"
                                >
                                    ${safe(
                                        voucher.serviceName
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="voucher-hotel-label"
                                >
                                    Location
                                </span>

                                <span
                                    class="voucher-hotel-value"
                                >
                                    ${safe(
                                        voucher.location
                                    )}
                                </span>

                            </td>

                        </tr>


                        <tr>

                            <td>

                                <span
                                    class="voucher-hotel-label"
                                >
                                    Check-in
                                </span>

                                <span
                                    class="voucher-hotel-value"
                                >
                                    ${formatDate(
                                        voucher.hotelCheckIn
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="voucher-hotel-label"
                                >
                                    Check-out
                                </span>

                                <span
                                    class="voucher-hotel-value"
                                >
                                    ${formatDate(
                                        voucher.hotelCheckOut
                                    )}
                                </span>

                            </td>

                        </tr>


                        <tr>

                            <td>

                                <span
                                    class="voucher-hotel-label"
                                >
                                    Nights
                                </span>

                                <span
                                    class="voucher-hotel-value"
                                >
                                    ${safe(
                                        voucher.hotelNights
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="voucher-hotel-label"
                                >
                                    Rooms
                                </span>

                                <span
                                    class="voucher-hotel-value"
                                >
                                    ${safe(
                                        voucher.hotelRooms
                                    )}
                                </span>

                            </td>

                        </tr>


                        <tr>

                            <td>

                                <span
                                    class="voucher-hotel-label"
                                >
                                    Room Type
                                </span>

                                <span
                                    class="voucher-hotel-value"
                                >
                                    ${safe(
                                        voucher.hotelRoomType
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="voucher-hotel-label"
                                >
                                    Meal Plan
                                </span>

                                <span
                                    class="voucher-hotel-value"
                                >
                                    ${safe(
                                        voucher.hotelMealPlan
                                    )}
                                </span>

                            </td>

                        </tr>


                        <tr>

                            <td
                                colspan="2"
                            >

                                <span
                                    class="voucher-hotel-label"
                                >
                                    Hotel Address
                                </span>

                                <span
                                    class="voucher-hotel-value"
                                >
                                    ${safe(
                                        voucher.hotelAddress
                                    )}
                                </span>

                            </td>

                        </tr>

                    </tbody>

                </table>

            </section>

        `;

    }


    /* =====================================================
       CAB SECTION
       ===================================================== */

    function cabSection(voucher) {

        return `

            <section
                class="voucher-pdf-section"
            >

                <h3
                    class="voucher-pdf-section-title"
                >
                    Cab / Transport Details
                </h3>


                <table
                    class="voucher-cab-details"
                >

                    <tbody>

                        <tr>

                            <td>

                                <span
                                    class="voucher-hotel-label"
                                >
                                    Pickup Date
                                </span>

                                <span
                                    class="voucher-hotel-value"
                                >
                                    ${formatDate(
                                        voucher.cabPickupDate
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="voucher-hotel-label"
                                >
                                    Pickup Time
                                </span>

                                <span
                                    class="voucher-hotel-value"
                                >
                                    ${safe(
                                        voucher.cabPickupTime
                                    )}
                                </span>

                            </td>

                        </tr>


                        <tr>

                            <td>

                                <span
                                    class="voucher-hotel-label"
                                >
                                    Vehicle
                                </span>

                                <span
                                    class="voucher-hotel-value"
                                >
                                    ${safe(
                                        voucher.cabVehicle
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="voucher-hotel-label"
                                >
                                    Vehicle Number
                                </span>

                                <span
                                    class="voucher-hotel-value"
                                >
                                    ${safe(
                                        voucher.cabVehicleNumber
                                    )}
                                </span>

                            </td>

                        </tr>


                        <tr>

                            <td>

                                <span
                                    class="voucher-hotel-label"
                                >
                                    Driver
                                </span>

                                <span
                                    class="voucher-hotel-value"
                                >
                                    ${safe(
                                        voucher.cabDriverName
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="voucher-hotel-label"
                                >
                                    Driver Mobile
                                </span>

                                <span
                                    class="voucher-hotel-value"
                                >
                                    ${safe(
                                        voucher.cabDriverMobile
                                    )}
                                </span>

                            </td>

                        </tr>

                    </tbody>

                </table>


                <div
                    class="voucher-cab-route"
                >

                    <div
                        class="voucher-cab-route-title"
                    >
                        Pickup → Drop
                    </div>

                    <div
                        class="voucher-cab-route-value"
                    >

                        ${safe(
                            voucher.cabPickupLocation
                        )}

                        &nbsp; → &nbsp;

                        ${safe(
                            voucher.cabDropLocation
                        )}

                    </div>

                </div>

            </section>

        `;

    }


    /* =====================================================
       TOUR SECTION
       ===================================================== */

    function tourSection(voucher) {

        return `

            <section
                class="voucher-pdf-section"
            >

                <h3
                    class="voucher-pdf-section-title"
                >
                    Tour / Activity Details
                </h3>


                <div
                    class="voucher-tour-details"
                >

                    <div
                        class="voucher-info-grid"
                    >

                        <div
                            class="voucher-info-item"
                        >

                            <span
                                class="voucher-info-label"
                            >
                                Start Date
                            </span>

                            <span
                                class="voucher-info-value"
                            >
                                ${formatDate(
                                    voucher.tourStartDate
                                )}
                            </span>

                        </div>


                        <div
                            class="voucher-info-item"
                        >

                            <span
                                class="voucher-info-label"
                            >
                                End Date
                            </span>

                            <span
                                class="voucher-info-value"
                            >
                                ${formatDate(
                                    voucher.tourEndDate
                                )}
                            </span>

                        </div>


                        <div
                            class="voucher-info-item"
                        >

                            <span
                                class="voucher-info-label"
                            >
                                Duration
                            </span>

                            <span
                                class="voucher-info-value"
                            >
                                ${safe(
                                    voucher.tourDuration
                                )}
                            </span>

                        </div>


                        <div
                            class="voucher-info-item"
                        >

                            <span
                                class="voucher-info-label"
                            >
                                Guide / Coordinator
                            </span>

                            <span
                                class="voucher-info-value"
                            >
                                ${safe(
                                    voucher.tourGuide
                                )}
                            </span>

                        </div>

                    </div>


                    <div
                        style="margin-top:10px;"
                    >

                        <span
                            class="voucher-info-label"
                        >
                            Activity / Tour Description
                        </span>

                        <p
                            class="voucher-tour-description"
                        >
                            ${safe(
                                voucher.tourDetails
                            )}
                        </p>

                    </div>

                </div>

            </section>

        `;

    }


    /* =====================================================
       INSTRUCTIONS
       ===================================================== */

    function instructionsSection(
        voucher
    ) {

        if (
            !voucher.instructions
        ) {

            return "";

        }


        return `

            <section
                class="voucher-pdf-section"
            >

                <div
                    class="voucher-instructions"
                >

                    <h4
                        class="voucher-instructions-title"
                    >
                        Special Instructions / Remarks
                    </h4>


                    <p
                        class="voucher-instructions-text"
                    >
                        ${safe(
                            voucher.instructions
                        )}
                    </p>

                </div>

            </section>

        `;

    }


    /* =====================================================
       IMPORTANT NOTE
       ===================================================== */

    function importantNote() {

        return `

            <div
                class="voucher-important-note"
            >

                <strong>
                    Important:
                </strong>

                Please present this voucher at the
                service provider / hotel / transport
                counter. Services are subject to the
                terms and conditions agreed at the time
                of booking.

            </div>

        `;

    }


    /* =====================================================
       SIGNATURE
       ===================================================== */

    function signatureSection() {

        return `

            <div
                class="voucher-signature-area"
            >

                <div
                    class="voucher-signature"
                >

                    <div
                        class="voucher-signature-name"
                    >
                        Authorized Signatory
                    </div>

                    ${safe(
                        CONFIG.companyName
                    )}

                </div>


                <div
                    class="voucher-signature"
                >

                    <div
                        class="voucher-signature-name"
                    >
                        Service Provider
                    </div>

                    Signature / Stamp

                </div>

            </div>

        `;

    }


    /* =====================================================
       FOOTER
       ===================================================== */

    function footerSection() {

        return `

            <footer
                class="voucher-pdf-footer"
            >

                <div
                    class="voucher-footer-company"
                >
                    ${safe(
                        CONFIG.companyName
                    )}
                </div>


                <div>
                    Thank you for choosing us.
                </div>


                ${
                    CONFIG.website
                        ? `<div>
                            ${safe(
                                CONFIG.website
                            )}
                           </div>`
                        : ""
                }


                <div
                    class="voucher-page-number"
                >
                    This is a computer-generated voucher.
                </div>

            </footer>

        `;

    }


    /* =====================================================
       BUILD VOUCHER HTML
       ===================================================== */

    function buildVoucherHTML(
        voucher
    ) {

        currentVoucher =
            voucher;


        let typeContent = "";


        if (
            voucher.voucherType ===
            "Hotel"
        ) {

            typeContent =
                hotelSection(
                    voucher
                );

        } else if (
            voucher.voucherType ===
            "Cab"
        ) {

            typeContent =
                cabSection(
                    voucher
                );

        } else if (
            voucher.voucherType ===
            "Tour"
        ) {

            typeContent =
                tourSection(
                    voucher
                );

        }


        return `

            <!DOCTYPE html>

            <html>

            <head>

                <meta charset="UTF-8">

                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                >

                <title>
                    ${safe(
                        voucher.voucherNumber ||
                        "Voucher"
                    )}
                </title>


                <link
                    rel="stylesheet"
                    href="../../CSS/global.css"
                >

                <link
                    rel="stylesheet"
                    href="../../CSS/vouchers.css"
                >

                <link
                    rel="stylesheet"
                    href="vouchers-pdf.css"
                >

            </head>


            <body>

                <main
                    class="voucher-pdf"
                >

                    ${companyHeader()}


                    ${customerSection(
                        voucher
                    )}


                    ${serviceSection(
                        voucher
                    )}


                    ${typeContent}


                    ${instructionsSection(
                        voucher
                    )}


                    ${importantNote()}


                    ${signatureSection()}


                    ${footerSection()}

                </main>

            </body>

            </html>

        `;

    }


    /* =====================================================
       PRINT WINDOW
       ===================================================== */

    function openPrintWindow(
        voucher
    ) {

        const html =
            buildVoucherHTML(
                voucher
            );


        const printWindow =
            window.open(
                "",
                "_blank",
                "width=1000,height=800"
            );


        if (!printWindow) {

            alert(
                "Please allow pop-ups to generate the voucher."
            );

            return;

        }


        printWindow.document.open();

        printWindow.document.write(
            html
        );

        printWindow.document.close();


        printWindow.onload =
            function () {

                setTimeout(
                    function () {

                        printWindow.focus();

                        printWindow.print();

                    },
                    500
                );

            };

    }


    /* =====================================================
       GENERATE
       ===================================================== */

    function generate(
        voucher
    ) {

        if (!voucher) {

            console.error(
                "Voucher data missing."
            );

            alert(
                "Voucher data is missing."
            );

            return;

        }


        openPrintWindow(
            voucher
        );

    }


    /* =====================================================
       UPDATE CONFIG
       ===================================================== */

    function setCompanyConfig(
        config
    ) {

        if (
            !config ||
            typeof config !==
            "object"
        ) {

            return;

        }


        Object.assign(
            CONFIG,
            config
        );

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.VouchersPDF = {

        generate,

        buildHTML:
            buildVoucherHTML,

        setCompanyConfig

    };


})();
