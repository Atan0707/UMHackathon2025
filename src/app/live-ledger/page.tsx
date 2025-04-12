"use client";

import { formatTxHash, formatDate, Transaction } from '@/utils/transaction-history';
import { SUBGRAPH_URL, CONTRACT_ADDRESS, RPC_URL } from '@/utils/config';
import { gql, request } from 'graphql-request';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import contractAbi from '@/contracts/abi.json';

// Define types for GraphQL response
interface TokenClaimed {
  id: string;
  internal_id: string;
  amount: string;
  blockTimestamp: string;
  transactionHash: string;
}

interface TokenSpent {
  id: string;
  recipientId: string;
  shopOwnerId: string;
  amount: string;
  blockTimestamp: string;
  transactionHash: string;
}

interface ZakatDistributed {
  id: string;
  totalAmount: string;
  recipientCount: string;
  blockTimestamp: string;
  transactionHash: string;
}

interface Transfer {
  id: string;
  from: string;
  to: string;
  value: string;
  blockTimestamp: string;
  transactionHash: string;
}

interface GraphQLResponse {
  tokenClaimeds: TokenClaimed[];
  tokenSpents: TokenSpent[];
  zakatDistributeds: ZakatDistributed[];
  transfers: Transfer[];
}

// GraphQL query to fetch transactions from The Graph
const GET_TRANSACTIONS = gql`
  query GetTransactions {
    tokenClaimeds(orderBy: blockTimestamp, orderDirection: desc) {
      id
      internal_id
      amount
      blockTimestamp
      transactionHash
    }
    tokenSpents(orderBy: blockTimestamp, orderDirection: desc) {
      id
      recipientId
      shopOwnerId
      amount
      blockTimestamp
      transactionHash
    }
    zakatDistributeds(orderBy: blockTimestamp, orderDirection: desc) {
      id
      totalAmount
      recipientCount
      blockTimestamp
      transactionHash
    }
    transfers(where: {from: "0x0000000000000000000000000000000000000000"}, orderBy: blockTimestamp, orderDirection: desc) {
      id
      from
      to
      value
      blockTimestamp
      transactionHash
    }
  }
`;

export default function LiveLedger() {
  // Add state for zakat dashboard
  const [totalCollected, setTotalCollected] = useState<string>("0");
  const [totalDistributed, setTotalDistributed] = useState<string>("0");
  const [isLoadingZakat, setIsLoadingZakat] = useState<boolean>(true);
  const [errorZakat, setErrorZakat] = useState<boolean>(false);

  // Fetch dashboard data
  const fetchZakatData = async () => {
    try {
      setIsLoadingZakat(true);
      setErrorZakat(false);

      // Create provider and connect to the contract
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, provider);

      // Get distributed and undistributed amounts
      const distributed = await contract.getTotalDistributedTokens();
      const undistributed = await contract.getUndistributedTokens();

      // Calculate total collected (distributed + undistributed)
      const collected = distributed + undistributed;

      // Format values (divide by 10^18 for 18 decimals and format with 2 decimal places)
      const formattedCollected = parseFloat(ethers.formatEther(collected)).toLocaleString('en-MY',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const formattedDistributed = parseFloat(ethers.formatEther(distributed)).toLocaleString('en-MY',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      setTotalCollected(formattedCollected);
      setTotalDistributed(formattedDistributed);
    } catch (err) {
      console.error('Error fetching zakat data:', err);
      setErrorZakat(true);
    } finally {
      setIsLoadingZakat(false);
    }
  };

  // Fetch transactions using react-query with polling for real-time updates
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      console.log('Fetching transaction data from:', SUBGRAPH_URL);
      try {
        const response = await request<GraphQLResponse>(SUBGRAPH_URL, GET_TRANSACTIONS);
        console.log('GraphQL Response:', response);
        
        // Process and merge transaction data
        const allTransactions: Transaction[] = [
          // Map TokenClaimed events to Distribution transactions
          ...(response.tokenClaimeds || []).map((tx: TokenClaimed) => ({
            txHash: tx.transactionHash,
            dateTime: new Date(Number(tx.blockTimestamp) * 1000).toISOString(),
            type: 'Distribution' as const,
            from: 'ZakatContract',
            to: tx.internal_id,
            amount: (Number(tx.amount) / 1e18).toFixed(2)
          })),
          
          // Map TokenSpent events to Redemption transactions
          ...(response.tokenSpents || []).map((tx: TokenSpent) => ({
            txHash: tx.transactionHash,
            dateTime: new Date(Number(tx.blockTimestamp) * 1000).toISOString(),
            type: 'Redemption' as const,
            from: tx.recipientId,
            to: tx.shopOwnerId.startsWith('shop') ? `Merchant ${tx.shopOwnerId}` : tx.shopOwnerId,
            amount: (Number(tx.amount) / 1e18).toFixed(2)
          })),
          
          // Map ZakatDistributed events to Distribution transactions (to all recipients)
          ...(response.zakatDistributeds || []).map((tx: ZakatDistributed) => ({
            txHash: tx.transactionHash,
            dateTime: new Date(Number(tx.blockTimestamp) * 1000).toISOString(),
            type: 'Distribution' as const,
            from: 'ZakatContract',
            to: `${tx.recipientCount} Recipients`,
            amount: (Number(tx.totalAmount) / 1e18).toFixed(2)
          })),
          
          // Map Transfer events from zero address (minting) to Mint transactions
          ...(response.transfers || []).map((tx: Transfer) => ({
            txHash: tx.transactionHash,
            dateTime: new Date(Number(tx.blockTimestamp) * 1000).toISOString(),
            type: 'Mint' as const,
            from: 'Treasury',
            to: 'ZakatContract',
            amount: (Number(tx.value) / 1e18).toFixed(2)
          }))
        ];
        
        // Sort by date, newest first
        const sortedTransactions = allTransactions.sort((a, b) => 
          new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
        );
        
        console.log('Processed transactions:', sortedTransactions);
        return sortedTransactions;
      } catch (err) {
        console.error('Error fetching transaction data:', err);
        throw err;
      }
    },
    // Poll every 30 seconds for new transactions
    refetchInterval: 30000
  });
  
  // Fetch both dashboard and transaction data on mount
  useEffect(() => {
    refetch();
    fetchZakatData();
    
    // Set up interval to refresh data every 60 seconds
    const interval = setInterval(() => {
      refetch();
      fetchZakatData();
    }, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Check if we have any transactions
  const hasTransactions = data && data.length > 0;
  
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Zakat Dashboard */}
        <div className="max-w-4xl mx-auto bg-gray-200 rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Zakat Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Collected Zakat */}
            <div className="bg-gray-700 rounded-lg p-6 text-center">
              <div className="text-gray-300 mb-3">Total Zakat Collected</div>
              {isLoadingZakat ? (
                <div className="flex items-center justify-center h-14">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-400"></div>
                </div>
              ) : errorZakat ? (
                <div className="text-red-400 text-sm">Failed to load data</div>
              ) : (
                <div className="text-5xl font-bold text-emerald-400">RM {totalCollected}</div>
              )}
            </div>

            {/* Distributed Zakat */}
            <div className="bg-gray-700 rounded-lg p-6 text-center">
              <div className="text-gray-300 mb-3">Total Zakat Distribution</div>
              {isLoadingZakat ? (
                <div className="flex items-center justify-center h-14">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-400"></div>
                </div>
              ) : errorZakat ? (
                <div className="text-red-400 text-sm">Failed to load data</div>
              ) : (
                <div className="text-5xl font-bold text-emerald-400">RM {totalDistributed}</div>
              )}
            </div>
          </div>
        </div>

        <h1 className="text-5xl font-extrabold text-white tracking-tight mb-8 max-w-4xl mx-auto">
          Transaction History
        </h1>
        <div className="w-full max-w-4xl mx-auto p-8 bg-gray-800/30 backdrop-blur-md rounded-xl shadow-lg border border-gray-700/50">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 text-center py-10">
              <p>Failed to load transaction data. Please try again.</p>
              <p className="text-xs mt-2 opacity-70">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
              <button 
                onClick={() => refetch()} 
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Retry
              </button>
            </div>
          ) : !hasTransactions ? (
            <div className="text-center py-10">
              <p className="text-gray-300 mb-2">No transactions found.</p>
              <p className="text-gray-400 text-sm">
                Transactions will appear here once they are processed on the blockchain.
              </p>
              <button 
                onClick={() => refetch()} 
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Refresh
              </button>
            </div>
          ) : (
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
                  {data.map((tx, index) => (
                    <tr key={index} className={`border-b border-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800/20' : ''}`}>
                      <td className="py-4 px-3 text-gray-400 font-mono text-sm">
                        <a 
                          href={`https://sepolia.scrollscan.com/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                        >
                          {formatTxHash(tx.txHash)}
                        </a>
                      </td>
                      <td className="py-4 px-3 text-gray-400">
                        {formatDate(tx.dateTime)}
                      </td>
                      <td className="py-4 px-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          tx.type === 'Distribution' ? 'bg-green-900/40 text-green-400' : 
                          tx.type === 'Redemption' ? 'bg-purple-900/40 text-purple-400' :
                          'bg-blue-900/40 text-blue-400'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-gray-400 font-mono text-sm">
                        {tx.from === 'ZakatContract' || tx.from === 'Treasury' ? tx.from : formatTxHash(tx.from, 8)}
                      </td>
                      <td className="py-4 px-3 text-gray-400 font-mono text-sm">
                        {tx.to === 'ZakatContract' || tx.to.includes('Merchant') || tx.to.includes('Recipients') ? tx.to : formatTxHash(tx.to, 8)}
                      </td>
                      <td className="py-4 px-3 text-gray-300 font-medium">
                        {tx.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 