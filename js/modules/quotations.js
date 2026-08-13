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

let quotations = [];
let initialized = false;


// ======================================================
// INITIALIZE
// ======================================================

export function initQuotations() {

  if (initialized) return;

  initialized = true;

  console.log("Quotations module starting...");

  bindEvents();
  loadQuotations();

}


// ======================================================
// ELEMENT
// ======================================================

function $(id) {
  return document.getElementById(id);
}


// ======================================================
// EVENTS
// ======================================================

function bindEvents() {

  const addBtn = $("addQuotationBtn");
  const form = $("quotationForm");
  const closeBtn = $("closeQuotationModal");
  const cancelBtn = $("cancelQuotationBtn");
  const search = $("quotationSearch");
  const modal = $("quotationModal");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      openQuotation();
    });
  }

  if (form) {
    form.addEventListener("submit", saveQuotation);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeQuotation);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeQuotation);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {

      if (e.target === modal) {
        closeQuotation();
      }

    });
  }

  if (search) {

    search.addEventListener("input", () => {

      const value =
        search.value.toLowerCase().trim();

      if (!value) {
        renderQuotations(quotations);
        return;
      }

      const filtered =
        quotations.filter(q => {

          const text = [

            q.quotationId,
            q.customer,
            q.enquiry,
            q.packageName,
            q.destination,
            q.status

          ]
            .map(v => String(v || "").toLowerCase())
            .join(" ");

          return text.includes(value);

        });

      renderQuotations(filtered);

    });

  }

}


// ======================================================
// OPEN
// ======================================================

function openQuotation(data = null) {

  const modal = $("quotationModal");
  const form = $("quotationForm");
  const title = $("quotationModalTitle");
  const message = $("quotationFormMessage");

  if (!modal || !form) {

    console.error(
      "Quotation form/modal not found."
    );

    return;
  }

  form.reset();

  if (message) {
    message.textContent = "";
  }

  if (data) {

    title.textContent = "Edit Quotation";

    setValue("quotationDocId", data.id);

    setValue(
      "quotationCustomer",
      data.customer
    );

    setValue(
      "quotationEnquiry",
      data.enquiry
    );

    setValue(
      "quotationPackage",
      data.packageName
    );

    setValue(
      "quotationDestination",
      data.destination
    );

    setValue(
      "quotationStartDate",
      data.startDate
    );

    setValue(
      "quotationEndDate",
      data.endDate
    );

    setValue(
      "quotationAdults",
      data.adults ?? 2
    );

    setValue(
      "quotationChildren",
      data.children ?? 0
    );

    setValue(
      "quotationRooms",
      data.rooms ?? 1
    );

    setValue(
      "quotationValidUntil",
      data.validUntil
    );

    setValue(
      "quotationTotal",
      data.total ?? ""
    );

    setValue(
      "quotationPerPerson",
      data.perPerson ?? ""
    );

    setValue(
      "quotationStatus",
      data.status || "Draft"
    );

    setValue(
      "quotationNotes",
      data.notes
    );

  } else {

    title.textContent = "Add Quotation";

    setValue("quotationDocId", "");

    setValue("quotationAdults", 2);

    setValue("quotationChildren", 0);

    setValue("quotationRooms", 1);

    setValue("quotationStatus", "Draft");

  }

  modal.style.display = "flex";

}


// ======================================================
// CLOSE
// ======================================================

function closeQuotation() {

  const modal = $("quotationModal");
  const form = $("quotationForm");

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
// SAVE
// ======================================================

async function saveQuotation(e) {

  e.preventDefault();

  const customer =
    getValue("quotationCustomer");

  const packageName =
    getValue("quotationPackage");

  const total =
    Number(getValue("quotationTotal") || 0);

  if (!customer) {

    message(
      "Customer name is required.",
      "error"
    );

    return;
  }

  if (!packageName) {

    message(
      "Package / Tour Name is required.",
      "error"
    );

    return;
  }

  if (total <= 0) {

    message(
      "Please enter a valid quotation amount.",
      "error"
    );

    return;
  }

  message(
    "Saving quotation...",
    "info"
  );

  const data = {

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
        data
      );

      message(
        "Quotation updated successfully.",
        "success"
      );

    }


    // ==================================================
    // CREATE
    // ==================================================

    else {

      data.createdAt =
        serverTimestamp();

      data.createdBy =
        auth.currentUser
          ? auth.currentUser.email
          : "";

      const ref =
        await addDoc(
          collection(
            db,
            "quotations"
          ),
          data
        );

      const quotationId =
        "QT-" +
        ref.id
          .substring(0, 6)
          .toUpperCase();

      await updateDoc(
        ref,
        {
          quotationId
        }
      );

      message(
        `Quotation ${quotationId} saved successfully.`,
        "success"
      );

    }


    await loadQuotations();


    setTimeout(() => {
      closeQuotation();
    }, 700);


  } catch (error) {

    console.error(
      "Quotation save error:",
      error
    );

    message(
      "Could not save quotation. Check Firestore permissions.",
      "error"
    );

  }

}


// ======================================================
// LOAD
// ======================================================

async function loadQuotations() {

  const tbody =
    $("quotationsTableBody");

  if (!tbody) {

    console.error(
      "quotationsTableBody not found."
    );

    return;
  }

  tbody.innerHTML = `
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

    quotations =
      snapshot.docs.map(
        d => ({
          id: d.id,
          ...d.data()
        })
      );

    renderQuotations(
      quotations
    );


  } catch (error) {

    console.error(
      "Quotation loading error:",
      error
    );

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table">
          Unable to load quotations.
          <br>
          Check Firestore permissions.
        </td>
      </tr>
    `;

  }

}


// ======================================================
// RENDER
// ======================================================

function renderQuotations(list) {

  const tbody =
    $("quotationsTableBody");

  if (!tbody) return;


  if (!list.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table">
          No quotations found.
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    list.map(q => {

      const pax =
        Number(q.adults || 0) +
        Number(q.children || 0);

      return `

        <tr>

          <td>
            <strong>
              ${escapeHtml(
                q.quotationId || "-"
              )}
            </strong>
          </td>

          <td>
            ${escapeHtml(
              q.customer || "-"
            )}
          </td>

          <td>

            <strong>
              ${escapeHtml(
                q.packageName || "-"
              )}
            </strong>

            ${
              q.destination
                ? `
                  <br>
                  <small>
                    ${escapeHtml(
                      q.destination
                    )}
                  </small>
                `
                : ""
            }

          </td>

          <td>
            ${escapeHtml(
              q.startDate || "-"
            )}
          </td>

          <td>
            ${pax}
          </td>

          <td>
            ₹${Number(
              q.total || 0
            ).toLocaleString("en-IN")}
          </td>

          <td>

            <span class="status-badge">
              ${escapeHtml(
                q.status || "Draft"
              )}
            </span>

          </td>

          <td>

            <button
              type="button"
              class="edit-btn"
              data-edit="${q.id}"
            >
              Edit
            </button>

            <button
              type="button"
              class="danger-btn"
              data-delete="${q.id}"
            >
              Delete
            </button>

          </td>

        </tr>

      `;

    }).join("");


  bindRowButtons();

}


// ======================================================
// ROW BUTTONS
// ======================================================

function bindRowButtons() {

  document
    .querySelectorAll("[data-edit]")
    .forEach(btn => {

      btn.onclick = () => {

        const item =
          quotations.find(
            q => q.id === btn.dataset.edit
          );

        if (item) {
          openQuotation(item);
        }

      };

    });


  document
    .querySelectorAll("[data-delete]")
    .forEach(btn => {

      btn.onclick = () => {

        deleteQuotation(
          btn.dataset.delete
        );

      };

    });

}


// ======================================================
// DELETE
// ======================================================

async function deleteQuotation(id) {

  const item =
    quotations.find(
      q => q.id === id
    );

  if (!item) return;


  const ok =
    confirm(
      `Delete quotation "${item.quotationId || id}"?`
    );

  if (!ok) return;


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
// MESSAGE
// ======================================================

function message(text, type) {

  const box =
    $("quotationFormMessage");

  if (!box) return;

  box.textContent = text;

  box.className =
    "form-message " + type;

}


// ======================================================
// VALUE
// ======================================================

function getValue(id) {

  const element = $(id);

  return element
    ? String(element.value || "").trim()
    : "";

}


function setValue(id, value) {

  const element = $(id);

  if (element) {
    element.value = value ?? "";
  }

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
