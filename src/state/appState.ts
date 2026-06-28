/**
 * appState.ts
 *
 * Globale state voor authenticatie en geselecteerd huishoudboekje.
 * Components consumeren alleen deze context, ze weten niets van Firebase Auth internals.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  createElement,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { mapFirebaseUser, type AppUser } from '../services/authService';

export interface User extends AppUser {}

interface AppState {
  user: User | null;
  authReady: boolean;
  activeBudgetBookId: string | null;
  setActiveBudgetBookId: (id: string | null) => void;
}

const defaultState: AppState = {
  user: null,
  authReady: false,
  activeBudgetBookId: null,
  setActiveBudgetBookId: () => {},
};

export const AppStateContext = createContext<AppState>(defaultState);

const STORAGE_KEY = 'activeBudgetBookId';
const storageKeyForUser = (userId: string) => `${STORAGE_KEY}:${userId}`;

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeBudgetBookId, setActiveBudgetBookIdRaw] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      setActiveBudgetBookIdRaw(null);
      return;
    }

    setActiveBudgetBookIdRaw(localStorage.getItem(storageKeyForUser(user.id)));
  }, [authReady, user?.id]);

  function setActiveBudgetBookId(id: string | null) {
    if (!user) {
      setActiveBudgetBookIdRaw(id);
      return;
    }

    const key = storageKeyForUser(user.id);

    if (id === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, id);
    }

    setActiveBudgetBookIdRaw(id);
  }

  return createElement(
    AppStateContext.Provider,
    {
      value: {
        user,
        authReady,
        activeBudgetBookId,
        setActiveBudgetBookId,
      },
    },
    children
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}