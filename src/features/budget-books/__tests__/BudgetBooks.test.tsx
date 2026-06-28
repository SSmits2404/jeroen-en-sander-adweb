/**
 * BudgetBooks.test.tsx
 *
 * Test de happy flows van het BudgetBooks component.
 * Firebase wordt gemockt zodat de test geen echte netwerkverbinding nodig heeft.
 * Separation of Concern maakt dit eenvoudig: we mocken alleen de service-laag.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetBooks } from '../BudgetBooks';
import * as budgetBookService from '../../../services/budgetBookService';
import { AppStateProvider } from '../../../state/appState';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// BINNEN src/features/budget-books/__tests__/BudgetBooks.test.tsx

vi.mock('../../../services/firebase', () => ({
  auth: {},
  firestore: {},
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Simuleer direct een ingelogde gebruiker 'demo-user'
    callback({ 
      uid: 'demo-user', 
      displayName: 'Demo gebruiker',
      email: 'demo@voorbeeld.nl'
    });
    return vi.fn();
  }),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
}));

// Mock de volledige service-module
vi.mock('../../../services/budgetBookService', () => ({
  subscribeBudgetBooks: vi.fn(),
  createBudgetBook: vi.fn(),
  archiveBudgetBook: vi.fn(),
  restoreBudgetBook: vi.fn(),
}));

const mockBooks = [
  { id: '1', name: 'Gezin', description: 'Familie', ownerId: 'demo-user', memberIds: ['demo-user'], archived: false },
  { id: '2', name: 'Vakantie', description: 'Zomer', ownerId: 'demo-user', memberIds: ['demo-user'], archived: true },
];

// BINNEN src/features/budget-books/__tests__/BudgetBooks.test.tsx

function renderWithProvider() {
  // Voeg deze mockImplementation toe zodat de component de mockBooks laadt!
  vi.mocked(budgetBookService.subscribeBudgetBooks).mockImplementation((_userId, cb) => {
    cb(mockBooks);
    return vi.fn(); // geeft een lege unsubscribe functie terug
  });

  // Zorg ook dat de mutatie-functies netjes resolved worden
  vi.mocked(budgetBookService.createBudgetBook).mockResolvedValue({ id: 'new-id' } as any);
  vi.mocked(budgetBookService.archiveBudgetBook).mockResolvedValue();
  vi.mocked(budgetBookService.restoreBudgetBook).mockResolvedValue();

  return render(
    <AppStateProvider>
      <BudgetBooks />
    </AppStateProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

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
