"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, RPC_URL } from '@/utils/config';
import contractAbi from '@/contracts/abi.json';
import Image from 'next/image';
import Link from 'next/link';

// Counter animation component
function AnimatedCounter({ end, duration = 2000, label, sublabel, prefix = "", hasDivider = true }: { 
  end: number, 
  duration?: number,
  label: string,
  sublabel: string,
  prefix?: string,
  hasDivider?: boolean
}) {
  const [count, setCount] = useState(0);
  const counterRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime: number | null = null;
          const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );
    
    const current = counterRef.current;
    
    if (current) {
      observer.observe(current);
    }
    
    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [end, duration, hasAnimated]);

  return (
    <div ref={counterRef} className="flex flex-col items-center">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="text-4xl md:text-5xl font-bold text-white">
        {prefix}{typeof count === 'number' ? count.toLocaleString('en-MY', {minimumFractionDigits: label === "Gram" ? 0 : 2, maximumFractionDigits: label === "Gram" ? 0 : 2}) : count}
      </div>
      <div className="text-xs uppercase tracking-wider text-gray-400 mt-2">{sublabel}</div>
      {hasDivider && (
        <div className="hidden md:block absolute top-1/2 -right-5 transform -translate-y-1/2 h-20 w-px bg-gray-700"></div>
      )}
    </div>
  );
}

// Slider component
function ImageSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      id: 1,
      image: '/images/zakat-slide1.jpg',
      title: 'Rezeki yang Paling Manis',
      subtitle: 'Adalah Rezeki Yang Dikongsi',
    },
    {
      id: 2,
      image: '/images/zakat-slide2.jpg',
      title: 'Zakat Membersihkan Harta',
      subtitle: 'Dan Memberkati Kehidupan',
    },
    {
      id: 3,
      image: '/images/zakat-slide3.jpg',
      title: 'Zakat Menolong Sesama',
      subtitle: 'Meringankan Beban Asnaf',
    },
  ];

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlide((prevSlide) => (prevSlide === slides.length - 1 ? 0 : prevSlide + 1));
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentSlide, slides.length]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl shadow-xl mb-12 h-[400px] md:h-[500px]">
      <div 
        className="flex transition-transform duration-700 ease-in-out h-full" 
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="min-w-full relative">
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            <div className="relative h-full w-full">
              <Image 
                src={slide.image} 
                alt={slide.title} 
                fill
                className="object-cover"
                priority={slide.id === 1}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-8 z-20 text-white bg-gradient-to-t from-black/80 to-transparent">
              <h2 className="text-2xl md:text-4xl font-bold mb-2">{slide.title}</h2>
              <p className="text-lg md:text-xl">{slide.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full ${
              currentSlide === index ? 'bg-white' : 'bg-white/40'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          ></button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [totalCollected, setTotalCollected] = useState<string>("0");
  const [totalDistributed, setTotalDistributed] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  
  // Nisab values
  const [goldNisabPrice] = useState(29740.77);
  const [silverNisabGrams] = useState(595);
  const [goldPricePerGram] = useState(472.12);
  const [silverPricePerGram] = useState(4.91);

  const fetchZakatData = async () => {
    try {
      setIsLoading(true);
      setError(false);

      // Create provider and connect to the contract
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, provider);

      // Get distributed and undistributed amounts
      const distributed = await contract.getTotalDistributedTokens();
      const undistributed = await contract.getUndistributedTokens();

      // Calculate total collected (distributed + undistributed)
      const collected = distributed + undistributed;

      // Format values (divide by 10^18 for 18 decimals and format with 2 decimal places)
      const formattedCollected = parseFloat(ethers.formatEther(collected)).toLocaleString('en-MY',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const formattedDistributed = parseFloat(ethers.formatEther(distributed)).toLocaleString('en-MY',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      setTotalCollected(formattedCollected);
      setTotalDistributed(formattedDistributed);
    } catch (err) {
      console.error('Error fetching zakat data:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchZakatData();

    // Set up interval to refresh data every 60 seconds
    const interval = setInterval(fetchZakatData, 60000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4">
        {/* Image Slider */}
        <ImageSlider />
        
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
          {/* Online Payment Card */}
          <div className="bg-[#FF6B6B] rounded-lg overflow-hidden shadow-lg">
            <Link href="/bayar" className="block p-6 h-full">
              <div className="flex items-center justify-between">
                <div className="w-1/2">
                  <h3 className="text-white text-2xl font-bold mb-1">ONLINE PAYMENT</h3>
                  <h4 className="text-white text-xl font-bold mb-3">ZAKAT HARTA</h4>
                  <p className="text-white text-sm mb-5">
                    Urusan pembayaran zakat kini lebih mudah di atas talian
                  </p>
                  <div className="inline-block bg-white text-[#FF6B6B] px-6 py-2 rounded-full font-bold">
                    BAYAR ZAKAT
                  </div>
                </div>
                <div className="w-2/5">
                  <Image 
                    src="/images/online-payment.png" 
                    alt="Online Payment" 
                    width={150} 
                    height={150} 
                    className="object-contain"
                  />
                </div>
              </div>
            </Link>
          </div>

          {/* Calculator Card */}
          <div className="bg-[#0098DA] rounded-lg overflow-hidden shadow-lg">
            <Link href="/calculator" className="block p-6 h-full">
              <div className="flex items-center justify-between">
                <div className="w-1/2">
                  <h3 className="text-white text-2xl font-bold mb-1">KALKULATOR</h3>
                  <h4 className="text-white text-xl font-bold mb-3">ZAKAT HARTA</h4>
                  <p className="text-white text-sm mb-5">
                    Kalkulator kami memudahkan pengiraan semua jenis zakat
                  </p>
                  <div className="inline-block bg-white text-[#0098DA] px-6 py-2 rounded-full font-bold">
                    KIRA ZAKAT
                  </div>
                </div>
                <div className="w-2/5">
                  <Image 
                    src="/images/calculator.png" 
                    alt="Calculator" 
                    width={150} 
                    height={150} 
                    className="object-contain"
                  />
                </div>
              </div>
            </Link>
          </div>

          {/* Check Balance Card */}
          <div className="bg-[#77C043] rounded-lg overflow-hidden shadow-lg">
            <Link href="/semak-baki" className="block p-6 h-full">
              <div className="flex items-center justify-between">
                <div className="w-1/2">
                  <h3 className="text-white text-2xl font-bold mb-1">SEMAK BAKI</h3>
                  <h4 className="text-white text-sm font-bold mb-3">MAJLIS AGAMA ISLAM MELAKA</h4>
                  <p className="text-white text-sm mb-5">
                    Semak baki zakat anda?
                  </p>
                  <div className="inline-block bg-white text-[#77C043] px-6 py-2 rounded-full font-bold">
                    BAKI ZAKAT
                  </div>
                </div>
                <div className="w-2/5">
                  <Image 
                    src="/images/distribution.png" 
                    alt="Zakat Distribution" 
                    width={150} 
                    height={150} 
                    className="object-contain"
                  />
                </div>
              </div>
            </Link>
          </div>
        </div>
        
        {/* Zakat Dashboard - Redesigned */}
        <div className="max-w-4xl mx-auto bg-gray-200 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Zakat Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Collected Zakat */}
            <div className="bg-gray-700 rounded-lg p-6 text-center">
              <div className="text-gray-300 mb-3">Total Zakat Collected</div>
              {isLoading ? (
                <div className="flex items-center justify-center h-14">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-400"></div>
                </div>
              ) : error ? (
                <div className="text-red-400 text-sm">Failed to load data</div>
              ) : (
                <div className="text-5xl font-bold text-emerald-400">RM {totalCollected}</div>
              )}
            </div>

            {/* Distributed Zakat */}
            <div className="bg-gray-700 rounded-lg p-6 text-center">
              <div className="text-gray-300 mb-3">Total Zakat Distribution</div>
              {isLoading ? (
                <div className="flex items-center justify-center h-14">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-400"></div>
                </div>
              ) : error ? (
                <div className="text-red-400 text-sm">Failed to load data</div>
              ) : (
                <div className="text-5xl font-bold text-emerald-400">RM {totalDistributed}</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Nisab Values Section */}
        <div className="w-full bg-black py-14 mt-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-white mb-3">NISAB SEMASA</h2>
            <div className="w-16 h-1 bg-emerald-500 mx-auto mb-14"></div>
            
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                <div className="flex flex-col items-center relative">
                  <AnimatedCounter 
                    end={goldNisabPrice} 
                    label="RM" 
                    sublabel="HARGA EMAS (NISAB)" 
                  />
                </div>
                
                <div className="flex flex-col items-center relative">
                  <AnimatedCounter 
                    end={silverNisabGrams} 
                    label="Gram" 
                    sublabel="NISAB PERAK" 
                  />
                </div>
                
                <div className="flex flex-col items-center relative">
                  <AnimatedCounter 
                    end={goldPricePerGram} 
                    label="RM" 
                    sublabel="HARGA EMAS PER GRAM" 
                  />
                </div>
                
                <div className="flex flex-col items-center relative">
                  <AnimatedCounter 
                    end={silverPricePerGram} 
                    label="RM" 
                    sublabel="HARGA PERAK PER GRAM"
                    hasDivider={false}
                  />
                </div>
                
                {/* Dividers for larger screens */}
                <div className="hidden md:block absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 h-28 w-px bg-white/20"></div>
                <div className="hidden md:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-28 w-px bg-white/20"></div>
                <div className="hidden md:block absolute top-1/2 left-3/4 transform -translate-x-1/2 -translate-y-1/2 h-28 w-px bg-white/20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
