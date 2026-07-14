import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ArrowRight, ArrowLeft, Star, Clock, 
  Package, Truck, Utensils, Construction,
  Search, AlertCircle, Save, ChevronRight, Plus
} from 'lucide-react';
import * as Accordion from '@radix-ui/react-accordion';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import { useFinancialData } from '../context/FinancialDataContext';
import { Product, CostItem } from '../types';

type CreationType = 'service' | 'product' | null;

export default function CreationWizard() {
  const navigate = useNavigate();
  const { addProduct, inventoryItems } = useFinancialData();
  
  const [step, setStep] = useState(1);
  const [creationType, setCreationType] = useState<CreationType>(null);
  
  // Common State
  const [name, setName] = useState('');
  
  // Step 2A (Service) State
  const [serviceMode, setServiceMode] = useState<'hour' | 'day'>('hour');
  const [serviceRate, setServiceRate] = useState(0);
  const [serviceTime, setServiceTime] = useState(0);
  const [serviceCosts, setServiceCosts] = useState<CostItem[]>([]);
  
  // Step 2B (Product) State
  const [initialInvestment, setInitialInvestment] = useState(0);
  const [estimatedUnits, setEstimatedUnits] = useState(1);
  const [productionCosts, setProductionCosts] = useState<CostItem[]>([]);
  const [distributionCosts, setDistributionCosts] = useState<CostItem[]>([]);

  // Simulation State
  const [sellingPrice, setSellingPrice] = useState(0);

  // --- MATH HELPERS ---
  const getProductCost = () => {
    if (creationType === 'service') {
      const labor = serviceRate * serviceTime;
      const materials = serviceCosts.reduce((a, b) => a + (b.unitPrice * b.quantity), 0);
      return labor + materials;
    } else {
      const production = productionCosts.reduce((a, b) => a + (b.unitPrice * b.quantity), 0);
      const distribution = distributionCosts.reduce((a, b) => a + (b.unitPrice * b.quantity), 0);
      const investmentPerUnit = estimatedUnits > 0 ? initialInvestment / estimatedUnits : 0;
      return production + distribution + investmentPerUnit;
    }
  };

  const productCost = getProductCost();
  const profitMargin = sellingPrice > 0 ? ((sellingPrice - productCost) / sellingPrice) * 100 : 0;

  const handleSave = () => {
    const newProduct: Partial<Product> = {
      name: name || (creationType === 'service' ? 'Nuevo Servicio' : 'Nuevo Producto'),
      type: creationType === 'service' ? 'custom' : 'product',
      sellingPrice: sellingPrice,
      estimatedUnits: creationType === 'service' ? 1 : estimatedUnits,
      initialInvestment: creationType === 'service' ? 0 : initialInvestment,
      productionCosts: creationType === 'service' ? serviceCosts : productionCosts,
      distributionCosts: creationType === 'service' ? [] : distributionCosts,
      amountCollected: 0
    };
    
    addProduct(newProduct as Omit<Product, 'id'>);
    navigate('/dashboard');
  };

  const addCostItem = (category: 'production' | 'distribution' | 'service') => {
    const newItem: CostItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Nuevo Item',
      quantity: 1,
      unitPrice: 0,
      category: category === 'service' ? 'production' : category,
      affectedByAuthorship: false
    };

    if (category === 'service') setServiceCosts([...serviceCosts, newItem]);
    else if (category === 'production') setProductionCosts([...productionCosts, newItem]);
    else setDistributionCosts([...distributionCosts, newItem]);
  };

  const updateCostItem = (id: string, updates: Partial<CostItem>, category: string) => {
    const setter = category === 'service' ? setServiceCosts : category === 'production' ? setProductionCosts : setDistributionCosts;
    const list = category === 'service' ? serviceCosts : category === 'production' ? productionCosts : distributionCosts;
    setter(list.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeCostItem = (id: string, category: string) => {
    const setter = category === 'service' ? setServiceCosts : category === 'production' ? setProductionCosts : setDistributionCosts;
    const list = category === 'service' ? serviceCosts : category === 'production' ? productionCosts : distributionCosts;
    setter(list.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-slate-800 flex flex-col font-text overflow-x-hidden relative pb-32 max-w-lg mx-auto border-x border-slate-100">
      
      {/* 1. STICKY HEADER (Check de Salud) */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 p-6 flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.01)]">
         <button onClick={() => navigate('/dashboard')} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
            <X size={16} />
         </button>
         
         <div className="flex flex-col items-center">
            <span className="font-mono text-[9px] uppercase font-bold text-slate-400">Costo Total Est.</span>
            <span className="font-mono text-sm font-bold text-slate-600">${Math.round(productCost).toLocaleString()}</span>
         </div>

         <div className="flex flex-col items-end">
            <span className="font-mono text-[9px] uppercase font-bold text-slate-400">Margen</span>
            <span className={`font-mono text-sm font-bold ${
              profitMargin > 60 ? 'text-emerald-500' : profitMargin > 40 ? 'text-amber-500' : 'text-rose-500'
            }`}>
              {Math.round(profitMargin)}%
            </span>
         </div>
      </header>

      <main className="flex-1 p-6">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Selector de ADN */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="flex flex-col gap-8 py-4"
            >
              <div className="space-y-1.5">
                <h2 className="font-disp text-3xl font-black uppercase italic leading-tight text-slate-850">
                  ¿Qué estás <br/> <span className="text-[hsl(var(--color-primary))]">creando</span> hoy?
                </h2>
                <p className="font-text text-xs text-slate-400">Elige la lógica de tu nuevo proyecto.</p>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => { setCreationType('service'); setStep(2); }}
                  className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)] text-left flex items-start gap-5 group hover:border-[hsl(var(--color-primary))]/20 hover:shadow-[0_8px_30px_rgba(255,20,147,0.02)] transition-all cursor-pointer"
                >
                   <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center text-[hsl(var(--color-primary))] border border-pink-100/50 group-hover:scale-105 transition-transform flex-shrink-0">
                      <Construction size={22} />
                   </div>
                   <div className="flex flex-col gap-1">
                      <h3 className="font-disp text-base font-bold uppercase text-slate-800">Proyecto a Medida</h3>
                      <p className="text-[11px] text-slate-450 leading-relaxed font-text">Servicios creativos, tiempo, viáticos y clientes específicos.</p>
                   </div>
                </button>

                <button
                  onClick={() => { setCreationType('product'); setStep(2); }}
                  className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)] text-left flex items-start gap-5 group hover:border-[hsl(var(--color-secondary))]/20 hover:shadow-[0_8px_30px_rgba(0,200,83,0.015)] transition-all cursor-pointer"
                >
                   <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-[hsl(var(--color-secondary))] border border-emerald-100/50 group-hover:scale-105 transition-transform flex-shrink-0">
                      <Package size={22} />
                   </div>
                   <div className="flex flex-col gap-1">
                      <h3 className="font-disp text-base font-bold uppercase text-slate-800">Producto de Catálogo</h3>
                      <p className="text-[11px] text-slate-450 leading-relaxed font-text">Series, inventario, producción en serie y venta directa.</p>
                   </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Flujo Detallado */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="flex flex-col gap-8 py-4"
            >
              <div className="flex items-center gap-3">
                 <button onClick={() => setStep(1)} className="p-2 bg-slate-50 rounded-full text-slate-450 hover:text-slate-700 transition-colors cursor-pointer"><ArrowLeft size={16}/></button>
                 <h2 className="font-disp text-lg font-bold uppercase text-slate-800">
                   {creationType === 'service' ? 'Logística de Servicio' : 'Plan de Producción'}
                 </h2>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                   <label className="font-mono text-[9px] uppercase font-bold text-slate-400">Nombre del Proyecto / Producto</label>
                   <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Mural Calle 10..."
                    className="w-full bg-slate-50/50 border border-slate-100 p-4 rounded-2xl font-disp font-bold text-base outline-none focus:border-[hsl(var(--color-primary))]/40 transition-all placeholder:text-slate-350 text-slate-700"
                   />
                </div>

                {creationType === 'service' ? (
                  /* --- FLOW 2A: SERVICE --- */
                  <div className="flex flex-col gap-6">
                    {/* Mano de Obra */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
                       <div className="flex justify-between items-center">
                          <h3 className="font-disp font-bold uppercase text-xs text-slate-700">Mano de Obra</h3>
                          <div className="flex bg-slate-50 border border-slate-100 rounded-lg overflow-hidden text-[9px] font-mono font-bold">
                             <button 
                               onClick={() => setServiceMode('hour')}
                               className={`px-3 py-1.5 cursor-pointer ${serviceMode === 'hour' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
                             >HORA</button>
                             <button 
                               onClick={() => setServiceMode('day')}
                               className={`px-3 py-1.5 cursor-pointer ${serviceMode === 'day' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
                             >DÍA</button>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                             <span className="font-mono text-[8px] text-slate-400 uppercase font-bold">Tarifa</span>
                             <input 
                               type="number" 
                               value={serviceRate || ''}
                               onChange={(e) => setServiceRate(Number(e.target.value))}
                               className="bg-transparent border-b border-slate-200 focus:border-[hsl(var(--color-primary))] font-mono font-bold text-base text-slate-700 outline-none pb-0.5"
                             />
                          </div>
                          <div className="flex flex-col gap-1.5">
                             <span className="font-mono text-[8px] text-slate-400 uppercase font-bold">Cantidad ({serviceMode})</span>
                             <input 
                               type="number" 
                               value={serviceTime || ''}
                               onChange={(e) => setServiceTime(Number(e.target.value))}
                               className="bg-transparent border-b border-slate-200 focus:border-[hsl(var(--color-primary))] font-mono font-bold text-base text-slate-700 outline-none pb-0.5"
                             />
                          </div>
                       </div>
                    </div>

                    {/* Logística Accordion */}
                    <Accordion.Root type="multiple" className="space-y-4">
                       <Accordion.Item value="materials" className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm">
                          <Accordion.Header>
                            <Accordion.Trigger className="w-full p-5 flex justify-between items-center font-disp font-bold text-xs uppercase text-slate-800 hover:bg-slate-50 transition-colors">
                               Materiales (Cofre)
                            </Accordion.Trigger>
                          </Accordion.Header>
                          <Accordion.Content className="p-5 pt-0 space-y-4">
                             <div className="flex flex-col gap-2.5">
                               {serviceCosts.map(item => (
                                 <div key={item.id} className="flex items-center justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-slate-700">
                                    <div className="flex flex-col gap-0.5">
                                       <span className="font-disp font-bold text-xs uppercase text-slate-800">{item.name}</span>
                                       <span className="font-mono text-[9px] font-bold text-slate-400">{item.quantity} un x ${item.unitPrice}</span>
                                    </div>
                                    <button onClick={() => removeCostItem(item.id, 'service')} className="text-slate-350 hover:text-rose-500 transition-colors cursor-pointer"><X size={15}/></button>
                                 </div>
                               ))}
                               <button 
                                 onClick={() => addCostItem('service')}
                                 className="w-full py-3 border border-dashed border-slate-200 hover:border-slate-300 rounded-xl text-slate-500 font-disp text-[10px] uppercase font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                               >
                                  <Plus size={14}/> Añadir Material
                               </button>
                             </div>
                          </Accordion.Content>
                       </Accordion.Item>
                    </Accordion.Root>
                  </div>
                ) : (
                  /* --- FLOW 2B: PRODUCT --- */
                  <div className="flex flex-col gap-6">
                    <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-md space-y-6">
                       <div className="flex justify-between items-center">
                          <h3 className="font-disp font-bold uppercase text-xs text-white/80">Lógica de Serie</h3>
                          <Package size={18} className="opacity-55" />
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                             <label className="font-mono text-[8px] uppercase font-bold text-white/50">Inversión Inicial</label>
                             <input 
                               type="number"
                               value={initialInvestment || ''}
                               onChange={(e) => setInitialInvestment(Number(e.target.value))}
                               className="w-full bg-white/5 border-b border-white/20 focus:border-white/50 font-mono font-black text-lg outline-none pb-1"
                             />
                          </div>
                          <div className="space-y-1.5">
                             <label className="font-mono text-[8px] uppercase font-bold text-white/50">Unidades Totales</label>
                             <input 
                               type="number"
                               value={estimatedUnits || ''}
                               onChange={(e) => setEstimatedUnits(Number(e.target.value))}
                               className="w-full bg-white/5 border-b border-white/20 focus:border-white/50 font-mono font-black text-lg outline-none pb-1"
                             />
                          </div>
                       </div>
                       <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-mono">
                          <span className="opacity-50">Inversión x Unidad:</span>
                          <span className="font-black text-sm">${Math.round(initialInvestment / (estimatedUnits || 1))}</span>
                       </div>
                    </div>

                    {/* Production Costs List */}
                    <div className="space-y-3.5">
                       <h3 className="font-disp font-extrabold text-xs uppercase tracking-wider text-slate-400">Costos de Producción</h3>
                       <div className="flex flex-col gap-2.5">
                          {productionCosts.map(item => (
                            <div key={item.id} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.01)]">
                               <input 
                                 placeholder="Nombre..."
                                 className="flex-1 bg-transparent font-disp font-bold text-xs uppercase outline-none text-slate-700"
                                 value={item.name}
                                 onChange={(e) => updateCostItem(item.id, { name: e.target.value }, 'production')}
                               />
                               <input 
                                 type="number"
                                 className="w-16 bg-slate-50 border border-slate-100 rounded-lg p-1.5 font-mono text-[10px] text-center text-slate-700 focus:border-[hsl(var(--color-primary))] outline-none"
                                 value={item.unitPrice || ''}
                                 onChange={(e) => updateCostItem(item.id, { unitPrice: Number(e.target.value) }, 'production')}
                               />
                               <button onClick={() => removeCostItem(item.id, 'production')} className="text-slate-300 hover:text-rose-500 cursor-pointer"><X size={15}/></button>
                            </div>
                          ))}
                          <button 
                            onClick={() => addCostItem('production')}
                            className="py-3.5 border border-dashed border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 rounded-2xl text-slate-400 flex items-center justify-center cursor-pointer transition-all"
                          >
                             <Plus size={16}/>
                          </button>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setStep(3)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-full font-disp text-xs font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer transition-all"
              >
                 Continuar al Simulador <ArrowRight size={15}/>
              </button>
            </motion.div>
          )}

          {/* STEP 3: Check de Salud y Guardado */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="flex flex-col gap-8 py-4"
            >
               <div className="flex items-center gap-3">
                 <button onClick={() => setStep(2)} className="p-2 bg-slate-50 rounded-full text-slate-450 hover:text-slate-700 transition-colors cursor-pointer"><ArrowLeft size={16}/></button>
                 <h2 className="font-disp text-lg font-bold uppercase text-slate-800">Definir Precio</h2>
              </div>

              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.015)] flex flex-col items-center gap-8 text-center relative overflow-hidden">
                 <div className="absolute top-0 inset-x-0 h-1 bg-[hsl(var(--color-primary))]/20" />
                 
                 <div className="space-y-1">
                    <span className="font-mono text-[9px] uppercase font-bold text-slate-400 tracking-[0.2em]">Margen de Ganancia</span>
                    <div className="flex items-center justify-center gap-2">
                       <span className={`font-mono text-5xl font-black ${
                         profitMargin > 60 ? 'text-emerald-500' : profitMargin > 40 ? 'text-amber-500' : 'text-rose-500'
                       }`}>
                         {Math.round(profitMargin)}%
                       </span>
                    </div>
                 </div>

                 {/* Slider Grueso */}
                 <div className="w-full space-y-4">
                    <div className="flex justify-between items-end">
                       <label className="font-disp font-extrabold text-xs uppercase text-slate-450">Precio de Venta Sugerido</label>
                       <span className="font-mono text-xl font-black text-slate-700">${sellingPrice.toLocaleString()}</span>
                    </div>
                    
                    <Slider.Root
                      className="relative flex items-center select-none touch-none w-full h-8"
                      value={[sellingPrice]}
                      max={productCost * 5}
                      step={1}
                      onValueChange={([val]) => setSellingPrice(val)}
                    >
                      <Slider.Track className="bg-slate-100 relative grow rounded-full h-2.5">
                        <Slider.Range className={`absolute h-full rounded-full ${
                          profitMargin > 60 ? 'bg-emerald-400' : profitMargin > 40 ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />
                      </Slider.Track>
                      <Slider.Thumb className="block w-5 h-5 bg-white border border-slate-200 rounded-full shadow-md focus:outline-none hover:scale-105 transition-transform cursor-pointer" />
                    </Slider.Root>
                 </div>

                 <div className={`p-4 rounded-2xl border font-text text-[11px] leading-relaxed ${
                   profitMargin > 60 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                 }`}>
                    {profitMargin > 60 ? '✨ ¡Salud financiera excelente! Tienes margen para imprevistos.' : '⚠️ Margen bajo. Considera reducir costos o aumentar el precio de venta.'}
                 </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={sellingPrice === 0}
                className="w-full bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white py-4.5 rounded-full font-disp text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                 <Save size={15}/> Guardar Creación
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
