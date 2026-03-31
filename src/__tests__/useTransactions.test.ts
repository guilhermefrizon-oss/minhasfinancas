import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransactions } from '../useTransactions';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock crypto.randomUUID
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

beforeEach(() => {
  localStorageMock.clear();
  uuidCounter = 0;
});

describe('useTransactions', () => {
  it('starts with empty transactions', () => {
    const { result } = renderHook(() => useTransactions());
    expect(result.current.transactions).toHaveLength(0);
  });

  it('adds a receita transaction', () => {
    const { result } = renderHook(() => useTransactions());

    act(() => {
      result.current.addTransaction({
        description: 'Salário',
        amount: 5000,
        type: 'receita',
        category: 'Salário',
        date: '2026-01-01',
      });
    });

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].description).toBe('Salário');
    expect(result.current.transactions[0].type).toBe('receita');
  });

  it('adds a despesa transaction', () => {
    const { result } = renderHook(() => useTransactions());

    act(() => {
      result.current.addTransaction({
        description: 'Aluguel',
        amount: 1200,
        type: 'despesa',
        category: 'Moradia',
        date: '2026-01-05',
      });
    });

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].type).toBe('despesa');
  });

  it('removes a transaction by id', () => {
    const { result } = renderHook(() => useTransactions());

    act(() => {
      result.current.addTransaction({
        description: 'Test',
        amount: 100,
        type: 'receita',
        category: 'Outros',
        date: '2026-01-01',
      });
    });

    const id = result.current.transactions[0].id;

    act(() => {
      result.current.removeTransaction(id);
    });

    expect(result.current.transactions).toHaveLength(0);
  });

  it('calculates summary correctly', () => {
    const { result } = renderHook(() => useTransactions());

    act(() => {
      result.current.addTransaction({
        description: 'Salário',
        amount: 5000,
        type: 'receita',
        category: 'Salário',
        date: '2026-01-01',
      });
      result.current.addTransaction({
        description: 'Aluguel',
        amount: 1500,
        type: 'despesa',
        category: 'Moradia',
        date: '2026-01-05',
      });
    });

    expect(result.current.summary.income).toBe(5000);
    expect(result.current.summary.expenses).toBe(1500);
    expect(result.current.summary.balance).toBe(3500);
  });

  it('calculates negative balance correctly', () => {
    const { result } = renderHook(() => useTransactions());

    act(() => {
      result.current.addTransaction({
        description: 'Salário',
        amount: 1000,
        type: 'receita',
        category: 'Salário',
        date: '2026-01-01',
      });
      result.current.addTransaction({
        description: 'Gasto alto',
        amount: 2000,
        type: 'despesa',
        category: 'Outros',
        date: '2026-01-05',
      });
    });

    expect(result.current.summary.balance).toBe(-1000);
  });

  it('persists transactions in localStorage', () => {
    const { result } = renderHook(() => useTransactions());

    act(() => {
      result.current.addTransaction({
        description: 'Salário',
        amount: 5000,
        type: 'receita',
        category: 'Salário',
        date: '2026-01-01',
      });
    });

    const stored = JSON.parse(
      localStorageMock.getItem('minhasfinancas_transactions') ?? '[]'
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].description).toBe('Salário');
  });

  it('assigns unique ids to transactions', () => {
    const { result } = renderHook(() => useTransactions());

    act(() => {
      result.current.addTransaction({
        description: 'Tx1',
        amount: 100,
        type: 'receita',
        category: 'Outros',
        date: '2026-01-01',
      });
      result.current.addTransaction({
        description: 'Tx2',
        amount: 200,
        type: 'despesa',
        category: 'Outros',
        date: '2026-01-02',
      });
    });

    const ids = result.current.transactions.map((t) => t.id);
    expect(new Set(ids).size).toBe(2);
  });
});
