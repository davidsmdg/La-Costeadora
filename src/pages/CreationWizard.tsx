import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ArrowRight, ArrowLeft, Star, Clock, 
  Package, Truck, Utensils, Construction,
  Search, AlertCircle, Save, ChevronRight
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
    <div className="min-h-screen bg-white text-black flex flex-col font-text overflow-x-hidden relative pb-32">
      
      {/* 1. STICKY HEADER (Check de Salud) */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b-4 border-black p-6 flex items-center justify-between shadow-xl">
         <button onClick={() => navigate('/dashboard')} className="p-2 bg-surface rounded-full">
            <X size={20} />
         </button>
         
         <div className="flex flex-col items-center">
            <span className="font-mono text-[10px] uppercase font-black text-zinc-400">Costo Total Est.</span>
            <span className="font-mono text-xl font-black text-black">${Math.round(productCost).toLocaleString()}</span>
         </div>

         <div className="flex flex-col items-end">
            <span className="font-mono text-[10px] uppercase font-black text-zinc-400">Margen</span>
            <span className={`font-mono text-xl font-black ${
              profitMargin > 60 ? 'text-pop-green' : profitMargin > 40 ? 'text-pop-yellow' : 'text-pop-red'
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
              className="flex flex-col gap-10 py-8"
            >
              <div className="space-y-2">
                <h2 className="font-disp text-4xl font-black uppercase italic leading-tight">
                  ¿Qué estás <br/> <span className="text-pop-blue underline">creando</span> hoy?
                </h2>
                <p className="font-text text-zinc-500">Elige la lógica de tu nuevo proyecto.</p>
              </div>

              <div className="flex flex-col gap-6">
                <motion.button
                  whileHover={{ scale: 1.02, rotate: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setCreationType('service'); setStep(2); }}
                  className="bg-white border-4 border-black rounded-[32px] p-8 shadow-brutal text-left flex items-start gap-6 group"
                >
                   <div className="w-16 h-16 bg-pop-pink rounded-full flex items-center justify-center text-white border-2 border-black group-hover:rotate-12 transition-transform">
                      <Construction size={32} />
                   </div>
                   <div className="flex flex-col gap-2">
                      <h3 className="font-disp text-2xl font-black uppercase">Proyecto a Medida</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed font-text">Servicios creativos, tiempo, viáticos y clientes específicos.</p>
                   </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, rotate: 1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setCreationType('product'); setStep(2); }}
                  className="bg-white border-4 border-black rounded-[32px] p-8 shadow-brutal text-left flex items-start gap-6 group"
                >
                   <div className="w-16 h-16 bg-pop-green rounded-full flex items-center justify-center text-black border-2 border-black group-hover:-rotate-12 transition-transform">
                      <Package size={32} />
                   </div>
                   <div className="flex flex-col gap-2">
                      <h3 className="font-disp text-2xl font-black uppercase">Producto de Catálogo</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed font-text">Lotes, inventario, producción en serie y venta directa.</p>
                   </div>
                </motion.button>
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
              className="flex flex-col gap-10 py-8"
            >
              <div className="flex items-center gap-4">
                 <button onClick={() => setStep(1)} className="p-2 bg-surface rounded-full"><ArrowLeft size={18}/></button>
                 <h2 className="font-disp text-2xl font-black uppercase italic">
                   {creationType === 'service' ? 'Logística de Servicio' : 'Plan de Producción'}
                 </h2>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                   <label className="font-mono text-[10px] uppercase font-bold text-zinc-400">Nombre del Proyecto / Producto</label>
                   <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Mural Calle 10..."
                    className="w-full bg-surface border-2 border-black p-4 rounded-2xl font-disp font-bold text-xl outline-none focus:ring-4 ring-pop-blue/20"
                   />
                </div>

                {creationType === 'service' ? (
                  /* --- FLOW 2A: SERVICE --- */
                  <div className="flex flex-col gap-8">
                    {/* Mano de Obra */}
                    <div className="bg-surface p-6 rounded-[32px] border-2 border-border space-y-6">
                       <div className="flex justify-between items-center">
                          <h3 className="font-disp font-black uppercase text-sm">Mano de Obra</h3>
                          <div className="flex bg-white border-2 border-black rounded-lg overflow-hidden text-[10px] font-mono font-bold">
                             <button 
                               onClick={() => setServiceMode('hour')}
                               className={`px-3 py-2 ${serviceMode === 'hour' ? 'bg-black text-white' : ''}`}
                             >HORA</button>
                             <button 
                               onClick={() => setServiceMode('day')}
                               className={`px-3 py-2 ${serviceMode === 'day' ? 'bg-black text-white' : ''}`}
                             >DÍA</button>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                             <span className="font-mono text-[8px] text-zinc-400 uppercase font-bold">Tarifa</span>
                             <input 
                               type="number" 
                               value={serviceRate}
                               onChange={(e) => setServiceRate(Number(e.target.value))}
                               className="bg-transparent border-b-2 border-black font-mono font-bold text-lg outline-none"
                             />
                          </div>
                          <div className="flex flex-col gap-1">
                             <span className="font-mono text-[8px] text-zinc-400 uppercase font-bold">Cantidad ({serviceMode})</span>
                             <input 
                               type="number" 
                               value={serviceTime}
                               onChange={(e) => setServiceTime(Number(e.target.value))}
                               className="bg-transparent border-b-2 border-black font-mono font-bold text-lg outline-none"
                             />
                          </div>
                       </div>
                    </div>

                    {/* Logística Accordion */}
                    <Accordion.Root type="multiple" className="space-y-4">
                       <Accordion.Item value="materials" className="border-2 border-black rounded-[32px] overflow-hidden bg-white shadow-brutal-sm">
                          <Accordion.Header>
                            <Accordion.Trigger className="w-full p-6 flex justify-between items-center font-disp font-black uppercase italic">
                               Materiales (Cofre)
                            </Accordion.Trigger>
                          </Accordion.Header>
                          <Accordion.Content className="p-6 pt-0 space-y-4">
                             <div className="flex flex-col gap-3">
                               {serviceCosts.map(item => (
                                 <div key={item.id} className="flex items-center justify-between bg-surface p-3 rounded-xl border border-border">
                                    <div className="flex flex-col">
                                       <span className="font-disp font-bold text-xs uppercase">{item.name}</span>
                                       <span className="font-mono text-[9px] text-zinc-400">{item.quantity} un x ${item.unitPrice}</span>
                                    </div>
                                    <button onClick={() => removeCostItem(item.id, 'service')} className="text-pop-red"><X size={16}/></button>
                                 </div>
                               ))}
                               <button 
                                 onClick={() => addCostItem('service')}
                                 className="w-full py-3 border-2 border-dashed border-zinc-300 rounded-xl text-zinc-400 font-mono text-[10px] uppercase font-bold flex items-center justify-center gap-2"
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
                  <div className="flex flex-col gap-8">
                    <div className="bg-pop-blue p-8 rounded-[40px] text-white shadow-brutal space-y-6">
                       <div className="flex justify-between items-center">
                          <h3 className="font-disp font-black uppercase text-sm">Lógica de Lote</h3>
                          <Package size={20} className="opacity-50" />
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="font-mono text-[8px] uppercase font-bold text-white/60">Inversión Inicial</label>
                             <input 
                               type="number"
                               value={initialInvestment}
                               onChange={(e) => setInitialInvestment(Number(e.target.value))}
                               className="w-full bg-white/10 border-b-2 border-white font-mono font-black text-2xl outline-none"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="font-mono text-[8px] uppercase font-bold text-white/60">Unidades Totales</label>
                             <input 
                               type="number"
                               value={estimatedUnits}
                               onChange={(e) => setEstimatedUnits(Number(e.target.value))}
                               className="w-full bg-white/10 border-b-2 border-white font-mono font-black text-2xl outline-none"
                             />
                          </div>
                       </div>
                       <div className="pt-4 border-t border-white/20 flex justify-between items-center">
                          <span className="font-mono text-[10px] uppercase font-bold opacity-60">Inversión x Unidad:</span>
                          <span className="font-mono font-black">${Math.round(initialInvestment / (estimatedUnits || 1))}</span>
                       </div>
                    </div>

                    {/* Production Costs List */}
                    <div className="space-y-4">
                       <h3 className="font-disp font-black uppercase text-sm text-zinc-400">Costos de Producción</h3>
                       <div className="flex flex-col gap-3">
                          {productionCosts.map(item => (
                            <div key={item.id} className="flex items-center gap-3 bg-surface p-4 rounded-2xl border-2 border-border">
                               <input 
                                 placeholder="Nombre..."
                                 className="flex-1 bg-transparent font-disp font-bold text-xs uppercase outline-none"
                                 value={item.name}
                                 onChange={(e) => updateCostItem(item.id, { name: e.target.value }, 'production')}
                               />
                               <input 
                                 type="number"
                                 className="w-16 bg-white border-2 border-black rounded-lg p-1 font-mono text-[10px] text-center"
                                 value={item.unitPrice}
                                 onChange={(e) => updateCostItem(item.id, { unitPrice: Number(e.target.value) }, 'production')}
                               />
                               <button onClick={() => removeCostItem(item.id, 'production')} className="text-zinc-300"><X size={16}/></button>
                            </div>
                          ))}
                          <button 
                            onClick={() => addCostItem('production')}
                            className="py-4 border-2 border-dashed border-border rounded-2xl text-zinc-400 flex items-center justify-center"
                          >
                             <Plus size={18}/>
                          </button>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setStep(3)}
                className="w-full bg-black text-white py-6 rounded-full font-disp text-xl font-black uppercase italic shadow-brutal flex items-center justify-center gap-3 mt-4"
              >
                 Continuar al Simulador <ArrowRight size={20}/>
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
              className="flex flex-col gap-12 py-8"
            >
               <div className="flex items-center gap-4">
                 <button onClick={() => setStep(2)} className="p-2 bg-surface rounded-full"><ArrowLeft size={18}/></button>
                 <h2 className="font-disp text-2xl font-black uppercase italic">Definir Precio</h2>
              </div>

              <div className="bg-white border-4 border-black rounded-[40px] p-10 shadow-brutal flex flex-col items-center gap-10 text-center relative overflow-hidden">
                 <div className="absolute top-0 inset-x-0 h-2 bg-pop-blue animate-pulse" />
                 
                 <div className="space-y-2">
                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 tracking-[0.3em]">Margen de Ganancia</span>
                    <div className="flex items-center justify-center gap-2">
                       <span className={`font-mono text-7xl font-black ${
                         profitMargin > 60 ? 'text-pop-green' : profitMargin > 40 ? 'text-pop-yellow' : 'text-pop-red'
                       }`}>
                         {Math.round(profitMargin)}%
                       </span>
                    </div>
                 </div>

                 {/* Slider Grueso */}
                 <div className="w-full space-y-6">
                    <div className="flex justify-between items-end">
                       <label className="font-disp font-black uppercase text-xs">Precio de Venta Sugerido</label>
                       <span className="font-mono text-3xl font-black text-black">${sellingPrice.toLocaleString()}</span>
                    </div>
                    
                    <Slider.Root
                      className="relative flex items-center select-none touch-none w-full h-10"
                      value={[sellingPrice]}
                      max={productCost * 5}
                      step={1}
                      onValueChange={([val]) => setSellingPrice(val)}
                    >
                      <Slider.Track className="bg-zinc-100 relative grow rounded-full h-4 border-2 border-black">
                        <Slider.Range className={`absolute h-full rounded-full ${
                          profitMargin > 60 ? 'bg-pop-green' : profitMargin > 40 ? 'bg-pop-yellow' : 'bg-pop-red'
                        }`} />
                      </Slider.Track>
                      <Slider.Thumb className="block w-10 h-10 bg-white border-4 border-black rounded-full shadow-brutal-sm focus:outline-none hover:scale-110 transition-transform cursor-grab active:cursor-grabbing" />
                    </Slider.Root>
                 </div>

                 <div className={`p-4 rounded-2xl border-2 font-text text-xs leading-relaxed ${
                   profitMargin > 60 ? 'bg-pop-green/10 border-pop-green text-pop-green' : 'bg-pop-red/10 border-pop-red text-pop-red'
                 }`}>
                    {profitMargin > 60 ? '✨ ¡Salud financiera excelente! Tienes margen para imprevistos.' : '⚠️ Margen bajo. Considera reducir costos o aumentar el precio de venta.'}
                 </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={sellingPrice === 0}
                className="w-full bg-pop-blue text-white py-8 rounded-[32px] font-disp text-2xl font-black uppercase italic shadow-brutal flex items-center justify-center gap-4 hover:-translate-y-1 active:translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                 <Save size={28}/> Guardar Creación
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
