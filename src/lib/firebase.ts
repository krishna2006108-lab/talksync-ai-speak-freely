// Firebase Authentication (email/password + Google).
// Supabase stays as the database; Firebase only handles who the user is.
//
// NOTE: this web config is NOT secret — Firebase web API keys are public
// identifiers. Security comes from Firebase Auth's authorized-domains list
// and rules, so this is safe to ship in the client bundle.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDFnINn-92OfMexcVQB3R7BT_Sak7VQx-8",
  authDomain: "talk-sync-cec72.firebaseapp.com",
  projectId: "talk-sync-cec72",
  storageBucket: "talk-sync-cec72.firebasestorage.app",
  messagingSenderId: "453098367661",
  appId: "1:453098367661:web:c1a2a69e92eea7919d7424",
  measurementId: "G-17SF4M3L47",
};

let _auth: Auth | undefined;

// Lazy singleton — only touched from client-side code (effects / handlers),
// so nothing Firebase-related runs during SSR.
export function getFirebaseAuth(): Auth {
  if (!_auth) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    _auth = getAuth(app);
  }
  return _auth;
}

export const googleProvider = new GoogleAuthProvider();

/** Turn Firebase error codes into short, human messages. */
export function firebaseAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "That email doesn't look right.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in.";
    case "auth/weak-password":
      return "Password is too weak (min 6 characters).";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google popup. Allow popups and retry.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}
