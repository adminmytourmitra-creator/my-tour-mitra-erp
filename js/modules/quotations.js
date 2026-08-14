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
let allEnquiries = [];
let allPackages = [];


// ======================================================
// INITIALIZE
// ======================================================

export function initQuotations() {

  setupQuotationButtons();

  setupQuotationForm();

  setupQuotationSearch();

  setupPricingCalculation();

  setupHotelButton();

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
    loadQuotations()
  ]);

}


// ======================================================
// BUTTONS
// ======================================================

function setupQuotationButtons() {

  const addButton = getElement("addQuotationBtn");

  const closeButton = getElement("closeQuotationModal");

  const cancelButton = getElement("cancelQuotationBtn");


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


  fields.forEach((id) => {

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

  });


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
// HOTEL BUTTON
// ======================================================

function setupHotelButton() {

  const button =
    getElement(
      "addQuotationHotelBtn"
    );

  if (!button) return;


  button.addEventListener(
    "click",
    addHotelRow
  );

}


// ======================================================
// ADD HOTEL ROW
// ======================================================

function addHotelRow() {

  const container =
    getElement(
      "quotationHotels"
    );

  if (!container) return;


  const row =
    document.createElement("div");

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
        placeholder="e.g. Shillong"
      >

    </div>


    <div class="form-group">

      <label>
        Hotel Name
      </label>

      <input
        type="text"
        class="quotation-hotel-name"
        placeholder="ABC Hotel or Similar"
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
        value="1"
      >

    </div>

  `;


  container.appendChild(row);

}


// ======================================================
// LOAD ENQUIRIES
// ======================================================

async function loadEnquiries() {

  const select =
    getElement(
      "quotationEnquiry"
    );

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
          document.createElement("option");


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
      "Enquiry loading error:",
      error
    );

  }

}


// ======================================================
// ENQUIRY DISPLAY NAME
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


  // Try to connect enquiry package
  const enquiryPackage =
    enquiry.package ||
    enquiry.packageName ||
    enquiry.tourPackage ||
    "";


  if (enquiryPackage) {

    selectPackageByName(
      enquiryPackage
    );

  }

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
    pkg.packageName ||
    pkg.name ||
    pkg.title ||
    pkg.packageTitle ||
    "Unnamed Package"
  );

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


  const search =
    String(packageName)
      .toLowerCase()
      .trim();


  const match =
    allPackages.find(
      (pkg) => {

        const name =
          getPackageDisplayName(
            pkg
          )
            .toLowerCase()
            .trim();


        return (
          name === search ||
          name.includes(search) ||
          search.includes(name)
        );

      }
    );


  if (!match) return;


  select.value =
    match.id;


  handlePackageChange();

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


  // Destination

  setValue(
    "quotationDestination",
    pkg.destination ||
    pkg.destinations ||
    pkg.location ||
    ""
  );


  // Duration

  setValue(
    "quotationDuration",
    getPackageDuration(
      pkg
    )
  );


  // Package cost

  const packageCost =
    pkg.packageCost ??
    pkg.totalCost ??
    pkg.cost ??
    pkg.price ??
    pkg.totalPrice;


  if (
    packageCost !== undefined &&
    packageCost !== null &&
    packageCost !== ""
  ) {

    setValue(
      "quotationPackageCost",
      packageCost
    );

  }


  // Itinerary

  renderPackageItinerary(
    pkg
  );


  calculateQuotationPricing();

}


// ======================================================
// CLEAR PACKAGE
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


  const itinerary =
    getElement(
      "quotationItinerary"
    );


  if (itinerary) {

    itinerary.innerHTML = `

      <div class="quotation-empty-box">

        Select a package to load the itinerary.

      </div>

    `;

  }

}


// ======================================================
// PACKAGE DURATION
// ======================================================

function getPackageDuration(
  pkg
) {

  if (pkg.duration) {
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


          return `

            <div class="quotation-itinerary-day">

              <h5>
                ${escapeHtml(title)}
              </h5>

              <p>
                ${escapeHtml(description)}
              </p>

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


  // If itinerary is JSON string

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


  // If Firestore map/object

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

                description: value

              };

            }


            return {

              title:
                value?.title ||
                value?.day ||
                key,

              description:
                value?.description ||
                value?.details ||
                value?.activities ||
                ""

            };

          }
        );

  }


  if (!Array.isArray(itinerary)) {

    return [];

  }


  return itinerary;

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
      quotation.vehicle ||
      ""
    );


    setValue(
      "quotationVehicleType",
      quotation.vehicleType ||
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


    clearPackageInformation();

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


  const itinerary =
    getSavedItinerary();


  const hotels =
    getHotelData();


  const quotationData = {

    quotationId:
      getValue(
        "quotationId"
      ) || "",


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
      getSelectedPackageName(),


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


    itinerary:
      itinerary,


    hotels:
      hotels,


    vehicle:
      getValue(
        "quotationVehicle"
      ),


    vehicleType:
      getValue(
        "quotationVehicleType"
      ),


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
    // UPDATE
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
    // CREATE
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
        createQuotationId(
          quotationRef.id
        );


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
      "Could not save quotation. Check Firestore rules.",
      "#dc2626"
    );

  }

}


// ======================================================
// QUOTATION ID
// ======================================================

function createQuotationId(
  firestoreId
) {

  return (
    "QT-" +
    String(
      firestoreId
    )
      .substring(0, 6)
      .toUpperCase()
  );

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
// RENDER
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
              quotation.adults || 0
            ) +
            Number(
              quotation.children || 0
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

                <span class="status-badge">

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
                  data-quotation-edit-id="${quotation.id}"
                >
                  Edit
                </button>


                <button
                  type="button"
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
// DELETE
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

            return [

              quotation.quotationId,

              quotation.customer,

              quotation.packageName,

              quotation.destination,

              quotation.status,

              quotation.customerMobile,

              quotation.customerEmail

            ]
              .filter(Boolean)
              .some(
                (value) =>
                  String(value)
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
// HOTEL DATA
// ======================================================

function getHotelData() {

  const rows =
    document.querySelectorAll(
      ".quotation-hotel-row"
    );


  return Array.from(rows)
    .map(
      (row) => ({

        destination:
          row.querySelector(
            ".quotation-hotel-destination"
          )?.value
          ?.trim() || "",


        hotelName:
          row.querySelector(
            ".quotation-hotel-name"
          )?.value
          ?.trim() || "",


        nights:
          Number(
            row.querySelector(
              ".quotation-hotel-nights"
            )?.value || 0
          )

      })
    )
    .filter(
      (hotel) =>
        hotel.destination ||
        hotel.hotelName
    );

}


// ======================================================
// SAVED ITINERARY
// ======================================================

function getSavedItinerary() {

  const hidden =
    getElement(
      "quotationItineraryData"
    );


  if (!hidden?.value) {

    return [];

  }


  try {

    return JSON.parse(
      hidden.value
    );

  } catch {

    return [];

  }

}


// ======================================================
// LOAD SAVED HOTELS
// ======================================================

function loadSavedHotels(
  hotels
) {

  const container =
    getElement(
      "quotationHotels"
    );


  if (!container) return;


  clearHotelRows();


  if (
    !Array.isArray(hotels) ||
    !hotels.length
  ) {

    return;

  }


  const first =
    hotels[0];


  setHotelRow(
    container.querySelector(
      ".quotation-hotel-row"
    ),
    first
  );


  hotels
    .slice(1)
    .forEach(
      (hotel) => {

        addHotelRow();


        const rows =
          container.querySelectorAll(
            ".quotation-hotel-row"
          );


        setHotelRow(
          rows[rows.length - 1],
          hotel
        );

      }
    );

}


// ======================================================
// SET HOTEL ROW
// ======================================================

function setHotelRow(
  row,
  hotel
) {

  if (!row || !hotel) return;


  const destination =
    row.querySelector(
      ".quotation-hotel-destination"
    );


  const name =
    row.querySelector(
      ".quotation-hotel-name"
    );


  const nights =
    row.querySelector(
      ".quotation-hotel-nights"
    );


  if (destination) {

    destination.value =
      hotel.destination ||
      "";

  }


  if (name) {

    name.value =
      hotel.hotelName ||
      "";

  }


  if (nights) {

    nights.value =
      hotel.nights ??
      1;

  }

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


  container.innerHTML = `

    <div class="quotation-hotel-row">

      <div class="form-group">

        <label>
          Destination
        </label>

        <input
          type="text"
          class="quotation-hotel-destination"
          placeholder="e.g. Shillong"
        >

      </div>


      <div class="form-group">

        <label>
          Hotel Name
        </label>

        <input
          type="text"
          class="quotation-hotel-name"
          placeholder="ABC Hotel or Similar"
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
          value="1"
        >

      </div>

    </div>

  `;

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
// VALUE
// ======================================================

function getValue(id) {

  const element =
    getElement(id);


  if (!element) return "";


  return String(
    element.value ?? ""
  ).trim();

}


function setValue(
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
// MONEY ROUND
// ======================================================

function roundMoney(
  value
) {

  return Math.round(
    Number(value || 0) * 100
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
