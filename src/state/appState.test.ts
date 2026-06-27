import { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { AppStateProvider, useAppState } from './appState';

describe('AppState', () => {
  it('provides a demo user', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <AppStateProvider>{children}</AppStateProvider>;
    const { result } = renderHook(() => useAppState(), { wrapper });

    expect(result.current.user).toEqual({ id: 'demo-user', name: 'Demo gebruiker' });
  });
});
