"use client";

import { gql, request } from 'graphql-request';
import { useQuery } from '@tanstack/react-query';
import { SUBGRAPH_URL } from '@/utils/config';
import { useEffect, useState } from 'react';

// Define types for GraphQL response
interface ZakatStatisticsResponse {
  transfers: { value: string }[];
  tokenClaimeds: { amount: string }[];
}

// GraphQL query to fetch zakat statistics
const GET_ZAKAT_STATISTICS = gql`
  query GetZakatStatistics {
    transfers(where: {from: "0x0000000000000000000000000000000000000000"}) {
      value
    }
    tokenClaimeds {
      amount
    }
  }
`;

export default function Home() {
  const [totalCollected, setTotalCollected] = useState<string>("0");
  const [totalDistributed, setTotalDistributed] = useState<string>("0");

  // Fetch zakat statistics using react-query
  const { isLoading, error, refetch } = useQuery({
    queryKey: ['zakatStatistics'],
    queryFn: async () => {
      try {
        const response = await request<ZakatStatisticsResponse>(SUBGRAPH_URL, GET_ZAKAT_STATISTICS);
        
        // Calculate total collected (sum of all minted tokens)
        const collected = response.transfers.reduce(
          (sum: number, tx: { value: string }) => sum + Number(tx.value), 0
        ) / 1e18;
        
        // Calculate total distributed (sum of all claimed tokens)
        const distributed = response.tokenClaimeds.reduce(
          (sum: number, tx: { amount: string }) => sum + Number(tx.amount), 0
        ) / 1e18;
        
        // Format numbers with commas and 2 decimal places
        setTotalCollected(collected.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        setTotalDistributed(distributed.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        
        return { collected, distributed };
      } catch (err) {
        console.error('Error fetching zakat data:', err);
        throw err;
      }
    },
    // Poll every 60 seconds for updates
    refetchInterval: 60000
  });
  
  // Fetch on component mount
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-gray-800/30 backdrop-blur-md rounded-xl p-8 shadow-lg border border-gray-700/50">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Zakat Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Collected Zakat */}
            <div className="bg-gray-900/50 rounded-lg p-6 border border-emerald-700/50">
              <div className="text-gray-400 mb-2">Total Zakat Collected</div>
              {isLoading ? (
                <div className="flex items-center justify-center h-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-400"></div>
                </div>
              ) : error ? (
                <div className="text-red-400 text-sm">Failed to load data</div>
              ) : (
                <div className="text-4xl font-bold text-emerald-400 mb-1">RM {totalCollected}</div>
              )}
            </div>
            
            {/* Distributed Zakat */}
            <div className="bg-gray-900/50 rounded-lg p-6 border border-emerald-700/50">
              <div className="text-gray-400 mb-2">Total Zakat Distribution</div>
              {isLoading ? (
                <div className="flex items-center justify-center h-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-400"></div>
                </div>
              ) : error ? (
                <div className="text-red-400 text-sm">Failed to load data</div>
              ) : (
                <div className="text-4xl font-bold text-emerald-400 mb-1">RM {totalDistributed}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
