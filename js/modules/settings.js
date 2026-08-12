// =====================================================
// MY TOUR MITRA ERP
// SETTINGS MODULE
// AGENCY PROFILE
// =====================================================

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
  db,
  auth
} from "../firebase.js";

// =====================================================
// CONSTANTS
// =====================================================

const AGENCY_PROFILE_DOC =
  "agencyProfile";

const AGENCY_PROFILE_COLLECTION =
  "settings";

// =====================================================
// STATE
// =====================================================

let agencyLogoFile = null;

// =====================================================
// INITIALIZE SETTINGS
// =====================================================

export function initSettings() {

  console.log(
    "Settings module initialized"
  );

  setupAgencyProfile();

  loadAgencyProfile();

}

// =====================================================
// ELEMENT HELPER
// =====================================================

function getElement(id) {

  return document.getElementById(id);

}

// =====================================================
// SETUP AGENCY PROFILE
// =====================================================

function setupAgencyProfile() {

  const form =
    getElement(
      "agencyProfileForm"
    );

  const logoInput =
    getElement(
      "agencyLogo"
    );

  const removeLogoButton =
    getElement(
      "removeAgencyLogoBtn"
    );


  // ---------------------------------------------------
  // FORM SUBMIT
  // ---------------------------------------------------

  if (form) {

    form.addEventListener(
      "submit",
      saveAgencyProfile
    );

  }


  // ---------------------------------------------------
  // LOGO SELECT
  // ---------------------------------------------------

  if (logoInput) {

    logoInput.addEventListener(
      "change",
      handleLogoSelection
    );

  }


  // ---------------------------------------------------
  // REMOVE LOGO
  // ---------------------------------------------------

  if (removeLogoButton) {

    removeLogoButton.addEventListener(
      "click",
      removeLogoPreview
    );

  }

}

// =====================================================
// HANDLE LOGO SELECTION
// =====================================================

function handleLogoSelection(event) {

  const file =
    event.target.files?.[0];

  if (!file) return;


  // ---------------------------------------------------
  // FILE TYPE CHECK
  // ---------------------------------------------------

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    showSettingsMessage(
      "Please select an image file.",
      "#dc2626"
    );

    event.target.value = "";

    return;

  }


  // ---------------------------------------------------
  // FILE SIZE CHECK
  // Maximum 5 MB
  // ---------------------------------------------------

  if (
  file.size >
  200 * 1024
) {

  showSettingsMessage(
    "Logo size must be less than 200 KB.",
    "#dc2626"
  );

  event.target.value = "";

  return;

}


  agencyLogoFile =
    file;


  // ---------------------------------------------------
  // PREVIEW
  // ---------------------------------------------------

  const reader =
    new FileReader();

  reader.onload =
    function () {

      const preview =
        getElement(
          "agencyLogoPreview"
        );

      const previewContainer =
        getElement(
          "agencyLogoPreviewContainer"
        );

      const removeButton =
        getElement(
          "removeAgencyLogoBtn"
        );

      if (preview) {

        preview.src =
          reader.result;

      }

      if (previewContainer) {

        previewContainer.style.display =
          "flex";

      }

      if (removeButton) {

        removeButton.style.display =
          "inline-flex";

      }

    };


  reader.readAsDataURL(
    file
  );

}

// =====================================================
// REMOVE LOGO PREVIEW
// =====================================================

function removeLogoPreview() {

  agencyLogoFile =
    null;


  const input =
    getElement(
      "agencyLogo"
    );

  const preview =
    getElement(
      "agencyLogoPreview"
    );

  const container =
    getElement(
      "agencyLogoPreviewContainer"
    );

  const removeButton =
    getElement(
      "removeAgencyLogoBtn"
    );


  if (input) {

    input.value = "";

  }


  if (preview) {

    preview.src = "";

  }


  if (container) {

    container.style.display =
      "none";

  }


  if (removeButton) {

    removeButton.style.display =
      "none";

  }

}

// =====================================================
// LOAD AGENCY PROFILE
// =====================================================

async function loadAgencyProfile() {

  try {

    const profileRef =
      doc(
        db,
        AGENCY_PROFILE_COLLECTION,
        AGENCY_PROFILE_DOC
      );


    const snapshot =
      await getDoc(
        profileRef
      );


    if (!snapshot.exists()) {

      console.log(
        "Agency profile not found."
      );

      return;

    }


    const data =
      snapshot.data();


    // -------------------------------------------------
    // BASIC DETAILS
    // -------------------------------------------------

    setValue(
      "agencyName",
      data.agencyName || ""
    );

    setValue(
      "agencyTagline",
      data.agencyTagline || ""
    );

    setValue(
      "agencyPhone",
      data.phone || ""
    );

    setValue(
      "agencyWhatsApp",
      data.whatsapp || ""
    );

    setValue(
      "agencyEmail",
      data.email || ""
    );

    setValue(
      "agencyWebsite",
      data.website || ""
    );


    // -------------------------------------------------
    // ADDRESS
    // -------------------------------------------------

    setValue(
      "agencyAddress",
      data.address || ""
    );

    setValue(
      "agencyCity",
      data.city || ""
    );

    setValue(
      "agencyState",
      data.state || ""
    );

    setValue(
      "agencyPin",
      data.pin || ""
    );


    // -------------------------------------------------
    // TAX DETAILS
    // -------------------------------------------------

    setValue(
      "agencyGST",
      data.gstNumber || ""
    );

    setValue(
      "agencyPAN",
      data.panNumber || ""
    );


    // -------------------------------------------------
    // PDF FOOTER
    // -------------------------------------------------

    setValue(
      "agencyPdfFooter",
      data.pdfFooter || ""
    );


    // -------------------------------------------------
    // LOGO
    // -------------------------------------------------

    if (
  data.logoData
) {

  showSavedLogo(
    data.logoData
  );

}


    console.log(
      "Agency profile loaded successfully."
    );

  } catch (error) {

    console.error(
      "Agency profile loading error:",
      error
    );

    showSettingsMessage(
      "Could not load agency profile.",
      "#dc2626"
    );

  }

}

// =====================================================
// SHOW SAVED LOGO
// =====================================================

function showSavedLogo(
  logoUrl
) {

  const preview =
    getElement(
      "agencyLogoPreview"
    );

  const container =
    getElement(
      "agencyLogoPreviewContainer"
    );

  const removeButton =
    getElement(
      "removeAgencyLogoBtn"
    );


  if (preview) {

    preview.src =
      logoUrl;

  }


  if (container) {

    container.style.display =
      "flex";

  }


  if (removeButton) {

    removeButton.style.display =
      "inline-flex";

  }

}

// =====================================================
// SAVE AGENCY PROFILE
// =====================================================

async function saveAgencyProfile(
  event
) {

  event.preventDefault();


  const saveButton =
    getElement(
      "saveAgencyProfileBtn"
    );


  showSettingsMessage(
    "Saving agency profile...",
    "#1769e0"
  );


  if (saveButton) {

    saveButton.disabled =
      true;

    saveButton.textContent =
      "Saving...";

  }


  try {

    // -------------------------------------------------
    // CURRENT USER CHECK
    // -------------------------------------------------

    if (!auth.currentUser) {

      throw new Error(
        "User is not logged in."
      );

    }


    // -------------------------------------------------
    // COLLECT FORM DATA
    // -------------------------------------------------

    const agencyName =
      getValue(
        "agencyName"
      );

    const agencyTagline =
      getValue(
        "agencyTagline"
      );

    const phone =
      getValue(
        "agencyPhone"
      );

    const whatsapp =
      getValue(
        "agencyWhatsApp"
      );

    const email =
      getValue(
        "agencyEmail"
      );

    const website =
      getValue(
        "agencyWebsite"
      );

    const address =
      getValue(
        "agencyAddress"
      );

    const city =
      getValue(
        "agencyCity"
      );

    const state =
      getValue(
        "agencyState"
      );

    const pin =
      getValue(
        "agencyPin"
      );

    const gstNumber =
      getValue(
        "agencyGST"
      );

    const panNumber =
      getValue(
        "agencyPAN"
      );

    const pdfFooter =
      getValue(
        "agencyPdfFooter"
      );


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!agencyName) {

      showSettingsMessage(
        "Please enter agency name.",
        "#dc2626"
      );

      return;

    }


    // -------------------------------------------------
    // GET EXISTING PROFILE
    // -------------------------------------------------

    const profileRef =
      doc(
        db,
        AGENCY_PROFILE_COLLECTION,
        AGENCY_PROFILE_DOC
      );


    const existingSnapshot =
      await getDoc(
        profileRef
      );


    let existingLogoData =
  "";

if (
  existingSnapshot.exists()
) {

  existingLogoData =
    existingSnapshot.data()
      ?.logoData || "";

}
let logoData =
  existingLogoData;

if (agencyLogoFile) {

  logoData =
    await convertFileToBase64(
      agencyLogoFile
    );

}
    
    
    // -------------------------------------------------
    // PROFILE DATA
    // -------------------------------------------------

    const profileData = {

      agencyName:
        agencyName,

      agencyTagline:
        agencyTagline,

      phone:
        phone,

      whatsapp:
        whatsapp,

      email:
        email,

      website:
        website,

      address:
        address,

      city:
        city,

      state:
        state,

      pin:
        pin,

      gstNumber:
        gstNumber,

      panNumber:
        panNumber,

      logoData:
  logoData,

      pdfFooter:
        pdfFooter,

      updatedAt:
        serverTimestamp(),

      updatedBy:
        auth.currentUser.email || ""

    };


    // -------------------------------------------------
    // SAVE FIRESTORE
    // -------------------------------------------------

    await setDoc(
      profileRef,
      profileData,
      {
        merge: true
      }
    );


    // -------------------------------------------------
    // SUCCESS
    // -------------------------------------------------

    showSettingsMessage(
      "Agency profile saved successfully.",
      "#15803d"
    );


    agencyLogoFile =
      null;


  } catch (error) {

    console.error(
      "Agency profile save error:",
      error
    );


    showSettingsMessage(
      "Could not save agency profile. Please check Firestore permissions.",
      "#dc2626"
    );


  } finally {

    if (saveButton) {

      saveButton.disabled =
        false;

      saveButton.textContent =
        "Save Agency Profile";

    }

  }

}

// =====================================================
// SET VALUE
// =====================================================

function setValue(
  id,
  value
) {

  const element =
    getElement(id);

  if (!element) return;

  element.value =
    value;

}

// =====================================================
// GET VALUE
// =====================================================

function getValue(
  id
) {

  const element =
    getElement(id);

  if (!element) return "";

  return (
    element.value || ""
  )
    .trim();

}


// =====================================================
// MESSAGE
// =====================================================

function showSettingsMessage(
  text,
  color
) {

  const message =
    getElement(
      "settingsFormMessage"
    );

  if (!message) return;

  message.style.color =
    color;

  message.textContent =
    text;

}

// =====================================================
// CONVERT LOGO FILE TO BASE64
// =====================================================

function convertFileToBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        () => resolve(
          reader.result
        );

      reader.onerror =
        () => reject(
          new Error(
            "Could not read logo file."
          )
        );

      reader.readAsDataURL(
        file
      );

    }
  );

}
