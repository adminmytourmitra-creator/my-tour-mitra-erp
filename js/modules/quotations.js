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

import {
  generateQuotationPDF,
  shareQuotationPDF
} from "./quotation-pdf.js";

// ======================================================
// STATE
// ======================================================

let allQuotations = [];
let allEnquiries = [];
let allPackages = [];
let allHotels = [];
let allCabs = [];


// ======================================================
// INITIALIZE
// ======================================================

export function initQuotations() {

  setupQuotationButtons();

  setupQuotationForm();

  setupQuotationSearch();

  setupPricingCalculation();

  loadQuotationData();

}


// ======================================================
// ELEMENT HELPER
// ======================================================

function getElement(id) {

  return document.getElementById(id);

}


// ======================================================
// INITIAL DATA
// ======================================================

async function loadQuotationData() {

  await Promise.all([
    loadEnquiries(),
    loadPackages(),
    loadHotels(),
    loadCabs(),
    loadQuotations()
  ]);

}


// ======================================================
// BUTTONS
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


  const enquirySelect =
    getElement("quotationEnquiry");

  if (enquirySelect) {

    enquirySelect.addEventListener(
      "change",
      handleEnquiryChange
    );

  }


  const packageSelect =
    getElement("quotationPackage");

  if (packageSelect) {

    packageSelect.addEventListener(
      "change",
      handlePackageChange
    );

  }


  const vehicleSelect =
    getElement("quotationVehicle");

  if (vehicleSelect) {

    vehicleSelect.addEventListener(
      "change",
      handleVehicleChange
    );

  }


  const addHotelButton =
    getElement("addQuotationHotelBtn");

  if (addHotelButton) {

    addHotelButton.addEventListener(
      "click",
      () => addHotelRow()
    );

  }

}


// ======================================================
// FORM
// ======================================================

function setupQuotationForm() {

  const form =
    getElement("quotationForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    saveQuotation
  );

}


// ======================================================
// PRICING
// ======================================================

function setupPricingCalculation() {

  const fields = [
    "quotationPackageCost",
    "quotationDiscount",
    "quotationGST",
    "quotationAdults",
    "quotationChildren"
  ];


  fields.forEach(
    (id) => {

      const element =
        getElement(id);

      if (!element) return;


      element.addEventListener(
        "input",
        calculateQuotationPricing
      );


      element.addEventListener(
        "change",
        calculateQuotationPricing
      );

    }
  );


  calculateQuotationPricing();

}


// ======================================================
// CALCULATE PRICING
// ======================================================

function calculateQuotationPricing() {

  const packageCost =
    Number(
      getValue("quotationPackageCost")
    ) || 0;


  const discount =
    Number(
      getValue("quotationDiscount")
    ) || 0;


  const gst =
    Number(
      getValue("quotationGST")
    ) || 0;


  const adults =
    Number(
      getValue("quotationAdults")
    ) || 0;


  const children =
    Number(
      getValue("quotationChildren")
    ) || 0;


  const totalPax =
    adults + children;


  const grandTotal =
    Math.max(
      0,
      packageCost - discount + gst
    );


  const perPerson =
    totalPax > 0
      ? grandTotal / totalPax
      : 0;


  setValue(
    "quotationGrandTotal",
    roundMoney(grandTotal)
  );


  setValue(
    "quotationTotalPackageCost",
    roundMoney(grandTotal)
  );


  setValue(
    "quotationPerPerson",
    roundMoney(perPerson)
  );

}


// ======================================================
// LOAD ENQUIRIES
// ======================================================

async function loadEnquiries() {

  const select =
    getElement("quotationEnquiry");

  if (!select) return;


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "enquiries"
        )
      );


    allEnquiries =
      snapshot.docs.map(
        (item) => ({

          id: item.id,

          ...item.data()

        })
      );


    select.innerHTML = `
      <option value="">
        Select enquiry
      </option>
    `;


    allEnquiries.forEach(
      (enquiry) => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          enquiry.id;


        option.textContent =
          getEnquiryDisplayName(
            enquiry
          );


        select.appendChild(
          option
        );

      }
    );


  } catch (error) {

    console.error(
      "Quotation enquiry loading error:",
      error
    );

  }

}


// ======================================================
// ENQUIRY DISPLAY
// ======================================================

function getEnquiryDisplayName(
  enquiry
) {

  const id =
    enquiry.enquiryId ||
    enquiry.id ||
    "";


  const customer =
    enquiry.customerName ||
    enquiry.customer ||
    enquiry.name ||
    "Unknown Customer";


  return `${id} - ${customer}`;

}


// ======================================================
// ENQUIRY CHANGE
// ======================================================

function handleEnquiryChange() {

  const enquiryId =
    getValue(
      "quotationEnquiry"
    );


  if (!enquiryId) return;


  const enquiry =
    allEnquiries.find(
      (item) =>
        item.id === enquiryId
    );


  if (!enquiry) return;


  const customer =
    enquiry.customerName ||
    enquiry.customer ||
    enquiry.name ||
    "";


  const mobile =
    enquiry.mobile ||
    enquiry.phone ||
    enquiry.contactNumber ||
    "";


  const email =
    enquiry.email ||
    enquiry.customerEmail ||
    "";


  setValue(
    "quotationCustomer",
    customer
  );


  setValue(
    "quotationCustomerMobile",
    mobile
  );


  setValue(
    "quotationCustomerEmail",
    email
  );


  const enquiryPackage =
    enquiry.packageId ||
    enquiry.package ||
    enquiry.packageName ||
    enquiry.tourPackage ||
    "";


  if (enquiryPackage) {

    const packageById =
      allPackages.find(
        (item) =>
          item.id === enquiryPackage
      );


    if (packageById) {

      setValue(
        "quotationPackage",
        packageById.id
      );


      handlePackageChange();

      return;

    }


    selectPackageByName(
      enquiryPackage
    );

  }

}


// ======================================================
// SELECT PACKAGE BY NAME
// ======================================================

function selectPackageByName(
  packageName
) {

  const select =
    getElement(
      "quotationPackage"
    );


  if (!select) return;


  const target =
    String(
      packageName
    )
      .trim()
      .toLowerCase();


  const pkg =
    allPackages.find(
      (item) => {

        const name =
          getPackageDisplayName(
            item
          )
            .trim()
            .toLowerCase();


        return (
          name === target ||
          name.includes(target) ||
          target.includes(name)
        );

      }
    );


  if (!pkg) return;


  select.value =
    pkg.id;


  handlePackageChange();

}


// ======================================================
// LOAD PACKAGES
// ======================================================

async function loadPackages() {

  const select =
    getElement(
      "quotationPackage"
    );


  if (!select) return;


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "packages"
        )
      );


    allPackages =
      snapshot.docs.map(
        (item) => ({

          id: item.id,

          ...item.data()

        })
      );


    select.innerHTML = `
      <option value="">
        Select package
      </option>
    `;


    allPackages.forEach(
      (pkg) => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          pkg.id;


        option.textContent =
          getPackageDisplayName(
            pkg
          );


        select.appendChild(
          option
        );

      }
    );


  } catch (error) {

    console.error(
      "Package loading error:",
      error
    );

  }

}


// ======================================================
// PACKAGE DISPLAY NAME
// ======================================================

function getPackageDisplayName(
  pkg
) {

  return (
    pkg.name ||
    pkg.packageName ||
    pkg.title ||
    pkg.packageTitle ||
    "Unnamed Package"
  );

}


// ======================================================
// PACKAGE CHANGE
// ======================================================

function handlePackageChange() {

  const packageId =
    getValue(
      "quotationPackage"
    );


  if (!packageId) {

    clearPackageInformation();

    return;

  }


  const pkg =
    allPackages.find(
      (item) =>
        item.id === packageId
    );


  if (!pkg) return;


  setValue(
    "quotationDestination",
    getPackageDestination(
      pkg
    )
  );


  setValue(
    "quotationDuration",
    getPackageDuration(
      pkg
    )
  );


  renderPackageItinerary(
    pkg
  );

}


// ======================================================
// PACKAGE DESTINATION
// ======================================================

function getPackageDestination(
  pkg
) {

  return (
    pkg.destination ||
    pkg.destinations ||
    pkg.location ||
    ""
  );

}


// ======================================================
// PACKAGE DURATION
// ======================================================

function getPackageDuration(
  pkg
) {

  if (
    pkg.duration
  ) {

    return pkg.duration;

  }


  if (
    pkg.nights !== undefined &&
    pkg.days !== undefined
  ) {

    return `${pkg.nights} Nights / ${pkg.days} Days`;

  }


  if (
    pkg.numberOfNights !== undefined &&
    pkg.numberOfDays !== undefined
  ) {

    return `${pkg.numberOfNights} Nights / ${pkg.numberOfDays} Days`;

  }


  return "";

}


// ======================================================
// RENDER PACKAGE ITINERARY
// ======================================================

function renderPackageItinerary(
  pkg
) {

  const container =
    getElement(
      "quotationItinerary"
    );


  const hidden =
    getElement(
      "quotationItineraryData"
    );


  if (!container) return;


  const itinerary =
    extractItinerary(
      pkg
    );


  if (!itinerary.length) {

    container.innerHTML = `
      <div class="quotation-empty-box">
        No itinerary found in this package.
      </div>
    `;


    if (hidden) {

      hidden.value = "";

    }


    return;

  }


  /*
   * IMPORTANT:
   *
   * Package Master stores rich HTML
   * inside description.
   *
   * We intentionally DO NOT use
   * escapeHtml() here.
   *
   * This keeps:
   *
   * <ul>
   * <li>
   * <b>
   * <u>
   * <span style="">
   *
   * etc.
   *
   * exactly as saved in Package Master.
   */

  container.innerHTML =
    itinerary
      .map(
        (day, index) => {

          const title =
            day.title ||
            day.dayTitle ||
            day.heading ||
            `Day ${index + 1}`;


          const description =
            day.description ||
            day.details ||
            day.activities ||
            day.activity ||
            day.plan ||
            "";


          const meals =
            day.meals ||
            "None";


          const overnight =
            day.overnight ||
            "";


          return `

            <div
              class="quotation-itinerary-day"
            >

              <div
                class="quotation-itinerary-day-header"
              >

                <h5>
                  Day ${index + 1}
                  -
                  ${escapeHtml(title)}
                </h5>

              </div>


              <div
                class="quotation-itinerary-description"
              >
                ${sanitizeRichHtml(
                  description
                )}
              </div>


              ${
                meals &&
                meals !== "None"
                  ? `
                    <div class="quotation-itinerary-meta">
                      <strong>Meals:</strong>
                      ${escapeHtml(meals)}
                    </div>
                  `
                  : ""
              }


              ${
                overnight
                  ? `
                    <div class="quotation-itinerary-meta">
                      <strong>Overnight:</strong>
                      ${escapeHtml(overnight)}
                    </div>
                  `
                  : ""
              }

            </div>

          `;

        }
      )
      .join("");


  if (hidden) {

    hidden.value =
      JSON.stringify(
        itinerary
      );

  }

}


// ======================================================
// EXTRACT ITINERARY
// ======================================================

function extractItinerary(
  pkg
) {

  let itinerary =
    pkg.itinerary ||
    pkg.itineraries ||
    pkg.dayWiseItinerary ||
    pkg.daywiseItinerary ||
    pkg.days ||
    [];


  if (
    typeof itinerary ===
    "string"
  ) {

    try {

      itinerary =
        JSON.parse(
          itinerary
        );

    } catch {

      return [];

    }

  }


  if (
    itinerary &&
    !Array.isArray(itinerary) &&
    typeof itinerary === "object"
  ) {

    itinerary =
      Object.keys(
        itinerary
      )
        .sort(
          naturalSort
        )
        .map(
          (key) => {

            const value =
              itinerary[key];


            if (
              typeof value ===
              "string"
            ) {

              return {

                title: key,

                description: value,

                meals: "None",

                overnight: ""

              };

            }


            return {

              day:
                value?.day ||
                key,

              title:
                value?.title ||
                value?.dayTitle ||
                key,

              description:
                value?.description ||
                value?.details ||
                value?.activities ||
                "",

              meals:
                value?.meals ||
                "None",

              overnight:
                value?.overnight ||
                ""

            };

          }
        );

  }


  if (
    !Array.isArray(itinerary)
  ) {

    return [];

  }


  return itinerary.map(
    (item, index) => ({

      day:
        item.day ||
        index + 1,

      title:
        item.title ||
        item.dayTitle ||
        item.heading ||
        `Day ${index + 1}`,

      description:
        item.description ||
        item.details ||
        item.activities ||
        item.activity ||
        item.plan ||
        "",

      meals:
        item.meals ||
        "None",

      overnight:
        item.overnight ||
        ""

    })
  );

}


// ======================================================
// NATURAL SORT
// ======================================================

function naturalSort(
  a,
  b
) {

  return String(a)
    .localeCompare(
      String(b),
      undefined,
      {
        numeric: true
      }
    );

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
          "hotels"
        )
      );


    allHotels =
      snapshot.docs.map(
        (item) => ({

          id: item.id,

          ...item.data()

        })
      );


    allHotels =
      allHotels.filter(
        (hotel) =>
          String(
            hotel.status ||
            "Active"
          )
            .toLowerCase() ===
          "active"
      );


  } catch (error) {

    console.error(
      "Hotel Master loading error:",
      error
    );

  }

}


// ======================================================
// HOTEL ROW
// ======================================================

function addHotelRow(
  hotelData = null
) {

  const container =
    getElement(
      "quotationHotels"
    );


  if (!container) return;


  const row =
    document.createElement(
      "div"
    );


  row.className =
    "quotation-hotel-row";


  row.innerHTML = `

    <div class="form-group">

      <label>
        Destination
      </label>

      <input
        type="text"
        class="quotation-hotel-destination"
        value="${escapeAttribute(
          hotelData?.destination ||
          hotelData?.city ||
          ""
        )}"
        placeholder="e.g. Shillong"
      >

    </div>


    <div class="form-group">

      <label>
        Select Hotel
      </label>

      <select
        class="quotation-hotel-select"
      >

        <option value="">
          Select hotel from Hotel Master
        </option>

        ${getHotelOptions(
          hotelData?.hotelId ||
          hotelData?.id ||
          ""
        )}

      </select>

    </div>


    <div class="form-group">

      <label>
        Hotel Name for Quotation
      </label>

      <input
        type="text"
        class="quotation-hotel-display-name"
        value="${escapeAttribute(
          hotelData?.displayName ||
          hotelData?.hotelName ||
          ""
        )}"
        placeholder="ABC Hotel or Similar"
      >

    </div>


    <div class="form-group">

      <label>
        Category
      </label>

      <input
        type="text"
        class="quotation-hotel-category"
        readonly
        value="${escapeAttribute(
          hotelData?.category ||
          ""
        )}"
      >

    </div>


    <div class="form-group">

      <label>
        Room Type
      </label>

      <input
        type="text"
        class="quotation-hotel-room-type"
        readonly
        value="${escapeAttribute(
          hotelData?.roomType ||
          ""
        )}"
      >

    </div>


    <div class="form-group">

      <label>
        Meal Plan
      </label>

      <input
        type="text"
        class="quotation-hotel-meal-plan"
        readonly
        value="${escapeAttribute(
          hotelData?.mealPlan ||
          ""
        )}"
      >

    </div>


    <div class="form-group">

      <label>
        Nights
      </label>

      <input
        type="number"
        class="quotation-hotel-nights"
        min="0"
        value="${escapeAttribute(
          hotelData?.nights ??
          1
        )}"
      >

    </div>


    <div class="form-group quotation-hotel-remove-wrap">

      <label>
        &nbsp;
      </label>

      <button
        type="button"
        class="danger-btn quotation-remove-hotel"
      >
        Remove
      </button>

    </div>

  `;


  container.appendChild(
    row
  );


  const hotelSelect =
    row.querySelector(
      ".quotation-hotel-select"
    );


  if (hotelSelect) {

    hotelSelect.addEventListener(
      "change",
      () => {

        populateHotelRow(
          row,
          hotelSelect.value
        );

      }
    );

  }


  const removeButton =
    row.querySelector(
      ".quotation-remove-hotel"
    );


  if (removeButton) {

    removeButton.addEventListener(
      "click",
      () => {

        row.remove();

      }
    );

  }


  /*
   * Existing saved hotel:
   * populate fields from Master where possible.
   */

  if (
    hotelData?.hotelId ||
    hotelData?.id
  ) {

    populateHotelRow(
      row,
      hotelData.hotelId ||
      hotelData.id,
      hotelData
    );

  }

}


// ======================================================
// HOTEL OPTIONS
// ======================================================

function getHotelOptions(
  selectedId = ""
) {

  return allHotels
    .map(
      (hotel) => {

        const label =
          getHotelDisplayName(
            hotel
          );


        return `

          <option
            value="${escapeAttribute(
              hotel.id
            )}"
            ${
              hotel.id === selectedId
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(label)}
          </option>

        `;

      }
    )
    .join("");

}


// ======================================================
// HOTEL DISPLAY NAME
// ======================================================

function getHotelDisplayName(
  hotel
) {

  const city =
    hotel.city
      ? ` - ${hotel.city}`
      : "";


  return (
    hotel.name ||
    hotel.hotelName ||
    "Unnamed Hotel"
  ) + city;

}


// ======================================================
// POPULATE HOTEL ROW
// ======================================================

function populateHotelRow(
  row,
  hotelId,
  savedData = null
) {

  const hotel =
    allHotels.find(
      (item) =>
        item.id === hotelId
    );


  if (!hotel) {

    if (savedData) {

      setRowValue(
        row,
        ".quotation-hotel-display-name",
        savedData.displayName ||
        savedData.hotelName ||
        ""
      );

    }

    return;

  }


  setRowValue(
    row,
    ".quotation-hotel-destination",
    hotel.city ||
    savedData?.destination ||
    ""
  );


  setRowValue(
    row,
    ".quotation-hotel-display-name",
    savedData?.displayName ||
    `${hotel.name || hotel.hotelName || ""} or Similar`
  );


  setRowValue(
    row,
    ".quotation-hotel-category",
    hotel.category ||
    ""
  );


  setRowValue(
    row,
    ".quotation-hotel-room-type",
    hotel.roomType ||
    ""
  );


  setRowValue(
    row,
    ".quotation-hotel-meal-plan",
    hotel.mealPlan ||
    ""
  );


  setRowValue(
    row,
    ".quotation-hotel-nights",
    savedData?.nights ??
    1
  );

}


// ======================================================
// CLEAR HOTEL ROWS
// ======================================================

function clearHotelRows() {

  const container =
    getElement(
      "quotationHotels"
    );


  if (!container) return;


  container.innerHTML = "";

}


// ======================================================
// LOAD SAVED HOTELS
// ======================================================

function loadSavedHotels(
  hotels
) {

  clearHotelRows();


  if (
    !Array.isArray(hotels) ||
    !hotels.length
  ) {

    addHotelRow();

    return;

  }


  hotels.forEach(
    (hotel) => {

      addHotelRow(
        hotel
      );

    }
  );

}


// ======================================================
// GET HOTEL DATA
// ======================================================

function getHotelData() {

  const container =
    getElement(
      "quotationHotels"
    );


  if (!container) return [];


  const rows =
    container.querySelectorAll(
      ".quotation-hotel-row"
    );


  return Array.from(
    rows
  )
    .map(
      (row) => {

        const hotelId =
          row.querySelector(
            ".quotation-hotel-select"
          )?.value ||
          "";


        const hotel =
          allHotels.find(
            (item) =>
              item.id === hotelId
          );


        return {

          hotelId:

            hotelId,

          hotelName:

            row.querySelector(
              ".quotation-hotel-display-name"
            )?.value
              ?.trim() || "",

          displayName:

            row.querySelector(
              ".quotation-hotel-display-name"
            )?.value
              ?.trim() || "",

          destination:

            row.querySelector(
              ".quotation-hotel-destination"
            )?.value
              ?.trim() || "",

          category:

            row.querySelector(
              ".quotation-hotel-category"
            )?.value
              ?.trim() || "",

          roomType:

            row.querySelector(
              ".quotation-hotel-room-type"
            )?.value
              ?.trim() || "",

          mealPlan:

            row.querySelector(
              ".quotation-hotel-meal-plan"
            )?.value
              ?.trim() || "",

          nights:

            Number(
              row.querySelector(
                ".quotation-hotel-nights"
              )?.value || 0
            ),

          /*
           * IMPORTANT:
           *
           * Hotel rate intentionally NOT saved.
           */

          masterHotelName:
            hotel?.name ||
            hotel?.hotelName ||
            ""

        };

      }
    )
    .filter(
      (hotel) =>
        hotel.hotelName ||
        hotel.hotelId ||
        hotel.destination
    );

}


// ======================================================
// LOAD CABS
// ======================================================

async function loadCabs() {

  const select =
    getElement(
      "quotationVehicle"
    );


  if (!select) return;


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "cabs"
        )
      );


    allCabs =
      snapshot.docs.map(
        (item) => ({

          id: item.id,

          ...item.data()

        })
      );


    allCabs =
      allCabs.filter(
        (cab) => {

          const status =
            String(
              cab.status ||
              "Available"
            )
              .toLowerCase();


          return (
            status ===
            "available"
          );

        }
      );


    select.innerHTML = `
      <option value="">
        Select vehicle
      </option>
    `;


    allCabs.forEach(
      (cab) => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          cab.id;


        option.textContent =
          getCabDisplayName(
            cab
          );


        select.appendChild(
          option
        );

      }
    );


  } catch (error) {

    console.error(
      "Cab Master loading error:",
      error
    );

  }

}


// ======================================================
// CAB DISPLAY NAME
// ======================================================

function getCabDisplayName(
  cab
) {

  const capacity =
    cab.capacity
      ? ` - ${cab.capacity} Seater`
      : "";


  const type =
    cab.type
      ? ` (${cab.type})`
      : "";


  return (
    cab.name ||
    "Unnamed Vehicle"
  ) +
  capacity +
  type;

}


// ======================================================
// VEHICLE CHANGE
// ======================================================

function handleVehicleChange() {

  const vehicleId =
    getValue(
      "quotationVehicle"
    );


  if (!vehicleId) {

    setValue(
      "quotationVehicleType",
      ""
    );

    setValue(
      "quotationVehicleCapacity",
      ""
    );

    setValue(
      "quotationVehicleNumber",
      ""
    );

    return;

  }


  const cab =
    allCabs.find(
      (item) =>
        item.id === vehicleId
    );


  if (!cab) return;


  setValue(
    "quotationVehicleType",
    cab.type ||
    ""
  );


  setValue(
    "quotationVehicleCapacity",
    cab.capacity ||
    ""
  );


  setValue(
    "quotationVehicleNumber",
    cab.vehicleNumber ||
    ""
  );

}


// ======================================================
// CLEAR PACKAGE INFORMATION
// ======================================================

function clearPackageInformation() {

  setValue(
    "quotationDestination",
    ""
  );


  setValue(
    "quotationDuration",
    ""
  );


  const container =
    getElement(
      "quotationItinerary"
    );


  if (container) {

    container.innerHTML = `
      <div class="quotation-empty-box">
        Select a package to load the itinerary.
      </div>
    `;

  }


  setValue(
    "quotationItineraryData",
    ""
  );

}


// ======================================================
// OPEN MODAL
// ======================================================

function openQuotationModal(
  quotation = null
) {

  const modal =
    getElement(
      "quotationModal"
    );


  const form =
    getElement(
      "quotationForm"
    );


  const title =
    getElement(
      "quotationModalTitle"
    );


  const message =
    getElement(
      "quotationFormMessage"
    );


  if (!modal || !form) return;


  modal.style.display =
    "flex";


  if (message) {

    message.textContent =
      "";

  }


  if (quotation) {

    if (title) {

      title.textContent =
        "Edit Quotation";

    }


    setValue(
      "quotationDocId",
      quotation.id
    );


    setValue(
      "quotationEnquiry",
      quotation.enquiryId ||
      quotation.enquiry ||
      ""
    );


    setValue(
      "quotationCustomer",
      quotation.customer ||
      ""
    );


    setValue(
      "quotationCustomerMobile",
      quotation.customerMobile ||
      ""
    );


    setValue(
      "quotationCustomerEmail",
      quotation.customerEmail ||
      ""
    );


    setValue(
      "quotationPackage",
      quotation.packageId ||
      ""
    );


    setValue(
      "quotationDestination",
      quotation.destination ||
      ""
    );


    setValue(
      "quotationDuration",
      quotation.duration ||
      ""
    );


    setValue(
      "quotationStartDate",
      quotation.startDate ||
      ""
    );


    setValue(
      "quotationEndDate",
      quotation.endDate ||
      ""
    );


    setValue(
      "quotationAdults",
      quotation.adults ??
      2
    );


    setValue(
      "quotationChildren",
      quotation.children ??
      0
    );


    setValue(
      "quotationRooms",
      quotation.rooms ??
      1
    );


    setValue(
      "quotationValidUntil",
      quotation.validUntil ||
      ""
    );


    setValue(
      "quotationVehicle",
      quotation.vehicleId ||
      ""
    );


    setValue(
      "quotationVehicleType",
      quotation.vehicleType ||
      ""
    );


    setValue(
      "quotationVehicleCapacity",
      quotation.vehicleCapacity ||
      ""
    );


    setValue(
      "quotationVehicleNumber",
      quotation.vehicleNumber ||
      ""
    );


    setValue(
      "quotationPackageCost",
      quotation.packageCost ??
      0
    );


    setValue(
      "quotationDiscount",
      quotation.discount ??
      0
    );


    setValue(
      "quotationGST",
      quotation.gst ??
      0
    );


    setValue(
      "quotationGrandTotal",
      quotation.grandTotal ??
      0
    );


    setValue(
      "quotationTotalPackageCost",
      quotation.totalPackageCost ??
      0
    );


    setValue(
      "quotationPerPerson",
      quotation.perPerson ??
      0
    );


    setValue(
      "quotationStatus",
      quotation.status ||
      "Draft"
    );


    setValue(
      "quotationNotes",
      quotation.notes ||
      ""
    );


    /*
     * Render the saved itinerary exactly
     * from the quotation snapshot.
     */

    renderPackageItinerary(
      {
        itinerary:
          quotation.itinerary ||
          []
      }
    );


    loadSavedHotels(
      quotation.hotels ||
      []
    );


    if (
      quotation.vehicleId
    ) {

      setValue(
        "quotationVehicle",
        quotation.vehicleId
      );

      handleVehicleChange();

    }


  } else {

    if (title) {

      title.textContent =
        "Add Quotation";

    }


    form.reset();


    setValue(
      "quotationDocId",
      ""
    );


    setValue(
      "quotationAdults",
      2
    );


    setValue(
      "quotationChildren",
      0
    );


    setValue(
      "quotationRooms",
      1
    );


    setValue(
      "quotationStatus",
      "Draft"
    );


    setValue(
      "quotationPackageCost",
      0
    );


    setValue(
      "quotationDiscount",
      0
    );


    setValue(
      "quotationGST",
      0
    );


    clearHotelRows();


    addHotelRow();


    clearPackageInformation();


    setValue(
      "quotationVehicleType",
      ""
    );


    setValue(
      "quotationVehicleCapacity",
      ""
    );


    setValue(
      "quotationVehicleNumber",
      ""
    );

  }


  calculateQuotationPricing();

}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeQuotationModal() {

  const modal =
    getElement(
      "quotationModal"
    );


  const form =
    getElement(
      "quotationForm"
    );


  if (modal) {

    modal.style.display =
      "none";

  }


  if (form) {

    form.reset();

  }


  setValue(
    "quotationDocId",
    ""
  );


  setValue(
    "quotationAdults",
    2
  );


  setValue(
    "quotationChildren",
    0
  );


  setValue(
    "quotationRooms",
    1
  );


  setValue(
    "quotationStatus",
    "Draft"
  );


  clearHotelRows();

}


// ======================================================
// SAVE QUOTATION
// ======================================================

async function saveQuotation(
  event
) {

  event.preventDefault();


  const customer =
    getValue(
      "quotationCustomer"
    );


  const packageId =
    getValue(
      "quotationPackage"
    );


  if (!customer) {

    showQuotationMessage(
      "Customer name is required.",
      "#dc2626"
    );

    return;

  }


  if (!packageId) {

    showQuotationMessage(
      "Please select a package.",
      "#dc2626"
    );

    return;

  }


  calculateQuotationPricing();


  showQuotationMessage(
    "Saving quotation...",
    "#2563eb"
  );


  const selectedPackage =
    allPackages.find(
      (item) =>
        item.id === packageId
    );


  /*
   * IMPORTANT:
   *
   * Save a SNAPSHOT of the package itinerary.
   *
   * Later if Package Master changes,
   * this quotation will remain unchanged.
   */

  const itinerary =
    getSavedItinerary();


  const hotels =
    getHotelData();


  const vehicleId =
    getValue(
      "quotationVehicle"
    );


  const selectedCab =
    allCabs.find(
      (item) =>
        item.id === vehicleId
    );


  const quotationData = {

    enquiryId:
      getValue(
        "quotationEnquiry"
      ),


    customer:
      customer,


    customerMobile:
      getValue(
        "quotationCustomerMobile"
      ),


    customerEmail:
      getValue(
        "quotationCustomerEmail"
      ),


    packageId:
      packageId,


    packageName:
      selectedPackage
        ? getPackageDisplayName(
            selectedPackage
          )
        : getSelectedPackageName(),


    destination:
      getValue(
        "quotationDestination"
      ),


    duration:
      getValue(
        "quotationDuration"
      ),


    startDate:
      getValue(
        "quotationStartDate"
      ),


    endDate:
      getValue(
        "quotationEndDate"
      ),


    adults:
      Number(
        getValue(
          "quotationAdults"
        ) || 0
      ),


    children:
      Number(
        getValue(
          "quotationChildren"
        ) || 0
      ),


    rooms:
      Number(
        getValue(
          "quotationRooms"
        ) || 0
      ),


    validUntil:
      getValue(
        "quotationValidUntil"
      ),


    /*
     * Package Master snapshot.
     */

    itinerary:
      itinerary,


    /*
     * Hotel Master snapshot.
     *
     * NO RATE.
     */

    hotels:
      hotels,


    /*
     * Cab Master snapshot.
     *
     * NO RATE.
     */

    vehicleId:
      vehicleId,


    vehicle:
      selectedCab?.name ||
      "",


    vehicleType:
      selectedCab?.type ||
      getValue(
        "quotationVehicleType"
      ),


    vehicleCapacity:
      selectedCab?.capacity ||
      getValue(
        "quotationVehicleCapacity"
      ),


    vehicleNumber:
      selectedCab?.vehicleNumber ||
      getValue(
        "quotationVehicleNumber"
      ),


    /*
     * PRICING
     */

    packageCost:
      Number(
        getValue(
          "quotationPackageCost"
        ) || 0
      ),


    discount:
      Number(
        getValue(
          "quotationDiscount"
        ) || 0
      ),


    gst:
      Number(
        getValue(
          "quotationGST"
        ) || 0
      ),


    grandTotal:
      Number(
        getValue(
          "quotationGrandTotal"
        ) || 0
      ),


    totalPackageCost:
      Number(
        getValue(
          "quotationTotalPackageCost"
        ) || 0
      ),


    perPerson:
      Number(
        getValue(
          "quotationPerPerson"
        ) || 0
      ),


    status:
      getValue(
        "quotationStatus"
      ) || "Draft",


    notes:
      getValue(
        "quotationNotes"
      ),


    updatedAt:
      serverTimestamp()

  };


  try {

    const existingId =
      getValue(
        "quotationDocId"
      );


    // ==================================================
    // EDIT
    // ==================================================

    if (existingId) {

      await updateDoc(

        doc(
          db,
          "quotations",
          existingId
        ),

        quotationData

      );


      showQuotationMessage(
        "Quotation updated successfully.",
        "#15803d"
      );

    }


    // ==================================================
    // NEW
    // ==================================================

    else {

      quotationData.createdAt =
        serverTimestamp();


      quotationData.createdBy =
        auth.currentUser
          ? auth.currentUser.email
          : "";


      const quotationRef =
        await addDoc(

          collection(
            db,
            "quotations"
          ),

          quotationData

        );


      const quotationId =
        "QT-" +
        quotationRef.id
          .substring(0, 6)
          .toUpperCase();


      await updateDoc(

        quotationRef,

        {
          quotationId:
            quotationId
        }

      );


      showQuotationMessage(
        "Quotation saved successfully.",
        "#15803d"
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
      "Could not save quotation. Check Firestore rules and browser console.",
      "#dc2626"
    );

  }

}


// ======================================================
// GET SAVED ITINERARY
// ======================================================

function getSavedItinerary() {

  const hidden =
    getElement(
      "quotationItineraryData"
    );


  if (!hidden) return [];


  try {

    return JSON.parse(
      hidden.value ||
      "[]"
    );

  } catch {

    return [];

  }

}


// ======================================================
// SELECTED PACKAGE NAME
// ======================================================

function getSelectedPackageName() {

  const select =
    getElement(
      "quotationPackage"
    );


  if (!select) return "";


  const option =
    select.options[
      select.selectedIndex
    ];


  return option
    ? option.textContent.trim()
    : "";

}


// ======================================================
// LOAD QUOTATIONS
// ======================================================

async function loadQuotations() {

  const table =
    getElement(
      "quotationsTableBody"
    );


  if (!table) return;


  table.innerHTML = `
    <tr>
      <td
        colspan="8"
        class="empty-table"
      >
        Loading quotations...
      </td>
    </tr>
  `;


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "quotations"
        )
      );


    allQuotations =
      snapshot.docs.map(
        (item) => ({

          id:
            item.id,

          ...item.data()

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


// ======================================================
// RENDER QUOTATIONS
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
    quotations
      .map(
        (quotation) => {

          const pax =
            Number(
              quotation.adults ||
              0
            ) +
            Number(
              quotation.children ||
              0
            );


          const total =
            Number(
              quotation.grandTotal ??
              quotation.totalPackageCost ??
              0
            );


          return `

            <tr>

              <td>

                <strong>
                  ${escapeHtml(
                    quotation.quotationId ||
                    "-"
                  )}
                </strong>

              </td>


              <td>

                ${escapeHtml(
                  quotation.customer ||
                  "-"
                )}

                ${
                  quotation.customerMobile
                    ? `
                      <br>
                      <small>
                        ${escapeHtml(
                          quotation.customerMobile
                        )}
                      </small>
                    `
                    : ""
                }

              </td>


              <td>

                <strong>
                  ${escapeHtml(
                    quotation.packageName ||
                    "-"
                  )}
                </strong>

                ${
                  quotation.destination
                    ? `
                      <br>
                      <small>
                        ${escapeHtml(
                          quotation.destination
                        )}
                      </small>
                    `
                    : ""
                }

              </td>


              <td>

                ${escapeHtml(
                  quotation.startDate ||
                  "-"
                )}

              </td>


              <td>
                ${pax}
              </td>


              <td>

                ₹${total.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }
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
  class="edit-btn"
  data-quotation-edit-id="${quotation.id}"
>
  Edit
</button>

<button
  class="primary-btn"
  data-quotation-pdf-id="${quotation.id}"
  style="padding:7px 11px; margin-right:5px;"
>
  PDF
</button>

<button
  class="secondary-btn"
  data-quotation-share-id="${quotation.id}"
  style="padding:7px 11px; margin-right:5px;"
>
  Share
</button>

<button
  class="danger-btn"
  data-quotation-delete-id="${quotation.id}"
>
  Delete
</button>
              </td>

            </tr>

          `;

        }
      )
      .join("");


  setupQuotationRowActions();

}


// ======================================================
// ROW ACTIONS
// ======================================================

function setupQuotationRowActions() {

  // ==================================================
  // EDIT BUTTON
  // ==================================================

  document
    .querySelectorAll(
      "[data-quotation-edit-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const quotation =
              allQuotations.find(
                (item) =>
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


  // ==================================================
  // PDF BUTTON
  // ==================================================

  document
    .querySelectorAll(
      "[data-quotation-pdf-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const quotation =
              allQuotations.find(
                (item) =>
                  item.id ===
                  button.dataset
                    .quotationPdfId
              );

            if (!quotation) {

              alert(
                "Quotation not found."
              );

              return;

            }

            generateQuotationPDF(
              quotation
            );

          }
        );

      }
    );


  // ==================================================
  // SHARE BUTTON
  // ==================================================

  document
    .querySelectorAll(
      "[data-quotation-share-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const quotation =
              allQuotations.find(
                (item) =>
                  item.id ===
                  button.dataset
                    .quotationShareId
              );

            if (!quotation) {

              alert(
                "Quotation not found."
              );

              return;

            }

            shareQuotationPDF(
              quotation
            );

          }
        );

      }
    );


  // ==================================================
  // DELETE BUTTON
  // ==================================================

  document
    .querySelectorAll(
      "[data-quotation-delete-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            deleteQuotation(
              button.dataset
                .quotationDeleteId
            );

          }
        );

      }
    );

}

// ======================================================
// DELETE QUOTATION
// ======================================================

async function deleteQuotation(
  id
) {

  const quotation =
    allQuotations.find(
      (item) =>
        item.id === id
    );


  const confirmed =
    confirm(
      `Delete quotation "${quotation?.quotationId || ""}"?`
    );


  if (!confirmed) return;


  try {

    await deleteDoc(
      doc(
        db,
        "quotations",
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


// ======================================================
// SEARCH
// ======================================================

function setupQuotationSearch() {

  const searchBox =
    getElement(
      "quotationSearch"
    );


  if (!searchBox) return;


  searchBox.addEventListener(
    "input",
    () => {

      const search =
        searchBox.value
          .toLowerCase()
          .trim();


      if (!search) {

        renderQuotations(
          allQuotations
        );

        return;

      }


      const filtered =
        allQuotations.filter(
          (quotation) => {

            return (

              String(
                quotation.quotationId ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                quotation.customer ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                quotation.packageName ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                quotation.destination ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                quotation.status ||
                ""
              )
                .toLowerCase()
                .includes(search)

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
// MESSAGE
// ======================================================

function showQuotationMessage(
  text,
  color
) {

  const message =
    getElement(
      "quotationFormMessage"
    );


  if (!message) return;


  message.style.color =
    color;


  message.textContent =
    text;

}


// ======================================================
// VALUE HELPERS
// ======================================================

function getValue(id) {

  return (
    getElement(id)
      ?.value
      ?.trim() || ""
  );

}


function setValue(
  id,
  value
) {

  const element =
    getElement(id);


  if (element) {

    element.value =
      value ?? "";

  }

}


// ======================================================
// ROW VALUE HELPER
// ======================================================

function setRowValue(
  row,
  selector,
  value
) {

  const element =
    row.querySelector(
      selector
    );


  if (element) {

    element.value =
      value ?? "";

  }

}


// ======================================================
// MONEY
// ======================================================

function roundMoney(
  value
) {

  return Math.round(
    Number(value || 0) *
    100
  ) / 100;

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )

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
// ATTRIBUTE ESCAPE
// ======================================================

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


// ======================================================
// RICH HTML SANITIZER
// ======================================================

function sanitizeRichHtml(
  html
) {

  if (!html) return "";


  const parser =
    new DOMParser();


  const parsed =
    parser.parseFromString(
      String(html),
      "text/html"
    );


  /*
   * Remove dangerous elements.
   */

  parsed
    .querySelectorAll(
      "script, iframe, object, embed, form, link, meta"
    )
    .forEach(
      (element) =>
        element.remove()
    );


  /*
   * Remove event handlers
   * such as onclick, onerror etc.
   */

  parsed
    .querySelectorAll("*")
    .forEach(
      (element) => {

        Array.from(
          element.attributes
        )
          .forEach(
            (attribute) => {

              if (
                attribute.name
                  .toLowerCase()
                  .startsWith(
                    "on"
                  )
              ) {

                element.removeAttribute(
                  attribute.name
                );

              }


              if (
                (
                  attribute.name ===
                  "href"
                ) &&
                /^javascript:/i.test(
                  attribute.value
                )
              ) {

                element.removeAttribute(
                  "href"
                );

              }

            }
          );

      }
    );


  return parsed.body.innerHTML;

}
