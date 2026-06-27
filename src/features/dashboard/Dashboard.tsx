/**
 * Dashboard.tsx
 *
 * Geeft een overzicht van de huidige maand: balans, categoriestatus.
 * Leest real-time data via services — geen directe Firebase-aanroepen.
 */
import { useEffect, useMemo, useState } from 'react';
import { subscribeTransactions, Transaction } from '../../services/transactionService';
import { subscribeCategories, Category } from '../../services/categoryService';
import { useAppState } from '../../state/appState';

export function Dashboard() {
  const { activeBudgetBookId } = useAppState();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (!activeBudgetBookId) return;
    const unsubTx = subscribeTransactions(activeBudgetBookId, setTransactions);
    const unsubCat = subscribeCategories(activeBudgetBookId, setCategories);
    return () => { unsubTx(); unsubCat(); };
  }, [activeBudgetBookId]);

  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(currentMonth)),
    [transactions, currentMonth]
  );

  const totalIncome = monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  function spentForCategory(catId: string) {
    return transactions.filter((t) => t.categoryId === catId && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  }

  if (!activeBudgetBookId) {
    return (
      <div>
        <h2 className="section-title">Dashboard</h2>
        <p className="empty-text">Selecteer een huishoudboekje om het dashboard te zien.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="section-title">Dashboard — {currentMonth}</h2>

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

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Categorie status</h3>
        {categories.length === 0 && <p className="empty-text">Nog geen categorieën aangemaakt.</p>}
        <ul className="list-card">
          {categories.map((cat) => {
            const spent = spentForCategory(cat.id);
            const pct = cat.budget > 0 ? Math.min(100, (spent / cat.budget) * 100) : 0;
            const over = spent > cat.budget && cat.budget > 0;
            const near = !over && pct >= 80;
            return (
              <li key={cat.id}>
                <div className="cat-header">
                  <strong>{cat.name}</strong>
                  {over && <span className="badge badge-danger">Over budget!</span>}
                  {near && <span className="badge badge-warn">Bijna op</span>}
                </div>
                <p>€{spent.toFixed(2)} / €{cat.budget.toFixed(2)}</p>
                <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999, marginTop: 4 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: over ? '#b91c1c' : near ? '#f59e0b' : '#22c55e', borderRadius: 999 }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
