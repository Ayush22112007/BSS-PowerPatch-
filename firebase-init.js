import {
initializeApp
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
getFirestore,
collection,
addDoc,
serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
initializeAppCheck,
ReCaptchaV3Provider
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";


const firebaseConfig = {
  apiKey: "AIzaSyBWHLZ1qRzDQIEpBZ0TZSzt_cdTx27toG4",
  authDomain: "powerpatch-7d9ae.firebaseapp.com",
  projectId: "powerpatch-7d9ae",
  storageBucket: "powerpatch-7d9ae.firebasestorage.app",
  messagingSenderId: "370451089713",
  appId: "1:370451089713:web:42109b8cd0084da3184810",
  measurementId: "G-ZG4LY5TX42"
};

const app = initializeApp(firebaseConfig);

initializeAppCheck(app,{

provider:new ReCaptchaV3Provider(
"6LcNQtwsAAAAAH18q__7_kQQk926-EZeSoaBTkfZ"
),

isTokenAutoRefreshEnabled:true

});

const db = getFirestore(app);

export {
db,
collection,
addDoc,
serverTimestamp
};