import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Activity, Clock, Package, AlertCircle, 
  Coins, Phone, ShieldCheck, CheckCircle2, Loader2, 
  Sparkles, ExternalLink, RefreshCw, ChevronRight, Unlock 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getWhatsAppLink, formatTimeAgo, formatVenezuelanPhone } from '../utils/formatters';
import { getWsUrl } from '../config';
import { toast } from 'react-hot-toast';

export default function NurseDashboard({ onOpenTokenStore }) {
  const { user, balance, updateBalance } = useAuth();
  const [selectedZone, setSelectedZone] = useState(user?.location || 'Altos Mirandinos');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'my_cases', 'transactions'
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  // 1. Cargar solicitudes iniciales y conectar WebSocket
  useEffect(() => {
    loadPendingRequests();
    if (activeTab === 'my_cases') loadMyCases();
    if (activeTab === 'transactions') loadTransactions();

    // Conexión WebSocket con suscripción por canal
    const wsUrl = getWsUrl();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      // Suscribirse al canal de su zona
      ws.send(JSON.stringify({
        type: 'SUBSCRIBE',
        role: 'nurse',
        zone: selectedZone,
        userId: user?.id
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_REQUEST') {
          toast('¡Nueva solicitud médica en tu zona!', { icon: '🚨' });
          setPendingRequests((prev) => [data.payload, ...prev.filter(r => r.id !== data.payload.id)]);
        } else if (data.type === 'REQUEST_ACCEPTED_BY_ANOTHER') {
          // Remover si otro colega ya lo tomó
          setPendingRequests((prev) => prev.filter(r => r.id !== data.payload.id));
        }
      } catch (e) {
        console.error('Error parseando mensaje WS:', e);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      if (ws.readyState === 1) ws.close();
    };
  }, [selectedZone, user?.id]);

  const loadPendingRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getRequests(selectedZone);
      setPendingRequests(data || []);
    } catch (err) {
      console.error(err);
      toast.error('No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  const loadMyCases = async () => {
    try {
      const data = await api.getMyRequests();
      setMyCases(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await api.getTokenTransactions();
      setTransactions(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Aceptar caso con transacción atómica
  const handleAcceptRequest = async (request) => {
    if (balance < 1) {
      toast.error('No tienes tokens disponibles. Recarga para aceptar casos.');
      onOpenTokenStore();
      return;
    }

    setAcceptingId(request.id);
    try {
      const res = await api.acceptRequest(request.id);
      if (res.success) {
        toast.success('¡Caso aceptado! Datos de contacto desbloqueados.');
        updateBalance(res.newBalance);
        
        // Quitar de pendientes y refrescar "Mis Casos"
        setPendingRequests(prev => prev.filter(r => r.id !== request.id));
        loadMyCases();
        setActiveTab('my_cases');
      }
    } catch (err) {
      toast.error(err.message || 'Error al aceptar la solicitud');
      loadPendingRequests();
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20 animate-in fade-in duration-300 space-y-6">
      
      {/* Banner de Perfil del Profesional */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-700 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center font-black text-2xl">
              {user?.avatar || 'EN'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">{user?.name || 'Lic. Profesional'}</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {wsConnected ? 'En Guardia (En Vivo)' : 'Conectando'}
                </span>
              </div>
              
              <p className="text-teal-200 text-xs mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> 
                {user?.mpps_license ? `Matrícula: ${user.mpps_license}` : 'Colegiatura en validación'}
              </p>
            </div>
          </div>

          {/* Saldo y Recarga Rápida */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-start">
            <div>
              <div className="text-[10px] font-bold text-teal-200 uppercase tracking-wider">Tu Saldo</div>
              <div className="text-xl font-black text-amber-300 flex items-center gap-1.5">
                <Coins className="w-5 h-5 text-amber-400" />
                {balance} <span className="text-xs text-white font-semibold">Tokens</span>
              </div>
            </div>
            <button
              onClick={onOpenTokenStore}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl font-extrabold text-xs shadow-md transition active:scale-95"
            >
              + Recargar
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Zona y Pestañas */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Pestañas de navegación */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'pending'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Casos Disponibles ({pendingRequests.length})
          </button>
          <button
            onClick={() => { setActiveTab('my_cases'); loadMyCases(); }}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'my_cases'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mis Casos Aceptados
          </button>
          <button
            onClick={() => { setActiveTab('transactions'); loadTransactions(); }}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'transactions'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Historial de Tokens
          </button>
        </div>

        {/* Filtro de Zona */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-teal-600" /> Zona:
          </span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 shadow-sm"
          >
            <option value="Altos Mirandinos">Altos Mirandinos</option>
            <option value="Gran Caracas">Gran Caracas</option>
            <option value="Todas">Todas las Zonas</option>
          </select>
        </div>
      </div>

      {/* CONTENIDO DE PESTAÑA: CASOS DISPONIBLES */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <span className="text-xs font-semibold">Cargando solicitudes clínicas...</span>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm space-y-3">
              <Activity className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                No hay solicitudes pendientes en {selectedZone}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Mantén esta pestaña abierta. El canal WebSocket te alertará de inmediato cuando un paciente publique un caso en tu zona.
              </p>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div 
                key={req.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
                      {req.service_type || 'Atención General'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {req.shift_type || 'Visita Puntual'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      req.urgency === 'Alta' || req.urgency === 'Inmediata'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      Urgencia {req.urgency || 'Normal'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatTimeAgo(req.created_at)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span>{req.zone}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    "{req.description}"
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-teal-600" />
                    <span>
                      Insumos: {req.has_supplies ? 'Dispone de material médico' : 'Enfermero debe llevar material'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAcceptRequest(req)}
                    disabled={acceptingId === req.id}
                    className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-extrabold text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {acceptingId === req.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Adjudicando caso...</>
                    ) : (
                      <><Unlock className="w-4 h-4" /> Tomar Caso (1 Token)</>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA: MIS CASOS ACEPTADOS */}
      {activeTab === 'my_cases' && (
        <div className="space-y-4">
          {myCases.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 text-slate-500 text-xs">
              Aún no has aceptado ningún caso. Revisa la pestaña de "Casos Disponibles" para tomar tu primer paciente.
            </div>
          ) : (
            myCases.map((c) => {
              const waLink = getWhatsAppLink(c.patient_phone, c.patient_name, c.service_type);
              return (
                <div 
                  key={c.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-teal-500/30 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {c.patient_name || 'Paciente CuidarVe'}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      Caso #{c.id}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                    <div>
                      <strong className="text-slate-800">Dirección:</strong> {c.patient_address || 'Acordada por chat'}
                    </div>
                    <div>
                      <strong className="text-slate-800">Servicio:</strong> {c.service_type} ({c.shift_type})
                    </div>
                    <div>
                      <strong className="text-slate-800">Detalle clínico:</strong> {c.description}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" /> Escribir por WhatsApp ({c.patient_phone})
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA: HISTORIAL DE TOKENS */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-900 text-sm mb-4">
            Historial de Movimientos de Saldo
          </h3>
          {transactions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              No hay movimientos registrados todavía.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{t.description || t.type}</div>
                    <div className="text-[10px] text-slate-400">{formatTimeAgo(t.created_at)}</div>
                  </div>
                  <div className={`font-black text-sm ${t.amount > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {t.amount > 0 ? `+${t.amount}` : t.amount} Tokens
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
