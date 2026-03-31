import { useState } from 'react';
import { useTransactions } from './useTransactions';
import { SummaryCards } from './components/SummaryCards';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import './App.css';

function App() {
  const { transactions, addTransaction, removeTransaction, summary } =
    useTransactions();
  const [filter, setFilter] = useState<'all' | 'receita' | 'despesa'>('all');

  return (
    <div className="app">
      <header className="app-header">
        <h1>minhasfinanças</h1>
      </header>

      <main className="app-main">
        <SummaryCards summary={summary} />
        <TransactionForm onAdd={addTransaction} />
        <TransactionList
          transactions={transactions}
          filter={filter}
          onFilterChange={setFilter}
          onRemove={removeTransaction}
        />
      </main>
    </div>
  );
}

export default App;
