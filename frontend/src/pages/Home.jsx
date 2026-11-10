import React, { useState } from 'react';
import { 
  HeartPulse, Activity, ShieldPlus, ChevronRight, ChevronDown,
  MapPin, Clock, Award, ShieldCheck, CheckCircle2, PhoneCall,
  Phone, UserCheck, Coins, Sparkles, Users, Stethoscope, 
  Zap, ArrowRight, Calculator, Check, Briefcase, AlertCircle, 
  Shield, MessageSquare, TrendingUp, Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home({ setView, onOpenAuth }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('patients'); // 'patients' | 'nurses'
  const [openFaq, setOpenFaq] = useState(null);

  // Estados para la Calculadora / Simulador de Enfermeros
  const [weeklyShifts, setWeeklyShifts] = useState(3);
  const [avgPricePerShift, setAvgPricePerShift] = useState(25); // USD promedio por procedimiento/guardia

  const estimatedMonthlyIncome = weeklyShifts * avgPricePerShift * 4;

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleNurseAction = () => {
    if (user && user.role === 'nurse') {
      setView('nurse');
    } else if (!user) {
      onOpenAuth('nurse');
    } else {
      setView('nurse');
    }
  };

  const handlePatientAction = () => {
    setView('patient');
  };

  // Preguntas frecuentes segmentadas
  const patientFaqs = [
    {
      q: '¿Cómo garantizan que el enfermero que viene a mi casa está realmente calificado?',
      a: 'A diferencia de contratar por redes sociales o recomendaciones dudosas, en CuidarVe todo profesional debe suministrar obligatoriamente su número de Matrícula MPPS (Ministerio del Poder Popular para la Salud) y título colegiado. Auditamos y verificamos su registro antes de validar su perfil.'
    },
    {
      q: '¿Tiene algún costo para el paciente publicar una solicitud médica?',
      a: 'Ninguno. Publicar tu requerimiento médico o solicitud de guardia es 100% gratuito. Solo pagas los honorarios acordados directamente con el profesional de enfermería al momento de la atención.'
    },
    {
      q: '¿Quién suministra las inyectadoras, gasas, soluciones o catéteres?',
      a: 'Tú eliges. En la ficha de solicitud puedes marcar si ya cuentas con todos los insumos médicos en casa, o si requieres que el enfermero traiga el kit necesario. Esto queda claro antes de iniciar el servicio para evitar sorpresas.'
    },
    {
      q: '¿En cuánto tiempo recibo respuesta de un enfermero?',
      a: 'Nuestra plataforma emite alertas en tiempo real vía WebSockets directamente a los enfermeros de guardia en tu municipio. El tiempo promedio de contacto para casos urgentes es menor a 15 minutos directo a tu WhatsApp.'
    }
  ];

  const nurseFaqs = [
    {
      q: '¿CuidarVe me descuenta algún porcentaje de lo que le cobro al paciente?',
      a: 'Cero por ciento (0%). El 100% de lo que cobres por tus procedimientos o guardias es íntegramente tuyo. El paciente te paga a ti de forma directa por Pago Móvil, efectivo o Binance a tasa oficial BCV.'
    },
    {
      q: '¿Cómo funciona el sistema de tokens para tomar casos?',
      a: 'Para mantener la plataforma libre de comisiones porcentuales y garantizar que solo profesionales comprometidos tomen los casos, desbloqueas los datos de contacto y dirección del paciente con solo 1 token. Al registrarte con tu matrícula MPPS te regalamos tus primeros 5 tokens de bienvenida.'
    },
    {
      q: '¿Puedo elegir en qué zonas trabajar para no viajar lejos?',
      a: 'Sí. El sistema filtra los casos según tu ubicación (Chacao, Baruta, El Hatillo, Libertador, Sucre o Altos Mirandinos). Solo recibirás alertas sonoras y visuales de pacientes que estén en tu radio de cobertura.'
    },
    {
      q: '¿Cómo y dónde recargo más tokens cuando se me acaben?',
      a: 'En la tienda de tokens dentro de tu panel colegiado. Puedes pagar en Bolívares vía Pago Móvil a la tasa oficial del BCV del día o mediante Binance Pay en USDT con confirmación y acreditación inmediata.'
    }
  ];

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* HERO SECTION DE DOBLE PROPUESTA DE VALOR */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-b from-teal-800 via-teal-900 to-slate-950 text-white pt-8 pb-16 px-4 sm:px-6 rounded-b-[2.5rem] shadow-2xl relative overflow-hidden">
        {/* Patrón sutil de fondo */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:20px_20px]"></div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          
          {/* Badge de Localización y Estado en Tiempo Real */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-teal-200 mb-6 border border-teal-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Red Médica Activa • Gran Caracas y Altos Mirandinos
          </div>

          {/* Selector de Perspectiva (Paciente vs Enfermero) */}
          <div className="flex justify-center mb-8">
            <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-teal-500/30 inline-flex shadow-inner">
              <button
                onClick={() => setActiveTab('patients')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'patients'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Para Familias y Pacientes</span>
              </button>
              <button
                onClick={() => setActiveTab('nurses')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'nurses'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Para Profesionales de Enfermería</span>
              </button>
            </div>
          </div>

          {/* Contenido Dinámico del Hero según Tab */}
          {activeTab === 'patients' ? (
            <div className="animate-in fade-in duration-300">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-5 max-w-3xl mx-auto">
                Atención médica domiciliaria con{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-300">
                  enfermeros colegiados
                </span>{' '}
                en tu puerta.
              </h1>
              <p className="text-teal-100 text-sm sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
                Inyectología, curas complejas, sondas y cuidados continuos de adultos mayores. Olvídate de pagar fortunas en emergencias o meter desconocidos sin credenciales a tu hogar.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                <button
                  onClick={handlePatientAction}
                  className="w-full sm:w-auto flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-6 py-4 rounded-2xl shadow-xl shadow-teal-950/50 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 text-base"
                >
                  <Activity className="w-5 h-5" />
                  <span>Publicar Caso Médico (Gratis)</span>
                </button>
                <button
                  onClick={handleNurseAction}
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-4 rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <span>¿Eres Enfermero? Regístrate</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <div className="inline-block bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                🎁 5 Tokens de Bienvenida al Registrarte con Matrícula MPPS
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-5 max-w-3xl mx-auto">
                Multiplica tus ingresos haciendo{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">
                  guardias privadas
                </span>{' '}
                en tu propia zona.
              </h1>
              <p className="text-teal-100 text-sm sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
                Deja de regalar tu esfuerzo en turnos hospitalarios agotadores. Recibe alertas en vivo de pacientes particulares cerca de ti, fija tus tarifas y cobra el 100% de tus honorarios directo a tu WhatsApp.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                <button
                  onClick={handleNurseAction}
                  className="w-full sm:w-auto flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-6 py-4 rounded-2xl shadow-xl shadow-amber-950/50 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 text-base"
                >
                  <ShieldCheck className="w-5 h-5 text-slate-950" />
                  <span>Activar mi Perfil Colegiado</span>
                </button>
                <button
                  onClick={handlePatientAction}
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-4 rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <span>Necesito un enfermero</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Garantías Rápidas */}
          <div className="mt-10 pt-8 border-t border-teal-700/50 flex flex-wrap items-center justify-center gap-6 text-xs text-teal-200">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Matrícula MPPS Verificada
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Respuesta en &lt;15 min
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-teal-300" />
              0% Comisión sobre Honorarios
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              Pago Móvil y Binance a Tasa BCV
            </span>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* COMPARATIVA DE VALOR: CLÍNICA PRIVADA VS CUIDARVE */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              ¿Por qué las familias en Caracas ya no van a emergencias por procedimientos menores?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Llevar a un paciente operado, encamado o adulto mayor a una clínica privada en Caracas o Los Teques es un dolor de cabeza logístico y financiero.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Tarjeta Opción Tradicional */}
            <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-rose-700 mb-3 bg-rose-100 px-3 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Ir a una Clínica Privada
                </div>
                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span><strong>100$ - 180$</strong> solo por pisar la emergencia, abrir historia clínica y honorarios.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>Traslado incómodo y peligroso en taxi o carro particular con el paciente adolorido.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>Esperas de 2 a 4 horas en salas contaminadas expuesto a bacterias intrahospitalarias.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>Estrés de tráfico, colas por gasolina y buscar estacionamiento seguro.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-5 pt-3 border-t border-rose-200/60 text-[11px] font-bold text-rose-800">
                Resultado: Gasto desproporcionado, agotamiento y riesgo clínico.
              </div>
            </div>

            {/* Tarjeta Solución CuidarVe */}
            <div className="bg-teal-50/70 rounded-2xl p-5 border border-teal-200 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                Solución CuidarVe
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-teal-800 mb-3 bg-teal-100 px-3 py-1 rounded-full">
                  <Check className="w-3.5 h-3.5 text-teal-700" />
                  Enfermero Colegiado en tu Casa
                </div>
                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span><strong>Ahorras hasta un 70%:</strong> Pagas únicamente el procedimiento justo pactado directamente con el profesional.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span><strong>Tu familiar no se mueve de su cama:</strong> Atención humana, digna y tranquila en su propio cuarto.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span><strong>Matrícula MPPS Auditada:</strong> Sabes con nombre, apellido y registro oficial quién atiende a tu ser querido.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span><strong>Contacto directo por WhatsApp:</strong> Sin intermediarios lentos; coordinas la llegada en minutos.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-5 pt-3 border-t border-teal-200 text-[11px] font-bold text-teal-900">
                Resultado: Paz mental para la familia y atención clínica de primer nivel.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN SERVICIOS CLÍNICOS ESTRUCTURADOS */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6">
          <div>
            <div className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              Procedimientos Domiciliarios
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              ¿Qué servicio necesita tu paciente hoy?
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-2 sm:mt-0 max-w-xs">
            Seleccionas el procedimiento, defines si tienes los insumos y te contacta el enfermero más cercano.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition group">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:bg-teal-600 group-hover:text-white transition">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-1.5">Inyectología y Vía Endovenosa</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Administración de antibióticos con horario, hidratación parenteral, vitaminas, analgésicos y colocación de catéter periférico (yelco).
            </p>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg inline-block">
              ⏱️ Visita puntual (30 - 60 min)
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition group">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-1.5">Curas de Escaras y Heridas</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Tratamiento aséptico de úlceras por presión en pacientes encamados, curación de pie diabético y heridas postoperatorias con retiro de puntos.
            </p>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg inline-block">
              🩹 Técnica estéril avanzada
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition group">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-1.5">Sondaje Foley y Nasogástrico</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Instalación o recambio de sonda vesical urinaria permanente, sonda de alimentación enteral, lavado de reservorios y vaciado de bolsas colectoras.
            </p>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block">
              🩺 Procedimiento delicado
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition group">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-1.5">Cuidado Integral del Adulto Mayor</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Asistencia integral: higiene en cama, administración estricta de medicamentos orales, movilización postural para evitar escaras y alimentación asistida.
            </p>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg inline-block">
              ☀️ Turnos de 12 o 24 horas
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition group">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-1.5">Control de Signos y Glicemia</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Monitoreo y registro de tensión arterial, saturación de oxígeno, frecuencia cardíaca y curva de glucosa capilar con glucómetro para reporte al médico tratante.
            </p>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg inline-block">
              📊 Reporte clínico estructurado
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition group">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-3 group-hover:bg-rose-600 group-hover:text-white transition">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-1.5">Guardias Nocturnas y Relevos</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Vigilancia constante durante la noche para que los familiares puedan descansar tranquilos, alertas ante descompensación y respuesta inmediata.
            </p>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg inline-block">
              🌙 Descanso seguro para la familia
            </span>
          </div>

        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handlePatientAction}
            className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-600 text-white font-black px-6 py-3.5 rounded-2xl shadow-md transition transform hover:-translate-y-0.5 active:scale-95 text-sm"
          >
            <span>Solicitar uno de estos servicios ahora</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN PARA PROFESIONALES DE ENFERMERÍA Y CALCULADORA DE INGRESOS */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-slate-700 relative overflow-hidden">
          
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4 border border-amber-400/30">
              <Award className="w-4 h-4 text-amber-400" />
              Espacio Exclusivo para Profesionales de Salud
            </span>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-4">
              ¿Cansado de que las clínicas cobren 80$ y a ti te paguen una miseria por guardia?
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
              Tu título universitario y tu matrícula MPPS valen. En CuidarVe eres tu propio jefe: atiendes pacientes particulares en tu municipio, estableces el valor de tu trabajo y cobras directo al paciente sin comisiones leoninas.
            </p>
          </div>

          {/* Grid de 3 Pilares para el Enfermero */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-black text-sm mb-2">
                1
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Alertas en tu Zona</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                No gastas horas en transporte público. Recibes solicitudes exclusivamente de tu radio de cobertura (ej: Chacao o San Antonio).
              </p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
              <div className="w-8 h-8 rounded-lg bg-teal-400/20 text-teal-300 flex items-center justify-center font-black text-sm mb-2">
                2
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Cobro Directo 100%</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                El paciente te transfiere directo por Pago Móvil, efectivo o Binance a tasa oficial del BCV. No retenemos tus honorarios.
              </p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-black text-sm mb-2">
                3
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Tokens Transparentes</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Desbloqueas el contacto del paciente con solo 1 token. Te regalamos 5 tokens al registrarte para que generes ingresos desde el día 1.
              </p>
            </div>
          </div>

          {/* CALCULADORA DE INGRESOS ESTIMADOS */}
          <div className="bg-slate-950/70 p-5 sm:p-6 rounded-2xl border border-teal-500/30">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider mb-4">
              <Calculator className="w-4 h-4" />
              <span>Simulador de Ingresos Mensuales Particulares</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>Casos / Guardias por Semana:</span>
                    <span className="font-black text-amber-300 text-sm">{weeklyShifts} casos</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weeklyShifts}
                    onChange={(e) => setWeeklyShifts(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>1 caso/sem</span>
                    <span>5 casos/sem</span>
                    <span>10 casos/sem</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>Honorario promedio estimado:</span>
                    <span className="font-black text-teal-300 text-sm">${avgPricePerShift} USD</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={avgPricePerShift}
                    onChange={(e) => setAvgPricePerShift(Number(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>$10 (Cura/Inyección)</span>
                    <span>$30 (Turno)</span>
                    <span>$60 (24h)</span>
                  </div>
                </div>
              </div>

              {/* Resultado del Simulador */}
              <div className="bg-gradient-to-b from-teal-900/60 to-slate-900 p-5 rounded-2xl border border-teal-500/40 text-center">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                  Ingreso Extra Estimado al Mes
                </span>
                <div className="text-3xl sm:text-4xl font-black text-amber-300 my-1">
                  ${estimatedMonthlyIncome} <span className="text-xs text-slate-300 font-bold">USD</span>
                </div>
                <p className="text-[11px] text-teal-200 leading-tight">
                  Calculado a {weeklyShifts * 4} atenciones mensuales en tu tiempo libre o días libres de guardia hospitalaria.
                </p>
                <button
                  onClick={handleNurseAction}
                  className="mt-4 w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Coins className="w-4 h-4 text-slate-950" />
                  <span>Empezar con mis 5 Tokens Gratis</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* CÓMO FUNCIONA CUIDARVE (PASO A PASO) */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            Simplicidad Total
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            ¿Cómo funciona CuidarVe en 3 pasos?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center flex flex-col items-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-lg mb-4">
              1
            </div>
            <h3 className="font-black text-slate-900 text-base mb-2">Publicas la Solicitud</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Eliges el servicio, tu zona (ej: Chacao o Altos Mirandinos), describes la necesidad y marcas si tienes los insumos médicos en casa.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center flex flex-col items-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-lg mb-4">
              2
            </div>
            <h3 className="font-black text-slate-900 text-base mb-2">Matching Inmediato</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Los enfermeros colegiados activos en tu zona reciben una alerta sonora en tiempo real. El primero disponible acepta el caso.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center flex flex-col items-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg mb-4">
              3
            </div>
            <h3 className="font-black text-slate-900 text-base mb-2">Contacto por WhatsApp</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Se abre el chat directo de WhatsApp. Verificas su matrícula MPPS, coordinan hora de llegada y métodos de pago sin fricción.
            </p>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* COBERTURA GEOGRÁFICA ACTIVA */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-slate-100/90 rounded-3xl p-6 sm:p-8 border border-slate-200">
          <div className="text-center max-w-xl mx-auto mb-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-100 px-3 py-1 rounded-full mb-2">
              <MapPin className="w-3.5 h-3.5 text-teal-700" />
              Zonas con Cobertura y Geolocalización
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Disponibilidad Activa en Caracas y Altos Mirandinos
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Contamos con enfermeros colegiados distribuidos estratégicamente para asegurar traslados rápidos.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 shadow-sm">
              <span className="block text-emerald-500 text-base mb-0.5">●</span>
              Chacao
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 shadow-sm">
              <span className="block text-emerald-500 text-base mb-0.5">●</span>
              Baruta
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 shadow-sm">
              <span className="block text-emerald-500 text-base mb-0.5">●</span>
              El Hatillo
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 shadow-sm">
              <span className="block text-emerald-500 text-base mb-0.5">●</span>
              Sucre
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 shadow-sm">
              <span className="block text-emerald-500 text-base mb-0.5">●</span>
              Libertador
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 shadow-sm">
              <span className="block text-emerald-500 text-base mb-0.5">●</span>
              Altos Mirandinos
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PREGUNTAS FRECUENTES (FAQ ACORDEÓN) */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            Transparencia Total
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Preguntas Frecuentes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Resolvemos tus dudas sobre seguridad, pagos, matrícula MPPS y funcionamiento.
          </p>
        </div>

        {/* Toggle para filtrar FAQ */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('patients')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'patients'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            Dudas de Pacientes
          </button>
          <button
            onClick={() => setActiveTab('nurses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'nurses'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            Dudas de Enfermeros
          </button>
        </div>

        {/* Acordeón */}
        <div className="space-y-3 max-w-3xl mx-auto">
          {(activeTab === 'patients' ? patientFaqs : nurseFaqs).map((faq, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-50 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                  openFaq === index ? 'rotate-180 text-teal-600' : ''
                }`} />
              </button>
              {openFaq === index && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50 animate-in fade-in duration-200">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BANNER FINAL DE CIERRE Y CONVERSIÓN */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-teal-900 rounded-3xl p-8 sm:p-12 text-white text-center shadow-xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative z-10">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-4">
              La tranquilidad de tu familia y el valor de tu profesión comienzan aquí.
            </h2>
            <p className="text-teal-100 text-xs sm:text-sm leading-relaxed mb-8">
              Únete a la red médica domiciliaria más confiable de la Gran Caracas y Altos Mirandinos.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handlePatientAction}
                className="w-full sm:w-auto bg-white hover:bg-teal-50 text-slate-900 font-black px-7 py-4 rounded-2xl shadow-xl transition transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center justify-center gap-2"
              >
                <Activity className="w-5 h-5 text-teal-700" />
                <span>Publicar Caso de Salud Gratis</span>
              </button>
              
              <button
                onClick={handleNurseAction}
                className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-7 py-4 rounded-2xl shadow-xl transition transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5 text-slate-950" />
                <span>Registrarme como Enfermero (+5 Tokens)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
