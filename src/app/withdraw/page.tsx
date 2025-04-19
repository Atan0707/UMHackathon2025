"use client";

import { useState } from "react";
import { CONTRACT_ADDRESS, RPC_URL } from '@/utils/config';
import { ethers } from 'ethers';
import contractAbi from '@/contracts/abi.json';

export default function Withdraw() {
  const [merchantId, setMerchantId] = useState("");
  const [merchantData, setMerchantData] = useState<{ name: string, balance: string } | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCheckBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Create provider and connect to the network
      const provider = new ethers.JsonRpcProvider(RPC_URL);

      // Get the private key from environment variable
      const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;

      if (!privateKey) {
        throw new Error("Private key not found in environment variables");
      }

      // Create a wallet with the private key
      const wallet = new ethers.Wallet(privateKey, provider);

      // Create the contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, wallet);

      // Call the shopOwners function to get merchant data
      const merchant = await contract.shopOwners(merchantId);

      // Check if merchant exists (isRegistered should be true)
      if (!merchant || !merchant.isRegistered) {
        setError("Merchant not found in the system");
        setMerchantData(null);
        return;
      }

      // Format the balance to display with 2 decimal places
      const formattedBalance = parseFloat(ethers.formatEther(merchant.tokenBalance || 0)).toFixed(2);

      // Set the merchant data including name and token balance
      setMerchantData({
        name: merchant.name,
        balance: formattedBalance
      });

      // Reset withdraw amount input
      setWithdrawAmount("");

    } catch (err) {
      console.error("Error fetching merchant data:", err);
      setError("Error fetching data. Please try again.");
      setMerchantData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsWithdrawing(true);

    try {
      const withdrawAmountValue = parseFloat(withdrawAmount);
      
      // Validate withdraw amount
      if (isNaN(withdrawAmountValue) || withdrawAmountValue <= 0) {
        setError("Please enter a valid amount to withdraw");
        setIsWithdrawing(false);
        return;
      }

      const merchantBalance = parseFloat(merchantData?.balance || "0");
      
      if (withdrawAmountValue > merchantBalance) {
        setError("Withdrawal amount exceeds available balance");
        setIsWithdrawing(false);
        return;
      }

      // Create provider and connect to the network
      const provider = new ethers.JsonRpcProvider(RPC_URL);

      // Get the private key from environment variable
      const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;

      if (!privateKey) {
        throw new Error("Private key not found in environment variables");
      }

      // Create a wallet with the private key
      const wallet = new ethers.Wallet(privateKey, provider);

      // Create the contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, wallet);

      // Convert amount to wei (tokens have 18 decimals)
      const amountInWei = ethers.parseEther(withdrawAmount);

      // Call the claimShopOwnerTokens function
      const tx = await contract.claimShopOwnerTokens(merchantId, amountInWei);
      
      // Wait for transaction to be mined
      await tx.wait();

      // Update merchant data after successful withdrawal
      const updatedMerchant = await contract.shopOwners(merchantId);
      const updatedBalance = parseFloat(ethers.formatEther(updatedMerchant.tokenBalance || 0)).toFixed(2);
      
      setMerchantData({
        name: updatedMerchant.name,
        balance: updatedBalance
      });

      setSuccess(`Successfully withdrawn ${withdrawAmount} ZKT`);
      setWithdrawAmount("");

    } catch (err) {
      console.error("Error withdrawing tokens:", err);
      setError("Transaction failed. Please try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleReset = () => {
    setMerchantData(null);
    setMerchantId("");
    setWithdrawAmount("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <h1 className="text-5xl font-extrabold text-white tracking-tight text-center mb-4">
          Merchant Withdrawal
        </h1>
        <p className="text-lg text-gray-300 text-center max-w-2xl mb-12">
          Redeem your ZKT tokens for fiat currency
        </p>

        <div className="w-full max-w-md bg-gray-800/30 backdrop-blur-md rounded-xl p-8 shadow-lg border border-gray-700/50">
          {merchantData === null ? (
            <form onSubmit={handleCheckBalance} className="space-y-6">
              <div>
                <label htmlFor="merchantId" className="block text-sm font-medium text-gray-300 mb-2">
                  Merchant ID
                </label>
                <input
                  type="text"
                  id="merchantId"
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  placeholder="Enter your merchant ID"
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
                    Checking...
                  </>
                ) : (
                  "Check Balance"
                )}
              </button>

              {error && (
                <div className="mt-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-gray-200 mb-2">
                  {merchantData.name}
                </h2>
                <p className="text-sm text-gray-400 mb-2">Merchant ID: {merchantId}</p>
                <div className="text-5xl font-bold text-emerald-400 mb-2">
                  {merchantData.balance} ZKT
                </div>
                <p className="text-sm text-gray-400">Available for withdrawal</p>
              </div>

              <form onSubmit={handleWithdraw} className="space-y-6">
                <div>
                  <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-300 mb-2">
                    Withdrawal Amount
                  </label>
                  <input
                    type="number"
                    id="withdrawAmount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount to withdraw"
                    step="0.01"
                    min="0.01"
                    max={merchantData.balance}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-100"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isWithdrawing || !withdrawAmount}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    {isWithdrawing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      "Withdraw"
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mt-3 text-emerald-400 text-sm">
                    {success}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}