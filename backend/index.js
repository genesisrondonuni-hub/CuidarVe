const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const db = require('./database');
const { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  authMiddleware, 
  optionalAuthMiddleware 
} = require('./auth');
const { initBcvAutoSync, syncBcvWithDatabase, fetchBcvRate } = require('./bcvService');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Middleware exclusivo para Dueño / Administrador Master
function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Acceso denegado: Este módulo es de uso exclusivo del Dueño/Administrador.' });
    }
  });
}

// --- WebSocket con Gestión de Canales/Zonas ---
const clients = new Map();

wss.on('connection', (ws) => {
  clients.set(ws, { role: 'guest', zone: null, userId: null });

  ws.on('message', (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw);
      if (data.type === 'SUBSCRIBE') {
        const current = clients.get(ws) || {};
        clients.set(ws, {
          ...current,
          role: data.role || 'nurse',
          zone: data.zone || null,
          userId: data.userId || null
        });
        ws.send(JSON.stringify({ type: 'SUBSCRIBED', zone: data.zone }));
      }
    } catch (err) {
      console.error('Error procesando mensaje WebSocket:', err.message);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

function broadcastToZoneNurses(zone, type, payload) {
  const message = JSON.stringify({ type, payload });
  for (const [ws, meta] of clients.entries()) {
    if (ws.readyState === 1) {
      const isNurse = meta.role === 'nurse' || meta.role === 'admin';
      const isSameZone = !meta.zone || meta.zone === 'Todas' || meta.zone === zone;
      
      if (isNurse && isSameZone) {
        ws.send(message);
      }
    }
  }
}

function broadcastRequestRemoved(requestId) {
  const message = JSON.stringify({ type: 'REQUEST_ACCEPTED_BY_ANOTHER', payload: { id: requestId } });
  for (const [ws] of clients.entries()) {
    if (ws.readyState === 1) {
      ws.send(message);
    }
  }
}

// Notificar exclusivamente al Dueño / Administrador Master (ej: compras de tokens)
function broadcastToAdmin(type, payload) {
  const message = JSON.stringify({ type, payload });
  for (const [ws, meta] of clients.entries()) {
    if (ws.readyState === 1 && meta.role === 'admin') {
      ws.send(message);
    }
  }
}

// --- ENDPOINTS DE AUTENTICACIÓN ---

app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password, role, location, mpps_license } = req.body;

  if (!name || !phone || !password || !role) {
    return res.status(400).json({ error: 'Nombre, teléfono, contraseña y rol son obligatorios.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  const validRole = role === 'nurse' ? 'nurse' : 'patient';
  const userEmail = email ? email.trim().toLowerCase() : `${phone.replace(/\D/g, '')}@cuidarve.local`;
  const defaultLocation = location || 'Altos Mirandinos';

  db.get(`SELECT id FROM users WHERE email = ? OR phone = ?`, [userEmail, phone], (err, existing) => {
    if (err) return res.status(500).json({ error: 'Error en la base de datos.' });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un usuario registrado con este teléfono o correo.' });
    }

    const passwordHash = hashPassword(password);
    const initials = name.split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase();

    db.run(
      `INSERT INTO users (role, name, email, password_hash, phone, location, rating, reviews, avatar, mpps_license)
       VALUES (?, ?, ?, ?, ?, ?, 5.0, 0, ?, ?)`,
      [validRole, name, userEmail, passwordHash, phone, defaultLocation, initials, mpps_license || null],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'No se pudo completar el registro.' });
        }

        const newUserId = this.lastID;
        const token = generateToken({ id: newUserId, role: validRole, name, location: defaultLocation });

        if (validRole === 'nurse') {
          db.run(`INSERT INTO tokens (user_id, balance) VALUES (?, 5)`, [newUserId], () => {
            db.run(
              `INSERT INTO token_transactions (user_id, type, amount, description) VALUES (?, 'welcome', 5, 'Bono inicial de bienvenida')`,
              [newUserId]
            );

            return res.status(201).json({
              success: true,
              token,
              user: {
                id: newUserId,
                name,
                role: validRole,
                email: userEmail,
                phone,
                location: defaultLocation,
                avatar: initials,
                mpps_license: mpps_license || null,
                balance: 5
              }
            });
          });
        } else {
          return res.status(201).json({
            success: true,
            token,
            user: {
              id: newUserId,
              name,
              role: validRole,
              email: userEmail,
              phone,
              location: defaultLocation,
              avatar: initials
            }
          });
        }
      }
    );
  });
});

app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Por favor ingresa teléfono/correo y contraseña.' });
  }

  const cleanIdent = identifier.trim().toLowerCase();

  db.get(
    `SELECT u.*, t.balance FROM users u 
     LEFT JOIN tokens t ON u.id = t.user_id 
     WHERE u.email = ? OR u.phone = ? OR u.phone = ?`,
    [cleanIdent, identifier, cleanIdent],
    (err, user) => {
      if (err) return res.status(500).json({ error: 'Error del servidor al buscar usuario.' });
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas. Usuario no encontrado.' });
      }

      const isValid = verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Contraseña incorrecta.' });
      }

      const token = generateToken({ 
        id: user.id, 
        role: user.role, 
        name: user.name, 
        location: user.location 
      });

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          location: user.location,
          avatar: user.avatar,
          rating: user.rating,
          reviews: user.reviews,
          mpps_license: user.mpps_license,
          balance: user.role === 'nurse' ? (user.balance || 0) : undefined
        }
      });
    }
  );
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  db.get(
    `SELECT u.id, u.role, u.name, u.email, u.phone, u.location, u.avatar, u.rating, u.reviews, u.mpps_license, t.balance 
     FROM users u 
     LEFT JOIN tokens t ON u.id = t.user_id 
     WHERE u.id = ?`,
    [req.user.id],
    (err, user) => {
      if (err || !user) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json({ user });
    }
  );
});

// --- ENDPOINTS DE SOLICITUDES MÉDICAS ---

app.post('/api/requests', optionalAuthMiddleware, (req, res) => {
  const { 
    zone, 
    service_type, 
    shift_type, 
    description, 
    patient_address, 
    has_supplies, 
    urgency,
    guest_name,
    guest_phone
  } = req.body;

  if (!zone || !description) {
    return res.status(400).json({ error: 'Zona y descripción médica son campos obligatorios.' });
  }

  const saveRequest = (patientId) => {
    const sType = service_type || 'General';
    const shType = shift_type || 'Visita Puntual';
    const urg = urgency || 'Normal';
    const supplies = has_supplies !== undefined ? (has_supplies ? 1 : 0) : 1;
    const address = patient_address || 'Dirección acordada al contactar';

    const query = `
      INSERT INTO requests (patient_id, zone, service_type, shift_type, description, patient_address, has_supplies, urgency, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    db.run(query, [patientId, zone, sType, shType, description, address, supplies, urg], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error al registrar la solicitud médica.' });
      }

      const newRequestId = this.lastID;

      const sanitizedNotification = {
        id: newRequestId,
        patientType: "Paciente CuidarVe",
        zone,
        service_type: sType,
        shift_type: shType,
        description,
        urgency: urg,
        has_supplies: supplies,
        time: "Justo ahora"
      };

      broadcastToZoneNurses(zone, 'NEW_REQUEST', sanitizedNotification);

      db.all(
        `SELECT id, name, avatar, rating, reviews, location, mpps_license 
         FROM users 
         WHERE role = 'nurse' AND location = ?`,
        [zone],
        (err, nurses) => {
          if (err) {
            return res.status(201).json({ 
              message: 'Solicitud creada exitosamente', 
              requestId: newRequestId, 
              matches: [] 
            });
          }

          const matches = nurses.map(n => {
            let score = 85;
            if (n.rating >= 4.8) score += 8;
            if (n.mpps_license) score += 5;
            if (n.reviews > 10) score += 2;
            score = Math.min(score, 99);

            return {
              id: n.id,
              name: n.name,
              avatar: n.avatar,
              rating: n.rating,
              reviews: n.reviews,
              location: n.location,
              mpps_license: n.mpps_license ? 'Colegiado / MPPS verificado' : 'En proceso de verificación',
              matchScore: score,
              reason: n.mpps_license 
                ? `Profesional verificado en ${zone} con especialidad en atención domiciliaria.`
                : `Disponible en tu zona (${zone}) con excelente reputación de pacientes.`
            };
          });

          res.status(201).json({
            message: 'Solicitud creada y transmitida a los enfermeros de la zona.',
            requestId: newRequestId,
            matches
          });
        }
      );
    });
  };

  if (req.user && req.user.id) {
    saveRequest(req.user.id);
  } else if (guest_phone && guest_name) {
    db.run(
      `INSERT INTO users (role, name, phone, location) VALUES ('patient', ?, ?, ?)`,
      [guest_name, guest_phone, zone],
      function (err) {
        const guestId = err ? 2 : this.lastID;
        saveRequest(guestId);
      }
    );
  } else {
    saveRequest(2);
  }
});

app.get('/api/requests', (req, res) => {
  const { zone } = req.query;
  let query = `
    SELECT id, zone, service_type, shift_type, description, urgency, has_supplies, status, created_at 
    FROM requests 
    WHERE status = 'pending'
  `;
  const params = [];

  if (zone && zone !== 'Todas') {
    query += ` AND zone = ?`;
    params.push(zone);
  }

  query += ` ORDER BY created_at DESC LIMIT 50`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al consultar solicitudes.' });
    res.json(rows);
  });
});

app.get('/api/requests/my', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const isNurse = req.user.role === 'nurse';

  let query;
  if (isNurse) {
    query = `
      SELECT r.*, u.name as patient_name, u.phone as patient_phone 
      FROM requests r 
      JOIN users u ON r.patient_id = u.id 
      WHERE r.accepted_by = ? 
      ORDER BY r.accepted_at DESC
    `;
  } else {
    query = `
      SELECT r.*, n.name as nurse_name, n.phone as nurse_phone 
      FROM requests r 
      LEFT JOIN users n ON r.accepted_by = n.id 
      WHERE r.patient_id = ? 
      ORDER BY r.created_at DESC
    `;
  }

  db.all(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al consultar historial.' });
    res.json(rows);
  });
});

app.post('/api/requests/:id/accept', authMiddleware, (req, res) => {
  const requestId = req.params.id;
  const nurseId = req.user.id;

  if (req.user.role !== 'nurse' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Solo profesionales de enfermería pueden aceptar casos.' });
  }

  db.serialize(() => {
    db.run("BEGIN IMMEDIATE TRANSACTION", (err) => {
      if (err) return res.status(500).json({ error: 'Error iniciando transacción segura.' });

      db.get(`SELECT * FROM requests WHERE id = ?`, [requestId], (err, request) => {
        if (err || !request) {
          db.run("ROLLBACK");
          return res.status(404).json({ error: 'La solicitud no existe.' });
        }

        if (request.status !== 'pending') {
          db.run("ROLLBACK");
          return res.status(409).json({ error: 'Este caso ya fue tomado por otro colega.' });
        }

        db.get(`SELECT balance FROM tokens WHERE user_id = ?`, [nurseId], (err, tokenRow) => {
          const currentBal = tokenRow ? tokenRow.balance : 0;
          if (currentBal < 1) {
            db.run("ROLLBACK");
            return res.status(400).json({ 
              error: 'Saldo insuficiente. Necesitas al menos 1 token para desbloquear este caso.' 
            });
          }

          db.run(`UPDATE tokens SET balance = balance - 1 WHERE user_id = ?`, [nurseId], (err) => {
            if (err) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: 'Error al debitar el token.' });
            }

            db.run(
              `UPDATE requests SET status = 'accepted', accepted_by = ?, accepted_at = CURRENT_TIMESTAMP WHERE id = ?`,
              [nurseId, requestId],
              (err) => {
                if (err) {
                  db.run("ROLLBACK");
                  return res.status(500).json({ error: 'Error al adjudicar el caso.' });
                }

                db.run(
                  `INSERT INTO token_transactions (user_id, type, amount, description, reference_id) 
                   VALUES (?, 'spent_case', -1, 'Desbloqueo de caso médico #${requestId}', ?)`,
                  [nurseId, requestId],
                  (err) => {
                    if (err) {
                      db.run("ROLLBACK");
                      return res.status(500).json({ error: 'Error registrando historial de transacción.' });
                    }

                    db.run("COMMIT", (err) => {
                      if (err) {
                        db.run("ROLLBACK");
                        return res.status(500).json({ error: 'Error al confirmar la operación.' });
                      }

                      broadcastRequestRemoved(requestId);

                      db.get(
                        `SELECT u.phone, u.name, r.patient_address, r.description, r.service_type, r.has_supplies 
                         FROM requests r 
                         JOIN users u ON r.patient_id = u.id 
                         WHERE r.id = ?`,
                        [requestId],
                        (err, patientData) => {
                          res.json({
                            success: true,
                            message: 'Contacto desbloqueado exitosamente.',
                            phone: patientData ? patientData.phone : '0414-0000000',
                            patientName: patientData ? patientData.name : 'Paciente',
                            address: patientData ? patientData.patient_address : 'Consultar por WhatsApp',
                            service_type: patientData ? patientData.service_type : 'General',
                            has_supplies: patientData ? patientData.has_supplies : 1,
                            newBalance: currentBal - 1
                          });
                        }
                      );
                    });
                  }
                );
              }
            );
          });
        });
      });
    });
  });
});

// --- ENDPOINTS DE TOKENS Y CONFIGURACIÓN DINÁMICA ---

app.get('/api/tokens/balance', authMiddleware, (req, res) => {
  db.get(`SELECT balance FROM tokens WHERE user_id = ?`, [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Error en la base de datos' });
    res.json({ balance: row ? row.balance : 0 });
  });
});

app.get('/api/tokens/transactions', authMiddleware, (req, res) => {
  db.all(
    `SELECT * FROM token_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error al consultar historial.' });
      res.json(rows || []);
    }
  );
});

// Datos de pago dinámicos (leídos de la BD configurada por el dueño)
app.get('/api/config/payment-info', (req, res) => {
  db.getSetting('payment_info', (err, paymentInfo) => {
    db.getSetting('token_packages', (err, packages) => {
      res.json({
        pago_movil: paymentInfo?.pago_movil || {
          bank: '0102 - Banco de Venezuela',
          ci: 'V-20.123.456',
          phone: '0414-1234567',
          titular: 'CuidarVe Salud C.A.',
          rate_bcv: 42.50
        },
        binance: paymentInfo?.binance || {
          pay_id: '819283741',
          email: 'pagos@cuidarve.com'
        },
        zinli: paymentInfo?.zinli || {
          email: 'pagos@cuidarve.com'
        },
        packages: packages || [
          { id: 1, tokens: 3, price_usd: 3.0, label: 'Básico (3 casos)', popular: false },
          { id: 2, tokens: 7, price_usd: 6.0, label: 'Profesional (7 casos)', popular: true },
          { id: 3, tokens: 15, price_usd: 12.0, label: 'Clínico (15 casos)', popular: false }
        ]
      });
    });
  });
});

app.post('/api/tokens/recharge', authMiddleware, (req, res) => {
  const { amount_tokens, amount_bs, payment_method, reference, bank_origin } = req.body;
  const nurseId = req.user.id;

  if (!amount_tokens || !reference || !payment_method) {
    return res.status(400).json({ error: 'Monto, referencia y método de pago son requeridos.' });
  }

  const tokensToAdd = parseInt(amount_tokens, 10);
  const bs = parseFloat(amount_bs) || 0;

  db.serialize(() => {
    db.run(
      `INSERT INTO recharge_requests (user_id, amount_tokens, amount_bs, payment_method, reference, bank_origin, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
      [nurseId, tokensToAdd, bs, payment_method, reference, bank_origin || 'Desconocido'],
      function (err) {
        if (err) return res.status(500).json({ error: 'Error registrando reporte de pago.' });

        const newRechargeId = this.lastID;

        db.run(
          `INSERT INTO tokens (user_id, balance) VALUES (?, ?) 
           ON CONFLICT(user_id) DO UPDATE SET balance = balance + ?`,
          [nurseId, tokensToAdd, tokensToAdd],
          (err) => {
            if (err) return res.status(500).json({ error: 'Error actualizando saldo de tokens.' });

            db.run(
              `INSERT INTO token_transactions (user_id, type, amount, description, reference_id) 
               VALUES (?, 'recharge', ?, ?, ?)`,
              [nurseId, tokensToAdd, `Recarga de ${tokensToAdd} tokens vía ${payment_method.toUpperCase()}`, reference],
              (err) => {
                // Obtener datos del enfermero para la notificación en tiempo real al dueño
                db.get(`SELECT name, phone FROM users WHERE id = ?`, [nurseId], (err, nurseData) => {
                  const rechargeNotification = {
                    id: newRechargeId,
                    user_id: nurseId,
                    nurse_name: nurseData ? nurseData.name : 'Profesional de Enfermería',
                    nurse_phone: nurseData ? nurseData.phone : '',
                    amount_tokens: tokensToAdd,
                    amount_bs: bs,
                    payment_method: payment_method.toUpperCase(),
                    reference: reference,
                    bank_origin: bank_origin || 'Desconocido',
                    created_at: new Date().toISOString()
                  };

                  // 🚨 Emitir notificación en vivo por WebSocket al Dueño/Admin
                  broadcastToAdmin('NEW_TOKEN_RECHARGE', rechargeNotification);
                });

                db.get(`SELECT balance FROM tokens WHERE user_id = ?`, [nurseId], (err, row) => {
                  res.status(201).json({
                    success: true,
                    message: `¡Recarga procesada exitosamente! Se acreditaron ${tokensToAdd} tokens.`,
                    balance: row ? row.balance : tokensToAdd
                  });
                });
              }
            );
          }
        );
      }
    );
  });
});

// --- MÓDULO MAESTRO PARA EL DUEÑO DE LA APLICACIÓN (ADMIN) ---

// 1. Métricas Globales del Negocio
app.get('/api/admin/stats', adminMiddleware, (req, res) => {
  db.serialize(() => {
    const stats = {};

    db.get(`SELECT COUNT(*) as total_users FROM users`, (err, r) => {
      stats.total_users = r ? r.total_users : 0;
      
      db.get(`SELECT COUNT(*) as nurses FROM users WHERE role = 'nurse'`, (err, r) => {
        stats.total_nurses = r ? r.nurses : 0;

        db.get(`SELECT COUNT(*) as patients FROM users WHERE role = 'patient'`, (err, r) => {
          stats.total_patients = r ? r.patients : 0;

          db.get(`SELECT COUNT(*) as total_requests, SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_requests FROM requests`, (err, r) => {
            stats.total_requests = r ? r.total_requests : 0;
            stats.accepted_requests = r ? r.accepted_requests : 0;

            db.get(`SELECT SUM(amount_tokens) as tokens_sold, SUM(amount_bs) as revenue_bs FROM recharge_requests WHERE status = 'approved'`, (err, r) => {
              stats.tokens_sold = r ? (r.tokens_sold || 0) : 0;
              stats.revenue_bs = r ? (r.revenue_bs || 0) : 0;

              res.json(stats);
            });
          });
        });
      });
    });
  });
});

// 2. Obtener configuración maestra editable
app.get('/api/admin/config', adminMiddleware, (req, res) => {
  db.getSetting('payment_info', (err, paymentInfo) => {
    db.getSetting('token_packages', (err, packages) => {
      res.json({
        payment_info: paymentInfo,
        token_packages: packages
      });
    });
  });
});

// 3. Modificar configuración maestra (Métodos de pago, Tasa BCV, Precios de tokens)
app.put('/api/admin/config', adminMiddleware, (req, res) => {
  const { payment_info, token_packages } = req.body;

  db.serialize(() => {
    if (payment_info) {
      db.setSetting('payment_info', payment_info, () => {});
    }
    if (token_packages) {
      db.setSetting('token_packages', token_packages, () => {});
    }

    res.json({
      success: true,
      message: 'Configuración maestra del sistema actualizada correctamente.'
    });
  });
});

// 4. Listado de recargas y pagos reportados
app.get('/api/admin/recharges', adminMiddleware, (req, res) => {
  db.all(
    `SELECT r.*, u.name as nurse_name, u.phone as nurse_phone 
     FROM recharge_requests r 
     JOIN users u ON r.user_id = u.id 
     ORDER BY r.created_at DESC LIMIT 50`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error consultando recargas' });
      res.json(rows || []);
    }
  );
});

// 5. Listado de usuarios del sistema
app.get('/api/admin/users', adminMiddleware, (req, res) => {
  db.all(
    `SELECT u.id, u.role, u.name, u.email, u.phone, u.location, u.rating, u.reviews, u.mpps_license, u.created_at, t.balance 
     FROM users u 
     LEFT JOIN tokens t ON u.id = t.user_id 
     ORDER BY u.id DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error consultando usuarios' });
      res.json(rows || []);
    }
  );
});

// 6. Validar o revocar credencial MPPS de un enfermero
app.put('/api/admin/users/:id/verify', adminMiddleware, (req, res) => {
  const userId = req.params.id;
  const { mpps_license } = req.body;

  db.run(`UPDATE users SET mpps_license = ? WHERE id = ?`, [mpps_license, userId], function(err) {
    if (err) return res.status(500).json({ error: 'Error actualizando credencial' });
    res.json({ success: true, message: 'Estado de colegiatura actualizado.' });
  });
});

// --- MÓDULO BCV: CONSULTA Y SINCRONIZACIÓN EN VIVO ---

// 1. Consulta pública de la tasa oficial vigente
app.get('/api/bcv/rate', (req, res) => {
  db.getSetting('payment_info', (err, pi) => {
    res.json({
      rate: pi?.pago_movil?.rate_bcv || 896.12,
      official_date: pi?.bcv_official_date || null,
      last_synced: pi?.bcv_last_synced || null,
      source: pi?.bcv_source || 'Banco Central de Venezuela (BCV Oficial)'
    });
  });
});

// 2. Forzar sincronización instantánea con el BCV (Exclusivo Dueño / Admin)
app.post('/api/admin/bcv/sync', adminMiddleware, async (req, res) => {
  try {
    const updated = await syncBcvWithDatabase();
    if (updated) {
      res.json({
        success: true,
        message: `¡Tasa oficial del BCV sincronizada!: Bs. ${updated.pago_movil.rate_bcv} / USD`,
        rate: updated.pago_movil.rate_bcv,
        official_date: updated.bcv_official_date,
        last_synced: updated.bcv_last_synced
      });
    } else {
      res.status(502).json({ 
        error: 'No se pudo contactar temporalmente al servicio del BCV. Se mantiene la última tasa guardada.' 
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error al sincronizar con el BCV.' });
  }
});

// --- MODO DEMO: REINICIAR DATOS A DEMO LIMPIO ---
app.post('/api/demo/reset', (req, res) => {
  db.resetDemoData((err) => {
    if (err) return res.status(500).json({ error: 'Error reiniciando datos demo' });
    res.json({
      success: true,
      message: 'Datos de prueba reiniciados con éxito: Solicitudes médicas de prueba activas y saldo restaurado.'
    });
  });
});

// Servir frontend compilado en producción (dist)
const distPath = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend CuidarVe ejecutándose en http://0.0.0.0:${PORT}`);
  // Iniciar sincronización periódica con el Banco Central de Venezuela
  initBcvAutoSync(60);
});
