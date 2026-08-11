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

import { db } from "../firebase.js";

// ======================================================
// STATE
// ======================================================

let allFollowups = [];
let allCustomers = [];
let allEnquiries = [];

// ======================================================
// INITIALIZE
// ======================================================

export function initFollowups() {

  setupFollowupButtons();
  setupFollowupForm();
  setupFollowupSearch();

  loadCustomers();
  loadEnquiries();
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

async function openFollowupModal(
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

  modal.style.display = "flex";

  if (message) {
    message.textContent = "";
  }

  await loadCustomers();
  await loadEnquiries();

  if (followup) {

    if (title) {
      title.textContent =
        "Edit Follow-up";
    }

    getElement(
      "followupDocId"
    ).value =
      followup.id || "";

    getElement(
      "followupCustomer"
    ).value =
      followup.customerDocId || "";

    getElement(
      "followupEnquiry"
    ).value =
      followup.enquiryDocId || "";

    getElement(
      "followupDate"
    ).value =
      followup.followupDate || "";

    getElement(
      "followupTime"
    ).value =
      followup.followupTime || "";

    getElement(
      "followupType"
    ).value =
      followup.type || "Call";

    getElement(
      "followupStatus"
    ).value =
      followup.status || "Pending";

    getElement(
      "followupNotes"
    ).value =
      followup.notes || "";

  } else {

    if (title) {
      title.textContent =
        "Add Follow-up";
    }

    form.reset();

    getElement(
      "followupDocId"
    ).value = "";

    getElement(
      "followupType"
    ).value =
      "Call";

    getElement(
      "followupStatus"
    ).value =
      "Pending";

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

  const docId =
    getElement("followupDocId");

  if (docId) {
    docId.value = "";
  }

}

// ======================================================
// LOAD CUSTOMERS
// ======================================================

async function loadCustomers() {

  const dropdown =
    getElement("followupCustomer");

  if (!dropdown) return;

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
          id: document.id,
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
      "Follow-up customer loading error:",
      error
    );

  }

}

// ======================================================
// LOAD ENQUIRIES
// ======================================================

async function loadEnquiries() {

  const dropdown =
    getElement("followupEnquiry");

  if (!dropdown) return;

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
          id: document.id,
          ...document.data()
        })
      );

    dropdown.innerHTML = `
      <option value="">
        Select Enquiry
      </option>
    `;

    allEnquiries.forEach(
      (enquiry) => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          enquiry.id;

        option.textContent =
          `${enquiry.enquiryId || "Enquiry"} - ${enquiry.destination || ""} - ${enquiry.customerName || ""}`;

        dropdown.appendChild(
          option
        );

      }
    );

  } catch (error) {

    console.error(
      "Follow-up enquiry loading error:",
      error
    );

  }

}

// ======================================================
// SAVE FOLLOW-UP
// ======================================================

async function saveFollowup(event) {

  event.preventDefault();

  const message =
    getElement(
      "followupFormMessage"
    );

  if (message) {

    message.style.color =
      "#2563eb";

    message.textContent =
      "Saving follow-up...";

  }

  const customerDocId =
    getElement(
      "followupCustomer"
    )?.value || "";

  const enquiryDocId =
    getElement(
      "followupEnquiry"
    )?.value || "";

  if (!customerDocId) {

    showFollowupMessage(
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

  const selectedEnquiry =
    allEnquiries.find(
      (enquiry) =>
        enquiry.id ===
        enquiryDocId
    );

  const followupData = {

    customerDocId:
      customerDocId,

    customerName:
      selectedCustomer?.name || "",

    enquiryDocId:
      enquiryDocId,

    enquiryId:
      selectedEnquiry?.enquiryId || "",

    destination:
      selectedEnquiry?.destination || "",

    followupDate:
      getElement(
        "followupDate"
      )?.value || "",

    followupTime:
      getElement(
        "followupTime"
      )?.value || "",

    type:
      getElement(
        "followupType"
      )?.value || "Call",

    status:
      getElement(
        "followupStatus"
      )?.value || "Pending",

    notes:
      getElement(
        "followupNotes"
      )?.value
      .trim() || "",

    updatedAt:
      serverTimestamp()

  };

  try {

    const existingId =
      getElement(
        "followupDocId"
      )?.value || "";

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
// LOAD FOLLOW-UPS
// ======================================================

async function loadFollowups() {

  const table =
    getElement(
      "followupsTableBody"
    );

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
          Check Firestore security rules.
        </td>
      </tr>
    `;

  }

}

// ======================================================
// RENDER FOLLOW-UPS
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
          Click "+ Add Follow-up" to create one.
        </td>
      </tr>
    `;

    return;

  }

  table.innerHTML =
    followups
      .map(
        (followup) => {

          return `
            <tr>

              <td>
                ${escapeHtml(
                  followup.followupId ||
                  "-"
                )}
              </td>

              <td>
                <strong>
                  ${escapeHtml(
                    followup.customerName ||
                    "-"
                  )}
                </strong>
              </td>

              <td>
                ${escapeHtml(
                  followup.destination ||
                  "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  followup.followupDate ||
                  "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  followup.followupTime ||
                  "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  followup.type ||
                  "-"
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
          `;

        }
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
                followup.customerName ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                followup.destination ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                followup.followupId ||
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
                followup.type ||
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
// ESCAPE HTML
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
