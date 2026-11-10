import React, { useState } from 'react';
import { X, User, Phone, Lock, MapPin, ShieldCheck, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function AuthModal({ isOpen, onClose, initialRole = 'patient' }) {
  if (!isOpen) return null;

  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [role, setRole] = useState(initialRole); // 'patient' o 'nurse'
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('Altos Mirandinos');
  const [mppsLicense, setMppsLicense] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const identifier = phone || email;
        if (!identifier || !password) {
          throw new Error('Ingresa tu teléfono/correo y contraseña');
        }
        await login(identifier, password);
        toast.success('¡Bienvenido(a) de nuevo!');
      } else {
        if (!name || !phone || !password) {
          throw new Error('Por favor completa todos los campos requeridos');
        }
        await register({
          name,
          phone,
          email,
          password,
          role,
          location,
          mpps_license: role === 'nurse' ? mppsLicense : null
        });
        toast.success(
          role === 'nurse' 
            ? '¡Cuenta profesional creada! Recibiste 5 tokens de regalo.' 
            : '¡Cuenta creada exitosamente!'
        );
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  // Login de prueba rápido para desarrollo
  const handleQuickLogin = async (type) => {
    setLoading(true);
    try {
      if (type === 'admin') {
        await login('admin@cuidarve.com', 'admin123');
        toast.success('Sesión iniciada como Dueño Master (Admin)');
      } else if (type === 'nurse') {
        await login('maria@cuidarve.com', '123456');
        toast.success('Sesión iniciada como Lic. María (Enfermera)');
      } else {
        await login('juan@cuidarve.com', '123456');
        toast.success('Sesión iniciada como Juan Pérez (Paciente)');
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error en login rápido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 my-6">
        
        {/* Cabecera */}
        <div className="bg-teal-700 text-white p-5 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-black">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta en CuidarVe'}
          </h2>
          <p className="text-teal-200 text-xs mt-0.5">
            {isLogin 
              ? 'Accede a tus solicitudes y servicios de salud' 
              : 'Conéctate con la mayor red de salud domiciliaria'}
          </p>
        </div>

        <div className="p-6">
          {/* Selector de modo Login / Registro */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                !isLogin ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Registrarme
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                isLogin ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ya tengo cuenta
            </button>
          </div>

          {!isLogin && (
            <div className="mb-4">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                ¿Qué tipo de cuenta deseas?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    role === 'patient'
                      ? 'border-teal-600 bg-teal-50/70 text-teal-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-5 h-5 text-teal-600" />
                  <span>Soy Paciente / Familiar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('nurse')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    role === 'nurse'
                      ? 'border-teal-600 bg-teal-50/70 text-teal-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <span>Soy Profesional de Enfermería</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  placeholder={role === 'nurse' ? 'Ej: Lic. Elena Morales' : 'Ej: Carlos Ramírez'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isLogin ? 'Teléfono o Correo' : 'Teléfono de Contacto (WhatsApp)'}
              </label>
              <input
                type="text"
                placeholder="Ej: 0414-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Zona de Cobertura
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Altos Mirandinos">Altos Mirandinos (Los Teques, San Antonio, Carrizal)</option>
                  <option value="Gran Caracas">Gran Caracas (Chacao, Baruta, Sucre, Libertador)</option>
                </select>
              </div>
            )}

            {!isLogin && role === 'nurse' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>N° Colegiatura / Matrícula MPPS</span>
                  <span className="text-[10px] text-teal-600 font-semibold">Verificación</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: MPPS-104928 / Col. 8412"
                  value={mppsLicense}
                  onChange={(e) => setMppsLicense(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
              ) : isLogin ? (
                'Entrar a mi Cuenta'
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Completar Registro</>
              )}
            </button>
          </form>

          {/* Cuentas de Acceso Rápido para Prueba */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 text-center tracking-wider mb-2">
              Acceso Rápido de Prueba (Demo)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="py-1.5 px-1 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-lg text-[10px] font-extrabold transition border border-amber-200"
              >
                👑 Dueño (Admin)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('nurse')}
                className="py-1.5 px-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-[10px] font-semibold transition border border-teal-200"
              >
                👩‍⚕️ Lic. María
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('patient')}
                className="py-1.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition border border-slate-200"
              >
                👤 Juan Pérez
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
