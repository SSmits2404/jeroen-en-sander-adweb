/**
 * appState.ts
 *
 * Globale state voor authenticatie en geselecteerd huishoudboekje.
 * Separation of Concern: components consumeren alleen deze context,
 * ze weten niets van Firebase Auth internals.
 */
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  createElement,
} from 'react';

export interface User {
  id: string;
  name: string;
}

interface AppState {
  user: User | null;
  activeBudgetBookId: string | null;
  setActiveBudgetBookId: (id: string | null) => void;
}

const defaultState: AppState = {
  user: null,
  activeBudgetBookId: null,
  setActiveBudgetBookId: () => {},
};

// Exported so tests can inject custom values
export const AppStateContext = createContext<AppState>(defaultState);

export function AppStateProvider({ children }: { children: ReactNode }) {
  // In productie: vervang door onAuthStateChanged van Firebase Auth
  const [user] = useState<User | null>({ id: 'demo-user', name: 'Demo gebruiker' });
  const [activeBudgetBookId, setActiveBudgetBookId] = useState<string | null>(null);

  return createElement(
    AppStateContext.Provider,
    { value: { user, activeBudgetBookId, setActiveBudgetBookId } },
    children
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}
