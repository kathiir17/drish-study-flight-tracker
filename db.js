// db.js — the ONLY file that talks to Firebase.
//
// index.html never imports Firebase; it calls the functions on window.DB below.
// This is an ES module, so it publishes its API as window.DB and fires a
// "db-ready" event once loaded.
//
// Firestore layout (see firestore.rules for who may write what):
//   flights/{id}   { seq, from, to, km, dur, realDur, date:"DD/MM/YYYY" }
//   seq increases with each flight (oldest = 1), so newest-first = highest seq first.
//
// Offline: Firestore keeps a copy of the data on the device (IndexedDB). A flight
// saved with no connection is stored locally straight away and uploaded
// automatically the next time the page is open online.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDocs, setDoc, deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Public web config — safe to publish; access is controlled by firestore.rules.
const firebaseConfig = {
  apiKey: "AIzaSyDCllDfQJLogV3sXLNos3QOYrVHR0yjofE",
  authDomain: "drish-flight-study-tracker.firebaseapp.com",
  projectId: "drish-flight-study-tracker",
  storageBucket: "drish-flight-study-tracker.firebasestorage.app",
  messagingSenderId: "396668577009",
  appId: "1:396668577009:web:75dbdfa6efeea2a42a7550",
};

const db = initializeFirestore(initializeApp(firebaseConfig), {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
const flights = collection(db, "flights");

// All flights, newest first.
async function loadFlights() {
  const snap = await getDocs(flights);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.seq - a.seq);
}

// Save a new flight. Resolves as soon as it is stored on the device (it is not
// held up by a slow or missing connection); the upload continues in the background.
// Returns the new flight's id.
async function addFlight(f) {
  const ref = doc(flights); // new random id
  const data = { seq: f.seq, from: f.from, to: f.to, km: f.km, dur: f.dur, realDur: f.realDur ?? null, date: f.date };
  const upload = setDoc(ref, data);
  upload.catch(e => console.error("Flight upload failed", e));
  // Wait for the server if it answers quickly; otherwise carry on with the local copy.
  await Promise.race([upload, new Promise(r => setTimeout(r, 3000))]);
  return ref.id;
}

async function deleteFlight(id) {
  await deleteDoc(doc(flights, id));
}

window.DB = { loadFlights, addFlight, deleteFlight };
window.dispatchEvent(new Event("db-ready"));
