import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  budget: number;
  spent: number;
}

const demoCategories: Category[] = [
  { id: '1', name: 'Boodschappen', budget: 400, spent: 235 },
  { id: '2', name: 'Vervoer', budget: 150, spent: 160 }
];

export function Categories() {
  const [categories, setCategories] = useState<Category[]>(demoCategories);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');

  function addCategory() {
    const budgetValue = Number(budget);
    if (!name.trim() || Number.isNaN(budgetValue) || budgetValue < 0) return;

    setCategories((current) => [
      ...current,
      { id: crypto.randomUUID(), name: name.trim(), budget: budgetValue, spent: 0 }
    ]);
    setName('');
    setBudget('');
  }

  return (
    <div>
      <h2 className="section-title">Categorieën</h2>
      <div className="form-row">
        <div className="input-group">
          <label>Naam categorie</label>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Naam" />
        </div>
        <div className="input-group">
          <label>Budget</label>
          <input value={budget} onChange={(event) => setBudget(event.target.value)} type="number" placeholder="0" />
        </div>
        <button className="primary-button" type="button" onClick={addCategory}>
          Categorie toevoegen
        </button>
      </div>

      <div className="card">
        <h3>Overzicht categorieën</h3>
        <ul className="list-card">
          {categories.map((category) => {
            const percentage = category.budget ? Math.min(100, (category.spent / category.budget) * 100) : 0;
            return (
              <li key={category.id}>
                <strong>{category.name}</strong>
                <p>Budget: €{category.budget.toFixed(2)} • Besteed: €{category.spent.toFixed(2)}</p>
                <div style={{ marginTop: 8, height: 10, width: '100%', background: '#e5e7eb', borderRadius: 999 }}>
                  <div style={{ width: `${percentage}%`, height: '100%', background: category.spent > category.budget ? '#b91c1c' : '#22c55e', borderRadius: 999 }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
