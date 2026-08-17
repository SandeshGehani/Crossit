import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCPJVb2FAv_4prqWZu2V68jyIsdJ2Q5yxk",
  authDomain: "croedger-df9a9.firebaseapp.com",
  projectId: "croedger-df9a9",
  storageBucket: "croedger-df9a9.firebasestorage.app",
  messagingSenderId: "73291052366",
  appId: "1:73291052366:web:ce349b4e2f8c78cb185a1f",
  measurementId: "G-TREG8JV43M"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();