import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, TrendingUp, Award, Info } from 'lucide-react';
import * as Accordion from '@radix-ui/react-accordion';

const MarketRadar = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const competitors = [
    { name: 'Tienda Artesanal A', price: 145, badge: 'Premium', color: 'bg-pop-green' },
    { name: 'Estudio de Diseño X', price: 95, badge: 'Económico', color: 'bg-pop-blue' },
    { name: 'Freelancer Local', price: 110, badge: 'Promedio', color: 'bg-pop-yellow' },
  ];

  return (
    <div className="min-h-screen bg-canvas text-white pb-12">
      <header className="p-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full"><ArrowLeft size={24} /></button>
        <h1 className="text-2xl">Radar de Mercado</h1>
        <div className="w-10" />
      </header>

      <main className="p-6 space-y-8">
        {/* Selector */}
        <div className="text-center space-y-2">
          <p className="font-disp text-[10px] uppercase opacity-40">Comparando para:</p>
          <h2 className="text-3xl text-pop-blue">Mural Texturizado</h2>
        </div>

        {/* Tinder Stacks */}
        <div className="relative h-96 w-full perspective-1000">
          <AnimatePresence>
            {competitors.slice(currentIndex, currentIndex + 1).map((comp, i) => (
              <motion.div 
                key={comp.name}
                initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ x: 500, opacity: 0, rotate: 20 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, info) => {
                  if (info.offset.x > 100) setCurrentIndex(prev => (prev + 1) % competitors.length);
                }}
                className={`absolute inset-0 sticker-card ${comp.color} text-canvas flex flex-col items-center justify-center gap-6 p-12 cursor-grab active:cursor-grabbing`}
              >
                <Award size={64} />
                <div className="text-center">
                  <h3 className="text-4xl leading-tight">{comp.name}</h3>
                  <p className="font-mono text-2xl font-bold mt-2">${comp.price}</p>
                </div>
                <div className="bg-canvas text-white px-4 py-1 rounded-full font-disp text-[10px] uppercase">
                  {comp.badge}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Advisor Accordion */}
        <Accordion.Root type="single" collapsible className="space-y-4">
          <Accordion.Item value="item-1" className="bg-white/5 rounded-3xl overflow-hidden border-2 border-white/10">
            <Accordion.Header>
              <Accordion.Trigger className="w-full p-6 flex justify-between items-center font-disp text-sm uppercase">
                Consejero del Radar
                <Info size={18} />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="p-6 pt-0 text-sm opacity-70 leading-relaxed">
              Estás cobrando un 15% por debajo del promedio de la "Tienda Artesanal A". 
              Considera subir el precio gradualmente para reflejar el valor premium de tu técnica.
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>

        <div className="grid grid-cols-2 gap-4">
          <div className="sticker-card bg-white/5 border-white/10 text-white flex flex-col items-center gap-1">
            <span className="font-mono text-2xl">120$</span>
            <span className="font-disp text-[10px] uppercase opacity-40">Tu Precio</span>
          </div>
          <div className="sticker-card bg-white/5 border-white/10 text-white flex flex-col items-center gap-1">
            <span className="font-mono text-2xl">115$</span>
            <span className="font-disp text-[10px] uppercase opacity-40">Promedio</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarketRadar;
