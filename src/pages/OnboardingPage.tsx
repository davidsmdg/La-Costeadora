import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Slider from '@radix-ui/react-slider';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { Camera, Check, ChevronDown, Rocket, Heart, Briefcase, History, ArrowUpRight, Radar } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinancialData } from '../context/FinancialDataContext';

const SUBSCRIPTION_OPTIONS = [
  { id: 'adobe', name: 'Adobe CC', monthlyAmount: 60, icon: '🎨' },
  { id: 'canva', name: 'Canva', monthlyAmount: 13, icon: '🖌️' },
  { id: 'spotify', name: 'Spotify', monthlyAmount: 11, icon: '🎵' },
  { id: 'figma', name: 'Figma', monthlyAmount: 15, icon: '📐' },
  { id: 'notion', name: 'Notion', monthlyAmount: 10, icon: '📝' },
  { id: 'chatgpt', name: 'ChatGPT', monthlyAmount: 20, icon: '🤖' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { studio, updateStudio, updateFixedExpenses } = useFinancialData();
  const [step, setStep] = useState(1);
  const [bgPreview, setBgPreview] = useState<string | null>(null);

  // Local Wizard State
  const [wizardData, setWizardData] = useState({
    projectName: '',
    personalExpenses: 1500,
    selectedSubs: [] as string[],
    extraGoalAmount: 5000,
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleFinish = () => {
    updateStudio({
      projectName: wizardData.projectName,
      backgroundImageUrl: bgPreview,
      extraGoalAmount: wizardData.extraGoalAmount,
      onboardingCompleted: true,
    });

    const activeSubs = SUBSCRIPTION_OPTIONS.filter(s => wizardData.selectedSubs.includes(s.id)).map(s => ({
      ...s,
      isActive: true,
    }));

    updateFixedExpenses({
      housing: wizardData.personalExpenses * 0.4, // Simplified for wizard
      food: wizardData.personalExpenses * 0.3,
      transport: wizardData.personalExpenses * 0.1,
      subscriptions: activeSubs as any[],
      workshopRent: 0,
      equipmentInstallments: 0,
    });

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2727E6', '#00C853', '#FFD600', '#FF3D00'],
    });

    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  const totalSubs = SUBSCRIPTION_OPTIONS.filter(s => wizardData.selectedSubs.includes(s.id)).reduce((a, b) => a + b.monthlyAmount, 0);
  const monthlyGoal = wizardData.personalExpenses + totalSubs + (wizardData.extraGoalAmount / 12);

  return (
    <div className="relative min-h-screen w-full bg-white text-black overflow-hidden">
      {/* Background image removed for solid white look */}

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-md flex flex-col gap-8"
            >
              <div className="space-y-2">
                <h1 className="font-disp text-4xl font-extrabold leading-tight text-black">
                  Primero, <span className="text-pop-blue">bautiza</span> tu espacio.
                </h1>
                <p className="font-text text-zinc-500">Dale un nombre a tu proyecto creativo.</p>
              </div>

              <input
                type="text"
                placeholder="Nombre del Proyecto..."
                className="w-full bg-transparent border-b-4 border-zinc-200 focus:border-pop-blue outline-none py-4 text-3xl font-disp transition-colors placeholder:text-zinc-200 text-black"
                value={wizardData.projectName}
                onChange={(e) => setWizardData({ ...wizardData, projectName: e.target.value })}
              />

              <div className="flex flex-col items-center">
                <label className="group relative w-48 h-48 rounded-full bg-zinc-50 border-4 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:border-pop-blue transition-all overflow-hidden shadow-brutal-sm">
                  {bgPreview ? (
                    <img src={bgPreview} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-zinc-400 mb-2" />
                      <span className="font-mono text-[9px] uppercase font-bold text-zinc-400">Sube tu Taller</span>
                    </>
                  )}
                  <input type="file" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setBgPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </div>

              <button
                disabled={!wizardData.projectName}
                onClick={nextStep}
                className="w-full bg-black text-white font-disp text-xl py-6 rounded-2xl shadow-brutal hover:-translate-y-1 transition-all disabled:opacity-50"
              >
                Continuar
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-md flex flex-col gap-10"
            >
              <div className="space-y-2">
                <h2 className="font-disp text-4xl font-extrabold text-black">
                  Hablemos de <span className="text-pop-green">vida</span>.
                </h2>
                <p className="font-text text-zinc-500">¿Cuánto necesitas para cubrir tus gastos personales?</p>
              </div>

              <div className="space-y-8">
                <div className="flex justify-between items-end">
                   <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">Gasto Mensual</span>
                   <span className="font-mono text-4xl font-black text-pop-blue">${wizardData.personalExpenses.toLocaleString()}</span>
                </div>
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-5"
                  value={[wizardData.personalExpenses]}
                  max={10000}
                  step={100}
                  onValueChange={([val]) => setWizardData({ ...wizardData, personalExpenses: val })}
                >
                  <Slider.Track className="bg-zinc-100 relative grow rounded-full h-4 border border-zinc-200">
                    <Slider.Range className="absolute bg-pop-blue rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb className="block w-6 h-6 bg-white border-4 border-black rounded-full shadow-brutal-sm focus:outline-none" />
                </Slider.Root>
              </div>

              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 font-mono text-zinc-400">Atrás</button>
                <button onClick={nextStep} className="flex-[2] bg-pop-green text-black font-disp text-xl py-5 rounded-2xl shadow-brutal">Siguiente</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-md flex flex-col gap-10"
            >
              <div className="space-y-2">
                <h2 className="font-disp text-4xl font-extrabold text-black">
                  El <span className="text-pop-pink">motor</span> fijo.
                </h2>
                <p className="font-text text-zinc-500">Suscripciones del negocio.</p>
              </div>

              <ToggleGroup.Root
                type="multiple"
                className="grid grid-cols-2 gap-4"
                value={wizardData.selectedSubs}
                onValueChange={(val) => setWizardData({ ...wizardData, selectedSubs: val })}
              >
                {SUBSCRIPTION_OPTIONS.map(opt => (
                  <ToggleGroup.Item
                    key={opt.id}
                    value={opt.id}
                    className="p-6 bg-zinc-50 border-2 border-zinc-200 rounded-2xl transition-all data-[state=on]:bg-pop-pink data-[state=on]:border-black data-[state=on]:shadow-brutal flex flex-col items-center gap-2"
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="font-disp font-bold text-[10px] uppercase">{opt.name}</span>
                  </ToggleGroup.Item>
                ))}
              </ToggleGroup.Root>

              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 font-mono text-zinc-400">Atrás</button>
                <button onClick={nextStep} className="flex-[2] bg-pop-orange text-white font-disp text-xl py-5 rounded-2xl shadow-brutal">Siguiente</button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md flex flex-col gap-10 text-center"
            >
              <div className="space-y-2">
                <h2 className="font-disp text-5xl font-black text-black">
                  Tu <span className="text-pop-green">Meta</span> Real.
                </h2>
                <p className="font-text text-zinc-500">Esto es lo que necesitas generar libre.</p>
              </div>

              <div className="bg-white border-4 border-black p-12 rounded-[48px] shadow-brutal flex flex-col items-center gap-2">
                 <span className="font-mono text-[10px] font-black uppercase text-zinc-400">Objetivo Mensual</span>
                 <div className="font-disp text-7xl font-black text-pop-green italic">
                   ${Math.round(monthlyGoal).toLocaleString()}
                 </div>
              </div>

              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 font-mono text-zinc-400">Revisar</button>
                <button
                  onClick={handleFinish}
                  className="flex-[2] bg-pop-blue text-white font-disp text-xl py-6 rounded-2xl shadow-brutal"
                >
                  ¡A Romperla!
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Progress */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-black' : 'w-2 bg-zinc-200'}`} />
        ))}
      </div>
    </div>
  );
}
