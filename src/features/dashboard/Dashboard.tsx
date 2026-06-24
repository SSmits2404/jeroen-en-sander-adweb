export function Dashboard() {
  return (
    <div>
      <h2 className="section-title">Dashboard</h2>
      <div className="grid grid-2">
        <div className="card">
          <h3>Maandoverzicht</h3>
          <p>Bekijk de huidige balans en snelle statistieken voor inkomsten en uitgaven.</p>
        </div>
        <div className="card">
          <h3>Categorie status</h3>
          <p>Controleer budgeten, waarschuwingen en budgetoverschrijdingen.</p>
        </div>
      </div>
    </div>
  );
}
