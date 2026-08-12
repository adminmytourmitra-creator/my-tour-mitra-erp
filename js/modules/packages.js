// ======================================================
// MY TOUR MITRA ERP
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
let itineraryDays = [];

// ======================================================
// INITIALIZE
// ======================================================

export function initPackages() {

  setupPackageButtons();
  setupPackageForm();
  setupPackageSearch();
  setupItineraryControls();

  // Package description editor
  setupRichTextEditors();

  loadPackages();

}

// ======================================================
// ELEMENT HELPER
// ======================================================

function getElement(id) {

  return document.getElementById(id);

}

// ======================================================
// PACKAGE BUTTONS
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
// PACKAGE FORM
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
// ITINERARY CONTROLS
// ======================================================

function setupItineraryControls() {

  const addDayButton =
    getElement("addItineraryDayBtn");

  if (!addDayButton) return;

  addDayButton.addEventListener(
    "click",
    addItineraryDay
  );

}

// ======================================================
// OPEN PACKAGE MODAL
// ======================================================

function openPackageModal(packageData = null) {

  const modal =
    getElement("packageModal");

  const form =
    getElement("packageForm");

  const title =
    getElement("packageModalTitle");

  const message =
    getElement("packageFormMessage");


  if (!modal || !form) return;


  modal.style.display = "flex";


  if (message) {

    message.textContent = "";

  }


  // ====================================================
  // EDIT PACKAGE
  // ====================================================

  if (packageData) {

    if (title) {

      title.textContent =
        "Edit Package";

    }


    setValue(
      "packageDocId",
      packageData.id || ""
    );


    setValue(
      "packageName",
      packageData.name || ""
    );


    setValue(
      "packageDestination",
      packageData.destination || ""
    );


    setValue(
      "packageNights",
      packageData.nights ?? ""
    );


    setValue(
      "packageDays",
      packageData.days ?? ""
    );


    setValue(
      "packageType",
      packageData.type || "Domestic"
    );


    setValue(
      "packagePrice",
      packageData.price ?? ""
    );


    setValue(
      "packageMealPlan",
      packageData.mealPlan || "Breakfast"
    );


    setValue(
      "packageVehicle",
      packageData.vehicle || "Cab"
    );


    setValue(
      "packageStatus",
      packageData.status || "Active"
    );


    // -----------------------------------------------
    // LOAD DESCRIPTION RICH TEXT
    // -----------------------------------------------

    setRichTextValue(
      "packageDescription",
      packageData.description || ""
    );


    // -----------------------------------------------
    // LOAD ITINERARY
    // -----------------------------------------------

    itineraryDays =
      Array.isArray(packageData.itinerary)

        ? packageData.itinerary.map(
            (day, index) => ({

              day:
                index + 1,

              title:
                day.title || "",

              description:
                day.description || "",

              meals:
                day.meals || "None",

              overnight:
                day.overnight || ""

            })
          )

        : [];


    if (!itineraryDays.length) {

      itineraryDays = [
        {
          day: 1,
          title: "",
          description: "",
          meals: "None",
          overnight: ""
        }
      ];

    }


    renderItineraryDays();

  }


  // ====================================================
  // NEW PACKAGE
  // ====================================================

  else {

    if (title) {

      title.textContent =
        "Add Package";

    }


    form.reset();


    // Clear package description
    setRichTextValue(
      "packageDescription",
      ""
    );


    setValue(
      "packageDocId",
      ""
    );


    setValue(
      "packageNights",
      2
    );


    setValue(
      "packageDays",
      3
    );


    setValue(
      "packageType",
      "Domestic"
    );


    setValue(
      "packageMealPlan",
      "Breakfast"
    );


    setValue(
      "packageVehicle",
      "Cab"
    );


    setValue(
      "packageStatus",
      "Active"
    );


    // -----------------------------------------------
    // ONLY DAY 1 AT START
    // -----------------------------------------------

    itineraryDays = [

      {
        day: 1,
        title: "",
        description: "",
        meals: "None",
        overnight: ""
      }

    ];


    renderItineraryDays();

  }

}

// ======================================================
// SET VALUE HELPER
// ======================================================

function setValue(id, value) {

  const element =
    getElement(id);

  if (!element) return;

  element.value =
    value;

}

// ======================================================
// SET RICH TEXT VALUE
// ======================================================

function setRichTextValue(id, value) {

  const element =
    getElement(id);

  if (!element) return;

  element.innerHTML =
    sanitizeRichText(
      value || ""
    );

}

// ======================================================
// CLOSE PACKAGE MODAL
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


  // Clear description
  const description =
    getElement("packageDescription");

  if (description) {

    description.innerHTML = "";

  }


  const docId =
    getElement("packageDocId");


  if (docId) {

    docId.value = "";

  }


  itineraryDays = [];

}

// ======================================================
// ADD ITINERARY DAY
// ======================================================

function addItineraryDay() {

  // IMPORTANT:
  // Save everything currently typed before re-rendering

  collectItineraryFromDOM();


  const nextDay =
    itineraryDays.length + 1;


  itineraryDays.push({

    day:
      nextDay,

    title:
      "",

    description:
      "",

    meals:
      "None",

    overnight:
      ""

  });


  renderItineraryDays();


  // Scroll to newly added day

  setTimeout(() => {

    const container =
      getElement("itineraryDays");

    if (!container) return;


    const lastDay =
      container.lastElementChild;


    if (lastDay) {

      lastDay.scrollIntoView({

        behavior:
          "smooth",

        block:
          "nearest"

      });

    }

  }, 100);

}

// ======================================================
// REMOVE ITINERARY DAY
// ======================================================

function removeItineraryDay(index) {

  collectItineraryFromDOM();


  if (itineraryDays.length <= 1) {

    alert(
      "At least one itinerary day is required."
    );

    return;

  }


  itineraryDays.splice(
    index,
    1
  );


  // Renumber days

  itineraryDays =
    itineraryDays.map(
      (day, position) => ({

        ...day,

        day:
          position + 1

      })
    );


  renderItineraryDays();

}

// ======================================================
// COLLECT ITINERARY FROM DOM
// ======================================================

function collectItineraryFromDOM() {

  const dayElements =
    document.querySelectorAll(
      "#itineraryDays .itinerary-day"
    );


  if (!dayElements.length) {

    return;

  }


  itineraryDays =
    Array.from(dayElements)
      .map(
        (dayElement, index) => {

          const title =
            dayElement.querySelector(
              ".itinerary-title"
            );


          const description =
            dayElement.querySelector(
              ".itinerary-description"
            );


          const meals =
            dayElement.querySelector(
              ".itinerary-meals"
            );


          const overnight =
            dayElement.querySelector(
              ".itinerary-overnight"
            );


          // -----------------------------------------
          // RICH TEXT HTML
          // -----------------------------------------

          let descriptionValue = "";


          if (description) {

            if (
              description.isContentEditable
            ) {

              descriptionValue =
                sanitizeRichText(
                  description.innerHTML.trim()
                );

            }

            else {

              descriptionValue =
                String(
                  description.value || ""
                ).trim();

            }

          }


          return {

            day:
              index + 1,

            title:
              title?.value.trim() || "",

            description:
              descriptionValue,

            meals:
              meals?.value || "None",

            overnight:
              overnight?.value.trim() || ""

          };

        }
      );

}

// ======================================================
// RENDER ITINERARY
// ======================================================

function renderItineraryDays() {

  const container =
    getElement("itineraryDays");


  if (!container) return;


  // -----------------------------------------------
  // MAKE SURE DAY 1 EXISTS
  // -----------------------------------------------

  if (!itineraryDays.length) {

    itineraryDays = [

      {
        day: 1,
        title: "",
        description: "",
        meals: "None",
        overnight: ""
      }

    ];

  }


  container.innerHTML =

    itineraryDays
      .map(
        (dayData, index) => `

          <div
            class="itinerary-day"
            data-day="${index + 1}"
          >

            <!-- =====================================
                 DAY HEADER
            ====================================== -->

            <div
              class="itinerary-day-header"
            >

              <h4>
                Day ${index + 1}
              </h4>


              ${
                itineraryDays.length > 1
                  ? `
                    <button
                      type="button"
                      class="danger-btn"
                      data-remove-itinerary="${index}"
                    >
                      Remove Day
                    </button>
                  `
                  : ""
              }

            </div>


            <div class="form-grid">


              <!-- ===================================
                   DAY TITLE
              ==================================== -->

              <div class="form-group">

                <label>
                  Day Title
                </label>


                <input
                  type="text"
                  class="itinerary-title"
                  placeholder="e.g. Guwahati to Shillong"
                  value="${escapeAttribute(
                    dayData.title
                  )}"
                >

              </div>


              <!-- ===================================
                   MEALS
              ==================================== -->

              <div class="form-group">

                <label>
                  Meals
                </label>


                <select
                  class="itinerary-meals"
                >

                  <option
                    value="None"
                    ${
                      dayData.meals === "None"
                        ? "selected"
                        : ""
                    }
                  >
                    None
                  </option>


                  <option
                    value="Breakfast"
                    ${
                      dayData.meals === "Breakfast"
                        ? "selected"
                        : ""
                    }
                  >
                    Breakfast
                  </option>


                  <option
                    value="Lunch"
                    ${
                      dayData.meals === "Lunch"
                        ? "selected"
                        : ""
                    }
                  >
                    Lunch
                  </option>


                  <option
                    value="Dinner"
                    ${
                      dayData.meals === "Dinner"
                        ? "selected"
                        : ""
                    }
                  >
                    Dinner
                  </option>


                  <option
                    value="Breakfast & Dinner"
                    ${
                      dayData.meals ===
                      "Breakfast & Dinner"
                        ? "selected"
                        : ""
                    }
                  >
                    Breakfast &amp; Dinner
                  </option>


                  <option
                    value="All Meals"
                    ${
                      dayData.meals === "All Meals"
                        ? "selected"
                        : ""
                    }
                  >
                    All Meals
                  </option>

                </select>

              </div>


              <!-- ===================================
                   ITINERARY DETAILS
              ==================================== -->

              <div
                class="form-group full-width"
              >

                <label>
                  Itinerary Details
                </label>


                <div
                  class="rich-editor itinerary-rich-editor"
                >

                  <!-- TOOLBAR -->

                  <div
                    class="rich-toolbar"
                  >

                    <button
                      type="button"
                      data-command="bold"
                      title="Bold"
                    >
                      <b>B</b>
                    </button>


                    <button
                      type="button"
                      data-command="italic"
                      title="Italic"
                    >
                      <i>I</i>
                    </button>


                    <button
                      type="button"
                      data-command="underline"
                      title="Underline"
                    >
                      <u>U</u>
                    </button>


                    <button
                      type="button"
                      data-command="insertUnorderedList"
                      title="Bullet List"
                    >
                      • List
                    </button>


                    <button
                      type="button"
                      data-command="insertOrderedList"
                      title="Numbered List"
                    >
                      1. List
                    </button>


                    <!-- RED -->

                    <button
                      type="button"
                      data-command="foreColor"
                      data-value="#dc2626"
                      title="Red Text"
                    >
                      <span
                        style="color:#dc2626;font-weight:bold;"
                      >
                        A
                      </span>
                    </button>


                    <!-- BLUE -->

                    <button
                      type="button"
                      data-command="foreColor"
                      data-value="#2563eb"
                      title="Blue Text"
                    >
                      <span
                        style="color:#2563eb;font-weight:bold;"
                      >
                        A
                      </span>
                    </button>


                    <!-- GREEN -->

                    <button
                      type="button"
                      data-command="foreColor"
                      data-value="#15803d"
                      title="Green Text"
                    >
                      <span
                        style="color:#15803d;font-weight:bold;"
                      >
                        A
                      </span>
                    </button>


                    <!-- BLACK -->

                    <button
                      type="button"
                      data-command="foreColor"
                      data-value="#111827"
                      title="Black Text"
                    >
                      A
                    </button>


                    <!-- HIGHLIGHT -->

                    <button
                      type="button"
                      data-command="hiliteColor"
                      data-value="#fef08a"
                      title="Highlight"
                    >
                      🖍
                    </button>


                    <!-- CLEAR -->

                    <button
                      type="button"
                      data-command="removeFormat"
                      title="Clear Formatting"
                    >
                      Clear
                    </button>

                  </div>


                  <!-- EDITABLE AREA -->

                  <div
                    class="rich-content itinerary-description"
                    contenteditable="true"
                    data-placeholder="Describe the day's activities, sightseeing, transfers, places to visit etc."
                  >${sanitizeRichText(
                    dayData.description || ""
                  )}</div>

                </div>

              </div>


              <!-- ===================================
                   OVERNIGHT
              ==================================== -->

              <div class="form-group">

                <label>
                  Overnight Stay
                </label>


                <input
                  type="text"
                  class="itinerary-overnight"
                  placeholder="e.g. Shillong"
                  value="${escapeAttribute(
                    dayData.overnight
                  )}"
                >

              </div>


            </div>

          </div>

        `
      )
      .join("");


  // ====================================================
  // REMOVE DAY BUTTONS
  // ====================================================

  container
    .querySelectorAll(
      "[data-remove-itinerary]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            removeItineraryDay(
              Number(
                button.dataset
                  .removeItinerary
              )
            );

          }
        );

      }
    );


  // ====================================================
  // RICH TEXT EDITORS
  // ====================================================

  setupRichTextEditors();

}

// ======================================================
// RICH TEXT EDITOR SETUP
// DESCRIPTION + ITINERARY
// ======================================================

function setupRichTextEditors() {

  const editors =
    document.querySelectorAll(
      ".rich-editor"
    );


  editors.forEach(
    (editor) => {

      const toolbar =
        editor.querySelector(
          ".rich-toolbar"
        );


      const content =
        editor.querySelector(
          ".rich-content"
        );


      if (!toolbar || !content) {

        return;

      }


      // Prevent duplicate listeners
      // when itinerary is re-rendered

      if (
        editor.dataset.richReady === "true"
      ) {

        return;

      }


      editor.dataset.richReady =
        "true";


      const buttons =
        toolbar.querySelectorAll(
          "button[data-command]"
        );


      buttons.forEach(
        (button) => {

          // -----------------------------------------
          // PRESERVE TEXT SELECTION
          // -----------------------------------------

          button.addEventListener(
            "mousedown",
            (event) => {

              event.preventDefault();

            }
          );


          // -----------------------------------------
          // COMMAND
          // -----------------------------------------

          button.addEventListener(
            "click",
            (event) => {

              event.preventDefault();


              const command =
                button.dataset.command;


              const value =
                button.dataset.value ||
                null;


              if (!command) {

                return;

              }


              // Restore editor focus

              content.focus();


              try {

                document.execCommand(
                  command,
                  false,
                  value
                );


                // Keep browser rendering updated

                content.dispatchEvent(
                  new Event(
                    "input",
                    {
                      bubbles: true
                    }
                  )
                );


              } catch (error) {

                console.error(
                  "Rich editor command error:",
                  error
                );

              }

            }
          );

        }
      );

    }
  );

}

// ======================================================
// SAVE PACKAGE
// ======================================================

async function savePackage(event) {

  event.preventDefault();


  // -----------------------------------------------
  // FIRST SAVE ITINERARY EDITOR CONTENT
  // -----------------------------------------------

  collectItineraryFromDOM();


  const message =
    getElement("packageFormMessage");


  if (message) {

    message.style.color =
      "#1769e0";

    message.textContent =
      "Saving package...";

  }


  // -----------------------------------------------
  // DESCRIPTION HTML
  // -----------------------------------------------

  const descriptionElement =
    getElement("packageDescription");


  const packageDescription =
    descriptionElement
      ? sanitizeRichText(
          descriptionElement.innerHTML.trim()
        )
      : "";


  // -----------------------------------------------
  // PACKAGE DATA
  // -----------------------------------------------

  const packageData = {

    name:
      getElement("packageName")
        ?.value
        .trim() || "",


    destination:
      getElement("packageDestination")
        ?.value
        .trim() || "",


    nights:
      Number(
        getElement("packageNights")
          ?.value || 0
      ),


    days:
      Number(
        getElement("packageDays")
          ?.value || 0
      ),


    type:
      getElement("packageType")
        ?.value || "Domestic",


    price:
      Number(
        getElement("packagePrice")
          ?.value || 0
      ),


    mealPlan:
      getElement("packageMealPlan")
        ?.value || "Breakfast",


    vehicle:
      getElement("packageVehicle")
        ?.value || "Cab",


    status:
      getElement("packageStatus")
        ?.value || "Active",


    // IMPORTANT:
    // Save HTML, not .value

    description:
      packageDescription,


    // Itinerary includes HTML formatting

    itinerary:
      itineraryDays,


    updatedAt:
      serverTimestamp()

  };


  // ====================================================
  // VALIDATION
  // ====================================================

  if (!packageData.name) {

    showPackageMessage(
      "Please enter package name.",
      "#dc2626"
    );

    return;

  }


  if (!packageData.destination) {

    showPackageMessage(
      "Please enter destination.",
      "#dc2626"
    );

    return;

  }


  try {

    const existingId =
      getElement("packageDocId")
        ?.value || "";


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
    // NEW PACKAGE
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


    // Reload package list

    await loadPackages();


    // Close after success

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
// MESSAGE
// ======================================================

function showPackageMessage(
  text,
  color
) {

  const message =
    getElement("packageFormMessage");


  if (!message) return;


  message.style.color =
    color;


  message.textContent =
    text;

}

// ======================================================
// LOAD PACKAGES
// ======================================================

async function loadPackages() {

  const table =
    getElement("packagesTableBody");


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

function renderPackages(packages) {

  const table =
    getElement("packagesTableBody");


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
                packageData.packageId || "-"
              )}
            </td>


            <td>

              <strong>
                ${escapeHtml(
                  packageData.name || "-"
                )}
              </strong>

            </td>


            <td>
              ${escapeHtml(
                packageData.destination || "-"
              )}
            </td>


            <td>

              ${packageData.nights || 0}N /
              ${packageData.days || 0}D

            </td>


            <td>

              ${escapeHtml(
                packageData.type || "-"
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

              ${escapeHtml(
                packageData.mealPlan || "-"
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
                type="button"
              >
                Edit
              </button>


              <button
                class="danger-btn"
                data-package-delete-id="${packageData.id}"
                type="button"
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

  // -----------------------------------------------
  // EDIT
  // -----------------------------------------------

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


  // -----------------------------------------------
  // DELETE
  // -----------------------------------------------

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

async function deletePackage(id) {

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
    getElement("packageSearch");


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
                packageData.name || ""
              )
                .toLowerCase()
                .includes(search)


              ||


              String(
                packageData.destination || ""
              )
                .toLowerCase()
                .includes(search)


              ||


              String(
                packageData.packageId || ""
              )
                .toLowerCase()
                .includes(search)


              ||


              String(
                packageData.type || ""
              )
                .toLowerCase()
                .includes(search)


              ||


              String(
                packageData.status || ""
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

// ======================================================
// ATTRIBUTE ESCAPE
// ======================================================

function escapeAttribute(value) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    );

}

// ======================================================
// RICH TEXT SANITIZER
// ======================================================

function sanitizeRichText(value) {

  if (!value) return "";


  const wrapper =
    document.createElement("div");


  wrapper.innerHTML =
    String(value);


  const allowedTags = [

    "B",
    "STRONG",

    "I",
    "EM",

    "U",

    "UL",
    "OL",
    "LI",

    "BR",

    "SPAN"

  ];


  // -----------------------------------------------
  // Remove unsafe elements
  // -----------------------------------------------

  wrapper
    .querySelectorAll("*")
    .forEach(
      (element) => {

        if (
          !allowedTags.includes(
            element.tagName
          )
        ) {

          element.replaceWith(
            ...Array.from(
              element.childNodes
            )
          );

          return;

        }


        // -----------------------------------------
        // Remove all attributes except style
        // -----------------------------------------

        Array.from(
          element.attributes
        ).forEach(
          (attribute) => {

            if (
              attribute.name !== "style"
            ) {

              element.removeAttribute(
                attribute.name
              );

            }

          }
        );


        // -----------------------------------------
        // SAFE STYLE FILTER
        // -----------------------------------------

        if (
          element.hasAttribute("style")
        ) {

          const style =
            element.getAttribute(
              "style"
            );


          const safeParts = [];


          style
            .split(";")
            .forEach(
              (part) => {

                const trimmed =
                  part.trim();


                if (
                  /^(color|background-color|font-weight|font-style|text-decoration)\s*:/i
                    .test(trimmed)
                ) {

                  safeParts.push(
                    trimmed
                  );

                }

              }
            );


          if (safeParts.length) {

            element.setAttribute(
              "style",
              safeParts.join(";")
            );

          }

          else {

            element.removeAttribute(
              "style"
            );

          }

        }

      }
    );


  return wrapper.innerHTML;

}
