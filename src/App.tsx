import { useState } from 'react';
import { AppShell } from './components/AppShell';
import { AuthScreen } from './features/auth/AuthScreen';
import { Dashboard } from './features/dashboard/Dashboard';
import { BudgetBooks } from './features/budget-books/BudgetBooks';
import { Categories } from './features/categories/Categories';
import { Transactions } from './features/transactions/Transactions';
import { signOutUser } from './services/authService';
import { useAppState, AppStateProvider } from './state/appState';

const sections = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'budget-books', label: 'Huishoudboekjes' },
  { id: 'transactions', label: 'Uitgaven' },
  { id: 'categories', label: 'Categorieën' },
];

function AppContent() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { user, authReady } = useAppState();

  async function handleLogout() {
    await signOutUser();
    setActiveSection('dashboard');
  }

  if (!authReady) {
    return (
      <main className="app-shell">
        <section className="page-section">
          <p>Laden…</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <AppShell
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      user={user}
      onLogout={handleLogout}
    >
      {activeSection === 'dashboard' && <Dashboard />}
      {activeSection === 'budget-books' && <BudgetBooks />}
      {activeSection === 'transactions' && <Transactions />}
      {activeSection === 'categories' && <Categories />}
    </AppShell>
  );
}

function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

export default App;