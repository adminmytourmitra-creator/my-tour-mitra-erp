// ======================================================
// MY TOUR MITRA ERP
// QUOTATIONS MODULE
// ======================================================

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { db, auth } from "../firebase.js";

// ======================================================
// STATE
// ======================================================

let allQuotations = [];
let allCustomers = [];
let allEnquiries = [];
let allPackages = [];
let allHotels = [];
let allCabs = [];

let editingQuotationId = null;


// ======================================================
// COLLECTIONS
// ======================================================

const QUOTATIONS_COLLECTION = "quotations";
const CUSTOMERS_COLLECTION = "customers";
const ENQUIRIES_COLLECTION = "enquiries";
const PACKAGES_COLLECTION = "packages";
const HOTELS_COLLECTION = "hotels";
const CABS_COLLECTION = "cabs";


// ======================================================
// INITIALIZE
// ======================================================

export function initQuotations() {

  console.log(
    "Initializing Quotations module..."
  );

  setupQuotationButtons();

  setupQuotationForm();

  setupQuotationSearch();

  setupQuotationDynamicFields();

  loadQuotationMasterData();

}


// ======================================================
// ELEMENT HELPER
// ======================================================

function getElement(id) {

  return document.getElementById(id);

}


// ======================================================
// SAFE TEXT
// ======================================================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ======================================================
// NUMBER
// ======================================================

function numberValue(value) {

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;

}


// ======================================================
// CURRENCY
// ======================================================

function formatCurrency(value) {

  return numberValue(value).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );

}


// ======================================================
// GENERATE QUOTATION ID
// ======================================================

function generateQuotationId() {

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let random = "";

  for (let i = 0; i < 6; i++) {

    random +=
      chars[
        Math.floor(
          Math.random() * chars.length
        )
      ];

  }

  return `QT-${random}`;

}


// ======================================================
// SETUP BUTTONS
// ======================================================

function setupQuotationButtons() {

  const addButton =
    getElement("addQuotationBtn");

  const closeButton =
    getElement("closeQuotationModal");

  const cancelButton =
    getElement("cancelQuotationBtn");

  if (addButton) {

    addButton.addEventListener(
      "click",
      () => openQuotationModal()
    );

  }

  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeQuotationModal
    );

  }

  if (cancelButton) {

    cancelButton.addEventListener(
      "click",
      closeQuotationModal
    );

  }

}


// ======================================================
// OPEN MODAL
// ======================================================

function openQuotationModal(
  quotation = null
) {

  const modal =
    getElement("quotationModal");

  const form =
    getElement("quotationForm");

  if (!modal || !form) {

    console.error(
      "Quotation modal/form not found."
    );

    return;

  }

  modal.style.display = "flex";

  clearQuotationMessage();

  if (quotation) {

    editingQuotationId =
      quotation.id;

    populateQuotationForm(
      quotation
    );

    const title =
      getElement(
        "quotationModalTitle"
      );

    if (title) {

      title.textContent =
        "Edit Quotation";

    }

  } else {

    editingQuotationId =
      null;

    resetQuotationForm();

    const title =
      getElement(
        "quotationModalTitle"
      );

    if (title) {

      title.textContent =
        "Add Quotation";

    }

    const quotationId =
      getElement(
        "quotationId"
      );

    if (quotationId) {

      quotationId.value =
        generateQuotationId();

    }

  }

}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeQuotationModal() {

  const modal =
    getElement("quotationModal");

  if (modal) {

    modal.style.display =
      "none";

  }

  editingQuotationId =
    null;

  clearQuotationMessage();

}


// ======================================================
// RESET FORM
// ======================================================

function resetQuotationForm() {

  const form =
    getElement("quotationForm");

  if (form) {

    form.reset();

  }

  clearDynamicQuotationSections();

  calculateQuotationTotal();

}


// ======================================================
// CLEAR DYNAMIC SECTIONS
// ======================================================

function clearDynamicQuotationSections() {

  const itinerary =
    getElement(
      "quotationItineraryContainer"
    );

  if (itinerary) {

    itinerary.innerHTML = "";

  }

  const hotels =
    getElement(
      "quotationHotelsContainer"
    );

  if (hotels) {

    hotels.innerHTML = "";

  }

  const cabs =
    getElement(
      "quotationCabsContainer"
    );

  if (cabs) {

    cabs.innerHTML = "";

  }

}


// ======================================================
// MESSAGE
// ======================================================

function showQuotationMessage(
  message,
  type = "success"
) {

  const element =
    getElement(
      "quotationFormMessage"
    );

  if (!element) return;

  element.textContent =
    message;

  element.className =
    `form-message ${type}`;

}


function clearQuotationMessage() {

  const element =
    getElement(
      "quotationFormMessage"
    );

  if (element) {

    element.textContent = "";

    element.className =
      "form-message";

  }

}


// ======================================================
// FORM SETUP
// ======================================================

function setupQuotationForm() {

  const form =
    getElement("quotationForm");

  if (!form) {

    console.warn(
      "quotationForm not found."
    );

    return;

  }

  form.addEventListener(
    "submit",
    saveQuotation
  );

}


// ======================================================
// DYNAMIC EVENTS
// ======================================================

function setupQuotationDynamicFields() {

  const customer =
    getElement(
      "quotationCustomer"
    );

  const enquiry =
    getElement(
      "quotationEnquiry"
    );

  const packageSelect =
    getElement(
      "quotationPackage"
    );

  const packageCost =
    getElement(
      "quotationPackageCost"
    );

  const discount =
    getElement(
      "quotationDiscount"
    );

  const gst =
    getElement(
      "quotationGST"
    );

  if (customer) {

    customer.addEventListener(
      "change",
      loadCustomerEnquiries
    );

  }

  if (enquiry) {

    enquiry.addEventListener(
      "change",
      applyEnquiryData
    );

  }

  if (packageSelect) {

    packageSelect.addEventListener(
      "change",
      applyPackageData
    );

  }

  if (packageCost) {

    packageCost.addEventListener(
      "input",
      calculateQuotationTotal
    );

  }

  if (discount) {

    discount.addEventListener(
      "input",
      calculateQuotationTotal
    );

  }

  if (gst) {

    gst.addEventListener(
      "input",
      calculateQuotationTotal
    );

  }

}


// ======================================================
// LOAD MASTER DATA
// ======================================================

async function loadQuotationMasterData() {

  try {

    await Promise.all([
      loadCustomers(),
      loadEnquiries(),
      loadPackages(),
      loadHotels(),
      loadCabs()
    ]);

    populateCustomerSelect();

    populatePackageSelect();

    populateHotelSelect();

    populateCabSelect();

    await loadQuotations();

    console.log(
      "Quotation master data loaded."
    );

  } catch (error) {

    console.error(
      "Quotation master loading error:",
      error
    );

  }

}


// ======================================================
// LOAD CUSTOMERS
// ======================================================

async function loadCustomers() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          CUSTOMERS_COLLECTION
        )
      );

    allCustomers =
      snapshot.docs.map(
        document => ({
          id:
            document.id,
          ...document.data()
        })
      );

  } catch (error) {

    console.error(
      "Customer loading error:",
      error
    );

    allCustomers = [];

  }

}


// ======================================================
// LOAD ENQUIRIES
// ======================================================

async function loadEnquiries() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          ENQUIRIES_COLLECTION
        )
      );

    allEnquiries =
      snapshot.docs.map(
        document => ({
          id:
            document.id,
          ...document.data()
        })
      );

  } catch (error) {

    console.error(
      "Enquiry loading error:",
      error
    );

    allEnquiries = [];

  }

}


// ======================================================
// LOAD PACKAGES
// ======================================================

async function loadPackages() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          PACKAGES_COLLECTION
        )
      );

    allPackages =
      snapshot.docs.map(
        document => ({
          id:
            document.id,
          ...document.data()
        })
      );

  } catch (error) {

    console.error(
      "Package loading error:",
      error
    );

    allPackages = [];

  }

}


// ======================================================
// LOAD HOTELS
// ======================================================

async function loadHotels() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          HOTELS_COLLECTION
        )
      );

    allHotels =
      snapshot.docs.map(
        document => ({
          id:
            document.id,
          ...document.data()
        })
      );

  } catch (error) {

    console.error(
      "Hotel loading error:",
      error
    );

    allHotels = [];

  }

}


// ======================================================
// LOAD CABS
// ======================================================

async function loadCabs() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          CABS_COLLECTION
        )
      );

    allCabs =
      snapshot.docs.map(
        document => ({
          id:
            document.id,
          ...document.data()
        })
      );

  } catch (error) {

    console.error(
      "Cab loading error:",
      error
    );

    allCabs = [];

  }

}


// ======================================================
// CUSTOMER SELECT
// ======================================================

function populateCustomerSelect() {

  const select =
    getElement(
      "quotationCustomer"
    );

  if (!select) return;

  const current =
    select.value;

  select.innerHTML = `
    <option value="">
      Select Customer
    </option>
  `;

  allCustomers.forEach(
    customer => {

      const name =
        customer.name ||
        customer.customerName ||
        customer.fullName ||
        "-";

      select.insertAdjacentHTML(
        "beforeend",
        `
          <option value="${escapeHtml(customer.id)}">
            ${escapeHtml(name)}
          </option>
        `
      );

    }
  );

  if (current) {

    select.value =
      current;

  }

}


// ======================================================
// PACKAGE SELECT
// ======================================================

function populatePackageSelect() {

  const select =
    getElement(
      "quotationPackage"
    );

  if (!select) return;

  const current =
    select.value;

  select.innerHTML = `
    <option value="">
      Select Package
    </option>
  `;

  allPackages.forEach(
    packageData => {

      const name =
        packageData.name ||
        packageData.packageName ||
        "-";

      const destination =
        packageData.destination ||
        "";

      select.insertAdjacentHTML(
        "beforeend",
        `
          <option value="${escapeHtml(packageData.id)}">
            ${escapeHtml(name)}
            ${
              destination
                ? ` — ${escapeHtml(destination)}`
                : ""
            }
          </option>
        `
      );

    }
  );

  if (current) {

    select.value =
      current;

  }

}


// ======================================================
// HOTEL SELECT
// ======================================================

function populateHotelSelect() {

  const select =
    getElement(
      "quotationHotelSelect"
    );

  if (!select) return;

  select.innerHTML = `
    <option value="">
      Select Hotel
    </option>
  `;

  allHotels.forEach(
    hotel => {

      const name =
        hotel.name ||
        hotel.hotelName ||
        hotel.companyName ||
        "-";

      const city =
        hotel.city ||
        hotel.destination ||
        "";

      select.insertAdjacentHTML(
        "beforeend",
        `
          <option value="${escapeHtml(hotel.id)}">
            ${escapeHtml(name)}
            ${
              city
                ? ` — ${escapeHtml(city)}`
                : ""
            }
          </option>
        `
      );

    }
  );

}


// ======================================================
// CAB SELECT
// ======================================================

function populateCabSelect() {

  const select =
    getElement(
      "quotationCabSelect"
    );

  if (!select) return;

  select.innerHTML = `
    <option value="">
      Select Cab
    </option>
  `;

  allCabs.forEach(
    cab => {

      const name =
        cab.name ||
        cab.cabName ||
        cab.vehicleName ||
        cab.vehicle ||
        "-";

      const type =
        cab.type ||
        cab.vehicleType ||
        cab.category ||
        "";

      select.insertAdjacentHTML(
        "beforeend",
        `
          <option value="${escapeHtml(cab.id)}">
            ${escapeHtml(name)}
            ${
              type
                ? ` — ${escapeHtml(type)}`
                : ""
            }
          </option>
        `
      );

    }
  );

}


// ======================================================
// CUSTOMER → ENQUIRIES
// ======================================================

function loadCustomerEnquiries() {

  const customerSelect =
    getElement(
      "quotationCustomer"
    );

  const enquirySelect =
    getElement(
      "quotationEnquiry"
    );

  if (!customerSelect ||
      !enquirySelect) return;

  const customerId =
    customerSelect.value;

  enquirySelect.innerHTML = `
    <option value="">
      Select Enquiry
    </option>
  `;

  const filtered =
    allEnquiries.filter(
      enquiry => {

        return (
          enquiry.customerId ===
          customerId
        ) ||
        enquiry.customer ===
        customerId ||
        enquiry.customerRef ===
        customerId;

      }
    );

  filtered.forEach(
    enquiry => {

      const enquiryId =
        enquiry.enquiryId ||
        enquiry.id;

      const destination =
        enquiry.destination ||
        "";

      enquirySelect.insertAdjacentHTML(
        "beforeend",
        `
          <option value="${escapeHtml(enquiry.id)}">
            ${escapeHtml(enquiryId)}
            ${
              destination
                ? ` — ${escapeHtml(destination)}`
                : ""
            }
          </option>
        `
      );

    }
  );

}


// ======================================================
// APPLY ENQUIRY DATA
// ======================================================

function applyEnquiryData() {

  const enquirySelect =
    getElement(
      "quotationEnquiry"
    );

  if (!enquirySelect) return;

  const enquiry =
    allEnquiries.find(
      item =>
        item.id ===
        enquirySelect.value
    );

  if (!enquiry) return;

  setFieldValue(
    "quotationDestination",
    enquiry.destination ||
    enquiry.destinations ||
    ""
  );

  setFieldValue(
    "quotationStartDate",
    enquiry.startDate ||
    enquiry.travelStartDate ||
    ""
  );

  setFieldValue(
    "quotationEndDate",
    enquiry.endDate ||
    enquiry.travelEndDate ||
    ""
  );

  setFieldValue(
    "quotationAdults",
    enquiry.adults ||
    enquiry.adult ||
    0
  );

  setFieldValue(
    "quotationChildren",
    enquiry.children ||
    enquiry.child ||
    0
  );

  setFieldValue(
    "quotationRooms",
    enquiry.rooms ||
    0
  );

}


// ======================================================
// APPLY PACKAGE DATA
// ======================================================

function applyPackageData() {

  const packageSelect =
    getElement(
      "quotationPackage"
    );

  if (!packageSelect) return;

  const packageData =
    allPackages.find(
      item =>
        item.id ===
        packageSelect.value
    );

  if (!packageData) return;

  setFieldValue(
    "quotationDestination",
    packageData.destination ||
    ""
  );

  setFieldValue(
    "quotationPackageCost",
    packageData.price ||
    packageData.packageCost ||
    0
  );

  // IMPORTANT:
  // Package Master itinerary is copied
  // into quotation without changing format.

  renderQuotationItinerary(
    packageData.itinerary ||
    packageData.itineraryDays ||
    packageData.daysItinerary ||
    packageData.dayWiseItinerary ||
    []
  );

  calculateQuotationTotal();

}


// ======================================================
// FIELD HELPER
// ======================================================

function setFieldValue(
  id,
  value
) {

  const element =
    getElement(id);

  if (!element) return;

  element.value =
    value ?? "";

}


// ======================================================
// RENDER ITINERARY
// ======================================================

function renderQuotationItinerary(
  itinerary
) {

  const container =
    getElement(
      "quotationItineraryContainer"
    );

  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(itinerary) ||
      !itinerary.length) {

    container.innerHTML = `
      <div class="empty-state">
        No itinerary found in Package Master.
      </div>
    `;

    return;

  }

  itinerary.forEach(
    (day, index) => {

      if (
        typeof day ===
        "string"
      ) {

        container.insertAdjacentHTML(
          "beforeend",
          `
            <div class="quotation-itinerary-day">

              <div class="itinerary-day-title">
                Day ${index + 1}
              </div>

              <div class="itinerary-day-content">
                ${day}
              </div>

            </div>
          `
        );

        return;

      }

      const dayNumber =
        day.day ||
        day.dayNumber ||
        day.number ||
        index + 1;

      const title =
        day.title ||
        day.heading ||
        day.name ||
        day.dayTitle ||
        "";

      const description =
        day.description ||
        day.details ||
        day.content ||
        day.itinerary ||
        "";

      container.insertAdjacentHTML(
        "beforeend",
        `
          <div
            class="quotation-itinerary-day"
          >

            <div
              class="itinerary-day-title"
            >

              Day ${escapeHtml(
                dayNumber
              )}

              ${
                title
                  ? ` — ${escapeHtml(title)}`
                  : ""
              }

            </div>

            <div
              class="itinerary-day-content"
            >
              ${description}
            </div>

          </div>
        `
      );

    }
  );

}


// ======================================================
// ADD HOTEL
// ======================================================

function addQuotationHotel() {

  const select =
    getElement(
      "quotationHotelSelect"
    );

  const container =
    getElement(
      "quotationHotelsContainer"
    );

  if (!select ||
      !container ||
      !select.value) return;

  const hotel =
    allHotels.find(
      item =>
        item.id ===
        select.value
    );

  if (!hotel) return;

  const city =
    hotel.city ||
    hotel.destination ||
    "";

  const name =
    hotel.name ||
    hotel.hotelName ||
    hotel.companyName ||
    "-";

  const room =
    hotel.roomType ||
    hotel.room ||
    "";

  const meal =
    hotel.mealPlan ||
    hotel.meal ||
    hotel.meals ||
    "";

  const row =
    document.createElement(
      "div"
    );

  row.className =
    "quotation-selected-item";

  row.dataset.hotelId =
    hotel.id;

  row.innerHTML = `
    <div>
      <strong>
        ${escapeHtml(name)}
      </strong>

      ${
        city
          ? `<small>${escapeHtml(city)}</small>`
          : ""
      }

      ${
        room
          ? `<small>Room: ${escapeHtml(room)}</small>`
          : ""
      }

      ${
        meal
          ? `<small>Meal: ${escapeHtml(meal)}</small>`
          : ""
      }
    </div>

    <button
      type="button"
      class="danger-btn"
      data-remove-selected-item
    >
      Remove
    </button>
  `;

  container.appendChild(
    row
  );

  select.value = "";

}


// ======================================================
// ADD CAB
// ======================================================

function addQuotationCab() {

  const select =
    getElement(
      "quotationCabSelect"
    );

  const container =
    getElement(
      "quotationCabsContainer"
    );

  if (!select ||
      !container ||
      !select.value) return;

  const cab =
    allCabs.find(
      item =>
        item.id ===
        select.value
    );

  if (!cab) return;

  const name =
    cab.name ||
    cab.cabName ||
    cab.vehicleName ||
    cab.vehicle ||
    "-";

  const type =
    cab.type ||
    cab.vehicleType ||
    cab.category ||
    "";

  const capacity =
    cab.capacity ||
    cab.seating ||
    cab.pax ||
    "";

  const row =
    document.createElement(
      "div"
    );

  row.className =
    "quotation-selected-item";

  row.dataset.cabId =
    cab.id;

  row.innerHTML = `
    <div>

      <strong>
        ${escapeHtml(name)}
      </strong>

      ${
        type
          ? `<small>Type: ${escapeHtml(type)}</small>`
          : ""
      }

      ${
        capacity
          ? `<small>Capacity: ${escapeHtml(capacity)}</small>`
          : ""
      }

    </div>

    <button
      type="button"
      class="danger-btn"
      data-remove-selected-item
    >
      Remove
    </button>
  `;

  container.appendChild(
    row
  );

  select.value = "";

}


// ======================================================
// DYNAMIC BUTTON EVENTS
// ======================================================

document.addEventListener(
  "click",
  event => {

    if (
      event.target.matches(
        "#addQuotationHotelBtn"
      )
    ) {

      addQuotationHotel();

    }

    if (
      event.target.matches(
        "#addQuotationCabBtn"
      )
    ) {

      addQuotationCab();

    }

    if (
      event.target.matches(
        "[data-remove-selected-item]"
      )
    ) {

      const item =
        event.target.closest(
          ".quotation-selected-item"
        );

      if (item) {

        item.remove();

      }

    }

  }
);


// ======================================================
// COLLECT HOTELS
// ======================================================

function collectQuotationHotels() {

  const container =
    getElement(
      "quotationHotelsContainer"
    );

  if (!container) return [];

  return [
    ...container.querySelectorAll(
      "[data-hotel-id]"
    )
  ].map(
    element => {

      const hotel =
        allHotels.find(
          item =>
            item.id ===
            element.dataset.hotelId
        );

      if (!hotel) return null;

      return {
        hotelId:
          hotel.id,

        hotel:
          hotel.name ||
          hotel.hotelName ||
          hotel.companyName ||
          "",

        hotelName:
          hotel.name ||
          hotel.hotelName ||
          hotel.companyName ||
          "",

        city:
          hotel.city ||
          hotel.destination ||
          "",

        room:
          hotel.roomType ||
          hotel.room ||
          "",

        meal:
          hotel.mealPlan ||
          hotel.meal ||
          hotel.meals ||
          ""
      };

    }
  ).filter(Boolean);

}


// ======================================================
// COLLECT CABS
// ======================================================

function collectQuotationCabs() {

  const container =
    getElement(
      "quotationCabsContainer"
    );

  if (!container) return [];

  return [
    ...container.querySelectorAll(
      "[data-cab-id]"
    )
  ].map(
    element => {

      const cab =
        allCabs.find(
          item =>
            item.id ===
            element.dataset.cabId
        );

      if (!cab) return null;

      return {
        cabId:
          cab.id,

        vehicle:
          cab.name ||
          cab.cabName ||
          cab.vehicleName ||
          cab.vehicle ||
          "",

        vehicleName:
          cab.name ||
          cab.cabName ||
          cab.vehicleName ||
          cab.vehicle ||
          "",

        category:
          cab.type ||
          cab.vehicleType ||
          cab.category ||
          "",

        capacity:
          cab.capacity ||
          cab.seating ||
          cab.pax ||
          "",

        details:
          cab.details ||
          cab.description ||
          ""
      };

    }
  ).filter(Boolean);

}


// ======================================================
// COLLECT ITINERARY
// ======================================================

function collectQuotationItinerary() {

  const container =
    getElement(
      "quotationItineraryContainer"
    );

  if (!container) return [];

  return [
    ...container.querySelectorAll(
      ".quotation-itinerary-day"
    )
  ].map(
    (element, index) => {

      const titleElement =
        element.querySelector(
          ".itinerary-day-title"
        );

      const contentElement =
        element.querySelector(
          ".itinerary-day-content"
        );

      return {

        day:
          index + 1,

        title:
          titleElement
            ? titleElement.textContent
                .replace(
                  /^Day\s+\d+\s*[-—]?\s*/,
                  ""
                )
                .trim()
            : "",

        description:
          contentElement
            ? contentElement.innerHTML
            : ""

      };

    }
  );

}


// ======================================================
// CALCULATE TOTAL
// ======================================================

function calculateQuotationTotal() {

  const packageCost =
    numberValue(
      getElement(
        "quotationPackageCost"
      )?.value
    );

  const discount =
    numberValue(
      getElement(
        "quotationDiscount"
      )?.value
    );

  const gst =
    numberValue(
      getElement(
        "quotationGST"
      )?.value
    );

  const grandTotal =
    Math.max(
      0,
      packageCost -
      discount +
      gst
    );

  const adults =
    numberValue(
      getElement(
        "quotationAdults"
      )?.value
    );

  const children =
    numberValue(
      getElement(
        "quotationChildren"
      )?.value
    );

  const pax =
    adults +
    children;

  const perPerson =
    pax > 0
      ? grandTotal / pax
      : 0;

  setFieldValue(
    "quotationGrandTotal",
    grandTotal.toFixed(2)
  );

  setFieldValue(
    "quotationPerPerson",
    perPerson.toFixed(2)
  );

}


// ======================================================
// SAVE QUOTATION
// ======================================================

async function saveQuotation(
  event
) {

  event.preventDefault();

  clearQuotationMessage();

  const form =
    getElement(
      "quotationForm"
    );

  if (!form) return;

  try {

    const customerId =
      getElement(
        "quotationCustomer"
      )?.value || "";

    const enquiryId =
      getElement(
        "quotationEnquiry"
      )?.value || "";

    const packageId =
      getElement(
        "quotationPackage"
      )?.value || "";

    const customer =
      allCustomers.find(
        item =>
          item.id ===
          customerId
      );

    const enquiry =
      allEnquiries.find(
        item =>
          item.id ===
          enquiryId
      );

    const packageData =
      allPackages.find(
        item =>
          item.id ===
          packageId
      );

    const packageName =
      packageData?.name ||
      packageData?.packageName ||
      getElement(
        "quotationPackage"
      )?.selectedOptions?.[0]
        ?.textContent ||
      "";

    const customerName =
      customer?.name ||
      customer?.customerName ||
      customer?.fullName ||
      getElement(
        "quotationCustomer"
      )?.selectedOptions?.[0]
        ?.textContent ||
      "";

    const itinerary =
      collectQuotationItinerary();

    const hotels =
      collectQuotationHotels();

    const cabs =
      collectQuotationCabs();

    const packageCost =
      numberValue(
        getElement(
          "quotationPackageCost"
        )?.value
      );

    const discount =
      numberValue(
        getElement(
          "quotationDiscount"
        )?.value
      );

    const gst =
      numberValue(
        getElement(
          "quotationGST"
        )?.value
      );

    const grandTotal =
      Math.max(
        0,
        packageCost -
        discount +
        gst
      );

    const adults =
      numberValue(
        getElement(
          "quotationAdults"
        )?.value
      );

    const children =
      numberValue(
        getElement(
          "quotationChildren"
        )?.value
      );

    const pax =
      adults +
      children;

    const perPerson =
      pax > 0
        ? grandTotal / pax
        : 0;

    const quotationData = {

      quotationId:
        getElement(
          "quotationId"
        )?.value ||
        generateQuotationId(),

      customerId:

        customerId,

      customer:

        customerName,

      enquiryId:

        enquiryId,

      enquiryReference:

        enquiry?.enquiryId ||
        enquiry?.id ||
        "",

      packageId:

        packageId,

      packageName:

        packageName,

      destination:

        getElement(
          "quotationDestination"
        )?.value ||
        packageData?.destination ||
        "",

      startDate:

        getElement(
          "quotationStartDate"
        )?.value ||
        "",

      endDate:

        getElement(
          "quotationEndDate"
        )?.value ||
        "",

      adults:

        adults,

      children:

        children,

      rooms:

        numberValue(
          getElement(
            "quotationRooms"
          )?.value
        ),

      validUntil:

        getElement(
          "quotationValidUntil"
        )?.value ||
        "",

      packageCost:

        packageCost,

      discount:

        discount,

      gst:

        gst,

      grandTotal:

        grandTotal,

      totalPackageCost:

        grandTotal,

      perPerson:

        perPerson,

      perPersonAmount:

        perPerson,

      status:

        getElement(
          "quotationStatus"
        )?.value ||
        "Draft",

      internalNotes:

        getElement(
          "quotationInternalNotes"
        )?.value ||
        "",

      itinerary:

        itinerary,

      packageItinerary:

        itinerary,

      hotels:

        hotels,

      hotelDetails:

        hotels,

      cabs:

        cabs,

      transport:

        cabs,

      updatedAt:

        serverTimestamp()

    };


    // ==================================================
    // UPDATE
    // ==================================================

    if (editingQuotationId) {

      await updateDoc(
        doc(
          db,
          QUOTATIONS_COLLECTION,
          editingQuotationId
        ),
        quotationData
      );

      showQuotationMessage(
        "Quotation updated successfully."
      );

    }

    // ==================================================
    // CREATE
    // ==================================================

    else {

      quotationData.createdAt =
        serverTimestamp();

      quotationData.createdBy =
        auth.currentUser?.uid ||
        "";

      await addDoc(
        collection(
          db,
          QUOTATIONS_COLLECTION
        ),
        quotationData
      );

      showQuotationMessage(
        "Quotation saved successfully."
      );

    }


    await loadQuotations();

    setTimeout(
      closeQuotationModal,
      700
    );

  } catch (error) {

    console.error(
      "Quotation save error:",
      error
    );

    showQuotationMessage(
      "Could not save quotation. Check console for details.",
      "error"
    );

  }

}


// ======================================================
// LOAD QUOTATIONS
// ======================================================

async function loadQuotations() {

  const table =
    getElement(
      "quotationsTableBody"
    );

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          QUOTATIONS_COLLECTION
        )
      );

    allQuotations =
      snapshot.docs.map(
        document => ({
          id:
            document.id,
          ...document.data()
        })
      );

    renderQuotations(
      allQuotations
    );

  } catch (error) {

    console.error(
      "Quotation loading error:",
      error
    );

    if (table) {

      table.innerHTML = `
        <tr>
          <td
            colspan="8"
            class="empty-table"
          >
            Unable to load quotations.
          </td>
        </tr>
      `;

    }

  }

}


// ======================================================
// RENDER TABLE
// ======================================================

function renderQuotations(
quotations
) {

  const table =
    getElement(
      "quotationsTableBody"
    );

  if (!table) return;

  if (!quotations.length) {

    table.innerHTML = `
      <tr>
        <td
          colspan="8"
          class="empty-table"
        >
          No quotations found.
        </td>
      </tr>
    `;

    return;

  }

  table.innerHTML =
    quotations.map(
      quotation => {

        const pax =
          numberValue(
            quotation.adults
          ) +
          numberValue(
            quotation.children
          );

        return `
          <tr>

            <td>
              <strong>
                ${escapeHtml(
                  quotation.quotationId ||
                  quotation.id
                )}
              </strong>
            </td>

            <td>
              ${escapeHtml(
                quotation.customer ||
                quotation.customerName ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                quotation.packageName ||
                quotation.package ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                quotation.startDate ||
                quotation.travelStartDate ||
                "-"
              )}
            </td>

            <td>
              ${pax}
            </td>

            <td>
              ₹${formatCurrency(
                quotation.grandTotal ||
                quotation.totalPackageCost ||
                0
              )}
            </td>

            <td>
              <span
                class="status-badge"
              >
                ${escapeHtml(
                  quotation.status ||
                  "Draft"
                )}
              </span>
            </td>

            <td>

              <button
                type="button"
                class="edit-btn"
                data-quotation-edit-id="${escapeHtml(
                  quotation.id
                )}"
              >
                Edit
              </button>

              <button
                type="button"
                class="danger-btn"
                data-quotation-delete-id="${escapeHtml(
                  quotation.id
                )}"
              >
                Delete
              </button>

              <button
                type="button"
                class="secondary-btn"
                data-quotation-pdf-id="${escapeHtml(
                  quotation.id
                )}"
              >
                PDF
              </button>

              <button
                type="button"
                class="primary-btn"
                data-quotation-share-id="${escapeHtml(
                  quotation.id
                )}"
              >
                Send
              </button>

            </td>

          </tr>
        `;

      }
    ).join("");

  setupQuotationRowActions();

}


// ======================================================
// ROW ACTIONS
// ======================================================

function setupQuotationRowActions() {

  document
    .querySelectorAll(
      "[data-quotation-edit-id]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const quotation =
              allQuotations.find(
                item =>
                  item.id ===
                  button.dataset
                    .quotationEditId
              );

            if (quotation) {

              openQuotationModal(
                quotation
              );

            }

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-quotation-delete-id]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async () => {

            const id =
              button.dataset
                .quotationDeleteId;

            const quotation =
              allQuotations.find(
                item =>
                  item.id === id
              );

            if (!quotation) return;

            const confirmed =
              confirm(
                `Delete quotation ${
                  quotation.quotationId ||
                  ""
                }?`
              );

            if (!confirmed) return;

            try {

              await deleteDoc(
                doc(
                  db,
                  QUOTATIONS_COLLECTION,
                  id
                )
              );

              await loadQuotations();

            } catch (error) {

              console.error(
                "Quotation delete error:",
                error
              );

              alert(
                "Could not delete quotation."
              );

            }

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-quotation-pdf-id]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const quotation =
              allQuotations.find(
                item =>
                  item.id ===
                  button.dataset
                    .quotationPdfId
              );

            if (!quotation) return;

            if (
              typeof window
                .generateQuotationPDF ===
              "function"
            ) {

              window.generateQuotationPDF(
                quotation
              );

            } else {

              alert(
                "Quotation PDF module is not loaded."
              );

            }

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-quotation-share-id]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const quotation =
              allQuotations.find(
                item =>
                  item.id ===
                  button.dataset
                    .quotationShareId
              );

            if (!quotation) return;

            if (
              typeof window
                .shareQuotationPDF ===
              "function"
            ) {

              window.shareQuotationPDF(
                quotation
              );

            } else {

              alert(
                "Quotation PDF module is not loaded."
              );

            }

          }
        );

      }
    );

}


// ======================================================
// SEARCH
// ======================================================

function setupQuotationSearch() {

  const search =
    getElement(
      "quotationSearch"
    );

  if (!search) return;

  search.addEventListener(
    "input",
    () => {

      const term =
        search.value
          .trim()
          .toLowerCase();

      if (!term) {

        renderQuotations(
          allQuotations
        );

        return;

      }

      const filtered =
        allQuotations.filter(
          quotation => {

            const text =
              [
                quotation.quotationId,
                quotation.customer,
                quotation.customerName,
                quotation.packageName,
                quotation.destination,
                quotation.status
              ]
                .join(" ")
                .toLowerCase();

            return text.includes(
              term
            );

          }
        );

      renderQuotations(
        filtered
      );

    }
  );

}


// ======================================================
// POPULATE EDIT FORM
// ======================================================

function populateQuotationForm(
quotation
) {

  setFieldValue(
    "quotationId",
    quotation.quotationId ||
    quotation.id ||
    ""
  );

  setFieldValue(
    "quotationCustomer",
    quotation.customerId ||
    ""
  );

  // Rebuild enquiry list for customer.

  loadCustomerEnquiries();

  setFieldValue(
    "quotationEnquiry",
    quotation.enquiryId ||
    ""
  );

  setFieldValue(
    "quotationPackage",
    quotation.packageId ||
    ""
  );

  setFieldValue(
    "quotationDestination",
    quotation.destination ||
    ""
  );

  setFieldValue(
    "quotationStartDate",
    quotation.startDate ||
    quotation.travelStartDate ||
    ""
  );

  setFieldValue(
    "quotationEndDate",
    quotation.endDate ||
    quotation.travelEndDate ||
    ""
  );

  setFieldValue(
    "quotationAdults",
    quotation.adults ||
    0
  );

  setFieldValue(
    "quotationChildren",
    quotation.children ||
    0
  );

  setFieldValue(
    "quotationRooms",
    quotation.rooms ||
    0
  );

  setFieldValue(
    "quotationValidUntil",
    quotation.validUntil ||
    ""
  );

  setFieldValue(
    "quotationPackageCost",
    quotation.packageCost ||
    0
  );

  setFieldValue(
    "quotationDiscount",
    quotation.discount ||
    0
  );

  setFieldValue(
    "quotationGST",
    quotation.gst ||
    0
  );

  setFieldValue(
    "quotationGrandTotal",
    quotation.grandTotal ||
    0
  );

  setFieldValue(
    "quotationPerPerson",
    quotation.perPerson ||
    quotation.perPersonAmount ||
    0
  );

  setFieldValue(
    "quotationStatus",
    quotation.status ||
    "Draft"
  );

  setFieldValue(
    "quotationInternalNotes",
    quotation.internalNotes ||
    ""
  );


  // Itinerary

  renderQuotationItinerary(
    quotation.itinerary ||
    quotation.packageItinerary ||
    []
  );


  // Hotels

  renderSavedHotels(
    quotation.hotels ||
    quotation.hotelDetails ||
    []
  );


  // Cabs

  renderSavedCabs(
    quotation.cabs ||
    quotation.transport ||
    []
  );


  calculateQuotationTotal();

}


// ======================================================
// SAVED HOTELS
// ======================================================

function renderSavedHotels(
hotels
) {

  const container =
    getElement(
      "quotationHotelsContainer"
    );

  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(hotels)) return;

  hotels.forEach(
    hotelData => {

      const hotel =
        allHotels.find(
          item =>
            item.id ===
            hotelData.hotelId
        );

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "quotation-selected-item";

      row.dataset.hotelId =
        hotelData.hotelId ||
        "";

      row.innerHTML = `
        <div>

          <strong>
            ${escapeHtml(
              hotelData.hotelName ||
              hotelData.hotel ||
              hotel?.name ||
              hotel?.hotelName ||
              "-"
            )}
          </strong>

          <small>
            ${escapeHtml(
              hotelData.city ||
              hotel?.city ||
              ""
            )}
          </small>

          <small>
            Room:
            ${escapeHtml(
              hotelData.room ||
              hotel?.roomType ||
              ""
            )}
          </small>

          <small>
            Meal:
            ${escapeHtml(
              hotelData.meal ||
              hotel?.mealPlan ||
              ""
            )}
          </small>

        </div>

        <button
          type="button"
          class="danger-btn"
          data-remove-selected-item
        >
          Remove
        </button>
      `;

      container.appendChild(
        row
      );

    }
  );

}


// ======================================================
// SAVED CABS
// ======================================================

function renderSavedCabs(
cabs
) {

  const container =
    getElement(
      "quotationCabsContainer"
    );

  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(cabs)) return;

  cabs.forEach(
    cabData => {

      const cab =
        allCabs.find(
          item =>
            item.id ===
            cabData.cabId
        );

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "quotation-selected-item";

      row.dataset.cabId =
        cabData.cabId ||
        "";

      row.innerHTML = `
        <div>

          <strong>
            ${escapeHtml(
              cabData.vehicle ||
              cabData.vehicleName ||
              cab?.name ||
              cab?.vehicleName ||
              "-"
            )}
          </strong>

          <small>
            Type:
            ${escapeHtml(
              cabData.category ||
              cab?.type ||
              cab?.vehicleType ||
              ""
            )}
          </small>

          <small>
            Capacity:
            ${escapeHtml(
              cabData.capacity ||
              cab?.capacity ||
              cab?.seating ||
              ""
            )}
          </small>

        </div>

        <button
          type="button"
          class="danger-btn"
          data-remove-selected-item
        >
          Remove
        </button>
      `;

      container.appendChild(
        row
      );

    }
  );

}


// ======================================================
// GLOBAL REFRESH
// ======================================================

export async function refreshQuotations() {

  await loadQuotationMasterData();

}


// ======================================================
// GLOBAL ACCESS
// ======================================================

window.refreshQuotations =
  refreshQuotations;


// ======================================================
// FINISH
// ======================================================

console.log(
  "Quotations module loaded."
);
