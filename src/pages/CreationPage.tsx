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
  Trash2, AlertTriangle, Search
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

  // Modal State
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isLogisticsModalOpen, setIsLogisticsModalOpen] = useState(false);

  // --- 2. NÚCLEO MATEMÁTICO (useMemo) ---
  const math = useMemo(() => {
    const laborTotal = labor.rate * labor.amount;
    const materialsTotal = materials.reduce((a, b) => a + (b.quantity * b.unitPrice), 0);
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
      unitPrice: invItem.unitPrice,
      category: 'production',
      affectedByAuthorship: false,
      inventoryId: invItem.id // Referencia para restar stock luego
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
      amountCollected: 0
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
    <div className="min-h-screen bg-white text-black flex flex-col font-text pb-40">
      
      {/* A. STICKY HEADER (El Semáforo) */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b-4 border-black p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex justify-between items-center">
           <button onClick={() => navigate('/dashboard')} className="p-2 bg-surface rounded-full">
              <ArrowLeft size={20} />
           </button>
           <div className="flex flex-col items-center">
              <span className="font-mono text-[10px] uppercase font-black text-zinc-400">P. Venta</span>
              <span className="font-mono text-3xl font-black text-black">${sellingPrice.toLocaleString()}</span>
           </div>
           <div className={`px-4 py-2 rounded-full border-2 border-black shadow-brutal-sm font-mono font-black text-lg ${
              math.profitMargin > 60 ? 'bg-pop-green' : math.profitMargin > 40 ? 'bg-pop-yellow' : 'bg-pop-red'
           }`}>
              {Math.round(math.profitMargin)}%
           </div>
        </div>
        <div className="flex justify-between items-center px-2">
           <div className="flex flex-col">
              <span className="font-mono text-[9px] uppercase font-bold text-zinc-400">Costo Estimado</span>
              <span className="font-mono text-sm font-bold text-black">${Math.round(math.productCost).toLocaleString()}</span>
           </div>
           <div className="text-right">
              <span className="font-mono text-[9px] uppercase font-bold text-zinc-400">ADN Seleccionado</span>
              <span className="block font-disp font-black text-xs uppercase italic">
                {creationType === 'project' ? '🎨 Proyecto' : '📦 Producto'}
              </span>
           </div>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-10">
        
        {/* B. SELECTOR DE ADN (ToggleGroup) */}
        <section className="flex flex-col gap-4">
           <label className="font-mono text-[10px] uppercase font-bold text-zinc-400">ADN de la Creación</label>
           <ToggleGroup.Root 
            type="single" 
            value={creationType} 
            onValueChange={(val) => val && setCreationType(val as any)}
            className="flex bg-surface p-1 rounded-2xl border-2 border-border"
           >
              <ToggleGroup.Item 
                value="project" 
                className={`flex-1 py-4 rounded-xl font-disp font-black uppercase text-sm transition-all ${creationType === 'project' ? 'bg-white border-2 border-black shadow-brutal-sm text-black' : 'text-zinc-400'}`}
              >
                🎨 Proyecto
              </ToggleGroup.Item>
              <ToggleGroup.Item 
                value="product" 
                className={`flex-1 py-4 rounded-xl font-disp font-black uppercase text-sm transition-all ${creationType === 'product' ? 'bg-white border-2 border-black shadow-brutal-sm text-black' : 'text-zinc-400'}`}
              >
                📦 Producto
              </ToggleGroup.Item>
           </ToggleGroup.Root>
        </section>

        {/* INPUT NOMBRE */}
        <section className="flex flex-col gap-2">
           <label className="font-mono text-[10px] uppercase font-bold text-zinc-400">Nombre de la Obra / Lote</label>
           <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Mural Calle 10..."
            className="w-full bg-surface border-2 border-black p-5 rounded-[24px] font-disp font-bold text-2xl outline-none focus:ring-4 ring-pop-blue/10 transition-all placeholder:text-zinc-300"
           />
        </section>

        {/* C. LIENZO DE COSTOS */}
        
        {/* 1. Mano de Obra */}
        <section className="space-y-4">
           <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-pop-blue" />
              <h2 className="font-disp font-black uppercase text-sm tracking-widest text-zinc-400">Mano de Obra</h2>
           </div>
           <div className="bg-surface p-6 rounded-[32px] border-2 border-border flex flex-col gap-6">
              <div className="flex justify-between items-center">
                 <div className="flex bg-white border-2 border-black rounded-lg overflow-hidden text-[10px] font-mono font-bold">
                    <button onClick={() => setLabor({...labor, type: 'hour'})} className={`px-4 py-2 ${labor.type === 'hour' ? 'bg-black text-white' : ''}`}>X HORA</button>
                    <button onClick={() => setLabor({...labor, type: 'day'})} className={`px-4 py-2 ${labor.type === 'day' ? 'bg-black text-white' : ''}`}>X DÍA</button>
                 </div>
                 <div className="text-right">
                    <span className="font-mono text-xl font-black text-black">${math.laborTotal.toLocaleString()}</span>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <span className="font-mono text-[8px] uppercase font-bold text-zinc-400">Tu Tarifa</span>
                    <input 
                      type="number"
                      value={labor.rate || ''}
                      onChange={(e) => setLabor({...labor, rate: Number(e.target.value)})}
                      className="w-full bg-transparent border-b-2 border-black font-mono font-black text-2xl outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <span className="font-mono text-[8px] uppercase font-bold text-zinc-400">Cant. ({labor.type})</span>
                    <input 
                      type="number"
                      value={labor.amount || ''}
                      onChange={(e) => setLabor({...labor, amount: Number(e.target.value)})}
                      className="w-full bg-transparent border-b-2 border-black font-mono font-black text-2xl outline-none"
                    />
                 </div>
              </div>
           </div>
        </section>

        {/* 2. Materiales */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Package size={18} className="text-pop-green" />
                  <h2 className="font-disp font-black uppercase text-sm tracking-widest text-zinc-400">Control de Insumos</h2>
              </div>
           </div>
           
           <div className="flex flex-col gap-3">
              <AnimatePresence>
                {materials.map((mat) => (
                  <motion.div 
                    key={mat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`bg-white p-5 rounded-2xl border-2 transition-all flex justify-between items-center ${mat.affectedByAuthorship ? 'ring-2 ring-pop-yellow border-pop-yellow shadow-lg' : 'border-border'}`}
                  >
                     <div className="flex items-center gap-4">
                        <Switch.Root 
                          checked={mat.affectedByAuthorship} 
                          onCheckedChange={() => toggleAuthorship(mat.id)}
                          className="w-10 h-6 bg-zinc-100 rounded-full relative data-[state=checked]:bg-pop-yellow transition-colors border border-zinc-200"
                        >
                           <Switch.Thumb className="block w-4 h-4 bg-white rounded-full translate-x-1 transition-transform data-[state=checked]:translate-x-5 shadow-sm" />
                           <Star size={10} className="absolute top-1.5 left-1.5 text-zinc-300 pointer-events-none" />
                        </Switch.Root>
                        <div className="flex flex-col">
                           <span className="font-disp font-black text-xs uppercase italic text-black">{mat.name}</span>
                            <span className="font-mono text-[10px] text-zinc-400">{mat.quantity} unidades</span>
                        </div>
                     </div>
                     <button onClick={() => removeMaterial(mat.id)} className="text-zinc-200 hover:text-pop-red transition-colors">
                        <Trash2 size={18} />
                     </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {materials.length === 0 && (
                <div className="py-10 text-center border-2 border-dashed border-zinc-100 rounded-3xl text-zinc-300 font-mono text-xs italic">
                  No has añadido insumos.
                </div>
              )}
              <button 
                onClick={() => setIsMaterialModalOpen(true)}
                className="w-full py-5 border-2 border-dashed border-black rounded-2xl text-black font-disp font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-surface transition-all"
              >
                  <Plus size={16} /> Añadir Insumo
               </button>
           </div>
        </section>

        {/* 3. Logística (Condicional) */}
        {creationType === 'project' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <Truck size={18} className="text-pop-orange" />
                  <h2 className="font-disp font-black uppercase text-sm tracking-widest text-zinc-400">Logística y Viáticos</h2>
               </div>
               <span className="font-mono text-xs font-bold text-zinc-400">${math.logisticsTotal.toLocaleString()}</span>
            </div>
            <div className="flex flex-col gap-3">
               {logistics.map((log) => (
                 <div key={log.id} className="bg-surface p-4 rounded-xl flex justify-between items-center border border-border">
                    <div className="flex flex-col">
                       <span className="font-disp font-bold text-xs uppercase text-black">{log.name}</span>
                       <span className="font-mono text-[10px] text-zinc-400">${log.unitPrice.toLocaleString()}</span>
                    </div>
                    <button onClick={() => removeLogistics(log.id)} className="text-zinc-300"><Trash2 size={16}/></button>
                 </div>
               ))}
               <button 
                 onClick={() => setIsLogisticsModalOpen(true)}
                 className="w-full py-4 bg-surface border-2 border-black rounded-2xl text-black font-mono font-bold text-[10px] uppercase flex items-center justify-center gap-2"
               >
                  <Plus size={14} /> Añadir Gasto
               </button>
            </div>
          </section>
        )}

        {/* 4. Inversión y Lote (Condicional) */}
        {creationType === 'product' && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
               <construction size={18} className="text-pop-pink" />
               <h2 className="font-disp font-black uppercase text-sm tracking-widest text-zinc-400">Inversión y Lote</h2>
            </div>
            <div className="bg-pop-blue p-8 rounded-[40px] text-white shadow-brutal space-y-8">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="font-mono text-[8px] uppercase font-bold text-white/50">Inversión Total</label>
                     <input 
                       type="number"
                       value={investment.total || ''}
                       onChange={(e) => setInvestment({...investment, total: Number(e.target.value)})}
                       className="w-full bg-white/10 border-b-2 border-white font-mono font-black text-2xl outline-none"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="font-mono text-[8px] uppercase font-bold text-white/50">Lote (Unidades)</label>
                     <input 
                       type="number"
                       value={investment.estimatedUnits || ''}
                       onChange={(e) => setInvestment({...investment, estimatedUnits: Number(e.target.value)})}
                       className="w-full bg-white/10 border-b-2 border-white font-mono font-black text-2xl outline-none"
                     />
                  </div>
               </div>
               <div className="pt-4 border-t border-white/20 flex justify-between items-center font-mono text-xs">
                  <span className="opacity-50">Impacto x Unidad:</span>
                  <span className="font-black text-lg">${Math.round(math.investmentPerUnit).toLocaleString()}</span>
               </div>
            </div>
          </section>
        )}

        {/* D. PRICING Y GUARDADO (Footer) */}
        <section className="mt-10 space-y-10">
           <div className="space-y-6">
              <div className="flex justify-between items-end">
                 <h2 className="font-disp font-black uppercase text-sm tracking-widest text-zinc-400">Fijar Precio Final</h2>
                 <span className="font-mono text-3xl font-black text-pop-green">${sellingPrice.toLocaleString()}</span>
              </div>
              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-10"
                value={[sellingPrice]}
                max={math.productCost * 5}
                step={1}
                onValueChange={([val]) => setSellingPrice(val)}
              >
                <Slider.Track className="bg-zinc-100 relative grow rounded-full h-4 border-2 border-black">
                  <Slider.Range className={`absolute h-full rounded-full ${
                    math.profitMargin > 60 ? 'bg-pop-green' : math.profitMargin > 40 ? 'bg-pop-yellow' : 'bg-pop-red'
                  }`} />
                </Slider.Track>
                <Slider.Thumb className="block w-10 h-10 bg-white border-4 border-black rounded-full shadow-brutal-sm focus:outline-none hover:scale-110 transition-transform cursor-grab active:cursor-grabbing" />
              </Slider.Root>
           </div>

           <button 
             onClick={handleSave}
             disabled={sellingPrice === 0 || !name}
             className="w-full bg-pop-blue text-white py-8 rounded-[32px] font-disp text-2xl font-black uppercase italic shadow-brutal hover:-translate-y-1 active:translate-y-1 transition-all flex items-center justify-center gap-4 disabled:opacity-30 disabled:translate-y-0"
           >
              <Save size={28} /> Guardar Creación
           </button>
        </section>

      </main>

      {/* --- MODALS (Bottom Sheets) --- */}
      
      {/* 1. Añadir Material */}
      <Dialog.Root open={isMaterialModalOpen} onOpenChange={setIsMaterialModalOpen}>
        <Dialog.Portal>
           <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
           <Dialog.Content className="fixed bottom-0 inset-x-0 bg-white rounded-t-[40px] p-8 pb-12 z-[70] shadow-2xl flex flex-col gap-8 max-w-lg mx-auto border-x border-zinc-100">
              <div className="flex justify-between items-center">
                 <Dialog.Title className="font-disp text-2xl font-black uppercase italic text-black">Añadir del Cofre</Dialog.Title>
                 <Dialog.Close className="p-2 bg-surface rounded-full text-zinc-400"><X /></Dialog.Close>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-2">
                 {inventoryItems.map(item => (
                   <button 
                    key={item.id}
                    onClick={() => handleAddMaterial(item, 1)}
                    className="flex items-center justify-between p-4 bg-surface rounded-2xl border-2 border-border hover:border-black transition-all group"
                   >
                      <div className="flex flex-col text-left">
                         <span className="font-disp font-bold text-sm uppercase text-black">{item.name}</span>
                          <span className="font-mono text-[10px] text-zinc-400">Stock: {item.totalQuantity} {item.unit}</span>
                      </div>
                      <div className="w-10 h-10 bg-white border-2 border-border rounded-full flex items-center justify-center group-hover:border-black transition-all">
                         <Plus size={18} />
                      </div>
                   </button>
                 ))}
              </div>
           </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 2. Añadir Logística */}
      <Dialog.Root open={isLogisticsModalOpen} onOpenChange={setIsLogisticsModalOpen}>
        <Dialog.Portal>
           <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
           <Dialog.Content className="fixed bottom-0 inset-x-0 bg-white rounded-t-[40px] p-8 pb-12 z-[70] shadow-2xl flex flex-col gap-8 max-w-lg mx-auto border-x border-zinc-100">
              <div className="flex justify-between items-center">
                 <Dialog.Title className="font-disp text-2xl font-black uppercase italic text-black">Logística y Viáticos</Dialog.Title>
                 <Dialog.Close className="p-2 bg-surface rounded-full text-zinc-400"><X /></Dialog.Close>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 {[
                   { name: 'Taxi / Transporte', price: 15 },
                   { name: 'Almuerzo Trabajo', price: 10 },
                   { name: 'Alquiler Equipos', price: 50 },
                   { name: 'Otros Gastos', price: 20 },
                 ].map(opt => (
                   <button 
                    key={opt.name}
                    onClick={() => handleAddLogistics(opt)}
                    className="flex justify-between items-center p-5 bg-surface border-2 border-border rounded-2xl font-disp font-black uppercase text-sm"
                   >
                      {opt.name}
                      <span className="font-mono text-pop-orange">${opt.price}</span>
                   </button>
                 ))}
              </div>
           </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
