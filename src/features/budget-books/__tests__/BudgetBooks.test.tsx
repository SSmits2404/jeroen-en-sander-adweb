import { render, screen, fireEvent } from '@testing-library/react';
import { BudgetBooks } from '../BudgetBooks';

describe('BudgetBooks', () => {
  it('shows active and archived boekjes', () => {
    render(<BudgetBooks />);
    expect(screen.getByText('Actieve boekjes')).toBeInTheDocument();
    expect(screen.getByText('Gearchiveerde boekjes')).toBeInTheDocument();
  });

  it('adds a new boekje when naam is provided', () => {
    render(<BudgetBooks />);
    fireEvent.change(screen.getByPlaceholderText('Naam huishoudboekje'), { target: { value: 'Testboekje' } });
    fireEvent.change(screen.getByPlaceholderText('Omschrijving'), { target: { value: 'Demo' } });
    fireEvent.click(screen.getByRole('button', { name: /boekje toevoegen/i }));
    expect(screen.getByText('Testboekje')).toBeInTheDocument();
  });
});
