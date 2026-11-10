import React from 'react';
import { 
  HeartPulse, Activity, ShieldPlus, ChevronRight, 
  MapPin, Clock, Award, ShieldCheck, CheckCircle2, PhoneCall 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home({ setView, onOpenAuth }) {
  const { user } = useAuth();

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      
      {/* Hero Principal */}
      <section className="bg-gradient-to-b from-teal-700 via-teal-800 to-teal-900 text-white pt-10 pb-16 px-6 rounded-b-[2.5rem] shadow-xl text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="max-w-xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-teal-100 mb-6 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Cobertura Activa: Gran Caracas y Altos Mirandinos
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-4">
            Atención Médica y Enfermería en la Comodidad de tu Hogar
          </h1>
          <p className="text-teal-100 text-sm md:text-base leading-relaxed mb-8 max-w-lg mx-auto">
            Conectamos familias con profesionales de enfermería verificados para inyectología, curas, cateterismo y cuidado integral del adulto mayor.
          </p>

          {/* Tarjetas de Acción Directa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
            <button
              onClick={() => setView('patient')}
              className="bg-white hover:bg-teal-50 text-slate-800 p-5 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 group border-2 border-transparent hover:border-teal-300"
            >
              <div className="w-11 h-11 bg-teal-100 rounded-xl flex items-center justify-center text-teal-700 mb-3 group-hover:bg-teal-600 group-hover:text-white transition">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center justify-between">
                <span>Necesito Asistencia</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Publica tu caso médico y recibe respuesta de enfermeros en tu zona en minutos.
              </p>
            </button>

            <button
              onClick={() => {
                if (user && user.role === 'nurse') {
                  setView('nurse');
                } else if (!user) {
                  onOpenAuth('nurse');
                } else {
                  setView('nurse');
                }
              }}
              className="bg-teal-800/80 hover:bg-teal-800 text-white p-5 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 group border border-teal-500/40"
            >
              <div className="w-11 h-11 bg-teal-600/60 rounded-xl flex items-center justify-center text-teal-200 mb-3 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                <ShieldPlus className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-white flex items-center justify-between">
                <span>Soy Enfermero(a)</span>
                <ChevronRight className="w-4 h-4 text-teal-300 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-xs text-teal-100 mt-1">
                Monetiza tu tiempo y recibe alertas en tiempo real de pacientes cerca de ti.
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Métricas y Confianza en Venezuela */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">100% Verificados</div>
              <div className="text-[11px] text-slate-500">Matrícula MPPS / Título</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">&lt; 15 Minutos</div>
              <div className="text-[11px] text-slate-500">Respuesta promedio</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Altos & Caracas</div>
              <div className="text-[11px] text-slate-500">Geolocalización activa</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Directo WhatsApp</div>
              <div className="text-[11px] text-slate-500">Trato directo sin demoras</div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios Médicos Frecuentes */}
      <section className="max-w-4xl mx-auto px-4">
        <h2 className="text-xl font-bold text-slate-800 mb-4 text-center sm:text-left">
          Servicios de Salud Más Solicitados
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
            <h4 className="font-bold text-slate-800 text-sm mb-1">Inyectología y Vía Endovenosa</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Administración de antibióticos, hidratación parenteral, vitaminas y colocación de vías periféricas.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
            <h4 className="font-bold text-slate-800 text-sm mb-1">Curas de Escaras y Heridas</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tratamiento de úlceras por presión en adultos mayores, curas postquirúrgicas y pie diabético.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
            <h4 className="font-bold text-slate-800 text-sm mb-1">Sondaje y Cuidado Prolongado</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cambio de sonda vesical Foley, sonda nasogástrica y acompañamiento clínico de 12 o 24 horas.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
