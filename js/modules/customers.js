// =====================================================
// CUSTOMERS MODULE
// =====================================================

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


// =====================================================
// STATE
// =====================================================

let allCustomers = [];


// =====================================================
// INITIALIZE MODULE
// =====================================================

export function initCustomers() {

  setupCustomerButtons();
  setupCustomerForm();
  setupCustomerSearch();

  loadCustomers();

}


// =====================================================
// ELEMENT HELPER
// =====================================================

function getElement(id) {

  return document.getElementById(id);

}


// =====================================================
// CUSTOMER BUTTONS
// =====================================================

function setupCustomerButtons() {

  const addButton =
    getElement("addCustomerBtn");

  const closeButton =
    getElement("closeCustomerModal");

  const cancelButton =
    getElement("cancelCustomerBtn");


  if (addButton) {

    addButton.addEventListener(
      "click",
      () => openCustomerModal()
    );

  }


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeCustomerModal
    );

  }


  if (cancelButton) {

    cancelButton.addEventListener(
      "click",
      closeCustomerModal
    );

  }

}


// =====================================================
// CUSTOMER FORM
// =====================================================

function setupCustomerForm() {

  const form =
    getElement("customerForm");

  if (!form) return;

  form.addEventListener(
    "submit",
    saveCustomer
  );

}


// =====================================================
// OPEN CUSTOMER MODAL
// =====================================================

function openCustomerModal(customer = null) {

  const modal =
    getElement("customerModal");

  const form =
    getElement("customerForm");

  const title =
    getElement("customerModalTitle");

  const message =
    getElement("customerFormMessage");


  if (!modal || !form) return;


  modal.style.display = "flex";


  if (message) {

    message.textContent = "";

  }


  // ---------------------------------------------------
  // EDIT CUSTOMER
  // ---------------------------------------------------

  if (customer) {

    if (title) {

      title.textContent =
        "Edit Customer";

    }


    getElement("customerDocId").value =
      customer.id || "";

    getElement("customerName").value =
      customer.name || "";

    getElement("customerMobile").value =
      customer.mobile || "";

    getElement("customerWhatsapp").value =
      customer.whatsapp || "";

    getElement("customerEmail").value =
      customer.email || "";

    getElement("customerCity").value =
      customer.city || "";

    getElement("customerCountry").value =
      customer.country || "India";

    getElement("customerType").value =
      customer.type || "Individual";

    getElement("customerSource").value =
      customer.source || "Direct";

    getElement("customerNotes").value =
      customer.notes || "";

  }


  // ---------------------------------------------------
  // NEW CUSTOMER
  // ---------------------------------------------------

  else {

    if (title) {

      title.textContent =
        "Add Customer";

    }


    form.reset();


    getElement("customerDocId").value =
      "";

    getElement("customerCountry").value =
      "India";

  }

}


// =====================================================
// CLOSE CUSTOMER MODAL
// =====================================================

function closeCustomerModal() {

  const modal =
    getElement("customerModal");

  const form =
    getElement("customerForm");


  if (modal) {

    modal.style.display =
      "none";

  }


  if (form) {

    form.reset();

  }


  const country =
    getElement("customerCountry");

  if (country) {

    country.value =
      "India";

  }


  const docId =
    getElement("customerDocId");

  if (docId) {

    docId.value =
      "";

  }

}


// =====================================================
// SAVE CUSTOMER
// =====================================================

async function saveCustomer(event) {

  event.preventDefault();


  const message =
    getElement("customerFormMessage");


  if (message) {

    message.style.color =
      "#1769e0";

    message.textContent =
      "Saving customer...";

  }


  const customerData = {

    name:
      getElement("customerName")
        ?.value
        .trim() || "",

    mobile:
      getElement("customerMobile")
        ?.value
        .trim() || "",

    whatsapp:
      getElement("customerWhatsapp")
        ?.value
        .trim() || "",

    email:
      getElement("customerEmail")
        ?.value
        .trim() || "",

    city:
      getElement("customerCity")
        ?.value
        .trim() || "",

    country:
      getElement("customerCountry")
        ?.value
        .trim() || "India",

    type:
      getElement("customerType")
        ?.value || "Individual",

    source:
      getElement("customerSource")
        ?.value || "Direct",

    notes:
      getElement("customerNotes")
        ?.value
        .trim() || "",

    updatedAt:
      serverTimestamp()

  };


  try {

    const existingId =
      getElement("customerDocId")
        ?.value;


    // -------------------------------------------------
    // EDIT EXISTING CUSTOMER
    // -------------------------------------------------

    if (existingId) {

      await updateDoc(

        doc(
          db,
          "customers",
          existingId
        ),

        customerData

      );


      showCustomerMessage(
        "Customer updated successfully.",
        "#15803d"
      );

    }


    // -------------------------------------------------
    // CREATE NEW CUSTOMER
    // -------------------------------------------------

    else {

      customerData.createdAt =
        serverTimestamp();

      customerData.createdBy =
        auth.currentUser
          ? auth.currentUser.email
          : "";


      const customerRef =
        await addDoc(

          collection(
            db,
            "customers"
          ),

          customerData

        );


      const customerId =
        "CUS-" +
        customerRef.id
          .substring(0, 6)
          .toUpperCase();


      await updateDoc(

        customerRef,

        {
          customerId:
            customerId
        }

      );


      showCustomerMessage(
        "Customer saved successfully.",
        "#15803d"
      );

    }


    await loadCustomers();


    setTimeout(
      closeCustomerModal,
      700
    );


  } catch (error) {

    console.error(
      "Customer save error:",
      error
    );


    showCustomerMessage(
      "Could not save customer. Check Firestore rules.",
      "#dc2626"
    );

  }

}


// =====================================================
// CUSTOMER MESSAGE
// =====================================================

function showCustomerMessage(
  text,
  color
) {

  const message =
    getElement("customerFormMessage");


  if (!message) return;


  message.style.color =
    color;

  message.textContent =
    text;

}


// =====================================================
// LOAD CUSTOMERS
// =====================================================

async function loadCustomers() {

  const table =
    getElement("customersTableBody");


  if (!table) return;


  table.innerHTML = `

    <tr>
      <td
        colspan="8"
        class="empty-table"
      >
        Loading customers...
      </td>
    </tr>

  `;


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

          id:
            document.id,

          ...document.data()

        })
      );


    renderCustomers(
      allCustomers
    );


    updateCustomerDashboard();


  } catch (error) {

    console.error(
      "Customer loading error:",
      error
    );


    table.innerHTML = `

      <tr>
        <td
          colspan="8"
          class="empty-table"
        >
          Unable to load customers.
          Check Firestore security rules.
        </td>
      </tr>

    `;

  }

}


// =====================================================
// RENDER CUSTOMERS
// =====================================================

function renderCustomers(customers) {

  const table =
    getElement("customersTableBody");


  if (!table) return;


  if (!customers.length) {

    table.innerHTML = `

      <tr>
        <td
          colspan="8"
          class="empty-table"
        >
          No customers found.
          Click "+ Add Customer" to create one.
        </td>
      </tr>

    `;

    return;

  }


  table.innerHTML =
    customers
      .map(
        (customer) => `

          <tr>

            <td>
              ${escapeHtml(
                customer.customerId || "-"
              )}
            </td>

            <td>
              <strong>
                ${escapeHtml(
                  customer.name || "-"
                )}
              </strong>
            </td>

            <td>
              ${escapeHtml(
                customer.mobile || "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                customer.whatsapp || "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                customer.email || "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                customer.city || "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                customer.type || "-"
              )}
            </td>

            <td>

              <button
                class="edit-btn"
                data-customer-edit-id="${customer.id}"
              >
                Edit
              </button>

              <button
                class="danger-btn"
                data-customer-delete-id="${customer.id}"
              >
                Delete
              </button>

            </td>

          </tr>

        `
      )
      .join("");


  setupCustomerRowActions();

}


// =====================================================
// CUSTOMER ROW ACTIONS
// =====================================================

function setupCustomerRowActions() {


  document
    .querySelectorAll(
      "[data-customer-edit-id]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const customer =
            allCustomers.find(
              (item) =>
                item.id ===
                button.dataset.customerEditId
            );


          if (customer) {

            openCustomerModal(
              customer
            );

          }

        }
      );

    });


  document
    .querySelectorAll(
      "[data-customer-delete-id]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          deleteCustomer(
            button.dataset.customerDeleteId
          );

        }
      );

    });

}


// =====================================================
// DELETE CUSTOMER
// =====================================================

async function deleteCustomer(id) {

  const customer =
    allCustomers.find(
      (item) =>
        item.id === id
    );


  const confirmed =
    confirm(
      `Delete customer "${customer?.name || ""}"?`
    );


  if (!confirmed) return;


  try {

    await deleteDoc(
      doc(
        db,
        "customers",
        id
      )
    );


    await loadCustomers();


  } catch (error) {

    console.error(
      "Customer delete error:",
      error
    );


    alert(
      "Could not delete customer."
    );

  }

}


// =====================================================
// CUSTOMER SEARCH
// =====================================================

function setupCustomerSearch() {

  const searchBox =
    getElement("customerSearch");


  if (!searchBox) return;


  searchBox.addEventListener(
    "input",
    () => {

      const search =
        searchBox.value
          .toLowerCase()
          .trim();


      if (!search) {

        renderCustomers(
          allCustomers
        );

        return;

      }


      const filtered =
        allCustomers.filter(
          (customer) => {

            return (

              String(
                customer.name || ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                customer.mobile || ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                customer.email || ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                customer.city || ""
              )
                .toLowerCase()
                .includes(search)

              ||

              String(
                customer.customerId || ""
              )
                .toLowerCase()
                .includes(search)

            );

          }
        );


      renderCustomers(
        filtered
      );

    }
  );

}


// =====================================================
// CUSTOMER DASHBOARD COUNT
// =====================================================

function updateCustomerDashboard() {

  const cards =
    document.querySelectorAll(
      ".card"
    );


  cards.forEach((card) => {

    const title =
      card.querySelector(
        ".card-title"
      );


    if (
      title &&
      title.textContent.trim() ===
        "Total Customers"
    ) {

      const value =
        card.querySelector(
          ".card-value"
        );


      if (value) {

        value.textContent =
          allCustomers.length;

      }

    }

  });

}


// =====================================================
// HTML ESCAPE
// =====================================================

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
