import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, Star, Info, Calculator, FlaskConical, Target, ChevronRight, Plus, Trash2, Search, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useFinancialData } from '../context/FinancialDataContext';
import { CostItem } from '../types';

export default function ProjectStudioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, getProductMath, getTotalFixedExpenses, getMarginStatus, updateProduct, studio, inventoryItems } = useFinancialData();

  const project = products.find(p => p.id === id);
  
  // Local state for simulation (Laboratory)
  const [simSellingPrice, setSimSellingPrice] = useState(project?.sellingPrice || 0);
  const [simUnits, setSimUnits] = useState(project?.estimatedUnits || 0);
  const [simCosts, setSimCosts] = useState<CostItem[]>(project?.productionCosts || []);

  // Dialog / Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState(0);
  const [customQuantity, setCustomQuantity] = useState(1);
  const [customIsFixed, setCustomIsFixed] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'custom'>('inventory');

  const filteredInventory = useMemo(() => {
    return (inventoryItems || []).filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventoryItems, searchTerm]);

  const handleAddFromInventory = (item: any) => {
    const newCostItem: CostItem = {
      id: crypto.randomUUID(),
      name: item.name,
      quantity: 1,
      unitPrice: item.unitCost,
      category: 'production',
      affectedByAuthorship: false,
      inventoryId: item.id,
      isFixed: false
    };
    setSimCosts(prev => [...prev, newCostItem]);
    setIsAddModalOpen(false);
    setSearchTerm('');
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newCostItem: CostItem = {
      id: crypto.randomUUID(),
      name: customName.trim(),
      quantity: customQuantity,
      unitPrice: customPrice,
      category: 'production',
      affectedByAuthorship: false,
      isFixed: project?.type === 'product' ? customIsFixed : false
    };
    setSimCosts(prev => [...prev, newCostItem]);
    setCustomName('');
    setCustomPrice(0);
    setCustomQuantity(1);
    setCustomIsFixed(false);
    setIsAddModalOpen(false);
  };

  if (!project) {
    return <div className="p-10 text-center font-mono">Proyecto no encontrado</div>;
  }

  // --- MATH RE-CALCULATION (Real Time) ---
  const math = useMemo(() => {
    const isProduct = project.type === 'product';
    const prodFixed = simCosts.filter(c => c.isFixed).reduce((a, c) => a + c.quantity * c.unitPrice, 0);
    const prodVariable = simCosts.filter(c => !c.isFixed).reduce((a, c) => a + c.quantity * c.unitPrice, 0);
    
    const productionTotal = isProduct
      ? prodVariable + (simUnits > 0 ? prodFixed / simUnits : 0)
      : simCosts.reduce((a, c) => a + c.quantity * c.unitPrice, 0);

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
  }, [simSellingPrice, simUnits, simCosts, project, products.length, getTotalFixedExpenses, getMarginStatus]);

  const toggleAuthorship = (costId: string) => {
    setSimCosts(prev => prev.map(c => c.id === costId ? { ...c, affectedByAuthorship: !c.affectedByAuthorship } : c));
  };

  const pieData = [
    { name: 'Cuota Fija', value: Math.max(math.productFixedShare, 0) },
    { name: 'Resto Meta', value: Math.max(getTotalFixedExpenses() * 1.5 - math.productFixedShare, 0) }
  ];

  const COLORS = ['hsl(var(--color-primary))', '#f1f5f9'];

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-slate-800 flex flex-col font-text pb-24 pt-0 overflow-x-hidden w-full">
      
      {/* 1. STICKY TRAFFIC LIGHT (Cabecera) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 py-5 px-6 md:px-12 shadow-[0_2px_15px_rgba(0,0,0,0.01)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-disp text-lg font-extrabold tracking-tight text-slate-800">{project.name}</h1>
              <span className="font-mono text-[9px] text-slate-400 uppercase font-bold tracking-wider">Estudio de Costeo</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:w-auto w-full md:min-w-[400px]">
            <div className="bg-white border border-slate-100 p-3 rounded-2xl flex flex-col items-center shadow-[0_4px_10px_rgba(0,0,0,0.01)]">
              <span className="font-mono text-[8px] text-slate-400 uppercase font-bold mb-1">Costo Real</span>
              <span className="font-mono text-xs font-black text-slate-700">${Math.round(math.productCost).toLocaleString()}</span>
            </div>
            <div className="bg-white border border-slate-100 p-3 rounded-2xl flex flex-col items-center shadow-[0_4px_10px_rgba(0,0,0,0.01)]">
              <span className="font-mono text-[8px] text-slate-400 uppercase font-bold mb-1">P. Sugerido</span>
              <span className="font-mono text-xs font-black text-[hsl(var(--color-secondary))]">${Math.round(math.productCost * 2.5).toLocaleString()}</span>
            </div>
            <div className={`p-3 rounded-2xl border flex flex-col items-center transition-colors duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.01)] ${
              math.marginStatus === 'healthy' ? 'bg-emerald-50/60 border-emerald-100 text-emerald-600' :
              math.marginStatus === 'warning' ? 'bg-amber-50/60 border-amber-100 text-amber-600' :
              'bg-rose-50/60 border-rose-100 text-rose-600'
            }`}>
              <span className="font-mono text-[8px] uppercase font-bold mb-1">Margen</span>
              <span className="font-mono text-xs font-black">{Math.round(math.profitMargin)}%</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Recipes and Break-even chart */}
          <div className="lg:col-span-7 space-y-8">
            {/* 2. LA RECETA (Lista de Costos) */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Calculator size={15} className="text-[hsl(var(--color-primary))]" />
                <h2 className="font-disp font-extrabold text-xs uppercase tracking-wider text-slate-400">Costos de Creación</h2>
              </div>
              
              <div className="flex flex-col gap-3">
                {simCosts.map((cost) => (
                  <div 
                    key={cost.id} 
                    className={`relative bg-white p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      cost.affectedByAuthorship 
                        ? 'border-[hsl(var(--color-primary))]/30 shadow-[0_4px_12px_hsl(var(--color-primary))]/5' 
                        : 'border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.01)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleAuthorship(cost.id)}
                        type="button"
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          cost.affectedByAuthorship 
                            ? 'bg-amber-50 border-amber-200 text-amber-500 shadow-sm' 
                            : 'border-slate-100 text-slate-300 hover:text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <Star size={14} fill={cost.affectedByAuthorship ? 'currentColor' : 'none'} />
                      </button>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-disp font-bold text-xs uppercase text-slate-800">{cost.name}</span>
                          {project.type === 'product' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSimCosts(prev => prev.map(c => c.id === cost.id ? { ...c, isFixed: !c.isFixed } : c));
                              }}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all ${
                                cost.isFixed 
                                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {cost.isFixed ? 'Fijo' : 'Variable'}
                            </button>
                          )}
                        </div>
                        {cost.inventoryId && (
                          <span className="font-mono text-[8px] uppercase tracking-wider text-slate-400 font-bold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md w-fit">
                            Cofre
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Inputs de Edición */}
                    <div className="flex items-center gap-2 sm:self-center self-end">
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl focus-within:border-[hsl(var(--color-primary))]/50 transition-colors">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={cost.quantity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setSimCosts(prev => prev.map(c => c.id === cost.id ? { ...c, quantity: val } : c));
                          }}
                          className="w-12 bg-transparent text-right font-mono text-xs font-bold text-slate-700 focus:outline-none"
                        />
                        <span className="font-mono text-[9px] text-slate-400 uppercase font-bold">Un.</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl focus-within:border-[hsl(var(--color-primary))]/50 transition-colors">
                        <span className="font-mono text-[9px] text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={cost.unitPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setSimCosts(prev => prev.map(c => c.id === cost.id ? { ...c, unitPrice: val } : c));
                          }}
                          className="w-16 bg-transparent text-right font-mono text-xs font-bold text-slate-700 focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSimCosts(prev => prev.filter(c => c.id !== cost.id));
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all cursor-pointer animate-pulse-hover"
                        title="Eliminar insumo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                type="button"
                className="w-full py-4 border border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-2xl text-slate-500 font-disp text-xs font-bold flex items-center justify-center gap-2 hover:border-slate-300 transition-all cursor-pointer"
              >
                 <Plus size={14} /> Añadir Costo
              </button>
            </section>

            {/* 4. PUNTO DE EQUILIBRIO (Footer Chart) */}
            <section className="bg-white border border-slate-100 rounded-3xl p-6.5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col items-center gap-4">
               <div className="flex items-center gap-2">
                  <Target size={15} className="text-amber-500" />
                  <h2 className="font-disp font-extrabold text-xs uppercase tracking-wider text-slate-400 text-center">Punto de Equilibrio del Producto o Proyecto</h2>
               </div>

               <div className="w-full h-48 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-0.5">
                     <span className="font-mono text-2xl font-black text-slate-700">{math.unitsNeeded}</span>
                     <span className="font-mono text-[8px] uppercase text-slate-400 font-bold">Unidades</span>
                  </div>
               </div>

               <div className="text-center max-w-md">
                  <p className="font-text text-xs text-slate-400 leading-relaxed">
                    Vende <span className="font-bold text-slate-650">{math.unitsNeeded} unidades</span> para cubrir tu cuota de <span className="font-mono font-bold text-[hsl(var(--color-primary))]">${Math.round(math.productFixedShare).toLocaleString()}</span> de gastos fijos.
                  </p>
               </div>
            </section>
          </div>

          {/* Right Column: Laboratory & Actions */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-40">
            {/* 3. EL LABORATORIO (Sandbox Sliders) */}
            <section className="bg-white border border-slate-100 rounded-3xl p-8 space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <div className="flex items-center gap-2">
                <FlaskConical size={15} className="text-[hsl(var(--color-secondary))]" />
                <h2 className="font-disp font-extrabold text-xs uppercase tracking-wider text-slate-400">El Laboratorio (Simulador)</h2>
              </div>              {/* Slider: Precio de Venta */}
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-4">
                   <label className="font-mono text-[9px] uppercase font-bold text-slate-400">Precio de Venta</label>
                   <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl focus-within:border-[hsl(var(--color-primary))]/50 transition-colors">
                     <span className="font-mono text-xs text-slate-400 font-bold">$</span>
                     <input
                       type="number"
                       value={simSellingPrice || ''}
                       onChange={(e) => setSimSellingPrice(parseFloat(e.target.value) || 0)}
                       className="w-24 bg-transparent text-right font-mono text-sm font-black text-slate-700 focus:outline-none"
                     />
                     <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">COP</span>
                   </div>
                </div>
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-5"
                  value={[simSellingPrice]}
                  max={Math.max(project.sellingPrice * 3, 5000000)}
                  step={1}
                  onValueChange={([val]) => setSimSellingPrice(val)}
                >
                  <Slider.Track className="bg-slate-100 relative grow rounded-full h-2.5">
                    <Slider.Range className="absolute bg-[hsl(var(--color-primary))] rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb className="block w-5.5 h-5.5 bg-white border border-slate-200 rounded-full hover:scale-105 focus:outline-none transition-transform shadow-md cursor-pointer" />
                </Slider.Root>
              </div>

              {/* Slider: Unidades / Mes */}
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-4">
                   <label className="font-mono text-[9px] uppercase font-bold text-slate-400">Producción Mensual</label>
                   <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl focus-within:border-[hsl(var(--color-secondary))]/50 transition-colors">
                     <input
                       type="number"
                       value={simUnits || ''}
                       onChange={(e) => setSimUnits(parseInt(e.target.value) || 0)}
                       className="w-16 bg-transparent text-right font-mono text-sm font-black text-slate-700 focus:outline-none"
                     />
                     <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">Un.</span>
                   </div>
                </div>
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-5"
                  value={[simUnits]}
                  max={Math.max(project.estimatedUnits * 5, 500)}
                  step={1}
                  onValueChange={([val]) => setSimUnits(val)}
                >
                  <Slider.Track className="bg-slate-100 relative grow rounded-full h-2.5">
                    <Slider.Range className="absolute bg-[hsl(var(--color-secondary))] rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb className="block w-5.5 h-5.5 bg-white border border-slate-200 rounded-full hover:scale-105 focus:outline-none transition-transform shadow-md cursor-pointer" />
                </Slider.Root>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-start gap-3">
                 <Info size={15} className="text-amber-500 shrink-0 mt-0.5" />
                 <p className="font-text text-xs text-slate-400 leading-relaxed">
                   Mover estos valores no cambia tus datos reales hasta que guardes los cambios.
                 </p>
              </div>
            </section>

            {/* Actions Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hidden lg:block">
              <button 
                onClick={() => {
                  updateProduct(project.id, {
                    sellingPrice: simSellingPrice,
                    estimatedUnits: simUnits,
                    productionCosts: simCosts
                  });
                  navigate('/dashboard');
                }}
                className="w-full bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white font-disp font-bold text-xs uppercase tracking-wider py-4.5 rounded-full shadow-[0_6px_20px_rgba(255,20,147,0.18)] hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                Guardar Cambios <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Floating Save Button (Visible only on mobile/tablet) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-sm z-50 lg:hidden">
        <button 
          onClick={() => {
            updateProduct(project.id, {
              sellingPrice: simSellingPrice,
              estimatedUnits: simUnits,
              productionCosts: simCosts
            });
            navigate('/dashboard');
          }}
          className="w-full bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white font-disp font-bold text-xs uppercase tracking-wider py-4 rounded-full shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          Guardar Cambios <ChevronRight size={16} />
        </button>
      </div>

      {/* Dialog Modal: Añadir Ingrediente */}
      <Dialog.Root open={isAddModalOpen} onOpenChange={(open) => {
        setIsAddModalOpen(open);
        if (!open) {
          setCustomName('');
          setCustomPrice(0);
          setCustomQuantity(1);
          setCustomIsFixed(false);
          setSearchTerm('');
        }
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-md bg-white border border-slate-100 rounded-[2.5rem] p-7 shadow-2xl z-50 max-h-[85vh] overflow-y-auto focus:outline-none flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <Dialog.Title className="font-disp text-base font-extrabold text-slate-800 uppercase tracking-tight">Añadir Costo</Dialog.Title>
                <Dialog.Description className="font-text text-xs text-slate-400">
                  Agrega insumos de tu cofre o registra un costo personalizado.
                </Dialog.Description>
              </div>
              <Dialog.Close className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X size={18} />
              </Dialog.Close>
            </div>

            {/* Tabs selector */}
            <div className="flex border-b border-slate-100 mb-5">
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`flex-1 pb-3 font-disp text-xs font-bold uppercase tracking-wider text-center cursor-pointer transition-colors ${
                  activeTab === 'inventory'
                    ? 'border-b-2 border-[hsl(var(--color-primary))] text-[hsl(var(--color-primary))]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Del Cofre ({filteredInventory.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`flex-1 pb-3 font-disp text-xs font-bold uppercase tracking-wider text-center cursor-pointer transition-colors ${
                  activeTab === 'custom'
                    ? 'border-b-2 border-[hsl(var(--color-primary))] text-[hsl(var(--color-primary))]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Personalizado
              </button>
            </div>

            {/* Tab: Del Cofre */}
            {activeTab === 'inventory' && (
              <div className="flex-1 flex flex-col overflow-hidden min-h-[250px]">
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar insumos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-text text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[hsl(var(--color-primary))] focus:bg-white transition-all"
                  />
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[220px] pr-1">
                  {filteredInventory.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400">
                      No se encontraron insumos en el cofre.
                    </div>
                  ) : (
                    filteredInventory.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddFromInventory(item)}
                        className="w-full flex justify-between items-center p-3.5 rounded-2xl border border-slate-100 hover:border-[hsl(var(--color-primary))]/20 hover:bg-slate-50/50 transition-all cursor-pointer text-left"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-disp font-bold text-xs uppercase text-slate-700">{item.name}</span>
                          <span className="font-mono text-[9px] text-slate-400 font-bold">
                            Stock: {item.totalQuantity} {item.unit}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-slate-750">
                            ${Math.round(item.unitCost).toLocaleString()}
                          </span>
                          <span className="font-mono text-[9px] text-slate-400 block uppercase font-bold">
                            por {item.unit}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab: Personalizado */}
            {activeTab === 'custom' && (
              <form onSubmit={handleAddCustom} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold block">
                    Nombre del Insumo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Cinta decorativa"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-text text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[hsl(var(--color-primary))] focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold block">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="1"
                      value={customQuantity === 0 ? '' : customQuantity}
                      onChange={(e) => setCustomQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-text text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[hsl(var(--color-primary))] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold block">
                      Costo Unitario
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="0"
                      value={customPrice === 0 ? '' : customPrice}
                      onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-text text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[hsl(var(--color-primary))] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {project.type === 'product' && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-disp font-bold text-xs uppercase text-slate-800">Costo Fijo de Lote</span>
                      <span className="font-text text-[10px] text-slate-400 leading-normal">
                        Se amortiza dividiéndose entre todas las unidades estimadas del lote.
                      </span>
                    </div>
                    <Switch.Root 
                      checked={customIsFixed} 
                      onCheckedChange={setCustomIsFixed}
                      className="w-8 h-5 bg-slate-100 rounded-full relative data-[state=checked]:bg-[hsl(var(--color-primary))] transition-colors border border-slate-200 cursor-pointer"
                    >
                       <Switch.Thumb className="block w-3.5 h-3.5 bg-white rounded-full translate-x-0.5 transition-transform data-[state=checked]:translate-x-3.5 shadow-sm" />
                    </Switch.Root>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white font-disp font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center mt-4"
                >
                  Agregar Costo
                </button>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
