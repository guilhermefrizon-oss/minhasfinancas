import { useState, useEffect } from 'react';
import type { Transaction, Summary } from './types';

const STORAGE_KEY = 'minhasfinancas_transactions';

function loadTransactions(): Transaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  function addTransaction(transaction: Omit<Transaction, 'id'>): void {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };
    setTransactions((prev) => [newTransaction, ...prev]);
  }

  function removeTransaction(id: string): void {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  const summary: Summary = transactions.reduce(
    (acc, t) => {
      if (t.type === 'receita') {
        acc.income += t.amount;
      } else {
        acc.expenses += t.amount;
      }
      acc.balance = acc.income - acc.expenses;
      return acc;
    },
    { income: 0, expenses: 0, balance: 0 }
  );

  return { transactions, addTransaction, removeTransaction, summary };
}
