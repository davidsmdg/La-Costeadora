import React from 'react';
import { motion } from 'framer-motion';
import { useFinancialData } from '../context/FinancialContext';
import { 
  PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import { 
  Plus, Home, Briefcase, Calendar, ChevronRight, 
  ArrowUpRight, ArrowDownLeft, DollarSign 
} from 'lucide-react';

const Dashboard = () => {
  const { projectName, bgImage, monthlyGoal, financialMetrics } = useFinancialData();

  const data = [
    { name: 'Progress', value: 3500 },
    { name: 'Remaining', value: monthlyGoal > 3500 ? monthlyGoal - 3500 : 0 }
  ];

  const COLORS = ['#2727e6', '#ffffff10'];

  return (
    <div className="min-h-screen bg-canvas text-white pb-32 relative">
      {/* Background with blur */}
      {bgImage && (
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${bgImage})`,
            filter: 'grayscale(70%) brightness(15%) blur(12px)',
          }}
        />
      )}

      {/* Header / The North */}
      <header className="relative z-10 pt-12 pb-8 flex flex-col items-center justify-center text-center">
        <p className="font-disp text-xs uppercase tracking-widest opacity-50 mb-2">{projectName || 'Mi Estudio'}</p>
        
        <div className="relative w-72 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={80}
                outerRadius={110}
                paddingAngle={0}
                dataKey="value"
                startAngle={90}
                endAngle={450}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-4xl font-bold">$3,500</span>
            <span className="font-disp text-[10px] uppercase opacity-40">Saldo Actual</span>
          </div>
        </div>
      </header>

      {/* Marquee */}
      <div className="relative z-10 w-full overflow-hidden bg-white/5 py-4 border-y border-white/10 marquee-overlay">
        <div className="rfm-marquee">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 font-mono text-sm whitespace-nowrap">
              <span className="text-pop-green">+ $200k Anticipo Mural</span>
              <span className="opacity-20">•</span>
              <span className="text-pop-red">- $15k Taxi Taller</span>
              <span className="opacity-20">•</span>
              <span className="text-pop-yellow">! Insumos Bajos</span>
              <span className="opacity-20">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Projects Feed */}
      <main className="relative z-10 p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">Tus Proyectos</h2>
          <button className="text-pop-blue font-disp text-xs uppercase flex items-center gap-1">
            Ver todo <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-4">
          {financialMetrics.length === 0 ? (
            <div className="sticker-card bg-white/5 border-white/10 text-white opacity-50 text-center py-12">
              <p className="font-disp uppercase text-sm">No hay proyectos activos</p>
              <p className="text-xs mt-2 lowercase">Toca el botón + para empezar</p>
            </div>
          ) : (
            financialMetrics.map((project: any) => (
              <motion.div 
                key={project.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/studio')}
                className="relative h-24 bg-white/5 rounded-2xl overflow-hidden group cursor-pointer"
              >
                <div 
                  className="absolute inset-y-0 left-0 bg-pop-blue transition-all duration-1000"
                  style={{ width: `${project.profitMargin}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-6 z-10">
                  <div>
                    <h3 className="text-lg uppercase">{project.name}</h3>
                    <p className="font-mono text-xs opacity-60">Margen: {Math.round(project.profitMargin)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-xl">${project.sellingPrice}</p>
                    <p className="font-disp text-[10px] uppercase opacity-40">Meta: {project.unitsNeeded} unid.</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* FAB */}
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-28 right-6 w-16 h-16 bg-pop-blue rounded-full shadow-[6px_6px_0px_#000] flex items-center justify-center z-50"
      >
        <Plus size={32} />
      </motion.button>

      {/* Bottom Bar */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-sm:w-[95%] h-16 bg-white rounded-full shadow-2xl flex items-center justify-around px-4 z-40 border-2 border-canvas">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-pop-blue"><Home size={24} /></button>
        <button onClick={() => navigate('/inventory')} className="p-2 text-canvas/30 hover:text-canvas transition-colors"><Briefcase size={24} /></button>
        <div className="w-12" />
        <button onClick={() => navigate('/timeline')} className="p-2 text-canvas/30 hover:text-canvas transition-colors"><Calendar size={24} /></button>
        <button onClick={() => navigate('/radar')} className="p-2 text-canvas/30 hover:text-canvas transition-colors"><DollarSign size={24} /></button>
      </nav>
    </div>
  );
};

export default Dashboard;
