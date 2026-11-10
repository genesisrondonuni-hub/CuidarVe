import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Settings, DollarSign, Users, Database, 
  Save, RefreshCw, CheckCircle2, TrendingUp, CreditCard, 
  Coins, Building, UserCheck, AlertTriangle, Loader2, Sparkles, Plus, Trash2, Landmark
} from 'lucide-react';
import { api } from '../services/api';
import { formatBs } from '../utils/formatters';
import { toast } from 'react-hot-toast';

export default function AdminDashboard({ onOpenTokenStore }) {
  const [activeTab, setActiveTab] = useState('config'); // 'config', 'packages', 'stats', 'users', 'recharges'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados de configuración maestra
  const [paymentInfo, setPaymentInfo] = useState({
    pago_movil: {
      bank: '0102 - Banco de Venezuela',
      ci: 'V-20.123.456',
      phone: '0414-1234567',
      titular: 'CuidarVe Salud C.A.',
      rate_bcv: 42.50
    },
    binance: {
      pay_id: '819283741',
      email: 'pagos@cuidarve.com',
      titular: 'CuidarVe Official'
    },
    zinli: {
      email: 'pagos@cuidarve.com'
    }
  });

  const [packages, setPackages] = useState([]);
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [rechargesList, setRechargesList] = useState([]);
  const [syncingBcv, setSyncingBcv] = useState(false);

  const handleSyncBcv = async () => {
    setSyncingBcv(true);
    try {
      const res = await api.syncBcvRate();
      if (res.success) {
        toast.success(res.message);
        setPaymentInfo(prev => ({
          ...prev,
          pago_movil: { ...prev.pago_movil, rate_bcv: res.rate },
          bcv_official_date: res.official_date,
          bcv_last_synced: res.last_synced
        }));
      }
    } catch (err) {
      toast.error(err.message || 'Error al conectar con el BCV');
    } finally {
      setSyncingBcv(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();

    // Escuchar recargas en vivo para actualizar tablas y KPIs inmediatamente
    const handleLiveRecharge = (event) => {
      const newRecharge = event.detail;
      if (!newRecharge) return;

      setRechargesList(prev => [newRecharge, ...prev]);
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tokens_sold: (prev.tokens_sold || 0) + (newRecharge.amount_tokens || 0),
          revenue_bs: (prev.revenue_bs || 0) + (newRecharge.amount_bs || 0)
        };
      });
    };

    window.addEventListener('cuidarve_new_recharge', handleLiveRecharge);
    return () => window.removeEventListener('cuidarve_new_recharge', handleLiveRecharge);
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [configData, statsData, usersData, rechargesData] = await Promise.all([
        api.getAdminConfig(),
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminRecharges()
      ]);

      if (configData.payment_info) setPaymentInfo(configData.payment_info);
      if (configData.token_packages) setPackages(configData.token_packages);
      setStats(statsData || {});
      setUsersList(usersData || []);
      setRechargesList(rechargesData || []);
    } catch (err) {
      console.error(err);
      toast.error('Error cargando datos del panel maestro.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await api.updateAdminConfig({
        payment_info: paymentInfo,
        token_packages: packages
      });
      toast.success('¡Configuración maestra guardada con éxito!');
    } catch (err) {
      toast.error(err.message || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handlePackageChange = (index, field, value) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], [field]: value };
    setPackages(updated);
  };

  const handleAddPackage = () => {
    const newPkg = {
      id: Date.now(),
      tokens: 5,
      price_usd: 5.0,
      label: 'Nuevo Paquete',
      popular: false
    };
    setPackages([...packages, newPkg]);
  };

  const handleRemovePackage = (index) => {
    setPackages(packages.filter((_, i) => i !== index));
  };

  const handleToggleVerifyMPPS = async (user) => {
    const newLic = user.mpps_license ? '' : `MPPS-${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      await api.toggleUserVerify(user.id, newLic);
      toast.success(newLic ? `Colegiatura validada para ${user.name}` : `Colegiatura revocada`);
      setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, mpps_license: newLic } : u));
    } catch (err) {
      toast.error('Error modificando estado de verificación');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <span className="text-xs font-bold text-slate-600">Cargando Módulo Maestro del Dueño...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-24 space-y-6 animate-in fade-in">
      
      {/* Cabecera Maestra */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldAlert className="w-48 h-48 text-amber-400" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-amber-400/30 mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Módulo Maestro del Dueño de la Aplicación
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Panel de Control Central
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Administra los métodos de pago en Venezuela, ajusta precios de tokens, revisa transacciones de bolívares y verifica credenciales médicas.
            </p>
          </div>

          <button
            onClick={loadAllAdminData}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border border-white/20 transition active:scale-95"
          >
            <RefreshCw className="w-4 h-4" /> Sincronizar
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Globales (KPIs) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Usuarios Totales
            </span>
            <div className="text-2xl font-black text-slate-800">{stats.total_users}</div>
            <div className="text-[11px] text-teal-600 font-bold mt-1">
              👩‍⚕️ {stats.total_nurses} Enfermeros | 👤 {stats.total_patients} Pacientes
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Casos Solicitados
            </span>
            <div className="text-2xl font-black text-slate-800">{stats.total_requests}</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1">
              ✓ {stats.accepted_requests} Aceptados / Atendidos
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Tokens Vendidos
            </span>
            <div className="text-2xl font-black text-amber-600 flex items-center gap-1.5">
              <Coins className="w-5 h-5 text-amber-500" />
              {stats.tokens_sold}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Créditos colocados a enfermeros
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Ingresos Facturados
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700">
              {formatBs(stats.revenue_bs)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              ~ ${(stats.revenue_bs / (paymentInfo.pago_movil.rate_bcv || 42.5)).toFixed(2)} USD
            </div>
          </div>
        </div>
      )}

      {/* Pestañas de Gestión */}
      <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto text-xs font-bold text-slate-600">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'config' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-teal-600" />
          Métodos de Pago y Tasa BCV
        </button>

        <button
          onClick={() => setActiveTab('packages')}
          className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'packages' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500" />
          Precios y Paquetes de Tokens
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          Enfermeros & Colegiatura ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('recharges')}
          className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'recharges' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          Auditoría de Pagos Recibidos ({rechargesList.length})
        </button>
      </div>

      {/* PESTAÑA 1: MÉTODOS DE PAGO Y TASA */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Datos de Pago Oficiales en Venezuela
              </h2>
              <p className="text-xs text-slate-500">
                Cualquier cambio aquí se reflejará en vivo en la ventana de recarga de todos los enfermeros.
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Cambios
            </button>
          </div>

          {/* Tarjeta de Conexión en Vivo con el Banco Central de Venezuela */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 rounded-2xl border border-emerald-500/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <h3 className="font-black text-sm text-white">
                    Conexión Activa con el Banco Central de Venezuela (BCV)
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Tasa oficial sincronizada: <strong className="text-emerald-300 font-extrabold text-sm font-mono">Bs. {paymentInfo.pago_movil.rate_bcv} / USD</strong>
                  {paymentInfo.bcv_official_date && (
                    <span className="text-slate-400 ml-2">
                      (Reportada por BCV: {new Date(paymentInfo.bcv_official_date).toLocaleDateString('es-VE')})
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSyncBcv}
              disabled={syncingBcv}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingBcv ? 'animate-spin' : ''}`} />
              <span>{syncingBcv ? 'Consultando BCV...' : 'Actualizar Tasa BCV'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SECCIÓN PAGO MÓVIL */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <CreditCard className="w-4 h-4 text-teal-600" />
                <span>Datos de Pago Móvil (Bolívares)</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Banco Receptor
                </label>
                <input
                  type="text"
                  value={paymentInfo.pago_movil.bank}
                  onChange={(e) => setPaymentInfo({
                    ...paymentInfo,
                    pago_movil: { ...paymentInfo.pago_movil, bank: e.target.value }
                  })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Cédula / RIF
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.pago_movil.ci}
                    onChange={(e) => setPaymentInfo({
                      ...paymentInfo,
                      pago_movil: { ...paymentInfo.pago_movil, ci: e.target.value }
                    })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Teléfono Pago Móvil
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.pago_movil.phone}
                    onChange={(e) => setPaymentInfo({
                      ...paymentInfo,
                      pago_movil: { ...paymentInfo.pago_movil, phone: e.target.value }
                    })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Titular de la Cuenta
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.pago_movil.titular || ''}
                    onChange={(e) => setPaymentInfo({
                      ...paymentInfo,
                      pago_movil: { ...paymentInfo.pago_movil, titular: e.target.value }
                    })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center justify-between">
                    <span>Tasa Oficial BCV</span>
                    <span className="text-[10px] text-teal-600 font-extrabold">Bs./USD</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentInfo.pago_movil.rate_bcv}
                    onChange={(e) => setPaymentInfo({
                      ...paymentInfo,
                      pago_movil: { ...paymentInfo.pago_movil, rate_bcv: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN DIVISAS / BINANCE / ZINLI */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Binance Pay & Zinli (Divisas)</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Binance Pay ID
                </label>
                <input
                  type="text"
                  value={paymentInfo.binance.pay_id}
                  onChange={(e) => setPaymentInfo({
                    ...paymentInfo,
                    binance: { ...paymentInfo.binance, pay_id: e.target.value }
                  })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Correo Binance Pay
                </label>
                <input
                  type="email"
                  value={paymentInfo.binance.email}
                  onChange={(e) => setPaymentInfo({
                    ...paymentInfo,
                    binance: { ...paymentInfo.binance, email: e.target.value }
                  })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Correo Zinli (Billetera Digital)
                </label>
                <input
                  type="email"
                  value={paymentInfo.zinli?.email || ''}
                  onChange={(e) => setPaymentInfo({
                    ...paymentInfo,
                    zinli: { ...paymentInfo.zinli, email: e.target.value }
                  })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

          </div>
        </form>
      )}

      {/* PESTAÑA 2: PAQUETES Y PRECIOS DE TOKENS */}
      {activeTab === 'packages' && (
        <form onSubmit={handleSaveConfig} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Paquetes de Tokens Disponibles para la Venta
              </h2>
              <p className="text-xs text-slate-500">
                Define cuántos casos desbloquea cada paquete y fija su tarifa en Dólares ($). La app calculará los Bolívares en tiempo real usando tu Tasa BCV.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddPackage}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Añadir Paquete
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Precios
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {packages.map((pkg, idx) => {
              const estimatedBs = pkg.price_usd * (paymentInfo.pago_movil.rate_bcv || 42.5);
              return (
                <div 
                  key={pkg.id || idx}
                  className={`bg-slate-50 p-4 rounded-2xl border-2 transition relative ${
                    pkg.popular ? 'border-amber-500 shadow-sm' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-slate-800">Paquete #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePackage(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 transition"
                      title="Eliminar este paquete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Nombre / Etiqueta</label>
                      <input
                        type="text"
                        value={pkg.label}
                        onChange={(e) => handlePackageChange(idx, 'label', e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Tokens (Casos)</label>
                        <input
                          type="number"
                          value={pkg.tokens}
                          onChange={(e) => handlePackageChange(idx, 'tokens', parseInt(e.target.value, 10) || 1)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Precio en $ (USD)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={pkg.price_usd}
                          onChange={(e) => handlePackageChange(idx, 'price_usd', parseFloat(e.target.value) || 0)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-emerald-700"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Precio en Bolívares:</span>
                      <strong className="text-emerald-700">{formatBs(estimatedBs)}</strong>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={pkg.popular || false}
                        onChange={(e) => handlePackageChange(idx, 'popular', e.target.checked)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-[11px] font-bold text-slate-700">Marcar como "Más Popular"</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </form>
      )}

      {/* PESTAÑA 3: GESTIÓN DE USUARIOS Y VERIFICACIÓN MPPS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">
              Directorio de Usuarios Registrados
            </h2>
            <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
              Total: {usersList.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Teléfono</th>
                  <th className="p-3">Zona</th>
                  <th className="p-3">Colegiatura / MPPS</th>
                  <th className="p-3">Saldo</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[11px]">
                        {u.avatar || 'U'}
                      </span>
                      <span>{u.name}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                        u.role === 'admin'
                          ? 'bg-amber-100 text-amber-900'
                          : u.role === 'nurse'
                          ? 'bg-teal-50 text-teal-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role === 'nurse' ? 'Enfermero(a)' : u.role === 'admin' ? 'Dueño/Admin' : 'Paciente'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{u.phone}</td>
                    <td className="p-3 text-slate-600">{u.location}</td>
                    <td className="p-3">
                      {u.mpps_license ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" /> {u.mpps_license}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Sin matrícula</span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-slate-800">
                      {u.role === 'nurse' ? `${u.balance || 0} Tokens` : '-'}
                    </td>
                    <td className="p-3 text-right">
                      {u.role === 'nurse' && (
                        <button
                          onClick={() => handleToggleVerifyMPPS(u)}
                          className="px-3 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 rounded-lg font-bold text-[11px] transition"
                        >
                          {u.mpps_license ? 'Desvalidar' : 'Verificar MPPS'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: AUDITORÍA DE PAGOS Y RECARGAS */}
      {activeTab === 'recharges' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">
              Historial de Recargas y Pagos Recibidos
            </h2>
            <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full font-bold">
              {rechargesList.length} Reportes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-3">Enfermero</th>
                  <th className="p-3">Método</th>
                  <th className="p-3">Referencia</th>
                  <th className="p-3">Monto Bs.</th>
                  <th className="p-3">Tokens Acreditados</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rechargesList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-400">
                      No hay recargas registradas aún.
                    </td>
                  </tr>
                ) : (
                  rechargesList.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 font-bold text-slate-800">
                        {r.nurse_name || `Usuario #${r.user_id}`}
                      </td>
                      <td className="p-3 uppercase font-semibold text-slate-600">
                        {r.payment_method}
                      </td>
                      <td className="p-3 font-mono font-bold text-teal-800">
                        {r.reference}
                      </td>
                      <td className="p-3 font-bold text-emerald-700">
                        {formatBs(r.amount_bs)}
                      </td>
                      <td className="p-3 font-bold text-amber-600">
                        +{r.amount_tokens} Tokens
                      </td>
                      <td className="p-3 text-slate-500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                          {r.status || 'Aprobado'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
