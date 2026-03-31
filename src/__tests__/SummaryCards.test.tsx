import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCards } from '../components/SummaryCards';

describe('SummaryCards', () => {
  it('renders income, expenses and balance', () => {
    render(
      <SummaryCards
        summary={{ income: 5000, expenses: 1500, balance: 3500 }}
      />
    );

    expect(screen.getByText('Entradas')).toBeInTheDocument();
    expect(screen.getByText('Saídas')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('formats values as BRL currency', () => {
    render(
      <SummaryCards
        summary={{ income: 5000, expenses: 1500, balance: 3500 }}
      />
    );

    expect(screen.getByText(/5\.000/)).toBeInTheDocument();
    expect(screen.getByText(/1\.500/)).toBeInTheDocument();
    expect(screen.getByText(/3\.500/)).toBeInTheDocument();
  });

  it('applies "positive" class when balance >= 0', () => {
    const { container } = render(
      <SummaryCards
        summary={{ income: 5000, expenses: 1500, balance: 3500 }}
      />
    );
    expect(container.querySelector('.card.balance.positive')).toBeTruthy();
  });

  it('applies "negative" class when balance < 0', () => {
    const { container } = render(
      <SummaryCards
        summary={{ income: 500, expenses: 1500, balance: -1000 }}
      />
    );
    expect(container.querySelector('.card.balance.negative')).toBeTruthy();
  });
});
