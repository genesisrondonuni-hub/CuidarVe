import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { playCashChime, formatBs } from './utils/formatters';
import { getWsUrl } from './config';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import TokenStoreModal from './components/TokenStoreModal';
import AdminDashboard from './components/AdminDashboard';
import Home from './pages/Home';
import PatientView from './pages/PatientView';
import NurseDashboard from './pages/NurseDashboard';

function MainApp() {
  const { user, refreshBalance } = useAuth();
  const [view, setView] = useState('home'); // 'home', 'patient', 'nurse', 'admin'
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState('patient');
  const [tokenStoreOpen, setTokenStoreOpen] = useState(false);

  const handleOpenAuth = (role = 'patient') => {
    setAuthInitialRole(role);
    setAuthModalOpen(true);
  };

  const handleOpenTokenStore = () => {
    if (!user) {
      handleOpenAuth('nurse');
    } else {
      setTokenStoreOpen(true);
    }
  };

  // Escucha activa de compras de tokens en tiempo real para el Dueño (Admin)
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const ws = new WebSocket(getWsUrl());

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'SUBSCRIBE',
        role: 'admin',
        userId: user.id
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_TOKEN_RECHARGE') {
          const recharge = data.payload;
          
          // 🔔 Sonido de caja registradora / pago
          playCashChime();

          // 💬 Notificación Toast de alta prioridad al Dueño
          toast.custom((t) => (
            <div className={`${
              t.visible ? 'animate-in slide-in-from-top' : 'animate-out fade-out'
            } max-w-md w-full bg-slate-900 text-white shadow-2xl rounded-2xl pointer-events-auto flex ring-2 ring-amber-400 p-4 border border-slate-700`}>
              <div className="flex-1 w-0">
                <div className="flex items-start">
                  <div className="shrink-0 pt-0.5 text-2xl">💰</div>
                  <div className="ml-3 flex-1">
                    <p className="text-xs font-black text-amber-400 uppercase tracking-wider">
                      ¡Nueva Compra de Tokens Reportada!
                    </p>
                    <p className="mt-1 text-xs font-bold text-white">
                      {recharge.nurse_name} ({recharge.payment_method})
                    </p>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Paquete de <strong className="text-amber-300">{recharge.amount_tokens} Tokens</strong> • {formatBs(recharge.amount_bs)}
                    </p>
                    <p className="text-[10px] font-mono text-teal-300 mt-1">
                      Ref: #{recharge.reference} ({recharge.bank_origin})
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-slate-700 ml-3 pl-3">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    setView('admin');
                  }}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center"
                >
                  Ver
                </button>
              </div>
            </div>
          ), { duration: 9000 });

          // Despachar evento para que AdminDashboard actualice tablas y KPIs al vuelo
          window.dispatchEvent(new CustomEvent('cuidarve_new_recharge', { detail: recharge }));
        }
      } catch (e) {
        console.error('Error parseando notificación de compra:', e);
      }
    };

    return () => {
      if (ws.readyState === 1) ws.close();
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-teal-200 flex flex-col">
      <Toaster 
        position="top-center" 
        toastOptions={{
          className: 'text-xs font-bold rounded-2xl shadow-xl',
          duration: 3500
        }} 
      />

      {/* Barra de navegación superior */}
      <Navbar 
        onOpenAuth={() => handleOpenAuth('patient')}
        onOpenTokenStore={handleOpenTokenStore}
        setView={setView}
        currentView={view}
      />

      {/* Contenido Dinámico Principal */}
      <main className="flex-1 w-full max-w-5xl mx-auto">
        {view === 'home' && (
          <Home 
            setView={setView} 
            onOpenAuth={handleOpenAuth} 
          />
        )}

        {view === 'patient' && (
          <PatientView 
            setView={setView} 
            onOpenAuth={handleOpenAuth} 
          />
        )}

        {view === 'nurse' && (
          <NurseDashboard 
            onOpenTokenStore={handleOpenTokenStore} 
          />
        )}

        {view === 'admin' && (
          user && user.role === 'admin' ? (
            <AdminDashboard onOpenTokenStore={handleOpenTokenStore} />
          ) : (
            <Home setView={setView} onOpenAuth={handleOpenAuth} />
          )
        )}
      </main>

      {/* Modal de Autenticación / Registro */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authInitialRole}
      />

      {/* Modal de Tienda de Tokens (Pago Móvil / Binance) */}
      <TokenStoreModal 
        isOpen={tokenStoreOpen}
        onClose={() => setTokenStoreOpen(false)}
        onRechargeSuccess={() => {
          refreshBalance();
        }}
      />

      {/* Pie de página con identidad venezolana */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 CuidarVe. Plataforma de salud domiciliaria para Venezuela.</p>
          <div className="flex items-center gap-4 text-slate-600 font-semibold">
            <span>Colegiatura MPPS</span>
            <span>•</span>
            <span>Pago Móvil Inmediato</span>
            <span>•</span>
            <span>Atención 24/7</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
