'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CONTRACT_ADDRESS, RPC_URL } from '@/utils/config';
import { ethers } from 'ethers';

// Import the ABI for the ZakatSystem contract
import contractAbi from '@/contracts/abi.json';

export default function BayarPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nama: '',
    jenisId: 'KAD PENGENALAN BARU',
    nomorId: '',
    telefon: '',
    jenisZakat: 'ZAKAT PENDAPATAN',
    tahun: '2025',
    jumlah: ''
  });
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNext = () => {
    if (step === 3) {
      const bankWindow = window.open('', '_blank', 'width=500,height=600');
      if (bankWindow) {
        bankWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Bank Online Payment</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0;
                padding: 0;
                background-color: #fcfcfc;
              }
              .container {
                position: relative;
                width: 100%;
                height: 100vh;
              }
              .header {
                background-color: #000;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 3px solid #FFD700;
              }
              .logo {
                color: #FFD700;
                font-size: 24px;
                font-weight: bold;
              }
              .logout {
                color: white;
                text-decoration: none;
                font-size: 14px;
              }
              .content {
                padding: 20px;
              }
              .payment-details {
                margin-top: 20px;
              }
              .payment-box {
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 15px;
                margin-bottom: 20px;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
              }
              .detail-row:last-child {
                border-bottom: none;
              }
              .verification-box {
                background-color: #FFFFCC;
                padding: 15px;
                border-radius: 4px;
                margin: 20px 0;
              }
              .button-container {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-top: 20px;
              }
              .confirm-btn {
                background-color: #FFD700;
                border: none;
                color: #000;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
              }
              .back-btn {
                background: none;
                border: none;
                color: blue;
                cursor: pointer;
                text-decoration: underline;
              }
              h2 {
                text-align: center;
                margin-bottom: 20px;
              }
              .radio-dot {
                margin-right: 10px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Bank Online Payment</div>
                <a href="#" class="logout">Logout</a>
              </div>
              <div class="content">
                <h2>Online Payment</h2>
                <div class="payment-box">
                  <div class="detail-row">
                    <span>From Account:</span>
                    <span>SA-i</span>
                  </div>
                  <div class="detail-row">
                    <span>Corporation Name:</span>
                    <span>Zakat System</span>
                  </div>
                  <div class="detail-row">
                    <span>Bill account no.:</span>
                    <span>ZKT-0101</span>
                  </div>
                  <div class="detail-row">
                    <span>Amount:</span>
                    <span>RM${formData.jumlah || '0'}</span>
                  </div>
                  <div class="detail-row">
                    <span>Effective date:</span>
                    <span>Today</span>
                  </div>
                  <div class="detail-row">
                    <span>TAC</span>
                    <span>☑</span>
                  </div>
                </div>
                <div class="verification-box">
                  <div style="display: flex; align-items: center;">
                    <span class="radio-dot">⚪</span>
                    <span>Secure Verification ℹ️</span>
                  </div>
                  <p>You will receive a notification on your phone to authorise this transaction on the new Maybank app.</p>
                </div>
                <div class="button-container">
                  <button class="confirm-btn" onclick="window.close(); window.opener.document.getElementById('confirmPayment').click();">Confirm</button>
                  <span style="margin-top: 10px;">or</span>
                  <button class="back-btn" onclick="window.close();">Go back</button>
                </div>
              </div>
            </div>
          </body>
          </html>
        `);
      }
    } else if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setIsProcessing(true);
      setTxStatus('Processing...');
      
      // Convert the jumlah (amount) to wei (assuming it's in RM)
      const amount = ethers.parseEther(formData.jumlah || '0');
      
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
      
      // Call the mintZakat function
      const tx = await contract.mintZakat(amount);
      
      // Set the transaction hash
      setTxHash(tx.hash);
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        setTxStatus('Success');
        setStep(4);
      } else {
        setTxStatus('Failed');
      }
      
    } catch (error) {
      console.error("Error processing payment:", error);
      setTxStatus('Failed');
      // Still proceed to next step for demo purposes
      setStep(4);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="container mx-auto py-16 px-4 max-w-4xl">
      {/* Steps indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full border-2 ${step >= 1 ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className={`mt-2 text-xs sm:text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>1. Isi Maklumat Bayaran</p>
          </div>

          {/* Connector */}
          <div className="flex-1 mx-4 h-1 bg-gray-300">
            <div className={`h-full ${step >= 2 ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: step >= 2 ? '100%' : '0%' }}></div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full border-2 ${step >= 2 ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className={`mt-2 text-xs sm:text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>2. Pilih Kaedah Bayaran</p>
          </div>

          {/* Connector */}
          <div className="flex-1 mx-4 h-1 bg-gray-300">
            <div className={`h-full ${step >= 3 ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: step >= 3 ? '100%' : '0%' }}></div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full border-2 ${step >= 3 ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className={`mt-2 text-xs sm:text-sm font-medium ${step >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>3. Pilih Bank</p>
          </div>

          {/* Connector */}
          <div className="flex-1 mx-4 h-1 bg-gray-300">
            <div className={`h-full ${step >= 4 ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: step >= 4 ? '100%' : '0%' }}></div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full border-2 ${step >= 4 ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className={`mt-2 text-xs sm:text-sm font-medium ${step >= 4 ? 'text-blue-600' : 'text-gray-500'}`}>4. Resit Bayaran Zakat</p>
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold mb-6 text-blue-600">Masukkan Maklumat Pembayaran</h2>
            
            <div className="space-y-4">
              {/* Nama Penuh */}
              <div>
                <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Penuh
                </label>
                <input
                  type="text"
                  id="nama"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="MUHAMMAD HAZRIL FAHMI BIN MARHUM @ MARHALIM"
                />
                <p className="mt-1 text-xs text-gray-500">Nama penuh pengeluar zakat (seperti Kad Pengenalan)</p>
              </div>
              
              {/* Jenis Pengenalan */}
              <div>
                <label htmlFor="jenisId" className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Pengenalan
                </label>
                <select
                  id="jenisId"
                  name="jenisId"
                  value={formData.jenisId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>KAD PENGENALAN BARU</option>
                  <option>PASPORT</option>
                </select>
              </div>
              
              {/* Nombor Pengenalan */}
              <div>
                <label htmlFor="nomorId" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombor Pengenalan
                </label>
                <input
                  type="text"
                  id="nomorId"
                  name="nomorId"
                  value={formData.nomorId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="031111010755"
                />
                <p className="mt-1 text-xs text-gray-500">Contoh: Mykad: 700229099995 atau Passport: A7094223 atau No. Syarikat: 1220150488U</p>
              </div>
              
              {/* Nombor Telefon */}
              <div>
                <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombor Telefon
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+60</span>
                  <input
                    type="text"
                    id="telefon"
                    name="telefon"
                    value={formData.telefon}
                    onChange={handleChange}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1169363271"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Contoh: 0123617045</p>
              </div>
              
              {/* Jenis Zakat */}
              <div>
                <label htmlFor="jenisZakat" className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Zakat
                </label>
                <select
                  id="jenisZakat"
                  name="jenisZakat"
                  value={formData.jenisZakat}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>ZAKAT PENDAPATAN</option>
                  <option>ZAKAT PERNIAGAAN</option>
                  <option>ZAKAT SIMPANAN</option>
                  <option>ZAKAT EMAS</option>
                </select>
              </div>
              
              {/* Haul / Tahun */}
              <div>
                <label htmlFor="tahun" className="block text-sm font-medium text-gray-700 mb-1">
                  Haul / Tahun
                </label>
                <select
                  id="tahun"
                  name="tahun"
                  value={formData.tahun}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>2023</option>
                  <option>2024</option>
                  <option>2025</option>
                </select>
              </div>
              
              {/* Jumlah Bayaran */}
              <div>
                <label htmlFor="jumlah" className="block text-sm font-medium text-gray-700 mb-1">
                  JUMLAH BAYARAN ( RM )
                </label>
                <input
                  type="text"
                  id="jumlah"
                  name="jumlah"
                  value={formData.jumlah}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">* Minimum RM10.00, Maximum RM100,000.00 (RM) untuk satu transaksi</p>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-blue-600">Pilih Kaedah Bayaran</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <h3 className="text-lg font-medium mb-2">FPX Perbankan Internet</h3>
                <p className="text-sm text-gray-600">Bayar menggunakan akaun bank anda melalui FPX</p>
              </div>
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <h3 className="text-lg font-medium mb-2">Kad Kredit/Debit</h3>
                <p className="text-sm text-gray-600">Bayar menggunakan kad kredit atau debit</p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-blue-600">Pilih Bank</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <img src="/banks/maybank.png" alt="Maybank" className="h-12 mx-auto mb-2" />
                <p className="text-center text-sm">Maybank</p>
              </div>
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <img src="/banks/cimb.png" alt="CIMB" className="h-12 mx-auto mb-2" />
                <p className="text-center text-sm">CIMB Bank</p>
              </div>
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <img src="/banks/rhb.png" alt="RHB" className="h-12 mx-auto mb-2" />
                <p className="text-center text-sm">RHB Bank</p>
              </div>
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <img src="/banks/bankislam.png" alt="Bank Islam" className="h-12 mx-auto mb-2" />
                <p className="text-center text-sm">Bank Islam</p>
              </div>
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <img src="/banks/bsn.png" alt="BSN" className="h-12 mx-auto mb-2" />
                <p className="text-center text-sm">BSN</p>
              </div>
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <img src="/banks/ambank.png" alt="AmBank" className="h-12 mx-auto mb-2" />
                <p className="text-center text-sm">AmBank</p>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Pembayaran Berjaya!</h2>
            <p className="text-gray-600 mb-6">Pembayaran zakat anda telah berjaya diproses</p>
            <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto border border-gray-200">
              <h3 className="font-semibold mb-4 text-gray-800">Butiran Pembayaran</h3>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama:</span>
                  <span className="font-medium">{formData.nama || 'MUHAMMAD HAZRIL FAHMI'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No. Pengenalan:</span>
                  <span className="font-medium">{formData.nomorId || '031111010755'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jenis Zakat:</span>
                  <span className="font-medium">{formData.jenisZakat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jumlah:</span>
                  <span className="font-medium">RM {formData.jumlah || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tarikh:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No. Resit:</span>
                  <span className="font-medium">ZKT-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</span>
                </div>
                {txHash && (
                  <div className="flex flex-col mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-600 mb-1">Blockchain Tx:</span>
                    <div className="flex items-center">
                      <span className="font-medium text-xs mr-2">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
                      <a 
                        href={`https://sepolia.scrollscan.com/tx/${txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View
                      </a>
                    </div>
                  </div>
                )}
                {txStatus && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${txStatus === 'Success' ? 'text-green-600' : txStatus === 'Failed' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {txStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Muat Turun Resit
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <div className="flex flex-col items-center">
                <div className="mb-4">
                  <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Transaksi Sedang Diproses</h3>
                <p className="text-gray-600 text-center mb-2">Pembayaran zakat anda sedang direkodkan di blockchain</p>
                {txHash && (
                  <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-3 rounded w-full">
                    <p className="font-medium mb-1">Transaction Hash:</p>
                    <div className="flex items-center">
                      <p className="truncate text-blue-600 mr-2">{txHash.slice(0, 10)}...{txHash.slice(-8)}</p>
                      <a 
                        href={`https://sepolia.scrollscan.com/tx/${txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                      >
                        View on Explorer
                      </a>
                    </div>
                  </div>
                )}
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-full"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          {step > 1 && step < 4 ? (
            <button 
              onClick={handleBack}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              SEMULA
            </button>
          ) : (
            <div></div>
          )}

          {step < 4 ? (
            <button 
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              SETERUSNYA
            </button>
          ) : (
            <div className="w-full flex justify-center">
              <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                KEMBALI KE LAMAN UTAMA
              </Link>
            </div>
          )}
          
          {/* Hidden button to handle the confirmation from popup window */}
          <button 
            id="confirmPayment" 
            onClick={handleConfirmPayment} 
            className="hidden"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
