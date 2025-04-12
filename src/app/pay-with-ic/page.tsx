'use client';

import { useState, useEffect } from 'react';

interface NFCRecord {
    recordType: string;
    mediaType?: string;
    data: string;
    encoding?: string;
    lang?: string;
}

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

    function processPayment(userId: string) {
        // In a real app, this would involve processing a payment
        setUserId(userId);
        setPaymentComplete(true);
        setIsReading(false);
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
            <div className="w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6">Pay with NFC</h1>

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
                        <p className="text-green-700 dark:text-green-300 mb-6">
                            User ID: {userId}
                        </p>
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
                                    ? 'bg-blue-600 text-white'
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
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700'
                                    }`}
                            >
                                Payment
                            </button>
                        </div>

                        {mode === 'product' && (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold mb-3">Cart</h2>
                                    {cart.length === 0 ? (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                            <p className="text-gray-500 dark:text-gray-400">
                                                No products added yet. Scan a product to add it to cart.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
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
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                    >
                                        Scan Products
                                    </button>
                                )}
                            </>
                        )}

                        {mode === 'payment' && (
                            <>
                                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <h2 className="text-lg font-semibold mb-2">Order Summary</h2>
                                    <p className="text-lg font-bold">Total: RM {totalPrice.toFixed(2)}</p>
                                </div>

                                {isReading ? (
                                    <div className="p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center mb-6">
                                        <div className="animate-pulse mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-blue-800 dark:text-blue-200 font-medium">
                                            Waiting for payment card...
                                        </p>
                                        <p className="text-blue-600 dark:text-blue-300 text-sm mt-2">
                                            Hold your ID card near the device
                                        </p>
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

                <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h2 className="font-medium mb-2">Instructions:</h2>
                    <ol className="list-decimal list-inside text-sm space-y-2">
                        <li>First scan your products by clicking "Scan Products"</li>
                        <li>Hold each product&apos;s NFC tag near your device</li>
                        <li>When done, click "Payment" to proceed</li>
                        <li>Click "Pay Now" and scan your ID card to complete payment</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}