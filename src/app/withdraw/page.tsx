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
  const [txHash, setTxHash] = useState("");
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [processingStage, setProcessingStage] = useState<"initial" | "processing" | "completed">("initial");
  const [processProgress, setProcessProgress] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    merchantId: string;
    merchantName: string;
    amount: string;
    date: string;
    txHash: string;
    reference: string;
  } | null>(null);

  const handleCheckBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    setTxHash("");

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
      const formattedBalance = parseFloat(ethers.formatUnits(merchant.tokenBalance || 0, 4)).toFixed(2);

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
    setTxHash("");
    setShowCompletionMessage(false);
    setIsWithdrawing(true);
    setProcessingStage("processing");
    setShowReceipt(false);

    // Start progress animation
    setProcessProgress(0);
    const progressInterval = setInterval(() => {
      setProcessProgress(prev => {
        const newValue = prev + Math.random() * 5;
        return newValue > 90 ? 90 : newValue; // Keep under 90% until completion
      });
    }, 300);

    try {
      const withdrawAmountValue = parseFloat(withdrawAmount);

      // Validate withdraw amount
      if (isNaN(withdrawAmountValue) || withdrawAmountValue <= 0) {
        setError("Please enter a valid amount to withdraw");
        setIsWithdrawing(false);
        setProcessingStage("initial");
        clearInterval(progressInterval);
        return;
      }

      const merchantBalance = parseFloat(merchantData?.balance || "0");

      if (withdrawAmountValue > merchantBalance) {
        setError("Withdrawal amount exceeds available balance");
        setIsWithdrawing(false);
        setProcessingStage("initial");
        clearInterval(progressInterval);
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

      // Convert amount to wei (tokens have 4 decimals)
      const amountInWei = ethers.parseUnits(withdrawAmount, 4);

      // Call the claimShopOwnerTokens function
      const tx = await contract.claimShopOwnerTokens(merchantId, amountInWei);

      // Store transaction hash
      setTxHash(tx.hash);

      // Wait for transaction to be mined
      await tx.wait();

      // Set progress to 100% and complete processing
      setProcessProgress(100);
      setProcessingStage("completed");

      // Update merchant data after successful withdrawal
      const updatedMerchant = await contract.shopOwners(merchantId);
      const updatedBalance = parseFloat(ethers.formatUnits(updatedMerchant.tokenBalance || 0, 4)).toFixed(2);

      setMerchantData({
        name: updatedMerchant.name,
        balance: updatedBalance
      });

      // Generate receipt data
      const currentDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Generate a unique reference number
      const reference = `ZKT-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
      
      setReceiptData({
        merchantId,
        merchantName: merchantData.name,
        amount: withdrawAmount,
        date: currentDate,
        txHash: tx.hash,
        reference
      });

      setSuccess(`Successfully withdrawn ${withdrawAmount} ZKT`);
      setWithdrawAmount("");
      setShowCompletionMessage(true);

    } catch (err) {
      console.error("Error withdrawing tokens:", err);
      setError("Transaction failed. Please try again.");
      setProcessingStage("initial");
    } finally {
      clearInterval(progressInterval);
      setIsWithdrawing(false);
    }
  };

  const handleReset = () => {
    setMerchantData(null);
    setMerchantId("");
    setWithdrawAmount("");
    setError("");
    setSuccess("");
    setTxHash("");
    setShowCompletionMessage(false);
    setProcessingStage("initial");
  };

  const printReceipt = () => {
    window.print();
  };

  const handleViewReceipt = () => {
    setShowReceipt(true);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes slideRightProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        .progress-animate {
          transition: width 0.5s ease;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-bounce {
          animation: bounce 1s ease infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-modal, .receipt-modal * {
            visibility: visible;
          }
          .receipt-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <h1 className="text-5xl font-extrabold text-white tracking-tight text-center mb-4">
            Merchant Withdrawal
          </h1>
          <p className="text-lg text-gray-300 text-center max-w-2xl mb-12">
            Tukar Ke Ringgit token ZKT anda
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
                      <span className="animate-pulse">Checking...</span>
                    </>
                  ) : (
                    "Check Balance"
                  )}
                </button>

                {error && (
                  <div className="mt-3 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm animate-fade-in">
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
                  <div className="text-5xl font-bold text-emerald-400 mb-2 transition-all duration-500 animate-fade-in">
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
                          <span className="animate-pulse">Processing...</span>
                        </>
                      ) : (
                        "Withdraw"
                      )}
                    </button>
                  </div>

                  {error && (
                    <div className="mt-3 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm animate-fade-in">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mt-3 p-4 bg-emerald-900/30 border border-emerald-800 rounded-lg text-emerald-400 text-sm animate-fade-in">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>{success}</span>
                      </div>

                      {txHash && (
                        <div className="mb-2 overflow-hidden">
                          <p className="text-xs text-gray-400 mb-1">Transaction Hash:</p>
                          <div className="flex items-center">
                            <p className="text-xs bg-gray-800 p-2 rounded overflow-x-auto mr-2">{txHash.slice(0, 10)}...{txHash.slice(-8)}</p>
                            <a
                              href={`https://sepolia.scrollscan.com/tx/${txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-blue-900/50 text-blue-400 px-2 py-1 rounded hover:bg-blue-800/50 transition-colors flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              View
                            </a>
                          </div>
                        </div>
                      )}

                      {showCompletionMessage && (
                        <div className="mt-3 text-sm border-t border-emerald-800 pt-3 animate-fade-in">
                          <p className="font-medium">We have received your withdrawal request.</p>
                          <p className="mt-1 text-gray-300">The funds will be credited to your bank account within seven (7) working days.</p>
                          <button
                            onClick={handleViewReceipt}
                            className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm"
                          >
                            View Receipt
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Processing Modal Overlay */}
        {processingStage === "processing" && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl max-w-md w-full border border-gray-700">
              <div className="flex flex-col items-center">
                <div className="mb-4">
                  <svg className="animate-spin h-16 w-16 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Processing Withdrawal</h3>
                <p className="text-gray-300 text-center mb-4">Your withdrawal request is being processed on the blockchain</p>

                {txHash && (
                  <div className="text-xs text-gray-400 mt-2 bg-gray-900/50 p-3 rounded w-full mb-4">
                    <p className="font-medium mb-1">Transaction Hash:</p>
                    <div className="flex items-center">
                      <p className="truncate text-emerald-400 mr-2">{txHash}</p>
                      <a
                        href={`https://sepolia.scrollscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-800 transition-colors"
                      >
                        View on Explorer
                      </a>
                    </div>
                  </div>
                )}

                <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full progress-animate"
                    style={{ width: `${processProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completed Modal Overlay */}
        {processingStage === "completed" && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl max-w-md w-full border border-gray-700">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-emerald-900/50 rounded-full flex items-center justify-center mb-4 animate-bounce">
                  <svg className="h-12 w-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Withdrawal Successful!</h3>
                <p className="text-gray-300 text-center mb-2">Your withdrawal of {withdrawAmount} ZKT has been processed</p>
                <p className="text-gray-400 text-center text-sm mb-4">Funds will be credited to your bank account within 7 days</p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setProcessingStage("initial")}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Done
                  </button>
                  <button
                    onClick={handleViewReceipt}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceipt && receiptData && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white text-black p-8 rounded-lg shadow-2xl max-w-md w-full receipt-modal">
              <div className="flex flex-col">
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-emerald-600">ZKT Receipt</h2>
                    <button onClick={handleCloseReceipt} className="text-gray-400 hover:text-gray-600 no-print">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">Withdrawal Confirmation</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Merchant ID:</span>
                    <span className="font-medium">{receiptData.merchantId}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Merchant Name:</span>
                    <span className="font-medium">{receiptData.merchantName}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Reference No:</span>
                    <span className="font-medium">{receiptData.reference}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Date & Time:</span>
                    <span className="font-medium">{receiptData.date}</span>
                  </div>
                </div>
                
                <div className="bg-gray-100 p-4 rounded-lg mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Amount Withdrawn:</span>
                    <span className="font-bold text-lg">{receiptData.amount} ZKT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-emerald-600 font-medium">Completed</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
                  <p className="text-xs bg-gray-100 p-2 rounded overflow-hidden break-all">
                    {receiptData.txHash}
                  </p>
                  <div className="mt-1 text-xs">
                    <a 
                      href={`https://sepolia.scrollscan.com/tx/${receiptData.txHash}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline no-print"
                    >
                      View on Scroll Explorer
                    </a>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 text-sm text-gray-500">
                  <p>Funds will be credited to your bank account within 7 working days.</p>
                  <p className="mt-2">For any inquiries, please contact support@zkt.finance</p>
                </div>
                
                <button 
                  onClick={printReceipt} 
                  className="mt-6 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors no-print flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}