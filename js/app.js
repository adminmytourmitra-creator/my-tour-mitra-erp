// ================= APP CONTROLLER =================

import { initAuth } from "./auth.js";
import { initUI } from "./ui.js";

import { initDashboard } from "./modules/dashboard.js";
import { initCustomers } from "./modules/customers.js";
import { initEnquiries } from "./modules/enquiries.js";
import { initFollowups } from "./modules/followups.js";
import { initPackages } from "./modules/packages.js";
import { initHotels } from "./modules/hotels.js";
import { initCabs } from "./modules/cabs.js";
import { initAgencies } from "./modules/agencies.js";
import { initBookings } from "./modules/bookings.js";
import { initInvoices } from "./modules/invoices.js";
import { initVouchers } from "./modules/vouchers.js";
import { initPayments } from "./modules/payments.js";
import { initExpenses } from "./modules/expenses.js";
import { initProfit } from "./modules/profit.js";
import { initTeam } from "./modules/team.js";
import { initSettings } from "./modules/settings.js";


// ================= SAFE INITIALIZER =================

function safeInit(name, initFunction) {

  try {

    initFunction();

    console.log(
      `${name} initialized successfully.`
    );

  } catch (error) {

    console.error(
      `${name} initialization failed:`,
      error
    );

  }

}


// ================= APPLICATION START =================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    console.log(
      "Starting My Tour Mitra ERP..."
    );


    // ================= AUTH =================

    safeInit(
      "Authentication",
      initAuth
    );


    // ================= UI =================

    safeInit(
      "UI",
      initUI
    );


    // ================= MODULES =================

    safeInit(
      "Dashboard",
      initDashboard
    );

    safeInit(
      "Customers",
      initCustomers
    );

    safeInit(
      "Enquiries",
      initEnquiries
    );

    safeInit(
      "Follow-ups",
      initFollowups
    );

    safeInit(
      "Packages",
      initPackages
    );

    safeInit(
      "Hotels",
      initHotels
    );

    safeInit(
      "Cabs",
      initCabs
    );

    safeInit(
      "B2B Agencies",
      initAgencies
    );

    safeInit(
      "Bookings",
      initBookings
    );

    safeInit(
      "Invoices",
      initInvoices
    );

    safeInit(
      "Vouchers",
      initVouchers
    );

    safeInit(
      "Payments",
      initPayments
    );

    safeInit(
      "Expenses",
      initExpenses
    );

    safeInit(
      "Profit & Loss",
      initProfit
    );

    safeInit(
      "Team",
      initTeam
    );

    safeInit(
      "Settings",
      initSettings
    );


    console.log(
      "My Tour Mitra ERP initialized."
    );

  }
);
