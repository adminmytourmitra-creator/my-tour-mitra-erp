// ======================================================
// MY TOUR MITRA ERP
// AUTHENTICATION
// ======================================================

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import { auth } from "./firebase.js";


// ======================================================
// AUTH ELEMENTS
// ======================================================

const loginPage =
  document.getElementById("loginPage");

const appPage =
  document.getElementById("app");

const loginForm =
  document.getElementById("loginForm");

const loginMessage =
  document.getElementById("message");

const userEmail =
  document.getElementById("userEmail");

const logoutBtn =
  document.getElementById("logoutBtn");


// ======================================================
// LOGIN
// ======================================================

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        document
          .getElementById("email")
          .value
          .trim();

      const password =
        document
          .getElementById("password")
          .value;

      if (loginMessage) {

        loginMessage.style.color =
          "#1769e0";

        loginMessage.textContent =
          "Signing in...";

      }

      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        if (loginMessage) {
          loginMessage.textContent = "";
        }

      } catch (error) {

        console.error(
          "Login error:",
          error
        );

        if (loginMessage) {

          loginMessage.style.color =
            "#dc2626";

          loginMessage.textContent =
            "Invalid email or password.";

        }

      }

    }
  );

}


// ======================================================
// LOGOUT
// ======================================================

if (logoutBtn) {

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


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(
  auth,
  (user) => {

    if (user) {

      if (loginPage) {
        loginPage.style.display = "none";
      }

      if (appPage) {
        appPage.style.display = "block";
      }

      if (userEmail) {
        userEmail.textContent =
          user.email || "";
      }

    } else {

      if (loginPage) {
        loginPage.style.display = "flex";
      }

      if (appPage) {
        appPage.style.display = "none";
      }

    }

  }
);
