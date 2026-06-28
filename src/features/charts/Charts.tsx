/**
 * Charts.tsx
 *
 * Nice-2-have Story 2.4: visuele weergave van de balans.
 * - Lijngrafiek: inkomsten vs. uitgaven per maand (laatste 6 maanden)
 * - Staafdiagram: totale uitgaven per categorie
 *
 * Separation of Concern: geen directe Firebase-aanroepen, alles via services.
 * Real-time: subscribeTransactions + subscribeCategories via onSnapshot.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { subscribeTransactions, Transaction } from '../../services/transactionService';
import { subscribeCategories, Category } from '../../services/categoryService';
import { useAppState } from '../../state/appState';

// ─── helpers ────────────────────────────────────────────────────────────────

function lastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i+1, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

/** Kort label voor de X-as: "jun" ipv "2026-06". */
function shortMonth(ym: string): string {
  const [year, month] = ym.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString('nl-NL', { month: 'short' });
}

function euroFormatter(value: number) {
  return `€${value.toFixed(2)}`;
}

// ─── component ───────────────────────────────────────────────────────────────

export function Charts() {
  const { activeBudgetBookId } = useAppState();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!activeBudgetBookId) return;
    const unsubTx = subscribeTransactions(activeBudgetBookId, setTransactions);
    const unsubCat = subscribeCategories(activeBudgetBookId, setCategories);
    return () => {
      unsubTx();
      unsubCat();
    };
  }, [activeBudgetBookId]);

  // ── lijngrafiek: inkomsten + uitgaven per maand ──────────────────────────
  const months = useMemo(() => lastNMonths(6), []);

  const lineData = useMemo(
    () =>
      months.map((ym) => {
        const monthTx = transactions.filter((t) => t.date.startsWith(ym));
        const income = monthTx
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + t.amount, 0);
        const expense = monthTx
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + t.amount, 0);
        return { month: shortMonth(ym), income, expense, balans: income - expense };
      }),
    [transactions, months]
  );

  // ── staafdiagram: uitgaven per categorie ────────────────────────────────
  const barData = useMemo(
    () =>
      categories
        .map((cat) => ({
          name: cat.name,
          uitgaven: transactions
            .filter((t) => t.categoryId === cat.id && t.type === 'expense')
            .reduce((s, t) => s + t.amount, 0),
          budget: cat.budget,
        }))
        .filter((d) => d.uitgaven > 0 || d.budget > 0),
    [transactions, categories]
  );

  // ─── guards ───────────────────────────────────────────────────────────────

  if (!activeBudgetBookId) {
    return (
      <p className="empty-text">
        Selecteer eerst een huishoudboekje via het tabblad &quot;Huishoudboekjes&quot;.
      </p>
    );
  }

  const noData = transactions.length === 0;

  return (
    <div>
      <h2 className="section-title">Grafieken</h2>

      {noData && (
        <p className="empty-text" style={{ marginBottom: 16 }}>
          Nog geen transacties — voeg uitgaven of inkomsten toe om grafieken te zien.
        </p>
      )}

      {/* ── Lijngrafiek ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Inkomsten en uitgaven — laatste 6 maanden</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={lineData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 13 }} />
            <YAxis tickFormatter={(v) => `€${v}`} tick={{ fontSize: 12 }} width={64} />
            <Tooltip formatter={euroFormatter} />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              name="Inkomsten"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Uitgaven"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="balans"
              name="Balans"
              stroke="#1d4ed8"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Staafdiagram ── */}
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Uitgaven per categorie</h3>
        {barData.length === 0 ? (
          <p className="empty-text">
            Koppel transacties aan categorieën om dit diagram te vullen.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `€${v}`} tick={{ fontSize: 12 }} width={64} />
              <Tooltip formatter={euroFormatter} />
              <Legend />
              <Bar dataKey="uitgaven" name="Uitgaven" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="budget" name="Budget" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
