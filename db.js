// db.js — the ONLY file that talks to Firebase.
//
// index.html never imports Firebase; it calls the functions on window.DB below.
// This is an ES module, so it publishes its API as window.DB and fires a
// "db-ready" event once loaded.
//
// Firestore layout (see firestore.rules for who may write what):
//   flights/{id}   { seq, from, to, km, dur, realDur, date:"DD/MM/YYYY" }
//                  + optional { module, flightMin, realMin, startedAt, endedAt }
//   seq increases with each flight (oldest = 1), so newest-first = highest seq first.
//   modules/{name} { name }
//
// Offline: Firestore keeps a copy of the data on the device (IndexedDB). A flight
// saved with no connection is stored locally straight away and uploaded
// automatically the next time the page is open online.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDoc, getDocs, getDocsFromCache, setDoc, deleteDoc,
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
const modules = collection(db, "modules");
const OPTIONAL_FIELDS = ["module", "flightMin", "realMin", "startedAt", "endedAt"];

// Firestore's write promises only resolve once the SERVER confirms. With no connection
// (or a stalled one) they can wait forever, so we never make the page wait on them:
// the change is already in this device's copy, and the upload carries on by itself.
const wait = ms => new Promise(r => setTimeout(r, ms));
function settle(promise, label) {
  promise.catch(e => console.error(label, e));
  return Promise.race([promise, wait(3000)]);   // the server's answer if quick, else carry on
}

// All flights, newest first: from the server if it answers within 4 s, otherwise this
// device's copy (offline, or a stalled connection).
async function loadFlights() {
  let snap;
  try {
    snap = await Promise.race([getDocs(flights), wait(4000).then(() => { throw new Error("server slow"); })]);
  } catch (e) {
    snap = await getDocsFromCache(flights);
  }
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.seq - a.seq);
}

// Save a new flight. Resolves within 3 s even with a slow or missing connection; it's
// already stored on the device and the upload continues in the background.
// Pass f.id to choose the document id (so a repeat save of the same flight is refused
// by the rules rather than duplicated); otherwise a random one is made.
// Returns the flight's id.
async function addFlight(f) {
  const ref = f.id ? doc(flights, f.id) : doc(flights);
  const data = { seq: f.seq, from: f.from, to: f.to, km: f.km, dur: f.dur, realDur: f.realDur ?? null, date: f.date };
  // Optional revamp fields: only sent when set (old flights simply don't have them).
  // startedAt/endedAt are JS Dates; Firestore stores them as timestamps.
  for (const k of OPTIONAL_FIELDS) if (f[k] != null) data[k] = f[k];
  await settle(setDoc(ref, data), "Flight upload failed");
  return ref.id;
}

// Gone from this device's copy at once; the server catches up in the background.
async function deleteFlight(id) {
  await settle(deleteDoc(doc(flights, id)), "Flight delete failed");
}

// ── Modules ───────────────────────────────────────────────
// modules/{name} = { name }. The id IS the name, so the rules refuse a duplicate.

// All module names, alphabetical.
async function loadModules() {
  const snap = await getDocs(modules);
  return snap.docs.map(d => d.data().name).sort((a, b) => a.localeCompare(b));
}

// Add a module (lowercased, trimmed). Resolves to the stored name; adding one that
// already exists just returns it. Throws on an invalid name.
async function addModule(name) {
  const n = String(name).trim().toLowerCase().replace(/\s+/g, " ");
  // "/" can't be in a document id; "." / ".." and "__x__" are reserved by Firestore.
  if (!n || n.length > 40 || n.includes("/") || n === "." || n === ".." || /^__.*__$/.test(n)) {
    throw new Error("invalid module name");
  }
  const ref = doc(modules, n);
  if ((await getDoc(ref)).exists()) return n;
  await settle(setDoc(ref, { name: n }), "Module upload failed");
  return n;
}

window.DB = { loadFlights, addFlight, deleteFlight, loadModules, addModule };
window.dispatchEvent(new Event("db-ready"));
