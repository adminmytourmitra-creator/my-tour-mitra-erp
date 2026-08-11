// ======================================================
// FOLLOW-UPS MODULE
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

let allFollowups = [];


// ======================================================
// INITIALIZE
// ======================================================

export function initFollowups() {

  setupFollowupButtons();

  setupFollowupForm();

  setupFollowupSearch();

  loadFollowups();

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

function setupFollowupButtons() {

  const addButton =
    getElement("addFollowupBtn");

  const closeButton =
    getElement("closeFollowupModal");

  const cancelButton =
    getElement("cancelFollowupBtn");


  if (addButton) {

    addButton.addEventListener(
      "click",
      () => openFollowupModal()
    );

  }


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeFollowupModal
    );

  }


  if (cancelButton) {

    cancelButton.addEventListener(
      "click",
      closeFollowupModal
    );

  }

}


// ======================================================
// FORM
// ======================================================

function setupFollowupForm() {

  const form =
    getElement("followupForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    saveFollowup
  );

}


// ======================================================
// OPEN MODAL
// ======================================================

function openFollowupModal(
  followup = null
) {

  const modal =
    getElement("followupModal");

  const form =
    getElement("followupForm");

  const title =
    getElement("followupModalTitle");

  const message =
    getElement("followupFormMessage");


  if (!modal || !form) return;


  modal.style.display =
    "flex";


  if (message) {

    message.textContent =
      "";

  }


  if (followup) {

    if (title) {

      title.textContent =
        "Edit Follow-up";

    }


    setValue(
      "followupDocId",
      followup.id
    );

    setValue(
      "followupCustomer",
      followup.customerDocId
    );

    setValue(
      "followupEnquiry",
      followup.enquiryDocId
    );

    setValue(
      "followupDate",
      followup.followupDate
    );

    setValue(
      "followupTime",
      followup.followupTime
    );

    setValue(
      "followupMethod",
      followup.method || "WhatsApp"
    );

    setValue(
      "followupStatus",
      followup.status || "Pending"
    );

    setValue(
      "followupNotes",
      followup.notes
    );

  } else {

    if (title) {

      title.textContent =
        "Add Follow-up";

    }


    form.reset();


    setValue(
      "followupDocId",
      ""
    );

    setValue(
      "followupMethod",
      "WhatsApp"
    );

    setValue(
      "followupStatus",
      "Pending"
    );

  }

}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeFollowupModal() {

  const modal =
    getElement("followupModal");

  const form =
    getElement("followupForm");


  if (modal) {

    modal.style.display =
      "none";

  }


  if (form) {

    form.reset();

  }


  setValue(
    "followupDocId",
    ""
  );

  setValue(
    "followupMethod",
    "WhatsApp"
  );

  setValue(
    "followupStatus",
    "Pending"
  );

}


// ======================================================
// SAVE FOLLOW-UP
// ======================================================

async function saveFollowup(event) {

  event.preventDefault();


  showFollowupMessage(
    "Saving follow-up...",
    "#1769e0"
  );


  const followupData = {

    customerDocId:
      getValue(
        "followupCustomer"
      ),

    enquiryDocId:
      getValue(
        "followupEnquiry"
      ),

    followupDate:
      getValue(
        "followupDate"
      ),

    followupTime:
      getValue(
        "followupTime"
      ),

    method:
      getValue(
        "followupMethod"
      ) || "WhatsApp",

    status:
      getValue(
        "followupStatus"
      ) || "Pending",

    notes:
      getValue(
        "followupNotes"
      ),

    updatedAt:
      serverTimestamp()

  };


  try {

    const existingId =
      getValue(
        "followupDocId"
      );


    // ==================================================
    // EDIT
    // ==================================================

    if (existingId) {

      await updateDoc(

        doc(
          db,
          "followups",
          existingId
        ),

        followupData

      );


      showFollowupMessage(
        "Follow-up updated successfully.",
        "#15803d"
      );

    }


    // ==================================================
    // NEW
    // ==================================================

    else {

      followupData.createdAt =
        serverTimestamp();


      followupData.createdBy =
        auth.currentUser
          ? auth.currentUser.email
          : "";


      const followupRef =
        await addDoc(

          collection(
            db,
            "followups"
          ),

          followupData

        );


      const followupId =
        "FUP-" +
        followupRef.id
          .substring(0, 6)
          .toUpperCase();


      await updateDoc(

        followupRef,

        {
          followupId:
            followupId
        }

      );


      showFollowupMessage(
        "Follow-up saved successfully.",
        "#15803d"
      );

    }


    await loadFollowups();


    setTimeout(
      closeFollowupModal,
      700
    );


  } catch (error) {

    console.error(
      "Follow-up save error:",
      error
    );


    showFollowupMessage(
      "Could not save follow-up. Check Firestore rules.",
      "#dc2626"
    );

  }

}


// ======================================================
// LOAD FOLLOW-UPS
// ======================================================

async function loadFollowups() {

  const table =
    getElement(
      "followupsTableBody"
    );


  // No Follow-up HTML yet.
  // Do not interrupt the application.

  if (!table) return;


  table.innerHTML = `
    <tr>
      <td
        colspan="8"
        class="empty-table"
      >
        Loading follow-ups...
      </td>
    </tr>
  `;


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "followups"
        )
      );


    allFollowups =
      snapshot.docs.map(
        (document) => ({

          id:
            document.id,

          ...document.data()

        })
      );


    renderFollowups(
      allFollowups
    );


  } catch (error) {

    console.error(
      "Follow-up loading error:",
      error
    );


    table.innerHTML = `
      <tr>
        <td
          colspan="8"
          class="empty-table"
        >
          Unable to load follow-ups.
        </td>
      </tr>
    `;

  }

}


// ======================================================
// RENDER
// ======================================================

function renderFollowups(
  followups
) {

  const table =
    getElement(
      "followupsTableBody"
    );


  if (!table) return;


  if (!followups.length) {

    table.innerHTML = `
      <tr>
        <td
          colspan="8"
          class="empty-table"
        >
          No follow-ups found.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML =
    followups
      .map(
        (followup) => `

          <tr>

            <td>
              ${escapeHtml(
                followup.followupId || "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                followup.customerName ||
                followup.customerDocId ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                followup.followupDate || "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                followup.followupTime || "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                followup.method || "-"
              )}
            </td>

            <td>
              <span class="status-badge">
                ${escapeHtml(
                  followup.status ||
                  "Pending"
                )}
              </span>
            </td>

            <td>
              ${escapeHtml(
                followup.notes || "-"
              )}
            </td>

            <td>

              <button
                class="edit-btn"
                data-followup-edit-id="${followup.id}"
              >
                Edit
              </button>

              <button
                class="danger-btn"
                data-followup-delete-id="${followup.id}"
              >
                Delete
              </button>

            </td>

          </tr>

        `
      )
      .join("");


  setupFollowupRowActions();

}


// ======================================================
// ROW ACTIONS
// ======================================================

function setupFollowupRowActions() {

  document
    .querySelectorAll(
      "[data-followup-edit-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const followup =
              allFollowups.find(
                (item) =>
                  item.id ===
                  button.dataset
                    .followupEditId
              );


            if (followup) {

              openFollowupModal(
                followup
              );

            }

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-followup-delete-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            deleteFollowup(
              button.dataset
                .followupDeleteId
            );

          }
        );

      }
    );

}


// ======================================================
// DELETE
// ======================================================

async function deleteFollowup(
  id
) {

  const followup =
    allFollowups.find(
      (item) =>
        item.id === id
    );


  const confirmed =
    confirm(
      `Delete follow-up "${followup?.followupId || ""}"?`
    );


  if (!confirmed) return;


  try {

    await deleteDoc(
      doc(
        db,
        "followups",
        id
      )
    );


    await loadFollowups();


  } catch (error) {

    console.error(
      "Follow-up delete error:",
      error
    );


    alert(
      "Could not delete follow-up."
    );

  }

}


// ======================================================
// SEARCH
// ======================================================

function setupFollowupSearch() {

  const searchBox =
    getElement(
      "followupSearch"
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

        renderFollowups(
          allFollowups
        );

        return;

      }


      const filtered =
        allFollowups.filter(
          (followup) => {

            return (

              String(
                followup.followupId ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                followup.customerName ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                followup.method ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                followup.status ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                followup.notes ||
                ""
              )
                .toLowerCase()
                .includes(search)

            );

          }
        );


      renderFollowups(
        filtered
      );

    }
  );

}


// ======================================================
// MESSAGE
// ======================================================

function showFollowupMessage(
  text,
  color
) {

  const message =
    getElement(
      "followupFormMessage"
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
