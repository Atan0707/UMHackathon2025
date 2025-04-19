"use client";

import { formatTxHash, formatDate } from '@/utils/transaction-history';
import { SUBGRAPH_URL, CONTRACT_ADDRESS, RPC_URL } from '@/utils/config';
import { gql, request } from 'graphql-request';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import contractAbi from '@/contracts/abi.json';
import AnimatedCounter from '@/components/AnimatedCounter';
import { motion } from 'framer-motion';

// Define the Transaction interface directly in this file
interface Transaction {
  txHash: string;
  dateTime: string;
  type: 'Pengagihan Zakat' | 'Pembelian' | 'Pembayaran Zakat' | 'Burned';
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
  const [totalRecipients, setTotalRecipients] = useState<string>("0");
  const [totalShopOwners, setTotalShopOwners] = useState<string>("0");
  const [isLoadingZakat, setIsLoadingZakat] = useState<boolean>(true);
  const [errorZakat, setErrorZakat] = useState<boolean>(false);

  // State to force counter animation to restart on data refresh
  const [animationKey, setAnimationKey] = useState(0);

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
      const recipientCount = await contract.getTotalRecipients();
      const shopOwnerCount = await contract.getTotalShopOwners();

      // Calculate total collected (distributed + undistributed)
      const collected = distributed + undistributed;

      // Format values
      const formattedCollected = parseFloat(ethers.formatUnits(collected, 4)).toLocaleString('en-MY',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const formattedDistributed = parseFloat(ethers.formatUnits(distributed, 4)).toLocaleString('en-MY',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      setTotalCollected(formattedCollected);
      setTotalDistributed(formattedDistributed);
      setTotalRecipients(recipientCount.toString());
      setTotalShopOwners(shopOwnerCount.toString());
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
                type: 'Pengagihan Zakat' as const,
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
                type: 'Pembelian' as const,
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
                type: 'Pengagihan Zakat' as const,
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
                type: 'Pembayaran Zakat' as const,
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
      // Trigger reanimation of counters by forcing a key change
      setAnimationKey(prev => prev + 1);
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
        <div className="max-w-4xl mx-auto bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 mb-10 shadow-lg">
          <motion.div
            className="flex items-center justify-center mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-500/30 mr-4"></div>
            <h2 className="text-lg font-medium text-center text-gray-300 uppercase tracking-wider">Zakat Dashboard</h2>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-500/30 ml-4"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 md:divide-x md:divide-gray-700/30">
            {/* Collected Zakat */}
            <motion.div
              className="bg-transparent text-center px-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex justify-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500/70" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Jumlah Zakat Diterima</div>
              {isLoadingZakat ? (
                <div className="flex items-center justify-center h-12">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-gray-300"></div>
                </div>
              ) : errorZakat ? (
                <div className="text-red-400 text-sm">Failed to load data</div>
              ) : (
                <AnimatedCounter
                  prefix="RM"
                  value={totalCollected}
                  key={`collected-${animationKey}`}
                  className="text-3xl font-light text-gray-100 h-12 flex justify-center items-center"
                />
              )}
            </motion.div>

            {/* Distributed Zakat */}
            <motion.div
              className="bg-transparent text-center px-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex justify-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500/70" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                </svg>
              </div>
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Jumlah Zakat Diagihkan</div>
              {isLoadingZakat ? (
                <div className="flex items-center justify-center h-12">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-gray-300"></div>
                </div>
              ) : errorZakat ? (
                <div className="text-red-400 text-sm">Failed to load data</div>
              ) : (
                <AnimatedCounter
                  prefix="RM"
                  value={totalDistributed}
                  key={`distributed-${animationKey}`}
                  className="text-3xl font-light text-gray-100 h-12 flex justify-center items-center"
                />
              )}
            </motion.div>

            {/* Burned Tokens (Redeemed by Merchants) */}
            <motion.div
              className="bg-transparent text-center px-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="flex justify-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500/70" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Jumlah wang ditebus</div>
              {isLoading ? (
                <div className="flex items-center justify-center h-12">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-gray-300"></div>
                </div>
              ) : error ? (
                <div className="text-red-400 text-sm">Failed to load data</div>
              ) : (
                <AnimatedCounter
                  prefix="RM"
                  value={totalBurned}
                  key={`burned-${animationKey}`}
                  className="text-3xl font-light text-gray-100 h-12 flex justify-center items-center"
                />
              )}
            </motion.div>

            {/* Total Recipients */}
            <motion.div
              className="bg-transparent text-center px-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="flex justify-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500/70" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Jumlah Penerima</div>
              {isLoadingZakat ? (
                <div className="flex items-center justify-center h-12">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-gray-300"></div>
                </div>
              ) : errorZakat ? (
                <div className="text-red-400 text-sm">Failed to load data</div>
              ) : (
                <AnimatedCounter
                  value={totalRecipients}
                  prefix=""
                  key={`recipients-${animationKey}`}
                  className="text-3xl font-light text-gray-100 h-12 flex justify-center items-center"
                />
              )}
            </motion.div>

            {/* Total Shop Owners */}
            <motion.div
              className="bg-transparent text-center px-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <div className="flex justify-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500/70" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </div>
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Kedai<br /> Berdaftar</div>
              {isLoadingZakat ? (
                <div className="flex items-center justify-center h-12">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-gray-300"></div>
                </div>
              ) : errorZakat ? (
                <div className="text-red-400 text-sm">Failed to load data</div>
              ) : (
                <AnimatedCounter
                  value={totalShopOwners}
                  prefix=""
                  key={`shopowners-${animationKey}`}
                  className="text-3xl font-light text-gray-100 h-12 flex justify-center items-center"
                />
              )}
            </motion.div>
          </div>
        </div>

        <motion.h1
          className="text-lg font-medium text-gray-100 mb-4 max-w-4xl mx-auto uppercase tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Rekod Transaksi
        </motion.h1>
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="py-3 px-4 text-xs font-medium text-gray-400 uppercase border-b border-gray-700">ID Transaksi</th>
                    <th className="py-3 px-4 text-xs font-medium text-gray-400 uppercase border-b border-gray-700">Tarikh & Masa</th>
                    <th className="py-3 px-4 text-xs font-medium text-gray-400 uppercase border-b border-gray-700">Jenis</th>
                    <th className="py-3 px-4 text-xs font-medium text-gray-400 uppercase border-b border-gray-700">Daripada</th>
                    <th className="py-3 px-4 text-xs font-medium text-gray-400 uppercase border-b border-gray-700">Kepada</th>
                    <th className="py-3 px-4 text-xs font-medium text-gray-400 uppercase border-b border-gray-700">Jumlah (ZKT)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((tx, index) => (
                    <tr key={index} className="border-b border-gray-700/30 hover:bg-gray-750/30">
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
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-sm ${tx.type === 'Pengagihan Zakat' ? 'text-green-300' :
                            tx.type === 'Burned' ? 'text-red-300' :
                              tx.type === 'Pembelian' ? 'text-purple-300' :
                                'text-blue-300'
                          }`}>
                          {tx.type === 'Burned' ? 'Tukar Ke Ringgit' : tx.type}
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