"use client";

import transactionData from '@/data/transaction-history.json';

export interface Transaction {
  txHash: string;
  dateTime: string;
  type: 'Distribution' | 'Redemption';
  from: string;
  to: string;
  amount: string;
}

// Get all transactions
export const getAllTransactions = (): Transaction[] => {
  return transactionData as Transaction[];
};

// Format transaction hash with ellipsis
export const formatTxHash = (hash: string, length: number = 10): string => {
  if (!hash) return '';
  return `${hash.substring(0, length)}...`;
};

// Format date to a more readable format
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

// Get transactions by type
export const getTransactionsByType = (type: 'Distribution' | 'Redemption'): Transaction[] => {
  return (transactionData as Transaction[]).filter(tx => tx.type === type);
};

// Sort transactions by date (newest first)
export const getSortedTransactions = (): Transaction[] => {
  return [...(transactionData as Transaction[])].sort((a, b) => 
    new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );
}; 