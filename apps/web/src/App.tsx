import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav';
import { useI18n } from './utils/i18n';
import { useStore } from './store/useStore';
import { Loader2 } from 'lucide-react';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';

const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ScanResult = lazy(() => import('./pages/ScanResult'));
const Passport = lazy(() => import('./pages/Passport'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Copilot = lazy(() => import('./pages/Copilot'));
const CheckoutSimulation = lazy(() => import('./pages/CheckoutSimulation'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'));

export default function App() {
  const { lang } = useI18n();
  const { user, refreshUser } = useStore();

  // Refresh live user data (especially scanCredits) on every app boot
  useEffect(() => {
    if (user) refreshUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <Suspense fallback={
              <div className="w-full flex-1 flex flex-col items-center justify-center p-20 text-zinc-500">
                <Loader2 size={32} className="animate-spin text-cyan-500" />
                <span className="mt-4 text-xs font-bold font-mono">جاري التحميل...</span>
              </div>
            }>
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
            </Suspense>
          </main>


        </div>
      </div>
      <VercelAnalytics />
    </Router>
  );
}
