import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders navigation buttons and user info', () => {
    render(
      <AppShell
        sections={[{ id: 'dashboard', label: 'Dashboard' }]}
        activeSection="dashboard"
        onSectionChange={() => {}}
        user={{ name: 'Test gebruiker' }}
      >
        <div>Child</div>
      </AppShell>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Ingelogd als Test gebruiker')).toBeInTheDocument();
  });

  it('calls onSectionChange when a section button is clicked', () => {
    const onSectionChange = vi.fn();
    render(
      <AppShell
        sections={[{ id: 'dashboard', label: 'Dashboard' }]}
        activeSection="dashboard"
        onSectionChange={onSectionChange}
        user={null}
      >
        <div>Child</div>
      </AppShell>
    );

    fireEvent.click(screen.getByText('Dashboard'));
    expect(onSectionChange).toHaveBeenCalledWith('dashboard');
  });
});
