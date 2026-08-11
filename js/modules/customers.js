// ======================================================
// CUSTOMERS MODULE
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
// MODULE STATE
// ======================================================

let allCustomers = [];


// ======================================================
// INITIALIZE CUSTOMERS MODULE
// ======================================================

export function initCustomers() {

  const addButton =
    document.getElementById("addCustomerBtn");

  const closeButton =
    document.getElementById("closeCustomerModal");

  const cancelButton =
    document.getElementById("cancelCustomerBtn");

  const form =
    document.getElementById("customerForm");

  const search =
    document.getElementById("customerSearch");


  if (addButton) {
    addButton.addEventListener(
      "click",
      openAddCustomer
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


  if (form) {
    form.addEventListener(
      "submit",
      saveCustomer
    );
  }


  if (search) {
    search.addEventListener(
      "input",
      handleCustomerSearch
    );
  }


  loadCustomers();
}


// ======================================================
// LOAD CUSTOMERS
// ======================================================

export async function loadCustomers() {

  const tableBody =
    document.getElementById(
      "customersTableBody"
    );

  if (!tableBody) {
    return;
  }


  tableBody.innerHTML = `
    <tr>
      <td colspan="8" class="empty-table">
        Loading customers...
      </td>
    </tr>
  `;


  try {

    const snapshot =
      await getDocs(
        collection(db, "customers")
      );


    allCustomers =
      snapshot.docs.map(
        (customerDoc) => ({
          id: customerDoc.id,
          ...customerDoc.data()
        })
      );


    renderCustomers(allCustomers);

    updateCustomerCount();

  } catch (error) {

    console.error(
      "Error loading customers:",
      error
    );


    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table">
          Unable to load customers.
        </td>
      </tr>
    `;

  }
}


// ======================================================
// RENDER CUSTOMERS
// ======================================================

function renderCustomers(customers) {

  const tableBody =
    document.getElementById(
      "customersTableBody"
    );


  if (!tableBody) {
    return;
  }


  if (!customers.length) {

    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table">
          No customers found.
          Click "+ Add Customer" to create one.
        </td>
      </tr>
    `;

    return;
  }


  tableBody.innerHTML =
    customers.map(
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
              type="button"
              class="edit-btn"
              data-customer-edit="${customer.id}"
            >
              Edit
            </button>


            <button
              type="button"
              class="danger-btn"
              data-customer-delete="${customer.id}"
            >
              Delete
            </button>

          </td>

        </tr>

      `
    ).join("");


  attachCustomerActions();
}


// ======================================================
// CUSTOMER ACTION BUTTONS
// ======================================================

function attachCustomerActions() {

  document
    .querySelectorAll(
      "[data-customer-edit]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const customer =
            allCustomers.find(
              (item) =>
                item.id ===
                button.dataset.customerEdit
            );


          if (customer) {
            openEditCustomer(customer);
          }

        }
      );

    });


  document
    .querySelectorAll(
      "[data-customer-delete]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          deleteCustomer(
            button.dataset.customerDelete
          );

        }
      );

    });

}


// ======================================================
// OPEN ADD CUSTOMER MODAL
// ======================================================

function openAddCustomer() {

  const modal =
    document.getElementById(
      "customerModal"
    );


  const form =
    document.getElementById(
      "customerForm"
    );


  if (!modal || !form) {
    return;
  }


  form.reset();


  document.getElementById(
    "customerDocId"
  ).value = "";


  document.getElementById(
    "customerModalTitle"
  ).textContent =
    "Add Customer";


  document.getElementById(
    "customerCountry"
  ).value =
    "India";


  clearCustomerMessage();


  modal.style.display = "flex";
}


// ======================================================
// OPEN EDIT CUSTOMER MODAL
// ======================================================

function openEditCustomer(customer) {

  const modal =
    document.getElementById(
      "customerModal"
    );


  if (!modal) {
    return;
  }


  document.getElementById(
    "customerModalTitle"
  ).textContent =
    "Edit Customer";


  document.getElementById(
    "customerDocId"
  ).value =
    customer.id || "";


  document.getElementById(
    "customerName"
  ).value =
    customer.name || "";


  document.getElementById(
    "customerMobile"
  ).value =
    customer.mobile || "";


  document.getElementById(
    "customerWhatsapp"
  ).value =
    customer.whatsapp || "";


  document.getElementById(
    "customerEmail"
  ).value =
    customer.email || "";


  document.getElementById(
    "customerCity"
  ).value =
    customer.city || "";


  document.getElementById(
    "customerCountry"
  ).value =
    customer.country || "India";


  document.getElementById(
    "customerType"
  ).value =
    customer.type || "Individual";


  document.getElementById(
    "customerSource"
  ).value =
    customer.source || "Direct";


  document.getElementById(
    "customerNotes"
  ).value =
    customer.notes || "";


  clearCustomerMessage();


  modal.style.display = "flex";
}


// ======================================================
// CLOSE CUSTOMER MODAL
// ======================================================

function closeCustomerModal() {

  const modal =
    document.getElementById(
      "customerModal"
    );


  const form =
    document.getElementById(
      "customerForm"
    );


  if (modal) {
    modal.style.display = "none";
  }


  if (form) {
    form.reset();
  }


  const docId =
    document.getElementById(
      "customerDocId"
    );


  if (docId) {
    docId.value = "";
  }


  const country =
    document.getElementById(
      "customerCountry"
    );


  if (country) {
    country.value = "India";
  }


  clearCustomerMessage();
}


// ======================================================
// SAVE CUSTOMER
// ======================================================

async function saveCustomer(event) {

  event.preventDefault();


  const message =
    document.getElementById(
      "customerFormMessage"
    );


  if (message) {

    message.style.color =
      "#1769e0";

    message.textContent =
      "Saving customer...";

  }


  const customerData = {

    name:
      getValue("customerName"),

    mobile:
      getValue("customerMobile"),

    whatsapp:
      getValue("customerWhatsapp"),

    email:
      getValue("customerEmail"),

    city:
      getValue("customerCity"),

    country:
      getValue("customerCountry") || "India",

    type:
      getValue("customerType") || "Individual",

    source:
      getValue("customerSource") || "Direct",

    notes:
      getValue("customerNotes"),

    updatedAt:
      serverTimestamp()

  };


  try {

    const existingId =
      getValue("customerDocId");


    // ==================================================
    // UPDATE EXISTING CUSTOMER
    // ==================================================

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


    // ==================================================
    // CREATE NEW CUSTOMER
    // ==================================================

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
      () => {
        closeCustomerModal();
      },
      700
    );


  } catch (error) {

    console.error(
      "Error saving customer:",
      error
    );


    showCustomerMessage(
      "Could not save customer. Please check Firebase.",
      "#dc2626"
    );

  }

}


// ======================================================
// DELETE CUSTOMER
// ======================================================

async function deleteCustomer(customerId) {

  const customer =
    allCustomers.find(
      (item) =>
        item.id === customerId
    );


  const customerName =
    customer?.name || "this customer";


  const confirmed =
    confirm(
      `Delete customer "${customerName}"?`
    );


  if (!confirmed) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        "customers",
        customerId
      )
    );


    await loadCustomers();


  } catch (error) {

    console.error(
      "Error deleting customer:",
      error
    );


    alert(
      "Could not delete customer."
    );

  }

}


// ======================================================
// CUSTOMER SEARCH
// ======================================================

function handleCustomerSearch(event) {

  const search =
    event.target.value
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


  renderCustomers(filtered);
}


// ======================================================
// UPDATE CUSTOMER COUNT
// ======================================================

function updateCustomerCount() {

  const element =
    document.getElementById(
      "totalCustomers"
    );


  if (element) {
    element.textContent =
      allCustomers.length;
  }

}


// ======================================================
// SHOW CUSTOMER MESSAGE
// ======================================================

function showCustomerMessage(
  text,
  color
) {

  const message =
    document.getElementById(
      "customerFormMessage"
    );


  if (!message) {
    return;
  }


  message.style.color =
    color;

  message.textContent =
    text;
}


// ======================================================
// CLEAR CUSTOMER MESSAGE
// ======================================================

function clearCustomerMessage() {

  const message =
    document.getElementById(
      "customerFormMessage"
    );


  if (message) {
    message.textContent = "";
  }

}


// ======================================================
// GET INPUT VALUE
// ======================================================

function getValue(id) {

  const element =
    document.getElementById(id);


  return element
    ? element.value.trim()
    : "";

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
