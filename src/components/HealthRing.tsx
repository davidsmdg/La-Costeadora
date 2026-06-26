import React from 'react';
import { motion } from 'framer-motion';

interface HealthRingProps {
  goal: number;
  balance: number;
  surplus: number;
  contributions: {
    name: string;
    value: number;
    color: string;
    unitsSold?: number;
  }[];
}

export default function HealthRing({ goal, balance, surplus, contributions }: HealthRingProps) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  // Combine surplus (advantage) and project contributions into segments
  const allSegments: { name: string; value: number; color: string; unitsSold?: number }[] = [];
  
  if (surplus > 0) {
    allSegments.push({
      name: 'Ventaja Mes Anterior',
      value: surplus,
      color: '#D4AF37', // Gold color
    });
  }

  contributions.forEach(c => {
    if (c.value > 0) {
      allSegments.push({
        name: c.name,
        value: c.value,
        color: c.color,
        unitsSold: c.unitsSold
      });
    }
  });

  const totalValue = surplus + contributions.reduce((acc, c) => acc + c.value, 0);
  const totalPercentage = goal > 0 ? Math.round((totalValue / goal) * 100) : 0;

  // Calculate SVG arc parameters for each segment
  let cumulativePercentage = 0;
  const renderedSegments = allSegments.map(seg => {
    const pct = goal > 0 ? (seg.value / goal) * 100 : 0;
    const drawPct = Math.min(pct, 100 - cumulativePercentage);
    const rotation = (cumulativePercentage / 100) * 360;
    const offset = circumference - (drawPct / 100) * circumference;
    
    cumulativePercentage += drawPct;

    return {
      ...seg,
      drawPct,
      rotation,
      offset,
    };
  }).filter(seg => seg.drawPct > 0);

  const formatCOP = (n: number) =>
    '$' + Math.round(n).toLocaleString('es-CO');

  const statusColor =
    totalPercentage >= 100 ? 'hsl(142 70% 45%)' : // Vibrant Emerald
    totalPercentage >= 50 ? 'hsl(262 80% 60%)' :  // Purple-600
    'hsl(350 80% 60%)';                           // Rose-500

  const remaining = Math.max(0, goal - totalValue);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div className="relative w-56 h-56 flex items-center justify-center">
        {/* SVG Ring */}
        <svg className="w-full h-full -rotate-90 transform">
          {/* Background track */}
          <circle
            cx="112"
            cy="112"
            r={radius}
            fill="transparent"
            stroke="hsl(214 32% 91%)"
            strokeWidth="16"
          />
          
          {/* Render Segmented Arcs */}
          {renderedSegments.map((seg, idx) => (
            <motion.circle
              key={idx}
              cx="112"
              cy="112"
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth="20"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: seg.offset }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: idx * 0.1 }}
              style={{
                transform: `rotate(${seg.rotation}deg)`,
                transformOrigin: '112px 112px',
              }}
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
          <span className="font-mono text-[9px] uppercase font-bold text-slate-400 tracking-[0.2em] mb-1">
            Meta Presupuestada
          </span>
          <h2 className="font-mono text-2xl font-black text-slate-800 leading-none">
            {formatCOP(goal)}
          </h2>
          <div 
            className="mt-2 px-3 py-1 rounded-full border" 
            style={{ 
              backgroundColor: `${statusColor}10`, 
              borderColor: `${statusColor}30` 
            }}
          >
            <span className="font-mono text-xs font-bold" style={{ color: statusColor }}>
              {totalPercentage}% cubierto
            </span>
          </div>
        </div>
      </div>

      {/* Legend Breakdown */}
      <div className="w-full bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-3">
        <h3 className="font-disp font-extrabold text-[10px] uppercase tracking-wider text-slate-400 mb-1">
          Desglose del Mes
        </h3>

        {allSegments.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-2">
            No hay ingresos registrados ni ventaja para este mes.
          </p>
        ) : (
          <div className="divide-y divide-slate-50">
            {allSegments.map((seg, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="font-disp font-bold text-slate-700">
                    {seg.name}
                  </span>
                  {seg.unitsSold !== undefined && (
                    <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                      {seg.unitsSold} un. vendidas
                    </span>
                  )}
                </div>
                <span className="font-mono font-black text-slate-800">
                  {formatCOP(seg.value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Goal Summary */}
        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
          <span className="font-text text-slate-400 font-medium">
            Total Recaudado:
          </span>
          <span className="font-mono font-black text-slate-800">
            {formatCOP(totalValue)}
          </span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="font-text text-slate-400 font-medium">
            {remaining > 0 ? 'Faltan para la meta:' : 'Excedente acumulado:'}
          </span>
          <span 
            className="font-mono font-black"
            style={{ color: remaining > 0 ? 'hsl(350 80% 60%)' : 'hsl(142 70% 45%)' }}
          >
            {remaining > 0 ? formatCOP(remaining) : formatCOP(totalValue - goal)}
          </span>
        </div>
      </div>
    </div>
  );
}
