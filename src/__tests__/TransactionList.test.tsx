import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionList } from '../components/TransactionList';
import type { Transaction } from '../types';

const transactions: Transaction[] = [
  {
    id: '1',
    description: 'Salário',
    amount: 5000,
    type: 'receita',
    category: 'Salário',
    date: '2026-01-01',
  },
  {
    id: '2',
    description: 'Aluguel',
    amount: 1500,
    type: 'despesa',
    category: 'Moradia',
    date: '2026-01-05',
  },
];

describe('TransactionList', () => {
  it('renders all transactions when filter is "all"', () => {
    render(
      <TransactionList
        transactions={transactions}
        filter="all"
        onFilterChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText('Salário')).toBeInTheDocument();
    expect(screen.getByText('Aluguel')).toBeInTheDocument();
  });

  it('filters to show only receitas', () => {
    render(
      <TransactionList
        transactions={transactions}
        filter="receita"
        onFilterChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText('Salário')).toBeInTheDocument();
    expect(screen.queryByText('Aluguel')).not.toBeInTheDocument();
  });

  it('filters to show only despesas', () => {
    render(
      <TransactionList
        transactions={transactions}
        filter="despesa"
        onFilterChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.queryByText('Salário')).not.toBeInTheDocument();
    expect(screen.getByText('Aluguel')).toBeInTheDocument();
  });

  it('shows empty message when no transactions match filter', () => {
    render(
      <TransactionList
        transactions={[]}
        filter="all"
        onFilterChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText('Nenhuma transação encontrada.')).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', async () => {
    const onRemove = vi.fn();
    render(
      <TransactionList
        transactions={transactions}
        filter="all"
        onFilterChange={vi.fn()}
        onRemove={onRemove}
      />
    );

    const removeButtons = screen.getAllByRole('button', { name: /Remover/i });
    await userEvent.click(removeButtons[0]);
    expect(onRemove).toHaveBeenCalledWith('1');
  });

  it('calls onFilterChange when filter buttons are clicked', async () => {
    const onFilterChange = vi.fn();
    render(
      <TransactionList
        transactions={transactions}
        filter="all"
        onFilterChange={onFilterChange}
        onRemove={vi.fn()}
      />
    );

    await userEvent.click(screen.getByText('Receitas'));
    expect(onFilterChange).toHaveBeenCalledWith('receita');
  });
});
