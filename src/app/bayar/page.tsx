'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { CONTRACT_ADDRESS, RPC_URL, ZAKAT_NFT_CONTRACT_ADDRESS } from '@/utils/config';
import { ethers } from 'ethers';

// Import the ABIs for both contracts
import contractAbi from '@/contracts/abi.json';
import zakatNFTAbi from '@/contracts/ZakatNFTAbi.json';

export default function BayarPage() {
  const [step, setStep] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    jenisId: 'KAD PENGENALAN BARU',
    nomorId: '',
    telefon: '',
    email: '',
    jenisZakat: 'ZAKAT PENDAPATAN',
    tahun: '2025',
    jumlah: ''
  });
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [nftStatus, setNftStatus] = useState('');
  const [nftTxHash, setNftTxHash] = useState('');
  const [receiptId, setReceiptId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [emailStatus, setEmailStatus] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'jumlah') {
      // Clear any previous error
      setPaymentError('');

      // Validate amount for 'jumlah' field
      if (value && !isNaN(parseFloat(value))) {
        const amount = parseFloat(value);
        if (amount === 0) {
          setPaymentError('Jumlah minimum bayaran adalah RM1.00');
        } else if (amount < 1) {
          setPaymentError('Jumlah minimum bayaran adalah RM1.00');
        }
      }
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNext = () => {
    // Check if payment amount is valid before proceeding
    if (step === 1) {
      const amount = parseFloat(formData.jumlah);
      if (!formData.jumlah || isNaN(amount) || amount < 1) {
        setPaymentError('Jumlah minimum bayaran adalah RM1.00');
        return;
      }
    }

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
                cursor: pointer;
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
                display: inline-block;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                border: 2px solid #007bff;
                position: relative;
                cursor: pointer;
              }
              .radio-dot.checked:after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background-color: #007bff;
              }
              .checkbox {
                display: inline-block;
                width: 18px;
                height: 18px;
                border: 2px solid #555;
                margin-right: 5px;
                position: relative;
                cursor: pointer;
                border-radius: 3px;
              }
              .checkbox.checked:after {
                content: '✓';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 12px;
                font-weight: bold;
              }
              .checkbox.checked {
                background-color: #007bff;
                border-color: #007bff;
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
                    <span><div id="tacCheckbox" class="checkbox checked" onclick="this.classList.toggle('checked')"></div></span>
                  </div>
                </div>
                <div class="verification-box" id="verificationBox" onclick="toggleVerification()">
                  <div style="display: flex; align-items: center;">
                    <span id="verificationRadio" class="radio-dot checked"></span>
                    <span>Secure Verification ℹ️</span>
                  </div>
                  <p>You will receive a notification on your phone to authorise this transaction on the new Maybank app.</p>
                </div>
                <div class="button-container">
                  <button class="confirm-btn" id="confirmBtn" onclick="confirmPayment()">Confirm</button>
                  <span style="margin-top: 10px;">or</span>
                  <button class="back-btn" onclick="window.close();">Go back</button>
                </div>
              </div>
            </div>
            <script>
              function toggleVerification() {
                const radio = document.getElementById('verificationRadio');
                radio.classList.toggle('checked');
                checkConfirmButton();
              }
              
              function checkConfirmButton() {
                const verificationChecked = document.getElementById('verificationRadio').classList.contains('checked');
                const tacChecked = document.getElementById('tacCheckbox').classList.contains('checked');
                const confirmBtn = document.getElementById('confirmBtn');
                
                if (verificationChecked && tacChecked) {
                  confirmBtn.disabled = false;
                  confirmBtn.style.opacity = '1';
                  confirmBtn.style.cursor = 'pointer';
                } else {
                  confirmBtn.disabled = true;
                  confirmBtn.style.opacity = '0.5';
                  confirmBtn.style.cursor = 'not-allowed';
                }
              }
              
              function confirmPayment() {
                const verificationChecked = document.getElementById('verificationRadio').classList.contains('checked');
                const tacChecked = document.getElementById('tacCheckbox').classList.contains('checked');
                
                if (verificationChecked && tacChecked) {
                  window.close();
                  window.opener.document.getElementById('confirmPayment').click();
                }
              }
              
              // Initialize button state
              checkConfirmButton();
            </script>
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

      // Generate a receipt ID at the beginning of processing
      const generatedReceiptId = `ZKT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      setReceiptId(generatedReceiptId);

      // Convert the jumlah (amount) to wei (assuming it's in RM)
      const amount = ethers.parseUnits(formData.jumlah || '0', 4);

      // Create provider and connect to the network
      const provider = new ethers.JsonRpcProvider(RPC_URL);

      // Get the private key from environment variable
      const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;

      if (!privateKey) {
        throw new Error("Private key not found in environment variables");
      }

      // Create a wallet with the private key
      const wallet = new ethers.Wallet(privateKey, provider);

      // Create the contract instance for ZakatSystem
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, wallet);

      // Call the mintZakat function (keep the function name as is, but display name can change)
      const tx = await contract.mintZakat(amount);

      // Set the transaction hash
      setTxHash(tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setTxStatus('Success');

        // After successful transaction, mint the NFT receipt
        try {
          // Set NFT status
          setNftStatus('Minting NFT receipt...');

          // Create the ZakatNFT contract instance
          const nftContract = new ethers.Contract(ZAKAT_NFT_CONTRACT_ADDRESS, zakatNFTAbi, wallet);

          // Define token URI - in a real app, this would be an IPFS link to metadata
          const tokenURI = `https://plum-tough-mongoose-147.mypinata.cloud/ipfs/bafybeiazkn4okxee2bnwvbcprhsk4rcujerkc5p2p7zkf3s5uj24b7rqia`;

          // Mint the NFT receipt
          const nftTx = await nftContract.mintReceiptNFT(
            generatedReceiptId,
            formData.nama || 'MUHAMMAD HAZRIL FAHMI',
            formData.nomorId || '031111010755',
            formData.email || 'user@example.com',
            formData.telefon || '1234567890',
            formData.jenisZakat,
            amount,
            tx.hash,
            tokenURI
          );

          // Set NFT transaction hash
          setNftTxHash(nftTx.hash);

          // Wait for the NFT transaction to be mined
          await nftTx.wait();

          // Update NFT status
          setNftStatus('NFT minted successfully');
          console.log('NFT minted successfully');

          // Send email notification with receipt
          try {
            const emailResponse = await fetch('/api/send-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: formData.email || 'user@example.com',
                receiptId: generatedReceiptId,
                name: formData.nama || 'MUHAMMAD HAZRIL FAHMI',
                amount: formData.jumlah || '0',
                zakatType: formData.jenisZakat
              }),
            });

            if (emailResponse.ok) {
              // Set notification state to show to user
              setEmailStatus('Email resit telah berjaya dihantar ke alamat email anda');
            } else {
              setEmailStatus('Email resit tidak dapat dihantar, tetapi anda masih boleh melihat resit anda di sini');
            }
          } catch (emailError) {
            console.error('Error sending email:', emailError);
            setEmailStatus('Email resit tidak dapat dihantar, tetapi anda masih boleh melihat resit anda di sini');
          }

        } catch (nftError) {
          console.error('Error minting NFT:', nftError);
          setNftStatus('Failed to mint NFT');
          // Continue with success status even if NFT minting fails
        }

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

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
  };

  const handleBankSelect = (bank: string) => {
    setSelectedBank(bank);
  };

  const downloadReceipt = () => {
    setIsReceiptModalOpen(true);
  };

  const handlePrintReceipt = () => {
    const receiptContent = receiptRef.current;
    if (!receiptContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Resit Zakat #${receiptId}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
            color: #333;
          }
          .receipt {
            max-width: 800px;
            margin: 20px auto;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            position: relative;
          }
          .receipt-header {
            background: linear-gradient(135deg, #10B981, #059669);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .receipt-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
            opacity: 0.3;
          }
          .receipt-logo {
            font-size: 34px;
            font-weight: 800;
            margin-bottom: 15px;
            position: relative;
            letter-spacing: 1px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .receipt-title {
            font-size: 22px;
            font-weight: bold;
            position: relative;
            letter-spacing: 0.5px;
          }
          .receipt-body {
            padding: 40px;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            margin-bottom: 40px;
            border-bottom: 1px solid #eee;
            padding-bottom: 30px;
            position: relative;
          }
          .receipt-info::after {
            content: '';
            position: absolute;
            height: 20px;
            width: 20px;
            background-color: #f9f9f9;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%) rotate(45deg);
            border-right: 1px solid #eee;
            border-bottom: 1px solid #eee;
          }
          .receipt-info-block {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            flex: 1;
            min-width: 250px;
            margin-bottom: 15px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            border-left: 4px solid #10B981;
          }
          .receipt-info-block:first-child {
            margin-right: 20px;
          }
          .receipt-label {
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
            font-weight: 600;
          }
          .receipt-value {
            font-weight: 600;
            font-size: 16px;
            color: #333;
          }
          .receipt-details {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0 35px;
            border: none;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            border-radius: 10px;
            overflow: hidden;
          }
          .receipt-details th {
            background-color: #f2f2f2;
            padding: 16px 20px;
            text-align: left;
            font-weight: 600;
            color: #555;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 1px;
            border-top: 1px solid #eee;
            border-bottom: 1px solid #ddd;
          }
          .receipt-details td {
            padding: 16px 20px;
            border-bottom: 1px solid #eee;
          }
          .receipt-details tr:last-child td {
            border-bottom: none;
          }
          .receipt-details tr:nth-child(even) {
            background-color: #fafafa;
          }
          .receipt-details tr:last-child {
            background-color: #f8f8f8;
          }
          .receipt-total {
            font-size: 18px;
            font-weight: bold;
            text-align: right;
            margin-top: 30px;
            padding: 20px 0;
            border-top: 2px dashed #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .receipt-total-label {
            color: #555;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .receipt-total-value {
            color: #10B981;
            font-size: 26px;
            font-weight: 700;
            background: -webkit-linear-gradient(135deg, #10B981, #059669);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            position: relative;
            padding-right: 25px;
            letter-spacing: 0.5px;
          }
          .receipt-total-value::after {
            content: 'RM';
            position: absolute;
            top: 4px;
            right: 0;
            font-size: 14px;
            color: #10B981;
            -webkit-text-fill-color: #10B981;
            font-weight: 600;
          }
          .receipt-footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 14px;
            position: relative;
            padding-top: 30px;
          }
          .receipt-footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 2px;
            background: linear-gradient(to right, transparent, #ddd, transparent);
          }
          .blockchain-info {
            background-color: #EFF6FF;
            border-radius: 10px;
            padding: 20px;
            margin: 30px 0;
            font-size: 14px;
            border: 1px solid #DBEAFE;
            position: relative;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
          }
          .blockchain-info-title {
            display: flex;
            align-items: center;
            font-weight: 600;
            margin-bottom: 15px;
            color: #1E40AF;
            font-size: 16px;
          }
          .blockchain-info-title svg {
            margin-right: 10px;
            color: #3B82F6;
          }
          .blockchain-tx {
            word-break: break-all;
            color: #2563EB;
            font-family: 'Courier New', monospace;
            background-color: white;
            padding: 12px 15px;
            border-radius: 8px;
            border: 1px solid #DBEAFE;
            margin-bottom: 15px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) inset;
            font-size: 13px;
          }
          .blockchain-link {
            color: #2563EB;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            font-weight: 500;
            transition: all 0.2s ease;
            padding: 8px 12px;
            background-color: rgba(37, 99, 235, 0.1);
            border-radius: 6px;
          }
          .blockchain-link:hover {
            background-color: rgba(37, 99, 235, 0.2);
          }
          .blockchain-link svg {
            width: 14px;
            height: 14px;
            margin-left: 6px;
          }
          .nft-info {
            background-color: #F5F3FF;
            border-radius: 10px;
            padding: 20px;
            margin: 30px 0;
            font-size: 14px;
            border: 1px solid #DDD6FE;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
            position: relative;
          }
          .nft-info-title {
            display: flex;
            align-items: center;
            font-weight: 600;
            margin-bottom: 15px;
            color: #5B21B6;
            font-size: 16px;
          }
          .nft-info-title svg {
            margin-right: 10px;
            color: #8B5CF6;
          }
          .nft-info-content {
            padding: 15px;
            background-color: white;
            border-radius: 8px;
            border: 1px solid #DDD6FE;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          .nft-email {
            font-weight: 600;
            color: #7C3AED;
            margin-top: 8px;
            margin-bottom: 12px;
            padding: 6px 10px;
            background-color: rgba(124, 58, 237, 0.1);
            border-radius: 4px;
            display: inline-block;
          }
          .nft-tx {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px dashed #DDD6FE;
          }
          .nft-tx p {
            margin-bottom: 5px;
            color: #6B7280;
          }
          .print-button {
            background: linear-gradient(135deg, #10B981, #059669);
            color: white;
            border: none;
            padding: 14px 28px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 30px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
            transition: all 0.2s;
            font-weight: 600;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 30px auto 15px;
          }
          .print-button svg {
            margin-right: 8px;
          }
          .print-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
          }
          .success-indicator {
            background-color: #D1FAE5;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 40px auto;
            max-width: 300px;
            border: 1px solid #A7F3D0;
            position: relative;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
          }
          .success-indicator::before {
            content: '';
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            width: 30px;
            height: 30px;
            background-color: white;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            z-index: 0;
          }
          .success-indicator svg {
            color: #10B981;
            width: 28px;
            height: 28px;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
          }
          .success-text {
            color: #065F46;
            font-weight: 700;
            font-size: 18px;
          }
          .zigzag-top, .zigzag-bottom {
            height: 8px;
            width: 100%;
            background: linear-gradient(135deg, #f9f9f9 25%, transparent 25%) -8px 0,
                        linear-gradient(225deg, #f9f9f9 25%, transparent 25%) -8px 0,
                        linear-gradient(315deg, #f9f9f9 25%, transparent 25%),
                        linear-gradient(45deg, #f9f9f9 25%, transparent 25%);
            background-size: 16px 16px;
            background-color: white;
            position: relative;
            z-index: 5;
          }
          .zigzag-top {
            margin-top: -6px;
          }
          .zigzag-bottom {
            margin-bottom: -6px;
          }
          .section-title {
            position: relative;
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
          }
          .section-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 50px;
            height: 3px;
            background: linear-gradient(to right, #10B981, #059669);
            border-radius: 2px;
          }
          .stamp {
            position: absolute;
            top: 80px;
            right: 40px;
            width: 120px;
            height: 120px;
            transform: rotate(12deg);
            border: 2px solid #10B981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #10B981;
            font-weight: 700;
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.7;
          }
          .stamp-inner {
            border: 1px dashed #10B981;
            width: 112px;
            height: 112px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          @media print {
            .print-button {
              display: none;
            }
            body {
              background-color: white;
            }
            .receipt {
              box-shadow: none;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-header">
            <div class="receipt-logo">ZakatPay™</div>
            <div class="receipt-title">RESIT PEMBAYARAN ZAKAT</div>
          </div>
          
          <div class="zigzag-top"></div>
          
          <div class="receipt-body">
            <div class="stamp">
              <div class="stamp-inner">Dibayar</div>
            </div>
            
            <div class="receipt-info">
              <div className="receipt-info-block">
                <div className="receipt-label">No. Resit</div>
                <div className="receipt-value">${receiptId}</div>
                
                <div style="margin-top: 15px; display: flex;">
                  <div style="margin-right: 30px;">
                    <div class="receipt-label">Tarikh</div>
                    <div class="receipt-value">${currentDate}</div>
                  </div>
                  <div>
                    <div class="receipt-label">Masa</div>
                    <div class="receipt-value">${new Date().toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
              
              <div class="receipt-info-block">
                <div class="receipt-label">Pembayar</div>
                <div class="receipt-value">${formData.nama || 'MUHAMMAD HAZRIL FAHMI'}</div>
                
                <div style="margin-top: 15px;">
                  <div class="receipt-label">No. Pengenalan</div>
                  <div class="receipt-value">${formData.nomorId || '031111010755'}</div>
                </div>
                
                <div style="margin-top: 15px;">
                  <div class="receipt-label">Email</div>
                  <div class="receipt-value">${formData.email || 'user@example.com'}</div>
                </div>
              </div>
            </div>
            
            <h3 class="section-title">Butiran Pembayaran</h3>
            <table class="receipt-details">
              <thead>
                <tr>
                  <th>Butiran</th>
                  <th style="text-align: right;">Nilai</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Jenis Zakat</td>
                  <td style="text-align: right; font-weight: 500;">${formData.jenisZakat}</td>
                </tr>
                <tr>
                  <td>Haul / Tahun</td>
                  <td style="text-align: right; font-weight: 500;">${formData.tahun}</td>
                </tr>
                <tr>
                  <td style="font-weight: 600;">Jumlah</td>
                  <td style="text-align: right; font-weight: 700;">${formData.jumlah || '0.00'}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="receipt-total">
              <div class="receipt-total-label">JUMLAH KESELURUHAN:</div>
              <div class="receipt-total-value">${formData.jumlah || '0.00'}</div>
            </div>
            
            ${txHash ? `
            <div class="blockchain-info">
              <div class="blockchain-info-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Transaksi Blockchain
              </div>
              <div class="blockchain-tx">${txHash}</div>
              <a href="https://sepolia.scrollscan.com/tx/${txHash}" target="_blank" class="blockchain-link">
                Lihat di Block Explorer
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            ` : ''}
            
<<<<<<< HEAD
            <div className="success-indicator">
=======
            <div class="nft-info">
              <div class="nft-info-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Resit NFT
              </div>
              <div class="nft-info-content">
                <p>NFT receipt telah dimint ke alamat email:</p>
                <p class="nft-email">${formData.email || 'user@example.com'}</p>
                ${nftTxHash ? `
                <div class="nft-tx">
                  <p>NFT Transaction Hash:</p>
                  <a href="https://sepolia.scrollscan.com/tx/${nftTxHash}" target="_blank" class="blockchain-link">
                    ${nftTxHash}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                ` : ''}
              </div>
            </div>
            
            <div class="success-indicator">
>>>>>>> 8871c60 (fix receipt)
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="success-text">Pembayaran Telah Disahkan</div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #666; font-size: 15px;">Terima kasih atas pembayaran zakat anda.</p>
              <p style="color: #666; margin-top: 5px; font-style: italic;">Semoga Allah memberkati harta dan kehidupan anda.</p>
            </div>
            
            <div class="receipt-footer">
              <p>© ${new Date().getFullYear()} ZakatPay™ - Sistem Pembayaran Zakat Digital</p>
            </div>
            
            <button class="print-button" onclick="window.print(); setTimeout(function() { window.close(); }, 500);">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Cetak Resit
            </button>
          </div>
          
          <div class="zigzag-bottom"></div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="container mx-auto py-16 px-4 max-w-4xl">
      {/* Steps indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full border-2 ${step >= 1 ? 'border-emerald-500 bg-emerald-100' : 'border-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className={`mt-2 text-xs sm:text-sm font-medium ${step >= 1 ? 'text-emerald-600' : 'text-gray-500'}`}>1. Isi Maklumat Bayaran</p>
          </div>

          {/* Connector */}
          <div className="flex-1 mx-4 h-1 bg-gray-300">
            <div className={`h-full ${step >= 2 ? 'bg-emerald-500' : 'bg-gray-300'}`} style={{ width: step >= 2 ? '100%' : '0%' }}></div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full border-2 ${step >= 2 ? 'border-emerald-500 bg-emerald-100' : 'border-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className={`mt-2 text-xs sm:text-sm font-medium ${step >= 2 ? 'text-emerald-600' : 'text-gray-500'}`}>2. Pilih Kaedah Bayaran</p>
          </div>

          {/* Connector */}
          <div className="flex-1 mx-4 h-1 bg-gray-300">
            <div className={`h-full ${step >= 3 ? 'bg-emerald-500' : 'bg-gray-300'}`} style={{ width: step >= 3 ? '100%' : '0%' }}></div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full border-2 ${step >= 3 ? 'border-emerald-500 bg-emerald-100' : 'border-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className={`mt-2 text-xs sm:text-sm font-medium ${step >= 3 ? 'text-emerald-600' : 'text-gray-500'}`}>3. Pilih Bank</p>
          </div>

          {/* Connector */}
          <div className="flex-1 mx-4 h-1 bg-gray-300">
            <div className={`h-full ${step >= 4 ? 'bg-emerald-500' : 'bg-gray-300'}`} style={{ width: step >= 4 ? '100%' : '0%' }}></div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full border-2 ${step >= 4 ? 'border-emerald-500 bg-emerald-100' : 'border-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className={`mt-2 text-xs sm:text-sm font-medium ${step >= 4 ? 'text-emerald-600' : 'text-gray-500'}`}>4. Resit Bayaran Zakat</p>
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold mb-6 text-emerald-600">Masukkan Maklumat Pembayaran</h2>

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
                  className="w-full px-3 py-2 border border-gray-300 text-gray-500 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="w-full px-3 py-2 border text-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="w-full px-3 py-2 border text-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
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
                    className="flex-1 min-w-0 block w-full px-3 text-gray-500 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="1169363271"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Contoh: 0123617045</p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border text-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="email@example.com"
                />
                <p className="mt-1 text-xs text-gray-500">Resit pembayaran akan dihantar ke email ini</p>
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
                  className="w-full px-3 py-2 border border-gray-300 text-gray-500 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="w-full px-3 py-2 border text-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
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
                  className={`w-full px-3 py-2 border font-bold ${paymentError ? 'border-red-500' : 'border-gray-300'} text-gray-500 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500`}
                  placeholder="0"
                />
                {paymentError ? (
                  <p className="mt-1 text-xs text-red-500">{paymentError}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">* Minimum RM1.00, Maximum RM100,000.00 (RM) untuk satu transaksi</p>
                )}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-emerald-600">Pilih Kaedah Bayaran</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`border rounded-md p-4 cursor-pointer transition-all duration-200 ${selectedPaymentMethod === 'FPX'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-300 hover:border-emerald-500'
                  }`}
                onClick={() => handlePaymentMethodSelect('FPX')}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <div className={`w-5 h-5 rounded-full border ${selectedPaymentMethod === 'FPX'
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-gray-300'
                      } flex items-center justify-center`}>
                      {selectedPaymentMethod === 'FPX' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium mb-2 ${selectedPaymentMethod === 'FPX' ? 'text-emerald-600' : 'text-gray-500'
                      }`}>FPX Perbankan Internet</h3>
                    <p className="text-sm text-gray-600">Bayar menggunakan akaun bank anda melalui FPX</p>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-md p-4 cursor-pointer transition-all duration-200 ${selectedPaymentMethod === 'CARD'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-300 hover:border-emerald-500'
                  }`}
                onClick={() => handlePaymentMethodSelect('CARD')}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <div className={`w-5 h-5 rounded-full border ${selectedPaymentMethod === 'CARD'
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-gray-300'
                      } flex items-center justify-center`}>
                      {selectedPaymentMethod === 'CARD' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium mb-2 ${selectedPaymentMethod === 'CARD' ? 'text-emerald-600' : 'text-gray-500'
                      }`}>Kad Kredit/Debit</h3>
                    <p className="text-sm text-gray-600">Bayar menggunakan kad kredit atau debit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-emerald-600">Pilih Bank</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div
                className={`border rounded-md p-4 cursor-pointer transition-all duration-200 ${selectedBank === 'Maybank'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-300 hover:border-emerald-500'
                  }`}
                onClick={() => handleBankSelect('Maybank')}
              >
                <img src="/banks/maybank-logo.png" alt="Maybank" className="h-12 mx-auto mb-2" />
                <p className={`font-bold text-center text-sm ${selectedBank === 'Maybank' ? 'text-emerald-600' : 'text-gray-500'
                  }`}>Maybank</p>
              </div>

              <div
                className={`border rounded-md p-4 cursor-pointer transition-all duration-200 ${selectedBank === 'CIMB'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-300 hover:border-emerald-500'
                  }`}
                onClick={() => handleBankSelect('CIMB')}
              >
                <img src="/banks/cimb-logo.jpg" alt="CIMB" className="h-12 mx-auto mb-2" />
                <p className={`font-bold text-center text-sm ${selectedBank === 'CIMB' ? 'text-emerald-600' : 'text-gray-500'
                  }`}>CIMB Bank</p>
              </div>

              <div
                className={`border rounded-md p-4 cursor-pointer transition-all duration-200 ${selectedBank === 'RHB'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-300 hover:border-emerald-500'
                  }`}
                onClick={() => handleBankSelect('RHB')}
              >
                <img src="/banks/rhb-logo.png" alt="RHB" className="h-12 mx-auto mb-2" />
                <p className={`font-bold text-center text-sm ${selectedBank === 'RHB' ? 'text-emerald-600' : 'text-gray-500'
                  }`}>RHB Bank</p>
              </div>

              <div
                className={`border rounded-md p-4 cursor-pointer transition-all duration-200 ${selectedBank === 'Bank Islam'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-300 hover:border-emerald-500'
                  }`}
                onClick={() => handleBankSelect('Bank Islam')}
              >
                <img src="/banks/bank-islam-logo.png" alt="Bank Islam" className="h-12 mx-auto mb-2" />
                <p className={`font-bold text-center text-sm ${selectedBank === 'Bank Islam' ? 'text-emerald-600' : 'text-gray-500'
                  }`}>Bank Islam</p>
              </div>

              <div
                className={`border rounded-md p-4 cursor-pointer transition-all duration-200 ${selectedBank === 'BSN'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-300 hover:border-emerald-500'
                  }`}
                onClick={() => handleBankSelect('BSN')}
              >
                <img src="/banks/bsn-logo.png" alt="BSN" className="h-12 mx-auto mb-2" />
                <p className={`font-bold text-center text-sm ${selectedBank === 'BSN' ? 'text-emerald-600' : 'text-gray-500'
                  }`}>BSN</p>
              </div>

              <div
                className={`border rounded-md p-4 cursor-pointer transition-all duration-200 ${selectedBank === 'AmBank'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-300 hover:border-emerald-500'
                  }`}
                onClick={() => handleBankSelect('AmBank')}
              >
                <img src="/banks/ambank-logo.png" alt="AmBank" className="h-12 mx-auto mb-2" />
                <p className={`font-bold text-center text-sm ${selectedBank === 'AmBank' ? 'text-emerald-600' : 'text-gray-500'
                  }`}>AmBank</p>
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
            <p className="text-gray-600 mb-2">Pembayaran zakat anda telah berjaya diproses</p>
            <p className="text-blue-600 mb-6 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Resit telah dihantar ke alamat email anda
            </p>

            <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto border border-gray-200">
              <h3 className="font-semibold mb-4 text-gray-800">Butiran Pembayaran</h3>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama:</span>
                  <span className="font-medium text-gray-500">{formData.nama || 'MUHAMMAD HAZRIL FAHMI'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No. Pengenalan:</span>
                  <span className="font-medium text-gray-500">{formData.nomorId || '031111010755'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-500">{formData.email || 'user@example.com'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jenis Zakat:</span>
                  <span className="font-medium text-gray-500">{formData.jenisZakat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jumlah:</span>
                  <span className="font-medium text-gray-500">RM {formData.jumlah || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tarikh:</span>
                  <span className="font-medium text-gray-500">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No. Resit:</span>
                  <span className="font-medium text-gray-500">{receiptId}</span>
                </div>
                {txHash && (
                  <div className="flex flex-col mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-600 mb-1">Blockchain Tx:</span>
                    <div className="flex items-center">
                      <span className="truncate text-blue-600 mr-2">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
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
            <div className="mt-6 flex justify-center space-x-4">
              <button
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center justify-center"
                onClick={downloadReceipt}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Muat Turun Resit
              </button>
              <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                KEMBALI KE LAMAN UTAMA
              </Link>
            </div>
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

                {/* NFT minting message */}
                <div className="flex items-center bg-purple-50 text-purple-800 text-sm px-4 py-2 rounded-md mt-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span>
                    {nftStatus || "Resit NFT sedang dimint ke "}
                    {!nftStatus && <span className="font-medium">{formData.email || 'email anda'}</span>}
                  </span>
                </div>

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

                {nftTxHash && (
                  <div className="text-xs text-gray-500 mt-2 bg-purple-50 p-3 rounded w-full">
                    <p className="font-medium mb-1">NFT Transaction:</p>
                    <div className="flex items-center">
                      <p className="truncate text-purple-600 mr-2">{nftTxHash.slice(0, 10)}...{nftTxHash.slice(-8)}</p>
                      <a
                        href={`https://sepolia.scrollscan.com/tx/${nftTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
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
              className={`px-6 py-2 ${(step === 2 && !selectedPaymentMethod) || (step === 3 && !selectedBank)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
                } text-white rounded-md`}
              disabled={(step === 2 && !selectedPaymentMethod) || (step === 3 && !selectedBank)}
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

      {/* Receipt Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto mt-10">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Resit Pembayaran Zakat</h3>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div
                ref={receiptRef}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4"
              >
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-8 text-center relative">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="grid grid-cols-10 grid-rows-10 h-full">
                      {[...Array(100)].map((_, i) => (
                        <div key={i} className="border border-white/5"></div>
                      ))}
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight">ZakatPay™</h2>
                  <p className="text-lg mt-2 font-medium">RESIT PEMBAYARAN ZAKAT</p>
                  <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between mb-8 border-b border-gray-100 pb-6">
                    <div className="mb-4 md:mb-0 bg-gray-50 p-4 rounded-lg flex-1 mr-0 md:mr-4">
                      <p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Nombor Resit</p>
                      <p className="font-medium text-gray-800 text-lg">{receiptId}</p>

                      <div className="flex items-center mt-4">
                        <div className="mr-6">
                          <p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Tarikh</p>
                          <p className="font-medium text-gray-800">{new Date().toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Masa</p>
                          <p className="font-medium text-gray-800">{new Date().toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg flex-1">
                      <p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Pembayar</p>
                      <p className="font-medium text-gray-800 text-lg">{formData.nama || 'MUHAMMAD HAZRIL FAHMI'}</p>

                      <div className="mt-4">
                        <p className="text-gray-500 text-sm uppercase tracking-wider mb-1">No. Pengenalan</p>
                        <p className="font-medium text-gray-800">{formData.nomorId || '031111010755'}</p>
                      </div>

                      <div className="mt-4">
                        <p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Email</p>
                        <p className="font-medium text-gray-800">{formData.email || 'user@example.com'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Butiran Pembayaran</h3>
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="py-4 px-6 text-left font-medium text-gray-600 uppercase tracking-wider">Butiran</th>
                            <th className="py-4 px-6 text-right font-medium text-gray-600 uppercase tracking-wider">Nilai</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="py-4 px-6 text-gray-800">Jenis Zakat</td>
                            <td className="py-4 px-6 text-right text-gray-800 font-medium">{formData.jenisZakat}</td>
                          </tr>
                          <tr>
                            <td className="py-4 px-6 text-gray-800">Haul / Tahun</td>
                            <td className="py-4 px-6 text-right text-gray-800 font-medium">{formData.tahun}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="py-4 px-6 text-gray-800 font-semibold">Jumlah</td>
                            <td className="py-4 px-6 text-right text-gray-800 font-bold">RM {formData.jumlah || '0.00'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600 font-medium">JUMLAH KESELURUHAN:</p>
                      <p className="text-right font-bold text-xl text-emerald-700">RM {formData.jumlah || '0.00'}</p>
                    </div>
                  </div>

                  {txHash && (
                    <div className="mt-8 bg-blue-50 p-5 rounded-lg border border-blue-100">
                      <div className="flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <p className="font-semibold text-gray-800">Transaksi Blockchain</p>
                      </div>
                      <p className="text-blue-600 font-mono text-sm break-all bg-white p-3 rounded border border-blue-100">{txHash}</p>
                      <a
                        href={`https://sepolia.scrollscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-flex items-center"
                      >
                        Lihat di Block Explorer
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}

                  <div className="mt-8 text-center">
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 inline-block">
                      <svg className="w-8 h-8 text-emerald-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <p className="text-emerald-800 font-medium">Pembayaran Telah Disahkan</p>
                    </div>
                    <p className="mt-4 text-gray-600">Terima kasih atas pembayaran zakat anda.</p>
                    <p className="mt-1 text-gray-600">Semoga Allah memberkati harta dan kehidupan anda.</p>
                  </div>

                  <div className="mt-10 pt-6 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-500">© {new Date().getFullYear()} ZakatPay™ - Sistem Pembayaran Zakat Digital</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center space-x-4">
                  <button
                    onClick={handlePrintReceipt}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center justify-center shadow-md transition-all duration-200 hover:shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2zm2-4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Cetak Resit
                  </button>
                  <button
                    onClick={() => setIsReceiptModalOpen(false)}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 flex items-center justify-center shadow-md transition-all duration-200 hover:shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
