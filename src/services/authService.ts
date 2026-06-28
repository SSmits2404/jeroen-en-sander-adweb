import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from './firebase';

export interface AppUser {
  id: string;
  name: string;
  email: string | null;
}

export function mapFirebaseUser(firebaseUser: FirebaseUser): AppUser {
  return {
    id: firebaseUser.uid,
    name:
      firebaseUser.displayName?.trim() ||
      firebaseUser.email?.split('@')[0] ||
      'Gebruiker',
    email: firebaseUser.email,
  };
}

export async function signInUser(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpUser(email: string, password: string, name: string) {
  const credentials = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(credentials.user, {
    displayName: name.trim() || email.split('@')[0],
  });

  await setDoc(doc(firestore, 'users', credentials.user.uid), {
    displayName: name.trim() || email.split('@')[0],
    email: email.toLowerCase().trim(),
    createdAt: serverTimestamp(),
  });

  return credentials;
}

export async function signOutUser() {
  await signOut(auth);
}