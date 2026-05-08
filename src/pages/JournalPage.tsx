import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Mic, Send, Plus, Calendar, ArrowUpRight, 
  ArrowDownRight, AlertTriangle, TrendingUp, History, X, Package, Briefcase, Radar 
} from 'lucide-react';
import { useFinancialData } from '../context/FinancialDataContext';

export default function JournalPage() {
  const navigate = useNavigate();
  const { transactions, addTransaction, getAccumulatedCash, studio } = useFinancialData();
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [inputText, setInputText] = useState('');

  const cash = getAccumulatedCash();
  const isLiquidityCritical = cash < 0;

  // NLP Parser (Simple)
  const parseInput = (text: string) => {
    const lower = text.toLowerCase();
    const amountMatch = lower.match(/(\d+k?)/);
    let amount = 0;
    if (amountMatch) {
      let val = amountMatch[0];
      if (val.endsWith('k')) amount = parseInt(val) * 1000;
      else amount = parseInt(val);
    }

    let type: 'income' | 'expense' = 'expense';
    if (lower.includes('recibí') || lower.includes('gané') || lower.includes('cobré') || lower.includes('anticipo') || lower.includes('vta')) {
      type = 'income';
    }

    let category = 'otro';
    if (lower.includes('pintura') || lower.includes('material') || lower.includes('insumo')) category = 'materiales';
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
    <div className="min-h-screen bg-white text-black flex flex-col font-text pb-48 pt-0 overflow-x-hidden">
      {/* 1. ALERTA DE LIQUIDEZ (Banner Fijo) */}
      <div className={`sticky top-0 z-50 p-4 flex items-center justify-center gap-3 shadow-xl transition-colors duration-500 ${isLiquidityCritical ? 'bg-pop-red' : 'bg-pop-blue'}`}>
        <AlertTriangle className={isLiquidityCritical ? 'animate-bounce' : 'opacity-50'} size={20} />
        <div className="flex flex-col">
           <span className="font-mono text-[8px] uppercase font-black text-black/50">Caja Proyectada</span>
           <span className="font-disp text-2xl font-black text-white">
             {isLiquidityCritical ? 'DÉFICIT CRÍTICO' : 'LIQUIDEZ OK'}
           </span>
        </div>
        <div className="ml-auto font-mono text-xl font-black text-white/90">
           ${cash.toLocaleString()}
        </div>
      </div>

      <header className="px-6 py-8 relative z-10 flex items-center justify-between">
        <button onClick={() => navigate('/dashboard')} className="p-3 bg-surface rounded-full text-black border-2 border-border shadow-brutal-sm">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-disp text-2xl font-black uppercase tracking-tight text-center">El Diario</h1>
        <div className="w-12 h-12" /> {/* Spacer */}
      </header>

      <main className="relative z-10 px-6 flex flex-col gap-12">
        
        {/* 2. EL FUTURO (Hitos de Cobro) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 opacity-50">
            <TrendingUp size={16} />
            <h2 className="font-mono text-[10px] uppercase font-bold tracking-widest">El Futuro (Próximos 30 días)</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
            <div className="min-w-[200px] border-2 border-dashed border-border bg-surface p-5 rounded-3xl flex flex-col gap-2">
               <span className="font-mono text-[9px] text-zinc-400 font-bold uppercase">Hito de Cobro</span>
               <span className="font-disp font-black text-lg text-black">Finalización Mural</span>
               <span className="font-mono font-bold text-pop-green">+$700k</span>
            </div>
            <div className="min-w-[200px] border-2 border-dashed border-border bg-surface p-5 rounded-3xl flex flex-col gap-2 opacity-60">
               <span className="font-mono text-[9px] text-zinc-400 font-bold uppercase">Gasto Fijo</span>
               <span className="font-disp font-black text-lg text-black">Adobe Creative Cloud</span>
               <span className="font-mono font-bold text-pop-red">-$60k</span>
            </div>
          </div>
        </section>

        {/* 3. EL PASADO (Diario estilo Chat) */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 opacity-50">
            <History size={16} />
            <h2 className="font-mono text-[10px] uppercase font-bold tracking-widest">El Pasado (Registro)</h2>
          </div>

          <div className="flex flex-col gap-6">
            {transactions.slice().reverse().map((tx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={tx.id}
                className={`flex flex-col max-w-[85%] ${tx.type === 'income' ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <div className={`p-4 rounded-3xl border-2 shadow-brutal-sm ${
                  tx.type === 'income' 
                    ? 'bg-pop-green text-black border-black rounded-tr-none' 
                    : 'bg-surface text-black border-border rounded-tl-none'
                }`}>
                  <p className="font-text text-xs font-bold leading-tight">{tx.description}</p>
                  <div className={`mt-2 font-mono text-xl font-black ${tx.type === 'income' ? 'text-black' : 'text-pop-red'}`}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </div>
                </div>
                <span className="mt-1 font-mono text-[8px] text-zinc-600 uppercase font-bold px-2">
                  {tx.category} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* 4. FAB - Open Quick Input */}
      <button 
        onClick={() => setIsInputOpen(true)}
        className="fab"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* QUICK INPUT MODAL */}
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
                  className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-pop-blue rounded-t-[40px] p-8 pb-12 shadow-2xl"
                >
                  <div className="flex justify-between items-center mb-8">
                     <Dialog.Title className="font-disp text-xl font-black uppercase italic text-black">Registro Rápido</Dialog.Title>
                     <Dialog.Close className="text-zinc-400"><X /></Dialog.Close>
                  </div>

                  <div className="flex flex-col gap-8">
                    <textarea
                      autoFocus
                      placeholder="Ej: Gasté 50k en pintura..."
                      className="w-full bg-transparent text-3xl md:text-4xl font-disp font-black outline-none placeholder:text-zinc-200 resize-none h-40 text-black"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                    
                    <div className="flex gap-4 items-center">
                       <button className="w-20 h-20 rounded-full bg-surface border-2 border-border flex items-center justify-center text-pop-pink animate-pulse">
                          <Mic size={32} />
                       </button>
                       <button 
                         onClick={handleSend}
                         className="flex-1 bg-pop-blue text-white h-20 rounded-full font-disp text-2xl font-black shadow-brutal flex items-center justify-center gap-3"
                       >
                          Registrar <Send size={24} />
                       </button>
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>

      {/* Navigation Bar */}
      <nav className="bottom-nav">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-zinc-400 hover:text-black"><ArrowUpRight size={20} /></button>

        <button onClick={() => navigate('/benchmark')} className="p-2 text-zinc-400 hover:text-black"><Radar size={20} /></button>
        <button onClick={() => navigate('/journal')} className="p-2 bg-pop-blue rounded-full text-white shadow-brutal-sm"><History size={20} /></button>
      </nav>
    </div>
  );
}
