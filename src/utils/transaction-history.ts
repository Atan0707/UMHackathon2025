"use client";

import transactionData from '@/data/transaction-history.json';

export interface Transaction {
  txHash: string;
  dateTime: string;
  type: 'Pengagihan Zakat' | 'Redemption' | 'Pembayaran Zakat';
  from: string;
  to: string;
  amount: string;
}

// Get all transactions
export const getAllTransactions = (): Transaction[] => {
  return transactionData as Transaction[];
};

// Format transaction hash to shorter version
export const formatTxHash = (hash: string, chars: number = 6): string => {
  if (!hash || hash.length < chars * 2) return hash;
  return `${hash.substring(0, chars)}...${hash.substring(hash.length - chars)}`;
};

// Format date string to more readable format
export const formatDate = (dateTimeString: string): string => {
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-MY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateTimeString;
  }
};

// Get transactions by type
export const getTransactionsByType = (type: 'Pengagihan Zakat' | 'Redemption' | 'Pembayaran Zakat'): Transaction[] => {
  return (transactionData as Transaction[]).filter(tx => tx.type === type);
};

// Sort transactions by date (newest first)
export const getSortedTransactions = (): Transaction[] => {
  return [...(transactionData as Transaction[])].sort((a, b) => 
    new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );
}; 