// Utilidades de formato para CuidarVe (Venezuela)

/**
 * Normaliza cualquier número de teléfono venezolano a formato internacional para WhatsApp
 * Ejemplos:
 * "0414-1234567" -> "584141234567"
 * "0424 987.65.43" -> "584249876543"
 * "4121234567" -> "584121234567"
 * "+584141234567" -> "584141234567"
 */
export function formatVenezuelanPhone(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('58')) {
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return `58${cleaned}`;
}

/**
 * Genera el enlace directo a WhatsApp con mensaje de saludo predeterminado
 */
export function getWhatsAppLink(phone, patientName = '', serviceType = '') {
  const intPhone = formatVenezuelanPhone(phone);
  const msg = encodeURIComponent(
    `Hola ${patientName ? patientName : ''}, te contacto a través de CuidarVe con respecto a tu solicitud de servicio médico${serviceType ? ` (${serviceType})` : ''}. Estoy disponible para atenderte.`
  );
  return `https://wa.me/${intPhone}?text=${msg}`;
}

/**
 * Formato de moneda en Bolívares
 */
export function formatBs(amount) {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
    minimumFractionDigits: 2
  }).format(amount).replace('VES', 'Bs.');
}

/**
 * Formato de tiempo transcurrido relativo
 */
export function formatTimeAgo(dateString) {
  if (!dateString) return 'Reciente';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Hace un momento';
  if (diffSec < 3600) return `Hace ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `Hace ${Math.floor(diffSec / 3600)} h`;
  return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });
}

/**
 * Sintetizador Web Audio nativo para alerta sonora de pago / compra de tokens
 * (Funciona en todos los navegadores sin archivos mp3 externos)
 */
export function playCashChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Tono 1 (Moneda / Registro)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain1.gain.setValueAtTime(0.25, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.4);

    // Tono 2 (Brillo agudo)
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1174.66, ctx.currentTime); // D6
        gain2.gain.setValueAtTime(0.2, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.45);
      } catch (e) {}
    }, 120);
  } catch (e) {
    // Silencioso si la política del navegador bloquea el autoplay antes de la interacción
  }
}
