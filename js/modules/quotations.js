// ======================================================
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


// ======================================================
// INITIALIZE
// ======================================================

export function initQuotations() {

  setupQuotationButtons();
  setupQuotationForm();
  setupQuotationSearch();
  loadQuotations();

}


// ======================================================
// ELEMENT HELPER
// ======================================================

function getElement(id) {
  return document.getElementById(id);
}


// ======================================================
// BUTTONS
// ======================================================

function setupQuotationButtons() {

  const addButton = getElement("addQuotationBtn");
  const closeButton = getElement("closeQuotationModal");
  const cancelButton = getElement("cancelQuotationBtn");

  if (addButton) {
    addButton.addEventListener("click", () => {
      openQuotationModal();
    });
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeQuotationModal);
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", closeQuotationModal);
  }

}


// ======================================================
// FORM
// ======================================================

function setupQuotationForm() {

  const form = getElement("quotationForm");

  if (!form) return;

  form.addEventListener("submit", saveQuotation);

}


// ======================================================
// OPEN MODAL
// ======================================================

function openQuotationModal(quotation = null) {

  const modal = getElement("quotationModal");
  const form = getElement("quotationForm");
  const title = getElement("quotationModalTitle");
  const message = getElement("quotationFormMessage");

  if (!modal || !form) return;

  modal.style.display = "flex";

  if (message) {
    message.textContent = "";
  }


  // EDIT
  if (quotation) {

    if (title) {
      title.textContent = "Edit Quotation";
    }

    setValue("quotationDocId", quotation.id);
    setValue("quotationCustomer", quotation.customer);
    setValue("quotationEnquiry", quotation.enquiry);
    setValue("quotationPackage", quotation.packageName);
    setValue("quotationDestination", quotation.destination);

    setValue("quotationStartDate", quotation.startDate);
    setValue("quotationEndDate", quotation.endDate);

    setValue("quotationAdults", quotation.adults ?? 2);
    setValue("quotationChildren", quotation.children ?? 0);
    setValue("quotationRooms", quotation.rooms ?? 1);

    setValue("quotationValidUntil", quotation.validUntil);

    setValue("quotationTotal", quotation.total ?? 0);
    setValue("quotationPerPerson", quotation.perPerson ?? "");

    setValue(
      "quotationStatus",
      quotation.status || "Draft"
    );

    setValue("quotationNotes", quotation.notes);

  }

  // ADD
  else {

    if (title) {
      title.textContent = "Add Quotation";
    }

    form.reset();

    setValue("quotationDocId", "");
    setValue("quotationAdults", 2);
    setValue("quotationChildren", 0);
    setValue("quotationRooms", 1);
    setValue("quotationStatus", "Draft");

  }

}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeQuotationModal() {

  const modal = getElement("quotationModal");
  const form = getElement("quotationForm");

  if (modal) {
    modal.style.display = "none";
  }

  if (form) {
    form.reset();
  }

  setValue("quotationDocId", "");
  setValue("quotationAdults", 2);
  setValue("quotationChildren", 0);
  setValue("quotationRooms", 1);
  setValue("quotationStatus", "Draft");

}


// ======================================================
// SAVE QUOTATION
// ======================================================

async function saveQuotation(event) {

  event.preventDefault();

  showQuotationMessage(
    "Saving quotation...",
    "#1769e0"
  );


  const quotationData = {

    customer: getValue("quotationCustomer"),

    enquiry: getValue("quotationEnquiry"),

    packageName: getValue("quotationPackage"),

    destination: getValue("quotationDestination"),

    startDate: getValue("quotationStartDate"),

    endDate: getValue("quotationEndDate"),

    adults: Number(
      getValue("quotationAdults") || 0
    ),

    children: Number(
      getValue("quotationChildren") || 0
    ),

    rooms: Number(
      getValue("quotationRooms") || 0
    ),

    validUntil: getValue("quotationValidUntil"),

    total: Number(
      getValue("quotationTotal") || 0
    ),

    perPerson: Number(
      getValue("quotationPerPerson") || 0
    ),

    status:
      getValue("quotationStatus") || "Draft",

    notes:
      getValue("quotationNotes"),

    updatedAt:
      serverTimestamp()

  };


  try {

    const existingId =
      getValue("quotationDocId");


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
          collection(db, "quotations"),
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
          quotationId: quotationId
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
// LOAD QUOTATIONS
// ======================================================

async function loadQuotations() {

  const table =
    getElement("quotationsTableBody");

  if (!table) return;


  table.innerHTML = `
    <tr>
      <td colspan="8" class="empty-table">
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
        (document) => ({
          id: document.id,
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


    table.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table">
          Unable to load quotations.
          Check Firestore security rules.
        </td>
      </tr>
    `;

  }

}


// ======================================================
// RENDER QUOTATIONS
// ======================================================

function renderQuotations(quotations) {

  const table =
    getElement("quotationsTableBody");

  if (!table) return;


  if (!quotations.length) {

    table.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table">
          No quotations found.
          Click "+ Add Quotation" to create one.
        </td>
      </tr>
    `;

    return;
  }


  table.innerHTML =
    quotations
      .map((quotation) => {

        const totalPax =
          Number(quotation.adults || 0) +
          Number(quotation.children || 0);


        return `
          <tr>

            <td>
              <strong>
                ${escapeHtml(
                  quotation.quotationId || "-"
                )}
              </strong>
            </td>

            <td>
              ${escapeHtml(
                quotation.customer || "-"
              )}
            </td>

            <td>

              <strong>
                ${escapeHtml(
                  quotation.packageName || "-"
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
                quotation.startDate || "-"
              )}
            </td>

            <td>
              ${totalPax}
            </td>

            <td>
              ₹${Number(
                quotation.total || 0
              ).toLocaleString("en-IN")}
            </td>

            <td>

              <span class="status-badge">
                ${escapeHtml(
                  quotation.status || "Draft"
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
                class="danger-btn"
                data-quotation-delete-id="${quotation.id}"
              >
                Delete
              </button>

            </td>

          </tr>
        `;

      })
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
    .forEach((button) => {

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

    });


  document
    .querySelectorAll(
      "[data-quotation-delete-id]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          deleteQuotation(
            button.dataset
              .quotationDeleteId
          );

        }
      );

    });

}


// ======================================================
// DELETE
// ======================================================

async function deleteQuotation(id) {

  const quotation =
    allQuotations.find(
      (item) =>
        item.id === id
    );


  const confirmed =
    confirm(
      `Delete quotation "${
        quotation?.quotationId || ""
      }"?`
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
                quotation.quotationId || ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                quotation.customer || ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                quotation.packageName || ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                quotation.destination || ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                quotation.status || ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                quotation.enquiry || ""
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

function showQuotationMessage(text, color) {

  const message =
    getElement(
      "quotationFormMessage"
    );

  if (!message) return;

  message.style.color = color;
  message.textContent = text;

}


// ======================================================
// VALUE HELPERS
// ======================================================

function getValue(id) {

  return (
    getElement(id)?.value?.trim() || ""
  );

}


function setValue(id, value) {

  const element =
    getElement(id);

  if (element) {
    element.value =
      value ?? "";
  }

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

  return String(value)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}
