import type { Summary } from '../types';
import './SummaryCards.css';

interface SummaryCardsProps {
  summary: Summary;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const balanceClass = summary.balance >= 0 ? 'positive' : 'negative';

  return (
    <div className="summary-cards">
      <div className="card income">
        <div className="card-header">
          <span>Entradas</span>
          <span className="card-icon">↑</span>
        </div>
        <strong>{formatCurrency(summary.income)}</strong>
      </div>

      <div className="card expenses">
        <div className="card-header">
          <span>Saídas</span>
          <span className="card-icon">↓</span>
        </div>
        <strong>{formatCurrency(summary.expenses)}</strong>
      </div>

      <div className={`card balance ${balanceClass}`}>
        <div className="card-header">
          <span>Total</span>
          <span className="card-icon">$</span>
        </div>
        <strong>{formatCurrency(summary.balance)}</strong>
      </div>
    </div>
  );
}
