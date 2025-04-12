"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, RPC_URL } from "@/utils/config";

// ABI for owner check only
const CONTRACT_ABI = ["function owner() view returns (address)"];

export default function Navbar() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const pathname = usePathname();

  const formatAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkOwnership = useCallback(async () => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const contractOwner = await contract.owner();
      setIsOwner(contractOwner.toLowerCase() === address?.toLowerCase());
    } catch (error) {
      console.error("Error checking ownership:", error);
      setIsOwner(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      checkOwnership();
    } else {
      setIsOwner(false);
    }
  }, [isConnected, address, checkOwnership]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleConnected = () => {
        toast.success("Wallet Connected", {
          description: "Your wallet has been connected successfully.",
          icon: "🦊",
        });
      };

      const handleDisconnected = () => {
        toast.error("Wallet Disconnected", {
          description: "Your wallet has been disconnected.",
          icon: "🔌",
        });
      };

      const handleChainChanged = () => {
        toast.info("Network Changed", {
          description: "You have switched to a different blockchain network.",
          icon: "🔄",
        });
      };

      document.addEventListener("appkit:connected", handleConnected);
      document.addEventListener("appkit:disconnected", handleDisconnected);
      document.addEventListener("appkit:chain-changed", handleChainChanged);

      return () => {
        document.removeEventListener("appkit:connected", handleConnected);
        document.removeEventListener("appkit:disconnected", handleDisconnected);
        document.removeEventListener("appkit:chain-changed", handleChainChanged);
      };
    }
  }, []);

  const handleConnectClick = () => {
    open();
  };

  useEffect(() => {
    const handleRouteChange = () => {
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, [mobileMenuOpen]);

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-20 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent">
                ZAKAT
              </span>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-6">
              {[
                { name: "Home", path: "/" },
                { name: "Live Ledger", path: "/live-ledger" },
                // { name: "Pay Zakat", path: "/pay-zakat" },
                { name: "Semak Baki", path: "/semak-baki" },
                { name: "Zakat Calculator", path: "/calculator" },
                { name: "Bayar Online", path: "/bayar" }
              ].map((item, index) => (
                <Link
                  key={index}
                  href={item.path}
                  className={`group relative px-1 py-2 text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                  }`}
                >
                  {item.name}
                  <span className={`absolute -bottom-0.5 left-0 h-0.5 bg-emerald-500 transition-all duration-200 ${
                    isActive(item.path) ? "w-full" : "w-0 group-hover:w-full"
                  }`}></span>
                </Link>
              ))}
              
              {isOwner && (
                <Link
                  href="/agih-zakat"
                  className={`group relative px-1 py-2 text-sm font-medium transition-colors ${
                    isActive("/agih-zakat")
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                  }`}
                >
                  Agih Zakat
                  <span className={`absolute -bottom-0.5 left-0 h-0.5 bg-emerald-500 transition-all duration-200 ${
                    isActive("/agih-zakat") ? "w-full" : "w-0 group-hover:w-full"
                  }`}></span>
                </Link>
              )}
              {/* {isConnected && (
                <Link
                  href="#"
                  className={`group relative px-1 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                    isActive("#")
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Profile
                  <span className={`absolute -bottom-0.5 left-0 h-0.5 bg-emerald-500 transition-all duration-200 ${
                    isActive("#") ? "w-full" : "w-0 group-hover:w-full"
                  }`}></span>
                </Link>
              )} */}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {mounted && (
              <>
                {isConnected && address ? (
                  <button
                    onClick={() => {
                      open({ view: "Account" });
                      toast("Account Details", {
                        description: "Viewing your wallet account details.",
                        icon: "👤",
                      });
                    }}
                    className="px-3 py-1.5 rounded-md bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-2 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    {formatAddress(address)}
                  </button>
                ) : (
                  <button
                    onClick={handleConnectClick}
                    className="px-4 py-1.5 rounded-md bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
                  >
                    Connect
                  </button>
                )}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none md:hidden"
                  aria-expanded={mobileMenuOpen}
                >
                  <span className="sr-only">Open main menu</span>
                  <svg
                    className={`${mobileMenuOpen ? "hidden" : "block"} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  <svg
                    className={`${mobileMenuOpen ? "block" : "hidden"} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md">
              {[
                { name: "Home", path: "/" },
                { name: "Live Ledger", path: "/live-ledger" },
                { name: "Pay Zakat", path: "/pay-zakat" },
                { name: "Check Balance", path: "/check-balance" },
                { name: "Zakat Calculator", path: "/calculator" },
                { name: "Bayar Online", path: "/bayar" }
              ].map((item, index) => (
                <Link
                  key={index}
                  href={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {isOwner && (
                <Link
                  href="/agih-zakat"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive("/agih-zakat")
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Agih Zakat
                </Link>
              )}
              {isConnected && (
                <Link
                  href="#"
                  className={`px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center ${
                    isActive("#")
                      ? "text-emerald-600 dark:text-emerald-400 bg-gray-50 dark:bg-gray-800"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Profile
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}