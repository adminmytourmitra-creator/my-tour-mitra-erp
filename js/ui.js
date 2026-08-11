// ================= UI MODULE =================


// ================= PAGE TITLES =================

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


// ================= INITIALIZE UI =================

export function initUI() {

  setupPageNavigation();

  showPage("dashboard");

}


// ================= PAGE NAVIGATION =================

function setupPageNavigation() {

  const menuItems =
    document.querySelectorAll(
      ".menu-item[data-page]"
    );


  menuItems.forEach(
    (item) => {

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


// ================= SHOW PAGE =================

export function showPage(page) {

  if (!page) return;


  // ================= HIDE ALL MODULES =================

  document
    .querySelectorAll(".module")
    .forEach(
      (module) => {

        module.style.display =
          "none";

      }
    );


  // ================= SHOW SELECTED MODULE =================

  const selectedPage =
    document.getElementById(
      page + "Page"
    );


  if (selectedPage) {

    selectedPage.style.display =
      "block";

  }


  // ================= ACTIVE MENU =================

  document
    .querySelectorAll(
      ".menu-item[data-page]"
    )
    .forEach(
      (item) => {

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


  // ================= PAGE TITLE =================

  const pageTitle =
    document.getElementById(
      "pageTitle"
    );


  if (pageTitle) {

    pageTitle.textContent =
      pageTitles[page] ||
      "Dashboard";

  }

}
