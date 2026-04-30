import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FinancialProvider } from './context/FinancialContext';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Studio from './pages/Studio';
import Inventory from './pages/Inventory';
import Timeline from './pages/Timeline';
import MarketRadar from './pages/MarketRadar';
import { AnimatePresence } from 'framer-motion';

function App() {
  return (
    <FinancialProvider>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/radar" element={<MarketRadar />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </FinancialProvider>
  );
}

export default App;
