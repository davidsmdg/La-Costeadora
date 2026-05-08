import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Accordion from '@radix-ui/react-accordion';
import { 
  ArrowLeft, Radar, ChevronDown, Info, ArrowUpRight, 
  Briefcase, History, TrendingDown, TrendingUp, Minus 
} from 'lucide-react';
import { useFinancialData } from '../context/FinancialDataContext';
import { Competitor } from '../types';

export default function BenchmarkPage() {
  const navigate = useNavigate();
  const { products, benchmarks, setBenchmarkData } = useFinancialData();
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [currentIndex, setCurrentIndex] = useState(0);

  // --- MOCK DATA INJECTION (Fase 6) ---
  useEffect(() => {
    if (benchmarks.length === 0 && products.length > 0) {
      const mockCompetitors: Competitor[] = [
        { id: 'c1', name: 'Studio Galería', price: 1800, description: 'Premium, empaque de lujo.' },
        { id: 'c2', name: 'Artesano Local', price: 1200, description: 'Venta en ferias, sin marca.' },
        { id: 'c3', name: 'Tienda Diseño', price: 1650, description: 'Punto físico en zona chic.' },
        { id: 'c4', name: 'Freelance Online', price: 900, description: 'Precio de entrada, baja calidad.' },
      ];
      setBenchmarkData({ productId: products[0].id, competitors: mockCompetitors });
    }
  }, [products]);

  const currentProduct = products.find(p => p.id === selectedProductId);
  const currentBenchmark = benchmarks.find(b => b.productId === selectedProductId);
  const competitors = currentBenchmark?.competitors || [];
  
  const avgPrice = competitors.length > 0 
    ? competitors.reduce((a, b) => a + b.price, 0) / competitors.length 
    : 0;

  const diffPct = currentProduct && avgPrice > 0 
    ? ((currentProduct.sellingPrice - avgPrice) / avgPrice) * 100 
    : 0;

  // Badge Logic
  const getBadge = () => {
    if (diffPct < -20) return { label: 'Económico', color: 'bg-pop-blue text-white' };
    if (diffPct > 20) return { label: 'Premium', color: 'bg-pop-green text-black' };
    return { label: 'Promedio', color: 'bg-pop-yellow text-black' };
  };

  const badge = getBadge();

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-text pb-48 pt-12 overflow-x-hidden">
      <header className="flex flex-col gap-8 mb-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="p-3 bg-surface rounded-full text-black border-2 border-border shadow-brutal-sm">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-disp text-2xl font-black uppercase tracking-tight">Mercado</h1>
          <div className="w-12 h-12" /> {/* Spacer */}
        </div>

        <div className="relative">
          <select 
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full bg-surface border-2 border-black p-4 rounded-2xl font-disp font-bold text-lg appearance-none shadow-brutal-sm focus:shadow-brutal transition-all outline-none"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </header>

      <main className="flex flex-col gap-10 relative z-10">
        
        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface p-4 rounded-2xl border-2 border-border flex flex-col items-center">
            <span className="font-mono text-[8px] text-zinc-500 uppercase font-bold mb-1">Tu Precio</span>
            <span className="font-mono text-sm font-black text-pop-blue">${currentProduct?.sellingPrice.toLocaleString()}</span>
          </div>
          <div className="bg-surface p-4 rounded-2xl border-2 border-border flex flex-col items-center">
            <span className="font-mono text-[8px] text-zinc-500 uppercase font-bold mb-1">Promedio</span>
            <span className="font-mono text-sm font-black text-zinc-400">${Math.round(avgPrice).toLocaleString()}</span>
          </div>
          <div className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${badge.color}`}>
            <span className="font-mono text-[8px] uppercase font-bold mb-1">Diferencia</span>
            <span className="font-mono text-sm font-black">{diffPct > 0 ? '+' : ''}{Math.round(diffPct)}%</span>
          </div>
        </div>

        {/* TINDER FINANCIERO (Stack UI) */}
        <div className="relative h-[350px] mt-4 flex items-center justify-center">
           <AnimatePresence>
              {competitors.slice().reverse().map((comp, idx) => {
                const isTop = idx === competitors.length - 1 - currentIndex;
                const rotations = [-3, 2, -1, 3, -2];
                const rot = rotations[idx % rotations.length];

                return (
                  <motion.div
                    key={comp.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1, 
                      rotate: rot,
                      x: idx === currentIndex ? 0 : (idx - currentIndex) * 5,
                      y: idx === currentIndex ? 0 : (idx - currentIndex) * -5,
                      zIndex: competitors.length - idx
                    }}
                    exit={{ x: 500, opacity: 0, rotate: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute w-full max-w-[280px] aspect-[3/4] bg-white border-4 border-black rounded-[32px] p-8 shadow-brutal flex flex-col justify-between cursor-pointer"
                    onClick={() => {
                       if (currentIndex < competitors.length - 1) setCurrentIndex(v => v + 1);
                       else setCurrentIndex(0);
                    }}
                  >
                    <div className="flex flex-col gap-2">
                       <span className="font-mono text-[10px] text-pop-blue font-black uppercase tracking-[0.2em]">Competidor</span>
                       <h3 className="font-disp text-3xl font-black leading-tight uppercase italic">{comp.name}</h3>
                    </div>
                    
                    <div className="space-y-4">
                       <p className="font-text text-xs text-zinc-500 leading-relaxed">{comp.description}</p>
                       <div className="flex items-center gap-3">
                          <div className="font-mono text-3xl font-black">${comp.price.toLocaleString()}</div>
                          {currentProduct && comp.price > currentProduct.sellingPrice ? (
                            <TrendingDown size={20} className="text-pop-green" />
                          ) : (
                            <TrendingUp size={20} className="text-pop-red" />
                          )}
                       </div>
                    </div>

                    <div className="absolute top-4 right-4 text-zinc-200 font-mono text-6xl font-black -z-10 select-none">
                       {idx + 1}
                    </div>
                  </motion.div>
                );
              })}
           </AnimatePresence>
           
           {competitors.length === 0 && (
             <div className="text-zinc-300 font-mono text-center">No hay datos de mercado</div>
           )}
        </div>

        {/* EL CONSEJERO DINÁMICO (Accordion) */}
        <section className="mt-8">
           <Accordion.Root type="single" collapsible className="space-y-4">
              <Accordion.Item 
                value="advice" 
                className={`border-2 border-black rounded-[32px] overflow-hidden transition-all ${diffPct < -30 ? 'bg-pop-yellow shadow-brutal' : 'bg-surface shadow-brutal-sm'}`}
              >
                <Accordion.Header>
                  <Accordion.Trigger className="flex justify-between items-center w-full p-6 font-disp font-black uppercase tracking-widest text-left">
                    <div className="flex items-center gap-3">
                       <Info size={20} />
                       El Consejero
                    </div>
                    <ChevronDown className="transition-transform duration-300 group-data-[state=open]:rotate-180" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="p-6 pt-0 font-text text-sm leading-relaxed">
                   {diffPct < -30 ? (
                     <p className="font-bold">
                       ⚠️ <span className="underline">Alerta Roja</span>: Estás cobrando muy por debajo del mercado. 
                       Sube el precio gradualmente y fortalece el storytelling de tu marca para no 
                       perder margen de beneficio.
                     </p>
                   ) : diffPct > 30 ? (
                     <p>
                       ✨ Eres una marca Premium. Asegúrate de que tu servicio al cliente y 
                       calidad de materiales justifiquen este posicionamiento frente a la competencia.
                     </p>
                   ) : (
                     <p>
                       ✅ Estás en el "Punto Dulce" del mercado. Mantén tu eficiencia de costos 
                       para maximizar el margen sin salirte del rango de precios aceptado.
                     </p>
                   )}
                </Accordion.Content>
              </Accordion.Item>
           </Accordion.Root>
        </section>
      </main>

      {/* Navigation */}
      <nav className="bottom-nav">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-zinc-400 hover:text-black"><ArrowUpRight size={20} /></button>

        <button onClick={() => navigate('/benchmark')} className="p-2 bg-pop-blue rounded-full text-white shadow-brutal-sm"><Radar size={20} /></button>
        <button onClick={() => navigate('/journal')} className="p-2 text-zinc-400 hover:text-black"><History size={20} /></button>
      </nav>
    </div>
  );
}
