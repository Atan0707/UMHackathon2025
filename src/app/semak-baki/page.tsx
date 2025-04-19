"use client";

import { useState } from "react";
import { CONTRACT_ADDRESS, RPC_URL } from '@/utils/config';
import { ethers } from 'ethers';

// Import the ABI for the ZakatSystem contract
import contractAbi from '@/contracts/abi.json';

export default function CheckBalance() {
  const [nricNumber, setNricNumber] = useState("");
  const [recipientData, setRecipientData] = useState<{ name: string, balance: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Use the NRIC exactly as entered without removing dashes
      const formattedNric = nricNumber;

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

      // Call the recipients function to get user data
      const recipient = await contract.recipients(formattedNric);

      // Check if recipient exists (isRegistered should be true)
      if (!recipient || !recipient.isRegistered) {
        setError("Data tiada dalam rekod");
        setRecipientData(null);
        return;
      }

      // Set the recipient data including name and token amount
      setRecipientData({
        name: recipient.name,
        balance: parseFloat(ethers.formatUnits(recipient.tokenAmount || 0, 4)).toFixed(2)
      });

    } catch (err) {
      console.error("Error fetching balance:", err);
      setError("Error fetching data. Please try again.");
      setRecipientData(null);
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
          {recipientData === null ? (
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
              <h2 className="text-xl font-semibold text-gray-200 mb-2">
                {recipientData.name}
              </h2>
              <p className="text-sm text-gray-400 mb-1">NRIC: {nricNumber}</p>
              <div className="text-5xl font-bold text-emerald-400 mb-6">
                {recipientData.balance} ZKT
              </div>

              <button
                onClick={() => {
                  setRecipientData(null);
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
