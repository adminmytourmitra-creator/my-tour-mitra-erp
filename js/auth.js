// ================= AUTHENTICATION MODULE =================

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import { auth } from "./firebase.js";


// ================= ELEMENTS =================

const loginPage = document.getElementById("loginPage");
const appPage = document.getElementById("app");
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");
const userEmail = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");


// ================= LOGIN =================

function setupLogin() {

  if (!loginForm) return;

  loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document
      .getElementById("email")
      .value
      .trim();

    const password = document
      .getElementById("password")
      .value;

    if (message) {
      message.style.color = "#1769e0";
      message.textContent = "Signing in...";
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

      console.error("Login error:", error);

      if (message) {
        message.style.color = "#dc2626";
        message.textContent =
          "Invalid email or password.";
      }

    }

  });

}


// ================= LOGOUT =================

function setupLogout() {

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {

    try {

      await signOut(auth);

    } catch (error) {

      console.error("Logout error:", error);

    }

  });

}


// ================= AUTH STATE =================

function setupAuthState() {

  onAuthStateChanged(auth, (user) => {

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

  });

}


// ================= INITIALIZE AUTH =================

export function initAuth() {

  setupLogin();

  setupLogout();

  setupAuthState();

}
