export { initializeApp } from 'firebase/app';
export { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail, updatePassword } from 'firebase/auth';
export { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, query, where, documentId, onSnapshot, setDoc, deleteDoc, getDoc, getDocFromServer } from 'firebase/firestore';
