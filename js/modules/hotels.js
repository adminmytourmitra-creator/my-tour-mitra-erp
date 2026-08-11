// ======================================================
// HOTELS MODULE
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

let allHotels = [];


// ======================================================
// INITIALIZE
// ======================================================

export function initHotels() {

  setupHotelButtons();

  setupHotelForm();

  setupHotelSearch();

  loadHotels();

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

function setupHotelButtons() {

  const addButton =
    getElement("addHotelBtn");

  const closeButton =
    getElement("closeHotelModal");

  const cancelButton =
    getElement("cancelHotelBtn");


  if (addButton) {

    addButton.addEventListener(
      "click",
      () => openHotelModal()
    );

  }


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeHotelModal
    );

  }


  if (cancelButton) {

    cancelButton.addEventListener(
      "click",
      closeHotelModal
    );

  }

}


// ======================================================
// FORM
// ======================================================

function setupHotelForm() {

  const form =
    getElement("hotelForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    saveHotel
  );

}


// ======================================================
// OPEN MODAL
// ======================================================

function openHotelModal(
  hotel = null
) {

  const modal =
    getElement("hotelModal");

  const form =
    getElement("hotelForm");

  const title =
    getElement("hotelModalTitle");

  const message =
    getElement("hotelFormMessage");


  if (!modal || !form) return;


  modal.style.display =
    "flex";


  if (message) {

    message.textContent =
      "";

  }


  if (hotel) {

    if (title) {

      title.textContent =
        "Edit Hotel";

    }


    setValue(
      "hotelDocId",
      hotel.id
    );

    setValue(
      "hotelName",
      hotel.name
    );

    setValue(
      "hotelCity",
      hotel.city
    );

    setValue(
      "hotelState",
      hotel.state
    );

    setValue(
      "hotelCategory",
      hotel.category ||
      "Standard"
    );

    setValue(
      "hotelRoomType",
      hotel.roomType ||
      "Standard"
    );

    setValue(
      "hotelMealPlan",
      hotel.mealPlan ||
      "CP"
    );

    setValue(
      "hotelRate",
      hotel.rate
    );

    setValue(
      "hotelContact",
      hotel.contact
    );

    setValue(
      "hotelNotes",
      hotel.notes
    );

    setValue(
      "hotelStatus",
      hotel.status ||
      "Active"
    );

  } else {

    if (title) {

      title.textContent =
        "Add Hotel";

    }


    form.reset();


    setValue(
      "hotelDocId",
      ""
    );

    setValue(
      "hotelCategory",
      "Standard"
    );

    setValue(
      "hotelRoomType",
      "Standard"
    );

    setValue(
      "hotelMealPlan",
      "CP"
    );

    setValue(
      "hotelStatus",
      "Active"
    );

  }

}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeHotelModal() {

  const modal =
    getElement("hotelModal");

  const form =
    getElement("hotelForm");


  if (modal) {

    modal.style.display =
      "none";

  }


  if (form) {

    form.reset();

  }


  setValue(
    "hotelDocId",
    ""
  );

  setValue(
    "hotelCategory",
    "Standard"
  );

  setValue(
    "hotelRoomType",
    "Standard"
  );

  setValue(
    "hotelMealPlan",
    "CP"
  );

  setValue(
    "hotelStatus",
    "Active"
  );

}


// ======================================================
// SAVE HOTEL
// ======================================================

async function saveHotel(event) {

  event.preventDefault();


  showHotelMessage(
    "Saving hotel...",
    "#1769e0"
  );


  const hotelData = {

    name:
      getValue(
        "hotelName"
      ),

    city:
      getValue(
        "hotelCity"
      ),

    state:
      getValue(
        "hotelState"
      ),

    category:
      getValue(
        "hotelCategory"
      ) || "Standard",

    roomType:
      getValue(
        "hotelRoomType"
      ) || "Standard",

    mealPlan:
      getValue(
        "hotelMealPlan"
      ) || "CP",

    rate:
      Number(
        getValue(
          "hotelRate"
        ) || 0
      ),

    contact:
      getValue(
        "hotelContact"
      ),

    notes:
      getValue(
        "hotelNotes"
      ),

    status:
      getValue(
        "hotelStatus"
      ) || "Active",

    updatedAt:
      serverTimestamp()

  };


  try {

    const existingId =
      getValue(
        "hotelDocId"
      );


    // ==================================================
    // EDIT
    // ==================================================

    if (existingId) {

      await updateDoc(

        doc(
          db,
          "hotels",
          existingId
        ),

        hotelData

      );


      showHotelMessage(
        "Hotel updated successfully.",
        "#15803d"
      );

    }


    // ==================================================
    // NEW
    // ==================================================

    else {

      hotelData.createdAt =
        serverTimestamp();


      hotelData.createdBy =
        auth.currentUser
          ? auth.currentUser.email
          : "";


      const hotelRef =
        await addDoc(

          collection(
            db,
            "hotels"
          ),

          hotelData

        );


      const hotelId =
        "HTL-" +
        hotelRef.id
          .substring(0, 6)
          .toUpperCase();


      await updateDoc(

        hotelRef,

        {
          hotelId:
            hotelId
        }

      );


      showHotelMessage(
        "Hotel saved successfully.",
        "#15803d"
      );

    }


    await loadHotels();


    setTimeout(
      closeHotelModal,
      700
    );


  } catch (error) {

    console.error(
      "Hotel save error:",
      error
    );


    showHotelMessage(
      "Could not save hotel. Check Firestore rules.",
      "#dc2626"
    );

  }

}


// ======================================================
// LOAD HOTELS
// ======================================================

async function loadHotels() {

  const table =
    getElement(
      "hotelsTableBody"
    );


  if (!table) return;


  table.innerHTML = `
    <tr>
      <td
        colspan="10"
        class="empty-table"
      >
        Loading hotels...
      </td>
    </tr>
  `;


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "hotels"
        )
      );


    allHotels =
      snapshot.docs.map(
        (document) => ({

          id:
            document.id,

          ...document.data()

        })
      );


    renderHotels(
      allHotels
    );


  } catch (error) {

    console.error(
      "Hotel loading error:",
      error
    );


    table.innerHTML = `
      <tr>
        <td
          colspan="10"
          class="empty-table"
        >
          Unable to load hotels.
          Check Firestore security rules.
        </td>
      </tr>
    `;

  }

}


// ======================================================
// RENDER HOTELS
// ======================================================

function renderHotels(
  hotels
) {

  const table =
    getElement(
      "hotelsTableBody"
    );


  if (!table) return;


  if (!hotels.length) {

    table.innerHTML = `
      <tr>
        <td
          colspan="10"
          class="empty-table"
        >
          No hotels found.
          Click "+ Add Hotel" to create one.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML =
    hotels
      .map(
        (hotel) => `

          <tr>

            <td>
              ${escapeHtml(
                hotel.hotelId ||
                "-"
              )}
            </td>

            <td>
              <strong>
                ${escapeHtml(
                  hotel.name ||
                  "-"
                )}
              </strong>
            </td>

            <td>
              ${escapeHtml(
                hotel.city ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                hotel.state ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                hotel.category ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                hotel.roomType ||
                "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                hotel.mealPlan ||
                "-"
              )}
            </td>

            <td>
              ₹${Number(
                hotel.rate || 0
              ).toLocaleString(
                "en-IN"
              )}
            </td>

            <td>
              <span class="status-badge">
                ${escapeHtml(
                  hotel.status ||
                  "Active"
                )}
              </span>
            </td>

            <td>

              <button
                class="edit-btn"
                data-hotel-edit-id="${hotel.id}"
              >
                Edit
              </button>

              <button
                class="danger-btn"
                data-hotel-delete-id="${hotel.id}"
              >
                Delete
              </button>

            </td>

          </tr>

        `
      )
      .join("");


  setupHotelRowActions();

}


// ======================================================
// ROW ACTIONS
// ======================================================

function setupHotelRowActions() {

  document
    .querySelectorAll(
      "[data-hotel-edit-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const hotel =
              allHotels.find(
                (item) =>
                  item.id ===
                  button.dataset
                    .hotelEditId
              );


            if (hotel) {

              openHotelModal(
                hotel
              );

            }

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-hotel-delete-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            deleteHotel(
              button.dataset
                .hotelDeleteId
            );

          }
        );

      }
    );

}


// ======================================================
// DELETE HOTEL
// ======================================================

async function deleteHotel(
  id
) {

  const hotel =
    allHotels.find(
      (item) =>
        item.id === id
    );


  const confirmed =
    confirm(
      `Delete hotel "${hotel?.name || ""}"?`
    );


  if (!confirmed) return;


  try {

    await deleteDoc(
      doc(
        db,
        "hotels",
        id
      )
    );


    await loadHotels();


  } catch (error) {

    console.error(
      "Hotel delete error:",
      error
    );


    alert(
      "Could not delete hotel."
    );

  }

}


// ======================================================
// SEARCH
// ======================================================

function setupHotelSearch() {

  const searchBox =
    getElement(
      "hotelSearch"
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

        renderHotels(
          allHotels
        );

        return;

      }


      const filtered =
        allHotels.filter(
          (hotel) => {

            return (

              String(
                hotel.hotelId ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                hotel.name ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                hotel.city ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                hotel.state ||
                ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                hotel.category ||
                ""
              )
                .toLowerCase()
                .includes(search)

            );

          }
        );


      renderHotels(
        filtered
      );

    }
  );

}


// ======================================================
// MESSAGE
// ======================================================

function showHotelMessage(
  text,
  color
) {

  const message =
    getElement(
      "hotelFormMessage"
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
