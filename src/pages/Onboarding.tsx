import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFinancialData } from '../context/FinancialContext';
import * as Slider from '@radix-ui/react-slider';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { Camera, Home, Coffee, Bus, Briefcase, Plus, Check, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const { 
    projectName, setProjectName, 
    bgImage, setBgImage,
    addExpense,
    setMonthlyGoal,
    totalFixedExpenses 
  } = useFinancialData();
  const navigate = useNavigate();

  const nextStep = () => setStep(prev => prev + 1);

  const handleFinish = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2727e6', '#00c853', '#ffd600', '#ff3d00']
    });
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background with blur */}
      {bgImage && (
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000"
          style={{ 
            backgroundImage: `url(${bgImage})`,
            filter: 'grayscale(50%) brightness(30%) blur(8px)',
            transform: 'scale(1.1)'
          }}
        />
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="z-10 w-full max-w-md space-y-8"
          >
            <h1 className="text-5xl leading-tight">Primero, bautiza tu espacio</h1>
            <div className="space-y-4">
              <input 
                type="text" 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Nombre del Proyecto"
                className="neo-input w-full"
              />
              <div 
                className="w-full h-64 border-4 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-pop-blue transition-colors group"
                onClick={() => {
                  const url = prompt('Ingresa la URL de una imagen de fondo (o deja vacío para usar color sólido)');
                  if (url) setBgImage(url);
                }}
              >
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-pop-blue transition-colors">
                  <Camera className="text-white w-8 h-8" />
                </div>
                <p className="font-disp uppercase text-sm opacity-50">Sube una foto de tu taller</p>
              </div>
            </div>
            <button 
              disabled={!projectName}
              onClick={nextStep}
              className="pill-button bg-pop-blue text-white w-full py-4 mt-8 disabled:opacity-50"
            >
              Continuar
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="z-10 w-full max-w-md space-y-8"
          >
            <h1 className="text-4xl">Para crear, hay que vivir.</h1>
            <p className="text-xl opacity-80">¿Cuáles son tus gastos básicos mensuales?</p>
            
            <div className="space-y-6">
              {[
                { name: 'Techo y Servicios', icon: Home, color: 'bg-pop-blue', rotate: '-rotate-2' },
                { name: 'Comida y Mercado', icon: Coffee, color: 'bg-pop-yellow', rotate: 'rotate-1' },
                { name: 'Transporte y Movilidad', icon: Bus, color: 'bg-pop-pink', rotate: '-rotate-1' }
              ].map((item, i) => (
                <div key={i} className={`sticker-card ${item.color} ${item.rotate} flex items-center gap-4`}>
                  <div className="p-3 bg-canvas/10 rounded-full">
                    <item.icon className="text-canvas w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-disp text-xs uppercase opacity-70">{item.name}</p>
                    <div className="flex items-center gap-4">
                      <Slider.Root 
                        className="relative flex items-center select-none touch-none w-full h-5"
                        defaultValue={[500]}
                        max={5000}
                        step={100}
                        onValueChange={(val) => {
                          // In a real app we'd update state per item
                          // For demo we just add it
                        }}
                      >
                        <Slider.Track className="bg-canvas/20 relative grow rounded-full h-2">
                          <Slider.Range className="absolute bg-canvas rounded-full h-full" />
                        </Slider.Track>
                        <Slider.Thumb className="block w-5 h-5 bg-canvas rounded-full focus:outline-none" />
                      </Slider.Root>
                      <span className="font-mono font-bold">$500</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={() => {
              // Mock adding expenses
              addExpense({ name: 'Vida', amount: 1500, category: 'personal' });
              nextStep();
            }} className="pill-button bg-white text-canvas w-full py-4">
              Siguiente Paso
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="z-10 w-full max-w-md space-y-8"
          >
            <h1 className="text-4xl">Herramientas del Oficio</h1>
            <p className="text-xl opacity-80">Selecciona tus suscripciones y gastos fijos de trabajo.</p>
            
            <ToggleGroup.Root 
              type="multiple" 
              className="grid grid-cols-3 gap-4"
              onValueChange={(vals) => {
                // Handle logic
              }}
            >
              {['Adobe', 'Canva', 'Spotify', 'Figma', 'Notion', 'ChatGPT'].map((tool) => (
                <ToggleGroup.Item 
                  key={tool}
                  value={tool}
                  className="h-24 bg-white/5 border-2 border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 data-[state=on]:bg-pop-green data-[state=on]:text-canvas data-[state=on]:border-canvas transition-all"
                >
                  <Briefcase size={24} />
                  <span className="font-disp text-[10px] uppercase">{tool}</span>
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>

            <div className="space-y-4">
              <button className="w-full p-4 border-2 border-white/20 rounded-2xl flex items-center justify-between font-disp text-xs uppercase opacity-60">
                Alquiler de Taller
                <Plus size={16} />
              </button>
              <button className="w-full p-4 border-2 border-white/20 rounded-2xl flex items-center justify-between font-disp text-xs uppercase opacity-60">
                Cuotas de Equipos
                <Plus size={16} />
              </button>
            </div>

            <button onClick={() => {
              addExpense({ name: 'Negocio', amount: 800, category: 'business' });
              nextStep();
            }} className="pill-button bg-pop-green text-canvas w-full py-4">
              Definir mi Meta
            </button>
          </motion.div>
        )}

        {step === 4 && ( step4Content(totalFixedExpenses, handleFinish, setMonthlyGoal) )}
      </AnimatePresence>
    </div>
  );
};

const step4Content = (total, onFinish, setGoal) => (
  <motion.div 
    key="step4"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="z-10 w-full max-w-md text-center space-y-12"
  >
    <div className="space-y-4">
      <h1 className="text-5xl">Tu Horizonte</h1>
      <p className="text-xl opacity-80 text-center">¿Cuál es tu objetivo extra para este mes?</p>
    </div>

    <div className="grid grid-cols-3 gap-4">
      {[
        { name: 'Viaje', icon: '✈️' },
        { name: 'Equipo', icon: '🖥️' },
        { name: 'Ahorro', icon: '💰' }
      ].map((item) => (
        <button 
          key={item.name}
          onClick={() => setGoal(total + 1000)}
          className="h-32 sticker-card flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform"
        >
          <span className="text-4xl">{item.icon}</span>
          <span className="font-disp text-[10px] uppercase">{item.name}</span>
        </button>
      ))}
    </div>

    <div className="bg-pop-blue p-8 rounded-[40px] shadow-[8px_8px_0px_#000] space-y-2">
      <p className="font-disp text-xs uppercase opacity-60">Tu meta mensual sugerida</p>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-6xl font-mono font-bold"
      >
        ${total + 1000}
      </motion.div>
    </div>

    <button 
      onClick={onFinish}
      className="pill-button bg-white text-canvas w-full py-6 text-xl group"
    >
      ¡A Romperla!
      <TrendingUp className="group-hover:translate-x-2 transition-transform" />
    </button>
  </motion.div>
);

export default Onboarding;
