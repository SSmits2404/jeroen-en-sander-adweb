import { ReactNode } from 'react';

interface Section {
  id: string;
  label: string;
}

interface AppShellProps {
  sections: Section[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  user: { name: string } | null;
  children: ReactNode;
}

export function AppShell({ sections, activeSection, onSectionChange, user, children }: AppShellProps) {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>Huishoudboekje</h1>
          <p>Beheer je uitgaven, categorieën en boekjes.</p>
        </div>
        <div>{user ? <span>Ingelogd als {user.name}</span> : <span>Niet ingelogd</span>}</div>
      </header>

      <nav className="nav-list" aria-label="Hoofdsecties">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`nav-button ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => onSectionChange(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <section className="page-section">{children}</section>
    </main>
  );
}
