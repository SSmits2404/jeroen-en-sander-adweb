/**
 * Categories.tsx
 *
 * Toont categorieën met budget-voortgangsbalk.
 * Real-time: subscribeCategories + subscribeTransactions voor live budgetstatus.
 * Separation of Concern: geen directe Firestore-calls, alles via services.
 */
import { useEffect, useState } from 'react';
import {
  subscribeCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  Category,
} from '../../services/categoryService';
import { subscribeTransactions, Transaction } from '../../services/transactionService';
import { useAppState } from '../../state/appState';
import { ActiveBookBadge } from '../../components/ActiveBookBadge';

export function Categories() {
  const { activeBudgetBookId } = useAppState();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBudgetBookId) return;
    const unsubCat = subscribeCategories(activeBudgetBookId, setCategories);
    const unsubTx = subscribeTransactions(activeBudgetBookId, setTransactions);
    return () => {
      unsubCat();
      unsubTx();
    };
  }, [activeBudgetBookId]);

  function spentForCategory(catId: string): number {
    return transactions
      .filter((t) => t.categoryId === catId)
      .reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : -t.amount), 0);
  }

  function resetForm() {
    setEditId(null);
    setName('');
    setBudget('');
    setEndDate('');
  }

  async function handleSubmit() {
    const budgetValue = Number(budget);

    if (!name.trim() || budget.trim() === '' || Number.isNaN(budgetValue) || !activeBudgetBookId) {
      return;
    }

    try {
      setError(null);

      const payload = {
        name: name.trim(),
        budget: budgetValue,
        budgetBookId: activeBudgetBookId,
        ...(endDate ? { endDate } : {}),
      };

      if (editId) {
        await updateCategory(editId, payload);
        setEditId(null);
      } else {
        await createCategory(payload);
      }

      resetForm();
    } catch {
      setError('Opslaan mislukt.');
    }
  }

  function startEdit(cat: Category) {
    setEditId(cat.id);
    setName(cat.name);
    setBudget(String(cat.budget));
    setEndDate(cat.endDate ?? '');
  }

  async function handleDelete(id: string) {
    try {
      await deleteCategory(id);
    } catch {
      setError('Verwijderen mislukt.');
    }
  }

  if (!activeBudgetBookId) {
    return <p className="empty-text">Selecteer eerst een huishoudboekje.</p>;
  }

  return (
    <div>
      <h2 className="section-title">Categorieën</h2>
      <ActiveBookBadge />
      {error && <p className="error-text">{error}</p>}

      <div className="form-row">
        <div className="input-group">
          <label htmlFor="cat-name">Naam categorie</label>
          <input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Naam"
          />
        </div>
        <div className="input-group">
          <label htmlFor="cat-budget">Max budget (€)</label>
          <input
            id="cat-budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            type="number"
            placeholder="0"
          />
        </div>
        <div className="input-group">
          <label htmlFor="cat-end">Einddatum (optioneel)</label>
          <input
            id="cat-end"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            type="date"
          />
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim() || budget.trim() === ''}
        >
          {editId ? 'Opslaan' : 'Categorie toevoegen'}
        </button>
        {editId && (
          <button
            className="secondary-button"
            type="button"
            onClick={resetForm}
          >
            Annuleren
          </button>
        )}
      </div>

      <div className="card">
        <h3>Overzicht categorieën</h3>
        {categories.length === 0 && <p className="empty-text">Nog geen categorieën.</p>}
        <ul className="list-card">
          {categories.map((cat) => {
            const used = spentForCategory(cat.id);
            const remaining = cat.budget - used;
            const percentage = cat.budget > 0 ? Math.min(100, (Math.max(used, 0) / cat.budget) * 100) : 0;
            const overBudget = used > cat.budget;
            const nearLimit = !overBudget && cat.budget > 0 && used / cat.budget > 0.9;
            const barColor = overBudget ? '#b91c1c' : nearLimit ? '#f59e0b' : '#22c55e';

            return (
              <li key={cat.id}>
                <div className="cat-header">
                  <strong>{cat.name}</strong>
                  {overBudget && <span className="badge badge-danger">Over budget!</span>}
                  {nearLimit && <span className="badge badge-warn">Budget bijna op</span>}
                </div>
                <p>
                  Budget: €{cat.budget.toFixed(2)} • Gebruikt: €{used.toFixed(2)} • Resterend: €{remaining.toFixed(2)}
                  {cat.endDate && ` • Tot: ${cat.endDate}`}
                </p>
                <div style={{ marginTop: 8, height: 10, width: '100%', background: '#e5e7eb', borderRadius: 999 }}>
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: barColor,
                      borderRadius: 999,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <div className="button-row" style={{ marginTop: 8 }}>
                  <button className="secondary-button small" type="button" onClick={() => startEdit(cat)}>
                    Bewerken
                  </button>
                  <button className="secondary-button small danger" type="button" onClick={() => handleDelete(cat.id)}>
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