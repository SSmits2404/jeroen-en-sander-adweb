/**
 * Transactions.tsx
 *
 * Toont en beheert transacties voor het actieve huishoudboekje.
 * Real-time: via subscribeTransactions werkt de lijst automatisch bij.
 * Separation of Concern: alle Firebase-logica zit in transactionService.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  subscribeTransactions,
  createTransaction,
  deleteTransaction,
  Transaction,
} from '../../services/transactionService';
import { subscribeCategories, Category } from '../../services/categoryService';
import { useAppState } from '../../state/appState';

export function Transactions() {
  const { user, activeBudgetBookId } = useAppState();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBudgetBookId) return;

    const unsubTx = subscribeTransactions(activeBudgetBookId, setTransactions);
    const unsubCat = subscribeCategories(activeBudgetBookId, setCategories);

    return () => {
      unsubTx();
      unsubCat();
    };
  }, [activeBudgetBookId]);

  const filteredTransactions = useMemo(
    () =>
      [...transactions]
        .filter((t) => t.date.startsWith(filterMonth))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, filterMonth]
  );

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  async function handleCreate() {
    const value = Number(amount);
    if (!description.trim() || !value || !user || !activeBudgetBookId) return;
    try {
      await createTransaction({
        description: description.trim(),
        amount: value,
        date: new Date().toISOString().slice(0, 10),
        type,
        categoryId: categoryId || undefined,
        budgetBookId: activeBudgetBookId,
        userId: user.id,
      });
      setDescription('');
      setAmount('');
      setCategoryId('');
    } catch {
      setError('Transactie aanmaken mislukt.');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTransaction(id);
    } catch {
      setError('Verwijderen mislukt.');
    }
  }

  if (!activeBudgetBookId) {
    return (
      <p className="empty-text">
        Selecteer eerst een huishoudboekje via het tabblad "Huishoudboekjes".
      </p>
    );
  }

  return (
    <div>
      <h2 className="section-title">Uitgaven en inkomsten</h2>
      {error && <p className="error-text">{error}</p>}

      {/* Statistieken */}
      <div className="grid grid-3">
        <div className="card stat-card income">
          <p className="stat-label">Inkomsten</p>
          <p className="stat-value">€{totalIncome.toFixed(2)}</p>
        </div>
        <div className="card stat-card expense">
          <p className="stat-label">Uitgaven</p>
          <p className="stat-value">€{totalExpense.toFixed(2)}</p>
        </div>
        <div className={`card stat-card ${balance >= 0 ? 'income' : 'expense'}`}>
          <p className="stat-label">Balans</p>
          <p className="stat-value">€{balance.toFixed(2)}</p>
        </div>
      </div>

      {/* Formulier */}
      <div className="form-row">
        <div className="input-group">
          <label htmlFor="tx-desc">Omschrijving</label>
          <input
            id="tx-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Omschrijving"
          />
        </div>
        <div className="input-group">
          <label htmlFor="tx-amount">Bedrag</label>
          <input
            id="tx-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            placeholder="0.00"
          />
        </div>
        <div className="input-group">
          <label htmlFor="tx-type">Type</label>
          <select
            id="tx-type"
            value={type}
            onChange={(e) => setType(e.target.value as 'expense' | 'income')}
          >
            <option value="expense">Uitgave</option>
            <option value="income">Inkomen</option>
          </select>
        </div>
        {categories.length > 0 && (
          <div className="input-group">
            <label htmlFor="tx-cat">Categorie</label>
            <select
              id="tx-cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">— geen —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          className="primary-button"
          type="button"
          onClick={handleCreate}
          disabled={!description.trim() || !amount}
        >
          Toevoegen
        </button>
      </div>

      {/* Maandfilter */}
      <div className="form-row">
        <div className="input-group">
          <label htmlFor="month-filter">Maand</label>
          <input
            id="month-filter"
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
        </div>
      </div>

      {/* Lijst */}
      <div className="card">
        <h3>Transacties — {filterMonth}</h3>
        {filteredTransactions.length === 0 && (
          <p className="empty-text">Geen transacties deze maand.</p>
        )}
        <ul className="list-card">
          {filteredTransactions.map((t) => {
            const cat = categories.find((c) => c.id === t.categoryId);
            return (
              <li key={t.id} className={`transaction-item ${t.type}`}>
                <div>
                  <strong>{t.description}</strong>
                  {cat && <span className="badge">{cat.name}</span>}
                  <p>
                    {t.date} • {t.type === 'expense' ? 'Uitgave' : 'Inkomen'}
                  </p>
                </div>
                <div className="amount-col">
                  <span className={`amount ${t.type}`}>
                    {t.type === 'expense' ? '-' : '+'}€{t.amount.toFixed(2)}
                  </span>
                  <button
                    className="secondary-button small"
                    type="button"
                    onClick={() => handleDelete(t.id)}
                  >
                    Verwijderen
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
