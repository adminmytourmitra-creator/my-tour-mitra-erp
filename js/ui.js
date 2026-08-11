// ======================================================
// MY TOUR MITRA ERP
// UI HELPERS & PAGE NAVIGATION
// ======================================================


// ======================================================
// PAGE NAVIGATION
// ======================================================

export function showPage(page) {

  // Hide all modules
  document
    .querySelectorAll(".module")
    .forEach((module) => {

      module.style.display = "none";

    });


  // Show selected module
  const selectedPage =
    document.getElementById(
      page + "Page"
    );

  if (selectedPage) {

    selectedPage.style.display =
      "block";

  }


  // Update active menu
  document
    .querySelectorAll(
      ".menu-item[data-page]"
    )
    .forEach((item) => {

      item.classList.remove("active");

      if (
        item.dataset.page === page
      ) {

        item.classList.add("active");

      }

    });


  // Page titles
  const titles = {

    dashboard:
      "Dashboard",

    customers:
      "Customers",

    enquiries:
      "Enquiries",

    followups:
      "Follow-ups",

    packages:
      "Packages",

    hotels:
      "Hotels",

    cabs:
      "Cabs",

    agencies:
      "B2B Agencies",

    quotations:
      "Quotations",

    bookings:
      "Bookings",

    invoices:
      "Invoices",

    vouchers:
      "Vouchers",

    payments:
      "Payments",

    expenses:
      "Expenses",

    profit:
      "Profit & Loss",

    team:
      "Team / Users",

    settings:
      "Settings"

  };


  const pageTitle =
    document.getElementById(
      "pageTitle"
    );


  if (pageTitle) {

    pageTitle.textContent =
      titles[page] ||
      "Dashboard";

  }

}


// ======================================================
// HTML ESCAPE
// ======================================================

export function escapeHtml(value) {

  return String(value ?? "")

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
// MODAL OPEN
// ======================================================

export function openModal(modal) {

  if (!modal) {
    return;
  }

  modal.style.display =
    "flex";

}


// ======================================================
// MODAL CLOSE
// ======================================================

export function closeModal(modal) {

  if (!modal) {
    return;
  }

  modal.style.display =
    "none";

}


// ======================================================
// FORM MESSAGE
// ======================================================

export function setFormMessage(
  element,
  text,
  type = "info"
) {

  if (!element) {
    return;
  }


  const colors = {

    info:
      "#1769e0",

    success:
      "#15803d",

    error:
      "#dc2626"

  };


  element.style.color =
    colors[type] ||
    colors.info;

  element.textContent =
    text || "";

}


// ======================================================
// CONFIRMATION
// ======================================================

export function confirmAction(
  message
) {

  return window.confirm(
    message
  );

}
