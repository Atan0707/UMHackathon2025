'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractAbi from '@/contracts/abi.json';
import { CONTRACT_ADDRESS, RPC_URL } from '@/utils/config';

// interface NFCRecord {
//     recordType: string;
//     mediaType?: string;
//     data: string;
//     encoding?: string;
//     lang?: string;
// }

interface NDEFReadingEvent {
    message: {
        records: Array<{
            recordType: string;
            mediaType?: string;
            data: ArrayBuffer;
            encoding?: string;
            lang?: string;
        }>;
    };
}

interface NDEFErrorEvent {
    message?: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
}

interface CartItem extends Product {
    quantity: number;
}

// Dummy product data
const productData: { [key: string]: Product } = {
    'P001': { id: 'P001', name: 'Water', price: 2 },
    'P002': { id: 'P002', name: 'Chicken', price: 14 },
};

// Blockchain configuration
const SHOP_OWNER_ID = '011117-10-1111'; // Hardcoded shop owner ID

export default function Home() {
    // Mode state
    const [mode, setMode] = useState<'product' | 'payment'>('product');

    // Read state
    const [readStatus, setReadStatus] = useState<'idle' | 'reading' | 'error'>('idle');
    const [readErrorMessage, setReadErrorMessage] = useState('');
    const [isReading, setIsReading] = useState(false);

    // Cart state
    const [cart, setCart] = useState<CartItem[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [paymentComplete, setPaymentComplete] = useState(false);

    // Blockchain state
    const [txHash, setTxHash] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Check if Web NFC is supported
    const isNfcSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

    // Calculate total price
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Read functions
    async function startReading() {
        if (!isNfcSupported) {
            setReadStatus('error');
            setReadErrorMessage('Web NFC is not supported in this browser. Try Chrome on Android.');
            return;
        }

        try {
            setIsReading(true);
            setReadStatus('reading');
            setReadErrorMessage('');

            // @ts-expect-error - TypeScript might not have NDEFReader types
            const ndef = new NDEFReader();
            await ndef.scan();

            ndef.addEventListener("reading", ({ message }: NDEFReadingEvent) => {
                // Process all records from the message
                for (const record of message.records) {
                    if (record.recordType === "text") {
                        const textDecoder = new TextDecoder(record.encoding || 'utf-8');
                        const data = textDecoder.decode(record.data);

                        if (mode === 'product') {
                            processProductScan(data);
                        } else if (mode === 'payment') {
                            processPayment(data);
                        }
                    }
                }

                setReadStatus('idle');
            });

            ndef.addEventListener("error", (error: NDEFErrorEvent) => {
                console.error(error);
                setReadStatus('error');
                setReadErrorMessage(error.message || 'Failed to read NFC tag');
            });

        } catch (error) {
            console.error(error);
            setReadStatus('error');
            setReadErrorMessage(error instanceof Error ? error.message : 'Failed to read NFC tag');
            setIsReading(false);
        }
    }

    function processProductScan(productId: string) {
        if (productData[productId]) {
            const product = productData[productId];

            setCart(prevCart => {
                const existingItemIndex = prevCart.findIndex(item => item.id === productId);

                if (existingItemIndex !== -1) {
                    // Create a new array with the updated item
                    const newCart = [...prevCart];
                    newCart[existingItemIndex] = {
                        ...newCart[existingItemIndex],
                        quantity: newCart[existingItemIndex].quantity + 1
                    };
                    return newCart;
                } else {
                    // Add new product to cart
                    return [...prevCart, { ...product, quantity: 1 }];
                }
            });
        } else {
            setReadStatus('error');
            setReadErrorMessage(`Unknown product ID: ${productId}`);
        }
    }

    async function processPayment(userId: string) {
        try {
            setIsProcessing(true);
            setUserId(userId);

            // Create provider and connect to the network
            const provider = new ethers.JsonRpcProvider(RPC_URL);

            // Get the private key from environment variable
            const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;

            if (!privateKey) {
                throw new Error("Private key not found in environment variables");
            }

            const amount = ethers.parseEther(totalPrice.toString() || '0');

            // Create a wallet with the private key
            const wallet = new ethers.Wallet(privateKey, provider);

            // Create the contract instance
            const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, wallet);

            // Call the spendTokens function with user ID, shop owner ID, and total amount
            const tx = await contract.spendTokens(
                userId,
                SHOP_OWNER_ID,
                amount
            );

            // Set the transaction hash
            setTxHash(tx.hash);

            // Wait for the transaction to be mined
            const receipt = await tx.wait();

            // If we get here, the transaction was successful
            setPaymentComplete(true);
        } catch (error) {
            console.error('Payment processing error:', error);
            setReadStatus('error');
            setReadErrorMessage(error instanceof Error ? error.message : 'Failed to process payment on blockchain');
        } finally {
            setIsProcessing(false);
            setIsReading(false);
        }
    }

    function stopReading() {
        setIsReading(false);
        setReadStatus('idle');
    }

    function clearCart() {
        setCart([]);
        setUserId(null);
        setPaymentComplete(false);
        setMode('product');
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isReading) {
                stopReading();
            }
        };
    }, [isReading]);

    return (
        <div className="flex flex-col items-center min-h-screen p-8">
            <div className="w-full max-w-4xl mx-auto p-8 bg-gray-800/30 backdrop-blur-md rounded-xl shadow-lg border border-gray-700/50">
                <h1 className="text-2xl font-bold text-center mb-6 text-white">Pay</h1>

                {!isNfcSupported && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-red-800 dark:text-red-200">
                            Your browser doesn&apos;t support the Web NFC API. Please use Chrome on Android.
                        </p>
                    </div>
                )}

                {paymentComplete ? (
                    <div className="p-8 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                        <div className="mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
                            Payment Successful!
                        </h2>
                        <p className="text-green-700 dark:text-green-300 mb-2">
                            User ID: {userId}
                        </p>
                        {txHash && (
                            <p className="text-green-700 dark:text-green-300 mb-6 break-all">
                                Transaction: {txHash}
                            </p>
                        )}
                        <button
                            onClick={clearCart}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Start New Transaction
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 flex">
                            <button
                                onClick={() => setMode('product')}
                                className={`flex-1 py-2 rounded-l-lg font-medium ${mode === 'product'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-200 text-gray-700'}`}
                            >
                                Scan Products
                            </button>
                            <button
                                onClick={() => setMode('payment')}
                                disabled={cart.length === 0}
                                className={`flex-1 py-2 rounded-r-lg font-medium ${cart.length === 0
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : mode === 'payment'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gray-200 text-gray-700'
                                    }`}
                            >
                                Payment
                            </button>
                        </div>

                        {mode === 'product' && (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold mb-3 text-white">Cart</h2>
                                    {cart.length === 0 ? (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                            <p className="text-gray-500 dark:text-gray-400">
                                                No products added yet. Scan a product to add it to cart.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden text-white">
                                            <table className="w-full">
                                                <thead className="bg-gray-100 dark:bg-gray-700">
                                                    <tr>
                                                        <th className="py-2 px-4 text-left text-sm font-medium">Product</th>
                                                        <th className="py-2 px-4 text-center text-sm font-medium">Qty</th>
                                                        <th className="py-2 px-4 text-right text-sm font-medium">Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cart.map((item) => (
                                                        <tr key={item.id} className="border-t border-gray-200 dark:border-gray-700">
                                                            <td className="py-3 px-4 text-sm">{item.name}</td>
                                                            <td className="py-3 px-4 text-center text-sm">{item.quantity}</td>
                                                            <td className="py-3 px-4 text-right text-sm">RM {(item.price * item.quantity).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                                                        <td className="py-3 px-4 font-medium" colSpan={2}>Total</td>
                                                        <td className="py-3 px-4 text-right font-medium">RM {totalPrice.toFixed(2)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {isReading ? (
                                    <button
                                        onClick={stopReading}
                                        className="w-full p-3 mb-6 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                                    >
                                        Stop Scanning
                                    </button>
                                ) : (
                                    <button
                                        onClick={startReading}
                                        disabled={!isNfcSupported}
                                        className={`w-full p-3 mb-6 rounded-lg font-medium ${!isNfcSupported
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-emerald-500 text-white hover:bg-blue-700'
                                            }`}
                                    >
                                        Scan Products
                                    </button>
                                )}
                            </>
                        )}

                        {mode === 'payment' && (
                            <>
                                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-white">
                                    <h2 className="text-lg font-semibold mb-2">Order Summary</h2>
                                    <p className="text-lg font-bold">Total: RM {totalPrice.toFixed(2)}</p>
                                    <p className="text-sm mt-2">Shop Owner ID: {SHOP_OWNER_ID}</p>
                                </div>

                                {isReading || isProcessing ? (
                                    <div className="p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center mb-6">
                                        <div className="animate-pulse mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-blue-800 dark:text-blue-200 font-medium">
                                            {isProcessing ? 'Processing payment on blockchain...' : 'Waiting for payment card...'}
                                        </p>
                                        {!isProcessing && (
                                            <p className="text-emerald-500 dark:text-blue-300 text-sm mt-2">
                                                Hold your ID card near the device
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={startReading}
                                        disabled={!isNfcSupported}
                                        className={`w-full p-3 mb-6 rounded-lg font-medium ${!isNfcSupported
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                    >
                                        Pay Now
                                    </button>
                                )}

                                <button
                                    onClick={() => setMode('product')}
                                    className="w-full p-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                                >
                                    Back to Cart
                                </button>
                            </>
                        )}

                        {readStatus === 'error' && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mt-4">
                                <p className="text-red-800 dark:text-red-200">
                                    {readErrorMessage || 'Failed to read NFC tag'}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}