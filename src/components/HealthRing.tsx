import React from 'react';
import { motion } from 'framer-motion';

interface HealthRingProps {
  current: number;
  goal: number;
  balance: number;
}

export default function HealthRing({ current, goal, balance }: HealthRingProps) {
  const percentage = Math.min(Math.round((current / goal) * 100), 100) || 0;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6 relative">
      <div className="relative w-56 h-56 flex items-center justify-center">
        {/* SVG Ring */}
        <svg className="w-full h-full -rotate-90 transform">
          {/* Background circle */}
          <circle
            cx="112"
            cy="112"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="20"
            className="text-zinc-100"
          />
          {/* Progress circle */}
          <motion.circle
            cx="112"
            cy="112"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="24"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            className="text-pop-blue"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-[9px] uppercase font-bold text-zinc-400 tracking-[0.2em] mb-1">Saldo Actual</span>
          <h2 className="font-mono text-3xl font-black text-black">${balance.toLocaleString()}</h2>
          <div className="mt-2 bg-pop-blue/5 px-3 py-1 rounded-full border border-pop-blue/20">
            <span className="font-mono text-xs font-bold text-pop-blue">{percentage}% Meta</span>
          </div>
        </div>
      </div>
    </div>
  );
}
