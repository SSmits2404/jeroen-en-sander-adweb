import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

const mockUser = {
  uid: 'demo-user',
  displayName: 'Demo gebruiker',
  email: 'demo@voorbeeld.nl',
};

vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual<typeof import('firebase/auth')>('firebase/auth');

  return {
    ...actual,
    onAuthStateChanged: (_auth: unknown, callback: (user: unknown) => void) => {
      callback(mockUser);
      return vi.fn();
    },
    createUserWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
  };
});