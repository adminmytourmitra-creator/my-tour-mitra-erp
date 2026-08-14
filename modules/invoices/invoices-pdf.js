/* =========================================================
   MY TOUR MITRA ERP
   INVOICE PDF MODULE
   File:
   modules/invoices/invoices-pdf.js

   Purpose:
   - Generate customer invoice PDF
   - A4 print layout
   - Customer details
   - Package / booking details
   - Invoice items
   - GST / tax
   - Payment received
   - Balance due
   - Company / bank details
   - Browser print
   - PDF download through browser print dialog
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       CONFIGURATION
       ===================================================== */

    const CONFIG = {

        company: {
            name: "My Tour Mitra",

            tagline:
                "Travel • Explore • Experience",

            address:
                "",

            phone:
                "",

            email:
                "",

            website:
                "mytourmitra.com",

            gst:
                "",

            pan:
                "",

            logo:
                "",

            signature:
                "",

            authorisedPerson:
                "",

            designation:
                "Authorised Signatory"
        },

        bank: {
            name:
                "",

            accountName:
                "",

            accountNumber:
                "",

            ifsc:
                "",

            branch:
                "",

            upi:
                ""
        },

        terms: [
            "This invoice is issued against the services mentioned above.",
            "Any outstanding amount should be paid within the agreed payment terms.",
            "Cancellation and refund will be governed by the applicable booking terms and conditions.",
            "Please retain this invoice for your records."
        ]
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


    function number(value) {

        const n =
            Number(value);

        return Number.isFinite(n)
            ? n
            : 0;
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
        ).format(
            number(value)
        );
    }


    function formatDate(value) {

        if (!value) {
            return "-";
        }

        let date;

        if (
            value &&
            typeof value.toDate ===
                "function"
        ) {
            date =
                value.toDate();
        } else {
            date =
                new Date(value);
        }

        if (
            isNaN(
                date.getTime()
            )
        ) {
            return escapeHTML(
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


    function getStatusLabel(
        status
    ) {

        const labels = {

            draft:
                "Draft",

            unpaid:
                "Unpaid",

            partial:
                "Partially Paid",

            paid:
                "Paid",

            overdue:
                "Overdue",

            cancelled:
                "Cancelled"
        };

        return (
            labels[status] ||
            status ||
            "Draft"
        );
    }


    function getStatusClass(
        status
    ) {

        switch (status) {

            case "paid":
                return "invoice-pdf-status-paid";

            case "partial":
                return "invoice-pdf-status-partial";

            case "unpaid":
                return "invoice-pdf-status-unpaid";

            case "overdue":
                return "invoice-pdf-status-overdue";

            case "cancelled":
                return "invoice-pdf-status-cancelled";

            default:
                return "invoice-pdf-status-draft";
        }
    }


    /* =====================================================
       GET SETTINGS
       ===================================================== */

    function getCompanySettings() {

        /*
         * Settings module can later expose:
         *
         * window.ERPSettings
         *
         * We keep fallback values here so the PDF
         * works even before Settings integration.
         */

        const settings =
            window.ERPSettings ||
            window.CompanySettings ||
            {};

        return {

            ...CONFIG.company,

            ...(settings.company ||
                settings.business ||
                {})
        };
    }


    function getBankSettings() {

        const settings =
            window.ERPSettings ||
            window.CompanySettings ||
            {};

        return {

            ...CONFIG.bank,

            ...(settings.bank ||
                settings.bankDetails ||
                {})
        };
    }


    function getTerms() {

        const settings =
            window.ERPSettings ||
            window.CompanySettings ||
            {};

        if (
            Array.isArray(
                settings.invoiceTerms
            )
        ) {
            return settings.invoiceTerms;
        }

        return CONFIG.terms;
    }


    /* =====================================================
       CALCULATE TOTALS
       ===================================================== */

    function calculateTotals(
        invoice
    ) {

        const items =
            Array.isArray(
                invoice.items
            )
                ? invoice.items
                : [];

        let subtotal =
            number(
                invoice.subtotal
            );

        let tax =
            number(
                invoice.tax
            );

        /*
         * If stored totals are missing,
         * calculate them from items.
         */

        if (
            subtotal === 0 &&
            items.length
        ) {

            subtotal = 0;
            tax = 0;

            items.forEach(
                item => {

                    const qty =
                        number(
                            item.qty
                        );

                    const rate =
                        number(
                            item.rate
                        );

                    const base =
                        number(
                            item.baseAmount
                        ) ||
                        qty * rate;

                    const taxRate =
                        number(
                            item.taxRate
                        );

                    const itemTax =
                        number(
                            item.taxAmount
                        ) ||
                        (
                            base *
                            taxRate /
                            100
                        );

                    subtotal +=
                        base;

                    tax +=
                        itemTax;
                }
            );
        }

        const discount =
            number(
                invoice.discount
            );

        const grandTotal =
            number(
                invoice.grandTotal
            ) ||
            Math.max(
                0,
                subtotal +
                tax -
                discount
            );

        const received =
            number(
                invoice.amountReceived
            );

        const balance =
            Math.max(
                0,
                number(
                    invoice.balanceDue
                ) ||
                grandTotal -
                received
            );

        return {
            subtotal,
            tax,
            discount,
            grandTotal,
            received,
            balance
        };
    }


    /* =====================================================
       GENERATE ITEMS HTML
       ===================================================== */

    function generateItemsHTML(
        invoice
    ) {

        const items =
            Array.isArray(
                invoice.items
            )
                ? invoice.items
                : [];

        if (!items.length) {

            return `
                <tr>
                    <td
                        colspan="6"
                        style="text-align:center;"
                    >
                        No invoice items
                    </td>
                </tr>
            `;
        }


        return items.map(
            item => {

                const qty =
                    number(
                        item.qty
                    );

                const rate =
                    number(
                        item.rate
                    );

                const taxRate =
                    number(
                        item.taxRate
                    );

                const baseAmount =
                    number(
                        item.baseAmount
                    ) ||
                    qty * rate;

                const taxAmount =
                    number(
                        item.taxAmount
                    ) ||
                    (
                        baseAmount *
                        taxRate /
                        100
                    );

                const amount =
                    number(
                        item.amount
                    ) ||
                    baseAmount +
                    taxAmount;

                return `
                    <tr>

                        <td class="col-description">
                            ${escapeHTML(
                                item.description ||
                                "-"
                            )}
                        </td>

                        <td class="col-hsn">
                            ${escapeHTML(
                                item.hsn ||
                                "-"
                            )}
                        </td>

                        <td class="col-qty">
                            ${qty}
                        </td>

                        <td class="col-rate">
                            ${money(rate)}
                        </td>

                        <td class="col-tax">
                            ${
                                taxRate
                                    ? `${taxRate}%`
                                    : "-"
                            }
                        </td>

                        <td class="col-amount">
                            ${money(amount)}
                        </td>

                    </tr>
                `;
            }
        ).join("");
    }


    /* =====================================================
       PAYMENT HISTORY HTML
       ===================================================== */

    function generatePaymentHistoryHTML(
        invoice
    ) {

        const history =
            Array.isArray(
                invoice.paymentHistory
            )
                ? invoice.paymentHistory
                : [];

        if (!history.length) {
            return "";
        }


        return `

            <div class="invoice-pdf-payment-box">

                <h3 class="invoice-pdf-payment-title">
                    Payment History
                </h3>

                <table
                    class="invoice-pdf-items"
                    style="margin-bottom:0;"
                >

                    <thead>

                        <tr>

                            <th>
                                Date
                            </th>

                            <th>
                                Payment Method
                            </th>

                            <th>
                                Reference
                            </th>

                            <th
                                style="text-align:right;"
                            >
                                Amount
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${history.map(
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

                                    <td
                                        style="text-align:right;"
                                    >
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
        `;
    }


    /* =====================================================
       BUILD PDF HTML
       ===================================================== */

    function buildInvoiceHTML(
        invoice
    ) {

        if (!invoice) {
            throw new Error(
                "Invoice data is missing."
            );
        }


        const company =
            getCompanySettings();

        const bank =
            getBankSettings();

        const terms =
            getTerms();

        const totals =
            calculateTotals(
                invoice
            );

        const status =
            invoice.status ||
            "draft";


        const logoHTML =
            company.logo
                ? `
                    <img
                        src="${escapeHTML(
                            company.logo
                        )}"
                        class="invoice-pdf-logo"
                        alt="Company Logo"
                    >
                  `
                : "";


        const signatureHTML =
            company.signature
                ? `
                    <img
                        src="${escapeHTML(
                            company.signature
                        )}"
                        class="invoice-pdf-signature-image"
                        alt="Authorised Signature"
                    >
                  `
                : "";


        const bankDetailsAvailable =
            bank.name ||
            bank.accountName ||
            bank.accountNumber ||
            bank.ifsc ||
            bank.branch ||
            bank.upi;


        return `

            <div class="invoice-pdf">

                <div class="invoice-pdf-page">


                    <!-- =================================
                         HEADER
                         ================================= -->

                    <div class="invoice-pdf-header">

                        <div class="invoice-pdf-company">

                            ${logoHTML}

                            <h1
                                class="invoice-pdf-company-name"
                            >
                                ${escapeHTML(
                                    company.name
                                )}
                            </h1>

                            ${
                                company.tagline
                                    ? `
                                        <p
                                            class="invoice-pdf-company-tagline"
                                        >
                                            ${escapeHTML(
                                                company.tagline
                                            )}
                                        </p>
                                      `
                                    : ""
                            }

                            <div
                                class="invoice-pdf-company-details"
                            >

                                ${
                                    company.address
                                        ? `
                                            <p>
                                                ${escapeHTML(
                                                    company.address
                                                )}
                                            </p>
                                          `
                                        : ""
                                }

                                ${
                                    company.phone
                                        ? `
                                            <p>
                                                Phone:
                                                ${escapeHTML(
                                                    company.phone
                                                )}
                                            </p>
                                          `
                                        : ""
                                }

                                ${
                                    company.email
                                        ? `
                                            <p>
                                                Email:
                                                ${escapeHTML(
                                                    company.email
                                                )}
                                            </p>
                                          `
                                        : ""
                                }

                                ${
                                    company.website
                                        ? `
                                            <p>
                                                Website:
                                                ${escapeHTML(
                                                    company.website
                                                )}
                                            </p>
                                          `
                                        : ""
                                }

                                ${
                                    company.gst
                                        ? `
                                            <p>
                                                GSTIN:
                                                ${escapeHTML(
                                                    company.gst
                                                )}
                                            </p>
                                          `
                                        : ""
                                }

                                ${
                                    company.pan
                                        ? `
                                            <p>
                                                PAN:
                                                ${escapeHTML(
                                                    company.pan
                                                )}
                                            </p>
                                          `
                                        : ""
                                }

                            </div>

                        </div>


                        <div
                            class="invoice-pdf-title-box"
                        >

                            <h2
                                class="invoice-pdf-title"
                            >
                                INVOICE
                            </h2>

                            <div
                                class="invoice-pdf-number"
                            >
                                Invoice No:
                                ${escapeHTML(
                                    invoice.invoiceNumber ||
                                    "-"
                                )}
                            </div>

                            <div
                                class="invoice-pdf-date"
                            >
                                Invoice Date:
                                ${formatDate(
                                    invoice.invoiceDate
                                )}
                            </div>

                            ${
                                invoice.dueDate
                                    ? `
                                        <div
                                            class="invoice-pdf-date"
                                        >
                                            Due Date:
                                            ${formatDate(
                                                invoice.dueDate
                                            )}
                                        </div>
                                      `
                                    : ""
                            }

                            <div
                                class="invoice-pdf-status
                                ${getStatusClass(
                                    status
                                )}"
                            >
                                ${escapeHTML(
                                    getStatusLabel(
                                        status
                                    )
                                )}
                            </div>

                        </div>

                    </div>


                    <!-- =================================
                         CUSTOMER / TRIP DETAILS
                         ================================= -->

                    <div
                        class="invoice-pdf-info-grid"
                    >


                        <div
                            class="invoice-pdf-info-box"
                        >

                            <h3
                                class="invoice-pdf-info-title"
                            >
                                Bill To
                            </h3>

                            <p>

                                <span
                                    class="invoice-pdf-info-label"
                                >
                                    Name:
                                </span>

                                <span
                                    class="invoice-pdf-info-value"
                                >
                                    ${escapeHTML(
                                        invoice.customerName ||
                                        "-"
                                    )}
                                </span>

                            </p>


                            ${
                                invoice.customerMobile
                                    ? `
                                        <p>

                                            <span
                                                class="invoice-pdf-info-label"
                                            >
                                                Mobile:
                                            </span>

                                            <span
                                                class="invoice-pdf-info-value"
                                            >
                                                ${escapeHTML(
                                                    invoice.customerMobile
                                                )}
                                            </span>

                                        </p>
                                      `
                                    : ""
                            }


                            ${
                                invoice.customerEmail
                                    ? `
                                        <p>

                                            <span
                                                class="invoice-pdf-info-label"
                                            >
                                                Email:
                                            </span>

                                            <span
                                                class="invoice-pdf-info-value"
                                            >
                                                ${escapeHTML(
                                                    invoice.customerEmail
                                                )}
                                            </span>

                                        </p>
                                      `
                                    : ""
                            }


                            ${
                                invoice.customerGST
                                    ? `
                                        <p>

                                            <span
                                                class="invoice-pdf-info-label"
                                            >
                                                GSTIN:
                                            </span>

                                            <span
                                                class="invoice-pdf-info-value"
                                            >
                                                ${escapeHTML(
                                                    invoice.customerGST
                                                )}
                                            </span>

                                        </p>
                                      `
                                    : ""
                            }


                            ${
                                invoice.customerAddress
                                    ? `
                                        <p>

                                            <span
                                                class="invoice-pdf-info-label"
                                            >
                                                Address:
                                            </span>

                                            <span
                                                class="invoice-pdf-info-value"
                                            >
                                                ${escapeHTML(
                                                    invoice.customerAddress
                                                )}
                                            </span>

                                        </p>
                                      `
                                    : ""
                            }

                        </div>


                        <div
                            class="invoice-pdf-info-box"
                        >

                            <h3
                                class="invoice-pdf-info-title"
                            >
                                Trip / Booking Details
                            </h3>


                            ${
                                invoice.bookingId
                                    ? `
                                        <p>

                                            <span
                                                class="invoice-pdf-info-label"
                                            >
                                                Booking:
                                            </span>

                                            <span
                                                class="invoice-pdf-info-value"
                                            >
                                                ${escapeHTML(
                                                    invoice.bookingId
                                                )}
                                            </span>

                                        </p>
                                      `
                                    : ""
                            }


                            ${
                                invoice.destination
                                    ? `
                                        <p>

                                            <span
                                                class="invoice-pdf-info-label"
                                            >
                                                Destination:
                                            </span>

                                            <span
                                                class="invoice-pdf-info-value"
                                            >
                                                ${escapeHTML(
                                                    invoice.destination
                                                )}
                                            </span>

                                        </p>
                                      `
                                    : ""
                            }


                            ${
                                invoice.pax
                                    ? `
                                        <p>

                                            <span
                                                class="invoice-pdf-info-label"
                                            >
                                                Guests:
                                            </span>

                                            <span
                                                class="invoice-pdf-info-value"
                                            >
                                                ${number(
                                                    invoice.pax
                                                )}
                                            </span>

                                        </p>
                                      `
                                    : ""
                            }


                            ${
                                invoice.packageName
                                    ? `
                                        <p>

                                            <span
                                                class="invoice-pdf-info-label"
                                            >
                                                Package:
                                            </span>

                                            <span
                                                class="invoice-pdf-info-value"
                                            >
                                                ${escapeHTML(
                                                    invoice.packageName
                                                )}
                                            </span>

                                        </p>
                                      `
                                    : ""
                            }


                        </div>

                    </div>


                    <!-- =================================
                         ITEMS
                         ================================= -->

                    <table
                        class="invoice-pdf-items"
                    >

                        <thead>

                            <tr>

                                <th
                                    class="col-description"
                                >
                                    Description
                                </th>

                                <th
                                    class="col-hsn"
                                >
                                    HSN/SAC
                                </th>

                                <th
                                    class="col-qty"
                                >
                                    Qty
                                </th>

                                <th
                                    class="col-rate"
                                >
                                    Rate
                                </th>

                                <th
                                    class="col-tax"
                                >
                                    Tax
                                </th>

                                <th
                                    class="col-amount"
                                >
                                    Amount
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${generateItemsHTML(
                                invoice
                            )}

                        </tbody>

                    </table>


                    <!-- =================================
                         TOTALS
                         ================================= -->

                    <div
                        class="invoice-pdf-summary-wrapper"
                    >

                        <table
                            class="invoice-pdf-summary"
                        >

                            <tbody>

                                <tr>

                                    <td>
                                        Subtotal
                                    </td>

                                    <td>
                                        ${money(
                                            totals.subtotal
                                        )}
                                    </td>

                                </tr>


                                ${
                                    totals.discount > 0
                                        ? `
                                            <tr
                                                class="discount-row"
                                            >

                                                <td>
                                                    Discount
                                                </td>

                                                <td>
                                                    - ${money(
                                                        totals.discount
                                                    )}
                                                </td>

                                            </tr>
                                          `
                                        : ""
                                }


                                <tr>

                                    <td>
                                        Tax
                                    </td>

                                    <td>
                                        ${money(
                                            totals.tax
                                        )}
                                    </td>

                                </tr>


                                <tr
                                    class="grand-total-row"
                                >

                                    <td>
                                        Grand Total
                                    </td>

                                    <td>
                                        ${money(
                                            totals.grandTotal
                                        )}
                                    </td>

                                </tr>


                                <tr
                                    class="received-row"
                                >

                                    <td>
                                        Amount Received
                                    </td>

                                    <td>
                                        ${money(
                                            totals.received
                                        )}
                                    </td>

                                </tr>


                                <tr
                                    class="balance-row"
                                >

                                    <td>
                                        Balance Due
                                    </td>

                                    <td>
                                        ${money(
                                            totals.balance
                                        )}
                                    </td>

                                </tr>

                            </tbody>

                        </table>

                    </div>


                    <!-- =================================
                         PAYMENT DETAILS
                         ================================= -->

                    ${
                        invoice.amountReceived > 0
                            ? `
                                <div
                                    class="invoice-pdf-payment-box"
                                >

                                    <h3
                                        class="invoice-pdf-payment-title"
                                    >
                                        Latest Payment
                                    </h3>

                                    <div
                                        class="invoice-pdf-payment-grid"
                                    >

                                        <div
                                            class="invoice-pdf-payment-item"
                                        >

                                            <span
                                                class="invoice-pdf-payment-label"
                                            >
                                                Payment Date
                                            </span>

                                            <span
                                                class="invoice-pdf-payment-value"
                                            >
                                                ${formatDate(
                                                    invoice.paymentDate
                                                )}
                                            </span>

                                        </div>


                                        <div
                                            class="invoice-pdf-payment-item"
                                        >

                                            <span
                                                class="invoice-pdf-payment-label"
                                            >
                                                Payment Method
                                            </span>

                                            <span
                                                class="invoice-pdf-payment-value"
                                            >
                                                ${escapeHTML(
                                                    invoice.paymentMethod ||
                                                    "-"
                                                )}
                                            </span>

                                        </div>


                                        <div
                                            class="invoice-pdf-payment-item"
                                        >

                                            <span
                                                class="invoice-pdf-payment-label"
                                            >
                                                Reference
                                            </span>

                                            <span
                                                class="invoice-pdf-payment-value"
                                            >
                                                ${escapeHTML(
                                                    invoice.paymentReference ||
                                                    "-"
                                                )}
                                            </span>

                                        </div>

                                    </div>

                                </div>
                              `
                            : ""
                    }


                    <!-- =================================
                         PAYMENT HISTORY
                         ================================= -->

                    ${generatePaymentHistoryHTML(
                        invoice
                    )}


                    <!-- =================================
                         BANK DETAILS
                         ================================= -->

                    ${
                        bankDetailsAvailable
                            ? `

                                <div
                                    class="invoice-pdf-bank-box"
                                >

                                    <h3
                                        class="invoice-pdf-bank-title"
                                    >
                                        Bank / Payment Details
                                    </h3>

                                    <div
                                        class="invoice-pdf-bank-grid"
                                    >

                                        ${
                                            bank.name
                                                ? `
                                                    <p>
                                                        <span
                                                            class="invoice-pdf-bank-label"
                                                        >
                                                            Bank:
                                                        </span>

                                                        ${escapeHTML(
                                                            bank.name
                                                        )}
                                                    </p>
                                                  `
                                                : ""
                                        }


                                        ${
                                            bank.accountName
                                                ? `
                                                    <p>
                                                        <span
                                                            class="invoice-pdf-bank-label"
                                                        >
                                                            Account Name:
                                                        </span>

                                                        ${escapeHTML(
                                                            bank.accountName
                                                        )}
                                                    </p>
                                                  `
                                                : ""
                                        }


                                        ${
                                            bank.accountNumber
                                                ? `
                                                    <p>
                                                        <span
                                                            class="invoice-pdf-bank-label"
                                                        >
                                                            Account No:
                                                        </span>

                                                        ${escapeHTML(
                                                            bank.accountNumber
                                                        )}
                                                    </p>
                                                  `
                                                : ""
                                        }


                                        ${
                                            bank.ifsc
                                                ? `
                                                    <p>
                                                        <span
                                                            class="invoice-pdf-bank-label"
                                                        >
                                                            IFSC:
                                                        </span>

                                                        ${escapeHTML(
                                                            bank.ifsc
                                                        )}
                                                    </p>
                                                  `
                                                : ""
                                        }


                                        ${
                                            bank.branch
                                                ? `
                                                    <p>
                                                        <span
                                                            class="invoice-pdf-bank-label"
                                                        >
                                                            Branch:
                                                        </span>

                                                        ${escapeHTML(
                                                            bank.branch
                                                        )}
                                                    </p>
                                                  `
                                                : ""
                                        }


                                        ${
                                            bank.upi
                                                ? `
                                                    <p>
                                                        <span
                                                            class="invoice-pdf-bank-label"
                                                        >
                                                            UPI:
                                                        </span>

                                                        ${escapeHTML(
                                                            bank.upi
                                                        )}
                                                    </p>
                                                  `
                                                : ""
                                        }

                                    </div>

                                </div>

                              `
                            : ""
                    }


                    <!-- =================================
                         NOTES
                         ================================= -->

                    ${
                        invoice.notes
                            ? `

                                <div
                                    class="invoice-pdf-notes"
                                >

                                    <h3
                                        class="invoice-pdf-section-title"
                                    >
                                        Notes
                                    </h3>

                                    <div
                                        class="invoice-pdf-notes-content"
                                    >
                                        ${escapeHTML(
                                            invoice.notes
                                        )}
                                    </div>

                                </div>

                              `
                            : ""
                    }


                    <!-- =================================
                         TERMS
                         ================================= -->

                    ${
                        terms.length
                            ? `

                                <div
                                    class="invoice-pdf-terms"
                                >

                                    <h3
                                        class="invoice-pdf-section-title"
                                    >
                                        Terms & Conditions
                                    </h3>

                                    <ol>

                                        ${terms.map(
                                            term => `
                                                <li>
                                                    ${escapeHTML(
                                                        term
                                                    )}
                                                </li>
                                            `
                                        ).join("")}

                                    </ol>

                                </div>

                              `
                            : ""
                    }


                    <!-- =================================
                         SIGNATURE
                         ================================= -->

                    <div
                        class="invoice-pdf-signature-section"
                    >

                        <div
                            class="invoice-pdf-signature"
                        >

                            ${signatureHTML}

                            <div
                                class="invoice-pdf-signature-line"
                            >
                                ${
                                    escapeHTML(
                                        company.authorisedPerson ||
                                        "Authorised Signatory"
                                    )
                                }
                            </div>

                            <div
                                class="invoice-pdf-signature-designation"
                            >
                                ${escapeHTML(
                                    company.designation ||
                                    "Authorised Signatory"
                                )}
                            </div>

                        </div>

                    </div>


                    <!-- =================================
                         FOOTER
                         ================================= -->

                    <div
                        class="invoice-pdf-footer"
                    >

                        <p
                            class="thank-you"
                        >
                            Thank you for choosing
                            ${escapeHTML(
                                company.name
                            )}
                        </p>

                        <p>
                            This is a computer-generated invoice.
                            No signature is required unless otherwise specified.
                        </p>

                    </div>


                    <div
                        class="invoice-pdf-page-number"
                    >
                        Page 1
                    </div>


                </div>

            </div>

        `;
    }


    /* =====================================================
       CREATE PRINT WINDOW
       ===================================================== */

    function createPrintWindow(
        invoice
    ) {

        const html =
            buildInvoiceHTML(
                invoice
            );

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=1000,height=800"
            );

        if (!printWindow) {

            alert(
                "Please allow pop-ups to generate the invoice PDF."
            );

            return null;
        }


        const cssFiles = [

            "CSS/global.css",
            "CSS/app.css",
            "modules/invoices/invoice-pdf.css"

        ];


        const cssLinks =
            cssFiles.map(
                file =>
                    `<link rel="stylesheet" href="${file}">`
            ).join("");


        printWindow.document.open();

        printWindow.document.write(`

            <!DOCTYPE html>

            <html>

                <head>

                    <meta
                        charset="UTF-8"
                    >

                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1.0"
                    >

                    <title>
                        ${escapeHTML(
                            invoice.invoiceNumber ||
                            "Invoice"
                        )}
                    </title>

                    ${cssLinks}

                    <style>

                        html,
                        body {
                            margin: 0;
                            padding: 0;
                            background: #ffffff;
                        }

                        body {
                            font-family:
                                Arial,
                                Helvetica,
                                sans-serif;
                        }

                    </style>

                </head>

                <body>

                    ${html}

                </body>

            </html>

        `);

        printWindow.document.close();


        /*
         * Wait for CSS/images before printing.
         */

        setTimeout(
            () => {

                printWindow.focus();

                printWindow.print();

            },
            700
        );


        return printWindow;
    }


    /* =====================================================
       PRINT INVOICE
       ===================================================== */

    function printInvoice(
        invoice
    ) {

        if (!invoice) {

            console.error(
                "Invoice PDF: Invoice data missing."
            );

            return;
        }

        createPrintWindow(
            invoice
        );
    }


    /* =====================================================
       DOWNLOAD PDF
       ===================================================== */

    function downloadInvoicePDF(
        invoice
    ) {

        /*
         * Browser's native Print dialog can be used
         * to select "Save as PDF".
         *
         * This keeps the ERP free from paid PDF services.
         */

        printInvoice(
            invoice
        );
    }


    /* =====================================================
       GET CURRENT INVOICE
       ===================================================== */

    function getCurrentInvoice() {

        if (
            window.InvoicesModule &&
            window.InvoicesModule.currentInvoice
        ) {
            return window.InvoicesModule.currentInvoice;
        }

        return null;
    }


    /* =====================================================
       PRINT BY ID
       ===================================================== */

    async function printById(
        invoiceId
    ) {

        if (
            !window.InvoicesModule
        ) {

            console.error(
                "InvoicesModule not available."
            );

            return;
        }


        /*
         * InvoicesModule currently keeps invoice
         * data internally. If the public API gets
         * the invoice through view(), the module
         * can be extended later with get().
         */

        if (
            typeof window.InvoicesModule.get ===
                "function"
        ) {

            const invoice =
                await window.InvoicesModule.get(
                    invoiceId
                );

            if (invoice) {
                printInvoice(
                    invoice
                );
            }

            return;
        }


        /*
         * Fallback:
         * Search loaded invoices if exposed.
         */

        if (
            Array.isArray(
                window.invoices
            )
        ) {

            const invoice =
                window.invoices.find(
                    item =>
                        item.id ===
                        invoiceId
                );

            if (invoice) {

                printInvoice(
                    invoice
                );
            }
        }
    }


    /* =====================================================
       PRINT CURRENT INVOICE
       ===================================================== */

    function printCurrentInvoice() {

        const invoice =
            getCurrentInvoice();

        if (!invoice) {

            alert(
                "Please open an invoice first."
            );

            return;
        }

        printInvoice(
            invoice
        );
    }


    /* =====================================================
       INITIALIZE PDF BUTTONS
       ===================================================== */

    function bindPDFEvents() {

        /*
         * These buttons are optional.
         * They will work when present in invoices.html.
         */

        document.addEventListener(
            "click",
            event => {

                const printButton =
                    event.target.closest(
                        "[data-action='print-invoice']"
                    );

                if (printButton) {

                    const invoiceId =
                        printButton.dataset.id;

                    if (
                        invoiceId
                    ) {
                        printById(
                            invoiceId
                        );
                    } else {
                        printCurrentInvoice();
                    }

                    return;
                }


                const downloadButton =
                    event.target.closest(
                        "[data-action='download-invoice-pdf']"
                    );

                if (downloadButton) {

                    const invoiceId =
                        downloadButton.dataset.id;

                    if (
                        invoiceId
                    ) {
                        printById(
                            invoiceId
                        );
                    } else {
                        printCurrentInvoice();
                    }

                    return;
                }

            }
        );
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.InvoicePDF = {

        print:
            printInvoice,

        download:
            downloadInvoicePDF,

        printById:
            printById,

        printCurrent:
            printCurrentInvoice,

        build:
            buildInvoiceHTML,

        calculate:
            calculateTotals,

        config:
            CONFIG
    };


    /* =====================================================
       INITIALIZATION
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            bindPDFEvents,
            {
                once: true
            }
        );

    } else {

        bindPDFEvents();
    }

})();
