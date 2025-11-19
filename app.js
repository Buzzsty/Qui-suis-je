/******************************************************
 *  app.js — VERSION FINALE AVEC FIREBASE FIRESTORE
 ******************************************************/

// ---------- IMPORTS FIREBASE (CDN) ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ---------- CONFIG FIREBASE (TA CONFIG) ----------
const firebaseConfig = {
  apiKey: "AIzaSyA3UEPy4BGPw0iKiSSTzuGE-z14PzAvAp4",
  authDomain: "
