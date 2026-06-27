import { render, screen, fireEvent } from '@testing-library/react';
import { Transactions } from '../Transactions';

describe('Transactions', () => {
  it('renders the transaction form and list', () => {
    render(<Transactions />);
    expect(screen.getByText('Uitgaven en inkomsten')).toBeInTheDocument();
    expect(screen.getByText('Transacties')).toBeInTheDocument();
  });

  it('adds a new transaction when valid data is entered', () => {
    render(<Transactions />);
    fireEvent.change(screen.getByPlaceholderText('Omschrijving'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '25.50' } });
    fireEvent.click(screen.getByRole('button', { name: /toevoegen/i }));
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
