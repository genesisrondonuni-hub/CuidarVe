const https = require('https');
const db = require('./database');

const BCV_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';

/**
 * Consulta la tasa oficial del Banco Central de Venezuela (BCV)
 */
function fetchBcvRate(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const req = https.get(BCV_API_URL, { timeout: timeoutMs }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Respuesta no satisfactoria de la API BCV (HTTP ${res.statusCode})`));
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const rate = parseFloat(parsed.promedio || parsed.precio || parsed.venta || parsed.compra);

          if (!rate || isNaN(rate) || rate <= 0) {
            return reject(new Error('Formato de tasa BCV inválido o no encontrado'));
          }

          resolve({
            rate: parseFloat(rate.toFixed(4)),
            fecha: parsed.fechaActualizacion || new Date().toISOString(),
            fuente: 'Banco Central de Venezuela (BCV Oficial)'
          });
        } catch (err) {
          reject(new Error(`Error parseando respuesta de BCV: ${err.message}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Tiempo de espera agotado al conectar con el servicio del BCV'));
    });

    req.on('error', (err) => {
      reject(new Error(`Error de red conectando con BCV: ${err.message}`));
    });
  });
}

/**
 * Sincroniza la tasa obtenida del BCV con la base de datos de CuidarVe
 */
async function syncBcvWithDatabase() {
  try {
    const bcvData = await fetchBcvRate();
    console.log(`[BCV Sync] Tasa oficial obtenida: Bs. ${bcvData.rate} por USD (${bcvData.fecha})`);

    return new Promise((resolve, reject) => {
      db.getSetting('payment_info', (err, paymentInfo) => {
        if (err) return reject(err);

        const updated = paymentInfo || {
          pago_movil: {
            bank: '0102 - Banco de Venezuela',
            ci: 'V-20.123.456',
            phone: '0414-1234567',
            titular: 'CuidarVe Salud C.A.',
            rate_bcv: bcvData.rate
          }
        };

        if (!updated.pago_movil) updated.pago_movil = {};
        updated.pago_movil.rate_bcv = bcvData.rate;
        updated.bcv_last_synced = new Date().toISOString();
        updated.bcv_official_date = bcvData.fecha;
        updated.bcv_source = bcvData.fuente;

        db.setSetting('payment_info', updated, (saveErr) => {
          if (saveErr) return reject(saveErr);
          resolve(updated);
        });
      });
    });
  } catch (err) {
    console.warn(`[BCV Sync Warning] No se pudo sincronizar automáticamente con el BCV: ${err.message}`);
    // No lanzamos error fatal; se preserva la última tasa guardada en la base de datos
    return null;
  }
}

/**
 * Inicia el cron/intervalo de actualización periódica (cada 1 hora)
 */
function initBcvAutoSync(intervalMinutes = 60) {
  // Sincronización inicial al arrancar
  syncBcvWithDatabase();

  // Actualización periódica en segundo plano
  setInterval(() => {
    syncBcvWithDatabase();
  }, intervalMinutes * 60 * 1000);
}

module.exports = {
  fetchBcvRate,
  syncBcvWithDatabase,
  initBcvAutoSync
};
