// ======================================================
// PACKAGES MODULE
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

let allPackages = [];


// ======================================================
// INITIALIZE
// ======================================================

export function initPackages() {

  setupPackageButtons();

  setupPackageForm();

  setupPackageSearch();

  loadPackages();

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

function setupPackageButtons() {

  const addButton =
    getElement("addPackageBtn");

  const closeButton =
    getElement("closePackageModal");

  const cancelButton =
    getElement("cancelPackageBtn");


  if (addButton) {

    addButton.addEventListener(
      "click",
      () => openPackageModal()
    );

  }


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closePackageModal
    );

  }


  if (cancelButton) {

    cancelButton.addEventListener(
      "click",
      closePackageModal
    );

  }

}


// ======================================================
// FORM
// ======================================================

function setupPackageForm() {

  const form =
    getElement("packageForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    savePackage
  );

}


// ======================================================
// OPEN MODAL
// ======================================================

function openPackageModal(
  packageData = null
) {

  const modal =
    getElement("packageModal");

  const form =
    getElement("packageForm");

  const title =
    getElement("packageModalTitle");

  const message =
    getElement("packageFormMessage");


  if (!modal || !form) return;


  modal.style.display =
    "flex";


  if (message) {

    message.textContent =
      "";

  }


  if (packageData) {

    if (title) {

      title.textContent =
        "Edit Package";

    }


    setValue(
      "packageDocId",
      packageData.id
    );

    setValue(
      "packageName",
      packageData.name
    );

    setValue(
      "packageDestination",
      packageData.destination
    );

    setValue(
      "packageCategory",
      packageData.category ||
      "Domestic"
    );

    setValue(
      "packageDuration",
      packageData.duration
    );

    setValue(
      "packagePax",
      packageData.pax
    );

    setValue(
      "packagePrice",
      packageData.price
    );

    setValue(
      "packageDescription",
      packageData.description
    );

    setValue(
      "packageStatus",
      packageData.status ||
      "Active"
    );

  } else {

    if (title) {

      title.textContent =
        "Add Package";

    }


    form.reset();


    setValue(
      "packageDocId",
      ""
    );

    setValue(
      "packageCategory",
      "Domestic"
    );

    setValue(
      "packageStatus",
      "Active"
    );

  }

}


// ======================================================
// CLOSE MODAL
// ======================================================

function closePackageModal() {

  const modal =
    getElement("packageModal");

  const form =
    getElement("packageForm");


  if (modal) {

    modal.style.display =
      "none";

  }


  if (form) {

    form.reset();

  }


  setValue(
    "packageDocId",
    ""
  );

  setValue(
    "packageCategory",
    "Domestic"
  );

  setValue(
    "packageStatus",
    "Active"
  );

}


// ======================================================
// SAVE PACKAGE
// ======================================================

async function savePackage(event) {

  event.preventDefault();


  showPackageMessage(
    "Saving package...",
    "#1769e0"
  );


  const packageData = {

    name:
      getValue(
        "packageName"
      ),

    destination:
      getValue(
        "packageDestination"
      ),

    category:
      getValue(
        "packageCategory"
      ) || "Domestic",

    duration:
      getValue(
        "packageDuration"
      ),

    pax:
      Number(
        getValue(
          "packagePax"
        ) || 0
      ),

    price:
      Number(
        getValue(
          "packagePrice"
        ) || 0
      ),

    description:
      getValue(
        "packageDescription"
      ),

    status:
      getValue(
        "packageStatus"
      ) || "Active",

    updatedAt:
      serverTimestamp()

  };


  try {

    const existingId =
      getValue(
        "packageDocId"
      );


    // ==================================================
    // EDIT
    // ==================================================

    if (existingId) {

      await updateDoc(

        doc(
          db,
          "packages",
          existingId
        ),

        packageData

      );


      showPackageMessage(
        "Package updated successfully.",
        "#15803d"
      );

    }


    // ==================================================
    // NEW
    // ==================================================

    else {

      packageData.createdAt =
        serverTimestamp();


      packageData.createdBy =
        auth.currentUser
          ? auth.currentUser.email
          : "";


      const packageRef =
        await addDoc(

          collection(
            db,
            "packages"
          ),

          packageData

        );


      const packageId =
        "PKG-" +
        packageRef.id
          .substring(0, 6)
          .toUpperCase();


      await updateDoc(

        packageRef,

        {
          packageId:
            packageId
        }

      );


      showPackageMessage(
        "Package saved successfully.",
        "#15803d"
      );

    }


    await loadPackages();


    setTimeout(
      closePackageModal,
      700
    );


  } catch (error) {

    console.error(
      "Package save error:",
      error
    );


    showPackageMessage(
      "Could not save package. Check Firestore rules.",
      "#dc2626"
    );

  }

}


// ======================================================
// LOAD PACKAGES
// ======================================================

async function loadPackages() {

  const table =
    getElement(
      "packagesTableBody"
    );


  if (!table) return;


  table.innerHTML = `
    <tr>
      <td
        colspan="9"
        class="empty-table"
      >
        Loading packages...
      </td>
    </tr>
  `;


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "packages"
        )
      );


    allPackages =
      snapshot.docs.map(
        (document) => ({

          id:
            document.id,

          ...document.data()

        })
      );


    renderPackages(
      allPackages
    );


  } catch (error) {

    console.error(
      "Package loading error:",
      error
    );


    table.innerHTML = `
      <tr>
        <td
          colspan="9"
          class="empty-table"
        >
          Unable to load packages.
          Check Firestore security rules.
        </td>
      </tr>
    `;

  }

}


// ======================================================
// RENDER PACKAGES
// ======================================================

function renderPackages(
  packages
) {

  const table =
    getElement(
      "packagesTableBody"
    );


  if (!table) return;


  if (!packages.length) {

    table.innerHTML = `
      <tr>
        <td
          colspan="9"
          class="empty-table"
        >
          No packages found.
          Click "+ Add Package" to create one.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML =
    packages
      .map(
        (packageData) => `

          <tr>

            <td>
              ${escapeHtml(
                packageData.packageId ||
                "-"
              )}
            </td>

            <td>
              <strong>
                ${escapeHtml(
                  packageData.name ||
                  "-"
                )}
              </strong>
            </td>

            <td>
              ${escapeHtml(
                packageData.destination ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                packageData.category ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                packageData.duration ||
                "-"
              )}
            </td>

            <td>
              ${Number(
                packageData.pax || 0
              )}
            </td>

            <td>
              ₹${Number(
                packageData.price || 0
              ).toLocaleString(
                "en-IN"
              )}
            </td>

            <td>
              <span class="status-badge">
                ${escapeHtml(
                  packageData.status ||
                  "Active"
                )}
              </span>
            </td>

            <td>

              <button
                class="edit-btn"
                data-package-edit-id="${packageData.id}"
              >
                Edit
              </button>

              <button
                class="danger-btn"
                data-package-delete-id="${packageData.id}"
              >
                Delete
              </button>

            </td>

          </tr>

        `
      )
      .join("");


  setupPackageRowActions();

}


// ======================================================
// ROW ACTIONS
// ======================================================

function setupPackageRowActions() {

  document
    .querySelectorAll(
      "[data-package-edit-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const packageData =
              allPackages.find(
                (item) =>
                  item.id ===
                  button.dataset
                    .packageEditId
              );


            if (packageData) {

              openPackageModal(
                packageData
              );

            }

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-package-delete-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            deletePackage(
              button.dataset
                .packageDeleteId
            );

          }
        );

      }
    );

}


// ======================================================
// DELETE PACKAGE
// ======================================================

async function deletePackage(
  id
) {

  const packageData =
    allPackages.find(
      (item) =>
        item.id === id
    );


  const confirmed =
    confirm(
      `Delete package "${packageData?.name || ""}"?`
    );


  if (!confirmed) return;


  try {

    await deleteDoc(
      doc(
        db,
        "packages",
        id
      )
    );


    await loadPackages();


  } catch (error) {

    console.error(
      "Package delete error:",
      error
    );


    alert(
      "Could not delete package."
    );

  }

}


// ======================================================
// SEARCH
// ======================================================

function setupPackageSearch() {

  const searchBox =
    getElement(
      "packageSearch"
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

        renderPackages(
          allPackages
        );

        return;

      }


      const filtered =
        allPackages.filter(
          (packageData) => {

            return (

              String(
                packageData.packageId ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                packageData.name ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                packageData.destination ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                packageData.category ||
                ""
              )
                .toLowerCase()
                .includes(search)

            );

          }
        );


      renderPackages(
        filtered
      );

    }
  );

}


// ======================================================
// MESSAGE
// ======================================================

function showPackageMessage(
  text,
  color
) {

  const message =
    getElement(
      "packageFormMessage"
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
