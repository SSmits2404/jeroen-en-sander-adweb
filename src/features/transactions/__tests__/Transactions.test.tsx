/**
 * Transactions.test.tsx
 *
 * Test de happy flows van het Transactions component.
 * Beide service-modules worden gemockt; AppState levert een actief boekje.
 */
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Transactions } from '../Transactions';
import * as txService from '../../../services/transactionService';
import * as catService from '../../../services/categoryService';
import { AppStateContext } from '../../../state/appState';

vi.mock('../../../services/transactionService', () => ({
  subscribeTransactions: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
}));

vi.mock('../../../services/categoryService', () => ({
  subscribeCategories: vi.fn(),
}));

const mockTransactions = [
  {
    id: 'tx1',
    description: 'Boodschappen',
    amount: 42.5,
    date: '2026-06-18',
    type: 'expense' as const,
    budgetBookId: 'book1',
    userId: 'demo-user',
  },
  {
    id: 'tx2',
    description: 'Salaris',
    amount: 2400,
    date: '2026-06-25',
    type: 'income' as const,
    budgetBookId: 'book1',
    userId: 'demo-user',
  },
];

function renderWithBook() {
  return render(
    <AppStateContext.Provider
      value={{
        user: { id: 'demo-user', name: 'Demo' },
        activeBudgetBookId: 'book1',
        setActiveBudgetBookId: vi.fn(),
      }}
    >
      <Transactions />
    </AppStateContext.Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(txService.subscribeTransactions).mockImplementation((_id, cb) => {
    cb(mockTransactions);
    return vi.fn();
  });

  vi.mocked(catService.subscribeCategories).mockImplementation((_id, cb) => {
    cb([]);
    return vi.fn();
  });

  vi.mocked(txService.createTransaction).mockResolvedValue();
  vi.mocked(txService.updateTransaction).mockResolvedValue();
  vi.mocked(txService.deleteTransaction).mockResolvedValue();
});

describe('Transactions', () => {
  it('toont transacties en statistieken', async () => {
    renderWithBook();

    expect(await screen.findByText('Boodschappen')).toBeInTheDocument();
    expect(screen.getByText('Salaris')).toBeInTheDocument();
    expect(screen.getByText('Inkomsten')).toBeInTheDocument();
    expect(screen.getByText('Uitgaven')).toBeInTheDocument();
    expect(screen.getByText('Balans')).toBeInTheDocument();
  });

  it('voegt een nieuwe transactie toe bij geldige invoer', async () => {
    renderWithBook();
    await screen.findByText('Boodschappen');

    fireEvent.change(screen.getByPlaceholderText('Omschrijving'), {
      target: { value: 'Test uitgave' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '25.50' },
    });
    fireEvent.click(screen.getByRole('button', { name: /toevoegen/i }));

    await waitFor(() => {
      expect(txService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Test uitgave',
          amount: 25.5,
          type: 'expense',
          budgetBookId: 'book1',
          userId: 'demo-user',
        })
      );
    });
  });

  it('bewerkt een bestaande transactie', async () => {
    renderWithBook();
    await screen.findByText('Boodschappen');

    const boodschappenItem = screen.getByText('Boodschappen').closest('li');
    expect(boodschappenItem).toBeTruthy();

    const item = within(boodschappenItem!);
    fireEvent.click(item.getByRole('button', { name: /bewerken/i }));

    expect(screen.getByDisplayValue('Boodschappen')).toBeInTheDocument();
    expect(screen.getByDisplayValue('42.5')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Omschrijving'), {
      target: { value: 'Aangepaste uitgave' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '55.75' },
    });
    fireEvent.click(screen.getByRole('button', { name: /opslaan/i }));

    await waitFor(() => {
      expect(txService.updateTransaction).toHaveBeenCalledWith(
        'tx1',
        expect.objectContaining({
          description: 'Aangepaste uitgave',
          amount: 55.75,
          type: 'expense',
          date: '2026-06-18',
          budgetBookId: 'book1',
          userId: 'demo-user',
        })
      );
    });
  });

  it('verwijdert een transactie', async () => {
    renderWithBook();
    await screen.findByText('Boodschappen');

    const boodschappenItem = screen.getByText('Boodschappen').closest('li');
    expect(boodschappenItem).toBeTruthy();

    const item = within(boodschappenItem!);
    fireEvent.click(item.getByRole('button', { name: /verwijderen/i }));

    await waitFor(() => {
      expect(txService.deleteTransaction).toHaveBeenCalledWith('tx1');
    });
  });

  it('toont fallback wanneer geen budgetboek actief is', () => {
    render(
      <AppStateContext.Provider value={{
        user: { id: 'demo-user', name: 'Demo' },
        activeBudgetBookId: null,
        setActiveBudgetBookId: vi.fn(),
      }}>
        <Transactions />
      </AppStateContext.Provider>
    );

    expect(
      screen.getByText(/Selecteer eerst een huishoudboekje/i)
    ).toBeInTheDocument();
  });
});