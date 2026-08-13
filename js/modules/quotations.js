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

let quotationInitialized = false;


// ======================================================
// INITIALIZE
// ======================================================

export function initQuotations() {

  console.log("Quotations module initializing...");

  if (quotationInitialized) {
    console.log("Quotations already initialized.");
    return;
  }

  quotationInitialized = true;

  setupQuotationButtons();

  setupQuotationForm();

  setupQuotationSearch();

  loadQuotations();

  console.log("Quotations module initialized successfully.");

}


// ======================================================
// HELPER
// ======================================================

function getElement(id) {

  return document.getElementById(id);

}


function getValue(id) {

  const element = getElement(id);

  if (!element) {
    return "";
  }

  return element.value.trim();

}


function setValue(id, value) {

  const element = getElement(id);

  if (!element) {
    return;
  }

  element.value = value ?? "";

}


// ======================================================
// BUTTON SETUP
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
      () => {

        openQuotationModal();

      }
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


  const modal =
    getElement("quotationModal");


  if (modal) {

    modal.addEventListener(
      "click",
      (event) => {

        if (
          event.target === modal
        ) {

          closeQuotationModal();

        }

      }
    );

  }

}


// ======================================================
// FORM SETUP
// ======================================================

function setupQuotationForm() {

  const form =
    getElement("quotationForm");

  if (!form) {

    console.error(
      "Quotation form not found."
    );

    return;
  }


  form.addEventListener(
    "submit",
    saveQuotation
  );

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

  const title =
    getElement("quotationModalTitle");


  if (!modal || !form) {

    console.error(
      "Quotation modal/form not found."
    );

    return;

  }


  clearQuotationMessage();


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
      "quotationCustomer",
      quotation.customer
    );

    setValue(
      "quotationEnquiry",
      quotation.enquiry
    );

    setValue(
      "quotationPackage",
      quotation.packageName
    );

    setValue(
      "quotationDestination",
      quotation.destination
    );

    setValue(
      "quotationStartDate",
      quotation.startDate
    );

    setValue(
      "quotationEndDate",
      quotation.endDate
    );

    setValue(
      "quotationAdults",
      quotation.adults ?? 2
    );

    setValue(
      "quotationChildren",
      quotation.children ?? 0
    );

    setValue(
      "quotationRooms",
      quotation.rooms ?? 1
    );

    setValue(
      "quotationValidUntil",
      quotation.validUntil
    );

    setValue(
      "quotationTotal",
      quotation.total ?? 0
    );

    setValue(
      "quotationPerPerson",
      quotation.perPerson ?? ""
    );

    setValue(
      "quotationStatus",
      quotation.status || "Draft"
    );

    setValue(
      "quotationNotes",
      quotation.notes
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

  }


  modal.style.display =
    "flex";

  document.body.style.overflow =
    "hidden";

}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeQuotationModal() {

  const modal =
    getElement("quotationModal");

  const form =
    getElement("quotationForm");


  if (modal) {

    modal.style.display =
      "none";

  }


  document.body.style.overflow =
    "";


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

  clearQuotationMessage();

}


// ======================================================
// SAVE
// ======================================================

async function saveQuotation(event) {

  event.preventDefault();


  const customer =
    getValue("quotationCustomer");

  const packageName =
    getValue("quotationPackage");

  const total =
    Number(
      getValue("quotationTotal") || 0
    );


  if (!customer) {

    showQuotationMessage(
      "Customer name is required.",
      "#dc2626"
    );

    return;

  }


  if (!packageName) {

    showQuotationMessage(
      "Package / Tour Name is required.",
      "#dc2626"
    );

    return;

  }


  if (total <= 0) {

    showQuotationMessage(
      "Please enter a valid quotation amount.",
      "#dc2626"
    );

    return;

  }


  showQuotationMessage(
    "Saving quotation...",
    "#2563eb"
  );


  const quotationData = {

    customer,

    enquiry:
      getValue("quotationEnquiry"),

    packageName,

    destination:
      getValue("quotationDestination"),

    startDate:
      getValue("quotationStartDate"),

    endDate:
      getValue("quotationEndDate"),

    adults:
      Number(
        getValue("quotationAdults") || 0
      ),

    children:
      Number(
        getValue("quotationChildren") || 0
      ),

    rooms:
      Number(
        getValue("quotationRooms") || 0
      ),

    validUntil:
      getValue("quotationValidUntil"),

    total,

    perPerson:
      Number(
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
      () => {

        closeQuotationModal();

      },
      700
    );


  } catch (error) {

    console.error(
      "Quotation save error:",
      error
    );


    showQuotationMessage(
      "Could not save quotation: " +
      error.message,
      "#dc2626"
    );

  }

}


// ======================================================
// LOAD
// ======================================================

async function loadQuotations() {

  const table =
    getElement(
      "quotationsTableBody"
    );


  if (!table) {

    console.error(
      "Quotation table body not found."
    );

    return;

  }


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
        quotationDoc => ({

          id:
            quotationDoc.id,

          ...quotationDoc.data()

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
          <br>
          ${escapeHtml(error.message)}
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


  if (!table) {
    return;
  }


  if (!quotations.length) {

    table.innerHTML = `
      <tr>
        <td
          colspan="8"
          class="empty-table"
        >
          No quotations found.
          Click "+ Add Quotation" to create one.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML =
    quotations
      .map(
        quotation => {

          const adults =
            Number(
              quotation.adults || 0
            );

          const children =
            Number(
              quotation.children || 0
            );

          const totalPax =
            adults + children;


          const total =
            Number(
              quotation.total || 0
            );


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
                ₹${total.toLocaleString(
                  "en-IN"
                )}
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
      button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              button.dataset
                .quotationEditId;


            const quotation =
              allQuotations.find(
                item =>
                  item.id === id
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

async function deleteQuotation(id) {

  const quotation =
    allQuotations.find(
      item =>
        item.id === id
    );


  const confirmed =
    confirm(
      `Delete quotation "${quotation?.quotationId || ""}"?`
    );


  if (!confirmed) {
    return;
  }


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
      "Could not delete quotation: " +
      error.message
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


  if (!searchBox) {
    return;
  }


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
          quotation => {

            const text = [

              quotation.quotationId,

              quotation.customer,

              quotation.packageName,

              quotation.destination,

              quotation.status,

              quotation.enquiry

            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();


            return text.includes(
              search
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


  if (!message) {
    return;
  }


  message.style.color =
    color;


  message.textContent =
    text;

}


function clearQuotationMessage() {

  const message =
    getElement(
      "quotationFormMessage"
    );


  if (!message) {
    return;
  }


  message.textContent =
    "";

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

  return String(value ?? "")

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
