const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { hashPassword } = require('./auth');

const dbPath = path.resolve(__dirname, 'cuidarve.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // 1. Tabla de Usuarios
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL, -- 'patient', 'nurse', o 'admin'
        name TEXT NOT NULL,
        email TEXT,
        password_hash TEXT,
        phone TEXT,
        location TEXT,
        rating REAL DEFAULT 5.0,
        reviews INTEGER DEFAULT 0,
        avatar TEXT,
        mpps_license TEXT, -- Colegiatura o MPPS del profesional
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Tabla de Tokens
    db.run(`
      CREATE TABLE IF NOT EXISTS tokens (
        user_id INTEGER PRIMARY KEY,
        balance INTEGER DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // 3. Tabla de Solicitudes (Requests)
    db.run(`
      CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        zone TEXT NOT NULL,
        service_type TEXT DEFAULT 'General',
        shift_type TEXT DEFAULT 'Puntual',
        description TEXT NOT NULL,
        patient_address TEXT,
        has_supplies INTEGER DEFAULT 1,
        urgency TEXT DEFAULT 'Normal',
        status TEXT DEFAULT 'pending', -- pending, accepted, completed, cancelled
        accepted_by INTEGER,
        accepted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(patient_id) REFERENCES users(id),
        FOREIGN KEY(accepted_by) REFERENCES users(id)
      )
    `);

    // 4. Historial de transacciones de tokens
    db.run(`
      CREATE TABLE IF NOT EXISTS token_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- 'welcome', 'spent_case', 'recharge', 'refund'
        amount INTEGER NOT NULL,
        description TEXT,
        reference_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // 5. Solicitudes de recarga (Pago Móvil / Binance)
    db.run(`
      CREATE TABLE IF NOT EXISTS recharge_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount_tokens INTEGER NOT NULL,
        amount_bs REAL NOT NULL,
        payment_method TEXT NOT NULL, -- 'pago_movil', 'binance', 'zinli'
        reference TEXT NOT NULL,
        bank_origin TEXT,
        status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // 6. Tabla de Configuración Maestra del Sistema (Modificable solo por el Dueño)
    db.run(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Migraciones automáticas seguras para bases de datos existentes
    applyMigrations();

    // Comprobar e insertar datos de prueba y usuario maestro
    ensureAdminAndDefaults();
  });
}

function applyMigrations() {
  const userColumns = [
    { name: 'email', def: 'TEXT' },
    { name: 'password_hash', def: 'TEXT' },
    { name: 'mpps_license', def: 'TEXT' },
    { name: 'created_at', def: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
  ];

  userColumns.forEach(col => {
    db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`, () => {});
  });

  const requestColumns = [
    { name: 'service_type', def: "TEXT DEFAULT 'General'" },
    { name: 'shift_type', def: "TEXT DEFAULT 'Puntual'" },
    { name: 'patient_address', def: 'TEXT' },
    { name: 'has_supplies', def: 'INTEGER DEFAULT 1' },
    { name: 'accepted_by', def: 'INTEGER' },
    { name: 'accepted_at', def: 'DATETIME' }
  ];

  requestColumns.forEach(col => {
    db.run(`ALTER TABLE requests ADD COLUMN ${col.name} ${col.def}`, () => {});
  });
}

function ensureAdminAndDefaults() {
  const defaultHash = hashPassword('123456');
  const adminHash = hashPassword('admin123');

  // 1. Asegurar Cuenta Maestra del Dueño (Admin)
  db.get(`SELECT id FROM users WHERE email = 'admin@cuidarve.com' OR role = 'admin'`, (err, adminUser) => {
    if (!adminUser) {
      db.run(`
        INSERT INTO users (role, name, email, password_hash, phone, location, avatar)
        VALUES ('admin', 'Eduardo (Dueño Master)', 'admin@cuidarve.com', ?, '0414-0000000', 'Gran Caracas', '👑')
      `, [adminHash]);
    } else {
      // Asegurar que mantenga el hash y rol admin
      db.run(`UPDATE users SET role = 'admin', password_hash = ? WHERE id = ?`, [adminHash, adminUser.id]);
    }
  });

  // 2. Asegurar cuentas demo estándar (María y Juan)
  db.get(`SELECT id FROM users WHERE email = 'maria@cuidarve.com'`, (err, maria) => {
    if (!maria) {
      db.run(`
        INSERT INTO users (role, name, email, password_hash, phone, location, rating, reviews, avatar, mpps_license) 
        VALUES ('nurse', 'Lic. María González', 'maria@cuidarve.com', ?, '0414-1234567', 'Altos Mirandinos', 4.9, 24, 'MG', 'MPPS-104928')
      `, [defaultHash], function(err) {
        if (!err) {
          const nurseId = this.lastID;
          db.run(`INSERT INTO tokens (user_id, balance) VALUES (?, 5)`, [nurseId]);
          db.run(`INSERT INTO token_transactions (user_id, type, amount, description) VALUES (?, 'welcome', 5, 'Tokens de bienvenida')`, [nurseId]);
        }
      });
    }
  });

  db.get(`SELECT id FROM users WHERE email = 'juan@cuidarve.com'`, (err, juan) => {
    if (!juan) {
      db.run(`
        INSERT INTO users (role, name, email, password_hash, phone, location) 
        VALUES ('patient', 'Juan Pérez', 'juan@cuidarve.com', ?, '0412-9876543', 'Altos Mirandinos')
      `, [defaultHash]);
    }
  });

  // 3. Inicializar configuración dinámica de Métodos de Pago
  db.get(`SELECT value FROM app_settings WHERE key = 'payment_info'`, (err, row) => {
    if (!row) {
      const defaultPaymentInfo = {
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
      };
      db.run(`INSERT INTO app_settings (key, value) VALUES ('payment_info', ?)`, [JSON.stringify(defaultPaymentInfo)]);
    }
  });

  // 4. Inicializar configuración dinámica de Paquetes de Tokens
  db.get(`SELECT value FROM app_settings WHERE key = 'token_packages'`, (err, row) => {
    if (!row) {
      const defaultPackages = [
        { id: 1, tokens: 3, price_usd: 3.0, label: 'Básico (3 casos)', popular: false },
        { id: 2, tokens: 7, price_usd: 6.0, label: 'Profesional (7 casos)', popular: true },
        { id: 3, tokens: 15, price_usd: 12.0, label: 'Clínico (15 casos)', popular: false }
      ];
      db.run(`INSERT INTO app_settings (key, value) VALUES ('token_packages', ?)`, [JSON.stringify(defaultPackages)]);
    }
  });
}

// Métodos de utilidad para configuración
db.getSetting = function(key, callback) {
  db.get(`SELECT value FROM app_settings WHERE key = ?`, [key], (err, row) => {
    if (err) return callback(err, null);
    if (!row) return callback(null, null);
    try {
      callback(null, JSON.parse(row.value));
    } catch(e) {
      callback(null, row.value);
    }
  });
};

db.setSetting = function(key, value, callback) {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  db.run(
    `INSERT INTO app_settings (key, value) VALUES (?, ?) 
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, serialized],
    callback
  );
};

// Función para reiniciar datos a modo demostración impecable
db.resetDemoData = function(callback) {
  db.serialize(() => {
    // 1. Limpiar solicitudes viejas y sembrar 3 solicitudes médicas realistas
    db.run(`DELETE FROM requests WHERE id > 0`);
    db.run(`
      INSERT INTO requests (patient_id, zone, service_type, shift_type, description, patient_address, has_supplies, urgency, status)
      VALUES 
      (2, 'Altos Mirandinos', 'Curas de Escaras y Heridas', 'Visita Puntual (1-2 horas)', 'Paciente de 81 años con escaras grado II en zona sacra, requiere cura estéril y cambio de apósito.', 'San Antonio de los Altos, Urb. Las Minas, Edif. Roble, Apto 4-B', 1, 'Alta', 'pending'),
      (2, 'Altos Mirandinos', 'Inyectología / Vía Endovenosa', 'Visita Puntual (1-2 horas)', 'Tratamiento de Ceftriaxona 1g endovenoso cada 12 horas por 5 días para cuadro respiratorio.', 'Los Teques, Res. El Encanto, Torre 3', 1, 'Inmediata', 'pending'),
      (2, 'Gran Caracas', 'Cuidado Adulto Mayor', 'Turno Diurno (12 horas)', 'Señora de 78 años con movilidad reducida post-ACV, requiere aseo en cama, control de signos y administración de tratamiento oral.', 'Chacao, Av. Francisco de Miranda, Edif. Humboldt', 0, 'Normal', 'pending')
    `);

    // 2. Asegurar balance de la Lic. María a 5 tokens
    db.run(`UPDATE tokens SET balance = 5 WHERE user_id = 1`);

    if (callback) callback(null);
  });
};

module.exports = db;
