import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBWy43hrwFnvq0SPXrEnDbYv2zI_-dkH-E",
  authDomain: "kreavo-app.firebaseapp.com",
  projectId: "kreavo-app",
  storageBucket: "kreavo-app.firebasestorage.app",
  messagingSenderId: "1082352729040",
  appId: "1:1082352729040:web:0b5253c0eaaeb6736797d5"
};

const app = initializeApp(firebaseConfig);

// Menggunakan metode cache terbaru pengganti enableIndexedDbPersistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();