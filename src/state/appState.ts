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
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, firestore } from '../services/firebase';
import { mapFirebaseUser, type AppUser } from '../services/authService';
import type { BudgetBook } from '../services/budgetBookService';

export interface User extends AppUser {}

interface AppState {
  user: User | null;
  authReady: boolean;
  activeBudgetBookId: string | null;
  setActiveBudgetBookId: (id: string | null) => void;
  /**
   * Het volledige document van het actieve huishoudboekje (real-time via onSnapshot).
   * Hiermee kunnen alle tabbladen — niet alleen "Huishoudboekjes" — laten zien
   * van wie het geselecteerde boekje is (eigen boekje of uitgenodigd door iemand anders).
   * Is `null` zolang er geen boekje geselecteerd is of de data nog laadt.
   */
  activeBudgetBook: BudgetBook | null;
}

const defaultState: AppState = {
  user: null,
  authReady: false,
  activeBudgetBookId: null,
  setActiveBudgetBookId: () => {},
  activeBudgetBook: null,
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

  // Houd het volledige boekje-document van het actieve boekje real-time bij,
  // zodat elk tabblad (niet alleen "Huishoudboekjes") kan tonen van wie het is.
  const [activeBudgetBook, setActiveBudgetBook] = useState<BudgetBook | null>(null);

  useEffect(() => {
    if (!activeBudgetBookId) {
      setActiveBudgetBook(null);
      return;
    }

    try {
      const unsub = onSnapshot(doc(firestore, 'budgetBooks', activeBudgetBookId), (snap) => {
        if (!snap.exists()) {
          setActiveBudgetBook(null);
          return;
        }
        setActiveBudgetBook({
          id: snap.id,
          ...(snap.data() as Omit<BudgetBook, 'id'>),
        });
      });

      return unsub;
    } catch {
      // Beschermt tegen omgevingen waar `firestore` niet (volledig) gemockt is,
      // bijv. unit tests die alleen activeBudgetBookId/localStorage testen.
      setActiveBudgetBook(null);
      return;
    }
  }, [activeBudgetBookId]);

  return createElement(
    AppStateContext.Provider,
    {
      value: {
        user,
        authReady,
        activeBudgetBookId,
        setActiveBudgetBookId,
        activeBudgetBook,
      },
    },
    children
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}