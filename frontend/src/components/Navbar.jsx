import React from 'react';
import { HeartPulse, Coins, User, LogOut, PlusCircle, ShieldCheck, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenAuth, onOpenTokenStore, setView, currentView }) {
  const { user, balance, logout } = useAuth();

  return (
    <header className="bg-teal-700 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Logo */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group" 
          onClick={() => setView('home')}
        >
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition">
            <HeartPulse className="w-6 h-6 text-teal-200" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight flex items-center gap-1">
              Cuidar<span className="text-teal-300">Ve</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-teal-200 block -mt-1">
              Salud Domiciliaria
            </span>
          </div>
        </div>

        {/* Acciones y Perfil */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Si el usuario es el Dueño Master */}
          {user && user.role === 'admin' && (
            <button
              onClick={() => setView('admin')}
              className={`text-xs font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                currentView === 'admin'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-amber-500/90 hover:bg-amber-500 text-slate-950'
              }`}
            >
              <Crown className="w-4 h-4 text-slate-950" />
              <span>Panel Dueño</span>
            </button>
          )}

          {user ? (
            <>
              {/* Saldo de tokens si es enfermero */}
              {user.role === 'nurse' && (
                <button
                  onClick={onOpenTokenStore}
                  className="flex items-center gap-2 bg-amber-500/90 hover:bg-amber-500 text-slate-900 px-3 py-1.5 rounded-full font-bold text-xs shadow-sm transition active:scale-95"
                  title="Recargar tokens con Pago Móvil o Binance"
                >
                  <Coins className="w-4 h-4 text-amber-950" />
                  <span>{balance} {balance === 1 ? 'Token' : 'Tokens'}</span>
                  <PlusCircle className="w-3.5 h-3.5 text-amber-950" />
                </button>
              )}

              {/* Botón hacia Dashboard según rol */}
              {user.role !== 'admin' && (
                <button
                  onClick={() => setView(user.role === 'nurse' ? 'nurse' : 'patient')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    currentView === user.role
                      ? 'bg-white text-teal-800 shadow'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {user.role === 'nurse' ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-teal-300" />
                      <span>Panel Colegiado</span>
                    </>
                  ) : (
                    <span>Mi Solicitud</span>
                  )}
                </button>
              )}

              {/* Identidad de usuario y logout */}
              <div className="flex items-center gap-2 border-l border-white/20 pl-2.5">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer border ${
                    user.role === 'admin' 
                      ? 'bg-amber-500 text-slate-950 border-amber-300' 
                      : 'bg-teal-800 text-white border-teal-300/40'
                  }`}
                  title={`${user.name} (${user.role})`}
                >
                  {user.avatar || 'U'}
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-teal-200 hover:text-white hover:bg-white/10 rounded-lg transition"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-white text-teal-800 hover:bg-teal-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <User className="w-4 h-4" />
              <span>Ingresar / Registro</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
