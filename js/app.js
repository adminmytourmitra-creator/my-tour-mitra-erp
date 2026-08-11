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
import { initQuotations } from "./modules/quotations.js";
import { initBookings } from "./modules/bookings.js";
import { initInvoices } from "./modules/invoices.js";
import { initVouchers } from "./modules/vouchers.js";
import { initPayments } from "./modules/payments.js";
import { initExpenses } from "./modules/expenses.js";
import { initProfit } from "./modules/profit.js";
import { initTeam } from "./modules/team.js";
import { initSettings } from "./modules/settings.js";


// ================= APPLICATION START =================

document.addEventListener("DOMContentLoaded", () => {

  // Authentication
  initAuth();

  // UI navigation
  initUI();

  // Modules
  initDashboard();
  initCustomers();
  initEnquiries();
  initFollowups();
  initPackages();
  initHotels();
  initCabs();
  initAgencies();
  initQuotations();
  initBookings();
  initInvoices();
  initVouchers();
  initPayments();
  initExpenses();
  initProfit();
  initTeam();
  initSettings();

  console.log(
    "My Tour Mitra ERP initialized successfully."
  );

});
