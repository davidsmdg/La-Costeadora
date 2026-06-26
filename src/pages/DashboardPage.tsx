import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ArrowUpRight, Edit3, DollarSign, History, TrendingUp, LogOut } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useFinancialData } from '../context/FinancialDataContext';
import { useAuth } from '../context/AuthContext';
import HealthRing from '../components/HealthRing';
import TransactionMarquee from '../components/TransactionMarquee';
import { Product, ProductMath } from '../types';

const formatCOP = (n: number) => '$' + n.toLocaleString('es-CO') + ' COP';

export default function DashboardPage() {
  const { 
    studio, products, transactions, loading,
    getMonthlyObjective, getAccumulatedCash, getProductMath,
    getProjectsTotalUtility,
    addProduct, addTransaction, setMonthlySale
  } = useFinancialData();

  const { logout } = useAuth();
  const navigate = useNavigate();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [salesMonth, setSalesMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [salesUnits, setSalesUnits] = useState(0);

  const monthRange = React.useMemo(() => {
    const months = [];
    const now = new Date();
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthVal = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      months.push({
        value: monthVal,
        label: `${monthNames[monthIndex]} ${year}`,
      });
    }
    return months;
  }, []);

  const PROJECT_COLORS = React.useMemo(() => [
    'hsl(262 80% 60%)', // Indigo/Purple
    'hsl(182 80% 40%)', // Turquoise
    'hsl(330 80% 55%)', // Pink
    'hsl(200 85% 50%)', // Ocean Blue
    'hsl(25 90% 55%)',  // Orange
    'hsl(160 75% 40%)', // Mint Green
    'hsl(290 70% 50%)', // Violet
  ], []);

  // Calculate chronological timeline for each product to find advantage/surplus
  const timelineData = React.useMemo(() => {
    return products.map((p, pIdx) => {
      const math = getProductMath(p.id);
      const baseBudget = math ? math.revenueNeeded : 0;
      
      let prevSurplus = 0;
      const monthlyInfo = monthRange.map(m => {
        const sale = p.monthlySales?.find(s => s.month === m.value);
        const unitsSold = sale ? sale.unitsSold : 0;
        const actualEarnings = unitsSold * p.sellingPrice;
        const advantage = prevSurplus; // surplus from previous month carried over
        const adjustedBudget = Math.max(0, baseBudget - advantage);
        const surplus = Math.max(0, actualEarnings - adjustedBudget);
        
        prevSurplus = surplus;
        
        return {
          month: m.value,
          unitsSold,
          actualEarnings,
          advantage,
          adjustedBudget,
          surplus,
        };
      });
      
      return {
        productId: p.id,
        name: p.name,
        color: PROJECT_COLORS[pIdx % PROJECT_COLORS.length],
        monthlyInfo,
      };
    });
  }, [products, monthRange, getProductMath, PROJECT_COLORS]);

  // Extract variables for the currently selected month
  const selectedMonthData = React.useMemo(() => {
    let totalAdvantage = 0;
    const contributions: { name: string; value: number; color: string; unitsSold: number }[] = [];
    
    timelineData.forEach(pData => {
      const monthInfo = pData.monthlyInfo.find(info => info.month === selectedMonth);
      if (monthInfo) {
        totalAdvantage += monthInfo.advantage;
        contributions.push({
          name: pData.name,
          value: monthInfo.actualEarnings,
          color: pData.color,
          unitsSold: monthInfo.unitsSold,
        });
      }
    });
    
    return {
      advantage: totalAdvantage,
      contributions,
    };
  }, [timelineData, selectedMonth]);

  // Update salesUnits when month or product changes
  useEffect(() => {
    if (selectedProductId && salesMonth) {
      const prod = products.find(p => p.id === selectedProductId);
      const sale = prod?.monthlySales?.find(s => s.month === salesMonth);
      setSalesUnits(sale ? sale.unitsSold : 0);
    }
  }, [selectedProductId, salesMonth, products]);

  const handleSaveSales = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !salesMonth) return;
    await setMonthlySale(selectedProductId, salesMonth, salesUnits);
    setIsSalesModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-canvas)]">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-[hsl(var(--color-primary))]/20 border-t-[hsl(var(--color-primary))] animate-spin" />
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">
          Actualizando Datos Financieros...
        </p>
      </div>
    );
  }

  const selectedProject = products.find(p => p.id === selectedProductId);
  const selectedMath = selectedProductId ? getProductMath(selectedProductId) : null;

  const getChartData = () => {
    if (!selectedProductId || !selectedProject) return [];
    
    const pTimeline = timelineData.find(t => t.productId === selectedProductId);
    if (!pTimeline) return [];

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return pTimeline.monthlyInfo.map(info => {
      const [year, monthStr] = info.month.split('-');
      const mIdx = parseInt(monthStr) - 1;
      
      return {
        name: monthNames[mIdx],
        esperado: Math.round(info.adjustedBudget),
        real: Math.round(info.actualEarnings),
      };
    });
  };

  const chartData = getChartData();
  const maxVolume = Math.max(...products.map(p => p.sellingPrice * p.estimatedUnits), 1);

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      healthy: { label: 'Rentable', color: 'hsl(182 53% 50%)', bg: 'hsl(182 53% 50% / 0.1)' },
      warning: { label: 'Revisar', color: 'hsl(47 100% 50%)', bg: 'hsl(47 100% 50% / 0.1)' },
      critical: { label: 'Crítico', color: 'hsl(4 90% 58%)', bg: 'hsl(4 90% 58% / 0.1)' },
    };
    return map[status] || map.critical;
  };

  return (
    <div className="page-wrapper min-h-screen bg-[var(--color-canvas)] flex flex-col pb-40 font-text gap-8 max-w-6xl mx-auto w-full" style={{ paddingTop: '0' }}>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-12">
        
        {/* Left Column: Health Ring & Stats */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-8">
          <div className="flex justify-between items-center lg:hidden">
            <div className="flex flex-col gap-0.5">
              <span className="font-disp text-2xl font-extrabold tracking-tight text-slate-900">
                {studio.projectName || 'Tu Studio'}
              </span>
              <span className="font-mono text-[9px] uppercase text-slate-400 tracking-wider font-bold">
                Panel de Control
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={logout}
                title="Cerrar Sesión"
                className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm text-slate-400 hover:text-red-500 hover:border-red-100 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
              </button>
              <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                <span className="text-lg">🎨</span>
              </div>
            </div>
          </div>

          {/* Health Ring & Month Selector */}
          <div className="flex flex-col gap-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <span className="font-disp font-extrabold text-[10px] uppercase tracking-wider text-slate-400">
                Meta Mensual
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-150 rounded-xl px-3 py-1.5 text-xs font-disp font-bold text-slate-700 outline-none hover:bg-slate-100 hover:border-slate-200 transition-all cursor-pointer"
              >
                {monthRange.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-center py-2">
              <HealthRing 
                goal={getMonthlyObjective()} 
                balance={getAccumulatedCash()} 
                surplus={selectedMonthData.advantage}
                contributions={selectedMonthData.contributions}
              />
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-1 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
              <span className="font-mono text-[9px] uppercase font-bold text-slate-400 tracking-wider">Saldo en Caja</span>
              <span className="font-mono text-[16px] font-black text-slate-800 break-words">
                {formatCOP(getAccumulatedCash())}
              </span>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-1 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
              <span className="font-mono text-[9px] uppercase font-bold text-slate-400 tracking-wider">Proyectos Activos</span>
              <span className="font-mono text-[17px] font-black text-[hsl(var(--color-primary))]">
                {products.length}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Projects & Activity */}
        <div className="lg:col-span-8 space-y-8">
          <div className="hidden lg:flex justify-between items-center">
            <div className="flex flex-col gap-0.5">
              <span className="font-disp text-2xl font-extrabold tracking-tight text-slate-900">
                {studio.projectName || 'Tu Studio'}
              </span>
              <span className="font-mono text-[9px] uppercase text-slate-400 tracking-wider font-bold">
                Panel de Control
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-500 hover:text-red-500 hover:border-red-100 transition-all font-disp text-[10px] font-bold uppercase tracking-wider cursor-pointer"
              >
                <LogOut size={13} />
                <span>Cerrar Sesión</span>
              </button>
              <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                <span className="text-lg">🎨</span>
              </div>
            </div>
          </div>

          {/* ── MARQUEE ── */}
          <TransactionMarquee 
            items={transactions.slice(-5).map(t => ({
              text: t.description,
              amount: t.amount,
              type: t.type
            }))} 
          />

          {/* ── PROYECTOS ── */}
          <section className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-disp text-base font-extrabold text-slate-800 tracking-tight">
                Proyectos Activos
              </h2>
              <span className="font-mono text-[9px] text-slate-400 font-bold tracking-wider uppercase">
                Margen · Vol.
              </span>
            </div>

            {products.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)] min-h-[220px]">
                <div className="w-14 h-14 rounded-full bg-[hsl(var(--color-primary))]/10 flex items-center justify-center text-2xl">
                  ✨
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="font-disp font-bold text-base text-slate-800">
                    Aún no tienes proyectos
                  </h3>
                  <p className="font-text text-xs text-slate-400 leading-relaxed">
                    Crea tu primer proyecto para cotizar tus costos, calcular tu margen y ver si logras cubrir tu meta mensual.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/create')}
                  className="mt-2 px-5 py-2.5 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white font-disp font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  Nuevo Proyecto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((project, idx) => {
                  const math = getProductMath(project.id);
                  if (!math) return null;

                  const volume = project.sellingPrice * project.estimatedUnits;
                  const collectedPct = Math.min((project.amountCollected / volume) * 100, 100);
                  const badge = statusBadge(math.marginStatus);

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      onClick={() => setSelectedProductId(project.id)}
                      className="group bg-white border border-slate-100 rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all duration-300 active:scale-[0.99] shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[140px]"
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between mb-3.5 gap-2">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-disp font-bold text-sm text-slate-800 truncate">
                            {project.name}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-400 truncate">
                            {formatCOP(volume)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div 
                            className="px-2.5 py-0.5 rounded-full font-mono text-[8px] font-bold uppercase tracking-wider"
                            style={{ color: badge.color, backgroundColor: badge.bg }}
                          >
                            {badge.label}
                          </div>
                          <ArrowUpRight size={14} className="text-slate-300 group-hover:text-[hsl(var(--color-primary))] transition-colors" />
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5 mt-auto">
                        <div className="flex justify-between font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>Cobrado</span>
                          <span>{Math.round(collectedPct)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                          <div
                            className="h-full rounded-full transition-all duration-75"
                            style={{
                              width: `${collectedPct}%`,
                              backgroundColor: badge.color
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

      </div>

      {/* ── FAB ── */}
      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2.5">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.92 }}
              className="flex flex-col gap-2.5 mb-1.5"
            >
              <button 
                onClick={() => navigate('/journal')} 
                className="bg-white border border-slate-100 text-slate-700 font-disp font-semibold text-xs px-5 py-3.5 rounded-xl shadow-md flex items-center gap-2.5 whitespace-nowrap hover:bg-slate-50 transition-all cursor-pointer"
              >
                <History size={15} className="text-[hsl(var(--color-primary))]" />
                Registrar Movimiento
              </button>
              <button 
                onClick={() => navigate('/create')} 
                className="bg-white border border-slate-100 text-slate-700 font-disp font-semibold text-xs px-5 py-3.5 rounded-xl shadow-md flex items-center gap-2.5 whitespace-nowrap hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Plus size={15} className="text-[hsl(var(--color-secondary))]" />
                Nuevo Proyecto
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-12 h-12 rounded-full bg-[hsl(var(--color-primary))] text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:bg-[hsl(var(--color-primary-hover))] hover:-translate-y-0.5 active:scale-95 cursor-pointer ${isFabOpen ? 'rotate-45' : ''}`}
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="bottom-nav">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="p-2 bg-[hsl(var(--color-primary))] rounded-full text-white shadow-sm hover:bg-[hsl(var(--color-primary-hover))] transition-all cursor-pointer"
        >
          <TrendingUp size={16} />
        </button>
        <button 
          onClick={() => navigate('/journal')} 
          className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-full transition-all cursor-pointer"
        >
          <History size={16} />
        </button>
      </nav>

      {/* ── BOTTOM SHEET ── */}
      <Dialog.Root open={!!selectedProductId} onOpenChange={(open) => !open && setSelectedProductId(null)}>
        <AnimatePresence>
          {selectedProductId && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                  className="bottom-sheet-overlay" 
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-[2.5rem] pt-5 pb-12 focus:outline-none max-h-[88vh] overflow-y-auto border-t border-slate-100 shadow-2xl max-w-lg mx-auto"
                >
                  {/* Drag Handle */}
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
                  
                  <div className="px-6 space-y-6">
                    {selectedProject && selectedMath && (() => {
                      const badge = statusBadge(selectedMath.marginStatus);
                      return (
                        <>
                          {/* Title Row */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <Dialog.Title className="font-disp text-xl font-extrabold text-slate-800 leading-tight">
                                {selectedProject.name}
                              </Dialog.Title>
                              <div 
                                className="inline-flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase px-2.5 py-1 rounded-full"
                                style={{ color: badge.color, backgroundColor: badge.bg }}
                              >
                                <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: badge.color }} />
                                {badge.label}
                              </div>
                            </div>
                            <Dialog.Close className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors border border-slate-100 cursor-pointer">
                              <X size={16} />
                            </Dialog.Close>
                          </div>

                           {/* Chart */}
                           <div className="space-y-2.5">
                             <div className="flex justify-between items-center w-full">
                               <div className="flex items-center gap-1.5">
                                 <TrendingUp size={14} className="text-[hsl(var(--color-primary))]" />
                                 <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                   Rendimiento Mensual
                                 </span>
                               </div>
                               <button
                                 type="button"
                                 onClick={() => {
                                   setSalesMonth(selectedMonth);
                                   setIsSalesModalOpen(true);
                                 }}
                                 className="px-3 py-1 bg-[hsl(var(--color-primary))]/10 hover:bg-[hsl(var(--color-primary))]/20 text-[hsl(var(--color-primary))] font-disp text-[9px] font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-1 cursor-pointer"
                               >
                                 ¿Cómo te fue este mes?
                               </button>
                             </div>
                            <div className="h-48 w-full bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorReal2" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="hsl(264 89% 58%)" stopOpacity={0.15} />
                                      <stop offset="95%" stopColor="hsl(264 89% 58%)" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} dy={6} />
                                  <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '8px', fontSize: '10px', color: '#1e293b' }}
                                  />
                                  <Legend verticalAlign="top" align="right" height={24} iconType="circle" wrapperStyle={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                  <Area type="monotone" dataKey="esperado" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="5 5" fill="transparent" name="Presupuesto" />
                                  <Area type="monotone" dataKey="real" stroke="hsl(264 89% 58%)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReal2)" name="Real" />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* KPI Cards */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col items-center py-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                              <span className="font-mono text-[8px] text-slate-400 uppercase tracking-wider font-bold mb-1">Margen</span>
                              <div className="font-mono text-2xl font-black" style={{ color: badge.color }}>
                                {Math.round(selectedMath.profitMargin)}%
                              </div>
                            </div>
                            <div className="flex flex-col items-center py-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                              <span className="font-mono text-[8px] text-slate-400 uppercase tracking-wider font-bold mb-1">Objetivo</span>
                              <div className="font-mono text-2xl font-black text-slate-700">
                                {selectedMath.unitsNeeded}
                                <span className="text-xs text-slate-400 ml-0.5 font-bold">un.</span>
                              </div>
                            </div>
                          </div>

                          {/* Collection progress */}
                          <div className="space-y-2 pt-1">
                            <div className="flex justify-between font-mono text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                              <span>Cobrado</span>
                              <span>Pendiente</span>
                            </div>
                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                              <div 
                                className="h-full bg-[hsl(var(--color-primary))] rounded-full transition-all duration-700" 
                                style={{ width: `${Math.min((selectedProject.amountCollected / (selectedProject.sellingPrice * selectedProject.estimatedUnits)) * 100, 100)}%` }} 
                              />
                            </div>
                            <div className="flex justify-between font-mono text-xs font-black">
                              <span className="text-[hsl(var(--color-primary))]">{formatCOP(selectedProject.amountCollected)}</span>
                              <span className="text-slate-400">{formatCOP(selectedMath.pendingAmount)}</span>
                            </div>
                          </div>

                          {/* Action Buttons inside Sheet */}
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <button 
                              onClick={() => navigate(`/studio/${selectedProject.id}`)} 
                              className="bg-slate-50/50 border border-slate-100 text-slate-700 font-disp font-bold text-xs py-4 rounded-xl flex flex-col items-center gap-1.5 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer"
                            >
                              <Edit3 size={18} className="text-slate-400" />
                              <span>Laboratorio</span>
                            </button>
                            <button 
                              className="bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white font-disp font-bold text-xs py-4 rounded-xl flex flex-col items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <DollarSign size={18} />
                              <span>Transacción</span>
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>

      {/* ── SALES MODAL ── */}
      <Dialog.Root open={isSalesModalOpen} onOpenChange={setIsSalesModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-md bg-white border border-slate-100 rounded-[2.5rem] p-7 shadow-2xl z-[70] focus:outline-none flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <Dialog.Title className="font-disp text-base font-extrabold text-slate-800 uppercase tracking-tight">
                  ¿Cómo te fue este mes?
                </Dialog.Title>
                <Dialog.Description className="font-text text-xs text-slate-400">
                  Registra las unidades reales vendidas de este proyecto para actualizar su rendimiento.
                </Dialog.Description>
              </div>
              <Dialog.Close className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer">
                <X size={18} />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSaveSales} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold block">
                  Proyecto
                </label>
                <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 text-xs font-disp font-bold text-slate-600">
                  {selectedProject?.name}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold block">
                  Mes a Evaluar
                </label>
                <select
                  value={salesMonth}
                  onChange={(e) => setSalesMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-disp font-bold text-slate-700 outline-none focus:border-[hsl(var(--color-primary))] focus:bg-white transition-all cursor-pointer"
                >
                  {monthRange.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold block">
                  Unidades Reales Vendidas
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={salesUnits === 0 ? '' : salesUnits}
                  onChange={(e) => setSalesUnits(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-text text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[hsl(var(--color-primary))] focus:bg-white transition-all"
                  placeholder="Ej. 120"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white font-disp font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center mt-4"
              >
                Guardar Rendimiento
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
