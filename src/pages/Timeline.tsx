import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Mic, MessageSquare } from 'lucide-react';

const Timeline = () => {
  const navigate = useNavigate();

  const events = [
    { type: 'future', date: 'En 5 días', title: 'Anticipo Proyecto B', amount: 450, isIncome: true },
    { type: 'future', date: 'En 12 días', title: 'Pago Alquiler Taller', amount: 800, isIncome: false },
    { type: 'past', date: 'Hoy', title: 'Venta Producto X', amount: 120, isIncome: true },
    { type: 'past', date: 'Ayer', title: 'Materiales Papelería', amount: 45, isIncome: false },
  ];

  return (
    <div className="min-h-screen bg-canvas text-white pb-32">
      <header className="p-6 flex items-center justify-between sticky top-0 bg-canvas/80 backdrop-blur-md z-50">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full"><ArrowLeft size={24} /></button>
        <h1 className="text-2xl">Línea de Tiempo</h1>
        <div className="w-10" />
      </header>

      <main className="p-6 space-y-8">
        {/* Liquidity Alert */}
        <div className="sticker-card bg-pop-yellow text-canvas p-6 flex flex-col gap-2">
          <p className="font-disp text-xs uppercase font-bold opacity-70">Salud de Caja</p>
          <h2 className="text-3xl font-mono">+$2,400</h2>
          <p className="text-xs">Proyección a 30 días estable. ¡Buen trabajo!</p>
        </div>

        {/* Timeline Feed */}
        <div className="space-y-6 relative">
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-white/10 rounded-full" />
          
          {events.map((event, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative flex items-start gap-6 pl-14"
            >
              <div className={`absolute left-4 top-2 w-5 h-5 rounded-full border-4 border-canvas z-10 ${
                event.type === 'future' ? 'bg-pop-blue border-dashed animate-pulse' : 'bg-pop-green'
              }`} />
              
              <div className={`flex-1 p-4 rounded-2xl border-2 ${
                event.isIncome ? 'bg-pop-green/10 border-pop-green/20' : 'bg-pop-red/10 border-pop-red/20'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono text-[10px] opacity-40 uppercase">{event.date}</p>
                    <h4 className="font-disp text-sm uppercase">{event.title}</h4>
                  </div>
                  <div className={`font-mono font-bold ${event.isIncome ? 'text-pop-green' : 'text-pop-red'}`}>
                    {event.isIncome ? <TrendingUp size={14} className="inline mr-1" /> : <TrendingDown size={14} className="inline mr-1" />}
                    ${event.amount}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Voice Journal Input */}
      <div className="fixed bottom-28 left-6 right-6 z-50">
        <div className="bg-white text-canvas p-4 rounded-3xl shadow-2xl flex items-center gap-4 border-4 border-canvas">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Gasté 50k en pintura..."
              className="w-full bg-transparent outline-none font-disp text-sm"
            />
          </div>
          <button className="w-12 h-12 bg-pop-blue text-white rounded-2xl flex items-center justify-center hover:scale-105 transition-transform">
            <Mic size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
