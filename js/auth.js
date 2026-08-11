// ================= AUTHENTICATION MODULE =================

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import { auth } from "./firebase.js";


// ================= ELEMENT HELPER =================

function getElement(id) {
  return document.getElementById(id);
}


// ================= LOGIN =================

function setupLogin() {

  const loginForm =
    getElement("loginForm");

  if (!loginForm) return;


  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const email =
        getElement("email")
          ?.value
          .trim() || "";

      const password =
        getElement("password")
          ?.value || "";


      const message =
        getElement("message");


      if (!email || !password) {

        if (message) {

          message.style.color =
            "#dc2626";

          message.textContent =
            "Please enter email and password.";

        }

        return;
      }


      if (message) {

        message.style.color =
          "#1769e0";

        message.textContent =
          "Signing in...";

      }


      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


        if (message) {
          message.textContent = "";
        }

      } catch (error) {

        console.error(
          "Login error:",
          error
        );


        if (message) {

          message.style.color =
            "#dc2626";

          message.textContent =
            "Invalid email or password.";

        }

      }

    }
  );

}


// ================= LOGOUT =================

function setupLogout() {

  const logoutBtn =
    getElement("logoutBtn");

  if (!logoutBtn) return;


  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

      }

    }
  );

}


// ================= AUTH STATE =================

function setupAuthState() {

  onAuthStateChanged(
    auth,
    (user) => {

      const loginPage =
        getElement("loginPage");

      const appPage =
        getElement("app");

      const userEmail =
        getElement("userEmail");


      if (user) {

        if (loginPage) {

          loginPage.style.display =
            "none";

        }


        if (appPage) {

          appPage.style.display =
            "block";

        }


        if (userEmail) {

          userEmail.textContent =
            user.email || "";

        }

      } else {

        if (loginPage) {

          loginPage.style.display =
            "flex";

        }


        if (appPage) {

          appPage.style.display =
            "none";

        }

      }

    }
  );

}


// ================= INITIALIZE AUTH =================

export function initAuth() {

  setupLogin();

  setupLogout();

  setupAuthState();

}
