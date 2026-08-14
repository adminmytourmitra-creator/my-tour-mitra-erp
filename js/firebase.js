/* =========================================================
   MY TOUR MITRA ERP
   FIREBASE / FIRESTORE CORE
   File: /js/firebase.js
   ========================================================= */

"use strict";


/* =========================================================
   1. FIREBASE IMPORTS
   ========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   2. FIREBASE CONFIGURATION
   =========================================================
   
   IMPORTANT:
   Keep the configuration from your existing Firebase
   project "My Tour Mitra ERP".

   Project ID:
   my-tour-mitra-erp
   ========================================================= */

const firebaseConfig = {

    apiKey: "YOUR_FIREBASE_API_KEY",

    authDomain: "my-tour-mitra-erp.firebaseapp.com",

    projectId: "my-tour-mitra-erp",

    storageBucket: "my-tour-mitra-erp.firebasestorage.app",

    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",

    appId: "YOUR_FIREBASE_APP_ID"

};


/* =========================================================
   3. INITIALIZE FIREBASE
   ========================================================= */

const firebaseApp = initializeApp(firebaseConfig);


/* =========================================================
   4. INITIALIZE AUTHENTICATION
   ========================================================= */

const firebaseAuth = getAuth(firebaseApp);


/* =========================================================
   5. INITIALIZE FIRESTORE
   ========================================================= */

const firestoreDB = getFirestore(firebaseApp);


/* =========================================================
   6. GLOBAL FIREBASE REFERENCES
   ========================================================= */

window.MTM_FIREBASE = {

    app: firebaseApp,

    auth: firebaseAuth,

    db: firestoreDB

};


/* =========================================================
   7. COLLECTION REFERENCE
   ========================================================= */

window.mtmCollection = function (collectionName) {

    if (!collectionName) {
        throw new Error(
            "Firestore collection name is required."
        );
    }

    return collection(
        firestoreDB,
        collectionName
    );

};


/* =========================================================
   8. DOCUMENT REFERENCE
   ========================================================= */

window.mtmDocument = function (
    collectionName,
    documentId
) {

    if (!collectionName) {
        throw new Error(
            "Firestore collection name is required."
        );
    }

    if (!documentId) {
        throw new Error(
            "Firestore document ID is required."
        );
    }

    return doc(
        firestoreDB,
        collectionName,
        documentId
    );

};


/* =========================================================
   9. GET SINGLE DOCUMENT
   ========================================================= */

window.mtmGetDocument = async function (
    collectionName,
    documentId
) {

    try {

        const documentReference =
            mtmDocument(
                collectionName,
                documentId
            );

        const snapshot =
            await getDoc(
                documentReference
            );

        if (!snapshot.exists()) {
            return null;
        }

        return {

            id: snapshot.id,

            ...snapshot.data()

        };

    } catch (error) {

        mtmLogError(
            error,
            "mtmGetDocument"
        );

        throw error;

    }

};


/* =========================================================
   10. GET ALL DOCUMENTS
   ========================================================= */

window.mtmGetCollection = async function (
    collectionName
) {

    try {

        const collectionReference =
            mtmCollection(
                collectionName
            );

        const snapshot =
            await getDocs(
                collectionReference
            );

        return snapshot.docs.map(
            document => ({

                id: document.id,

                ...document.data()

            })
        );

    } catch (error) {

        mtmLogError(
            error,
            "mtmGetCollection"
        );

        throw error;

    }

};


/* =========================================================
   11. ADD DOCUMENT
   ========================================================= */

window.mtmAddDocument = async function (
    collectionName,
    data
) {

    try {

        if (!data || typeof data !== "object") {

            throw new Error(
                "Document data must be an object."
            );

        }

        const collectionReference =
            mtmCollection(
                collectionName
            );

        const documentData = {

            ...data,

            createdAt:
                data.createdAt ||
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };

        const documentReference =
            await addDoc(
                collectionReference,
                documentData
            );

        return {

            id: documentReference.id,

            ...data

        };

    } catch (error) {

        mtmLogError(
            error,
            "mtmAddDocument"
        );

        throw error;

    }

};


/* =========================================================
   12. SET DOCUMENT
   =========================================================
   
   Used when we already have our own document ID.

   Example:

   CUS0001
   ENQ0001
   PKG0001
   BKG0001
   ========================================================= */

window.mtmSetDocument = async function (
    collectionName,
    documentId,
    data,
    merge = false
) {

    try {

        if (!data || typeof data !== "object") {

            throw new Error(
                "Document data must be an object."
            );

        }

        const documentReference =
            mtmDocument(
                collectionName,
                documentId
            );

        const documentData = {

            ...data,

            updatedAt:
                serverTimestamp()

        };

        if (!merge) {

            documentData.createdAt =
                data.createdAt ||
                serverTimestamp();

        }

        await setDoc(
            documentReference,
            documentData,
            {
                merge
            }
        );

        return {

            id: documentId,

            ...data

        };

    } catch (error) {

        mtmLogError(
            error,
            "mtmSetDocument"
        );

        throw error;

    }

};


/* =========================================================
   13. UPDATE DOCUMENT
   ========================================================= */

window.mtmUpdateDocument = async function (
    collectionName,
    documentId,
    data
) {

    try {

        if (!data || typeof data !== "object") {

            throw new Error(
                "Update data must be an object."
            );

        }

        const documentReference =
            mtmDocument(
                collectionName,
                documentId
            );

        await updateDoc(
            documentReference,
            {

                ...data,

                updatedAt:
                    serverTimestamp()

            }
        );

        return true;

    } catch (error) {

        mtmLogError(
            error,
            "mtmUpdateDocument"
        );

        throw error;

    }

};


/* =========================================================
   14. DELETE DOCUMENT
   ========================================================= */

window.mtmDeleteDocument = async function (
    collectionName,
    documentId
) {

    try {

        const documentReference =
            mtmDocument(
                collectionName,
                documentId
            );

        await deleteDoc(
            documentReference
        );

        return true;

    } catch (error) {

        mtmLogError(
            error,
            "mtmDeleteDocument"
        );

        throw error;

    }

};


/* =========================================================
   15. QUERY DOCUMENTS
   ========================================================= */

window.mtmQuery = async function (
    collectionName,
    constraints = []
) {

    try {

        const collectionReference =
            mtmCollection(
                collectionName
            );

        const firestoreQuery =
            query(
                collectionReference,
                ...constraints
            );

        const snapshot =
            await getDocs(
                firestoreQuery
            );

        return snapshot.docs.map(
            document => ({

                id: document.id,

                ...document.data()

            })
        );

    } catch (error) {

        mtmLogError(
            error,
            "mtmQuery"
        );

        throw error;

    }

};


/* =========================================================
   16. REAL-TIME COLLECTION LISTENER
   ========================================================= */

window.mtmListenCollection = function (
    collectionName,
    callback
) {

    if (typeof callback !== "function") {

        throw new Error(
            "Callback function is required."
        );

    }

    const collectionReference =
        mtmCollection(
            collectionName
        );

    return onSnapshot(

        collectionReference,

        snapshot => {

            const records =
                snapshot.docs.map(
                    document => ({

                        id: document.id,

                        ...document.data()

                    })
                );

            callback(
                records
            );

        },

        error => {

            mtmLogError(
                error,
                "mtmListenCollection"
            );

        }

    );

};


/* =========================================================
   17. REAL-TIME SINGLE DOCUMENT LISTENER
   ========================================================= */

window.mtmListenDocument = function (
    collectionName,
    documentId,
    callback
) {

    if (typeof callback !== "function") {

        throw new Error(
            "Callback function is required."
        );

    }

    const documentReference =
        mtmDocument(
            collectionName,
            documentId
        );

    return onSnapshot(

        documentReference,

        snapshot => {

            if (!snapshot.exists()) {

                callback(null);

                return;

            }

            callback({

                id: snapshot.id,

                ...snapshot.data()

            });

        },

        error => {

            mtmLogError(
                error,
                "mtmListenDocument"
            );

        }

    );

};


/* =========================================================
   18. FIRESTORE TIMESTAMP HELPERS
   ========================================================= */

window.MTM_SERVER_TIMESTAMP =
    serverTimestamp;


window.MTM_TIMESTAMP =
    Timestamp;


/* =========================================================
   19. FIRESTORE QUERY HELPERS
   ========================================================= */

window.MTM_QUERY = {

    where,

    orderBy,

    limit

};


/* =========================================================
   20. BATCH WRITE
   ========================================================= */

window.mtmCreateBatch = function () {

    return writeBatch(
        firestoreDB
    );

};


/* =========================================================
   21. CREATE STANDARD ERP DOCUMENT
   =========================================================
   
   This helper is used by modules when creating records
   with our own business ID.

   Example:

   await mtmCreateERPDocument(
       "customers",
       "CUS0001",
       {
           name: "Rahul",
           mobile: "..."
       }
   );
   ========================================================= */

window.mtmCreateERPDocument =
    async function (
        collectionName,
        businessId,
        data
    ) {

        if (!businessId) {

            throw new Error(
                "Business ID is required."
            );

        }

        const documentData = {

            ...data,

            recordId: businessId,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };

        await setDoc(

            doc(
                firestoreDB,
                collectionName,
                businessId
            ),

            documentData

        );

        return {

            id: businessId,

            ...data

        };

    };


/* =========================================================
   22. FIREBASE READY FLAG
   ========================================================= */

window.MTM_FIREBASE_READY = true;


/* =========================================================
   23. DEBUG INFORMATION
   ========================================================= */

console.log(
    "My Tour Mitra ERP Firebase initialized."
);

console.log(
    "Firestore:",
    firestoreDB
);


/* =========================================================
   END OF FIREBASE.JS
   ========================================================= */
