// ======================================================
// ENQUIRIES MODULE
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
// MODULE STATE
// ======================================================

let allEnquiries = [];
let allCustomers = [];


// ======================================================
// INITIALIZE ENQUIRIES MODULE
// ======================================================

export function initEnquiries() {

  const addButton =
    document.getElementById("addEnquiryBtn");

  const closeButton =
    document.getElementById("closeEnquiryModal");

  const cancelButton =
    document.getElementById("cancelEnquiryBtn");

  const form =
    document.getElementById("enquiryForm");

  const search =
    document.getElementById("enquirySearch");


  if (addButton) {
    addButton.addEventListener(
      "click",
      openAddEnquiry
    );
  }


  if (closeButton) {
    closeButton.addEventListener(
      "click",
      closeEnquiryModal
    );
  }


  if (cancelButton) {
    cancelButton.addEventListener(
      "click",
      closeEnquiryModal
    );
  }


  if (form) {
    form.addEventListener(
      "submit",
      saveEnquiry
    );
  }


  if (search) {
    search.addEventListener(
      "input",
      handleEnquirySearch
    );
  }


  loadEnquiries();
}


// ======================================================
// LOAD CUSTOMERS FOR DROPDOWN
// ======================================================

async function loadCustomerDropdown() {

  const dropdown =
    document.getElementById(
      "enquiryCustomer"
    );


  if (!dropdown) {
    return;
  }


  dropdown.innerHTML = `
    <option value="">
      Loading customers...
    </option>
  `;


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "customers"
        )
      );


    allCustomers =
      snapshot.docs.map(
        (customerDoc) => ({
          id: customerDoc.id,
          ...customerDoc.data()
        })
      );


    dropdown.innerHTML = `
      <option value="">
        Select Customer
      </option>
    `;


    allCustomers.forEach(
      (customer) => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          customer.id;


        option.textContent =
          `${customer.name || "Unnamed"} - ${customer.mobile || ""}`;


        dropdown.appendChild(
          option
        );

      }
    );


  } catch (error) {

    console.error(
      "Error loading customers:",
      error
    );


    dropdown.innerHTML = `
      <option value="">
        Unable to load customers
      </option>
    `;

  }

}


// ======================================================
// OPEN ADD ENQUIRY
// ======================================================

async function openAddEnquiry() {

  const modal =
    document.getElementById(
      "enquiryModal"
    );


  const form =
    document.getElementById(
      "enquiryForm"
    );


  if (!modal || !form) {
    return;
  }


  form.reset();


  document.getElementById(
    "enquiryDocId"
  ).value = "";


  document.getElementById(
    "enquiryModalTitle"
  ).textContent =
    "Add Enquiry";


  document.getElementById(
    "enquiryAdults"
  ).value = 1;


  document.getElementById(
    "enquiryChildren"
  ).value = 0;


  document.getElementById(
    "enquiryInfants"
  ).value = 0;


  clearEnquiryMessage();


  modal.style.display =
    "flex";


  await loadCustomerDropdown();
}


// ======================================================
// OPEN EDIT ENQUIRY
// ======================================================

async function openEditEnquiry(enquiry) {

  const modal =
    document.getElementById(
      "enquiryModal"
    );


  if (!modal) {
    return;
  }


  document.getElementById(
    "enquiryModalTitle"
  ).textContent =
    "Edit Enquiry";


  document.getElementById(
    "enquiryDocId"
  ).value =
    enquiry.id || "";


  document.getElementById(
    "enquiryDestination"
  ).value =
    enquiry.destination || "";


  document.getElementById(
    "enquiryStartDate"
  ).value =
    enquiry.startDate || "";


  document.getElementById(
    "enquiryEndDate"
  ).value =
    enquiry.endDate || "";


  document.getElementById(
    "enquiryAdults"
  ).value =
    enquiry.adults ?? 1;


  document.getElementById(
    "enquiryChildren"
  ).value =
    enquiry.children ?? 0;


  document.getElementById(
    "enquiryInfants"
  ).value =
    enquiry.infants ?? 0;


  document.getElementById(
    "enquiryTripType"
  ).value =
    enquiry.tripType || "Family";


  document.getElementById(
    "enquiryBudget"
  ).value =
    enquiry.budget || "";


  document.getElementById(
    "enquirySource"
  ).value =
    enquiry.source || "Direct";


  document.getElementById(
    "enquiryStatus"
  ).value =
    enquiry.status || "New";


  document.getElementById(
    "enquiryNotes"
  ).value =
    enquiry.notes || "";


  clearEnquiryMessage();


  modal.style.display =
    "flex";


  await loadCustomerDropdown();


  document.getElementById(
    "enquiryCustomer"
  ).value =
    enquiry.customerDocId || "";

}


// ======================================================
// CLOSE ENQUIRY MODAL
// ======================================================

function closeEnquiryModal() {

  const modal =
    document.getElementById(
      "enquiryModal"
    );


  const form =
    document.getElementById(
      "enquiryForm"
    );


  if (modal) {
    modal.style.display =
      "none";
  }


  if (form) {
    form.reset();
  }


  const docId =
    document.getElementById(
      "enquiryDocId"
    );


  if (docId) {
    docId.value = "";
  }


  clearEnquiryMessage();
}


// ======================================================
// SAVE ENQUIRY
// ======================================================

async function saveEnquiry(event) {

  event.preventDefault();


  showEnquiryMessage(
    "Saving enquiry...",
    "#1769e0"
  );


  const customerDocId =
    getValue(
      "enquiryCustomer"
    );


  if (!customerDocId) {

    showEnquiryMessage(
      "Please select a customer.",
      "#dc2626"
    );

    return;
  }


  const selectedCustomer =
    allCustomers.find(
      (customer) =>
        customer.id ===
        customerDocId
    );


  const enquiryData = {

    customerDocId:
      customerDocId,

    customerName:
      selectedCustomer?.name || "",

    customerMobile:
      selectedCustomer?.mobile || "",

    destination:
      getValue(
        "enquiryDestination"
      ),

    startDate:
      getValue(
        "enquiryStartDate"
      ),

    endDate:
      getValue(
        "enquiryEndDate"
      ),

    adults:
      Number(
        getValue(
          "enquiryAdults"
        ) || 0
      ),

    children:
      Number(
        getValue(
          "enquiryChildren"
        ) || 0
      ),

    infants:
      Number(
        getValue(
          "enquiryInfants"
        ) || 0
      ),

    tripType:
      getValue(
        "enquiryTripType"
      ) || "Family",

    budget:
      Number(
        getValue(
          "enquiryBudget"
        ) || 0
      ),

    source:
      getValue(
        "enquirySource"
      ) || "Direct",

    status:
      getValue(
        "enquiryStatus"
      ) || "New",

    notes:
      getValue(
        "enquiryNotes"
      ),

    updatedAt:
      serverTimestamp()

  };


  try {

    const existingId =
      getValue(
        "enquiryDocId"
      );


    // ==================================================
    // UPDATE EXISTING ENQUIRY
    // ==================================================

    if (existingId) {

      await updateDoc(
        doc(
          db,
          "enquiries",
          existingId
        ),
        enquiryData
      );


      showEnquiryMessage(
        "Enquiry updated successfully.",
        "#15803d"
      );

    }


    // ==================================================
    // CREATE NEW ENQUIRY
    // ==================================================

    else {

      enquiryData.createdAt =
        serverTimestamp();


      enquiryData.createdBy =
        auth.currentUser
          ? auth.currentUser.email
          : "";


      const enquiryRef =
        await addDoc(
          collection(
            db,
            "enquiries"
          ),
          enquiryData
        );


      const enquiryId =
        "ENQ-" +
        enquiryRef.id
          .substring(0, 6)
          .toUpperCase();


      await updateDoc(
        enquiryRef,
        {
          enquiryId:
            enquiryId
        }
      );


      showEnquiryMessage(
        "Enquiry saved successfully.",
        "#15803d"
      );

    }


    await loadEnquiries();


    setTimeout(
      () => {
        closeEnquiryModal();
      },
      700
    );


  } catch (error) {

    console.error(
      "Error saving enquiry:",
      error
    );


    showEnquiryMessage(
      "Could not save enquiry. Please check Firebase.",
      "#dc2626"
    );

  }

}


// ======================================================
// LOAD ENQUIRIES
// ======================================================

export async function loadEnquiries() {

  const tableBody =
    document.getElementById(
      "enquiriesTableBody"
    );


  if (!tableBody) {
    return;
  }


  tableBody.innerHTML = `
    <tr>
      <td colspan="8" class="empty-table">
        Loading enquiries...
      </td>
    </tr>
  `;


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
        (enquiryDoc) => ({
          id: enquiryDoc.id,
          ...enquiryDoc.data()
        })
      );


    renderEnquiries(
      allEnquiries
    );


    updateEnquiryDashboard();


  } catch (error) {

    console.error(
      "Error loading enquiries:",
      error
    );


    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table">
          Unable to load enquiries.
        </td>
      </tr>
    `;

  }

}


// ======================================================
// RENDER ENQUIRIES
// ======================================================

function renderEnquiries(enquiries) {

  const tableBody =
    document.getElementById(
      "enquiriesTableBody"
    );


  if (!tableBody) {
    return;
  }


  if (!enquiries.length) {

    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table">
          No enquiries found.
          Click "+ Add Enquiry" to create one.
        </td>
      </tr>
    `;

    return;
  }


  tableBody.innerHTML =
    enquiries.map(
      (enquiry) => {

        const totalPax =
          Number(
            enquiry.adults || 0
          ) +
          Number(
            enquiry.children || 0
          );


        return `

          <tr>

            <td>
              ${escapeHtml(
                enquiry.enquiryId || "-"
              )}
            </td>


            <td>
              <strong>
                ${escapeHtml(
                  enquiry.customerName || "-"
                )}
              </strong>
            </td>


            <td>
              ${escapeHtml(
                enquiry.destination || "-"
              )}
            </td>


            <td>
              ${escapeHtml(
                enquiry.startDate || "-"
              )}
            </td>


            <td>
              ${totalPax}
            </td>


            <td>
              ₹${Number(
                enquiry.budget || 0
              ).toLocaleString("en-IN")}
            </td>


            <td>
              <span class="status-badge">
                ${escapeHtml(
                  enquiry.status || "New"
                )}
              </span>
            </td>


            <td>

              <button
                type="button"
                class="edit-btn"
                data-enquiry-edit="${enquiry.id}"
              >
                Edit
              </button>


              <button
                type="button"
                class="danger-btn"
                data-enquiry-delete="${enquiry.id}"
              >
                Delete
              </button>

            </td>

          </tr>

        `;

      }
    ).join("");


  attachEnquiryActions();
}


// ======================================================
// ENQUIRY ACTION BUTTONS
// ======================================================

function attachEnquiryActions() {

  document
    .querySelectorAll(
      "[data-enquiry-edit]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const enquiry =
            allEnquiries.find(
              (item) =>
                item.id ===
                button.dataset.enquiryEdit
            );


          if (enquiry) {
            openEditEnquiry(
              enquiry
            );
          }

        }
      );

    });


  document
    .querySelectorAll(
      "[data-enquiry-delete]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          deleteEnquiry(
            button.dataset.enquiryDelete
          );

        }
      );

    });

}


// ======================================================
// DELETE ENQUIRY
// ======================================================

async function deleteEnquiry(
  enquiryId
) {

  const enquiry =
    allEnquiries.find(
      (item) =>
        item.id === enquiryId
    );


  const confirmed =
    confirm(
      `Delete enquiry "${enquiry?.enquiryId || ""}"?`
    );


  if (!confirmed) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        "enquiries",
        enquiryId
      )
    );


    await loadEnquiries();


  } catch (error) {

    console.error(
      "Error deleting enquiry:",
      error
    );


    alert(
      "Could not delete enquiry."
    );

  }

}


// ======================================================
// ENQUIRY SEARCH
// ======================================================

function handleEnquirySearch(event) {

  const search =
    event.target.value
      .toLowerCase()
      .trim();


  if (!search) {

    renderEnquiries(
      allEnquiries
    );

    return;
  }


  const filtered =
    allEnquiries.filter(
      (enquiry) => {

        return (

          String(
            enquiry.customerName || ""
          )
            .toLowerCase()
            .includes(search)

          ||

          String(
            enquiry.customerMobile || ""
          )
            .toLowerCase()
            .includes(search)

          ||

          String(
            enquiry.destination || ""
          )
            .toLowerCase()
            .includes(search)

          ||

          String(
            enquiry.enquiryId || ""
          )
            .toLowerCase()
            .includes(search)

        );

      }
    );


  renderEnquiries(
    filtered
  );

}


// ======================================================
// UPDATE DASHBOARD ENQUIRY COUNT
// ======================================================

function updateEnquiryDashboard() {

  const activeStatuses = [
    "New",
    "Follow-up",
    "Quoted"
  ];


  const activeCount =
    allEnquiries.filter(
      (enquiry) =>
        activeStatuses.includes(
          enquiry.status
        )
    ).length;


  const element =
    document.getElementById(
      "activeEnquiries"
    );


  if (element) {
    element.textContent =
      activeCount;
  }

}


// ======================================================
// SHOW ENQUIRY MESSAGE
// ======================================================

function showEnquiryMessage(
  text,
  color
) {

  const message =
    document.getElementById(
      "enquiryFormMessage"
    );


  if (!message) {
    return;
  }


  message.style.color =
    color;

  message.textContent =
    text;
}


// ======================================================
// CLEAR ENQUIRY MESSAGE
// ======================================================

function clearEnquiryMessage() {

  const message =
    document.getElementById(
      "enquiryFormMessage"
    );


  if (message) {
    message.textContent = "";
  }

}


// ======================================================
// GET INPUT VALUE
// ======================================================

function getValue(id) {

  const element =
    document.getElementById(id);


  return element
    ? element.value.trim()
    : "";

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

  return String(value)

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
