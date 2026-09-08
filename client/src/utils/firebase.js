
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
const firebaseConfig = {
  apiKey:import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "interviewiq-db7f8.firebaseapp.com",
  projectId: "interviewiq-db7f8",
  storageBucket: "interviewiq-db7f8.firebasestorage.app",
  messagingSenderId: "419475898642",
  appId: "1:419475898642:web:b59f581dcf153cb146f3cb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider()
export {auth,provider}