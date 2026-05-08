import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ArrowUpRight, ArrowDownRight, Edit3, DollarSign, Briefcase, History, Radar, TrendingUp } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useFinancialData } from '../context/FinancialDataContext';
import HealthRing from '../components/HealthRing';
import TransactionMarquee from '../components/TransactionMarquee';
import { Product, ProductMath } from '../types';

export default function DashboardPage() {
  const { 
    studio, 
    products, 
    transactions, 
    getMonthlyObjective, 
    getAccumulatedCash, 
    getProductMath,
    addProduct,
    addTransaction
  } = useFinancialData();

  const navigate = useNavigate();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isFabOpen, setIsFabOpen] = useState(false);

  // --- MOCK DATA INJECTION ---
  useEffect(() => {
    if (products.length === 0) {
      const mockProjects = [
        {
          name: 'Mural "Vida Urbana"',
          type: 'custom' as const,
          sellingPrice: 4500,
          estimatedUnits: 1,
          initialInvestment: 500,
          productionCosts: [{ id: '1', name: 'Pintura', quantity: 1, unitPrice: 300, category: 'production' as const, affectedByAuthorship: true }],
          distributionCosts: [],
          amountCollected: 2800,
        },
        {
          name: 'Mochilas Artesanales',
          type: 'product' as const,
          sellingPrice: 120,
          estimatedUnits: 40,
          initialInvestment: 800,
          productionCosts: [{ id: '2', name: 'Cuero', quantity: 1, unitPrice: 40, category: 'production' as const, affectedByAuthorship: false }],
          distributionCosts: [{ id: '3', name: 'Envío', quantity: 1, unitPrice: 10, category: 'distribution' as const, affectedByAuthorship: false }],
          amountCollected: 1800,
        },
        {
          name: 'Taller de Acuarela',
          type: 'custom' as const,
          sellingPrice: 80,
          estimatedUnits: 20,
          initialInvestment: 150,
          productionCosts: [{ id: '4', name: 'Papel/Pinceles', quantity: 1, unitPrice: 15, category: 'production' as const, affectedByAuthorship: false }],
          distributionCosts: [],
          amountCollected: 1200,
        }
      ];
      mockProjects.forEach(p => addProduct(p));
    }
  }, []);

  useEffect(() => {
    if (products.length > 0 && transactions.length === 0) {
      const muralId = products.find(p => p.name.includes('Mural'))?.id;
      const mochilasId = products.find(p => p.name.includes('Mochilas'))?.id;

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 10);
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 5);

      const mockTxs = [
        // Mural
        { type: 'income' as const, amount: 1500, description: 'Anticipo Mural', category: 'anticipo' as const, date: now.toISOString(), productId: muralId },
        { type: 'income' as const, amount: 1300, description: 'Pago Intermedio', category: 'cobro_final' as const, date: lastMonth.toISOString(), productId: muralId },
        // Mochilas
        { type: 'income' as const, amount: 900, description: 'Ventas de Mayo', category: 'cobro_final' as const, date: now.toISOString(), productId: mochilasId },
        { type: 'income' as const, amount: 400, description: 'Ventas de Abril', category: 'cobro_final' as const, date: lastMonth.toISOString(), productId: mochilasId },
        { type: 'income' as const, amount: 1200, description: 'Venta Mayorista', category: 'cobro_final' as const, date: twoMonthsAgo.toISOString(), productId: mochilasId },
        { type: 'income' as const, amount: 200, description: 'Venta Flash', category: 'cobro_final' as const, date: threeMonthsAgo.toISOString(), productId: mochilasId },
      ];
      mockTxs.forEach(t => addTransaction(t));
    }
  }, [products]);

  const selectedProject = products.find(p => p.id === selectedProductId);
  const selectedMath = selectedProductId ? getProductMath(selectedProductId) : null;

  // --- CÁLCULO DE DATOS DEL GRÁFICO ---
  const getChartData = () => {
    if (!selectedProductId || !selectedMath) return [];
    
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const data = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIndex = d.getMonth();
      const monthLabel = monthNames[mIndex];
      
      // Filtrar transacciones para este producto y este mes
      const monthlyIncome = transactions
        .filter(t => t.productId === selectedProductId && t.type === 'income')
        .filter(t => {
          const txDate = new Date(t.date);
          return txDate.getMonth() === mIndex && txDate.getFullYear() === d.getFullYear();
        })
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        name: monthLabel,
        esperado: Math.round(selectedMath.revenueNeeded),
        real: monthlyIncome
      });
    }
    return data;
  };

  const chartData = getChartData();

  // Encontrar el proyecto con mayor volumen de negocio para el ancho relativo
  const maxVolume = Math.max(...products.map(p => p.sellingPrice * p.estimatedUnits), 1);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col pt-12 pb-48 font-text overflow-x-hidden gap-12">
      
      {/* 1. HEADER (Anillo de Salud) */}
      <header className="relative z-10 flex flex-col items-center gap-10 px-8">
        <div className="w-full flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-disp text-2xl font-black tracking-tight text-black">{studio.projectName || 'Studio'}</span>
            <span className="font-mono text-[10px] uppercase text-zinc-500 tracking-widest font-bold">Panel de Control</span>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center bg-surface shadow-brutal-sm">
            <Briefcase size={20} className="text-black" />
          </div>
        </div>

        <HealthRing 
          current={getAccumulatedCash()} 
          goal={getMonthlyObjective()} 
          balance={getAccumulatedCash()} 
        />
      </header>

      {/* 2. MARQUEE FINANCIERO */}
      <div className="relative z-10">
        <TransactionMarquee 
          items={transactions.slice(-5).map(t => ({
            text: t.description,
            amount: t.amount,
            type: t.type
          }))} 
        />
      </div>

      {/* 3. ECOSISTEMA DE PROYECTOS */}
      <section className="relative z-10 flex flex-col gap-8 px-8 mt-4 mb-24">
        <div className="flex justify-between items-end">
          <h3 className="font-disp text-xl font-black uppercase tracking-tight text-zinc-400">Proyectos Activos</h3>
          <span className="font-mono text-[10px] text-zinc-400 font-bold tracking-widest uppercase">Margar / Vol.</span>
        </div>

        <div className="flex flex-col gap-6">
          {products.map((project, idx) => {
            const math = getProductMath(project.id);
            if (!math) return null;

            const volume = project.sellingPrice * project.estimatedUnits;
            const widthPct = Math.max((volume / maxVolume) * 100, 45); 
            const collectedPct = (project.amountCollected / volume) * 100;

            const colorClass = 
              math.marginStatus === 'healthy' ? 'bg-pop-green' :
              math.marginStatus === 'warning' ? 'bg-pop-yellow' : 'bg-pop-red';

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedProductId(project.id)}
                className={`relative h-20 cursor-pointer group rounded-2xl overflow-hidden shadow-brutal border-2 border-black bg-white transition-all active:scale-[0.98] ${idx % 2 === 0 ? 'sticker-r1' : 'sticker-l1'}`}
                style={{ width: `${widthPct}%` }}
              >
                <div 
                  className={`absolute inset-0 h-full ${colorClass} transition-all duration-700`}
                  style={{ width: `${collectedPct}%` }}
                />
                <div 
                  className={`absolute inset-0 h-full stripe-pending transition-all duration-700`}
                  style={{ left: `${collectedPct}%` }}
                />
                
                <div className="absolute inset-0 flex items-center justify-between px-6 z-10">
                   <div className="flex flex-col">
                      <span className="font-disp font-black text-sm uppercase text-black">
                        {project.name}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-black/60 uppercase">
                        ${volume.toLocaleString()} TOTAL
                      </span>
                   </div>
                   <ArrowUpRight size={18} className="text-black" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. FAB */}
      <div className="fixed bottom-28 right-8 z-50 flex flex-col items-end gap-4">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="flex flex-col gap-3 mb-2"
            >
              <button onClick={() => navigate('/journal')} className="bg-pop-pink text-black font-disp font-black uppercase text-xs px-8 py-5 rounded-2xl shadow-brutal border-2 border-black flex items-center gap-3 whitespace-nowrap">
                <History size={18} /> Registrar Movimiento
              </button>
              <button onClick={() => navigate('/create')} className="bg-pop-green text-black font-disp font-black uppercase text-xs px-8 py-5 rounded-2xl shadow-brutal border-2 border-black flex items-center gap-3 whitespace-nowrap">
                <Plus size={18} /> Nuevo Proyecto
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-18 h-18 rounded-full bg-pop-blue text-white shadow-brutal border-4 border-black flex items-center justify-center transition-transform ${isFabOpen ? 'rotate-45' : ''}`}
        >
          <Plus size={36} strokeWidth={4} />
        </button>
      </div>

      {/* 5. BOTTOM NAVIGATION */}
      <nav className="bottom-nav">
        <button onClick={() => navigate('/dashboard')} className="p-2 bg-pop-blue rounded-full text-white shadow-brutal-sm"><ArrowUpRight size={20} /></button>
        <button onClick={() => navigate('/benchmark')} className="p-2 text-zinc-400 hover:text-black hover:bg-surface rounded-xl transition-all"><Radar size={20} /></button>
        <button onClick={() => navigate('/journal')} className="p-2 text-zinc-400 hover:text-black hover:bg-surface rounded-xl transition-all"><History size={20} /></button>
      </nav>

      {/* 6. BOTTOM SHEET */}
      <Dialog.Root open={!!selectedProductId} onOpenChange={(open) => !open && setSelectedProductId(null)}>
        <AnimatePresence>
          {selectedProductId && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bottom-sheet-overlay" />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t-8 border-pop-blue rounded-t-[50px] px-10 pt-8 pb-16 focus:outline-none max-h-[92vh] overflow-y-auto"
                >
                  <div className="w-16 h-2 bg-zinc-800 rounded-full mx-auto mb-10" />
                  
                  {selectedProject && selectedMath && (
                    <div className="space-y-12">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-3">
                          <Dialog.Title className="font-disp text-3xl font-black text-white leading-tight">{selectedProject.name}</Dialog.Title>
                          <div className={`inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase px-4 py-1.5 rounded-full border-2 ${
                            selectedMath.marginStatus === 'healthy' ? 'border-pop-green text-pop-green bg-pop-green/10' :
                            selectedMath.marginStatus === 'warning' ? 'border-pop-yellow text-pop-yellow bg-pop-yellow/10' :
                            'border-pop-red text-pop-red bg-pop-red/10'
                          }`}>
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                              selectedMath.marginStatus === 'healthy' ? 'bg-pop-green' :
                              selectedMath.marginStatus === 'warning' ? 'bg-pop-yellow' : 'bg-pop-red'
                            }`} />
                            {selectedMath.marginStatus}
                          </div>
                        </div>
                        <Dialog.Close className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-colors border-2 border-zinc-700">
                          <X size={24} />
                        </Dialog.Close>
                      </div>

                      {/* RENDIMIENTO MENSUAL */}
                      <section className="space-y-6">
                        <div className="flex items-center gap-3">
                           <TrendingUp size={18} className="text-pop-blue" />
                           <h3 className="font-disp text-xs font-black uppercase tracking-widest text-zinc-500">Rendimiento Mensual</h3>
                        </div>
                        <div className="h-64 w-full bg-black/40 rounded-[32px] p-6 border-2 border-zinc-800">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2727E6" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#2727E6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="4 4" stroke="#222" vertical={false} />
                              <XAxis dataKey="name" stroke="#444" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                              <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#111', border: '2px solid #2727E6', borderRadius: '16px', fontSize: '11px', color: '#fff' }}
                                itemStyle={{ fontWeight: 'black', textTransform: 'uppercase' }}
                              />
                              <Legend 
                                verticalAlign="top" 
                                align="right" 
                                height={36} 
                                iconType="circle"
                                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="esperado" 
                                stroke="#444" 
                                strokeWidth={3} 
                                strokeDasharray="8 8" 
                                fill="transparent" 
                                name="Presupuesto"
                              />
                              <Area 
                                type="monotone" 
                                dataKey="real" 
                                stroke="#2727E6" 
                                strokeWidth={5} 
                                fillOpacity={1} 
                                fill="url(#colorReal)" 
                                name="Venta Real"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between font-mono text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                           <span>{chartData[0]?.name}</span>
                           <span>Proyección vs Real</span>
                           <span>{chartData[5]?.name}</span>
                        </div>
                      </section>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col items-center py-8 bg-white/5 rounded-[32px] border-2 border-zinc-800">
                          <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-black mb-2">Margen</span>
                          <div className={`font-mono text-5xl font-black ${
                            selectedMath.marginStatus === 'healthy' ? 'text-pop-green' :
                            selectedMath.marginStatus === 'warning' ? 'text-pop-yellow' : 'text-pop-red'
                          }`}>
                            {Math.round(selectedMath.profitMargin)}%
                          </div>
                        </div>
                        <div className="flex flex-col items-center py-8 bg-white/5 rounded-[32px] border-2 border-zinc-800">
                          <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-black mb-2">Objetivo</span>
                          <div className="font-mono text-5xl font-black text-white">
                            {selectedMath.unitsNeeded}
                            <span className="text-xs text-zinc-500 ml-1">un.</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between font-mono text-[11px] text-zinc-500 uppercase font-black px-2 tracking-widest">
                           <span>Cobrado</span>
                           <span>Pendiente</span>
                        </div>
                        <div className="h-10 w-full bg-zinc-800 rounded-3xl overflow-hidden border-4 border-black flex p-1">
                           <div 
                             className="h-full bg-pop-blue rounded-2xl transition-all duration-1000" 
                             style={{ width: `${Math.min((selectedProject.amountCollected / (selectedProject.sellingPrice * selectedProject.estimatedUnits)) * 100, 100)}%` }} 
                           />
                        </div>
                        <div className="flex justify-between font-mono text-base font-black px-1">
                           <span className="text-pop-blue font-black">${selectedProject.amountCollected.toLocaleString()}</span>
                           <span className="text-zinc-600">${(selectedMath.pendingAmount).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 pt-6">
                        <button onClick={() => navigate(`/studio/${selectedProject.id}`)} className="bg-zinc-800 text-white font-disp font-black uppercase text-xs py-7 rounded-[28px] flex flex-col items-center gap-3 shadow-brutal border-2 border-zinc-700 hover:bg-zinc-700 transition-all active:scale-95">
                           <Edit3 size={24} />
                           <span>Laboratorio</span>
                        </button>
                        <button className="bg-pop-blue text-white font-disp font-black uppercase text-xs py-7 rounded-[28px] flex flex-col items-center gap-3 shadow-brutal border-2 border-black hover:bg-blue-700 transition-all active:scale-95">
                           <DollarSign size={24} />
                           <span>Transacción</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </div>
  );
}

