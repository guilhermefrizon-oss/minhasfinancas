import type { Transaction } from '../types';
import './TransactionList.css';

interface TransactionListProps {
  transactions: Transaction[];
  filter: 'all' | 'receita' | 'despesa';
  onFilterChange: (filter: 'all' | 'receita' | 'despesa') => void;
  onRemove: (id: string) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function TransactionList({
  transactions,
  filter,
  onFilterChange,
  onRemove,
}: TransactionListProps) {
  const filtered =
    filter === 'all'
      ? transactions
      : transactions.filter((t) => t.type === filter);

  return (
    <div className="transaction-list">
      <div className="list-header">
        <h2>Transações</h2>
        <div className="filter-tabs">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => onFilterChange('all')}
          >
            Todas
          </button>
          <button
            className={filter === 'receita' ? 'active income' : ''}
            onClick={() => onFilterChange('receita')}
          >
            Receitas
          </button>
          <button
            className={filter === 'despesa' ? 'active expenses' : ''}
            onClick={() => onFilterChange('despesa')}
          >
            Despesas
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-message">Nenhuma transação encontrada.</p>
      ) : (
        <ul className="transactions">
          {filtered.map((t) => (
            <li key={t.id} className={`transaction-item ${t.type}`}>
              <div className="transaction-info">
                <strong>{t.description}</strong>
                <span className="transaction-meta">
                  {t.category} · {formatDate(t.date)}
                </span>
              </div>
              <div className="transaction-right">
                <span className="transaction-amount">
                  {t.type === 'receita' ? '+' : '-'} {formatCurrency(t.amount)}
                </span>
                <button
                  className="remove-btn"
                  onClick={() => onRemove(t.id)}
                  aria-label="Remover transação"
                  title="Remover"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
