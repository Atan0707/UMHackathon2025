"use client";

import { useState } from "react";

export default function CheckBalance() {
  const [nricNumber, setNricNumber] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      //random balance
      const mockBalance = parseFloat((Math.random() * 5000).toFixed(2));
      setBalance(mockBalance);
    } catch (err) {
      setError("Failed to fetch balance. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <h1 className="text-5xl font-extrabold text-white tracking-tight text-center mb-4">
          Check Balance
        </h1>
        <p className="text-lg text-gray-300 text-center max-w-2xl mb-12">
          Enter your NRIC number to check your Zakat balance 
        </p>
        
        <div className="w-full max-w-md bg-gray-800/30 backdrop-blur-md rounded-xl p-8 shadow-lg border border-gray-700/50">
          {balance === null ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="nric" className="block text-sm font-medium text-gray-300 mb-2">
                  NRIC Number
                </label>
                <input
                  type="text"
                  id="nric"
                  value={nricNumber}
                  onChange={(e) => setNricNumber(e.target.value)}
                  placeholder="Enter your NRIC number"
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
                  "Check"
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
              <div className="text-5xl font-bold text-emerald-400 mb-6">{balance.toLocaleString()} ZKT</div>
              
              <button
                onClick={() => {
                  setBalance(null);
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
