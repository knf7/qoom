import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import TopNav from './components/TopNav';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ScanResult from './pages/ScanResult';
import Passport from './pages/Passport';
import Analytics from './pages/Analytics';
import Copilot from './pages/Copilot';
import CheckoutSimulation from './pages/CheckoutSimulation';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import { useI18n } from './utils/i18n';

export default function App() {
  const { lang } = useI18n();

  useEffect(() => {
    // Sync document directions on initial mount
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, [lang]);

  return (
    <Router>
      {/* Premium Cyber Noise Overlay */}
      <div className="noise-overlay"></div>

      {/* Main Layout wrapper */}
      <div className={`relative min-h-screen text-foreground flex flex-col bg-[#0a0a0a] ${lang === 'ar' ? 'text-right' : 'text-left'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Top Navigation */}
        <TopNav />

        <div className="flex-1 flex flex-col justify-between pt-20">
          {/* Main Routing Gateway */}
          <main className="w-full relative z-10 flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Dashboard />} />
              <Route path="/scan/:id" element={<ScanResult />} />
              <Route path="/passport/:id" element={<Passport />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/copilot" element={<Copilot />} />
              <Route path="/checkout-simulation" element={<CheckoutSimulation />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />
            </Routes>
          </main>

          {/* Global Minimalist Footer */}
          <footer className="w-full py-8 text-center text-[10px] text-zinc-600 border-t border-white/5 bg-[#0a0a0a] relative z-10 select-none">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© {new Date().getFullYear()} Qoom AI Operating System. Inc. All rights reserved.</span>
            <span className="text-cyan-500/60 font-sans tracking-wide">نظام قُوم الاستخباري // توافق الوكلاء المتعددين</span>
          </div>
        </footer>
        </div>
      </div>
    </Router>
  );
}
