import { useState, type FormEvent } from 'react';
import type { Transaction, TransactionType } from '../types';
import './TransactionForm.css';

const CATEGORIES: Record<TransactionType, string[]> = {
  receita: ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Outros'],
  despesa: [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Educação',
    'Lazer',
    'Vestuário',
    'Outros',
  ],
};

interface TransactionFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
}

export function TransactionForm({ onAdd }: TransactionFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('despesa');
  const [category, setCategory] = useState(CATEGORIES.despesa[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  function handleTypeChange(newType: TransactionType) {
    setType(newType);
    setCategory(CATEGORIES[newType][0]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAdd({
      description: description.trim(),
      amount: parsedAmount,
      type,
      category,
      date,
    });

    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory(CATEGORIES[type][0]);
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <h2>Nova Transação</h2>

      <div className="type-toggle">
        <button
          type="button"
          className={type === 'receita' ? 'active income' : ''}
          onClick={() => handleTypeChange('receita')}
        >
          ↑ Receita
        </button>
        <button
          type="button"
          className={type === 'despesa' ? 'active expenses' : ''}
          onClick={() => handleTypeChange('despesa')}
        >
          ↓ Despesa
        </button>
      </div>

      <div className="form-group">
        <label htmlFor="description">Descrição</label>
        <input
          id="description"
          type="text"
          placeholder="Ex: Salário, Aluguel..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="amount">Valor (R$)</label>
          <input
            id="amount"
            type="number"
            placeholder="0,00"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Data</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="category">Categoria</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES[type].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="submit-btn">
        Adicionar Transação
      </button>
    </form>
  );
}
