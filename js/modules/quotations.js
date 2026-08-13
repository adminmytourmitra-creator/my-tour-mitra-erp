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


// ======================================================
// INITIALIZE
// ======================================================

export function initQuotations() {

  console.log("Quotations module initializing...");

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
// BUTTON SETUP
// ======================================================

function setupQuotationButtons() {

  const addButton = getElement("addQuotationBtn");

  const closeButton = getElement("closeQuotationModal");

  const cancelButton = getElement("cancelQuotationBtn");


  if (addButton) {

    addButton.addEventListener(
      "click",
      function () {

        openQuotationModal();

      }
    );

  }


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      function () {

        closeQuotationModal();

      }
    );

  }


  if (cancelButton) {

    cancelButton.addEventListener(
      "click",
      function () {

        closeQuotationModal();

      }
    );

  }

}


// ======================================================
// FORM SETUP
// ======================================================

function setupQuotationForm() {

  const form = getElement("quotationForm");

  if (!form) {

    console.warn(
      "quotationForm not found."
    );

    return;

  }


  form.addEventListener(
    "submit",
    function (event) {

      saveQuotation(event);

    }
  );

}


// ======================================================
// OPEN MODAL
// ======================================================

function openQuotationModal(quotation = null) {

  const modal = getElement("quotationModal");

  const form = getElement("quotationForm");

  const title = getElement("quotationModalTitle");

  const message = getElement("quotationFormMessage");


  if (!modal || !form) {

    console.error(
      "Quotation modal or form not found."
    );

    return;

  }


  modal.style.display = "flex";

  document.body.style.overflow = "hidden";


  if (message) {

    message.textContent = "";

  }


  if (quotation) {

    if (title) {

      title.textContent = "Edit Quotation";

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

      title.textContent = "Add Quotation";

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


  document.body.style.overflow = "";


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

}


// ======================================================
// SAVE QUOTATION
// ======================================================

async function saveQuotation(event) {

  event.preventDefault();


  showQuotationMessage(
    "Saving quotation...",
    "#2563eb"
  );


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


  const quotationData = {

    customer: customer,

    enquiry:
      getValue("quotationEnquiry"),

    packageName:
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

    total:
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
      function () {

        closeQuotationModal();

      },
      800
    );


  } catch (error) {

    console.error(
      "Quotation save error:",
      error
    );


    showQuotationMessage(
      "Could not save quotation. Check Firebase / Firestore.",
      "#dc2626"
    );

  }

}


// ======================================================
// QUOTATION ID
// ======================================================

function createQuotationId(firebaseId) {

  const shortId =
    String(firebaseId)
      .substring(0, 6)
      .toUpperCase();


  return "QT-" + shortId;

}


// ======================================================
// LOAD QUOTATIONS
// ======================================================

async function loadQuotations() {

  const table =
    getElement(
      "quotationsTableBody"
    );


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
        function (documentSnapshot) {

          return {

            id:
              documentSnapshot.id,

            ...documentSnapshot.data()

          };

        }
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
          Check Firestore permissions.
        </td>
      </tr>
    `;

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
          Click "+ Add Quotation" to create one.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML =
    quotations
      .map(
        function (quotation) {

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


          const amount =
            Number(
              quotation.total || 0
            );


          const destination =
            quotation.destination
              ? `
                <br>
                <small>
                  ${escapeHtml(
                    quotation.destination
                  )}
                </small>
              `
              : "";


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

                ${destination}

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
                ₹${amount.toLocaleString(
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

  const editButtons =
    document.querySelectorAll(
      "[data-quotation-edit-id]"
    );


  editButtons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const id =
            button.dataset
              .quotationEditId;


          const quotation =
            allQuotations.find(
              function (item) {

                return item.id === id;

              }
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


  const deleteButtons =
    document.querySelectorAll(
      "[data-quotation-delete-id]"
    );


  deleteButtons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const id =
            button.dataset
              .quotationDeleteId;


          deleteQuotation(id);

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
      function (item) {

        return item.id === id;

      }
    );


  const quotationId =
    quotation?.quotationId || "";


  const confirmed =
    window.confirm(
      `Delete quotation "${quotationId}"?`
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


    window.alert(
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
    function () {

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
          function (quotation) {

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
// FORM MESSAGE
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


  message.textContent =
    text;


  message.style.color =
    color;

}


// ======================================================
// VALUE HELPERS
// ======================================================

function getValue(id) {

  const element =
    getElement(id);


  if (!element) return "";


  return String(
    element.value || ""
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
