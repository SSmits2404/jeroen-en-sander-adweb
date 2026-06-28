import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppStateProvider, useAppState } from './appState';

vi.mock('../services/firebase', () => ({
  auth: {},
  firestore: {},
}));

describe('AppState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('levert een ingelogde gebruiker uit Firebase Auth', async () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(AppStateProvider, null, children);

    const { result } = renderHook(() => useAppState(), { wrapper });

    await waitFor(() => {
      expect(result.current.authReady).toBe(true);
    });

    expect(result.current.user).toEqual({
      id: 'demo-user',
      name: 'Demo gebruiker',
      email: 'demo@voorbeeld.nl',
    });
  });

  it('begint zonder actief boekje en kan dat opslaan per gebruiker', async () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(AppStateProvider, null, children);

    const { result } = renderHook(() => useAppState(), { wrapper });

    await waitFor(() => {
      expect(result.current.authReady).toBe(true);
    });

    expect(result.current.activeBudgetBookId).toBeNull();

    await act(async () => {
      result.current.setActiveBudgetBookId('book-123');
    });

    expect(result.current.activeBudgetBookId).toBe('book-123');
    expect(localStorage.getItem('activeBudgetBookId:demo-user')).toBe('book-123');

    await act(async () => {
      result.current.setActiveBudgetBookId(null);
    });

    expect(result.current.activeBudgetBookId).toBeNull();
    expect(localStorage.getItem('activeBudgetBookId:demo-user')).toBeNull();
  });
});
