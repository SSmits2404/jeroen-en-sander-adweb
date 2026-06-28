import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Categories } from '../Categories';
import * as catService from '../../../services/categoryService';
import * as txService from '../../../services/transactionService';
import { AppStateContext } from '../../../state/appState';

vi.mock('../../../services/categoryService', () => ({
  subscribeCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

vi.mock('../../../services/transactionService', () => ({
  subscribeTransactions: vi.fn(),
}));

const mockCategories = [
  {
    id: 'cat1',
    name: 'Voeding',
    budget: 100,
    endDate: '2026-12-31',
    budgetBookId: 'book1',
  },
  {
    id: 'cat2',
    name: 'Reis',
    budget: 50,
    budgetBookId: 'book1',
  },
];

const normalTransactions = [
  {
    id: 'tx1',
    description: 'Boodschappen',
    amount: 20,
    date: '2026-06-18',
    type: 'expense' as const,
    categoryId: 'cat1',
    budgetBookId: 'book1',
    userId: 'demo-user',
  },
  {
    id: 'tx2',
    description: 'Terugbetaling',
    amount: 5,
    date: '2026-06-19',
    type: 'income' as const,
    categoryId: 'cat1',
    budgetBookId: 'book1',
    userId: 'demo-user',
  },
  {
    id: 'tx3',
    description: 'Hotel',
    amount: 20,
    date: '2026-06-20',
    type: 'expense' as const,
    categoryId: 'cat2',
    budgetBookId: 'book1',
    userId: 'demo-user',
  },
];

const warningTransactions = [
  {
    id: 'tx1',
    description: 'Boodschappen',
    amount: 96,
    date: '2026-06-18',
    type: 'expense' as const,
    categoryId: 'cat1',
    budgetBookId: 'book1',
    userId: 'demo-user',
  },
  {
    id: 'tx2',
    description: 'Terugbetaling',
    amount: 5,
    date: '2026-06-19',
    type: 'income' as const,
    categoryId: 'cat1',
    budgetBookId: 'book1',
    userId: 'demo-user',
  },
  {
    id: 'tx3',
    description: 'Hotel',
    amount: 20,
    date: '2026-06-20',
    type: 'expense' as const,
    categoryId: 'cat2',
    budgetBookId: 'book1',
    userId: 'demo-user',
  },
];

const overBudgetTransactions = [
  {
    id: 'tx1',
    description: 'Boodschappen',
    amount: 20,
    date: '2026-06-18',
    type: 'expense' as const,
    categoryId: 'cat1',
    budgetBookId: 'book1',
    userId: 'demo-user',
  },
  {
    id: 'tx2',
    description: 'Terugbetaling',
    amount: 5,
    date: '2026-06-19',
    type: 'income' as const,
    categoryId: 'cat1',
    budgetBookId: 'book1',
    userId: 'demo-user',
  },
  {
    id: 'tx3',
    description: 'Hotel',
    amount: 60,
    date: '2026-06-20',
    type: 'expense' as const,
    categoryId: 'cat2',
    budgetBookId: 'book1',
    userId: 'demo-user',
  },
];

function renderWithBook(transactions = normalTransactions) {
  vi.mocked(catService.subscribeCategories).mockImplementation((_id, cb) => {
    cb(mockCategories);
    return vi.fn();
  });

  vi.mocked(txService.subscribeTransactions).mockImplementation((_id, cb) => {
    cb(transactions);
    return vi.fn();
  });

  vi.mocked(catService.createCategory).mockResolvedValue();
  vi.mocked(catService.updateCategory).mockResolvedValue();
  vi.mocked(catService.deleteCategory).mockResolvedValue();

  return render(
    <AppStateContext.Provider value={{
      user: { id: 'demo-user', name: 'Demo' },
      activeBudgetBookId: 'book1',
      setActiveBudgetBookId: vi.fn(),
    }}>
      <Categories />
    </AppStateContext.Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Categories', () => {
  it('toont categorie met normale voortgang (onder 90%)', async () => {
    renderWithBook(normalTransactions);

    expect(await screen.findByText('Voeding')).toBeInTheDocument();

    expect(screen.getByText(/Gebruikt: €15\.00/)).toBeInTheDocument();
    expect(screen.getByText(/Resterend: €85\.00/)).toBeInTheDocument();
    expect(screen.getByText(/Budget: €100\.00/)).toBeInTheDocument();

    expect(screen.queryByText('Budget bijna op')).not.toBeInTheDocument();
    expect(screen.queryByText('Over budget!')).not.toBeInTheDocument();
  });

  it('toont waarschuwing bij bijna vol budget (boven 90%)', async () => {
    renderWithBook(warningTransactions);

    expect(await screen.findByText('Voeding')).toBeInTheDocument();

    expect(screen.getByText('Budget bijna op')).toBeInTheDocument();
    expect(screen.queryByText('Over budget!')).not.toBeInTheDocument();

    expect(screen.getByText(/Gebruikt: €91\.00/)).toBeInTheDocument();
    expect(screen.getByText(/Resterend: €9\.00/)).toBeInTheDocument();
  });

  it('toont over budget status correct', async () => {
    renderWithBook(overBudgetTransactions);

    expect(await screen.findByText('Reis')).toBeInTheDocument();
    expect(screen.getByText('Over budget!')).toBeInTheDocument();

    expect(screen.getByText(/Resterend: €-10\.00/)).toBeInTheDocument();
  });

  it('maakt een categorie aan zonder einddatum', async () => {
    renderWithBook();
    await screen.findByText('Voeding');

    fireEvent.change(screen.getByLabelText('Naam categorie'), {
      target: { value: 'Werk' },
    });
    fireEvent.change(screen.getByLabelText('Max budget (€)'), {
      target: { value: '250' },
    });

    fireEvent.click(screen.getByRole('button', { name: /categorie toevoegen/i }));

    await waitFor(() => {
      expect(catService.createCategory).toHaveBeenCalledWith({
        name: 'Werk',
        budget: 250,
        budgetBookId: 'book1',
      });
    });
  });

  it('maakt een categorie aan met einddatum', async () => {
    renderWithBook();
    await screen.findByText('Voeding');

    fireEvent.change(screen.getByLabelText('Naam categorie'), {
      target: { value: 'Vakantie' },
    });
    fireEvent.change(screen.getByLabelText('Max budget (€)'), {
      target: { value: '500' },
    });
    fireEvent.change(screen.getByLabelText('Einddatum (optioneel)'), {
      target: { value: '2026-12-31' },
    });

    fireEvent.click(screen.getByRole('button', { name: /categorie toevoegen/i }));

    await waitFor(() => {
      expect(catService.createCategory).toHaveBeenCalledWith({
        name: 'Vakantie',
        budget: 500,
        budgetBookId: 'book1',
        endDate: '2026-12-31',
      });
    });
  });

  it('bewerkt een categorie', async () => {
    renderWithBook();
    await screen.findByText('Voeding');

    const voedingItem = screen.getByText('Voeding').closest('li');
    expect(voedingItem).toBeTruthy();

    fireEvent.click(within(voedingItem!).getByRole('button', { name: /bewerken/i }));

    fireEvent.change(screen.getByLabelText('Naam categorie'), {
      target: { value: 'Boodschappen' },
    });
    fireEvent.change(screen.getByLabelText('Max budget (€)'), {
      target: { value: '125' },
    });
    fireEvent.change(screen.getByLabelText('Einddatum (optioneel)'), {
      target: { value: '2026-11-30' },
    });

    fireEvent.click(screen.getByRole('button', { name: /opslaan/i }));

    await waitFor(() => {
      expect(catService.updateCategory).toHaveBeenCalledWith(
        'cat1',
        expect.objectContaining({
          name: 'Boodschappen',
          budget: 125,
          budgetBookId: 'book1',
          endDate: '2026-11-30',
        })
      );
    });
  });

  it('verwijdert een categorie', async () => {
    renderWithBook();
    await screen.findByText('Voeding');

    const reisItem = screen.getByText('Reis').closest('li');
    expect(reisItem).toBeTruthy();

    fireEvent.click(within(reisItem!).getByRole('button', { name: /verwijderen/i }));

    await waitFor(() => {
      expect(catService.deleteCategory).toHaveBeenCalledWith('cat2');
    });
  });
});