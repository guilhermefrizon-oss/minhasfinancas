export type TransactionType = 'receita' | 'despesa';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
}

export interface Summary {
  income: number;
  expenses: number;
  balance: number;
}
