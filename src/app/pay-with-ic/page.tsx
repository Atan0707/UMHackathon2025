'use client';

import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import contractAbi from '@/contracts/abi.json';
import { CONTRACT_ADDRESS, RPC_URL } from '@/utils/config';

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
    isAllowed?: boolean;
}

// Dummy product data
const productData: { [key: string]: Product } = {
    'A01': { id: 'A01', name: 'Water', price: 2 },
    'A02': { id: 'A02', name: 'Chicken', price: 14 },
    'A03': { id: 'A03', name: 'Rice', price: 30 },
    'A04': { id: 'A04', name: 'Meat', price: 20 },
    'A06': { id: 'A06', name: 'Alcohol', price: 20 },
};

// Blockchain configuration
const SHOP_OWNER_ID = '000000-01-0001';

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

    // Allowed items state
    const [allowedItems, setAllowedItems] = useState<string[]>([]);
    const [isLoadingAllowedItems, setIsLoadingAllowedItems] = useState(false);

    // Check if Web NFC is supported
    const isNfcSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

    // Calculate total price
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Calculate unallowed items
    const unallowedItems = cart.filter(item => !item.isAllowed);
    const hasUnallowedItems = unallowedItems.length > 0;

    // Add an NFC reader reference
    const ndefReaderRef = useRef<any>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Fetch allowed items from blockchain
    async function fetchAllowedItems() {
        try {
            setIsLoadingAllowedItems(true);

            // Create provider and connect to the network
            const provider = new ethers.JsonRpcProvider(RPC_URL);

            // Create the contract instance (read-only)
            const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, provider);

            // Get total number of allowed items
            const totalAllowedItems = await contract.getTotalAllowedItems();
            const count = Number(totalAllowedItems);

            // Fetch all allowed item codes
            const allowedItemsArray: string[] = [];
            for (let i = 0; i < count; i++) {
                const itemCode = await contract.itemCodes(i);
                allowedItemsArray.push(itemCode);
            }

            setAllowedItems(allowedItemsArray);

            // Update existing cart items with allowed status
            setCart(prevCart =>
                prevCart.map(item => ({
                    ...item,
                    isAllowed: allowedItemsArray.includes(item.id)
                }))
            );

        } catch (error) {
            console.error('Error fetching allowed items:', error);
        } finally {
            setIsLoadingAllowedItems(false);
        }
    }

    // Remove unallowed items from cart
    function removeUnallowedItems() {
        setCart(prevCart => prevCart.filter(item => item.isAllowed));
    }

    // Remove specific item from cart
    function removeItemFromCart(itemId: string) {
        setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    }

    // Read functions
    async function startReading() {
        if (!isNfcSupported) {
            setReadStatus('error');
            setReadErrorMessage('Web NFC is not supported in this browser. Try Chrome on Android.');
            return;
        }

        try {
            // First clean up any existing scan
            stopReading();

            setIsReading(true);
            setReadStatus('reading');
            setReadErrorMessage('');

            // Create a new abort controller
            abortControllerRef.current = new AbortController();
            const signal = abortControllerRef.current.signal;

            // @ts-expect-error - TypeScript might not have NDEFReader types
            ndefReaderRef.current = new NDEFReader();
            await ndefReaderRef.current.scan({ signal });

            ndefReaderRef.current.addEventListener("reading", ({ message }: NDEFReadingEvent) => {
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
            }, { signal });

            ndefReaderRef.current.addEventListener("error", (error: NDEFErrorEvent) => {
                console.error(error);
                setReadStatus('error');
                setReadErrorMessage(error.message || 'Failed to read NFC tag');
            }, { signal });

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
                    // Add new product to cart with allowed status
                    return [...prevCart, {
                        ...product,
                        quantity: 1,
                        isAllowed: allowedItems.includes(productId)
                    }];
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

            // Don't proceed if there are unallowed items
            if (hasUnallowedItems) {
                throw new Error("One or more items in your cart are not allowed for purchase with Zakat tokens.");
            }

            const amount = ethers.parseUnits(totalPrice.toString() || '4', 4);

            // Create a wallet with the private key
            const wallet = new ethers.Wallet(privateKey, provider);

            // Create the contract instance
            const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, wallet);

            // Extract item codes from cart
            const itemCodes = cart.map(item => item.id);

            // Call the spendTokensForItems function with user ID, shop owner ID, total amount, and item codes
            const tx = await contract.spendTokensForItems(
                userId,
                SHOP_OWNER_ID,
                amount,
                itemCodes
            );

            // Set the transaction hash
            setTxHash(tx.hash);

            // Wait for the transaction to be mined
            await tx.wait();

            // If we get here, the transaction was successful
            setPaymentComplete(true);
        } catch (error) {
            console.error('Payment processing error:', error);
            setReadStatus('error');

            // Display more specific error for non-allowed items
            if (error instanceof Error && error.message.includes("not allowed for purchase")) {
                setReadErrorMessage("One or more items in your cart are not allowed for purchase with Zakat tokens.");
            } else {
                setReadErrorMessage(error instanceof Error ? error.message : 'Failed to process payment on blockchain');
            }
        } finally {
            setIsProcessing(false);
            setIsReading(false);
        }
    }

    function stopReading() {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsReading(false);
        setReadStatus('idle');
    }

    function clearCart() {
        setCart([]);
        setUserId(null);
        setPaymentComplete(false);
        setMode('product');
    }

    // Fetch allowed items when component mounts
    useEffect(() => {
        fetchAllowedItems();
    }, []);

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
            {isLoadingAllowedItems ? (
                <div className="w-full max-w-4xl mx-auto p-8 bg-gray-800/30 backdrop-blur-md rounded-xl shadow-lg border border-gray-700/50">
                    <h1 className="text-2xl font-bold text-center mb-6 text-white">Pay</h1>
                    <div className="p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                        <div className="animate-pulse mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-blue-800 dark:text-blue-200 font-medium">
                            Loading allowed items from blockchain...
                        </p>
                    </div>
                </div>
            ) : (
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
                                    onClick={() => {
                                        setMode('payment');
                                        if (isReading) {
                                            stopReading();
                                        }
                                    }}
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

                            {hasUnallowedItems && (
                                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                                            Warning: You have {unallowedItems.length} unallowed items in your cart
                                        </p>
                                        <button
                                            onClick={removeUnallowedItems}
                                            className="px-2 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
                                        >
                                            Remove All
                                        </button>
                                    </div>
                                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                                        These items cannot be purchased with Zakat tokens.
                                    </p>
                                </div>
                            )}

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
                                                            <th className="py-2 px-4 text-center text-sm font-medium">Status</th>
                                                            <th className="py-2 px-4 text-center text-sm font-medium">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {cart.map((item) => (
                                                            <tr key={item.id} className={`border-t border-gray-200 dark:border-gray-700 ${!item.isAllowed ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                                                                <td className="py-3 px-4 text-sm">{item.name}</td>
                                                                <td className="py-3 px-4 text-center text-sm">{item.quantity}</td>
                                                                <td className="py-3 px-4 text-right text-sm">RM {(item.price * item.quantity).toFixed(2)}</td>
                                                                <td className="py-3 px-4 text-center text-sm">
                                                                    {item.isAllowed ? (
                                                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-xs">
                                                                            Allowed
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-full text-xs">
                                                                            Not Allowed
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-3 px-4 text-center text-sm">
                                                                    <button
                                                                        onClick={() => removeItemFromCart(item.id)}
                                                                        className="p-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                                                            <td className="py-3 px-4 font-medium" colSpan={2}>Total</td>
                                                            <td className="py-3 px-4 text-right font-medium">RM {totalPrice.toFixed(2)}</td>
                                                            <td colSpan={2}></td>
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

                                    {hasUnallowedItems && (
                                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                            <p className="text-red-800 dark:text-red-200 font-medium mb-2">
                                                Cannot proceed with payment
                                            </p>
                                            <p className="text-red-700 dark:text-red-300 text-sm">
                                                Please remove unallowed items from your cart before proceeding.
                                            </p>
                                            <button
                                                onClick={removeUnallowedItems}
                                                className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                                            >
                                                Remove All Unallowed Items
                                            </button>
                                        </div>
                                    )}

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
                                            disabled={!isNfcSupported || hasUnallowedItems}
                                            className={`w-full p-3 mb-6 rounded-lg font-medium ${!isNfcSupported || hasUnallowedItems
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
            )}
        </div>
    );
}