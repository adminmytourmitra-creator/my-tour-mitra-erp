// ================= DASHBOARD MODULE =================

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { db } from "../firebase.js";


// ================= INITIALIZE =================

export function initDashboard() {

  loadDashboard();

}


// ================= LOAD DASHBOARD =================

async function loadDashboard() {

  try {

    const customersSnapshot =
      await getDocs(
        collection(db, "customers")
      );

    const enquiriesSnapshot =
      await getDocs(
        collection(db, "enquiries")
      );


    const totalCustomers =
      customersSnapshot.size;

    const enquiries =
      enquiriesSnapshot.docs.map(
        (document) => document.data()
      );


    const activeStatuses = [
      "New",
      "Follow-up",
      "Quoted"
    ];


    const activeEnquiries =
      enquiries.filter(
        (enquiry) =>
          activeStatuses.includes(
            enquiry.status
          )
      ).length;


    updateCard(
      "Total Customers",
      totalCustomers
    );

    updateCard(
      "Active Enquiries",
      activeEnquiries
    );


  } catch (error) {

    console.error(
      "Dashboard loading error:",
      error
    );

  }

}


// ================= UPDATE DASHBOARD CARD =================

function updateCard(title, value) {

  const cards =
    document.querySelectorAll(".card");


  cards.forEach((card) => {

    const cardTitle =
      card.querySelector(".card-title");

    if (!cardTitle) return;


    if (
      cardTitle.textContent.trim() ===
      title
    ) {

      const cardValue =
        card.querySelector(".card-value");

      if (cardValue) {

        cardValue.textContent =
          value;

      }

    }

  });

}
