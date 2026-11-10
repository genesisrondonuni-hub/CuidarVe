import React, { useState } from 'react';
import { Sparkles, RefreshCw, Crown, UserCheck, Activity, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';

export default function DemoSwitcher({ setView }) {
  const { user, loginAsDemo, refreshBalance, demoMode, toggleDemoMode } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!demoMode) return null;

  const handleSwitch = async (role) => {
    try {
      await loginAsDemo(role);
      toast.success(
        role === 'admin' 
          ? '👑 Modo Dueño Master activado' 
          : role === 'nurse' 
          ? '👩‍⚕️ Cambiado a Lic. María (Enfermera)' 
          : '👤 Cambiado a Juan Pérez (Paciente)'
      );
      setView(role === 'admin' ? 'admin' : role === 'nurse' ? 'nurse' : 'patient');
    } catch (err) {
      toast.error('Error al cambiar de cuenta demo');
    }
  };

  const handleResetDemoData = async () => {
    setResetting(true);
    try {
      const res = await api.resetDemoData();
      toast.success(res.message || 'Datos demo reiniciados con éxito');
      refreshBalance();
      // Recargar solicitudes
      window.location.reload();
    } catch (err) {
      toast.error('Error reiniciando datos demo');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white text-xs border-b border-amber-500/30 sticky top-0 z-50 shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        
        {/* Etiqueta de Modo Demo */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span className="font-extrabold text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Modo Demo Interactivo
          </span>
        </div>

        {/* Botones de cambio rápido de rol */}
        {!collapsed && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              onClick={() => handleSwitch('admin')}
              className={`px-3 py-1 rounded-lg font-black transition flex items-center gap-1 text-[11px] ${
                user?.role === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Crown className="w-3 h-3 text-amber-300" />
              <span>Dueño (Master)</span>
            </button>

            <button
              onClick={() => handleSwitch('nurse')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 text-[11px] ${
                user?.role === 'nurse'
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <UserCheck className="w-3 h-3 text-teal-300" />
              <span>Enfermera</span>
            </button>

            <button
              onClick={() => handleSwitch('patient')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 text-[11px] ${
                user?.role === 'patient'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Activity className="w-3 h-3 text-emerald-300" />
              <span>Paciente</span>
            </button>

            <button
              onClick={handleResetDemoData}
              disabled={resetting}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white rounded-lg transition flex items-center gap-1 text-[10px] font-semibold border border-white/10 ml-1"
              title="Restaura solicitudes clínicas y tokens a su estado inicial de demostración"
            >
              <RefreshCw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reiniciar Casos</span>
            </button>
          </div>
        )}

        {/* Ocultar / Minimizar barrita */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white p-1 rounded transition text-[11px] shrink-0"
          title={collapsed ? 'Expandir barra demo' : 'Minimizar'}
        >
          {collapsed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

      </div>
    </div>
  );
}
