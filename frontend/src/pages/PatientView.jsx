import React, { useState } from 'react';
import { 
  MapPin, Activity, Clock, ShieldCheck, Star, 
  ChevronLeft, AlertCircle, Loader2, CheckCircle2, 
  Phone, Sparkles, Package, Building 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getWhatsAppLink } from '../utils/formatters';
import { toast } from 'react-hot-toast';

export default function PatientView({ setView, onOpenAuth }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');

  // Estado del formulario médico estructurado
  const [formData, setFormData] = useState({
    zone: user?.location || 'Altos Mirandinos',
    service_type: 'Cuidado Adulto Mayor',
    shift_type: 'Visita Puntual (1-2 horas)',
    description: '',
    patient_address: '',
    has_supplies: true,
    urgency: 'Normal',
    guest_name: user?.name || '',
    guest_phone: user?.phone || ''
  });

  const services = [
    'Cuidado Adulto Mayor',
    'Inyectología / Vía Endovenosa',
    'Curas de Escaras y Heridas',
    'Sondaje Vesical / Nasogástrico',
    'Control de Signos Vitales y Glicemia',
    'Acompañamiento Postquirúrgico'
  ];

  const shifts = [
    'Visita Puntual (1-2 horas)',
    'Turno Diurno (12 horas)',
    'Turno Nocturno (12 horas)',
    'Cuidado Continuo (24 horas)'
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (formData.description.trim().length < 10) {
      return toast.error('Describe los síntomas o condición médica con un poco más de detalle (mínimo 10 caracteres)');
    }
    if (!user && (!formData.guest_name.trim() || !formData.guest_phone.trim())) {
      return toast.error('Por favor ingresa tu nombre y teléfono para que el enfermero pueda contactarte');
    }

    setIsSearching(true);
    setError('');

    try {
      const payload = {
        zone: formData.zone,
        service_type: formData.service_type,
        shift_type: formData.shift_type,
        description: formData.description,
        patient_address: formData.patient_address || 'Se suministra al confirmar',
        has_supplies: formData.has_supplies,
        urgency: formData.urgency,
        guest_name: formData.guest_name,
        guest_phone: formData.guest_phone
      };

      const res = await api.createRequest(payload);
      setMatches(res.matches || []);
      setStep(2);
      toast.success('¡Solicitud transmitida a los enfermeros de guardia en tu zona!');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-20 animate-in fade-in duration-300">
      
      {/* Botón Volver */}
      <button 
        onClick={() => step === 2 ? setStep(1) : setView('home')} 
        className="flex items-center text-teal-700 hover:text-teal-900 mb-6 font-semibold text-xs sm:text-sm transition"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        {step === 2 ? 'Modificar Solicitud' : 'Volver al Inicio'}
      </button>

      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
          
          <div className="mb-6">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full">
              Paso 1 de 2: Ficha del Paciente
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              Solicitar Atención de Enfermería
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Completa los requerimientos clínicos para notificar a los profesionales más calificados de tu zona.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-5">
            
            {/* Zona de Cobertura */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-600" /> Zona de Atención
              </label>
              <select
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-teal-500"
              >
                <option value="Altos Mirandinos">Altos Mirandinos (Los Teques, San Antonio, Carrizal)</option>
                <option value="Gran Caracas">Gran Caracas (Chacao, Baruta, Sucre, Libertador, El Hatillo)</option>
              </select>
            </div>

            {/* Servicio Requerido y Turno */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-600" /> Servicio Clínico
                </label>
                <select
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-teal-500"
                >
                  {services.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600" /> Turno / Duración
                </label>
                <select
                  value={formData.shift_type}
                  onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-teal-500"
                >
                  {shifts.map(sh => <option key={sh} value={sh}>{sh}</option>)}
                </select>
              </div>
            </div>

            {/* ¿Quién pone los insumos? (Crítico para Venezuela) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-teal-600" /> Insumos y Material Médico
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, has_supplies: true })}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                    formData.has_supplies 
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ✓ Tengo los insumos
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, has_supplies: false })}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                    !formData.has_supplies 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Enfermero debe traerlos
                </button>
              </div>
            </div>

            {/* Descripción del Caso */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                Descripción del Diagnóstico / Síntomas
              </label>
              <textarea
                rows={3}
                placeholder="Ej: Paciente masculino de 74 años con diagnóstico de pie diabético, requiere curación estéril profunda interdiaria..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 resize-none"
                required
              />
            </div>

            {/* Dirección y Urgencia */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-teal-600" /> Dirección o Punto de Referencia
                </label>
                <input
                  type="text"
                  placeholder="Ej: San Antonio de los Altos, Urb. Los Helechos..."
                  value={formData.patient_address}
                  onChange={(e) => setFormData({ ...formData, patient_address: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Urgencia
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta</option>
                  <option value="Inmediata">Inmediata (🚨)</option>
                </select>
              </div>
            </div>

            {/* Datos de contacto si no está logueado */}
            {!user && (
              <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900">
                    Tus Datos para el Contacto por WhatsApp
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('patient')}
                    className="text-[11px] font-bold text-teal-700 underline"
                  >
                    ¿Ya tienes cuenta? Ingresa
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Tu Nombre Completo"
                    value={formData.guest_name}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Tu Teléfono (Ej: 0414-1234567)"
                    value={formData.guest_phone}
                    onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              {isSearching ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Conectando con la red médica...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Enviar Solicitud y Buscar Profesionales</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* PASO 2: RESULTADOS Y MATCHING */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-3xl flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-sm text-emerald-950">
                ¡Solicitud Transmitida Exitosamente!
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Tu solicitud ya está visible para los enfermeros disponibles en <strong>{formData.zone}</strong>. A continuación puedes ver los profesionales de guardia con mayor afinidad:
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl text-center border border-slate-100 text-slate-500 text-xs">
                No hay profesionales registrados actualmente en esta zona específica, pero tu solicitud quedó abierta en el sistema.
              </div>
            ) : (
              matches.map((nurse) => (
                <div 
                  key={nurse.id} 
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden transition hover:shadow-md"
                >
                  <div className="absolute top-0 right-0 bg-teal-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    {nurse.matchScore}% Afinidad
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xl shrink-0">
                      {nurse.avatar}
                    </div>

                    <div className="flex-1 pr-14">
                      <h4 className="font-bold text-slate-900 text-sm">{nurse.name}</h4>
                      
                      <div className="flex items-center gap-2 text-xs text-amber-500 mt-0.5 mb-1.5">
                        <div className="flex items-center gap-0.5 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" /> {nurse.rating}
                        </div>
                        <span className="text-slate-400">({nurse.reviews} reseñas)</span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-teal-600" /> {nurse.location}
                        </span>
                        <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-teal-600" /> {nurse.mpps_license}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mt-3 border border-slate-100 leading-relaxed">
                    💡 {nurse.reason}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Estado: <strong className="text-emerald-600">En Guardia Activa</strong>
                    </span>
                    <button
                      onClick={() => toast.success('El profesional ha recibido la notificación de tu solicitud.')}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" /> Solicitar Contacto
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
