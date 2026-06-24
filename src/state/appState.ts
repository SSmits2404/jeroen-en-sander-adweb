import { createContext, useContext, ReactNode, createElement } from 'react';

interface User {
  id: string;
  name: string;
}

interface AppState {
  user: User | null;
}

const initialState: AppState = {
  user: { id: 'demo-user', name: 'Demo gebruiker' }
};

const AppStateContext = createContext<AppState>(initialState);

export function AppStateProvider({ children }: { children: ReactNode }) {
  return createElement(AppStateContext.Provider, { value: initialState }, children);
}

export function useAppState() {
  return useContext(AppStateContext);
}
