/**
 * BudgetBooks.tsx
 *
 * Component dat huishoudboekjes toont en beheert.
 * Separation of Concern:
 * - Dit component weet niets van Firestore — het roept alleen de service aan.
 * - Real-time: via subscribeBudgetBooksForUser (onSnapshot) werkt de lijst automatisch bij.
 */
import { useEffect, useState } from 'react';
import {
  createBudgetBook,
  updateBudgetBook,
  archiveBudgetBook,
  restoreBudgetBook,
  BudgetBook,
} from '../../services/budgetBookService';
import { subscribeBudgetBooksForUser } from '../../services/inviteService';
import { useAppState } from '../../state/appState';
import { useMemberProfiles } from '../../hooks/useMemberProfiles';
import { MembersPanel } from './MembersPanel';

export function BudgetBooks() {
  const { user, activeBudgetBookId, setActiveBudgetBookId } = useAppState();
  const [budgetBooks, setBudgetBooks] = useState<BudgetBook[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedMembersId, setExpandedMembersId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = subscribeBudgetBooksForUser(user.id, (books) => {
      setBudgetBooks(books);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Haal eigenaar-profielen op voor alle boekjes (voor de "van"-regel op de kaart)
  const ownerIds = [...new Set(budgetBooks.map((b) => b.ownerId))];
  const ownerProfiles = useMemberProfiles(ownerIds);

  const activeBooks = budgetBooks.filter((b) => !b.archived);
  const archivedBooks = budgetBooks.filter((b) => b.archived);

  function resetForm() {
    setEditId(null);
    setName('');
    setDescription('');
  }

  async function handleSubmit() {
    if (!name.trim() || !user) return;
    try {
      setError(null);
      if (editId) {
        await updateBudgetBook(editId, { name: name.trim(), description: description.trim() });
      } else {
        await createBudgetBook(name.trim(), description.trim(), user.id);
      }
      resetForm();
    } catch {
      setError('Kon boekje niet opslaan. Probeer opnieuw.');
    }
  }

  function startEdit(book: BudgetBook) {
    setEditId(book.id);
    setName(book.name);
    setDescription(book.description);
  }

  async function handleArchive(id: string) {
    try {
      setError(null);
      await archiveBudgetBook(id);
      if (activeBudgetBookId === id) setActiveBudgetBookId(null);
      if (editId === id) resetForm();
    } catch {
      setError('Archiveren mislukt.');
    }
  }

  async function handleRestore(id: string) {
    try {
      setError(null);
      await restoreBudgetBook(id);
    } catch {
      setError('Herstellen mislukt.');
    }
  }

  function toggleMembers(bookId: string) {
    setExpandedMembersId((prev) => (prev === bookId ? null : bookId));
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
        <button className="primary-button" type="button" onClick={handleSubmit} disabled={!name.trim()}>
          {editId ? 'Opslaan' : 'Boekje toevoegen'}
        </button>
        {editId && (
          <button className="secondary-button" type="button" onClick={resetForm}>
            Annuleren
          </button>
        )}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Actieve boekjes</h3>
          {activeBooks.length === 0 && <p className="empty-text">Geen actieve boekjes.</p>}
          <ul className="list-card">
            {activeBooks.map((book) => {
              const isOwnBook = book.ownerId === user?.id;
              const ownerProfile = ownerProfiles.get(book.ownerId);
              const ownerName = isOwnBook
                ? 'Jouw boekje'
                : `Van ${ownerProfile?.displayName ?? '…'}`;
              const memberCount = (book.memberIds ?? []).length;
              const isActive = activeBudgetBookId === book.id;

              return (
                <li key={book.id} className={isActive ? 'active-book' : ''}>
                  <div className="book-header">
                    <div className="book-title-block">
                      <strong className="book-name">{book.name}</strong>
                      <span className={`book-owner-tag ${isOwnBook ? 'book-owner-tag--own' : 'book-owner-tag--other'}`}>
                        {ownerName}
                      </span>
                    </div>
                    {memberCount > 0 && (
                      <span className="book-member-count" title={`${memberCount} deelnemer${memberCount !== 1 ? 's' : ''}`}>
                        👥 {memberCount}
                      </span>
                    )}
                  </div>

                  {book.description && (
                    <p className="book-description">{book.description}</p>
                  )}

                  <div className="button-row">
                    <button
                      className="primary-button small"
                      type="button"
                      onClick={() => setActiveBudgetBookId(isActive ? null : book.id)}
                    >
                      {isActive ? 'Deselecteren' : 'Selecteren'}
                    </button>

                    {isOwnBook && (
                      <>
                        <button
                          className="secondary-button small"
                          type="button"
                          onClick={() => startEdit(book)}
                        >
                          Bewerken
                        </button>
                        <button
                          className="secondary-button small"
                          type="button"
                          onClick={() => handleArchive(book.id)}
                        >
                          Archiveren
                        </button>
                      </>
                    )}

                    <button
                      className="secondary-button small"
                      type="button"
                      onClick={() => toggleMembers(book.id)}
                      aria-expanded={expandedMembersId === book.id}
                    >
                      {expandedMembersId === book.id ? 'Verbergen' : '👥 Deelnemers'}
                    </button>
                  </div>

                  {expandedMembersId === book.id && <MembersPanel book={book} />}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card">
          <h3>Gearchiveerde boekjes</h3>
          {archivedBooks.length === 0 && <p className="empty-text">Geen gearchiveerde boekjes.</p>}
          <ul className="list-card">
            {archivedBooks.map((book) => {
              const isOwnBook = book.ownerId === user?.id;
              const ownerProfile = ownerProfiles.get(book.ownerId);
              const ownerName = isOwnBook
                ? 'Jouw boekje'
                : `Van ${ownerProfile?.displayName ?? '…'}`;
              return (
                <li key={book.id}>
                  <div className="book-header">
                    <div className="book-title-block">
                      <strong className="book-name">{book.name}</strong>
                      <span className={`book-owner-tag ${isOwnBook ? 'book-owner-tag--own' : 'book-owner-tag--other'}`}>
                        {ownerName}
                      </span>
                    </div>
                  </div>
                  {book.description && <p className="book-description">{book.description}</p>}
                  {isOwnBook && (
                    <button
                      className="secondary-button small"
                      type="button"
                      onClick={() => handleRestore(book.id)}
                      style={{ marginTop: '8px' }}
                    >
                      Herstellen
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
