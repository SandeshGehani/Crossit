// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCPJVb2FAv_4prqWZu2V68jyIsdJ2Q5yxk",
  authDomain: "croedger-df9a9.firebaseapp.com",
  projectId: "croedger-df9a9",
  storageBucket: "croedger-df9a9.firebasestorage.app",
  messagingSenderId: "73291052366",
  appId: "1:73291052366:web:ce349b4e2f8c78cb185a1f",
  measurementId: "G-TREG8JV43M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);