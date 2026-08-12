// =====================================================
// FIREBASE INITIALIZATION
// MY TOUR MITRA ERP
// =====================================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
  getStorage
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

import {
  firebaseConfig
} from "./config.js";

// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app =
  initializeApp(
    firebaseConfig
  );

// =====================================================
// FIREBASE SERVICES
// =====================================================

const auth =
  getAuth(app);

const db =
  getFirestore(app);

const storage =
  getStorage(app);

// =====================================================
// EXPORT SERVICES
// =====================================================

export {
  app,
  auth,
  db,
  storage
};
