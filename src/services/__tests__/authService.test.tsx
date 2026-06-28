import { describe, it, expect, vi } from 'vitest';
import * as authService from '../authService';

// Gebruik geen variabelen van buitenaf in deze fabriek!
// Mock de firebase-service
vi.mock('../firebase', () => ({
  auth: {}, // Leeg object is vaak genoeg als je functies ook mockt
  firestore: {
    // Voeg hier de firestore instantie toe die je code nodig heeft
  },
}));

// Mock specifieke functies uit firebase/firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(),
}));
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}));

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

describe('authService', () => {
  it('maps firebase user correctly', () => {
    const result = authService.mapFirebaseUser({
      uid: '123',
      displayName: 'Test User',
      email: 'test@example.com',
    } as any);

    expect(result).toEqual({
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  it('falls back to email prefix when no displayName', () => {
    const result = authService.mapFirebaseUser({
      uid: '123',
      displayName: '',
      email: 'john@example.com',
    } as any);

    expect(result.name).toBe('john');
  });

  it('calls signInUser', async () => {
    (signInWithEmailAndPassword as any).mockResolvedValue('ok');

    await authService.signInUser('a@b.com', 'pw');

    expect(signInWithEmailAndPassword).toHaveBeenCalled();
  });

  it('calls signUpUser and sets display name', async () => {
    (createUserWithEmailAndPassword as any).mockResolvedValue({
      user: {},
    });

    await authService.signUpUser('a@b.com', 'pw', 'Name');

    expect(updateProfile).toHaveBeenCalled();
  });

  it('calls signOutUser', async () => {
    (signOut as any).mockResolvedValue(undefined);

    await authService.signOutUser();

    expect(signOut).toHaveBeenCalled();
  });
});