"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ethers } from "ethers";
import { RPC_URL, ZAKAT_NFT_CONTRACT_ADDRESS } from "@/utils/config";
import zakatNFTAbi from "@/contracts/ZakatNFTAbi.json";
import Image from "next/image";
import { format } from "date-fns";

// Define type for receipt data
interface ReceiptData {
  receiptId: string;
  name: string;
  icNumber: string;
  email: string;
  phoneNumber: string;
  zakatType: string;
  amount: string;
  timestamp: Date;
  transactionHash: string;
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const receiptId = params.receiptId as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReceiptData = async () => {
      try {
        setLoading(true);
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(
          ZAKAT_NFT_CONTRACT_ADDRESS,
          zakatNFTAbi,
          provider
        );

        // Get token ID from receipt ID
        const tokenId = await contract.getTokenIdByReceiptId(receiptId);
        
        // Get receipt data from token ID
        const data = await contract.getReceiptData(tokenId);
        
        // Format the data (convert timestamp to Date, format amount)
        const formattedData: ReceiptData = {
          receiptId: data.receiptId,
          name: data.name,
          icNumber: data.icNumber,
          email: data.email,
          phoneNumber: data.phoneNumber,
          zakatType: data.zakatType,
          amount: (Number(ethers.formatUnits(data.amount, 4))).toString(),
          timestamp: new Date(Number(data.timestamp) * 1000),
          transactionHash: data.transactionHash,
        };
        
        setReceiptData(formattedData);
        setLoading(false);
      } catch (err: unknown) {
        console.error("Error fetching receipt data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch receipt data");
        setLoading(false);
      }
    };

    if (receiptId) {
      fetchReceiptData();
    }
  }, [receiptId]);

  const handlePrint = () => {
    window.print();
  };

//   const handleDownloadPDF = async () => {
//     if (!receiptRef.current) return;

//     try {
//       // Create canvas from the receipt element
//       const canvas = await html2canvas(receiptRef.current, {
//         scale: 2,
//         logging: false,
//         useCORS: true,
//       });
      
//       // Create PDF
//       const imgData = canvas.toDataURL("image/png");
//       const pdf = new jsPDF({
//         orientation: "portrait",
//         unit: "mm",
//         format: "a4",
//       });
      
//       const imgWidth = 210; // A4 width in mm
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
//       pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
//       pdf.save(`ZakatReceipt-${receiptId}.pdf`);
//     } catch (err) {
//       console.error("Error generating PDF:", err);
//       alert("Failed to download PDF. Please try again.");
//     }
//   };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        <p className="mt-4 text-gray-600">Loading receipt data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Receipt Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md w-full text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Receipt Data</h2>
          <p className="text-gray-600 mb-6">Receipt data could not be found. Please check the receipt ID.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-container, .receipt-container * {
            visibility: visible;
          }
          .receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 pt-12">
        <div className="no-print fixed top-0 left-0 w-full bg-transparent z-10 flex justify-between items-center px-6 py-2">
          {/* <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800 flex items-center bg-gray-50 rounded-lg px-3 py-1 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button> */}
        </div>

        <div 
          ref={receiptRef}
          className="receipt-container bg-white border border-gray-200 rounded-lg shadow-lg max-w-2xl w-full p-8 mb-10"
        >
          <div className="relative border-b border-gray-100 pb-6 mb-6 text-center">
            <div className="grid grid-cols-3 items-center mb-4">
              <div className="col-start-2 flex justify-center">
                <div className="relative h-16 w-16">
                  <Image 
                    src="/images/logobiru.png" 
                    alt="ZakatPay Logo"
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500">Blockchain Verified</span>
                <div className="inline-flex items-center bg-emerald-50 px-2 py-1 rounded text-xs text-emerald-700 mt-1">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 mr-1 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.177-7.86l-2.765-2.767L7 12.431l3.119 3.121a1 1 0 001.414 0l5.952-5.95-1.062-1.062-5.6 5.6z" />
                  </svg>
                  Verified
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">ZakatPay™</h2>
            <p className="text-lg mt-2 font-medium">ZAKAT RECEIPT</p>
            <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between mb-8 border-b border-gray-100 pb-6">
            <div className="mb-4 md:mb-0 bg-gray-50 p-4 rounded-lg flex-1 mr-0 md:mr-4">
              <p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Receipt Number</p>
              <p className="font-medium text-gray-800">{receiptData.receiptId}</p>
              
              <div className="mt-4">
                <p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Date & Time</p>
                <p className="font-medium text-gray-800">
                  {format(receiptData.timestamp, "dd MMM yyyy, h:mm a")}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg flex-1">
              <p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Name</p>
              <p className="font-medium text-gray-800">{receiptData.name}</p>
              
              <div className="mt-4">
                <p className="text-gray-500 text-sm uppercase tracking-wider mb-1">IC Number</p>
                <p className="font-medium text-gray-800">{receiptData.icNumber}</p>
              </div>

              <div className="mt-4">
                <p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Email</p>
                <p className="font-medium text-gray-800">{receiptData.email}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Payment Details</h3>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-4 px-6 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Detail</th>
                    <th className="py-4 px-6 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="py-4 px-6 text-sm text-gray-700">Zakat Type</td>
                    <td className="py-4 px-6 text-sm text-gray-900 text-right font-medium">{receiptData.zakatType}</td>
                  </tr>
                  <tr className="bg-emerald-50">
                    <td className="py-4 px-6 text-sm font-semibold text-gray-800">Amount</td>
                    <td className="py-4 px-6 text-emerald-700 font-bold text-right">RM {receiptData.amount}.00 </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Transaction Hash</p>
            <div className="flex items-center">
              <p className="text-xs text-gray-700 font-mono break-all">{receiptData.transactionHash}</p>
            </div>
            <a
              href={`https://sepolia.scrollscan.com/tx/${receiptData.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors no-print"
            >
              View on Blockchain Explorer
            </a>
          </div>

          <div className="flex items-center justify-center border-t border-gray-100 pt-6">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">Thank you for your zakat payment.</p>
              <p className="text-sm text-gray-600 mt-1">May Allah bless your wealth and life.</p>
            </div>
          </div>
        </div>
        
        <div className="no-print flex gap-3 mb-12">
          <button
            onClick={handlePrint}
            className="px-6 py-3 w-full bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center text-lg font-medium shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
            </svg>
            Print Receipt
          </button>
          {/* <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button> */}
        </div>
      </div>
    </>
  );
} 