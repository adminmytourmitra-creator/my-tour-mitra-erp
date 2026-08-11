// ======================================================
// B2B AGENCIES MODULE
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

let allAgencies = [];


// ======================================================
// INITIALIZE
// ======================================================

export function initAgencies() {

  setupAgencyButtons();

  setupAgencyForm();

  setupAgencySearch();

  loadAgencies();

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

function setupAgencyButtons() {

  const addButton =
    getElement("addAgencyBtn");

  const closeButton =
    getElement("closeAgencyModal");

  const cancelButton =
    getElement("cancelAgencyBtn");


  if (addButton) {

    addButton.addEventListener(
      "click",
      () => openAgencyModal()
    );

  }


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeAgencyModal
    );

  }


  if (cancelButton) {

    cancelButton.addEventListener(
      "click",
      closeAgencyModal
    );

  }

}


// ======================================================
// FORM
// ======================================================

function setupAgencyForm() {

  const form =
    getElement("agencyForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    saveAgency
  );

}


// ======================================================
// OPEN MODAL
// ======================================================

function openAgencyModal(
  agency = null
) {

  const modal =
    getElement("agencyModal");

  const form =
    getElement("agencyForm");

  const title =
    getElement("agencyModalTitle");

  const message =
    getElement("agencyFormMessage");


  if (!modal || !form) return;


  modal.style.display =
    "flex";


  if (message) {

    message.textContent =
      "";

  }


  if (agency) {

    if (title) {

      title.textContent =
        "Edit B2B Agency";

    }


    setValue(
      "agencyDocId",
      agency.id
    );

    setValue(
      "agencyName",
      agency.name
    );

    setValue(
      "agencyContactPerson",
      agency.contactPerson
    );

    setValue(
      "agencyMobile",
      agency.mobile
    );

    setValue(
      "agencyWhatsapp",
      agency.whatsapp
    );

    setValue(
      "agencyEmail",
      agency.email
    );

    setValue(
      "agencyCity",
      agency.city
    );

    setValue(
      "agencyState",
      agency.state
    );

    setValue(
      "agencyCountry",
      agency.country ||
      "India"
    );

    setValue(
      "agencyWebsite",
      agency.website
    );

    setValue(
      "agencyNotes",
      agency.notes
    );

    setValue(
      "agencyStatus",
      agency.status ||
      "Active"
    );

  } else {

    if (title) {

      title.textContent =
        "Add B2B Agency";

    }


    form.reset();


    setValue(
      "agencyDocId",
      ""
    );

    setValue(
      "agencyCountry",
      "India"
    );

    setValue(
      "agencyStatus",
      "Active"
    );

  }

}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeAgencyModal() {

  const modal =
    getElement("agencyModal");

  const form =
    getElement("agencyForm");


  if (modal) {

    modal.style.display =
      "none";

  }


  if (form) {

    form.reset();

  }


  setValue(
    "agencyDocId",
    ""
  );

  setValue(
    "agencyCountry",
    "India"
  );

  setValue(
    "agencyStatus",
    "Active"
  );

}


// ======================================================
// SAVE AGENCY
// ======================================================

async function saveAgency(event) {

  event.preventDefault();


  showAgencyMessage(
    "Saving agency...",
    "#1769e0"
  );


  const agencyData = {

    name:
      getValue(
        "agencyName"
      ),

    contactPerson:
      getValue(
        "agencyContactPerson"
      ),

    mobile:
      getValue(
        "agencyMobile"
      ),

    whatsapp:
      getValue(
        "agencyWhatsapp"
      ),

    email:
      getValue(
        "agencyEmail"
      ),

    city:
      getValue(
        "agencyCity"
      ),

    state:
      getValue(
        "agencyState"
      ),

    country:
      getValue(
        "agencyCountry"
      ) || "India",

    website:
      getValue(
        "agencyWebsite"
      ),

    notes:
      getValue(
        "agencyNotes"
      ),

    status:
      getValue(
        "agencyStatus"
      ) || "Active",

    updatedAt:
      serverTimestamp()

  };


  try {

    const existingId =
      getValue(
        "agencyDocId"
      );


    // ==================================================
    // EDIT
    // ==================================================

    if (existingId) {

      await updateDoc(

        doc(
          db,
          "agencies",
          existingId
        ),

        agencyData

      );


      showAgencyMessage(
        "Agency updated successfully.",
        "#15803d"
      );

    }


    // ==================================================
    // NEW
    // ==================================================

    else {

      agencyData.createdAt =
        serverTimestamp();


      agencyData.createdBy =
        auth.currentUser
          ? auth.currentUser.email
          : "";


      const agencyRef =
        await addDoc(

          collection(
            db,
            "agencies"
          ),

          agencyData

        );


      const agencyId =
        "AGY-" +
        agencyRef.id
          .substring(0, 6)
          .toUpperCase();


      await updateDoc(

        agencyRef,

        {
          agencyId:
            agencyId
        }

      );


      showAgencyMessage(
        "Agency saved successfully.",
        "#15803d"
      );

    }


    await loadAgencies();


    setTimeout(
      closeAgencyModal,
      700
    );


  } catch (error) {

    console.error(
      "Agency save error:",
      error
    );


    showAgencyMessage(
      "Could not save agency. Check Firestore rules.",
      "#dc2626"
    );

  }

}


// ======================================================
// LOAD AGENCIES
// ======================================================

async function loadAgencies() {

  const table =
    getElement(
      "agenciesTableBody"
    );


  if (!table) return;


  table.innerHTML = `
    <tr>
      <td
        colspan="10"
        class="empty-table"
      >
        Loading agencies...
      </td>
    </tr>
  `;


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "agencies"
        )
      );


    allAgencies =
      snapshot.docs.map(
        (document) => ({

          id:
            document.id,

          ...document.data()

        })
      );


    renderAgencies(
      allAgencies
    );


  } catch (error) {

    console.error(
      "Agency loading error:",
      error
    );


    table.innerHTML = `
      <tr>
        <td
          colspan="10"
          class="empty-table"
        >
          Unable to load agencies.
          Check Firestore security rules.
        </td>
      </tr>
    `;

  }

}


// ======================================================
// RENDER AGENCIES
// ======================================================

function renderAgencies(
  agencies
) {

  const table =
    getElement(
      "agenciesTableBody"
    );


  if (!table) return;


  if (!agencies.length) {

    table.innerHTML = `
      <tr>
        <td
          colspan="10"
          class="empty-table"
        >
          No B2B agencies found.
          Click "+ Add Agency" to create one.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML =
    agencies
      .map(
        (agency) => `

          <tr>

            <td>
              ${escapeHtml(
                agency.agencyId ||
                "-"
              )}
            </td>

            <td>
              <strong>
                ${escapeHtml(
                  agency.name ||
                  "-"
                )}
              </strong>
            </td>

            <td>
              ${escapeHtml(
                agency.contactPerson ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                agency.mobile ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                agency.whatsapp ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                agency.email ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                agency.city ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                agency.state ||
                "-"
              )}
            </td>

            <td>
              <span class="status-badge">
                ${escapeHtml(
                  agency.status ||
                  "Active"
                )}
              </span>
            </td>

            <td>

              <button
                class="edit-btn"
                data-agency-edit-id="${agency.id}"
              >
                Edit
              </button>

              <button
                class="danger-btn"
                data-agency-delete-id="${agency.id}"
              >
                Delete
              </button>

            </td>

          </tr>

        `
      )
      .join("");


  setupAgencyRowActions();

}


// ======================================================
// ROW ACTIONS
// ======================================================

function setupAgencyRowActions() {

  document
    .querySelectorAll(
      "[data-agency-edit-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const agency =
              allAgencies.find(
                (item) =>
                  item.id ===
                  button.dataset
                    .agencyEditId
              );


            if (agency) {

              openAgencyModal(
                agency
              );

            }

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-agency-delete-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            deleteAgency(
              button.dataset
                .agencyDeleteId
            );

          }
        );

      }
    );

}


// ======================================================
// DELETE AGENCY
// ======================================================

async function deleteAgency(
  id
) {

  const agency =
    allAgencies.find(
      (item) =>
        item.id === id
    );


  const confirmed =
    confirm(
      `Delete agency "${agency?.name || ""}"?`
    );


  if (!confirmed) return;


  try {

    await deleteDoc(
      doc(
        db,
        "agencies",
        id
      )
    );


    await loadAgencies();


  } catch (error) {

    console.error(
      "Agency delete error:",
      error
    );


    alert(
      "Could not delete agency."
    );

  }

}


// ======================================================
// SEARCH
// ======================================================

function setupAgencySearch() {

  const searchBox =
    getElement(
      "agencySearch"
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

        renderAgencies(
          allAgencies
        );

        return;

      }


      const filtered =
        allAgencies.filter(
          (agency) => {

            return (

              String(
                agency.agencyId ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                agency.name ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                agency.contactPerson ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                agency.mobile ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                agency.email ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                agency.city ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                agency.state ||
                ""
              )
                .toLowerCase()
                .includes(search)

            );

          }
        );


      renderAgencies(
        filtered
      );

    }
  );

}


// ======================================================
// MESSAGE
// ======================================================

function showAgencyMessage(
  text,
  color
) {

  const message =
    getElement(
      "agencyFormMessage"
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
