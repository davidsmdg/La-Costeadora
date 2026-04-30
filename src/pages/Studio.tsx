import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFinancialData } from '../context/FinancialContext';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import { 
  ArrowLeft, Star, Info, TrendingUp, AlertCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const Studio = () => {
  const navigate = useNavigate();
  const { totalFixedExpenses } = useFinancialData();
  
  // Local state for simulator
  const [unitCost, setUnitCost] = useState(45);
  const [sellingPrice, setSellingPrice] = useState(120);
  const [unitsPerMonth, setUnitsPerMonth] = useState(25);

  const stats = useMemo(() => {
    const margin = ((sellingPrice - unitCost) / sellingPrice) * 100;
    const contribution = sellingPrice - unitCost;
    const breakEvenUnits = Math.ceil(totalFixedExpenses / contribution);
    
    return {
      margin,
      breakEvenUnits,
      isHealthy: margin > 60,
      isWarning: margin <= 60 && margin > 40,
      isCritical: margin <= 40
    };
  }, [unitCost, sellingPrice, totalFixedExpenses]);

  const pieData = [
    { name: 'Costos', value: unitCost },
    { name: 'Margen', value: sellingPrice - unitCost }
  ];

  return (
    <div className="min-h-screen bg-canvas text-white pb-12">
      {/* Sticky Header Traffic Light */}
      <div className={`sticky top-0 z-50 p-6 flex items-center justify-between transition-colors duration-500 border-b-4 border-canvas ${
        stats.isHealthy ? 'bg-pop-green text-canvas' : 
        stats.isWarning ? 'bg-pop-yellow text-canvas' : 'bg-pop-red text-white'
      }`}>
        <button onClick={() => navigate(-1)} className="p-2 bg-canvas/10 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <p className="font-disp text-[10px] uppercase font-bold opacity-60">Margen Sugerido</p>
          <h2 className="text-3xl font-mono">{Math.round(stats.margin)}%</h2>
        </div>
        <div className="w-10" />
      </div>

      <main className="p-6 space-y-8">
        {/* Simulator Sliders */}
        <section className="space-y-6">
          <h3 className="text-xl flex items-center gap-2">
            <TrendingUp size={20} className="text-pop-blue" />
            El Laboratorio (Sandbox)
          </h3>
          
          <div className="space-y-8 bg-white/5 p-6 rounded-3xl border-2 border-white/10">
            <SimulatorSlider 
              label="Costo Unitario" 
              value={unitCost} 
              onChange={setUnitCost} 
              max={500} 
              color="bg-pop-pink" 
            />
            <SimulatorSlider 
              label="Precio de Venta" 
              value={sellingPrice} 
              onChange={setSellingPrice} 
              max={1000} 
              color="bg-pop-green" 
            />
            <SimulatorSlider 
              label="Unidades / Mes" 
              value={unitsPerMonth} 
              onChange={setUnitsPerMonth} 
              max={100} 
              color="bg-pop-blue" 
            />
          </div>
        </section>

        {/* Recipe Breakdown */}
        <section className="space-y-4">
          <h3 className="text-xl">La Receta</h3>
          <div className="space-y-3">
            {[
              { name: 'Materia Prima A', cost: 25, star: true },
              { name: 'Empaque Premium', cost: 12, star: false },
              { name: 'Logística', cost: 8, star: false },
            ].map((item, i) => (
              <div key={i} className={`p-4 bg-white/5 rounded-2xl flex items-center justify-between border-2 border-transparent transition-all ${item.star ? 'border-pop-yellow/30 shadow-[0_0_15px_rgba(255,214,0,0.1)]' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.star ? 'bg-pop-yellow text-canvas' : 'bg-white/10'}`}>
                    {item.star ? <Star size={16} fill="currentColor" /> : <Info size={16} />}
                  </div>
                  <div>
                    <p className="font-disp text-sm uppercase">{item.name}</p>
                    <p className="font-mono text-xs opacity-50">${item.cost}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs">Autoría</span>
                  <Switch.Root className="w-11 h-6 bg-white/10 rounded-full relative data-[state=checked]:bg-pop-yellow outline-none cursor-default">
                    <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
                  </Switch.Root>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Break Even Chart */}
        <section className="sticker-card bg-pop-blue text-white space-y-4 p-8">
          <div className="flex justify-between items-start">
            <h3 className="text-2xl leading-tight">Punto de <br/>Equilibrio</h3>
            <div className="bg-canvas/20 p-3 rounded-2xl">
              <AlertCircle size={24} />
            </div>
          </div>
          
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#ffffff40" />
                  <Cell fill="#ffffff" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <p className="font-disp text-sm leading-relaxed text-center opacity-80">
            Debes vender <span className="font-mono font-bold text-white text-xl">{stats.breakEvenUnits}</span> unidades de este producto para cubrir tus gastos fijos mensuales.
          </p>
        </section>
      </main>
    </div>
  );
};

const SimulatorSlider = ({ label, value, onChange, max, color }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <span className="font-disp text-xs uppercase opacity-50">{label}</span>
      <span className="font-mono font-bold text-xl">${value}</span>
    </div>
    <Slider.Root 
      className="relative flex items-center select-none touch-none w-full h-5"
      value={[value]}
      max={max}
      step={1}
      onValueChange={(val) => onChange(val[0])}
    >
      <Slider.Track className="bg-white/10 relative grow rounded-full h-3">
        <Slider.Range className={`absolute h-full rounded-full ${color}`} />
      </Slider.Track>
      <Slider.Thumb className="block w-6 h-6 bg-white rounded-full shadow-lg border-4 border-canvas focus:outline-none" />
    </Slider.Root>
  </div>
);

export default Studio;
