"use client";

import { useState } from "react";
import { gql, request } from 'graphql-request';
import { SUBGRAPH_URL } from '@/utils/config';

// GraphQL query to fetch recipient balance data
const GET_RECIPIENT_BALANCE = gql`
  query GetRecipientBalance($recipientId: String!) {
    recipient(id: $recipientId) {
      id
      balance
      totalClaimed
    }
  }
`;

interface RecipientBalanceResponse {
  recipient: {
    id: string;
    balance: string;
    totalClaimed: string;
  } | null;
}

export default function CheckBalance() {
  const [nricNumber, setNricNumber] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [totalClaimed, setTotalClaimed] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Format the NRIC as recipient ID (assumes format like "recipient-123456789012")
    const recipientId = `recipient-${nricNumber.replace(/[-\s]/g, '')}`;
    
    try {
      // Query The Graph for recipient data
      const response = await request<RecipientBalanceResponse>(
        SUBGRAPH_URL,
        GET_RECIPIENT_BALANCE,
        { recipientId }
      );
      
      // Check if recipient exists
      if (!response.recipient) {
        setError("Data tiada dalam rekod");
        setBalance(null);
        setTotalClaimed(null);
        return;
      }
      
      // Convert balance from wei to ZKT (assuming 18 decimals)
      const balanceInZKT = Number(response.recipient.balance) / 1e18;
      const claimedInZKT = Number(response.recipient.totalClaimed) / 1e18;
      
      setBalance(balanceInZKT);
      setTotalClaimed(claimedInZKT);
    } catch (err) {
      console.error("Error fetching balance:", err);
      setError("Data tiada dalam rekod");
      setBalance(null);
      setTotalClaimed(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <h1 className="text-5xl font-extrabold text-white tracking-tight text-center mb-4">
          Semak Baki
        </h1>
        <p className="text-lg text-gray-300 text-center max-w-2xl mb-12">
          Masukkan NRIC untuk semak baki zakat anda
        </p>
        
        <div className="w-full max-w-md bg-gray-800/30 backdrop-blur-md rounded-xl p-8 shadow-lg border border-gray-700/50">
          {balance === null ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="nric" className="block text-sm font-medium text-gray-300 mb-2">
                  Nombor Kad Pengenalan
                </label>
                <input
                  type="text"
                  id="nric"
                  value={nricNumber}
                  onChange={(e) => setNricNumber(e.target.value)}
                  placeholder="Masukkan nombor kad pengenalan"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-100"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyemak...
                  </>
                ) : (
                  "Semak Baki"
                )}
              </button>
              
              {error && (
                <div className="mt-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </form>
          ) : (
            <div className="text-center py-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-2">Balance for NRIC: {nricNumber}</h2>
              <div className="text-5xl font-bold text-emerald-400 mb-4">{balance.toLocaleString()} ZKT</div>
              
              {totalClaimed !== null && totalClaimed > 0 && (
                <div className="mb-6">
                  <p className="text-gray-400 text-sm">Total Claimed</p>
                  <p className="text-lg text-emerald-300">{totalClaimed.toLocaleString()} ZKT</p>
                </div>
              )}
              
              <button
                onClick={() => {
                  setBalance(null);
                  setTotalClaimed(null);
                  setNricNumber("");
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Check Another
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
