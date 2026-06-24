import { useMemo, useState } from 'react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
}

const demoTransactions: Transaction[] = [
  { id: '1', description: 'Boodschappen', amount: 42.5, date: '2026-06-18', type: 'expense' },
  { id: '2', description: 'Salaris', amount: 2400, date: '2026-06-25', type: 'income' }
];

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(demoTransactions);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');

  const orderedTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  function createTransaction() {
    const value = Number(amount);
    if (!description.trim() || Number.isNaN(value) || value === 0) return;

    setTransactions((current) => [
      { id: crypto.randomUUID(), description: description.trim(), amount: value, date: new Date().toISOString().slice(0, 10), type },
      ...current
    ]);
    setDescription('');
    setAmount('');
  }

  function removeTransaction(id: string) {
    setTransactions((current) => current.filter((transaction) => transaction.id !== id));
  }

  return (
    <div>
      <h2 className="section-title">Uitgaven en inkomsten</h2>
      <div className="form-row">
        <div className="input-group">
          <label>Omschrijving</label>
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Omschrijving" />
        </div>
        <div className="input-group">
          <label>Bedrag</label>
          <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" placeholder="0.00" />
        </div>
        <div className="input-group">
          <label>Type</label>
          <select value={type} onChange={(event) => setType(event.target.value as 'expense' | 'income')}>
            <option value="expense">Uitgave</option>
            <option value="income">Inkomen</option>
          </select>
        </div>
        <button className="primary-button" type="button" onClick={createTransaction}>
          Toevoegen
        </button>
      </div>

      <div className="card">
        <h3>Transacties</h3>
        <ul className="list-card">
          {orderedTransactions.map((transaction) => (
            <li key={transaction.id}>
              <strong>{transaction.description}</strong>
              <p>{transaction.date} • {transaction.type === 'expense' ? 'Uitgave' : 'Inkomen'} • €{transaction.amount.toFixed(2)}</p>
              <button className="secondary-button" type="button" onClick={() => removeTransaction(transaction.id)}>
                Verwijderen
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
