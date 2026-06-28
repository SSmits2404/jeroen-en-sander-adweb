/**
 * BudgetBooks.test.tsx
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetBooks } from '../BudgetBooks';
import * as budgetBookService from '../../../services/budgetBookService';
import { AppStateProvider } from '../../../state/appState';

const mockBooks = [
  { id: '1', name: 'Gezin', description: 'Familie', ownerId: 'demo-user', memberIds: ['demo-user'], archived: false },
  { id: '2', name: 'Vakantie', description: 'Zomer', ownerId: 'demo-user', memberIds: ['demo-user'], archived: true },
];

// 1. Mock de service-module direct met de werkende callback-implementatie bovenin!
vi.mock('../../../services/budgetBookService', () => ({
  subscribeBudgetBooks: vi.fn((_uid, cb) => {
    cb([
      { id: '1', name: 'Gezin', description: 'Familie', ownerId: 'demo-user', memberIds: ['demo-user'], archived: false },
      { id: '2', name: 'Vakantie', description: 'Zomer', ownerId: 'demo-user', memberIds: ['demo-user'], archived: true },
    ]);
    return vi.fn(); // unsubscribe-functie
  }),
  createBudgetBook: vi.fn(() => Promise.resolve()),
  archiveBudgetBook: vi.fn(() => Promise.resolve()),
  restoreBudgetBook: vi.fn(() => Promise.resolve()),
}));

function renderWithProvider() {
  return render(
    <AppStateProvider>
      <BudgetBooks />
    </AppStateProvider>
  );
}

beforeEach(() => {
  // 2. Clear alleen de call-historie, behoud de mock-implementaties hierboven
  vi.clearAllMocks();
});

// ... de rest van je describe('BudgetBooks', () => { ... }) blijft exact hetzelfde
describe('BudgetBooks', () => {
  it('toont actieve en gearchiveerde boekjes', async () => {
    renderWithProvider();
    expect(await screen.findByText('Gezin')).toBeInTheDocument();
    expect(screen.getByText('Vakantie')).toBeInTheDocument();
    expect(screen.getByText('Actieve boekjes')).toBeInTheDocument();
    expect(screen.getByText('Gearchiveerde boekjes')).toBeInTheDocument();
  });

  it('maakt een nieuw boekje aan bij geldige naam', async () => {
    renderWithProvider();
    await screen.findByText('Gezin');

    fireEvent.change(screen.getByPlaceholderText('Naam huishoudboekje'), { target: { value: 'Nieuw boekje' } });
    fireEvent.change(screen.getByPlaceholderText('Omschrijving'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /boekje toevoegen/i }));

    await waitFor(() => {
      expect(budgetBookService.createBudgetBook).toHaveBeenCalledWith('Nieuw boekje', 'Test', 'demo-user');
    });
  });

  it('maakt geen boekje aan bij lege naam', async () => {
    renderWithProvider();
    await screen.findByText('Gezin');

    const btn = screen.getByRole('button', { name: /boekje toevoegen/i });
    expect(btn).toBeDisabled();
  });

  it('archiveert een actief boekje', async () => {
    renderWithProvider();
    await screen.findByText('Gezin');

    fireEvent.click(screen.getByRole('button', { name: /archiveren/i }));

    await waitFor(() => {
      expect(budgetBookService.archiveBudgetBook).toHaveBeenCalledWith('1');
    });
  });

  it('herstelt een gearchiveerd boekje', async () => {
    renderWithProvider();
    await screen.findByText('Vakantie');

    fireEvent.click(screen.getByRole('button', { name: /herstellen/i }));

    await waitFor(() => {
      expect(budgetBookService.restoreBudgetBook).toHaveBeenCalledWith('2');
    });
  });
});
