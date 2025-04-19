"use client";

import { formatTxHash, formatDate } from '@/utils/transaction-history';
import { SUBGRAPH_URL, CONTRACT_ADDRESS, RPC_URL } from '@/utils/config';
import { gql, request } from 'graphql-request';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import contractAbi from '@/contracts/abi.json';

// Define the Transaction interface directly in this file
interface Transaction {
  txHash: string;
  dateTime: string;
  type: 'Distribution' | 'Payment' | 'Mint' | 'Burned';
  from: string;
  to: string;
  amount: string;
}

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

interface RecipientAdded {
  internal_id: string;
  name: string;
}

interface ShopOwnerAdded {
  internal_id: string;
  name: string;
}

interface GraphQLResponse {
  tokenClaimeds: TokenClaimed[];
  tokenSpents: TokenSpent[];
  zakatDistributeds: ZakatDistributed[];
  transfers: Transfer[];
  recipientAddeds: RecipientAdded[];
  shopOwnerAddeds: ShopOwnerAdded[];
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
    recipientAddeds: recipientAddeds(first: 1000) {
      internal_id
      name
    }
    shopOwnerAddeds: shopOwnerAddeds(first: 1000) {
      internal_id
      name
    }
  }
`;

// Separate query for burned tokens
const GET_BURNED_TOKENS = gql`
  query GetBurnedTokens {
    transfers(where: {to: "0x0000000000000000000000000000000000000000"}, orderBy: blockTimestamp, orderDirection: desc) {
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
  const [totalBurned, setTotalBurned] = useState<string>("0");
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
      const formattedCollected = parseFloat(ethers.formatUnits(collected, 4)).toLocaleString('en-MY',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const formattedDistributed = parseFloat(ethers.formatUnits(distributed, 4)).toLocaleString('en-MY',
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
        // Fetch main transaction data
        const response = await request<GraphQLResponse>(SUBGRAPH_URL, GET_TRANSACTIONS);
        console.log('GraphQL Response:', response);

        // Fetch burned tokens separately
        let burnedTokens: Transfer[] = [];
        try {
          const burnedResponse = await request<{ transfers: Transfer[] }>(SUBGRAPH_URL, GET_BURNED_TOKENS);
          burnedTokens = burnedResponse.transfers || [];

          // Calculate total burned tokens with a safer approach
          let burnedTokensTotal = 0;
          if (Array.isArray(burnedTokens)) {
            for (const tx of burnedTokens) {
              if (tx && typeof tx === 'object' && 'value' in tx) {
                try {
                  const value = Number(tx.value);
                  if (!isNaN(value)) {
                    burnedTokensTotal += value;
                  }
                } catch (e) {
                  console.warn('Error parsing token value:', e);
                }
              }
            }
          }

          const formattedBurned = (burnedTokensTotal / 1e4).toLocaleString('en-MY',
            { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          setTotalBurned(formattedBurned);
        } catch (err) {
          console.error('Error fetching burned tokens:', err);
          setTotalBurned("0.00");
          // Continue with empty burnedTokens array
          burnedTokens = [];
        }

        // Process and merge transaction data
        let processedTxHashes = new Set<string>();

        // Ensure we have valid arrays for our lookups
        const recipientAddeds = response.recipientAddeds || [];
        const shopOwnerAddeds = response.shopOwnerAddeds || [];

        // First process burned tokens so they take priority
        const burnedTransactions: Transaction[] = Array.isArray(burnedTokens)
          ? burnedTokens
            .filter(tx => tx && typeof tx === 'object' && 'transactionHash' in tx)
            .map((tx: Transfer): Transaction => {
              // Add the tx hash to processed set
              if (tx.transactionHash) {
                processedTxHashes.add(tx.transactionHash);
              }

              // Try to find the shop owner name from shopOwnerAddeds (the from address)
              let fromDisplay = tx.from || '';
              const shopOwner = shopOwnerAddeds.find(s =>
                s.internal_id.toLowerCase() === fromDisplay.toLowerCase() ||
                CONTRACT_ADDRESS.toLowerCase() === fromDisplay.toLowerCase()
              );

              if (shopOwner) {
                fromDisplay = shopOwner.name;
              } else if (fromDisplay === CONTRACT_ADDRESS) {
                fromDisplay = 'ZakatContract';
              } else {
                fromDisplay = formatTxHash(fromDisplay, 8);
              }

              return {
                txHash: tx.transactionHash || '',
                dateTime: tx.blockTimestamp ? new Date(Number(tx.blockTimestamp) * 1000).toISOString() : new Date().toISOString(),
                type: 'Burned',
                from: fromDisplay,
                to: 'Lembaga Zakat',
                amount: tx.value ? (Number(tx.value) / 1e4).toFixed(2) : '0.00'
              };
            })
          : [];

        // Process other transaction types, skipping those with hash already in processedTxHashes
        const allTransactions: Transaction[] = [
          // Map TokenClaimed events to Distribution transactions
          ...(response.tokenClaimeds || [])
            .filter(tx => !processedTxHashes.has(tx.transactionHash))
            .map((tx: TokenClaimed) => {
              processedTxHashes.add(tx.transactionHash);

              // For privacy, always display "Penerima" for recipients
              const toDisplay = "Penerima";

              return {
                txHash: tx.transactionHash,
                dateTime: new Date(Number(tx.blockTimestamp) * 1000).toISOString(),
                type: 'Distribution' as const,
                from: 'ZakatContract',
                to: toDisplay,
                amount: (Number(tx.amount) / 1e4).toFixed(2)
              };
            }),

          // Map TokenSpent events to Payment transactions
          ...(response.tokenSpents || [])
            .filter(tx => !processedTxHashes.has(tx.transactionHash))
            .map((tx: TokenSpent) => {
              processedTxHashes.add(tx.transactionHash);

              // For privacy, always display "Penerima" for recipients
              const fromDisplay = "Penerima";

              // Try to find the shop owner name from shopOwnerAddeds
              let toDisplay = tx.shopOwnerId;
              const shopOwner = shopOwnerAddeds.find(s => s.internal_id === tx.shopOwnerId);
              if (shopOwner) {
                toDisplay = shopOwner.name;
              } else if (tx.shopOwnerId.startsWith('shop')) {
                toDisplay = `Merchant ${tx.shopOwnerId.replace('shop', '')}`;
              } else if (tx.shopOwnerId.match(/^0x[0-9a-f]{40}$/i)) {
                toDisplay = formatTxHash(tx.shopOwnerId, 8);
              }

              return {
                txHash: tx.transactionHash,
                dateTime: new Date(Number(tx.blockTimestamp) * 1000).toISOString(),
                type: 'Payment' as const,
                from: fromDisplay,
                to: toDisplay,
                amount: (Number(tx.amount) / 1e4).toFixed(2)
              };
            }),

          // Map ZakatDistributed events to Distribution transactions (to all recipients)
          ...(response.zakatDistributeds || [])
            .filter(tx => !processedTxHashes.has(tx.transactionHash))
            .map((tx: ZakatDistributed) => {
              processedTxHashes.add(tx.transactionHash);
              return {
                txHash: tx.transactionHash,
                dateTime: new Date(Number(tx.blockTimestamp) * 1000).toISOString(),
                type: 'Distribution' as const,
                from: 'ZakatContract',
                to: 'Penerima',
                amount: (Number(tx.totalAmount) / 1e4).toFixed(2)
              };
            }),

          // Map Transfer events from zero address (minting) to Mint transactions
          ...(response.transfers || [])
            .filter(tx => !processedTxHashes.has(tx.transactionHash))
            .map((tx: Transfer) => {
              processedTxHashes.add(tx.transactionHash);
              return {
                txHash: tx.transactionHash,
                dateTime: new Date(Number(tx.blockTimestamp) * 1000).toISOString(),
                type: 'Mint' as const,
                from: 'Lembaga Zakat',
                to: 'ZakatContract',
                amount: (Number(tx.value) / 1e4).toFixed(2)
              };
            }),

          // Add the burned transactions first
          ...burnedTransactions
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
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Zakat Dashboard */}
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg p-6 mb-10">
          <h2 className="text-xl font-medium text-center text-gray-100 mb-6">Zakat Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Collected Zakat */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 text-center">
              <div className="text-gray-400 text-sm mb-2">Jumlah Zakat Diterima</div>
              {isLoadingZakat ? (
                <div className="flex items-center justify-center h-12">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-gray-300"></div>
                </div>
              ) : errorZakat ? (
                <div className="text-red-400 text-sm">Failed to load data</div>
              ) : (
                <div className="text-3xl font-medium text-gray-100">RM {totalCollected}</div>
              )}
            </div>

            {/* Distributed Zakat */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 text-center">
              <div className="text-gray-400 text-sm mb-2">Jumlah Zakat Diagihkan</div>
              {isLoadingZakat ? (
                <div className="flex items-center justify-center h-12">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-gray-300"></div>
                </div>
              ) : errorZakat ? (
                <div className="text-red-400 text-sm">Failed to load data</div>
              ) : (
                <div className="text-3xl font-medium text-gray-100">RM {totalDistributed}</div>
              )}
            </div>

            {/* Burned Tokens (Redeemed by Merchants) */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 text-center">
              <div className="text-gray-400 text-sm mb-2">Jumlah Token Dituntut</div>
              {isLoading ? (
                <div className="flex items-center justify-center h-12">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-gray-300"></div>
                </div>
              ) : error ? (
                <div className="text-red-400 text-sm">Failed to load data</div>
              ) : (
                <div className="text-3xl font-medium text-gray-100">RM {totalBurned}</div>
              )}
            </div>
          </div>
        </div>

        <h1 className="text-xl font-medium text-gray-100 mb-4 max-w-4xl mx-auto">
          Rekod Transaksi
        </h1>
        <div className="w-full max-w-4xl mx-auto bg-gray-800 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-600 border-t-gray-300"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 text-center py-10">
              <p>Failed to load transaction data.</p>
              <p className="text-xs mt-2 opacity-70">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm"
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
                className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="py-3 px-4 text-xs font-medium text-gray-400 uppercase">ID Transaksi</th>
                    <th className="py-3 px-4 text-xs font-medium text-gray-400 uppercase">Tarikh & Masa</th>
                    <th className="py-3 px-4 text-xs font-medium text-gray-400 uppercase">Jenis</th>
                    <th className="py-3 px-4 text-xs font-medium text-gray-400 uppercase">Daripada</th>
                    <th className="py-3 px-4 text-xs font-medium text-gray-400 uppercase">Kepada</th>
                    <th className="py-3 px-4 text-xs font-medium text-gray-400 uppercase">Jumlah (ZKT)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((tx, index) => (
                    <tr key={index} className={`border-t border-gray-700 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700`}>
                      <td className="py-3 px-4 text-gray-300 font-mono text-xs">
                        <a
                          href={`https://sepolia.scrollscan.com/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {formatTxHash(tx.txHash)}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">
                        {formatDate(tx.dateTime)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${tx.type === 'Distribution' ? 'bg-green-900 text-green-300' :
                          tx.type === 'Burned' ? 'bg-red-900 text-red-300' :
                            tx.type === 'Payment' ? 'bg-purple-900 text-purple-300' :
                              'bg-blue-900 text-blue-300'
                          }`}>
                          {tx.type === 'Burned' ? 'CONVERT TO FIAT' : tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300 font-mono">
                        {tx.from === 'ZakatContract' || tx.from === 'Lembaga Zakat' || tx.from === 'Penerima' ? tx.from : formatTxHash(tx.from, 8)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300 font-mono">
                        {tx.to === 'ZakatContract' || tx.to === 'Lembaga Zakat' || tx.to === 'Burned' || tx.to.includes('Merchant') || tx.to === 'Penerima' ? tx.to : formatTxHash(tx.to, 8)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-100 font-medium">
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