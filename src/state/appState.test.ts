import { ReactNode, createElement } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AppStateProvider, useAppState } from './appState';

describe('AppState', () => {
  it('levert een demo gebruiker', () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(AppStateProvider, null, children);
    const { result } = renderHook(() => useAppState(), { wrapper });
    expect(result.current.user).toEqual({ id: 'demo-user', name: 'Demo gebruiker' });
  });

  it('begint zonder actief boekje', () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(AppStateProvider, null, children);
    const { result } = renderHook(() => useAppState(), { wrapper });
    expect(result.current.activeBudgetBookId).toBeNull();
  });
});
