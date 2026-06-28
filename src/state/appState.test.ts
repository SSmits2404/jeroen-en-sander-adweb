/**
 * appState.test.ts
 *
 * Test de AppState context.
 * Firebase Auth wordt gemockt zodat onAuthStateChanged controleerbaar is.
 */
import { ReactNode, createElement, act } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppStateProvider, useAppState } from './appState';

// ── mock Firebase Auth ──────────────────────────────────────────────────────
// We mocken de hele firebase/auth module. onAuthStateChanged roept de callback
// direct aan met null (niet ingelogd), zodat de test geen netwerk nodig heeft.
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth, cb) => {
    cb(null); // geen ingelogde gebruiker
    return vi.fn(); // unsubscribe
  }),
  getAuth: vi.fn(() => ({})),
}));

vi.mock('../services/firebase', () => ({
  auth: {},
}));

// ── helpers ─────────────────────────────────────────────────────────────────
function wrapper({ children }: { children: ReactNode }) {
  return createElement(AppStateProvider, null, children);
}

// ── tests ────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('AppState', () => {
  it('heeft geen gebruiker als Firebase geen sessie levert', async () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    expect(result.current.user).toBeNull();
  });

  it('is authReady nadat onAuthStateChanged is aangeroepen', async () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    expect(result.current).toHaveProperty('authReady', true);
  });

  it('begint zonder actief boekje', () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    expect(result.current.activeBudgetBookId).toBeNull();
  });

  it('setActiveBudgetBookId werkt zonder ingelogde gebruiker', () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    act(() => {
      result.current.setActiveBudgetBookId('book-abc');
    });
    expect(result.current.activeBudgetBookId).toBe('book-abc');
  });
});
