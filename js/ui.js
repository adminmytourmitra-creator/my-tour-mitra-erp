// ======================================================
// MY TOUR MITRA ERP
// UI MODULE
// ======================================================


const pageTitles = {

  dashboard: "Dashboard",
  customers: "Customers",
  enquiries: "Enquiries",
  followups: "Follow-ups",
  packages: "Packages",
  hotels: "Hotels",
  cabs: "Cabs",
  agencies: "B2B Agencies",
  quotations: "Quotations",
  bookings: "Bookings",
  invoices: "Invoices",
  vouchers: "Vouchers",
  payments: "Payments",
  expenses: "Expenses",
  profit: "Profit & Loss",
  team: "Team / Users",
  settings: "Settings"

};


let loadedQuotationModule = false;


// ======================================================
// INITIALIZE
// ======================================================

export function initUI() {

  setupPageNavigation();

  showPage("dashboard");

}


// ======================================================
// NAVIGATION
// ======================================================

function setupPageNavigation() {

  const menuItems =
    document.querySelectorAll(
      ".menu-item[data-page]"
    );


  menuItems.forEach(
    item => {

      item.addEventListener(
        "click",
        () => {

          const page =
            item.dataset.page;

          if (!page) return;

          showPage(page);

        }
      );

    }
  );

}


// ======================================================
// SHOW PAGE
// ======================================================

export async function showPage(
  page
) {

  if (!page) return;


  // ----------------------------------------------------
  // QUOTATIONS
  // ----------------------------------------------------

  if (page === "quotations") {

    await showQuotationPage();

    updateActiveMenu(page);

    updatePageTitle(page);

    return;

  }


  // ----------------------------------------------------
  // NORMAL MODULES
  // ----------------------------------------------------

  document
    .querySelectorAll(".module")
    .forEach(
      module => {

        module.style.display =
          "none";

      }
    );


  const selectedPage =
    document.getElementById(
      page + "Page"
    );


  if (selectedPage) {

    selectedPage.style.display =
      "block";

  }


  updateActiveMenu(page);

  updatePageTitle(page);

}


// ======================================================
// LOAD QUOTATION HTML
// ======================================================

async function showQuotationPage() {

  const contentArea =
    document.querySelector(
      ".content-area"
    );


  if (!contentArea) {

    console.error(
      "content-area not found."
    );

    return;

  }


  if (
    loadedQuotationModule &&
    document.getElementById(
      "quotationsPage"
    )
  ) {

    hideOtherModules();

    document
      .getElementById(
        "quotationsPage"
      )
      .style.display =
      "block";

    return;

  }


  try {

    const response =
      await fetch(
        "./quotations.html"
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const html =
      await response.text();


    const parser =
      new DOMParser();


    const documentObject =
      parser.parseFromString(
        html,
        "text/html"
      );


    const quotationPage =
      documentObject.getElementById(
        "quotationsPage"
      );


    if (!quotationPage) {

      throw new Error(
        "quotationsPage not found in quotations.html"
      );

    }


    hideOtherModules();


    contentArea.appendChild(
      quotationPage
    );


    quotationPage.style.display =
      "block";


    loadedQuotationModule =
      true;


    // --------------------------------------------------
    // Initialize quotation module
    // --------------------------------------------------

    const module =
      await import(
        "./modules/quotations.js"
      );


    module.initQuotations();


  } catch (error) {

    console.error(
      "Quotation page loading failed:",
      error
    );


    contentArea.innerHTML = `

      <div class="module-card">

        <h2>
          Quotations
        </h2>

        <p style="color:#dc2626;">
          Unable to load Quotations module.
        </p>

        <p>
          ${error.message}
        </p>

      </div>

    `;

  }

}


// ======================================================
// HIDE MODULES
// ======================================================

function hideOtherModules() {

  document
    .querySelectorAll(
      ".module"
    )
    .forEach(
      module => {

        module.style.display =
          "none";

      }
    );

}


// ======================================================
// ACTIVE MENU
// ======================================================

function updateActiveMenu(
  page
) {

  document
    .querySelectorAll(
      ".menu-item[data-page]"
    )
    .forEach(
      item => {

        item.classList.remove(
          "active"
        );


        if (
          item.dataset.page ===
          page
        ) {

          item.classList.add(
            "active"
          );

        }

      }
    );

}


// ======================================================
// PAGE TITLE
// ======================================================

function updatePageTitle(
  page
) {

  const title =
    document.getElementById(
      "pageTitle"
    );


  if (title) {

    title.textContent =
      pageTitles[page] ||
      "Dashboard";

  }

}
