// ================= ENQUIRIES MODULE =================

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


// ================= STATE =================

let allEnquiries = [];
let allCustomers = [];


// ================= INITIALIZE =================

export function initEnquiries() {

  setupEnquiryButtons();
  setupEnquiryForm();
  setupEnquirySearch();

  loadEnquiries();
  loadCustomerDropdown();

}


// ================= ELEMENT HELPER =================

function getElement(id) {

  return document.getElementById(id);

}


// ================= ENQUIRY BUTTONS =================

function setupEnquiryButtons() {

  const addButton =
    getElement("addEnquiryBtn");

  const closeButton =
    getElement("closeEnquiryModal");

  const cancelButton =
    getElement("cancelEnquiryBtn");


  if (addButton) {

    addButton.addEventListener(
      "click",
      () => openEnquiryModal()
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

}


// ================= ENQUIRY FORM =================

function setupEnquiryForm() {

  const form =
    getElement("enquiryForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    saveEnquiry
  );

}


// ================= CUSTOMER DROPDOWN =================

async function loadCustomerDropdown() {

  const dropdown =
    getElement("enquiryCustomer");

  if (!dropdown) return;


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
        (document) => ({

          id:
            document.id,

          ...document.data()

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
      "Customer dropdown error:",
      error
    );


    dropdown.innerHTML = `
      <option value="">
        Unable to load customers
      </option>
    `;

  }

}


// ================= OPEN ENQUIRY MODAL =================

async function openEnquiryModal(
  enquiry = null
) {

  const modal =
    getElement("enquiryModal");

  const form =
    getElement("enquiryForm");

  const title =
    getElement("enquiryModalTitle");

  const message =
    getElement("enquiryFormMessage");


  if (!modal || !form) return;


  modal.style.display =
    "flex";


  if (message) {

    message.textContent =
      "";

  }


  // Always refresh customer list
  await loadCustomerDropdown();


  if (enquiry) {

    title.textContent =
      "Edit Enquiry";


    getElement("enquiryDocId").value =
      enquiry.id || "";


    getElement("enquiryCustomer").value =
      enquiry.customerDocId || "";


    getElement("enquiryDestination").value =
      enquiry.destination || "";


    getElement("enquiryStartDate").value =
      enquiry.startDate || "";


    getElement("enquiryEndDate").value =
      enquiry.endDate || "";


    getElement("enquiryAdults").value =
      enquiry.adults ?? 1;


    getElement("enquiryChildren").value =
      enquiry.children ?? 0;


    getElement("enquiryInfants").value =
      enquiry.infants ?? 0;


    getElement("enquiryTripType").value =
      enquiry.tripType || "Family";


    getElement("enquiryBudget").value =
      enquiry.budget || "";


    getElement("enquirySource").value =
      enquiry.source || "Direct";


    getElement("enquiryStatus").value =
      enquiry.status || "New";


    getElement("enquiryNotes").value =
      enquiry.notes || "";

  } else {

    title.textContent =
      "Add Enquiry";


    form.reset();


    getElement("enquiryDocId").value =
      "";


    getElement("enquiryAdults").value =
      1;


    getElement("enquiryChildren").value =
      0;


    getElement("enquiryInfants").value =
      0;


    getElement("enquiryStatus").value =
      "New";


    getElement("enquiryTripType").value =
      "Family";


    getElement("enquirySource").value =
      "Direct";

  }

}


// ================= CLOSE ENQUIRY MODAL =================

function closeEnquiryModal() {

  const modal =
    getElement("enquiryModal");

  const form =
    getElement("enquiryForm");


  if (modal) {

    modal.style.display =
      "none";

  }


  if (form) {

    form.reset();

  }


  const docId =
    getElement("enquiryDocId");

  if (docId) {

    docId.value =
      "";

  }

}


// ================= SAVE ENQUIRY =================

async function saveEnquiry(event) {

  event.preventDefault();


  const message =
    getElement("enquiryFormMessage");


  showEnquiryMessage(
    "Saving enquiry...",
    "#1769e0"
  );


  const customerDocId =
    getElement("enquiryCustomer")
      ?.value;


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

    destination:
      getElement("enquiryDestination")
        ?.value
        .trim() || "",

    startDate:
      getElement("enquiryStartDate")
        ?.value || "",

    endDate:
      getElement("enquiryEndDate")
        ?.value || "",

    adults:
      Number(
        getElement("enquiryAdults")
          ?.value || 0
      ),

    children:
      Number(
        getElement("enquiryChildren")
          ?.value || 0
      ),

    infants:
      Number(
        getElement("enquiryInfants")
          ?.value || 0
      ),

    tripType:
      getElement("enquiryTripType")
        ?.value || "Family",

    budget:
      Number(
        getElement("enquiryBudget")
          ?.value || 0
      ),

    source:
      getElement("enquirySource")
        ?.value || "Direct",

    status:
      getElement("enquiryStatus")
        ?.value || "New",

    notes:
      getElement("enquiryNotes")
        ?.value
        .trim() || "",

    updatedAt:
      serverTimestamp()

  };


  try {

    const existingId =
      getElement("enquiryDocId")
        ?.value;


    // ================= EDIT =================

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


    // ================= NEW =================

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
      closeEnquiryModal,
      700
    );


  } catch (error) {

    console.error(
      "Enquiry save error:",
      error
    );


    showEnquiryMessage(
      "Could not save enquiry. Check Firestore rules.",
      "#dc2626"
    );

  }

}


// ================= MESSAGE =================

function showEnquiryMessage(
  text,
  color
) {

  const message =
    getElement("enquiryFormMessage");


  if (!message) return;


  message.style.color =
    color;

  message.textContent =
    text;

}


// ================= LOAD ENQUIRIES =================

async function loadEnquiries() {

  const table =
    getElement("enquiriesTableBody");


  if (!table) return;


  table.innerHTML = `

    <tr>
      <td
        colspan="8"
        class="empty-table"
      >
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
        (document) => ({

          id:
            document.id,

          ...document.data()

        })
      );


    renderEnquiries(
      allEnquiries
    );


    updateEnquiryDashboard();


  } catch (error) {

    console.error(
      "Enquiry loading error:",
      error
    );


    table.innerHTML = `

      <tr>
        <td
          colspan="8"
          class="empty-table"
        >
          Unable to load enquiries.
          Check Firestore security rules.
        </td>
      </tr>

    `;

  }

}


// ================= RENDER ENQUIRIES =================

function renderEnquiries(enquiries) {

  const table =
    getElement("enquiriesTableBody");


  if (!table) return;


  if (!enquiries.length) {

    table.innerHTML = `

      <tr>
        <td
          colspan="8"
          class="empty-table"
        >
          No enquiries found.
          Click "+ Add Enquiry" to create one.
        </td>
      </tr>

    `;

    return;

  }


  table.innerHTML =
    enquiries
      .map(
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
                  class="edit-btn"
                  data-enquiry-edit-id="${enquiry.id}"
                >
                  Edit
                </button>

                <button
                  class="danger-btn"
                  data-enquiry-delete-id="${enquiry.id}"
                >
                  Delete
                </button>

              </td>

            </tr>

          `;

        }
      )
      .join("");


  setupEnquiryRowActions();

}


// ================= ROW ACTIONS =================

function setupEnquiryRowActions() {

  document
    .querySelectorAll(
      "[data-enquiry-edit-id]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const enquiry =
            allEnquiries.find(
              (item) =>
                item.id ===
                button.dataset.enquiryEditId
            );


          if (enquiry) {

            openEnquiryModal(
              enquiry
            );

          }

        }
      );

    });


  document
    .querySelectorAll(
      "[data-enquiry-delete-id]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () =>
          deleteEnquiry(
            button.dataset.enquiryDeleteId
          )
      );

    });

}


// ================= DELETE ENQUIRY =================

async function deleteEnquiry(id) {

  const enquiry =
    allEnquiries.find(
      (item) =>
        item.id === id
    );


  const confirmed =
    confirm(
      `Delete enquiry "${enquiry?.enquiryId || ""}"?`
    );


  if (!confirmed) return;


  try {

    await deleteDoc(
      doc(
        db,
        "enquiries",
        id
      )
    );


    await loadEnquiries();


  } catch (error) {

    console.error(
      "Enquiry delete error:",
      error
    );


    alert(
      "Could not delete enquiry."
    );

  }

}


// ================= SEARCH =================

function setupEnquirySearch() {

  const searchBox =
    getElement("enquirySearch");


  if (!searchBox) return;


  searchBox.addEventListener(
    "input",
    () => {

      const search =
        searchBox.value
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
  );

}


// ================= DASHBOARD =================

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


  const cards =
    document.querySelectorAll(
      ".card"
    );


  cards.forEach((card) => {

    const title =
      card.querySelector(
        ".card-title"
      );


    if (
      title &&
      title.textContent.trim() ===
        "Active Enquiries"
    ) {

      const value =
        card.querySelector(
          ".card-value"
        );


      if (value) {

        value.textContent =
          activeCount;

      }

    }

  });

}


// ================= HTML ESCAPE =================

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
