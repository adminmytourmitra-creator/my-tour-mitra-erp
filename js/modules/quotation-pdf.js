// ======================================================
// QUOTATION PDF MODULE
// My Tour Mitra ERP
// ======================================================

export async function generateQuotationPDF(quotation) {

  if (!quotation) {
    alert("Quotation data not found.");
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF library is not loaded. Please check index.html.");
    return;
  }

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // ====================================================
  // SETTINGS
  // ====================================================

  const settings = getSettings();

  // ====================================================
  // COLORS
  // ====================================================

  const blue = [37, 99, 235];
  const dark = [17, 24, 39];
  const gray = [107, 114, 128];
  const lightGray = [243, 244, 246];

  // ====================================================
  // HELPERS
  // ====================================================

  function money(value) {

    const number = Number(value || 0);

    return "Rs. " + number.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  }

  function safe(value) {

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return "-";
    }

    return String(value);

  }

  function addPageIfNeeded(requiredHeight = 20) {

    const currentY = pdf.lastAutoTable
      ? pdf.lastAutoTable.finalY
      : currentYPosition;

    if (
      currentY + requiredHeight >
      pageHeight - 20
    ) {

      pdf.addPage();

      currentYPosition = 20;

      addPageHeader();

      return 30;

    }

    return currentY;

  }

  let currentYPosition = 20;

  // ====================================================
  // HEADER
  // ====================================================

  function addPageHeader() {

    pdf.setFillColor(
      blue[0],
      blue[1],
      blue[2]
    );

    pdf.rect(
      0,
      0,
      pageWidth,
      7,
      "F"
    );

  }

  addPageHeader();

  // ====================================================
  // LOGO
  // ====================================================

  if (settings.logo) {

    try {

      pdf.addImage(
        settings.logo,
        "AUTO",
        margin,
        12,
        32,
        22
      );

    } catch (error) {

      console.warn(
        "Logo could not be added:",
        error
      );

    }

  }

  // ====================================================
  // COMPANY INFORMATION
  // ====================================================

  const companyX =
    settings.logo
      ? margin + 38
      : margin;

  pdf.setTextColor(
    dark[0],
    dark[1],
    dark[2]
  );

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(18);

  pdf.text(
    safe(
      settings.companyName ||
      "My Tour Mitra"
    ),
    companyX,
    17
  );

  pdf.setFont(
    "helvetica",
    "normal"
  );

  pdf.setFontSize(9);

  let companyY = 23;

  if (settings.address) {

    pdf.text(
      safe(settings.address),
      companyX,
      companyY
    );

    companyY += 5;

  }

  if (settings.phone) {

    pdf.text(
      "Phone: " +
      safe(settings.phone),
      companyX,
      companyY
    );

    companyY += 5;

  }

  if (settings.email) {

    pdf.text(
      "Email: " +
      safe(settings.email),
      companyX,
      companyY
    );

    companyY += 5;

  }

  if (settings.website) {

    pdf.text(
      safe(settings.website),
      companyX,
      companyY
    );

  }

  // ====================================================
  // QUOTATION TITLE
  // ====================================================

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(20);

  pdf.setTextColor(
    blue[0],
    blue[1],
    blue[2]
  );

  pdf.text(
    "QUOTATION",
    pageWidth - margin,
    18,
    {
      align: "right"
    }
  );

  pdf.setFontSize(9);

  pdf.setTextColor(
    dark[0],
    dark[1],
    dark[2]
  );

  pdf.text(
    "Quotation ID: " +
    safe(quotation.quotationId),
    pageWidth - margin,
    24,
    {
      align: "right"
    }
  );

  pdf.text(
    "Date: " +
    new Date().toLocaleDateString("en-IN"),
    pageWidth - margin,
    29,
    {
      align: "right"
    }
  );

  currentYPosition = 43;

  // ====================================================
  // CUSTOMER DETAILS
  // ====================================================

  pdf.setFillColor(
    lightGray[0],
    lightGray[1],
    lightGray[2]
  );

  pdf.roundedRect(
    margin,
    currentYPosition,
    contentWidth,
    28,
    3,
    3,
    "F"
  );

  pdf.setTextColor(
    dark[0],
    dark[1],
    dark[2]
  );

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(11);

  pdf.text(
    "Customer Details",
    margin + 5,
    currentYPosition + 7
  );

  pdf.setFont(
    "helvetica",
    "normal"
  );

  pdf.setFontSize(9);

  pdf.text(
    "Customer: " +
    safe(quotation.customer),
    margin + 5,
    currentYPosition + 14
  );

  pdf.text(
    "Package: " +
    safe(
      quotation.packageName ||
      quotation.package
    ),
    margin + 5,
    currentYPosition + 20
  );

  pdf.text(
    "Destination: " +
    safe(quotation.destination),
    margin + 5,
    currentYPosition + 26
  );

  pdf.text(
    "Travel Date: " +
    safe(
      quotation.startDate
    ) +
    (
      quotation.endDate
        ? " to " + quotation.endDate
        : ""
    ),
    pageWidth / 2 + 5,
    currentYPosition + 14
  );

  const adults =
    Number(quotation.adults || 0);

  const children =
    Number(quotation.children || 0);

  pdf.text(
    "Pax: " +
    (adults + children) +
    " (" +
    adults +
    " Adults, " +
    children +
    " Children)",
    pageWidth / 2 + 5,
    currentYPosition + 20
  );

  pdf.text(
    "Rooms: " +
    safe(quotation.rooms),
    pageWidth / 2 + 5,
    currentYPosition + 26
  );

  currentYPosition += 38;

  // ====================================================
  // HOTEL
  // ====================================================

  if (
    quotation.hotelName ||
    quotation.hotel ||
    quotation.hotelDetails
  ) {

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(12);

    pdf.text(
      "Accommodation",
      margin,
      currentYPosition
    );

    currentYPosition += 7;

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(9);

    pdf.text(
      safe(
        quotation.hotelName ||
        quotation.hotel ||
        quotation.hotelDetails
      ),
      margin,
      currentYPosition
    );

    currentYPosition += 10;

  }

  // ====================================================
  // CAB
  // ====================================================

  if (
    quotation.cabName ||
    quotation.cab ||
    quotation.vehicle
  ) {

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(12);

    pdf.text(
      "Transportation",
      margin,
      currentYPosition
    );

    currentYPosition += 7;

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(9);

    pdf.text(
      safe(
        quotation.cabName ||
        quotation.cab ||
        quotation.vehicle
      ),
      margin,
      currentYPosition
    );

    currentYPosition += 10;

  }

  // ====================================================
  // ITINERARY
  // ====================================================

  const itinerary =
    getItinerary(quotation);

  if (itinerary.length) {

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(14);

    pdf.setTextColor(
      blue[0],
      blue[1],
      blue[2]
    );

    pdf.text(
      "Tour Itinerary",
      margin,
      currentYPosition
    );

    currentYPosition += 8;

    itinerary.forEach(
      (day, index) => {

        if (
          currentYPosition >
          pageHeight - 45
        ) {

          pdf.addPage();

          addPageHeader();

          currentYPosition = 18;

        }

        pdf.setTextColor(
          dark[0],
          dark[1],
          dark[2]
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(11);

        const dayTitle =
          day.title ||
          day.day ||
          `Day ${index + 1}`;

        pdf.text(
          safe(dayTitle),
          margin,
          currentYPosition
        );

        currentYPosition += 6;

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(9);

        const text =
          day.description ||
          day.details ||
          day.activity ||
          day.content ||
          "";

        const lines =
          pdf.splitTextToSize(
            safe(text),
            contentWidth
          );

        lines.forEach(
          line => {

            if (
              currentYPosition >
              pageHeight - 20
            ) {

              pdf.addPage();

              addPageHeader();

              currentYPosition = 18;

            }

            pdf.text(
              line,
              margin,
              currentYPosition
            );

            currentYPosition += 4.5;

          }
        );

        currentYPosition += 5;

      }
    );

  }

  // ====================================================
  // PRICING
  // ====================================================

  if (
    currentYPosition >
    pageHeight - 70
  ) {

    pdf.addPage();

    addPageHeader();

    currentYPosition = 20;

  }

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(14);

  pdf.setTextColor(
    blue[0],
    blue[1],
    blue[2]
  );

  pdf.text(
    "Quotation Summary",
    margin,
    currentYPosition
  );

  currentYPosition += 8;

  const packageCost =
    Number(
      quotation.packageCost ??
      quotation.total ??
      0
    );

  const discount =
    Number(
      quotation.discount ||
      0
    );

  const gst =
    Number(
      quotation.gst ||
      0
    );

  const grandTotal =
    Number(
      quotation.grandTotal ??
      (
        packageCost -
        discount +
        gst
      )
    );

  const perPerson =
    Number(
      quotation.perPerson ||
      0
    );

  pdf.autoTable({

    startY: currentYPosition,

    margin: {
      left: margin,
      right: margin
    },

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 5
    },

    headStyles: {
      fillColor: blue,
      textColor: 255,
      fontStyle: "bold"
    },

    body: [

      [
        "Package Cost",
        money(packageCost)
      ],

      [
        "Discount",
        money(discount)
      ],

      [
        "GST",
        money(gst)
      ],

      [
        "Grand Total",
        money(grandTotal)
      ],

      [
        "Per Person",
        money(perPerson)
      ]

    ]

  });

  currentYPosition =
    pdf.lastAutoTable.finalY + 12;

  // ====================================================
  // PAYMENT DETAILS
  // ====================================================

  if (
    settings.bankName ||
    settings.accountNumber ||
    settings.upiId ||
    settings.qrCode
  ) {

    if (
      currentYPosition >
      pageHeight - 70
    ) {

      pdf.addPage();

      addPageHeader();

      currentYPosition = 20;

    }

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(13);

    pdf.setTextColor(
      blue[0],
      blue[1],
      blue[2]
    );

    pdf.text(
      "Payment Details",
      margin,
      currentYPosition
    );

    currentYPosition += 8;

    pdf.setTextColor(
      dark[0],
      dark[1],
      dark[2]
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(9);

    if (settings.bankName) {

      pdf.text(
        "Bank: " +
        safe(settings.bankName),
        margin,
        currentYPosition
      );

      currentYPosition += 5;

    }

    if (settings.accountName) {

      pdf.text(
        "Account Name: " +
        safe(settings.accountName),
        margin,
        currentYPosition
      );

      currentYPosition += 5;

    }

    if (settings.accountNumber) {

      pdf.text(
        "Account Number: " +
        safe(settings.accountNumber),
        margin,
        currentYPosition
      );

      currentYPosition += 5;

    }

    if (settings.ifsc) {

      pdf.text(
        "IFSC: " +
        safe(settings.ifsc),
        margin,
        currentYPosition
      );

      currentYPosition += 5;

    }

    if (settings.upiId) {

      pdf.text(
        "UPI ID: " +
        safe(settings.upiId),
        margin,
        currentYPosition
      );

      currentYPosition += 6;

    }

    // QR CODE

    if (settings.qrCode) {

      try {

        pdf.addImage(
          settings.qrCode,
          "PNG",
          pageWidth - margin - 40,
          currentYPosition - 30,
          40,
          40
        );

      } catch (error) {

        console.warn(
          "QR code could not be added:",
          error
        );

      }

    }

    currentYPosition += 8;

  }

  // ====================================================
  // TERMS
  // ====================================================

  if (
    quotation.notes ||
    settings.terms
  ) {

    if (
      currentYPosition >
      pageHeight - 55
    ) {

      pdf.addPage();

      addPageHeader();

      currentYPosition = 20;

    }

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(12);

    pdf.setTextColor(
      dark[0],
      dark[1],
      dark[2]
    );

    pdf.text(
      "Important Notes / Terms",
      margin,
      currentYPosition
    );

    currentYPosition += 7;

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(8.5);

    const termsText =
      [
        quotation.notes,
        settings.terms
      ]
        .filter(Boolean)
        .join("\n");

    const termsLines =
      pdf.splitTextToSize(
        termsText,
        contentWidth
      );

    termsLines.forEach(
      line => {

        if (
          currentYPosition >
          pageHeight - 15
        ) {

          pdf.addPage();

          addPageHeader();

          currentYPosition = 18;

        }

        pdf.text(
          line,
          margin,
          currentYPosition
        );

        currentYPosition += 4;

      }
    );

  }

  // ====================================================
  // FOOTER ON EVERY PAGE
  // ====================================================

  const totalPages =
    pdf.internal.getNumberOfPages();

  for (
    let i = 1;
    i <= totalPages;
    i++
  ) {

    pdf.setPage(i);

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(8);

    pdf.setTextColor(
      107,
      114,
      128
    );

    pdf.text(
      safe(
        settings.companyName ||
        "My Tour Mitra"
      ),
      margin,
      pageHeight - 8
    );

    pdf.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      {
        align: "right"
      }
    );

  }

  // ====================================================
  // FILE NAME
  // ====================================================

  const customerName =
    safe(quotation.customer)
      .replace(
        /[^a-z0-9]/gi,
        "_"
      );

  const quotationId =
    safe(
      quotation.quotationId ||
      "quotation"
    );

  const fileName =
    `${quotationId}_${customerName}.pdf`;

  // ====================================================
  // DOWNLOAD
  // ====================================================

  pdf.save(fileName);

}


// ======================================================
// SHARE QUOTATION PDF
// ======================================================

export async function shareQuotationPDF(
  quotation
) {

  if (!quotation) {

    alert(
      "Quotation data not found."
    );

    return;

  }

  if (
    !window.jspdf ||
    !window.jspdf.jsPDF
  ) {

    alert(
      "PDF library is not loaded."
    );

    return;

  }

  /*
    First generate the PDF into a Blob.
    This allows mobile/browser sharing.
  */

  const { jsPDF } =
    window.jspdf;

  /*
    For now we generate the quotation
    through a temporary hidden flow.

    The normal PDF button should be used
    first if Web Share API is unavailable.
  */

  if (
    navigator.share &&
    navigator.canShare
  ) {

    alert(
      "PDF sharing will be available after browser file-sharing support is enabled."
    );

  } else {

    alert(
      "Your browser does not support direct PDF sharing. The PDF will be downloaded instead."
    );

    await generateQuotationPDF(
      quotation
    );

  }

}


// ======================================================
// GET SETTINGS
// ======================================================

function getSettings() {

  /*
    Settings module can store the agency profile
    in localStorage for PDF use.

    If your Settings module already uses another
    storage key, we can connect that later.
  */

  let settings = {};

  try {

    const saved =
      localStorage.getItem(
        "myTourMitraSettings"
      );

    if (saved) {

      settings =
        JSON.parse(saved);

    }

  } catch (error) {

    console.warn(
      "Could not read settings:",
      error
    );

  }

  return settings;

}


// ======================================================
// GET ITINERARY
// ======================================================

function getItinerary(
  quotation
) {

  let itinerary = [];

  /*
    Package Master may store itinerary
    under different field names.

    We support the common ones here.
  */

  const possible =
    quotation.itinerary ||
    quotation.packageItinerary ||
    quotation.itineraryDays ||
    quotation.days ||
    [];

  if (
    Array.isArray(possible)
  ) {

    itinerary = possible;

  }

  return itinerary;

}
