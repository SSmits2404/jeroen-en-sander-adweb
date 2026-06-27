/**
 * Transactions.test.tsx
 *
 * Test de happy flows van het Transactions component.
 * Beide service-modules worden gemockt; AppState levert een actief boekje.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Transactions } from '../Transactions';
import * as txService from '../../../services/transactionService';
import * as catService from '../../../services/categoryService';
import { AppStateContext } from '../../../state/appState';

vi.mock('../../../services/transactionService', () => ({
  subscribeTransactions: vi.fn(),
  createTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
}));

vi.mock('../../../services/categoryService', () => ({
  subscribeCategories: vi.fn(),
}));

const mockTransactions = [
  { id: 'tx1', description: 'Boodschappen', amount: 42.5, date: '2026-06-18', type: 'expense' as const, budgetBookId: 'book1', userId: 'demo-user' },
  { id: 'tx2', description: 'Salaris', amount: 2400, date: '2026-06-25', type: 'income' as const, budgetBookId: 'book1', userId: 'demo-user' },
];

// Helper: render met een actief boekje in context
function renderWithBook() {
  return render(
    <AppStateContext.Provider value={{ user: { id: 'demo-user', name: 'Demo' }, activeBudgetBookId: 'book1', setActiveBudgetBookId: vi.fn() }}>
      <Transactions />
    </AppStateContext.Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(txService.subscribeTransactions).mockImplementation((_id, cb) => { cb(mockTransactions); return vi.fn(); });
  vi.mocked(catService.subscribeCategories).mockImplementation((_id, cb) => { cb([]); return vi.fn(); });
  vi.mocked(txService.createTransaction).mockResolvedValue();
  vi.mocked(txService.deleteTransaction).mockResolvedValue();
});

describe('Transactions', () => {
  it('toont transacties en statistieken', async () => {
    renderWithBook();
    expect(await screen.findByText('Boodschappen')).toBeInTheDocument();
    expect(screen.getByText('Salaris')).toBeInTheDocument();
    // Statistieken
    expect(screen.getByText('Inkomsten')).toBeInTheDocument();
    expect(screen.getByText('Uitgaven')).toBeInTheDocument();
    expect(screen.getByText('Balans')).toBeInTheDocument();
  });

  it('voegt een nieuwe transactie toe bij geldige invoer', async () => {
    renderWithBook();
    await screen.findByText('Boodschappen');

    fireEvent.change(screen.getByPlaceholderText('Omschrijving'), { target: { value: 'Test uitgave' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '25.50' } });
    fireEvent.click(screen.getByRole('button', { name: /toevoegen/i }));

    await waitFor(() => {
      expect(txService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Test uitgave', amount: 25.5, type: 'expense', budgetBookId: 'book1' })
      );
    });
  });

  it('verwijdert een transactie', async () => {
    renderWithBook();
    await screen.findByText('Boodschappen');

    const deleteButtons = screen.getAllByRole('button', { name: /verwijderen/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(txService.deleteTransaction).toHaveBeenCalled();
    });
  });
});
