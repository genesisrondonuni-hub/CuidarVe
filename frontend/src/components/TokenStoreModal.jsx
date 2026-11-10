import React, { useState, useEffect } from 'react';
import { X, Coins, CheckCircle, CreditCard, Copy, Check, Loader2, Sparkles, Building2, Landmark } from 'lucide-react';
import { api } from '../services/api';
import { formatBs } from '../utils/formatters';
import { toast } from 'react-hot-toast';

export default function TokenStoreModal({ isOpen, onClose, onRechargeSuccess }) {
  if (!isOpen) return null;

  const [paymentInfo, setPaymentInfo] = useState({
    pago_movil: {
      bank: '0102 - Banco de Venezuela',
      ci: 'V-20.123.456',
      phone: '0414-1234567',
      rate_bcv: 896.12
    },
    binance: {
      pay_id: '819283741'
    }
  });

  const [packages, setPackages] = useState([
    { id: 1, tokens: 3, price_usd: 3.0, label: 'Básico (3 casos)', popular: false },
    { id: 2, tokens: 7, price_usd: 6.0, label: 'Profesional (7 casos)', popular: true },
    { id: 3, tokens: 15, price_usd: 12.0, label: 'Clínico (15 casos)', popular: false }
  ]);

  const [selectedPackage, setSelectedPackage] = useState(packages[1]);
  const [paymentMethod, setPaymentMethod] = useState('pago_movil'); // 'pago_movil' o 'binance'
  const [reference, setReference] = useState('');
  const [bankOrigin, setBankOrigin] = useState('Banesco');
  const [loading, setLoading] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [copiedField, setCopiedField] = useState(null);

  // Cargar datos dinámicos sincronizados con el BCV
  useEffect(() => {
    setLoadingInfo(true);
    api.getPaymentInfo()
      .then(data => {
        if (data.pago_movil) {
          setPaymentInfo(data);
        }
        if (data.packages && data.packages.length > 0) {
          setPackages(data.packages);
          const pop = data.packages.find(p => p.popular) || data.packages[0];
          setSelectedPackage(pop);
        }
      })
      .catch(err => {
        console.error('Error cargando datos de pago y BCV:', err);
      })
      .finally(() => {
        setLoadingInfo(false);
      });
  }, []);

  const rateBcv = paymentInfo?.pago_movil?.rate_bcv || 896.12;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copiado: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRecharge = async (e) => {
    e.preventDefault();
    if (!reference.trim()) {
      return toast.error('Ingresa el número de referencia del comprobante');
    }

    setLoading(true);
    try {
      const amountBs = (selectedPackage.price_usd || selectedPackage.usd || 6.0) * rateBcv;
      const res = await api.rechargeTokens({
        amount_tokens: selectedPackage.tokens,
        amount_bs: amountBs,
        payment_method: paymentMethod,
        reference: reference.trim(),
        bank_origin: bankOrigin
      });

      if (res.success) {
        toast.success(res.message || '¡Recarga acreditada con éxito!');
        if (onRechargeSuccess) onRechargeSuccess(res.balance);
        onClose();
      }
    } catch (err) {
      toast.error(err.message || 'Error procesando la recarga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 my-8">
        
        {/* Cabecera del modal */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
              <Coins className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">Recarga de Tokens CuidarVe</h2>
              </div>
              <p className="text-teal-100 text-xs mt-0.5">
                Desbloquea solicitudes médicas de pacientes directos a tu WhatsApp
              </p>
            </div>
          </div>

          {/* Badge de Tasa BCV Oficial en Vivo */}
          <div className="mt-3.5 inline-flex items-center gap-2 bg-slate-900/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            <Landmark className="w-3.5 h-3.5 text-emerald-300" />
            <span>Tasa Oficial BCV:</span>
            <strong className="text-emerald-300 font-extrabold">{formatBs(rateBcv)} / USD</strong>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Selección de Paquete */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 block">
              1. Selecciona tu Paquete de Tokens
            </label>
            <div className="grid grid-cols-3 gap-3">
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.tokens === pkg.tokens;
                const usdPrice = pkg.price_usd || pkg.usd || 0;
                const bsAmount = usdPrice * rateBcv;
                return (
                  <div
                    key={pkg.id || pkg.tokens}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`relative cursor-pointer rounded-2xl p-3 text-center border-2 transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/70 shadow-md ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> Popular
                      </span>
                    )}
                    <div className="text-2xl font-black text-slate-800">{pkg.tokens}</div>
                    <div className="text-[11px] font-bold text-teal-700 uppercase">{pkg.tokens} Casos</div>
                    <div className="text-xs font-extrabold text-slate-700 mt-1">${usdPrice}</div>
                    <div className="text-[10px] text-slate-500 font-medium">~{formatBs(bsAmount)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Método de Pago */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 block">
              2. Método de Pago en Venezuela
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('pago_movil')}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                  paymentMethod === 'pago_movil'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Pago Móvil (Bs.)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('binance')}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                  paymentMethod === 'binance'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Coins className="w-4 h-4" /> Binance Pay (USDT)
              </button>
            </div>
          </div>

          {/* Datos Bancarios según método */}
          {paymentMethod === 'pago_movil' ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-slate-700">
                <span className="font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" /> Banco:
                </span>
                <span className="font-bold">{paymentInfo.pago_movil.bank}</span>
              </div>
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-600">Teléfono:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(paymentInfo.pago_movil.phone, 'tel')}
                  className="font-mono font-bold text-teal-700 hover:underline flex items-center gap-1"
                >
                  {paymentInfo.pago_movil.phone} {copiedField === 'tel' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-600">Cédula / RIF:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(paymentInfo.pago_movil.ci, 'ci')}
                  className="font-mono font-bold text-teal-700 hover:underline flex items-center gap-1"
                >
                  {paymentInfo.pago_movil.ci} {copiedField === 'ci' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-800 font-bold">Monto Exacto a Transferir:</span>
                <span className="text-sm font-extrabold text-emerald-700">
                  {formatBs((selectedPackage?.price_usd || selectedPackage?.usd || 6.0) * rateBcv)}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <span className="text-slate-600 font-medium">Binance Pay ID:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(paymentInfo.binance.pay_id, 'payid')}
                  className="font-mono font-bold text-amber-900 hover:underline flex items-center gap-1"
                >
                  {paymentInfo.binance.pay_id} {copiedField === 'payid' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                </button>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-800 font-bold">Monto USDT:</span>
                <span className="text-sm font-extrabold text-amber-800">
                  ${selectedPackage?.price_usd || selectedPackage?.usd || 6.0}.00 USDT
                </span>
              </div>
            </div>
          )}

          {/* Formulario de Confirmación */}
          <form onSubmit={handleRecharge} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {paymentMethod === 'pago_movil' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Banco Emisor
                  </label>
                  <select
                    value={bankOrigin}
                    onChange={(e) => setBankOrigin(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Banesco">Banesco</option>
                    <option value="Mercantil">Mercantil</option>
                    <option value="BDV">Banco de Venezuela</option>
                    <option value="BNC">BNC</option>
                    <option value="Bancaribe">Bancaribe</option>
                    <option value="Provincial">BBVA Provincial</option>
                  </select>
                </div>
              )}

              <div className={paymentMethod === 'binance' ? 'col-span-2' : ''}>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  N° de Referencia (Últimos 4 o 8 dígitos)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 849201"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !reference.trim()}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verificando reporte...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Notificar Pago y Acreditar Tokens</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
