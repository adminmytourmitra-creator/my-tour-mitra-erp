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

import {
  db,
  auth
} from "../firebase.js";


// ======================================================
// STATE
// ======================================================

let allQuotations = [];

let quotationInitialized = false;


// ======================================================
// INITIALIZE
// ======================================================

export function initQuotations() {

  if (quotationInitialized) {
    return;
  }

  quotationInitialized = true;

  console.log("Quotations module initializing...");

  setupQuotationButtons();

  setupQuotationForm();

  setupQuotationSearch();

  loadQuotations();

  console.log("Quotations module initialized successfully.");

}


// ======================================================
// ELEMENT
// ======================================================

function el(id) {

  return document.getElementById(id);

}


// ======================================================
// BUTTONS
// ======================================================

function setupQuotationButtons() {

  const addBtn = el("addQuotationBtn");

  const closeBtn = el("closeQuotationModal");

  const cancelBtn = el("cancelQuotationBtn");


  if (addBtn) {

    addBtn.addEventListener(
      "click",
      () => {

        openQuotationModal();

      }
    );

  }


  if (closeBtn) {

    closeBtn.addEventListener(
      "click",
      closeQuotationModal
    );

  }


  if (cancelBtn) {

    cancelBtn.addEventListener(
      "click",
      closeQuotationModal
    );

  }


  const modal = el("quotationModal");

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
// FORM
// ======================================================

function setupQuotationForm() {

  const form = el("quotationForm");

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
// OPEN MODAL
// ======================================================

function openQuotationModal(
  quotation = null
) {

  const modal = el("quotationModal");

  const form = el("quotationForm");

  const title = el("quotationModalTitle");

  const message = el("quotationFormMessage");


  if (!modal || !form) {

    console.error(
      "Quotation modal/form not found."
    );

    return;

  }


  if (message) {

    message.textContent = "";

    message.style.color = "";

  }


  form.reset();


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

  }

  else {

    if (title) {

      title.textContent =
        "Add Quotation";

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

  }


  modal.style.display = "flex";

}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeQuotationModal() {

  const modal = el("quotationModal");

  const form = el("quotationForm");


  if (modal) {

    modal.style.display = "none";

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


  const message = el(
    "quotationFormMessage"
  );

  if (message) {

    message.textContent = "";

  }

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

    customer: customer,

    enquiry:
      getValue("quotationEnquiry"),

    packageName: packageName,

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

    total: total,

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
          quotationId:
            quotationId
        }

      );


      showQuotationMessage(
        `Quotation ${quotationId} saved successfully.`,
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


  }

  catch (error) {

    console.error(
      "Quotation save error:",
      error
    );


    showQuotationMessage(
      "Could not save quotation. Check Firestore permissions.",
      "#dc2626"
    );

  }

}


// ======================================================
// LOAD
// ======================================================

async function loadQuotations() {

  const table =
    el("quotationsTableBody");


  if (!table) {

    console.warn(
      "quotationsTableBody not found."
    );

    return;

  }


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

          id: item.id,

          ...item.data()

        })
      );


    renderQuotations(
      allQuotations
    );

  }

  catch (error) {

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

          <br>

          Check Firestore rules.

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
    el("quotationsTableBody");


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

                ${pax}

              </td>


              <td>

                ₹${Number(
                  quotation.total || 0
                ).toLocaleString(
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
      (button) => {

        button.onclick =
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

          };

      }
    );


  document
    .querySelectorAll(
      "[data-quotation-delete-id]"
    )
    .forEach(
      (button) => {

        button.onclick =
          () => {

            deleteQuotation(
              button.dataset
                .quotationDeleteId
            );

          };

      }
    );

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


  const quotationId =
    quotation?.quotationId ||
    id;


  if (
    !confirm(
      `Delete quotation "${quotationId}"?`
    )
  ) {

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

  }

  catch (error) {

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
    el("quotationSearch");


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

              quotation.enquiry

            ]
              .map(
                value =>
                  String(
                    value || ""
                  ).toLowerCase()
              )
              .some(
                value =>
                  value.includes(search)
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
    el("quotationFormMessage");


  if (!message) return;


  message.textContent =
    text;

  message.style.color =
    color;

}


// ======================================================
// GET VALUE
// ======================================================

function getValue(id) {

  const element =
    el(id);


  if (!element) {

    return "";

  }


  return String(
    element.value || ""
  ).trim();

}


// ======================================================
// SET VALUE
// ======================================================

function setValue(
  id,
  value
) {

  const element =
    el(id);


  if (element) {

    element.value =
      value ?? "";

  }

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

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
