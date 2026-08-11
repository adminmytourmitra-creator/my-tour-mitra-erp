// ================= UI MODULE =================


// ================= PAGE NAVIGATION =================

export function initUI() {

  const menuItems = document.querySelectorAll(
    ".menu-item[data-page]"
  );

  menuItems.forEach((item) => {

    item.addEventListener("click", () => {

      const page = item.dataset.page;

      showPage(page);

    });

  });

}


// ================= SHOW PAGE =================

export function showPage(page) {

  document
    .querySelectorAll(".module")
    .forEach((module) => {

      module.style.display = "none";

    });


  const selectedPage = document.getElementById(
    page + "Page"
  );

  if (selectedPage) {

    selectedPage.style.display = "block";

  }


  document
    .querySelectorAll(".menu-item[data-page]")
    .forEach((item) => {

      item.classList.remove("active");

      if (item.dataset.page === page) {

        item.classList.add("active");

      }

    });


  const titles = {

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


  const pageTitle = document.getElementById(
    "pageTitle"
  );

  if (pageTitle) {

    pageTitle.textContent =
      titles[page] || "Dashboard";

  }

}
