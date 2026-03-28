import { initializeApp } from "firebase/app"
import { getAuth, setPersistence, browserSessionPersistence, browserLocalPersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

// Configure session persistence for security
// SESSION: Session cookie expires when browser is closed
// LOCAL: Session persists until explicitly cleared (less secure)
// For maximum security with timeout, we use SESSION persistence
// However, for development (especially after dev server restarts), 
// we use LOCAL to prevent session loss
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error)
  })

export const db = getFirestore(app)
export const storage = getStorage(app)
