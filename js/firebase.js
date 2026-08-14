/* =========================================================
   MY TOUR MITRA ERP
   FIREBASE INITIALIZATION
   ========================================================= */

/*
 * This file is responsible ONLY for initializing Firebase
 * and exporting Firebase services.
 *
 * Modules should NOT initialize Firebase separately.
 */


/* =========================================================
   1. FIREBASE SDK IMPORTS
   ========================================================= */

import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";


import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


/* =========================================================
   2. APPLICATION CONFIG
   ========================================================= */

import {
    FIREBASE_CONFIG,
    isFirebaseConfigured
} from "./config.js";


/* =========================================================
   3. CONFIGURATION VALIDATION
   ========================================================= */

if (!isFirebaseConfigured()) {

    console.warn(
        "My Tour Mitra ERP: Firebase configuration has not been completed yet."
    );

}


/* =========================================================
   4. FIREBASE APP INITIALIZATION
   ========================================================= */

let firebaseApp;


/*
 * getApps() prevents duplicate Firebase initialization
 * if this module is imported multiple times.
 */

if (getApps().length > 0) {

    firebaseApp = getApp();

} else {

    firebaseApp = initializeApp(FIREBASE_CONFIG);

}


/* =========================================================
   5. FIREBASE SERVICES
   ========================================================= */

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);

const storage = getStorage(firebaseApp);


/* =========================================================
   6. EXPORT SERVICES
   ========================================================= */

export {

    firebaseApp,

    auth,

    db,

    storage

};
