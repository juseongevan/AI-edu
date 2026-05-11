import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, GoogleAuthProvider, signInWithPopup, updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data())
        }
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const register = async (email, password, displayName, role) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    const profile = {
      email,
      displayName,
      role,
      createdAt: serverTimestamp(),
      bookmarks: [],
    }
    await setDoc(doc(db, 'users', cred.user.uid), profile)
    setUserProfile(profile)
    return cred.user
  }

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const profileDoc = await getDoc(doc(db, 'users', cred.user.uid))
    if (profileDoc.exists()) setUserProfile(profileDoc.data())
    return cred.user
  }

  const loginWithGoogle = async (role = 'seeker') => {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    const profileRef = doc(db, 'users', cred.user.uid)
    const existing = await getDoc(profileRef)
    if (!existing.exists()) {
      const profile = {
        email: cred.user.email,
        displayName: cred.user.displayName,
        role,
        createdAt: serverTimestamp(),
        bookmarks: [],
      }
      await setDoc(profileRef, profile)
      setUserProfile(profile)
    } else {
      setUserProfile(existing.data())
    }
    return cred.user
  }

  const logout = () => {
    setUserProfile(null)
    return signOut(auth)
  }

  const refreshProfile = async () => {
    if (!user) return
    const profileDoc = await getDoc(doc(db, 'users', user.uid))
    if (profileDoc.exists()) setUserProfile(profileDoc.data())
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, register, login, loginWithGoogle, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
