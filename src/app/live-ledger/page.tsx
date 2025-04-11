"use client";

import { getAllTransactions, formatTxHash, formatDate } from '@/utils/transaction-history';

export default function LiveLedger() {
  const transactions = getAllTransactions();
  
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-extrabold text-white tracking-tight mb-8 max-w-4xl mx-auto">
          Transaction History
        </h1>
        <div className="w-full max-w-4xl mx-auto p-8 bg-gray-800/30 backdrop-blur-md rounded-xl shadow-lg border border-gray-700/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-4 px-3 text-gray-300 font-semibold">Tx Hash</th>
                  <th className="py-4 px-3 text-gray-300 font-semibold">Date and Time</th>
                  <th className="py-4 px-3 text-gray-300 font-semibold">Type</th>
                  <th className="py-4 px-3 text-gray-300 font-semibold">From</th>
                  <th className="py-4 px-3 text-gray-300 font-semibold">To</th>
                  <th className="py-4 px-3 text-gray-300 font-semibold">Amount (ZKT)</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <tr key={index} className={`border-b border-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800/20' : ''}`}>
                    <td className="py-4 px-3 text-gray-400 font-mono text-sm">
                      {formatTxHash(tx.txHash)}
                    </td>
                    <td className="py-4 px-3 text-gray-400">
                      {formatDate(tx.dateTime)}
                    </td>
                    <td className="py-4 px-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        tx.type === 'Distribution' ? 'bg-green-900/40 text-green-400' : 'bg-purple-900/40 text-purple-400'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-gray-400 font-mono text-sm">
                      {tx.from === 'ZakatContract' ? tx.from : formatTxHash(tx.from, 8)}
                    </td>
                    <td className="py-4 px-3 text-gray-400 font-mono text-sm">
                      {tx.to === 'ZakatContract' || tx.to.startsWith('Merchant') ? tx.to : formatTxHash(tx.to, 8)}
                    </td>
                    <td className="py-4 px-3 text-gray-300 font-medium">
                      {tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 