// ======================================================
// CABS MODULE
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

let allCabs = [];


// ======================================================
// INITIALIZE
// ======================================================

export function initCabs() {

  setupCabButtons();

  setupCabForm();

  setupCabSearch();

  loadCabs();

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

function setupCabButtons() {

  const addButton =
    getElement("addCabBtn");

  const closeButton =
    getElement("closeCabModal");

  const cancelButton =
    getElement("cancelCabBtn");


  if (addButton) {

    addButton.addEventListener(
      "click",
      () => openCabModal()
    );

  }


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeCabModal
    );

  }


  if (cancelButton) {

    cancelButton.addEventListener(
      "click",
      closeCabModal
    );

  }

}


// ======================================================
// FORM
// ======================================================

function setupCabForm() {

  const form =
    getElement("cabForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    saveCab
  );

}


// ======================================================
// OPEN MODAL
// ======================================================

function openCabModal(
  cab = null
) {

  const modal =
    getElement("cabModal");

  const form =
    getElement("cabForm");

  const title =
    getElement("cabModalTitle");

  const message =
    getElement("cabFormMessage");


  if (!modal || !form) return;


  modal.style.display =
    "flex";


  if (message) {

    message.textContent =
      "";

  }


  if (cab) {

    if (title) {

      title.textContent =
        "Edit Cab";

    }


    setValue(
      "cabDocId",
      cab.id
    );

    setValue(
      "cabName",
      cab.name
    );

    setValue(
      "cabVehicleNumber",
      cab.vehicleNumber
    );

    setValue(
      "cabType",
      cab.type ||
      "Sedan"
    );

    setValue(
      "cabCapacity",
      cab.capacity
    );

    setValue(
      "cabDriverName",
      cab.driverName
    );

    setValue(
      "cabDriverPhone",
      cab.driverPhone
    );

    setValue(
      "cabRate",
      cab.rate
    );

    setValue(
      "cabRateType",
      cab.rateType ||
      "Per Day"
    );

    setValue(
      "cabLocation",
      cab.location
    );

    setValue(
      "cabNotes",
      cab.notes
    );

    setValue(
      "cabStatus",
      cab.status ||
      "Available"
    );

  } else {

    if (title) {

      title.textContent =
        "Add Cab";

    }


    form.reset();


    setValue(
      "cabDocId",
      ""
    );

    setValue(
      "cabType",
      "Sedan"
    );

    setValue(
      "cabRateType",
      "Per Day"
    );

    setValue(
      "cabStatus",
      "Available"
    );

  }

}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeCabModal() {

  const modal =
    getElement("cabModal");

  const form =
    getElement("cabForm");


  if (modal) {

    modal.style.display =
      "none";

  }


  if (form) {

    form.reset();

  }


  setValue(
    "cabDocId",
    ""
  );

  setValue(
    "cabType",
    "Sedan"
  );

  setValue(
    "cabRateType",
    "Per Day"
  );

  setValue(
    "cabStatus",
    "Available"
  );

}


// ======================================================
// SAVE CAB
// ======================================================

async function saveCab(event) {

  event.preventDefault();


  showCabMessage(
    "Saving cab...",
    "#1769e0"
  );


  const cabData = {

    name:
      getValue(
        "cabName"
      ),

    vehicleNumber:
      getValue(
        "cabVehicleNumber"
      ),

    type:
      getValue(
        "cabType"
      ) || "Sedan",

    capacity:
      Number(
        getValue(
          "cabCapacity"
        ) || 0
      ),

    driverName:
      getValue(
        "cabDriverName"
      ),

    driverPhone:
      getValue(
        "cabDriverPhone"
      ),

    rate:
      Number(
        getValue(
          "cabRate"
        ) || 0
      ),

    rateType:
      getValue(
        "cabRateType"
      ) || "Per Day",

    location:
      getValue(
        "cabLocation"
      ),

    notes:
      getValue(
        "cabNotes"
      ),

    status:
      getValue(
        "cabStatus"
      ) || "Available",

    updatedAt:
      serverTimestamp()

  };


  try {

    const existingId =
      getValue(
        "cabDocId"
      );


    // ==================================================
    // EDIT
    // ==================================================

    if (existingId) {

      await updateDoc(

        doc(
          db,
          "cabs",
          existingId
        ),

        cabData

      );


      showCabMessage(
        "Cab updated successfully.",
        "#15803d"
      );

    }


    // ==================================================
    // NEW
    // ==================================================

    else {

      cabData.createdAt =
        serverTimestamp();


      cabData.createdBy =
        auth.currentUser
          ? auth.currentUser.email
          : "";


      const cabRef =
        await addDoc(

          collection(
            db,
            "cabs"
          ),

          cabData

        );


      const cabId =
        "CAB-" +
        cabRef.id
          .substring(0, 6)
          .toUpperCase();


      await updateDoc(

        cabRef,

        {
          cabId:
            cabId
        }

      );


      showCabMessage(
        "Cab saved successfully.",
        "#15803d"
      );

    }


    await loadCabs();


    setTimeout(
      closeCabModal,
      700
    );


  } catch (error) {

    console.error(
      "Cab save error:",
      error
    );


    showCabMessage(
      "Could not save cab. Check Firestore rules.",
      "#dc2626"
    );

  }

}


// ======================================================
// LOAD CABS
// ======================================================

async function loadCabs() {

  const table =
    getElement(
      "cabsTableBody"
    );


  if (!table) return;


  table.innerHTML = `
    <tr>
      <td
        colspan="10"
        class="empty-table"
      >
        Loading cabs...
      </td>
    </tr>
  `;


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "cabs"
        )
      );


    allCabs =
      snapshot.docs.map(
        (document) => ({

          id:
            document.id,

          ...document.data()

        })
      );


    renderCabs(
      allCabs
    );


  } catch (error) {

    console.error(
      "Cab loading error:",
      error
    );


    table.innerHTML = `
      <tr>
        <td
          colspan="10"
          class="empty-table"
        >
          Unable to load cabs.
          Check Firestore security rules.
        </td>
      </tr>
    `;

  }

}


// ======================================================
// RENDER CABS
// ======================================================

function renderCabs(
  cabs
) {

  const table =
    getElement(
      "cabsTableBody"
    );


  if (!table) return;


  if (!cabs.length) {

    table.innerHTML = `
      <tr>
        <td
          colspan="10"
          class="empty-table"
        >
          No cabs found.
          Click "+ Add Cab" to create one.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML =
    cabs
      .map(
        (cab) => `

          <tr>

            <td>
              ${escapeHtml(
                cab.cabId ||
                "-"
              )}
            </td>

            <td>
              <strong>
                ${escapeHtml(
                  cab.name ||
                  "-"
                )}
              </strong>
            </td>

            <td>
              ${escapeHtml(
                cab.vehicleNumber ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                cab.type ||
                "-"
              )}
            </td>

            <td>
              ${Number(
                cab.capacity || 0
              )}
            </td>

            <td>
              ${escapeHtml(
                cab.driverName ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                cab.driverPhone ||
                "-"
              )}
            </td>

            <td>
              ₹${Number(
                cab.rate || 0
              ).toLocaleString(
                "en-IN"
              )}
              <small>
                / ${escapeHtml(
                  cab.rateType ||
                  ""
                )}
              </small>
            </td>

            <td>
              <span class="status-badge">
                ${escapeHtml(
                  cab.status ||
                  "Available"
                )}
              </span>
            </td>

            <td>

              <button
                class="edit-btn"
                data-cab-edit-id="${cab.id}"
              >
                Edit
              </button>

              <button
                class="danger-btn"
                data-cab-delete-id="${cab.id}"
              >
                Delete
              </button>

            </td>

          </tr>

        `
      )
      .join("");


  setupCabRowActions();

}


// ======================================================
// ROW ACTIONS
// ======================================================

function setupCabRowActions() {

  document
    .querySelectorAll(
      "[data-cab-edit-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const cab =
              allCabs.find(
                (item) =>
                  item.id ===
                  button.dataset
                    .cabEditId
              );


            if (cab) {

              openCabModal(
                cab
              );

            }

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-cab-delete-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            deleteCab(
              button.dataset
                .cabDeleteId
            );

          }
        );

      }
    );

}


// ======================================================
// DELETE CAB
// ======================================================

async function deleteCab(
  id
) {

  const cab =
    allCabs.find(
      (item) =>
        item.id === id
    );


  const confirmed =
    confirm(
      `Delete cab "${cab?.name || ""}"?`
    );


  if (!confirmed) return;


  try {

    await deleteDoc(
      doc(
        db,
        "cabs",
        id
      )
    );


    await loadCabs();


  } catch (error) {

    console.error(
      "Cab delete error:",
      error
    );


    alert(
      "Could not delete cab."
    );

  }

}


// ======================================================
// SEARCH
// ======================================================

function setupCabSearch() {

  const searchBox =
    getElement(
      "cabSearch"
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

        renderCabs(
          allCabs
        );

        return;

      }


      const filtered =
        allCabs.filter(
          (cab) => {

            return (

              String(
                cab.cabId ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                cab.name ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                cab.vehicleNumber ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                cab.type ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                cab.driverName ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                cab.location ||
                ""
              )
                .toLowerCase()
                .includes(search)

            );

          }
        );


      renderCabs(
        filtered
      );

    }
  );

}


// ======================================================
// MESSAGE
// ======================================================

function showCabMessage(
  text,
  color
) {

  const message =
    getElement(
      "cabFormMessage"
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
