import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            "AIzaSyCpw-rBqTspfDU8xCbOUFS1tQ6x1sqF3lU",
  authDomain:        "vibecoding01-ea664.firebaseapp.com",
  projectId:         "vibecoding01-ea664",
  storageBucket:     "vibecoding01-ea664.firebasestorage.app",
  messagingSenderId: "799398301460",
  appId:             "1:799398301460:web:0450cd432f7d185f28fc01",
  measurementId:     "G-HNV83JY09C",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
export const db      = getFirestore(app)
export const storage = getStorage(app)
export const auth    = getAuth(app)
