import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import * as Dialog from '@radix-ui/react-dialog';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import { 
  X, Plus, Star, Info, ArrowLeft, Save, 
  Construction, Package, Briefcase, Truck, 
  Trash2, AlertTriangle, Search, HelpCircle
} from 'lucide-react';
import { useFinancialData } from '../context/FinancialDataContext';
import { Product, CostItem, InventoryItem } from '../types';

export default function CreationPage() {
  const navigate = useNavigate();
  const { products, addProduct, inventoryItems, updateInventoryItem } = useFinancialData();

  // --- 1. ESTADO LOCAL DEL COMPONENTE ---
  const [creationType, setCreationType] = useState<'project' | 'product'>('project');
  const [name, setName] = useState('');
  const [labor, setLabor] = useState({ type: 'hour' as 'hour' | 'day', rate: 0, amount: 0 });
  const [materials, setMaterials] = useState<CostItem[]>([]);
  const [logistics, setLogistics] = useState<CostItem[]>([]);
  const [investment, setInvestment] = useState({ total: 0, estimatedUnits: 1 });
  const [sellingPrice, setSellingPrice] = useState(0);

  // Help State
  const [helpContent, setHelpContent] = useState<{ title: string; description: string } | null>(null);

  // Modal State
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isLogisticsModalOpen, setIsLogisticsModalOpen] = useState(false);

  // Custom addition state
  const [activeTab, setActiveTab] = useState<'inventory' | 'custom'>('inventory');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState(0);
  const [customQuantity, setCustomQuantity] = useState(1);
  const [customIsFixed, setCustomIsFixed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = useMemo(() => {
    return (inventoryItems || []).filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventoryItems, searchTerm]);

  // --- 2. NÚCLEO MATEMÁTICO (useMemo) ---
  const math = useMemo(() => {
    const laborTotal = labor.rate * labor.amount;
    
    const isProduct = creationType === 'product';
    const materialsFixed = materials.filter(m => m.isFixed).reduce((a, b) => a + (b.quantity * b.unitPrice), 0);
    const materialsVariable = materials.filter(m => !m.isFixed).reduce((a, b) => a + (b.quantity * b.unitPrice), 0);
    
    const materialsTotal = isProduct
      ? materialsVariable + (investment.estimatedUnits > 0 ? materialsFixed / investment.estimatedUnits : 0)
      : materials.reduce((a, b) => a + (b.quantity * b.unitPrice), 0);

    const logisticsTotal = creationType === 'project' ? logistics.reduce((a, b) => a + (b.quantity * b.unitPrice), 0) : 0;
    const investmentPerUnit = creationType === 'product' && investment.estimatedUnits > 0 
      ? investment.total / investment.estimatedUnits 
      : 0;

    const productCost = laborTotal + materialsTotal + logisticsTotal + investmentPerUnit;
    const profitMargin = sellingPrice > 0 ? ((sellingPrice - productCost) / sellingPrice) * 100 : 0;

    return {
      laborTotal,
      materialsTotal,
      logisticsTotal,
      investmentPerUnit,
      productCost,
      profitMargin
    };
  }, [creationType, labor, materials, logistics, investment, sellingPrice]);

  // --- ACCIONES ---
  const handleAddMaterial = (invItem: InventoryItem, qty: number) => {
    const newItem: CostItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: invItem.name,
      quantity: qty,
      unitPrice: invItem.unitCost,
      category: 'production',
      affectedByAuthorship: false,
      inventoryId: invItem.id, // Referencia para restar stock luego
      isFixed: false
    };
    setMaterials([...materials, newItem]);
    setIsMaterialModalOpen(false);
  };

  const handleAddCustomMaterial = (cName: string, price: number, qty: number, isFixed: boolean) => {
    const newItem: CostItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: cName,
      quantity: qty,
      unitPrice: price,
      category: 'production',
      affectedByAuthorship: false,
      isFixed
    };
    setMaterials([...materials, newItem]);
    setIsMaterialModalOpen(false);
  };

  const handleAddLogistics = (item: { name: string, price: number }) => {
    const newItem: CostItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: item.name,
      quantity: 1,
      unitPrice: item.price,
      category: 'distribution',
      affectedByAuthorship: false
    };
    setLogistics([...logistics, newItem]);
    setIsLogisticsModalOpen(false);
  };

  const removeMaterial = (id: string) => setMaterials(materials.filter(m => m.id !== id));
  const removeLogistics = (id: string) => setLogistics(logistics.filter(l => l.id !== id));

  const toggleAuthorship = (id: string) => {
    setMaterials(materials.map(m => m.id === id ? { ...m, affectedByAuthorship: !m.affectedByAuthorship } : m));
  };

  const handleSave = () => {
    const newProduct: Omit<Product, 'id'> = {
      name: name || (creationType === 'project' ? 'Nuevo Proyecto' : 'Nuevo Producto'),
      type: creationType === 'project' ? 'custom' : 'product',
      sellingPrice: sellingPrice,
      estimatedUnits: creationType === 'project' ? 1 : investment.estimatedUnits,
      initialInvestment: creationType === 'project' ? 0 : investment.total,
      productionCosts: materials,
      distributionCosts: creationType === 'project' ? logistics : [],
      amountCollected: 0,
      createdAt: new Date().toISOString()
    };

    // 1. Agregar a la lista global
    addProduct(newProduct);

    // 2. Restar del inventario
    materials.forEach(mat => {
      if (mat.inventoryId) {
        const invItem = inventoryItems.find(i => i.id === mat.inventoryId);
        if (invItem) {
          updateInventoryItem(invItem.id, { 
            totalQuantity: Math.max(invItem.totalQuantity - mat.quantity, 0) 
          });
        }
      }
    });

    // 3. Redirigir
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-slate-800 flex flex-col font-text pb-24 w-full">
      
      {/* A. FIXED HEADER (El Semáforo) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 py-5 px-6 md:px-12 shadow-[0_2px_15px_rgba(0,0,0,0.03)] w-full">
        <div className="max-w-6xl mx-auto flex justify-between items-center w-full">
           <button onClick={() => navigate('/dashboard')} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <ArrowLeft size={18} />
           </button>
           <div className="flex flex-col items-center">
              <span className="font-mono text-[9px] uppercase font-bold text-slate-400">P. Venta</span>
              <span className="font-mono text-xl font-black text-slate-800">${sellingPrice.toLocaleString()}</span>
           </div>
           <div className={`px-3 py-1.5 rounded-full border text-xs font-mono font-black ${
              math.profitMargin > 60 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
              math.profitMargin > 40 ? 'bg-amber-50 border-amber-100 text-amber-600' :
              'bg-rose-50 border-rose-100 text-rose-600'
           }`}>
              {Math.round(math.profitMargin)}% Margen
           </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 md:px-12 pt-28 pb-8 w-full flex flex-col gap-8">
        
        {/* ADN DE LA CREACIÓN (Destacado y Explicativo) */}
        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.015)] space-y-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold text-[hsl(var(--color-primary))]">ADN de la Creación</span>
            <h2 className="font-disp font-black text-xl text-slate-800">¿Qué tipo de costo estamos calculando?</h2>
            <p className="font-text text-xs text-slate-400">Define cómo se distribuirán y sumarán los costos fijos y variables de este desarrollo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <button
              type="button"
              onClick={() => setCreationType('project')}
              className={`p-6 rounded-3xl border-2 text-left transition-all relative overflow-hidden group cursor-pointer flex flex-col gap-2.5 ${
                creationType === 'project'
                  ? 'border-indigo-650 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-[0_10px_25px_rgba(99,102,241,0.3)]'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl filter drop-shadow-sm">🎨</span>
                <span className={`font-disp font-black text-sm uppercase tracking-wide ${
                  creationType === 'project' ? 'text-white' : 'text-slate-800'
                }`}>
                  Proyecto a Medida
                </span>
              </div>
              <p className={`font-text text-xs leading-relaxed ${
                creationType === 'project' ? 'text-indigo-100/90 font-medium' : 'text-slate-500'
              }`}>
                Una pieza única o encargo personalizado. Los costos se calculan sobre la totalidad del proyecto.
              </p>
              <span className={`font-text text-[11px] px-3 py-2 rounded-xl block border mt-1.5 leading-relaxed ${
                creationType === 'project' 
                  ? 'text-yellow-200 bg-indigo-950/40 border-indigo-500/25 font-bold' 
                  : 'text-slate-500 bg-slate-200/50 border-slate-300/30'
              }`}>
                💡 <strong>Ejemplo:</strong> Un mural en una oficina, un cuadro por encargo o una escultura personalizada.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCreationType('product')}
              className={`p-6 rounded-3xl border-2 text-left transition-all relative overflow-hidden group cursor-pointer flex flex-col gap-2.5 ${
                creationType === 'product'
                  ? 'border-teal-650 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-850 text-white shadow-[0_10px_25px_rgba(20,184,166,0.3)]'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl filter drop-shadow-sm">📦</span>
                <span className={`font-disp font-black text-sm uppercase tracking-wide ${
                  creationType === 'product' ? 'text-white' : 'text-slate-800'
                }`}>
                  Lote de Productos
                </span>
              </div>
              <p className={`font-text text-xs leading-relaxed ${
                creationType === 'product' ? 'text-teal-100/90 font-medium' : 'text-slate-500'
              }`}>
                Una serie o lote de unidades idénticas. Los costos fijos de inversión se dividen entre el número de unidades.
              </p>
              <span className={`font-text text-[11px] px-3 py-2 rounded-xl block border mt-1.5 leading-relaxed ${
                creationType === 'product' 
                  ? 'text-yellow-200 bg-teal-950/40 border-teal-500/25 font-bold' 
                  : 'text-slate-500 bg-slate-200/50 border-slate-300/30'
              }`}>
                💡 <strong>Ejemplo:</strong> Un tiraje de 50 grabados, un lote de 20 camisetas o un set de tazas cerámicas.
              </span>
            </button>
          </div>
        </section>

        <motion.div 
          key={creationType}
          initial={{ opacity: 0.35 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          
          {/* Left Column: Cost Elements */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* INPUT NOMBRE (Primer campo a rellenar) */}
            <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col gap-2.5">
               <label className="font-mono text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                 <span>{creationType === 'project' ? 'Nombre de tu proyecto a medida' : 'Nombre de tu producto'}</span>
                 <button
                   type="button"
                   onClick={() => setHelpContent({
                     title: creationType === 'project' ? 'Nombre del Proyecto a Medida' : 'Nombre del Producto',
                     description: 'Escribe un nombre claro para identificar este desarrollo en tu bitácora o catálogo. Si es a medida, puedes incluir el nombre del cliente o el lugar. Si es un lote de productos, define el nombre del modelo o la serie.'
                   })}
                   className="text-slate-350 hover:text-slate-600 transition-colors p-0.5 cursor-pointer flex items-center justify-center"
                   title="Ver explicación"
                 >
                   <HelpCircle size={10} />
                 </button>
               </label>
               <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={creationType === 'project' ? 'Ej: Mural Calle 10...' : 'Ej: Camiseta estampada...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4.5 font-disp font-bold text-base outline-none focus:border-[hsl(var(--color-primary))]/40 focus:bg-white transition-all placeholder:text-slate-350 text-slate-700 shadow-sm focus:shadow-md"
               />
            </section>

            {/* 1. Mano de Obra */}
            <section className="space-y-3.5">
               <div className="flex items-center gap-1.5">
                  <Briefcase size={15} className="text-[hsl(var(--color-primary))]" />
                  <h2 className="font-disp font-extrabold text-xs uppercase tracking-wider text-slate-400">Mano de Obra</h2>
                  <button
                    type="button"
                    onClick={() => setHelpContent({
                      title: 'Mano de Obra',
                      description: 'Define cuánto vale tu tiempo de trabajo. Elige si cobrarás una tarifa por hora o por día, y la cantidad de tiempo total estimada que te tomará realizar la obra o producir el lote completo.'
                    })}
                    className="text-slate-350 hover:text-slate-650 transition-colors p-0.5 cursor-pointer flex items-center justify-center"
                    title="Ver explicación"
                  >
                    <HelpCircle size={11} />
                  </button>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col gap-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
                  <div className="flex justify-between items-center">
                     <div className="flex bg-slate-50 border border-slate-100 rounded-lg overflow-hidden text-[9px] font-mono font-bold">
                        <button onClick={() => setLabor({...labor, type: 'hour'})} className={`px-3 py-1.5 cursor-pointer ${labor.type === 'hour' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>X HORA</button>
                        <button onClick={() => setLabor({...labor, type: 'day'})} className={`px-3 py-1.5 cursor-pointer ${labor.type === 'day' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>X DÍA</button>
                     </div>
                     <div className="text-right">
                        <span className="font-mono text-base font-black text-slate-700">${math.laborTotal.toLocaleString()}</span>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                        <span className="font-mono text-[8px] uppercase font-bold text-slate-400">Tu Tarifa</span>
                        <input 
                          type="number"
                          value={labor.rate || ''}
                          onChange={(e) => setLabor({...labor, rate: Number(e.target.value)})}
                          className="w-full bg-transparent border-b border-slate-200 focus:border-[hsl(var(--color-primary))] font-mono font-black text-lg text-slate-700 outline-none pb-1"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <span className="font-mono text-[8px] uppercase font-bold text-slate-400">Cant. ({labor.type})</span>
                        <input 
                          type="number"
                          value={labor.amount || ''}
                          onChange={(e) => setLabor({...labor, amount: Number(e.target.value)})}
                          className="w-full bg-transparent border-b border-slate-200 focus:border-[hsl(var(--color-primary))] font-mono font-black text-lg text-slate-700 outline-none pb-1"
                        />
                     </div>
                  </div>
               </div>
            </section>

            {/* 2. Costos de Creación */}
            <section className="space-y-3.5">
               <div className="flex items-center gap-1.5">
                  <Package size={15} className="text-[hsl(var(--color-secondary))]" />
                  <h2 className="font-disp font-extrabold text-xs uppercase tracking-wider text-slate-400">Costos de Creación</h2>
                  <button
                    type="button"
                    onClick={() => setHelpContent({
                      title: 'Costos de Creación',
                      description: 'Suma todos los materiales consumidos, mermas o insumos que requiere esta pieza. Si creas un producto en lote, puedes marcar insumos específicos como "Fijo" (el costo de un molde o matriz que se paga una sola vez y se divide entre todas las unidades) o "Variable" (el material consumido por cada unidad individual).'
                    })}
                    className="text-slate-350 hover:text-slate-650 transition-colors p-0.5 cursor-pointer flex items-center justify-center"
                    title="Ver explicación"
                  >
                    <HelpCircle size={11} />
                  </button>
               </div>
               
               <div className="flex flex-col gap-2.5">
                  <AnimatePresence>
                    {materials.map((mat) => (
                      <motion.div 
                        key={mat.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`bg-white p-4.5 rounded-2xl border transition-all flex justify-between items-center ${
                          mat.affectedByAuthorship 
                            ? 'border-[hsl(var(--color-primary))]/20 shadow-[0_4px_12px_rgba(255,20,147,0.02)]' 
                            : 'border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.015)]'
                        }`}
                      >
                         <div className="flex items-center gap-4">
                            <Switch.Root 
                              checked={mat.affectedByAuthorship} 
                              onCheckedChange={() => toggleAuthorship(mat.id)}
                              className="w-8 h-5 bg-slate-100 rounded-full relative data-[state=checked]:bg-amber-400 transition-colors border border-slate-200 cursor-pointer"
                            >
                               <Switch.Thumb className="block w-3.5 h-3.5 bg-white rounded-full translate-x-0.5 transition-transform data-[state=checked]:translate-x-3.5 shadow-sm" />
                               <Star size={8} className="absolute top-1.5 left-1 text-slate-300 pointer-events-none" />
                            </Switch.Root>
                            <div className="flex flex-col gap-0.5">
                               <span className="font-disp font-bold text-xs uppercase text-slate-800">{mat.name}</span>
                               <div className="flex items-center gap-2 mt-0.5">
                                 <span className="font-mono text-[9px] font-bold text-slate-400">{mat.quantity} unidades x ${mat.unitPrice.toLocaleString()}</span>
                                 {creationType === 'product' && (
                                   <button
                                     type="button"
                                     onClick={() => {
                                       setMaterials(materials.map(m => m.id === mat.id ? { ...m, isFixed: !m.isFixed } : m));
                                     }}
                                     className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all ${
                                       mat.isFixed 
                                         ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                                         : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                     }`}
                                   >
                                     {mat.isFixed ? 'Fijo' : 'Variable'}
                                   </button>
                                 )}
                               </div>
                            </div>
                         </div>
                         <button onClick={() => removeMaterial(mat.id)} className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer">
                            <Trash2 size={16} />
                         </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {materials.length === 0 && (
                    <div className="py-8 text-center border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl text-slate-400 font-text text-[10px]">
                      No has añadido costos de creación.
                    </div>
                  )}
                  <button 
                    onClick={() => setIsMaterialModalOpen(true)}
                    className="w-full py-3.5 border border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-2xl text-slate-500 font-disp text-xs font-bold flex items-center justify-center gap-2 hover:border-slate-300 transition-all cursor-pointer"
                  >
                      <Plus size={14} /> Añadir Costo
                   </button>
                </div>
             </section>

             {/* Animación de desplegado entre secciones condicionales */}
            <AnimatePresence mode="wait">
              {creationType === 'project' ? (
                <motion.div
                  key="project-logistics"
                  initial={{ opacity: 0, height: 0, scale: 0.98 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <section className="space-y-3.5 pt-2">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-1.5">
                          <Truck size={15} className="text-amber-500" />
                          <h2 className="font-disp font-extrabold text-xs uppercase tracking-wider text-slate-400">Logística y Viáticos</h2>
                          <button
                            type="button"
                            onClick={() => setHelpContent({
                              title: 'Logística y Viáticos',
                              description: 'Exclusivo para Proyectos a Medida. Registra todos los costos de entrega, transporte, pasajes, comidas u hospedajes necesarios para llevar a cabo el proyecto en su locación final.'
                            })}
                            className="text-slate-350 hover:text-slate-650 transition-colors p-0.5 cursor-pointer flex items-center justify-center"
                            title="Ver explicación"
                          >
                            <HelpCircle size={11} />
                          </button>
                       </div>
                       <span className="font-mono text-xs font-bold text-slate-500">${math.logisticsTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                       {logistics.map((log) => (
                         <div key={log.id} className="bg-white p-4 rounded-xl flex justify-between items-center border border-slate-100 shadow-[0_4px_10px_rgba(0,0,0,0.015)]">
                            <div className="flex flex-col gap-0.5">
                               <span className="font-disp font-bold text-xs uppercase text-slate-800">{log.name}</span>
                               <span className="font-mono text-[9px] font-bold text-slate-400">${log.unitPrice.toLocaleString()}</span>
                            </div>
                            <button onClick={() => removeLogistics(log.id)} className="text-slate-300 hover:text-rose-500 cursor-pointer"><Trash2 size={14}/></button>
                         </div>
                       ))}
                       <button 
                         onClick={() => setIsLogisticsModalOpen(true)}
                         className="w-full py-3.5 border border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-2xl text-slate-500 font-disp text-xs font-bold flex items-center justify-center gap-2 hover:border-slate-300 transition-all cursor-pointer"
                       >
                          <Plus size={14} /> Añadir Gasto
                       </button>
                    </div>
                  </section>
                </motion.div>
              ) : (
                <motion.div
                  key="product-investment"
                  initial={{ opacity: 0, height: 0, scale: 0.98 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <section className="space-y-3.5 pt-2">
                    <div className="flex items-center gap-1.5">
                       <Construction size={15} className="text-[hsl(var(--color-primary))]" />
                       <h2 className="font-disp font-extrabold text-xs uppercase tracking-wider text-slate-400">Inversión y Lote</h2>
                       <button
                         type="button"
                         onClick={() => setHelpContent({
                           title: 'Inversión y Lote',
                           description: 'Exclusivo para Lotes de Productos. Registra la inversión inicial no-material (ej. diseño conceptual, matricería, prototipado) y el número estimado de unidades que producirás en este lote. El sistema amortizará esta inversión dividiéndola entre las unidades.'
                         })}
                         className="text-slate-350 hover:text-slate-650 transition-colors p-0.5 cursor-pointer flex items-center justify-center"
                         title="Ver explicación"
                       >
                         <HelpCircle size={11} />
                       </button>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-md space-y-6">
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                             <label className="font-mono text-[8px] uppercase font-bold text-white/50">Inversión Total</label>
                             <input 
                               type="number"
                               value={investment.total || ''}
                               onChange={(e) => setInvestment({...investment, total: Number(e.target.value)})}
                               className="w-full bg-white/5 border-b border-white/20 focus:border-white/50 font-mono font-black text-lg outline-none pb-1"
                             />
                          </div>
                          <div className="space-y-1.5">
                             <label className="font-mono text-[8px] uppercase font-bold text-white/50">Lote (Unidades)</label>
                             <input 
                               type="number"
                               value={investment.estimatedUnits || ''}
                               onChange={(e) => setInvestment({...investment, estimatedUnits: Number(e.target.value)})}
                               className="w-full bg-white/5 border-b border-white/20 focus:border-white/50 font-mono font-black text-lg outline-none pb-1"
                             />
                          </div>
                       </div>
                       <div className="pt-4 border-t border-white/10 flex justify-between items-center font-mono text-[10px]">
                          <span className="opacity-50">Impacto x Unidad:</span>
                          <span className="font-black text-sm">${Math.round(math.investmentPerUnit).toLocaleString()}</span>
                       </div>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Config and Pricing */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-40">
            




            {/* D. PRICING Y GUARDADO */}
            <section className="bg-white border border-slate-100 rounded-3xl p-6.5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-6">
               <div className="space-y-4">
                  <div className="flex justify-between items-center gap-4">
                     <div className="flex items-center gap-1.5">
                        <h2 className="font-disp font-extrabold text-xs uppercase tracking-wider text-slate-400">Fijar Precio Final</h2>
                        <button
                          type="button"
                          onClick={() => setHelpContent({
                            title: 'Fijar Precio Final',
                            description: 'El precio al que planeas vender la pieza única o cada unidad individual del lote. Al mover el control deslizante, podrás ver el porcentaje de margen de ganancia neto estimado en tiempo real (El Semáforo superior cambiará de color según la rentabilidad).'
                          })}
                          className="text-slate-350 hover:text-slate-650 transition-colors p-0.5 cursor-pointer flex items-center justify-center"
                          title="Ver explicación"
                        >
                          <HelpCircle size={11} />
                        </button>
                     </div>
                     <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl focus-within:border-[hsl(var(--color-primary))]/50 transition-colors">
                        <span className="font-mono text-xs text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          value={sellingPrice || ''}
                          onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                          className="w-28 bg-transparent text-right font-mono text-base font-black text-slate-700 focus:outline-none"
                        />
                        <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">COP</span>
                     </div>
                  </div>
                  <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-8"
                    value={[sellingPrice]}
                    max={Math.max(math.productCost * 5, 2000000)}
                    step={1}
                    onValueChange={([val]) => setSellingPrice(val)}
                  >
                    <Slider.Track className="bg-slate-100 relative grow rounded-full h-2.5">
                      <Slider.Range className={`absolute h-full rounded-full ${
                        math.profitMargin > 60 ? 'bg-emerald-400' : math.profitMargin > 40 ? 'bg-amber-400' : 'bg-rose-400'
                      }`} />
                    </Slider.Track>
                    <Slider.Thumb className="block w-5.5 h-5.5 bg-white border border-slate-200 rounded-full shadow-md focus:outline-none hover:scale-105 transition-transform cursor-pointer" />
                  </Slider.Root>
               </div>

               <button 
                 onClick={handleSave}
                 disabled={sellingPrice === 0 || !name}
                 className="w-full bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white font-disp font-bold text-xs uppercase tracking-wider py-4.5 rounded-full shadow-[0_6px_20px_rgba(255,20,147,0.18)] hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
               >
                  <Save size={16} /> Guardar Creación
               </button>
            </section>

          </div>

        </motion.div>
      </main>

      {/* --- MODALS (Bottom Sh      {/* 1. Añadir Material */}
      <Dialog.Root open={isMaterialModalOpen} onOpenChange={(open) => {
        setIsMaterialModalOpen(open);
        if (!open) {
          setCustomName('');
          setCustomPrice(0);
          setCustomQuantity(1);
          setCustomIsFixed(false);
          setSearchTerm('');
        }
      }}>
        <Dialog.Portal>
           <Dialog.Overlay className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60]" />
           <Dialog.Content className="fixed bottom-0 inset-x-0 bg-white rounded-t-[2.5rem] p-6 pb-12 z-[70] shadow-2xl flex flex-col gap-6 max-w-lg mx-auto border-t border-slate-100 focus:outline-none max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-start">
                 <div>
                   <Dialog.Title className="font-disp text-lg font-extrabold text-slate-800 uppercase tracking-tight">Costos de Creación</Dialog.Title>
                   <Dialog.Description className="font-text text-xs text-slate-400">
                      Agrega insumos de tu cofre o registra un costo personalizado.
                   </Dialog.Description>
                 </div>
                 <Dialog.Close className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-650 transition-colors border border-slate-100 cursor-pointer"><X size={15} /></Dialog.Close>
              </div>

              {/* Tabs selector */}
              <div className="flex border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className={`flex-1 pb-3 font-disp text-xs font-bold uppercase tracking-wider text-center cursor-pointer transition-colors ${
                    activeTab === 'inventory'
                      ? 'border-b-2 border-[hsl(var(--color-primary))] text-[hsl(var(--color-primary))]'
                      : 'text-slate-400 hover:text-slate-605'
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
                      : 'text-slate-400 hover:text-slate-605'
                  }`}
                >
                  Personalizado
                </button>
              </div>

              {/* Tab: Del Cofre */}
              {activeTab === 'inventory' && (
                <div className="flex flex-col gap-3 min-h-[200px]">
                   <div className="relative">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input
                       type="text"
                       placeholder="Buscar en el cofre..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-text text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[hsl(var(--color-primary))] focus:bg-white transition-all"
                     />
                   </div>
                   <div className="flex flex-col gap-2 overflow-y-auto max-h-[350px] pr-1">
                     {filteredInventory.length === 0 ? (
                       <div className="text-center py-10 text-xs text-slate-400">
                         No hay insumos disponibles.
                       </div>
                     ) : (
                       filteredInventory.map(item => (
                         <button 
                          key={item.id}
                          onClick={() => handleAddMaterial(item, 1)}
                          className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all text-slate-700 cursor-pointer text-left font-text"
                         >
                            <div className="flex flex-col gap-0.5">
                               <span className="font-disp font-bold text-xs uppercase text-slate-800">{item.name}</span>
                               <span className="font-mono text-[9px] text-slate-400 font-bold">Stock: {item.totalQuantity} {item.unit} · Costo: ${item.unitCost.toLocaleString()}</span>
                            </div>
                            <div className="w-8 h-8 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-650 transition-all">
                               <Plus size={14} />
                            </div>
                         </button>
                       ))
                     )}
                   </div>
                </div>
              )}

              {/* Tab: Personalizado */}
              {activeTab === 'custom' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold block">
                      Nombre del Costo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Diseño de troquel, Embalaje especial..."
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
                        Costo Unitario / Total
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={customPrice === 0 ? '' : customPrice}
                        onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-text text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[hsl(var(--color-primary))] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {creationType === 'product' && (
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
                    type="button"
                    onClick={() => {
                      if (!customName.trim()) return;
                      handleAddCustomMaterial(customName.trim(), customPrice, customQuantity, customIsFixed);
                      setCustomName('');
                      setCustomPrice(0);
                      setCustomQuantity(1);
                      setCustomIsFixed(false);
                    }}
                    disabled={!customName.trim()}
                    className="w-full py-3.5 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] disabled:opacity-40 disabled:pointer-events-none text-white font-disp font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center mt-4"
                  >
                    Agregar Costo
                  </button>
                </div>
              )}
           </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 2. Añadir Logística */}
      <Dialog.Root open={isLogisticsModalOpen} onOpenChange={setIsLogisticsModalOpen}>
        <Dialog.Portal>
           <Dialog.Overlay className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60]" />
           <Dialog.Content className="fixed bottom-0 inset-x-0 bg-white rounded-t-[2.5rem] p-6 pb-12 z-[70] shadow-2xl flex flex-col gap-6 max-w-lg mx-auto border-t border-slate-100 focus:outline-none">
              <div className="flex justify-between items-center">
                 <Dialog.Title className="font-disp text-lg font-extrabold text-slate-800">Logística y Viáticos</Dialog.Title>
                 <Dialog.Close className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors border border-slate-100 cursor-pointer"><X size={15} /></Dialog.Close>
              </div>
              <div className="grid grid-cols-1 gap-3">
                 {[
                   { name: 'Taxi / Transporte', price: 15 },
                   { name: 'Almuerzo Trabajo', price: 10 },
                   { name: 'Alquiler Equipos', price: 50 },
                   { name: 'Otros Gastos', price: 20 },
                 ].map(opt => (
                   <button 
                    key={opt.name}
                    onClick={() => handleAddLogistics(opt)}
                    className="flex justify-between items-center p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl font-disp font-bold text-xs text-slate-700 cursor-pointer"
                   >
                      {opt.name}
                      <span className="font-mono text-[hsl(var(--color-primary))] font-bold">${opt.price}</span>
                   </button>
                 ))}
              </div>
           </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal para Explicación / Ayuda (Opcional) */}
      <Dialog.Root open={!!helpContent} onOpenChange={(open) => !open && setHelpContent(null)}>
        <AnimatePresence>
          {helpContent && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[80]"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed bottom-0 inset-x-0 z-[90] bg-white rounded-t-[2.5rem] pt-5 pb-10 px-6 shadow-2xl border-t border-slate-100 focus:outline-none max-w-lg mx-auto"
                >
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title className="font-disp text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      💡 Explicación: {helpContent.title}
                    </Dialog.Title>
                    <Dialog.Close className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-650 transition-colors border border-slate-100 cursor-pointer">
                      <X size={15} />
                    </Dialog.Close>
                  </div>

                  <div className="font-text text-xs text-slate-500 leading-relaxed">
                    <p>{helpContent.description}</p>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>

    </div>
  );
}
