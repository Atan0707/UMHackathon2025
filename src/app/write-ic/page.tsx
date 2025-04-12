'use client';

import { useState } from 'react';

interface NDEFErrorEvent {
    message?: string;
}

export default function Home() {
    // Write state
    const [message, setMessage] = useState('');
    const [writeStatus, setWriteStatus] = useState<'idle' | 'writing' | 'success' | 'error'>('idle');
    const [writeErrorMessage, setWriteErrorMessage] = useState('');

    // Check if Web NFC is supported
    const isNfcSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

    // Write function
    async function handleWrite() {
        if (!isNfcSupported) {
            setWriteStatus('error');
            setWriteErrorMessage('Web NFC is not supported in this browser. Try Chrome on Android.');
            return;
        }

        try {
            setWriteStatus('writing');
            setWriteErrorMessage('');

            // @ts-expect-error - TypeScript might not have NDEFReader types
            const ndef = new NDEFReader();
            await ndef.write({
                records: [
                    { recordType: "text", data: message }
                ]
            });

            setWriteStatus('success');
        } catch (error) {
            console.error(error);
            setWriteStatus('error');
            setWriteErrorMessage(error instanceof Error ? error.message : 'Failed to write to NFC tag');
        }
    }

    return (
        <div className="flex flex-col items-center min-h-screen p-8">
            <div className="w-full max-w-4xl mx-auto p-8 bg-gray-800/30 backdrop-blur-md rounded-xl shadow-lg border border-gray-700/50">
                <h1 className="text-2xl font-bold text-center mb-6 text-white">IC number to card</h1>

                {!isNfcSupported && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-red-800 dark:text-red-200">
                            Your browser doesn&apos;t support the Web NFC API. Please use Chrome on Android.
                        </p>
                    </div>
                )}

                <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium text-white">
                        IC number
                    </label>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="e.g., 1234123-10-1234234"
                        className="w-full p-3 border rounded-lg text-gray-200"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Format: ID-ID-ID (example: 0145304-10-3248)
                    </p>
                </div>

                <button
                    onClick={handleWrite}
                    disabled={writeStatus === 'writing' || !message}
                    className={`w-full p-3 rounded-lg font-medium text-white ${writeStatus === 'writing' || !message
                        ? 'bg-emerald-600 text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-500 text-white hover:bg-blue-700'
                        }`}
                >
                    {writeStatus === 'writing' ? 'Tap NFC Tag...' : 'Write to NFC Tag'}
                </button>

                {writeStatus === 'success' && (
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg ">
                        <p className="text-green-800 dark:text-green-200">
                            Successfully wrote to NFC tag!
                        </p>
                    </div>
                )}

                {writeStatus === 'error' && (
                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-red-800 dark:text-red-200">
                            {writeErrorMessage || 'Failed to write to NFC tag'}
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}