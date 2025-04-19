"use client";

import Link from "next/link";

interface ReceiptLinkProps {
  receiptId: string;
  className?: string;
  buttonText?: string;
}

export default function ReceiptLink({ 
  receiptId, 
  className = "px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center",
  buttonText = "View Receipt"
}: ReceiptLinkProps) {
  return (
    <Link href={`/receipt/${receiptId}`} className={className}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4 mr-2" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
        />
      </svg>
      {buttonText}
    </Link>
  );
} 