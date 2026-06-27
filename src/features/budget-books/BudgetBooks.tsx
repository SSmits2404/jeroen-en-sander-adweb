import { useState } from 'react';

interface BudgetBook {
  id: string;
  name: string;
  description: string;
  archived: boolean;
}

const demoBooks: BudgetBook[] = [
  { id: '1', name: 'Gezin', description: 'Huishoudboekje voor het gezin', archived: false },
  { id: '2', name: 'Vakantie', description: 'Vakantiebudget', archived: true }
];

export function BudgetBooks() {
  const [budgetBooks, setBudgetBooks] = useState<BudgetBook[]>(demoBooks);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const activeBooks = budgetBooks.filter((book) => !book.archived);
  const archivedBooks = budgetBooks.filter((book) => book.archived);

  function createBook() {
    if (!name.trim()) return;
    setBudgetBooks((current) => [
      ...current,
      { id: crypto.randomUUID(), name: name.trim(), description: description.trim(), archived: false }
    ]);
    setName('');
    setDescription('');
  }

  function archiveBook(id: string) {
    setBudgetBooks((current) => current.map((book) => (book.id === id ? { ...book, archived: true } : book)));
  }

  function restoreBook(id: string) {
    setBudgetBooks((current) => current.map((book) => (book.id === id ? { ...book, archived: false } : book)));
  }

  return (
    <div>
      <h2 className="section-title">Huishoudboekjes</h2>
      <div className="form-row">
        <div className="input-group">
          <label>Naam</label>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Naam huishoudboekje" />
        </div>
        <div className="input-group">
          <label>Omschrijving</label>
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Omschrijving" />
        </div>
        <button className="primary-button" type="button" onClick={createBook}>
          Boekje toevoegen
        </button>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Actieve boekjes</h3>
          <ul className="list-card">
            {activeBooks.map((book) => (
              <li key={book.id}>
                <strong>{book.name}</strong>
                <p>{book.description}</p>
                <button className="secondary-button" type="button" onClick={() => archiveBook(book.id)}>
                  Archiveren
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3>Gearchiveerde boekjes</h3>
          <ul className="list-card">
            {archivedBooks.map((book) => (
              <li key={book.id}>
                <strong>{book.name}</strong>
                <p>{book.description}</p>
                <button className="secondary-button" type="button" onClick={() => restoreBook(book.id)}>
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
