"use client";

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, RPC_URL } from '@/utils/config';
import contractAbi from '@/contracts/abi.json';

export default function Home() {
  const [totalCollected, setTotalCollected] = useState<string>("0");
  const [totalDistributed, setTotalDistributed] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const fetchZakatData = async () => {
    try {
      setIsLoading(true);
      setError(false);

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
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchZakatData();

    // Set up interval to refresh data every 60 seconds
    const interval = setInterval(fetchZakatData, 60000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
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
