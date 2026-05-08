import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { FinancialDataProvider } from './context/FinancialDataContext'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import ProjectStudioPage from './pages/ProjectStudioPage'

import JournalPage from './pages/JournalPage'
import BenchmarkPage from './pages/BenchmarkPage'
import CreationPage from './pages/CreationPage'

export default function App() {
  return (
    <FinancialDataProvider>
      <BrowserRouter>
        <div className="bg-zinc-100 min-h-screen flex justify-center items-start overflow-x-hidden bg-[radial-gradient(circle_at_top_right,_var(--color-pop-blue)_0%,_transparent_25%),radial-gradient(circle_at_bottom_left,_var(--color-pop-green)_0%,_transparent_25%)] bg-opacity-5"> {/* Premium Background */}
          <div className="bg-white min-h-screen w-full max-w-lg md:max-w-xl shadow-2xl relative px-6 overflow-x-hidden">
            <Routes>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/studio/:id" element={<ProjectStudioPage />} />

              <Route path="/journal" element={<JournalPage />} />
              <Route path="/benchmark" element={<BenchmarkPage />} />
              <Route path="/create" element={<CreationPage />} />
              <Route path="*" element={<Navigate to="/onboarding" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </FinancialDataProvider>
  )
}
