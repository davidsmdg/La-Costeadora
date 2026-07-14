import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ArrowLeft, TrendingUp, History, Trash2, Calendar, LayoutGrid, ClipboardList } from 'lucide-react';
import { useFinancialData } from '../context/FinancialDataContext';

const formatCOP = (n: number) => '$' + n.toLocaleString('es-CO') + ' COP';

export default function JournalPage() {
  const navigate = useNavigate();
  const { transactions, addTransaction, removeTransaction, getAccumulatedCash, products } = useFinancialData();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState('otro');
  const [productId, setProductId] = useState('');

  // Math Calculations (Real Transactions)
  const realTransactions = transactions.filter(t => !t.isProjection);
  const haEntrado = realTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const haSalido = realTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const plataLibre = haEntrado - haSalido;

  const upcomingProjections = transactions.filter(t => t.isProjection);

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || amount <= 0) return;

    addTransaction({
      type: modalType,
      amount: Number(amount),
      description: description.trim(),
      category: category as any,
      date: new Date().toISOString(),
      productId: productId || undefined,
      isProjection: false
    });

    // Reset Form
    setDescription('');
    setAmount('');
    setCategory('otro');
    setProductId('');
    setIsModalOpen(false);
  };

  return (
    <div className="page-wrapper min-h-screen bg-[var(--color-canvas)] flex flex-col font-text pb-24 max-w-xl mx-auto w-full px-6" style={{ paddingTop: '0' }}>

      {/* Header */}
      <header className="pt-8 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2 bg-white border border-slate-100 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col gap-0.5">
            <h1 className="font-disp text-2xl font-extrabold tracking-tight text-slate-900">Mis Cuentas Claras</h1>
            <span className="font-mono text-[9px] uppercase text-slate-400 tracking-wider font-bold">Registro Diario</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-650 hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
        >
          <TrendingUp size={15} />
        </button>
      </header>

      <main className="flex-1 w-full space-y-6">

        {/* 1. KPI Card: Balance Resumen (Ganancia / Entrado / Salido) */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl border-2 border-slate-950 shadow-[4px_4px_0px_#111118] space-y-5">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">Plata Libre (Ganancia)</span>
            <div className="font-disp text-4xl font-black tracking-tight text-white mt-1">
              {formatCOP(plataLibre)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <span className="font-mono text-[8px] uppercase tracking-wider text-slate-400 font-bold block mb-1">↗ Ha Entrado</span>
              <span className="font-mono text-xs font-black text-emerald-400">+{formatCOP(haEntrado)}</span>
            </div>
            <div>
              <span className="font-mono text-[8px] uppercase tracking-wider text-slate-400 font-bold block mb-1">↘ Ha Salido</span>
              <span className="font-mono text-xs font-black text-rose-400">-{formatCOP(haSalido)}</span>
            </div>
          </div>
        </div>

        {/* 2. Botones de Acción Rápidos (Lado a Lado) */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setModalType('income');
              setCategory('cobro_final');
              setIsModalOpen(true);
            }}
            className="flex flex-col items-center justify-center py-6 px-4 bg-emerald-50 border-2 border-emerald-200 hover:bg-emerald-100/50 rounded-3xl text-center transition-all active:scale-[0.98] cursor-pointer shadow-[3px_3px_0px_#10b981]"
          >
            <span className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-disp text-lg font-bold mb-2 shadow-sm">+</span>
            <span className="font-disp font-black text-xs uppercase tracking-wider text-emerald-950">Anotar una Venta</span>
            <span className="font-text text-[9px] text-emerald-800/80 mt-1">Ingreso de dinero</span>
          </button>

          <button
            onClick={() => {
              setModalType('expense');
              setCategory('materiales');
              setIsModalOpen(true);
            }}
            className="flex flex-col items-center justify-center py-6 px-4 bg-rose-50 border-2 border-rose-200 hover:bg-rose-100/50 rounded-3xl text-center transition-all active:scale-[0.98] cursor-pointer shadow-[3px_3px_0px_#f43f5e]"
          >
            <span className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-disp text-lg font-bold mb-2 shadow-sm">-</span>
            <span className="font-disp font-black text-xs uppercase tracking-wider text-rose-950">Anotar un Gasto</span>
            <span className="font-text text-[9px] text-rose-800/80 mt-1">Salida de dinero</span>
          </button>
        </div>

        {/* 3. Próximos 30 días (Proyecciones) */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-[hsl(var(--color-primary))]" />
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
          ) : null}
        </section>

        {/* 4. Historial de Movimientos */}
        <section className="space-y-3">
          <div className="flex items-center gap-1.5">
            <History size={14} className="text-[hsl(var(--color-primary))]" />
            <h2 className="font-mono text-[9px] uppercase font-bold tracking-wider text-slate-400">
              Historial de Movimientos
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {transactions.length === 0 ? (
              <div className="bg-white border border-slate-100 p-6 rounded-3xl text-center py-10 shadow-sm">
                <p className="font-text text-xs text-slate-500 font-bold">
                  📖 ¡Aún no hay movimientos!
                </p>
                <p className="font-text text-[10px] text-slate-400 leading-relaxed mt-1">
                  Registra ingresos y gastos futuros con los botones superiores para proyectar tu flujo de caja, o ingresa al Dashboard para gestionar tu catálogo e inventario.
                </p>
              </div>
            ) : (
              transactions.slice().reverse().map((tx) => {
                const associatedProduct = products.find(p => p.id === tx.productId);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={tx.id}
                    className="bg-white border border-slate-100 p-4.5 rounded-2xl flex items-center justify-between gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                        tx.type === 'income'
                          ? 'bg-emerald-50 text-emerald-500'
                          : 'bg-rose-50 text-rose-500'
                      }`}>
                        {tx.category === 'materiales' ? '🎨' :
                         tx.category === 'viaticos' ? '🚚' :
                         tx.category === 'suscripcion' ? '⚡' :
                         tx.category === 'taller' ? '🏢' :
                         tx.category === 'equipo' ? '⚙️' :
                         tx.category === 'personal' ? '👥' :
                         tx.category === 'anticipo' ? '💰' :
                         tx.category === 'cobro_final' ? '💵' :
                         '🏷️'}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-disp font-bold text-xs text-slate-800">{tx.description}</span>
                        <span className="font-text text-[9px] text-slate-400">
                          {associatedProduct ? (
                            <span className="text-[hsl(var(--color-primary))] font-semibold">
                              {associatedProduct.name}
                            </span>
                          ) : (
                            'Sin proyecto'
                          )}
                          {` · ${new Date(tx.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-xs font-black ${
                        tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCOP(tx.amount)}
                      </span>
                      <button
                        onClick={() => removeTransaction(tx.id)}
                        className="text-slate-300 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>

      </main>

      {/* Modal para Registrar Movimiento */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AnimatePresence>
          {isModalOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-[2.5rem] pt-5 pb-10 px-6 shadow-2xl border-t border-slate-100 focus:outline-none max-w-lg mx-auto max-h-[85dvh] overflow-y-auto"
                >
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <Dialog.Title className="font-disp text-lg font-black text-slate-800 flex items-center gap-2">
                        {modalType === 'income' ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            Anotar una Venta / Ingreso
                          </>
                        ) : (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            Anotar un Gasto / Salida
                          </>
                        )}
                      </Dialog.Title>
                      <Dialog.Description className="sr-only">
                        Registra un movimiento en tu bitácora.
                      </Dialog.Description>
                    </div>
                    <Dialog.Close className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-650 transition-colors border border-slate-100 cursor-pointer">
                      <X size={15} />
                    </Dialog.Close>
                  </div>

                  <form onSubmit={handleSaveTransaction} className="space-y-4">
                    {/* Monto */}
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                        Monto (COP)
                      </label>
                      <input
                        type="number"
                        placeholder="$0"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-lg font-mono font-black text-slate-800 focus:outline-none focus:border-[hsl(var(--color-primary))]/40 focus:bg-white transition-all"
                        value={amount}
                        onChange={e => setAmount(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                        Descripción / Detalle
                      </label>
                      <input
                        type="text"
                        placeholder={modalType === 'income' ? 'Ej. Venta del mural grande' : 'Ej. Compra de acrílicos y pinceles'}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-text text-slate-800 focus:outline-none focus:border-[hsl(var(--color-primary))]/40 focus:bg-white transition-all"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                      />
                    </div>

                    {/* Categoría */}
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                        Categoría
                      </label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-text text-slate-800 focus:outline-none focus:border-[hsl(var(--color-primary))]/40 focus:bg-white transition-all cursor-pointer"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                      >
                        {modalType === 'income' ? (
                          <>
                            <option value="anticipo">💰 Anticipo / Pago Parcial</option>
                            <option value="cobro_final">💵 Cobro Final / Venta</option>
                            <option value="otro">🏷️ Otro Ingreso</option>
                          </>
                        ) : (
                          <>
                            <option value="materiales">🎨 Materiales e Insumos</option>
                            <option value="viaticos">🚚 Logística y Viáticos</option>
                            <option value="suscripcion">⚡ Herramientas Digitales</option>
                            <option value="taller">🏢 Alquiler / Servicios de Taller</option>
                            <option value="equipo">⚙️ Equipos y Herramientas</option>
                            <option value="personal">👥 Personal / Ayudantes</option>
                            <option value="otro">🏷️ Otro Gasto</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Asociar a un Proyecto (Opcional) */}
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                        Asociar a un Proyecto (Opcional)
                      </label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-text text-slate-800 focus:outline-none focus:border-[hsl(var(--color-primary))]/40 focus:bg-white transition-all cursor-pointer"
                        value={productId}
                        onChange={e => setProductId(e.target.value)}
                      >
                        <option value="">Ninguno (No asociar a proyecto)</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.type === 'custom' ? '⭐' : '📦'} {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Botón de Enviar */}
                    <button
                      type="submit"
                      className={`w-full h-12 text-white rounded-2xl font-disp font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all active:scale-[0.98] cursor-pointer ${
                        modalType === 'income'
                          ? 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
                          : 'bg-rose-500 hover:bg-rose-600 shadow-[0_4px_12px_rgba(244,63,94,0.2)]'
                      }`}
                    >
                      Guardar Movimiento
                    </button>
                  </form>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-full transition-all cursor-pointer" title="Panel de Control">
          <LayoutGrid size={16} />
        </button>
        <button onClick={() => navigate('/journal')} className="p-2 bg-[hsl(var(--color-primary))] rounded-full text-white shadow-sm hover:bg-[hsl(var(--color-primary-hover))] transition-all cursor-pointer" title="Bitácora / Cuentas">
          <ClipboardList size={16} />
        </button>
      </nav>
    </div>
  );
}
