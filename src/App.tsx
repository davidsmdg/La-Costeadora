import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FinancialDataProvider } from './context/FinancialDataContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import ProjectStudioPage from './pages/ProjectStudioPage'

import JournalPage from './pages/JournalPage'
import CreationPage from './pages/CreationPage'

export default function App() {
  return (
    <AuthProvider>
      <FinancialDataProvider>
        <BrowserRouter>
          <div className="bg-[var(--color-canvas)] min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_top_right,rgba(255,20,147,0.06)_0%,_transparent_35%),radial-gradient(circle_at_bottom_left,rgba(0,200,83,0.04)_0%,_transparent_35%)]">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/studio/:id" element={
                <ProtectedRoute>
                  <ProjectStudioPage />
                </ProtectedRoute>
              } />

              <Route path="/journal" element={
                <ProtectedRoute>
                  <JournalPage />
                </ProtectedRoute>
              } />
              <Route path="/create" element={
                <ProtectedRoute>
                  <CreationPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </FinancialDataProvider>
    </AuthProvider>
  )
}
