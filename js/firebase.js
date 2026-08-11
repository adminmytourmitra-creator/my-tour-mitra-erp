// ================= FIREBASE CONNECTION =================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { firebaseConfig } from "./config.js";


// ================= INITIALIZE FIREBASE =================

const app = initializeApp(firebaseConfig);


// ================= FIREBASE SERVICES =================

export const auth = getAuth(app);

export const db = getFirestore(app);

export default app;
