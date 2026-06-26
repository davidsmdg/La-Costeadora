import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useFinancialData } from '../context/FinancialDataContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { studio, loading: dataLoading } = useFinancialData();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !dataLoading && user) {
      if (studio?.onboardingCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [user, authLoading, dataLoading, studio, navigate]);

  if ((authLoading || dataLoading) && user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-canvas)]">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-[hsl(var(--color-primary))]/20 border-t-[hsl(var(--color-primary))] animate-spin" />
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">
          Cargando Taller...
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // Supabase returns a user session if email confirmation is disabled (default in many local development set ups or standard settings)
        if (data.session) {
          navigate('/onboarding');
        } else {
          setErrorMsg('¡Registro exitoso! Por favor revisa tu correo para confirmar tu cuenta. (Para pruebas rápidas sin verificar correo, desactiva la opción "Confirm email" en tu Panel de Supabase -> Authentication -> Providers -> Email).');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // If login successful, check profile status or navigate
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-canvas)] py-16 px-6">
      <div className="w-full max-w-md space-y-8">
        
        {/* Logo / Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[hsl(var(--color-primary))]/10 border border-[hsl(var(--color-primary))]/20 text-3xl mb-2">
            🎨
          </div>
          <h1 className="font-disp text-3xl font-extrabold text-slate-900 tracking-tight">
            La <span className="text-[hsl(var(--color-primary))]">Costeadora</span>
          </h1>
          <p className="font-text text-sm text-slate-500">
            Studio Financiero para Emprendedores Creativos
          </p>
        </div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6"
        >
          <div className="space-y-1 text-center">
            <h2 className="font-disp text-xl font-bold text-slate-800">
              {isSignUp ? 'Crea tu cuenta' : 'Ingresa a tu taller'}
            </h2>
            <p className="font-text text-xs text-slate-400">
              {isSignUp ? 'Regístrate para empezar a costear' : 'Ingresa tu usuario y contraseña'}
            </p>
          </div>

          {errorMsg && (
            <div className={`p-3.5 rounded-xl font-text text-xs text-center border ${
              errorMsg.includes('exitoso') 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                : 'bg-red-50 border-red-100 text-red-500'
            }`}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-text text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[hsl(var(--color-primary))] focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                Contraseña
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-text text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[hsl(var(--color-primary))] focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white font-disp font-bold text-sm uppercase tracking-wider rounded-xl shadow-[0_4px_12px_hsl(264_89%_58%/0.2)] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-center"
            >
              {loading ? 'Procesando...' : isSignUp ? 'Registrarse' : 'Ingresar'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className="font-text text-xs text-slate-400 hover:text-[hsl(var(--color-primary))] transition-colors underline cursor-pointer"
            >
              {isSignUp ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
            </button>
          </div>

        </motion.div>

      </div>
    </div>
  );
}
