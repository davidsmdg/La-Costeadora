import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFinancialData } from '../context/FinancialDataContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { studio, loading: dataLoading } = useFinancialData();
  const location = useLocation();

  if (authLoading || dataLoading) {
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

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isOnboardingPath = location.pathname === '/onboarding';

  if (studio.onboardingCompleted && isOnboardingPath) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!studio.onboardingCompleted && !isOnboardingPath) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
