import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import { ArrowLeft, Star, Info, Calculator, FlaskConical, Target, ChevronRight, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useFinancialData } from '../context/FinancialDataContext';
import { CostItem } from '../types';

export default function ProjectStudioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, getProductMath, getTotalFixedExpenses, getMarginStatus, updateProduct, studio } = useFinancialData();

  const project = products.find(p => p.id === id);
  
  // Local state for simulation (Laboratory)
  const [simSellingPrice, setSimSellingPrice] = useState(project?.sellingPrice || 0);
  const [simUnits, setSimUnits] = useState(project?.estimatedUnits || 0);
  const [simCosts, setSimCosts] = useState<CostItem[]>(project?.productionCosts || []);

  if (!project) {
    return <div className="p-10 text-center font-mono">Proyecto no encontrado</div>;
  }

  // --- MATH RE-CALCULATION (Real Time) ---
  const math = useMemo(() => {
    const productionTotal = simCosts.reduce((a, c) => a + c.quantity * c.unitPrice, 0);
    const distributionTotal = project.distributionCosts.reduce((a, c) => a + c.quantity * c.unitPrice, 0);
    const investmentPerUnit = simUnits > 0 ? project.initialInvestment / simUnits : 0;
    const productCost = productionTotal + distributionTotal + investmentPerUnit;
    const profitMargin = simSellingPrice > 0 ? ((simSellingPrice - productCost) / simSellingPrice) * 100 : 0;
    const totalFixed = getTotalFixedExpenses();
    const productFixedShare = products.length > 0 ? totalFixed / products.length : 0;
    const unitContribution = simSellingPrice - productCost;
    const unitsNeeded = unitContribution > 0 ? Math.ceil(productFixedShare / unitContribution) : 0;

    return {
      productCost,
      profitMargin,
      marginStatus: getMarginStatus(profitMargin),
      productFixedShare,
      unitsNeeded,
      revenueNeeded: unitsNeeded * simSellingPrice
    };
  }, [simSellingPrice, simUnits, simCosts, project, products.length]);

  const toggleAuthorship = (costId: string) => {
    setSimCosts(prev => prev.map(c => c.id === costId ? { ...c, affectedByAuthorship: !c.affectedByAuthorship } : c));
  };

  const pieData = [
    { name: 'Cuota Fija', value: Math.max(math.productFixedShare, 0) },
    { name: 'Resto Meta', value: Math.max(getTotalFixedExpenses() * 1.5 - math.productFixedShare, 0) }
  ];

  const COLORS = ['#2727E6', '#1C1C26'];

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-text pb-48 pt-0 overflow-x-hidden max-w-lg mx-auto border-x border-zinc-50">
      {/* Background image removed for solid white look */}

      {/* 1. STICKY TRAFFIC LIGHT (Cabecera) */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b-2 border-border p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-surface rounded-full text-zinc-400 hover:text-black transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-disp text-xl font-black uppercase tracking-tight text-black">{project.name}</h1>
            <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Estudio de Costeo</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface p-3 rounded-xl border border-border flex flex-col items-center">
            <span className="font-mono text-[8px] text-zinc-500 uppercase font-bold mb-1">Costo Real</span>
            <span className="font-mono text-sm font-black text-pop-orange">${Math.round(math.productCost).toLocaleString()}</span>
          </div>
          <div className="bg-surface p-3 rounded-xl border border-border flex flex-col items-center">
            <span className="font-mono text-[8px] text-zinc-500 uppercase font-bold mb-1">P. Sugerido</span>
            <span className="font-mono text-sm font-black text-pop-green">${Math.round(math.productCost * 2.5).toLocaleString()}</span>
          </div>
          <div className={`p-3 rounded-xl border flex flex-col items-center transition-colors duration-500 ${
            math.marginStatus === 'healthy' ? 'bg-pop-green/10 border-pop-green text-pop-green' :
            math.marginStatus === 'warning' ? 'bg-pop-yellow/10 border-pop-yellow text-pop-yellow' :
            'bg-pop-red/10 border-pop-red text-pop-red'
          }`}>
            <span className="font-mono text-[8px] uppercase font-bold mb-1">Margen</span>
            <span className="font-mono text-sm font-black">{Math.round(math.profitMargin)}%</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-6 py-8 flex flex-col gap-10">
        
        {/* 2. LA RECETA (Lista de Costos) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator size={18} className="text-pop-blue" />
            <h2 className="font-disp font-black uppercase text-sm tracking-widest text-zinc-400">Control de Insumos</h2>
          </div>
          
          <div className="flex flex-col gap-3">
            {simCosts.map((cost) => (
              <div 
                key={cost.id} 
                className={`relative bg-surface p-4 rounded-2xl border-2 transition-all flex justify-between items-center ${
                  cost.affectedByAuthorship ? 'authorship-active border-transparent' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleAuthorship(cost.id)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      cost.affectedByAuthorship ? 'bg-pop-yellow border-black text-black' : 'border-border text-zinc-300'
                    }`}
                  >
                    <Star size={16} fill={cost.affectedByAuthorship ? 'currentColor' : 'none'} />
                  </button>
                  <div className="flex flex-col">
                    <span className="font-disp font-bold text-sm uppercase text-black">{cost.name}</span>
                    <span className="font-mono text-[10px] text-zinc-400">{cost.quantity} unidades</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-600 font-mono text-xs uppercase font-bold flex items-center justify-center gap-2 hover:border-zinc-600 hover:text-zinc-400 transition-all">
             <Plus size={14} /> Añadir Ingrediente
          </button>
        </section>

        {/* 3. EL LABORATORIO (Sandbox Sliders) */}
        <section className="bg-white border-2 border-black rounded-[32px] p-8 space-y-8 shadow-brutal-sm">
          <div className="flex items-center gap-2">
            <FlaskConical size={18} className="text-pop-pink" />
            <h2 className="font-disp font-black uppercase text-sm tracking-widest text-zinc-400">El Laboratorio (Simulador)</h2>
          </div>

          {/* Slider: Precio de Venta */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <label className="font-mono text-[10px] uppercase font-bold text-zinc-500">Precio de Venta</label>
               <span className="font-mono text-xl font-black text-pop-green">${simSellingPrice.toLocaleString()}</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={[simSellingPrice]}
              max={project.sellingPrice * 3}
              step={1}
              onValueChange={([val]) => setSimSellingPrice(val)}
            >
              <Slider.Track className="bg-zinc-100 relative grow rounded-full h-3 border border-border">
                <Slider.Range className="absolute bg-pop-green rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-6 h-6 bg-white border-4 border-black rounded-full hover:scale-110 focus:outline-none transition-transform shadow-brutal-sm" />
            </Slider.Root>
          </div>

          {/* Slider: Unidades / Mes */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <label className="font-mono text-[10px] uppercase font-bold text-zinc-500">Producción Mensual</label>
               <span className="font-mono text-xl font-black text-pop-blue">{simUnits} un.</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={[simUnits]}
              max={project.estimatedUnits * 5}
              step={1}
              onValueChange={([val]) => setSimUnits(val)}
            >
              <Slider.Track className="bg-zinc-100 relative grow rounded-full h-3 border border-border">
                <Slider.Range className="absolute bg-pop-blue rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-6 h-6 bg-white border-4 border-black rounded-full hover:scale-110 focus:outline-none transition-transform shadow-brutal-sm" />
            </Slider.Root>
          </div>

          <div className="p-4 bg-surface rounded-2xl border border-border flex items-start gap-3">
             <Info size={16} className="text-pop-yellow shrink-0 mt-0.5" />
             <p className="font-text text-[10px] text-zinc-500 leading-relaxed">
               Mover estos valores no cambia tus datos reales hasta que des clic en <span className="text-black font-bold">"Guardar Cambios"</span>.
             </p>
          </div>
        </section>

        {/* 4. PUNTO DE EQUILIBRIO (Footer Chart) */}
        <section className="bg-surface border-2 border-black rounded-[40px] p-8 shadow-brutal flex flex-col items-center gap-6">
           <div className="flex items-center gap-2">
              <Target size={18} className="text-pop-yellow" />
              <h2 className="font-disp font-black uppercase text-sm tracking-widest text-black">Punto de Equilibrio</h2>
           </div>

           <div className="w-full h-48 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="font-mono text-2xl font-black text-black">{math.unitsNeeded}</span>
                 <span className="font-mono text-[8px] uppercase text-zinc-500 font-bold">Unidades</span>
              </div>
           </div>

           <div className="text-center space-y-2">
              <p className="font-text text-xs text-zinc-500">
                Debes vender <span className="font-mono font-bold text-black">{math.unitsNeeded} unidades</span> para que este proyecto pague su cuota de <span className="font-mono font-bold text-pop-blue">${Math.round(math.productFixedShare).toLocaleString()}</span> de tus gastos fijos.
              </p>
           </div>
        </section>

      </main>

      {/* Floating Save Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-md z-50">
        <button 
          onClick={() => {
            updateProduct(project.id, {
              sellingPrice: simSellingPrice,
              estimatedUnits: simUnits,
              productionCosts: simCosts
            });
            navigate('/dashboard');
          }}
          className="w-full bg-pop-blue text-white font-disp text-xl py-6 rounded-full shadow-brutal hover:-translate-y-1 active:translate-y-1 transition-all flex items-center justify-center gap-3"
        >
          Guardar Cambios <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
