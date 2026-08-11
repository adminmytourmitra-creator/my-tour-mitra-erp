// ======================================================
// DASHBOARD MODULE
// ======================================================

export function initDashboard() {
  console.log("Dashboard module initialized");
}


// ======================================================
// UPDATE DASHBOARD COUNTERS
// ======================================================

export function updateDashboardCounters({
  customers = 0,
  enquiries = 0,
  bookings = 0,
  revenue = 0
} = {}) {

  const customerCount =
    document.getElementById("totalCustomers");

  if (customerCount) {
    customerCount.textContent = customers;
  }


  const enquiryCount =
    document.getElementById("activeEnquiries");

  if (enquiryCount) {
    enquiryCount.textContent = enquiries;
  }


  const bookingCount =
    document.getElementById("totalBookings");

  if (bookingCount) {
    bookingCount.textContent = bookings;
  }


  const revenueCount =
    document.getElementById("totalRevenue");

  if (revenueCount) {
    revenueCount.textContent =
      `₹${Number(revenue).toLocaleString("en-IN")}`;
  }
}
