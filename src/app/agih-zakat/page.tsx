"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ethers, Eip1193Provider } from 'ethers';
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { CONTRACT_ADDRESS, RPC_URL } from '@/utils/config';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import contractAbi from '@/contracts/abi.json';



const AgihZakat = () => {
  const { address: currentUserAddress } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [contractStats, setContractStats] = useState({
    totalRecipients: 0,
    totalShopOwners: 0,
    undistributedTokens: '0',
    isDistributed: false,
    totalDistributed: '0'
  });

  // Recipient form state
  const [recipientId, setRecipientId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [addingRecipient, setAddingRecipient] = useState(false);

  // Shop owner form state
  const [shopOwnerId, setShopOwnerId] = useState('');
  const [shopOwnerName, setShopOwnerName] = useState('');
  const [addingShopOwner, setAddingShopOwner] = useState(false);

  // Toggle state for forms
  const [activeForm, setActiveForm] = useState<'recipient' | 'shopowner'>('recipient');

  const isConnected = !!currentUserAddress && !!walletProvider;

  const checkOwnership = useCallback(async () => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, provider);
      const contractOwner = await contract.owner();
      setIsOwner(contractOwner.toLowerCase() === currentUserAddress?.toLowerCase());
      setLoading(false);
    } catch (error) {
      console.error("Error checking ownership:", error);
      setLoading(false);
    }
  }, [currentUserAddress]);

  const getContractStats = useCallback(async () => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, provider);

      const [totalRecipients, totalShopOwners, undistributedTokens, isDistributed, totalDistributed] = await Promise.all([
        contract.getTotalRecipients(),
        contract.getTotalShopOwners(),
        contract.getUndistributedTokens(),
        contract.distributionCompleted(),
        contract.getTotalDistributedTokens()
      ]);

      setContractStats({
        totalRecipients: Number(totalRecipients),
        totalShopOwners: Number(totalShopOwners),
        undistributedTokens: ethers.formatUnits(undistributedTokens, 4),
        isDistributed: isDistributed,
        totalDistributed: ethers.formatUnits(totalDistributed, 4)
      });
    } catch (error) {
      console.error("Error fetching contract stats:", error);
    }
  }, []);

  useEffect(() => {
    if (isConnected && currentUserAddress) {
      checkOwnership();
      getContractStats();
    }
  }, [isConnected, currentUserAddress, checkOwnership, getContractStats]);

  const distributeZakat = async () => {
    if (!isConnected || !isOwner) return;

    try {
      setDistributing(true);

      // Dismiss any existing toasts first
      toast.dismiss();
      const connectToast = toast.loading("Menyambung ke dompet...", { id: "connect-toast" });

      // We need to use window.ethereum to get the signer
      const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);

      // Dismiss previous toast before showing new one
      toast.dismiss(connectToast);
      const distributingToast = toast.loading("Mengagihkan dana Zakat...", { id: "distributing-toast" });

      const tx = await contract.distributeZakat();

      // Dismiss previous toast before showing new one
      toast.dismiss(distributingToast);
      const txToast = toast.loading(`Transaksi dihantar: ${tx.hash}`, { id: "tx-toast" });

      await tx.wait();

      // Dismiss all toasts before showing success
      toast.dismiss(txToast);
      toast.success("Zakat berjaya diagihkan!");

      // Refresh stats
      getContractStats();
    } catch (error: unknown) {
      console.error("Error distributing zakat:", error);

      // Dismiss any pending toasts before showing error
      toast.dismiss();
      toast.error("Gagal mengagihkan Zakat", {
        description: error instanceof Error ? error.message : "Ralat tidak diketahui berlaku"
      });
    } finally {
      setDistributing(false);
    }
  };

  const addRecipient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !isOwner || !recipientId || !recipientName) return;

    try {
      setAddingRecipient(true);

      // Dismiss any existing toasts first
      toast.dismiss();
      const connectToast = toast.loading("Menyambung ke dompet...", { id: "connect-toast" });

      const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);

      // Dismiss previous toast before showing new one
      toast.dismiss(connectToast);
      const registeringToast = toast.loading("Mendaftarkan penerima...", { id: "registering-toast" });

      const tx = await contract.addRecipient(recipientId, recipientName);

      // Dismiss previous toast before showing new one
      toast.dismiss(registeringToast);
      const txToast = toast.loading(`Transaksi dihantar: ${tx.hash}`, { id: "tx-toast" });

      await tx.wait();

      // Dismiss all toasts before showing success
      toast.dismiss(txToast);
      toast.success("Penerima berjaya didaftarkan!");

      // Clear form
      setRecipientId('');
      setRecipientName('');

      // Refresh stats
      getContractStats();
    } catch (error: unknown) {
      console.error("Error adding recipient:", error);

      // Dismiss any pending toasts before showing error
      toast.dismiss();
      toast.error("Gagal mendaftarkan penerima", {
        description: error instanceof Error ? error.message : "Ralat tidak diketahui berlaku"
      });
    } finally {
      setAddingRecipient(false);
    }
  };

  const addShopOwner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !isOwner || !shopOwnerId || !shopOwnerName) return;

    try {
      setAddingShopOwner(true);

      // Dismiss any existing toasts first
      toast.dismiss();
      const connectToast = toast.loading("Menyambung ke dompet...", { id: "connect-toast" });

      const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);

      // Dismiss previous toast before showing new one
      toast.dismiss(connectToast);
      const registeringToast = toast.loading("Mendaftarkan pemilik kedai...", { id: "registering-toast" });

      const tx = await contract.addShopOwner(shopOwnerId, shopOwnerName);

      // Dismiss previous toast before showing new one
      toast.dismiss(registeringToast);
      const txToast = toast.loading(`Transaksi dihantar: ${tx.hash}`, { id: "tx-toast" });

      await tx.wait();

      // Dismiss all toasts before showing success
      toast.dismiss(txToast);
      toast.success("Pemilik kedai berjaya didaftarkan!");

      // Clear form
      setShopOwnerId('');
      setShopOwnerName('');

      // Refresh stats
      getContractStats();
    } catch (error: unknown) {
      console.error("Error adding shop owner:", error);

      // Dismiss any pending toasts before showing error
      toast.dismiss();
      toast.error("Gagal mendaftarkan pemilik kedai", {
        description: error instanceof Error ? error.message : "Ralat tidak diketahui berlaku"
      });
    } finally {
      setAddingShopOwner(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Sambung Dompet Anda</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Sila sambungkan dompet anda untuk mengakses panel pengagihan Zakat.</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Akses Tidak Dibenarkan</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Hanya pemilik kontrak boleh mengakses panel pengagihan Zakat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          Panel Pengagihan Zakat
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2">
              Jumlah Penerima
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {contractStats.totalRecipients}
            </p>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2">
              Jumlah Pemilik Kedai
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {contractStats.totalShopOwners}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
              Zakat Belum Diagihkan
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {contractStats.undistributedTokens} ZKT
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">
              Status Pengagihan
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {contractStats.isDistributed ? "Selesai" : "Belum Selesai"}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Maklumat Pengagihan
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Sebagai pemilik kontrak, anda mempunyai kuasa untuk mengagihkan dana Zakat kepada semua penerima yang berdaftar.
            Pengagihan akan memperuntukkan token secara sama rata kepada semua penerima yang berdaftar.
            Setelah selesai, pengagihan tidak boleh dibalikkan.
          </p>

          <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {contractStats.isDistributed
                  ? "Pengagihan telah selesai."
                  : "Sila pastikan semua penerima telah didaftarkan sebelum pengagihan."}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={distributeZakat}
          disabled={distributing || contractStats.isDistributed || contractStats.totalRecipients === 0 || parseFloat(contractStats.undistributedTokens) === 0}
          className={`w-full py-3 rounded-lg font-medium shadow-sm transition-all ${distributing || contractStats.isDistributed || contractStats.totalRecipients === 0 || parseFloat(contractStats.undistributedTokens) === 0
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-600 text-white"
            }`}
        >
          {distributing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memproses...
            </span>
          ) : contractStats.isDistributed ? (
            "Pengagihan Selesai"
          ) : contractStats.totalRecipients === 0 ? (
            "Tiada Penerima Berdaftar"
          ) : parseFloat(contractStats.undistributedTokens) === 0 ? (
            "Tiada Token Untuk Diagihkan"
          ) : (
            "Agihkan Zakat"
          )}
        </button>
      </motion.div>

      {/* Registration Forms */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8"
      >
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm ${activeForm === 'recipient'
              ? 'text-emerald-600 border-b-2 border-emerald-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            onClick={() => setActiveForm('recipient')}
          >
            Daftar Penerima
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeForm === 'shopowner'
              ? 'text-emerald-600 border-b-2 border-emerald-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            onClick={() => setActiveForm('shopowner')}
          >
            Daftar Pemilik Kedai
          </button>
        </div>

        {activeForm === 'recipient' ? (
          <>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Daftar Penerima Baru
            </h2>

            <form onSubmit={addRecipient} className="space-y-4">
              <div>
                <label htmlFor="recipientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID Penerima (cth. IC Malaysia)
                </label>
                <input
                  type="text"
                  id="recipientId"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="cth. 900101-01-1234"
                  required
                />
              </div>

              <div>
                <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Penerima
                </label>
                <input
                  type="text"
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nama penuh"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={addingRecipient || contractStats.isDistributed || !recipientId || !recipientName}
                className={`w-full py-3 rounded-lg font-medium shadow-sm transition-all mt-6 ${addingRecipient || contractStats.isDistributed || !recipientId || !recipientName
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
              >
                {addingRecipient ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mendaftar...
                  </span>
                ) : contractStats.isDistributed ? (
                  "Pendaftaran Ditutup"
                ) : (
                  "Daftar Penerima"
                )}
              </button>
            </form>

            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              <p className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Penerima akan menerima token Zakat semasa pengagihan.
              </p>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Daftar Pemilik Kedai Baru
            </h2>

            <form onSubmit={addShopOwner} className="space-y-4">
              <div>
                <label htmlFor="shopOwnerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID Pemilik Kedai
                </label>
                <input
                  type="text"
                  id="shopOwnerId"
                  value={shopOwnerId}
                  onChange={(e) => setShopOwnerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Masukkan ID pemilik kedai"
                  required
                />
              </div>

              <div>
                <label htmlFor="shopOwnerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Pemilik Kedai / Nama Perniagaan
                </label>
                <input
                  type="text"
                  id="shopOwnerName"
                  value={shopOwnerName}
                  onChange={(e) => setShopOwnerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Masukkan nama perniagaan"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={addingShopOwner || !shopOwnerId || !shopOwnerName}
                className={`w-full py-3 rounded-lg font-medium shadow-sm transition-all mt-6 ${addingShopOwner || !shopOwnerId || !shopOwnerName
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-500 hover:bg-indigo-600 text-white"
                  }`}
              >
                {addingShopOwner ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mendaftar...
                  </span>
                ) : (
                  "Daftar Pemilik Kedai"
                )}
              </button>
            </form>

            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              <p className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Pemilik kedai akan dapat menerima token daripada penerima dan menukar ke MYR.
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AgihZakat;