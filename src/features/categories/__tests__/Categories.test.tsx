/**
 * Categories.test.tsx
 *
 * Test de happy flows van het Categories component.
 * Beide service-modules worden gemockt; AppState levert een actief boekje.
 * Separation of Concern maakt dit eenvoudig: alleen de service-laag wordt gemockt.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  { id: 'cat1', name: 'Boodschappen', budget: 300, budgetBookId: 'book1' },
  { id: 'cat2', name: 'Vervoer', budget: 100, budgetBookId: 'book1' },
];

const mockTransactions = [
  { id: 'tx1', description: 'Albert Heijn', amount: 45, date: '2026-06-01', type: 'expense' as const, categoryId: 'cat1', budgetBookId: 'book1', userId: 'u1' },
];

function renderWithBook() {
  return render(
    <AppStateContext.Provider value={{
      user: { id: 'u1', name: 'Demo' },
      activeBudgetBookId: 'book1',
      setActiveBudgetBookId: vi.fn(),
    }}>
      <Categories />
    </AppStateContext.Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(catService.subscribeCategories).mockImplementation((_id, cb) => {
    cb(mockCategories);
    return vi.fn();
  });
  vi.mocked(txService.subscribeTransactions).mockImplementation((_id, cb) => {
    cb(mockTransactions);
    return vi.fn();
  });
  vi.mocked(catService.createCategory).mockResolvedValue();
  vi.mocked(catService.updateCategory).mockResolvedValue();
  vi.mocked(catService.deleteCategory).mockResolvedValue();
});

describe('Categories', () => {
  it('toont alle categorieën', async () => {
    renderWithBook();
    expect(await screen.findByText('Boodschappen')).toBeInTheDocument();
    expect(screen.getByText('Vervoer')).toBeInTheDocument();
  });

  it('toont budgetinformatie per categorie', async () => {
    renderWithBook();
    await screen.findByText('Boodschappen');
    // Budget €300, gebruikt €45 → resterend €255
    expect(screen.getByText(/Budget: €300\.00/)).toBeInTheDocument();
    expect(screen.getByText(/Gebruikt: €45\.00/)).toBeInTheDocument();
  });

  it('maakt een nieuwe categorie aan bij geldige invoer', async () => {
    renderWithBook();
    await screen.findByText('Boodschappen');

    fireEvent.change(screen.getByPlaceholderText('Naam'), { target: { value: 'Kleding' } });
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: /categorie toevoegen/i }));

    await waitFor(() => {
      expect(catService.createCategory).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Kleding', budget: 200, budgetBookId: 'book1' })
      );
    });
  });

  it('blokkeert aanmaken zonder naam', async () => {
    renderWithBook();
    await screen.findByText('Boodschappen');

    const btn = screen.getByRole('button', { name: /categorie toevoegen/i });
    expect(btn).toBeDisabled();
  });

  it('verwijdert een categorie', async () => {
    renderWithBook();
    await screen.findByText('Boodschappen');

    const deleteButtons = screen.getAllByRole('button', { name: /verwijderen/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(catService.deleteCategory).toHaveBeenCalledWith('cat1');
    });
  });

  it('vult het formulier in bij bewerken', async () => {
    renderWithBook();
    await screen.findByText('Boodschappen');

    const editButtons = screen.getAllByRole('button', { name: /bewerken/i });
    fireEvent.click(editButtons[0]);

    expect((screen.getByPlaceholderText('Naam') as HTMLInputElement).value).toBe('Boodschappen');
    expect((screen.getByPlaceholderText('0') as HTMLInputElement).value).toBe('300');
  });

  it('slaat bewerkingen op via updateCategory', async () => {
    renderWithBook();
    await screen.findByText('Boodschappen');

    const editButtons = screen.getAllByRole('button', { name: /bewerken/i });
    fireEvent.click(editButtons[0]);

    fireEvent.change(screen.getByPlaceholderText('Naam'), { target: { value: 'Boodschappen aangepast' } });
    fireEvent.click(screen.getByRole('button', { name: /opslaan/i }));

    await waitFor(() => {
      expect(catService.updateCategory).toHaveBeenCalledWith(
        'cat1',
        expect.objectContaining({ name: 'Boodschappen aangepast' })
      );
    });
  });

  it('toont melding als er geen actief boekje is', () => {
    render(
      <AppStateContext.Provider value={{
        user: { id: 'u1', name: 'Demo' },
        activeBudgetBookId: null,
        setActiveBudgetBookId: vi.fn(),
      }}>
        <Categories />
      </AppStateContext.Provider>
    );
    expect(screen.getByText(/selecteer eerst/i)).toBeInTheDocument();
  });
});
