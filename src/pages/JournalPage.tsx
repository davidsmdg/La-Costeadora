import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Send, Mic, AlertTriangle, TrendingUp, History, X } from 'lucide-react';
import { useFinancialData } from '../context/FinancialDataContext';

const formatCOP = (n: number) => '$' + n.toLocaleString('es-CO') + ' COP';

export default function JournalPage() {
  const navigate = useNavigate();
  const { transactions, addTransaction, getAccumulatedCash } = useFinancialData();
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [inputText, setInputText] = useState('');

  const cash = getAccumulatedCash();
  const isLiquidityCritical = cash < 0;
  const upcomingProjections = transactions.filter(t => t.isProjection);

  const parseInput = (text: string) => {
    const lower = text.toLowerCase();
    const amountMatch = lower.match(/(\d[\d.,]*k?)/);
    let amount = 0;
    if (amountMatch) {
      let val = amountMatch[0].replace(/\./g, '').replace(',', '.');
      if (val.endsWith('k')) amount = parseFloat(val) * 1000;
      else amount = parseFloat(val);
    }
    let type: 'income' | 'expense' = 'expense';
    if (lower.includes('recibí') || lower.includes('gané') || lower.includes('cobré') || lower.includes('anticipo')) {
      type = 'income';
    }
    let category = 'otro';
    if (lower.includes('material') || lower.includes('pintura') || lower.includes('insumo')) category = 'materiales';
    if (lower.includes('taxi') || lower.includes('uber') || lower.includes('bus')) category = 'viaticos';
    if (lower.includes('adobe') || lower.includes('canva') || lower.includes('suscripcion')) category = 'suscripcion';
    return { type, amount, description: text, category, date: new Date().toISOString() };
  };

  const handleSend = () => {
    if (!inputText) return;
    const tx = parseInput(inputText);
    if (tx.amount > 0) {
      addTransaction(tx as any);
      setInputText('');
      setIsInputOpen(false);
    }
  };

  return (
    <div className="page-wrapper min-h-screen bg-[var(--color-canvas)] flex flex-col font-text pb-24 max-w-6xl mx-auto w-full" style={{ paddingTop: '0' }}>

      {/* Sticky Liquidity Banner */}
      <div className={`sticky top-0 z-50 flex items-center justify-between gap-3 px-6 py-3.5 shadow-sm transition-all duration-300 ${
        isLiquidityCritical
          ? 'bg-rose-500 text-white'
          : 'bg-white border-b border-slate-100'
      }`}>
        <div className="flex items-center gap-2.5">
          <AlertTriangle
            size={14}
            className={isLiquidityCritical ? 'text-white animate-bounce' : 'text-slate-400'}
          />
          <span className={`font-mono text-[9px] uppercase font-bold tracking-wider ${isLiquidityCritical ? 'text-white/90' : 'text-slate-400'}`}>
            Caja Proyectada
          </span>
        </div>
        <span className={`font-mono text-sm font-black ${isLiquidityCritical ? 'text-white' : 'text-[hsl(var(--color-primary))]'}`}>
          {formatCOP(cash)}
        </span>
      </div>

      {/* Header */}
      <header className="pt-8 pb-3 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-disp text-2xl font-extrabold tracking-tight text-slate-900">El Diario</h1>
          <span className="font-mono text-[9px] uppercase text-slate-400 tracking-wider font-bold">Registro Financiero</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
        >
          <TrendingUp size={15} />
        </button>
      </header>

      <main className="flex-1 w-full py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Milestones and Quick Input (on desktop) */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
            
            {/* Quick Input (Desktop Only) */}
            <div className="hidden lg:block bg-white border border-slate-100 rounded-3xl p-6.5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-4">
              <h3 className="font-disp font-extrabold text-xs uppercase tracking-wider text-slate-400">Registro Rápido</h3>
              <textarea
                placeholder="Ej: Recibí $500k del mural..."
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-xs font-disp font-bold outline-none placeholder:text-slate-350 resize-none h-24 text-slate-705 focus:border-[hsl(var(--color-primary))]/40 transition-all"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className="flex gap-3 items-center">
                <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[hsl(var(--color-primary))] hover:bg-slate-100 hover:border-slate-200 transition-all flex-shrink-0 cursor-pointer">
                  <Mic size={16} />
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 h-10 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white rounded-xl font-disp font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all active:scale-[0.98] cursor-pointer"
                >
                  Registrar <Send size={13} />
                </button>
              </div>
            </div>

            {/* Upcoming Milestones */}
            <section className="space-y-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-[hsl(var(--color-primary))]" />
                <h2 className="font-mono text-[9px] uppercase font-bold tracking-wider text-slate-400">
                  Próximos 30 días
                </h2>
              </div>
              
              {upcomingProjections.length > 0 ? (
                <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-x-visible pb-2 scrollbar-hide lg:pb-0">
                  {upcomingProjections.map(tx => (
                    <div key={tx.id} className="min-w-[200px] w-full bg-white border border-slate-100 p-4.5 rounded-2xl flex flex-col gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.015)] flex-shrink-0">
                      <span className="font-mono text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                        {tx.type === 'income' ? 'Hito de Cobro' : 'Gasto Proyectado'}
                      </span>
                      <span className="font-disp font-bold text-xs text-slate-800">{tx.description}</span>
                      <span className={`font-mono font-black text-xs ${tx.type === 'income' ? 'text-[hsl(var(--color-secondary))]' : 'text-rose-500'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCOP(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-100 p-5 rounded-2xl flex flex-col gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.015)]">
                  <p className="font-text text-xs text-slate-600 font-bold">
                    📖 ¡Lleva el control de tu caja!
                  </p>
                  <p className="font-text text-[11px] text-slate-400 leading-relaxed">
                    Registra ingresos y gastos futuros con el botón <strong>+</strong> para proyectar tu flujo de caja, o ingresa al Dashboard para gestionar tu catálogo e inventario.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Transaction Log */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-1.5">
              <History size={14} className="text-[hsl(var(--color-primary))]" />
              <h2 className="font-mono text-[9px] uppercase font-bold tracking-wider text-slate-400">
                Registro
              </h2>
            </div>

            <div className="flex flex-col gap-3.5">
              {transactions.length === 0 && (
                <p className="font-text text-xs text-slate-400 text-center py-12">
                  Aún no hay movimientos. Registra tu primer ingreso o gasto.
                </p>
              )}
              {transactions.slice().reverse().map((tx) => (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={tx.id}
                  className={`flex flex-col max-w-[85%] ${tx.type === 'income' ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div className={`px-4.5 py-3.5 rounded-2xl ${
                    tx.type === 'income'
                      ? 'bg-[hsl(var(--color-primary))]/5 border border-[hsl(var(--color-primary))]/10'
                      : 'bg-white border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.01)]'
                  }`}>
                    <p className="font-text text-xs font-semibold text-slate-700 leading-relaxed">
                      {tx.description}
                    </p>
                    <div className={`mt-1.5 font-mono text-base font-black ${
                      tx.type === 'income' ? 'text-[hsl(var(--color-primary))]' : 'text-rose-500'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCOP(tx.amount)}
                    </div>
                  </div>
                  <span className="mt-1 font-mono text-[8px] text-slate-400 uppercase font-bold px-1 tracking-wider">
                    {tx.category} · {new Date(tx.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* FAB (Mobile Only) */}
      <button
        onClick={() => setIsInputOpen(true)}
        className="fixed bottom-24 right-6 z-50 w-12 h-12 rounded-full bg-[hsl(var(--color-primary))] text-white shadow-lg flex items-center justify-center hover:bg-[hsl(var(--color-primary-hover))] hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer lg:hidden"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {/* Quick Input Modal */}
      <Dialog.Root open={isInputOpen} onOpenChange={setIsInputOpen}>
        <AnimatePresence>
          {isInputOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bottom-sheet-overlay" />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-[2.5rem] pt-5 pb-12 px-6 shadow-2xl border-t border-slate-100 focus:outline-none max-w-lg mx-auto"
                >
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

                  <div className="flex justify-between items-center mb-5">
                    <Dialog.Title className="font-disp text-lg font-extrabold text-slate-800">
                      Registro Rápido
                    </Dialog.Title>
                    <Dialog.Close className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors border border-slate-100 cursor-pointer"><X size={15} /></Dialog.Close>
                  </div>

                  <div className="flex flex-col gap-5">
                    <textarea
                      autoFocus
                      placeholder="Ej: Recibí $500k del mural..."
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 text-base font-disp font-bold outline-none placeholder:text-slate-300 resize-none h-28 text-slate-700 focus:border-[hsl(var(--color-primary))]/40 transition-all"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="flex gap-3 items-center">
                      <button className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[hsl(var(--color-primary))] hover:bg-slate-100 hover:border-slate-200 transition-all flex-shrink-0 cursor-pointer">
                        <Mic size={18} />
                      </button>
                      <button
                        onClick={handleSend}
                        className="flex-1 h-12 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white rounded-xl font-disp font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        Registrar <Send size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-full transition-all cursor-pointer">
          <TrendingUp size={16} />
        </button>
        <button onClick={() => navigate('/journal')} className="p-2 bg-[hsl(var(--color-primary))] rounded-full text-white shadow-sm hover:bg-[hsl(var(--color-primary-hover))] transition-all cursor-pointer">
          <History size={16} />
        </button>
      </nav>
    </div>
  );
}
