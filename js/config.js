```javascript
/* =========================================================
   MY TOUR MITRA ERP
   APPLICATION CONFIGURATION
   File: /js/config.js

   IMPORTANT:
   ---------------------------------------------------------
   Replace the Firebase placeholder values below with the
   actual configuration from:

   Firebase Console
   → Project Settings
   → Your apps
   → Web app
   → SDK setup and configuration
   ========================================================= */


// =========================================================
// GLOBAL CONFIGURATION OBJECT
// =========================================================

window.MyTourMitraConfig = {

    // -----------------------------------------------------
    // APPLICATION
    // -----------------------------------------------------

    app: {

        name: "My Tour Mitra ERP",

        shortName: "MTM ERP",

        version: "1.0.0",

        environment: "production"

    },


    // -----------------------------------------------------
    // COMPANY
    // -----------------------------------------------------

    company: {

        name: "My Tour Mitra",

        website: "https://mytourmitra.com",

        email: "",

        phone: "",

        address: "",

        city: "Nalbari",

        state: "Assam",

        country: "India"

    },


    // -----------------------------------------------------
    // FIREBASE
    // -----------------------------------------------------

    firebase: {

        apiKey:
            "PASTE_YOUR_FIREBASE_API_KEY_HERE",

        authDomain:
            "my-tour-mitra-erp.firebaseapp.com",

        projectId:
            "my-tour-mitra-erp",

        storageBucket:
            "PASTE_YOUR_FIREBASE_STORAGE_BUCKET_HERE",

        messagingSenderId:
            "PASTE_YOUR_FIREBASE_MESSAGING_SENDER_ID_HERE",

        appId:
            "PASTE_YOUR_FIREBASE_APP_ID_HERE"

    },


    // -----------------------------------------------------
    // ERP SETTINGS
    // -----------------------------------------------------

    erp: {

        currency: "INR",

        currencySymbol: "₹",

        country: "India",

        timezone: "Asia/Kolkata",

        dateFormat: "DD/MM/YYYY",

        invoicePrefix: "INV",

        quotationPrefix: "QT",

        voucherPrefix: "VCH",

        bookingPrefix: "BK",

        customerPrefix: "CUS",

        enquiryPrefix: "ENQ",

        supplierPrefix: "SUP"

    },


    // -----------------------------------------------------
    // TAX SETTINGS
    // -----------------------------------------------------

    tax: {

        gstEnabled: true,

        defaultGstRate: 18,

        hotelGstRate: 5,

        transportGstRate: 5,

        ticketGstRate: 5,

        serviceGstRate: 18

    },


    // -----------------------------------------------------
    // FEATURE SETTINGS
    // -----------------------------------------------------

    features: {

        quotations: true,

        bookings: true,

        invoices: true,

        vouchers: true,

        payments: true,

        expenses: true,

        profitLoss: true,

        teamManagement: true,

        followups: true,

        packages: true

    }

};


// =========================================================
// BACKWARD COMPATIBILITY
// =========================================================

/*
   firebase.js can also read:

       window.firebaseConfig

   So expose the Firebase configuration here as well.
*/

window.firebaseConfig =
    window.MyTourMitraConfig.firebase;


// =========================================================
// CONFIG VALIDATION
// =========================================================

window.MyTourMitraConfig.isFirebaseConfigured =
    function () {

        const config =
            window.MyTourMitraConfig.firebase;


        if (!config) {

            return false;

        }


        const requiredFields = [

            "apiKey",

            "authDomain",

            "projectId",

            "appId"

        ];


        return requiredFields.every(
            function (field) {

                const value =
                    config[field];


                return (
                    value &&
                    !String(value)
                        .includes(
                            "PASTE_YOUR_"
                        )
                );

            }
        );

    };


// =========================================================
// CONSOLE INFORMATION
// =========================================================

console.log(
    "[My Tour Mitra ERP] config.js loaded."
);


console.log(
    "[CONFIG] Firebase Project:",
    window.MyTourMitraConfig.firebase.projectId
);


console.log(
    "[CONFIG] Firebase configured:",
    window.MyTourMitraConfig.isFirebaseConfigured()
);
```
