/* =========================================================
   MY TOUR MITRA ERP
   AUTHENTICATION & USER SESSION
   ========================================================= */

/*
 * This file is responsible for:
 *
 * 1. Login
 * 2. Logout
 * 3. Current authenticated user
 * 4. User profile from Firestore
 * 5. User role
 * 6. Authentication state monitoring
 *
 * IMPORTANT:
 * Authentication alone is NOT authorization.
 *
 * Firestore Security Rules will also enforce permissions.
 */


/* =========================================================
   1. FIREBASE IMPORTS
   ========================================================= */

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updatePassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


import {
    auth,
    db
} from "./firebase.js";


import {
    COLLECTIONS,
    USER_ROLES
} from "./config.js";


/* =========================================================
   2. AUTH STATE
   ========================================================= */

let currentUser = null;

let currentUserProfile = null;

let authStateReady = false;


/* =========================================================
   3. AUTH LISTENERS
   ========================================================= */

const authListeners = new Set();


/* =========================================================
   4. NOTIFY AUTH LISTENERS
   ========================================================= */

function notifyAuthListeners(user, profile) {

    authListeners.forEach(
        callback => {

            try {

                callback(
                    user,
                    profile
                );

            } catch (error) {

                console.error(
                    "Auth listener error:",
                    error
                );

            }

        }
    );

}


/* =========================================================
   5. SUBSCRIBE TO AUTH STATE
   ========================================================= */

export function subscribeToAuthState(callback) {

    if (typeof callback !== "function") {

        throw new Error(
            "Authentication listener must be a function."
        );

    }


    authListeners.add(callback);


    /*
     * Return unsubscribe function.
     */

    return () => {

        authListeners.delete(callback);

    };

}


/* =========================================================
   6. LOAD USER PROFILE
   ========================================================= */

export async function loadUserProfile(uid) {

    if (!uid) {

        throw new Error(
            "User UID is required."
        );

    }


    const userRef = doc(
        db,
        COLLECTIONS.users,
        uid
    );


    const snapshot = await getDoc(userRef);


    if (!snapshot.exists()) {

        /*
         * The Firebase Authentication account may exist
         * before the ERP user profile is created.
         */

        return null;

    }


    return {

        id: snapshot.id,

        ...snapshot.data()

    };

}


/* =========================================================
   7. LOGIN
   ========================================================= */

export async function login(
    email,
    password
) {

    const cleanEmail =
        String(email || "")
            .trim()
            .toLowerCase();


    const cleanPassword =
        String(password || "");


    if (!cleanEmail) {

        throw new Error(
            "Email address is required."
        );

    }


    if (!cleanPassword) {

        throw new Error(
            "Password is required."
        );

    }


    try {

        const credential =
            await signInWithEmailAndPassword(
                auth,
                cleanEmail,
                cleanPassword
            );


        /*
         * Authentication succeeded.
         *
         * The auth-state listener will also run.
         */

        const user =
            credential.user;


        const profile =
            await loadUserProfile(
                user.uid
            );


        /*
         * If no ERP profile exists, we still return the
         * authenticated Firebase user. Authorization logic
         * will prevent unauthorized access later.
         */

        currentUser =
            user;

        currentUserProfile =
            profile;


        return {

            user,

            profile

        };

    } catch (error) {

        throw normalizeAuthError(error);

    }

}


/* =========================================================
   8. LOGOUT
   ========================================================= */

export async function logout() {

    try {

        await signOut(auth);


        currentUser =
            null;

        currentUserProfile =
            null;

    } catch (error) {

        console.error(
            "Logout failed:",
            error
        );

        throw normalizeAuthError(error);

    }

}


/* =========================================================
   9. CURRENT USER
   ========================================================= */

export function getCurrentUser() {

    return currentUser;

}


/* =========================================================
   10. CURRENT USER PROFILE
   ========================================================= */

export function getCurrentUserProfile() {

    return currentUserProfile;

}


/* =========================================================
   11. CURRENT USER ROLE
   ========================================================= */

export function getCurrentUserRole() {

    return (
        currentUserProfile?.role ||
        null
    );

}


/* =========================================================
   12. ADMIN CHECK
   ========================================================= */

export function isAdmin() {

    return (
        getCurrentUserRole() ===
        USER_ROLES.ADMIN
    );

}


/* =========================================================
   13. MANAGER CHECK
   ========================================================= */

export function isManager() {

    return (
        getCurrentUserRole() ===
        USER_ROLES.MANAGER
    );

}


/* =========================================================
   14. STAFF CHECK
   ========================================================= */

export function isStaff() {

    return (
        getCurrentUserRole() ===
        USER_ROLES.STAFF
    );

}


/* =========================================================
   15. ACCOUNTS CHECK
   ========================================================= */

export function isAccountsUser() {

    return (
        getCurrentUserRole() ===
        USER_ROLES.ACCOUNTS
    );

}


/* =========================================================
   16. VIEWER CHECK
   ========================================================= */

export function isViewer() {

    return (
        getCurrentUserRole() ===
        USER_ROLES.VIEWER
    );

}


/* =========================================================
   17. ROLE PERMISSION HELPER
   ========================================================= */

export function hasRole(
    allowedRoles
) {

    const role =
        getCurrentUserRole();


    if (!role) {

        return false;

    }


    if (!Array.isArray(allowedRoles)) {

        allowedRoles =
            [allowedRoles];

    }


    return allowedRoles.includes(
        role
    );

}


/* =========================================================
   18. PASSWORD CHANGE
   ========================================================= */

export async function changeCurrentUserPassword(
    newPassword
) {

    const user =
        getCurrentUser();


    if (!user) {

        throw new Error(
            "No authenticated user found."
        );

    }


    if (
        typeof newPassword !== "string" ||
        newPassword.length < 6
    ) {

        throw new Error(
            "Password must contain at least 6 characters."
        );

    }


    try {

        await updatePassword(
            user,
            newPassword
        );

    } catch (error) {

        throw normalizeAuthError(error);

    }

}


/* =========================================================
   19. AUTH STATE INITIALIZATION
   ========================================================= */

export function initializeAuthState() {

    return new Promise(
        resolve => {

            let firstStateHandled =
                false;


            onAuthStateChanged(
                auth,
                async user => {

                    currentUser =
                        user || null;


                    currentUserProfile =
                        null;


                    if (user) {

                        try {

                            currentUserProfile =
                                await loadUserProfile(
                                    user.uid
                                );

                        } catch (error) {

                            console.error(
                                "Unable to load user profile:",
                                error
                            );

                            currentUserProfile =
                                null;

                        }

                    }


                    authStateReady =
                        true;


                    notifyAuthListeners(
                        currentUser,
                        currentUserProfile
                    );


                    if (!firstStateHandled) {

                        firstStateHandled =
                            true;

                        resolve({

                            user:
                                currentUser,

                            profile:
                                currentUserProfile

                        });

                    }

                }
            );

        }
    );

}


/* =========================================================
   20. AUTH STATE READY
   ========================================================= */

export function isAuthStateReady() {

    return authStateReady;

}


/* =========================================================
   21. AUTHENTICATED CHECK
   ========================================================= */

export function isAuthenticated() {

    return Boolean(
        currentUser
    );

}


/* =========================================================
   22. USER DISPLAY NAME
   ========================================================= */

export function getUserDisplayName() {

    if (
        currentUserProfile?.name
    ) {

        return currentUserProfile.name;

    }


    if (
        currentUserProfile?.displayName
    ) {

        return currentUserProfile.displayName;

    }


    if (
        currentUser?.displayName
    ) {

        return currentUser.displayName;

    }


    if (
        currentUser?.email
    ) {

        return currentUser.email
            .split("@")[0];

    }


    return "User";

}


/* =========================================================
   23. USER EMAIL
   ========================================================= */

export function getUserEmail() {

    return (
        currentUser?.email ||
        currentUserProfile?.email ||
        ""
    );

}


/* =========================================================
   24. USER INITIAL
   ========================================================= */

export function getUserInitial() {

    const name =
        getUserDisplayName();


    const cleaned =
        String(name)
            .trim();


    if (!cleaned) {

        return "U";

    }


    return cleaned
        .charAt(0)
        .toUpperCase();

}


/* =========================================================
   25. ROLE DISPLAY NAME
   ========================================================= */

export function getUserRoleDisplayName() {

    const role =
        getCurrentUserRole();


    switch (role) {

        case USER_ROLES.ADMIN:
            return "Administrator";


        case USER_ROLES.MANAGER:
            return "Manager";


        case USER_ROLES.STAFF:
            return "Staff";


        case USER_ROLES.ACCOUNTS:
            return "Accounts";


        case USER_ROLES.VIEWER:
            return "Viewer";


        default:
            return "User";

    }

}


/* =========================================================
   26. NORMALIZE FIREBASE AUTH ERRORS
   ========================================================= */

function normalizeAuthError(error) {

    const code =
        error?.code || "";


    switch (code) {

        case "auth/invalid-email":

            return new Error(
                "Please enter a valid email address."
            );


        case "auth/user-disabled":

            return new Error(
                "This account has been disabled."
            );


        case "auth/user-not-found":

            return new Error(
                "No account was found with this email."
            );


        case "auth/wrong-password":

            return new Error(
                "Incorrect email or password."
            );


        case "auth/invalid-credential":

            return new Error(
                "Incorrect email or password."
            );


        case "auth/too-many-requests":

            return new Error(
                "Too many login attempts. Please try again later."
            );


        case "auth/network-request-failed":

            return new Error(
                "Network error. Please check your internet connection."
            );


        case "auth/requires-recent-login":

            return new Error(
                "Please log in again before changing your password."
            );


        case "auth/weak-password":

            return new Error(
                "Password is too weak."
            );


        default:

            return new Error(
                error?.message ||
                "Authentication failed. Please try again."
            );

    }

}


/* =========================================================
   27. AUTHENTICATION EXPORT OBJECT
   ========================================================= */

export const authService = Object.freeze({

    login,

    logout,

    getCurrentUser,

    getCurrentUserProfile,

    getCurrentUserRole,

    getUserDisplayName,

    getUserEmail,

    getUserInitial,

    getUserRoleDisplayName,

    isAuthenticated,

    isAdmin,

    isManager,

    isStaff,

    isAccountsUser,

    isViewer,

    hasRole,

    changeCurrentUserPassword,

    initializeAuthState,

    subscribeToAuthState

});
