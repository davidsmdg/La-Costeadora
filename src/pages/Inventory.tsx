import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as Progress from '@radix-ui/react-progress';
import { 
  ArrowLeft, Package, Plus, AlertTriangle, 
  History, ShoppingCart, RefreshCcw 
} from 'lucide-react';

const Inventory = () => {
  const navigate = useNavigate();

  const inventory = [
    { name: 'Cacao Premium 85%', stock: 85, unit: 'kg', threshold: 20 },
    { name: 'Azúcar Orgánica', stock: 45, unit: 'kg', threshold: 15 },
    { name: 'Cajas de Lujo', stock: 12, unit: 'unid', threshold: 25 },
    { name: 'Etiquetas Sticker', stock: 150, unit: 'unid', threshold: 100 },
    { name: 'Manteca de Cacao', stock: 5, unit: 'kg', threshold: 10 },
  ];

  return (
    <div className="min-h-screen bg-canvas text-white pb-12">
      <header className="p-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl">El Cofre</h1>
        <button className="p-2 bg-pop-blue rounded-full">
          <Plus size={24} />
        </button>
      </header>

      <main className="p-6 space-y-8">
        {/* Critical Alerts */}
        <section className="bg-pop-red/10 border-2 border-pop-red p-4 rounded-3xl flex items-center gap-4 animate-pulse">
          <AlertTriangle className="text-pop-red shrink-0" size={32} />
          <div>
            <p className="font-disp text-xs uppercase font-bold text-pop-red">Alerta de Insumos</p>
            <p className="text-sm opacity-80">3 materiales están por debajo del nivel crítico.</p>
          </div>
        </section>

        {/* Inventory List */}
        <div className="space-y-6">
          {inventory.map((item, i) => {
            const isCritical = item.stock < item.threshold;
            const progress = Math.min((item.stock / (item.threshold * 2)) * 100, 100);
            
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="sticker-card bg-white/5 border-white/10 text-white p-5 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className={`p-3 rounded-2xl ${isCritical ? 'bg-pop-red text-white' : 'bg-pop-green/20 text-pop-green'}`}>
                      <Package size={20} />
                    </div>
                    <div>
                      <h4 className="font-disp uppercase text-sm">{item.name}</h4>
                      <p className="font-mono text-xs opacity-50">Stock: {item.stock} {item.unit}</p>
                    </div>
                  </div>
                  <button className="p-2 bg-white/10 rounded-xl hover:bg-pop-blue transition-colors group">
                    <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                  </button>
                </div>

                <div className="space-y-2">
                  <Progress.Root 
                    className="relative overflow-hidden bg-white/10 rounded-full w-full h-4"
                    value={progress}
                  >
                    <Progress.Indicator 
                      className={`h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.65, 0, 0.35, 1)] ${
                        isCritical ? 'bg-pop-red' : progress > 70 ? 'bg-pop-green' : 'bg-pop-yellow'
                      }`}
                      style={{ transform: `translateX(-${100 - progress}%)` }}
                    />
                  </Progress.Root>
                  <div className="flex justify-between text-[10px] font-mono opacity-40 uppercase">
                    <span>Crítico: {item.threshold}</span>
                    <span>Óptimo: {item.threshold * 2}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-4">
          <button className="sticker-card bg-pop-yellow text-canvas flex flex-col items-center gap-2 p-6">
            <History size={24} />
            <span className="font-disp text-[10px] uppercase font-bold">Historial</span>
          </button>
          <button className="sticker-card bg-pop-pink text-canvas flex flex-col items-center gap-2 p-6">
            <ShoppingCart size={24} />
            <span className="font-disp text-[10px] uppercase font-bold">Compras</span>
          </button>
        </section>
      </main>
    </div>
  );
};

export default Inventory;
