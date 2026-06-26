import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Accordion from '@radix-ui/react-accordion';
import { Camera, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinancialData } from '../context/FinancialDataContext';

interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  icon: string;
  category: 'personal' | 'digital' | 'business' | 'otros';
  selected: boolean;
}

const DEFAULT_EXPENSES: ExpenseItem[] = [
  // 🏢 ESPACIO E INFRAESTRUCTURA (Category: 'personal')
  { id: 'alquiler_espacio', name: 'Alquiler de Taller, Local o Estudio', amount: 1200000, icon: '🏢', category: 'personal', selected: false },
  { id: 'servicios_taller', name: 'Servicios Públicos (Luz y Agua del Taller)', amount: 200000, icon: '🔌', category: 'personal', selected: false },
  { id: 'conectividad', name: 'Internet y Conectividad del Estudio', amount: 90000, icon: '🌐', category: 'personal', selected: false },
  { id: 'mantenimiento_equipos', name: 'Mantenimiento de Herramientas/Equipos', amount: 150000, icon: '⚙️', category: 'personal', selected: false },

  // 🎨 PRODUCCIÓN Y OPERACIONES (Category: 'business')
  { id: 'sueldo_propio', name: 'Tu Sueldo Propio (Retribución Mensual)', amount: 1500000, icon: '💰', category: 'business', selected: false },
  { id: 'ayudantes_taller', name: 'Asistencia o Ayudantes de Taller', amount: 600000, icon: '👥', category: 'business', selected: false },
  { id: 'logistica_envios', name: 'Logística y Desplazamientos (Entrega/Fletes)', amount: 250000, icon: '🚚', category: 'business', selected: false },
  { id: 'contabilidad', name: 'Contabilidad o Asesoría Tributaria', amount: 150000, icon: '📊', category: 'business', selected: false },

  // ⚡ HERRAMIENTAS DIGITALES (Category: 'digital')
  { id: 'adobe', name: 'Adobe Creative Cloud', amount: 240000, icon: '🎨', category: 'digital', selected: false },
  { id: 'canva', name: 'Canva Pro', amount: 35000, icon: '🖌️', category: 'digital', selected: false },
  { id: 'figma', name: 'Figma Pro', amount: 60000, icon: '📐', category: 'digital', selected: false },
  { id: 'chatgpt', name: 'ChatGPT Plus (Redacción/Ideas)', amount: 85000, icon: '🤖', category: 'digital', selected: false },
  { id: 'notion', name: 'Notion Plus (Organización)', amount: 40000, icon: '📝', category: 'digital', selected: false },
  { id: 'spotify', name: 'Spotify Premium (Música para el Taller)', amount: 18000, icon: '🎵', category: 'digital', selected: false },
];

const CATEGORIES = [
  { id: 'personal', label: 'Espacio e Infraestructura', icon: '🏢' },
  { id: 'business', label: 'Operaciones del Taller', icon: '🎨' },
  { id: 'digital',  label: 'Herramientas Digitales', icon: '⚡' },
  { id: 'otros',    label: 'Otros Costos Fijos', icon: '➕' },
] as const;

const formatCOP = (num: number) => '$' + num.toLocaleString('es-CO') + ' COP';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { updateStudio, updateFixedExpenses } = useFinancialData();
  
  const [step, setStep] = useState<number>(() => {
    const saved = localStorage.getItem('onboarding_step_v3');
    return saved ? Number(saved) : 1;
  });
  const [bgPreview, setBgPreview] = useState<string | null>(() => {
    return localStorage.getItem('onboarding_bgPreview_v3');
  });
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('onboarding_expenses_v3');
    return saved ? JSON.parse(saved) : DEFAULT_EXPENSES;
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wizardData, setWizardData] = useState(() => {
    const saved = localStorage.getItem('onboarding_wizardData_v3');
    return saved ? JSON.parse(saved) : { projectName: '', extraGoalAmount: 0 };
  });
  const [directGoal, setDirectGoal] = useState<number>(() => {
    const saved = localStorage.getItem('onboarding_directGoal_v3');
    return saved ? Number(saved) : 0;
  });
  const [showDirectGoal, setShowDirectGoal] = useState<boolean>(() => {
    const saved = localStorage.getItem('onboarding_showDirectGoal_v3');
    return saved === 'true';
  });

  React.useEffect(() => {
    localStorage.setItem('onboarding_step_v3', String(step));
  }, [step]);

  React.useEffect(() => {
    if (bgPreview) {
      localStorage.setItem('onboarding_bgPreview_v3', bgPreview);
    } else {
      localStorage.removeItem('onboarding_bgPreview_v3');
    }
  }, [bgPreview]);

  React.useEffect(() => {
    localStorage.setItem('onboarding_expenses_v3', JSON.stringify(expenses));
  }, [expenses]);

  React.useEffect(() => {
    localStorage.setItem('onboarding_wizardData_v3', JSON.stringify(wizardData));
  }, [wizardData]);

  React.useEffect(() => {
    localStorage.setItem('onboarding_directGoal_v3', String(directGoal));
  }, [directGoal]);

  React.useEffect(() => {
    localStorage.setItem('onboarding_showDirectGoal_v3', String(showDirectGoal));
  }, [showDirectGoal]);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const toggleExpense = (id: string) =>
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, selected: !e.selected } : e));

  const saveAmount = (id: string, newAmount: number) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, amount: Math.max(0, newAmount) } : e));
    setEditingId(null);
  };

  const handleFinish = () => {
    const selectedList = expenses.filter(e => e.selected);
    let housing = 0, food = 0, transport = 0, workshopRent = 0, equipmentInstallments = 0;
    const subscriptions: any[] = [];

    selectedList.forEach(item => {
      if (item.category === 'digital') {
        subscriptions.push({ id: item.id, name: item.name, icon: item.icon, monthlyAmount: item.amount, isActive: true });
      } else if (item.id === 'alquiler_espacio' || item.id === 'servicios_taller' || item.id === 'conectividad') {
        housing += item.amount;
      } else if (item.id === 'mantenimiento_equipos' || item.category === 'otros') {
        food += item.amount;
      } else if (item.id === 'logistica_envios') {
        transport += item.amount;
      } else if (item.id === 'sueldo_propio' || item.id === 'ayudantes_taller' || item.id === 'contabilidad') {
        workshopRent += item.amount;
      }
    });

    updateStudio({ projectName: wizardData.projectName, backgroundImageUrl: bgPreview, extraGoalAmount: wizardData.extraGoalAmount, onboardingCompleted: true });
    
    if (showDirectGoal && directGoal > 0) {
      // Modo rápido: guarda la meta directa
      updateFixedExpenses({ housing: 0, food: 0, transport: 0, subscriptions: [], workshopRent: 0, equipmentInstallments: 0, directGoal });
    } else {
      // Modo detallado: guarda los ítems seleccionados
      updateFixedExpenses({ housing, food, transport, subscriptions, workshopRent, equipmentInstallments, directGoal: 0 });
    }

    // Limpiar progreso del onboarding
    localStorage.removeItem('onboarding_step_v3');
    localStorage.removeItem('onboarding_bgPreview_v3');
    localStorage.removeItem('onboarding_expenses_v3');
    localStorage.removeItem('onboarding_wizardData_v3');
    localStorage.removeItem('onboarding_directGoal_v3');
    localStorage.removeItem('onboarding_showDirectGoal_v3');

    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#7B2FFF', '#00C853', '#FFD600', '#6B21FF'] });
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  // La meta activa es el slider si está en modo rápido, si no, la suma de ítems
  const itemsTotal = expenses.filter(e => e.selected).reduce((acc, item) => acc + item.amount, 0);
  const totalAmount = showDirectGoal && directGoal > 0 ? directGoal : itemsTotal;
  const maxBarValue = 10000000;
  const percentage = Math.min((totalAmount / maxBarValue) * 100, 100);

  const SLIDER_MAX = 10000000;
  const SLIDER_STEP = 100000;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-canvas)] py-16 px-6">

      {/* Progress Dots */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              step === i ? 'w-10 bg-[hsl(var(--color-primary))]' : step > i ? 'w-3 bg-[hsl(var(--color-primary))]/40' : 'w-3 bg-slate-200'
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-xl lg:max-w-3xl">
        <AnimatePresence mode="wait">

          {/* ─────────────────── STEP 1 ─────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="space-y-10"
            >
              <div className="space-y-3">
                <h1 className="font-disp text-4xl md:text-5xl font-extrabold leading-tight text-slate-900 tracking-tight">
                  Primero, <span className="text-[hsl(var(--color-primary))]">bautiza</span> tu espacio.
                </h1>
                <p className="font-text text-base text-slate-500">
                  Dale un nombre a tu taller o proyecto creativo para empezar a controlar tus gastos.
                </p>
              </div>

              <div className="space-y-6">
                {/* Project name input */}
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                    Nombre de tu proyecto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Taller Azul, Estudio Creativo..."
                    className="w-full border-0 border-b-2 border-slate-200 bg-transparent px-0 py-3 text-lg font-disp font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[hsl(var(--color-primary))] transition-colors duration-300"
                    value={wizardData.projectName}
                    onChange={e => setWizardData({ ...wizardData, projectName: e.target.value })}
                  />
                </div>

                {/* Upload Zone */}
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                    Foto de fondo (opcional)
                  </label>
                  <label className="group relative w-full h-32 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-[hsl(var(--color-primary))] transition-all duration-300 overflow-hidden">
                    {bgPreview ? (
                      <div className="relative w-full h-full">
                        <img src={bgPreview} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-slate-400 group-hover:text-[hsl(var(--color-primary))] transition-colors">
                        <Camera className="w-5 h-5" />
                        <span className="font-text text-sm font-semibold">Sube una foto de tu taller</span>
                      </div>
                    )}
                    <input type="file" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setBgPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
              </div>

              <button
                disabled={!wizardData.projectName}
                onClick={nextStep}
                className="w-full py-5 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white font-disp font-bold text-sm uppercase tracking-wider rounded-2xl shadow-[0_8px_30px_hsl(264_89%_58%/0.3)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Continuar →
              </button>
            </motion.div>
          )}

          {/* ─────────────────── STEP 2 ─────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="flex flex-col h-[82vh] max-h-[740px] w-full"
            >
              {/* Header y Barra de Progreso - Fijo */}
              <div className="pb-4 space-y-5 border-b border-slate-100 shrink-0">
                <div className="space-y-2">
                  <h2 className="font-disp text-4xl md:text-5xl font-extrabold leading-tight text-slate-900 tracking-tight">
                    Hablemos de tu <span className="text-[hsl(var(--color-primary))]">estudio</span>.
                  </h2>
                  <p className="font-text text-base text-slate-500">
                    ¿Cuánto cuesta mantener tu espacio activo? Selecciona los fijos mensuales de tu taller.
                  </p>
                </div>

                {/* Total proyectado */}
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">Costo Fijo Operativo</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">{Math.round(percentage)}%</span>
                  </div>
                  <div className="font-disp text-3xl font-extrabold text-[hsl(var(--color-primary))]">
                    {formatCOP(totalAmount)}
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[hsl(var(--color-primary))] transition-all duration-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Contenido Desplazable */}
              <div className="flex-1 overflow-y-auto py-5 pr-1 space-y-6 scrollbar-thin">
                {/* Opción rápida: slider directo */}
                <div className="border border-amber-200 bg-amber-50/40 rounded-2xl overflow-hidden transition-all duration-300 hover:border-amber-300">
                  <button
                    onClick={() => setShowDirectGoal(v => !v)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-amber-100/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl filter drop-shadow-[0_2px_4px_rgba(245,158,11,0.2)]">⚡</span>
                      <div>
                        <p className="font-disp font-bold text-sm text-amber-900">
                          ¿No te quieres complicar?
                        </p>
                        <p className="font-text text-xs text-amber-700/80">Pon el estimado de forma directa</p>
                      </div>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-amber-600 transition-transform duration-300 ${showDirectGoal ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showDirectGoal && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Tu meta mensual</span>
                        <span className="font-disp font-bold text-lg text-[hsl(var(--color-primary))]">
                          {formatCOP(directGoal)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={SLIDER_MAX}
                        step={SLIDER_STEP}
                        value={directGoal}
                        onChange={e => setDirectGoal(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, hsl(var(--color-primary)) ${(directGoal / SLIDER_MAX) * 100}%, #e2e8f0 ${(directGoal / SLIDER_MAX) * 100}%)`,
                        }}
                      />
                      <div className="flex justify-between font-mono text-[9px] text-slate-400">
                        <span>$0</span>
                        <span>$2.5M</span>
                        <span>$5M</span>
                        <span>$7.5M</span>
                        <span>$10M</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion de categorías */}
                <Accordion.Root type="multiple" className="space-y-2">
                  {CATEGORIES.map(cat => {
                    const items = expenses.filter(e => e.category === cat.id);
                    const selectedCount = items.filter(e => e.selected).length;

                    return (
                      <Accordion.Item
                        key={cat.id}
                        value={cat.id}
                        className="border border-slate-200 rounded-2xl overflow-hidden"
                      >
                        <Accordion.Header>
                          <Accordion.Trigger className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{cat.icon}</span>
                              <span className="font-disp font-bold text-sm text-slate-800">{cat.label}</span>
                              {selectedCount > 0 && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[hsl(var(--color-primary))]/10 text-[hsl(var(--color-primary))]">
                                  {selectedCount} selec.
                                </span>
                              )}
                            </div>
                            <ChevronDown
                              size={16}
                              className="text-slate-400 transition-transform duration-300 group-data-[state=open]:rotate-180"
                            />
                          </Accordion.Trigger>
                        </Accordion.Header>

                        <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                          <div className="px-5 pb-4 space-y-1 border-t border-slate-100">
                            
                            {cat.id === 'otros' && (
                              <div className="space-y-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100 mb-2 mt-2">
                                <p className="font-text text-xs text-slate-400 font-semibold">¿Tienes otros costos fijos que no estén en la lista? Agrégalos aquí:</p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="text"
                                    placeholder="Nombre del gasto fijos"
                                    id="custom-name-input"
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-text focus:outline-none focus:border-[hsl(var(--color-primary))]"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Monto"
                                    id="custom-amount-input"
                                    className="w-full sm:w-28 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-[hsl(var(--color-primary))]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nameEl = document.getElementById('custom-name-input') as HTMLInputElement;
                                      const amountEl = document.getElementById('custom-amount-input') as HTMLInputElement;
                                      const name = nameEl?.value.trim();
                                      const amount = Number(amountEl?.value) || 0;
                                      if (name && amount > 0) {
                                        const newCustomItem = {
                                          id: 'custom_' + Date.now(),
                                          name,
                                          amount,
                                          icon: '🏷️',
                                          category: 'otros' as const,
                                          selected: true
                                        };
                                        setExpenses(prev => [...prev, newCustomItem]);
                                        nameEl.value = '';
                                        amountEl.value = '';
                                      }
                                    }}
                                    className="bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white rounded-xl px-4 py-2 text-xs font-disp font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                  >
                                    + Agregar
                                  </button>
                                </div>
                              </div>
                            )}

                            {items.map(item => (
                              <div
                                key={item.id}
                                onClick={() => toggleExpense(item.id)}
                                className={`flex items-center justify-between py-3 px-3 rounded-xl cursor-pointer transition-all ${
                                  item.selected
                                    ? 'bg-[hsl(var(--color-primary))]/8 text-[hsl(var(--color-primary))]'
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {/* Custom checkbox */}
                                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                    item.selected
                                      ? 'bg-[hsl(var(--color-primary))] border-[hsl(var(--color-primary))]'
                                      : 'border-slate-300'
                                  }`}>
                                    {item.selected && (
                                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    )}
                                  </div>
                                  <span className="text-base">{item.icon}</span>
                                  <span className="font-text text-sm font-semibold">{item.name}</span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                  {editingId === item.id ? (
                                    <input
                                      type="number"
                                      defaultValue={item.amount}
                                      autoFocus
                                      onBlur={e => saveAmount(item.id, Number(e.target.value))}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') saveAmount(item.id, Number((e.target as HTMLInputElement).value));
                                      }}
                                      className="w-24 border border-[hsl(var(--color-primary))] rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-slate-800 focus:outline-none"
                                    />
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <span className={`font-mono text-xs font-bold ${item.selected ? 'text-[hsl(var(--color-primary))]' : 'text-slate-500'}`}>
                                        ${item.amount.toLocaleString('es-CO')}
                                      </span>
                                      {item.selected && (
                                        <button
                                          onClick={() => setEditingId(item.id)}
                                          className="text-slate-300 hover:text-[hsl(var(--color-primary))] transition-colors p-1 text-[10px] cursor-pointer"
                                          title="Editar"
                                        >
                                          ✏️
                                        </button>
                                      )}
                                      {item.id.startsWith('custom_') && (
                                        <button
                                          onClick={() => {
                                            setExpenses(prev => prev.filter(e => e.id !== item.id));
                                          }}
                                          className="text-rose-400 hover:text-rose-600 transition-colors p-1 text-xs cursor-pointer ml-1"
                                          title="Eliminar"
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                    );
                  })}
                </Accordion.Root>
              </div>

              {/* Footer Fijo */}
              <div className="pt-4 flex items-center gap-4 border-t border-slate-100 shrink-0 bg-[var(--color-canvas)]">
                <button
                  onClick={prevStep}
                  className="py-5 px-8 font-disp font-bold text-sm text-slate-500 hover:text-slate-800 transition-colors border-2 border-slate-200 hover:border-slate-300 rounded-2xl cursor-pointer"
                >
                  Atrás
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 py-5 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white font-disp font-bold text-sm uppercase tracking-wider rounded-2xl shadow-[0_8px_30px_hsl(264_89%_58%/0.3)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer"
                >
                  Siguiente →
                </button>
              </div>
            </motion.div>
          )}

          {/* ─────────────────── STEP 3 ─────────────────── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="space-y-10"
            >
              <div className="space-y-3">
                <h2 className="font-disp text-4xl md:text-5xl font-extrabold leading-tight text-slate-900 tracking-tight">
                  Tu <span className="text-[hsl(var(--color-primary))]">Meta</span> Real.
                </h2>
                <p className="font-text text-base text-slate-500">
                  Esto es lo que necesitas generar libre al mes para que el negocio sea sostenible.
                </p>
              </div>

              {/* Goal display */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Objetivo Mensual</span>
                <div className="font-disp text-5xl md:text-6xl font-extrabold text-[hsl(var(--color-primary))] tracking-tight">
                  {formatCOP(totalAmount)}
                </div>
                <p className="font-text text-sm text-slate-500 leading-relaxed pt-2">
                  A partir de aquí calcularemos el margen de ganancia de cada cotización para asegurar tu rentabilidad.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={prevStep}
                  className="py-5 px-8 font-disp font-bold text-sm text-slate-500 hover:text-slate-800 transition-colors border-2 border-slate-200 hover:border-slate-300 rounded-2xl cursor-pointer"
                >
                  Revisar
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-1 py-5 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white font-disp font-bold text-sm uppercase tracking-wider rounded-2xl shadow-[0_8px_30px_hsl(264_89%_58%/0.3)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 cursor-pointer"
                >
                  ¡A Romperla! 🚀
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
