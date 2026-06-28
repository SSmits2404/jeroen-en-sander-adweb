/**
 * MembersPanel.test.tsx
 *
 * Test de happy flows van het MembersPanel component.
 * inviteService wordt gemockt zodat de test geen Firebase nodig heeft.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MembersPanel } from '../MembersPanel';
import * as inviteService from '../../../services/inviteService';
import { AppStateProvider } from '../../../state/appState';
import { BudgetBook } from '../../../services/budgetBookService';

vi.mock('../../../services/inviteService', () => ({
  inviteMember: vi.fn(),
  removeMember: vi.fn(),
  subscribeBudgetBooksForUser: vi.fn(),
}));

const ownerBook: BudgetBook = {
  id: 'book-1',
  name: 'Gezin',
  description: 'Familie boekje',
  ownerId: 'demo-user',
  archived: false,
  memberIds: ['member-uid-1'],
};

const memberBook: BudgetBook = {
  ...ownerBook,
  ownerId: 'other-user',
  memberIds: ['demo-user'],
};

function renderPanel(book: BudgetBook) {
  return render(
    <AppStateProvider>
      <MembersPanel book={book} />
    </AppStateProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(inviteService.inviteMember).mockResolvedValue({ displayName: 'Jan Jansen' });
  vi.mocked(inviteService.removeMember).mockResolvedValue();
});

describe('MembersPanel', () => {
  it('toont bestaande leden', () => {
    renderPanel(ownerBook);
    expect(screen.getByText('member-uid-1')).toBeInTheDocument();
  });

  it('toont het uitnodigingsformulier voor de eigenaar', () => {
    renderPanel(ownerBook);
    expect(screen.getByPlaceholderText('naam@voorbeeld.nl')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /uitnodigen/i })).toBeInTheDocument();
  });

  it('verbergt het uitnodigingsformulier voor niet-eigenaren', () => {
    renderPanel(memberBook);
    expect(screen.queryByPlaceholderText('naam@voorbeeld.nl')).not.toBeInTheDocument();
  });

  it('nodigt een lid uit via e-mailadres', async () => {
    renderPanel(ownerBook);

    fireEvent.change(screen.getByPlaceholderText('naam@voorbeeld.nl'), {
      target: { value: 'jan@voorbeeld.nl' },
    });
    fireEvent.click(screen.getByRole('button', { name: /uitnodigen/i }));

    await waitFor(() => {
      expect(inviteService.inviteMember).toHaveBeenCalledWith(
        'book-1',
        'jan@voorbeeld.nl',
        'demo-user'
      );
    });

    expect(await screen.findByText(/Jan Jansen is toegevoegd/i)).toBeInTheDocument();
  });

  it('toont een foutmelding als het e-mailadres niet bestaat', async () => {
    vi.mocked(inviteService.inviteMember).mockRejectedValue(
      new Error('Geen gebruiker gevonden met e-mailadres "onbekend@test.nl".')
    );

    renderPanel(ownerBook);

    fireEvent.change(screen.getByPlaceholderText('naam@voorbeeld.nl'), {
      target: { value: 'onbekend@test.nl' },
    });
    fireEvent.click(screen.getByRole('button', { name: /uitnodigen/i }));

    expect(await screen.findByText(/Geen gebruiker gevonden/i)).toBeInTheDocument();
  });

  it('verwijdert een lid als eigenaar', async () => {
    renderPanel(ownerBook);

    fireEvent.click(screen.getByRole('button', { name: /verwijderen/i }));

    await waitFor(() => {
      expect(inviteService.removeMember).toHaveBeenCalledWith('book-1', 'member-uid-1');
    });
  });

  it('de uitnodigen-knop is uitgeschakeld bij leeg e-mailadres', () => {
    renderPanel(ownerBook);
    const btn = screen.getByRole('button', { name: /uitnodigen/i });
    expect(btn).toBeDisabled();
  });
});
