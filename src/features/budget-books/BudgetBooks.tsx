/**
 * BudgetBooks.tsx
 *
 * Component dat huishoudboekjes toont en beheert.
 * Separation of Concern:
 * - Dit component weet NIETS van Firestore — het roept alleen de service aan.
 * - Real-time: via subscribeBudgetBooks (onSnapshot) werkt de lijst automatisch bij.
 */
import { useEffect, useState } from 'react';
import {
  subscribeBudgetBooks,
  createBudgetBook,
  archiveBudgetBook,
  restoreBudgetBook,
  BudgetBook,
} from '../../services/budgetBookService';
import { useAppState } from '../../state/appState';

export function BudgetBooks() {
  const { user, activeBudgetBookId, setActiveBudgetBookId } = useAppState();
  const [budgetBooks, setBudgetBooks] = useState<BudgetBook[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription — cleanup in return van useEffect
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubscribe = subscribeBudgetBooks(user.id, (books) => {
      setBudgetBooks(books);
      setLoading(false);
    });

    // Cleanup: verwijder de Firebase listener als het component unmount
    return () => unsubscribe();
  }, [user]);

  const activeBooks = budgetBooks.filter((b) => !b.archived);
  const archivedBooks = budgetBooks.filter((b) => b.archived);

  async function handleCreate() {
    if (!name.trim() || !user) return;
    try {
      await createBudgetBook(name.trim(), description.trim(), user.id);
      setName('');
      setDescription('');
    } catch {
      setError('Kon boekje niet aanmaken. Probeer opnieuw.');
    }
  }

  async function handleArchive(id: string) {
    try {
      await archiveBudgetBook(id);
      if (activeBudgetBookId === id) setActiveBudgetBookId(null);
    } catch {
      setError('Archiveren mislukt.');
    }
  }

  async function handleRestore(id: string) {
    try {
      await restoreBudgetBook(id);
    } catch {
      setError('Herstellen mislukt.');
    }
  }

  if (loading) return <p>Laden…</p>;

  return (
    <div>
      <h2 className="section-title">Huishoudboekjes</h2>

      {error && <p className="error-text">{error}</p>}

      <div className="form-row">
        <div className="input-group">
          <label htmlFor="bb-name">Naam</label>
          <input
            id="bb-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Naam huishoudboekje"
          />
        </div>
        <div className="input-group">
          <label htmlFor="bb-desc">Omschrijving</label>
          <input
            id="bb-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Omschrijving"
          />
        </div>
        <button className="primary-button" type="button" onClick={handleCreate} disabled={!name.trim()}>
          Boekje toevoegen
        </button>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Actieve boekjes</h3>
          {activeBooks.length === 0 && <p className="empty-text">Geen actieve boekjes.</p>}
          <ul className="list-card">
            {activeBooks.map((book) => (
              <li key={book.id} className={activeBudgetBookId === book.id ? 'active-book' : ''}>
                <strong>{book.name}</strong>
                {book.description && <p>{book.description}</p>}
                <div className="button-row">
                  <button
                    className="primary-button small"
                    type="button"
                    onClick={() => setActiveBudgetBookId(book.id)}
                    disabled={activeBudgetBookId === book.id}
                  >
                    {activeBudgetBookId === book.id ? '✓ Geselecteerd' : 'Selecteren'}
                  </button>
                  <button className="secondary-button small" type="button" onClick={() => handleArchive(book.id)}>
                    Archiveren
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3>Gearchiveerde boekjes</h3>
          {archivedBooks.length === 0 && <p className="empty-text">Geen gearchiveerde boekjes.</p>}
          <ul className="list-card">
            {archivedBooks.map((book) => (
              <li key={book.id}>
                <strong>{book.name}</strong>
                {book.description && <p>{book.description}</p>}
                <button className="secondary-button small" type="button" onClick={() => handleRestore(book.id)}>
                  Herstellen
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
