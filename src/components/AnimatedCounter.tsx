"use client";

import { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  value: string | number;
  prefix?: string;
  duration?: number;
  className?: string;
  key?: string | number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = "",
  duration = 1500,
  className = "text-3xl font-medium text-gray-100",
}) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<number>(0);
  const finalValue = parseFloat(String(value).replace(/,/g, ''));
  const [animationTrigger, setAnimationTrigger] = useState(0);
  
  // Reset animation when value changes
  useEffect(() => {
    setAnimationTrigger(prev => prev + 1);
  }, [value]);
  
  useEffect(() => {
    // Don't animate if value is not a number
    if (isNaN(finalValue)) {
      setCount(0);
      return;
    }
    
    // Reset counter
    countRef.current = 0;
    setCount(0);
    
    let startTime: number | null = null;
    let animationFrameId: number;
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);
      
      // Use easeOutExpo for smoother animation near the end
      const easing = 1 - Math.pow(1 - progressRatio, 3);
      const nextCount = easing * finalValue;
      
      countRef.current = nextCount;
      setCount(nextCount);
      
      if (progress < duration) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        // Make sure we end exactly at the target value
        countRef.current = finalValue;
        setCount(finalValue);
      }
    };
    
    animationFrameId = requestAnimationFrame(step);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [finalValue, duration, animationTrigger]);
  
  // Format the number with commas and fixed decimal places
  const formattedCount = () => {
    // For whole numbers
    if (Number.isInteger(finalValue)) {
      return Math.round(count).toLocaleString();
    }
    
    // For decimal numbers, maintain the same decimal places as the final value
    const valueAsString = String(value);
    const decimalPlaces = (valueAsString.split('.')[1] || '').length;
    
    return count.toLocaleString('en-MY', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });
  };
  
  return (
    <div className={className}>
      <span className="inline-block text-center min-w-[1.5ch]">{prefix} {formattedCount()}</span>
    </div>
  );
};

export default AnimatedCounter; 