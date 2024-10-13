import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBTNqgpWy9qZJVwdAIz4qsQ_QhvUZ7HAro",
  authDomain: "ontrack-d6901.firebaseapp.com",
  projectId: "ontrack-d6901",
  storageBucket: "ontrack-d6901.appspot.com",
  messagingSenderId: "852655650408",
  appId: "1:852655650408:web:d442063097e75992686ddd",
  measurementId: "G-FSNVXY9N2T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };