# CuidarVe - Base de Conocimiento y Arquitectura

## Descripción General
CuidarVe es una plataforma web para conectar pacientes que requieren servicios médicos y de enfermería domiciliaria con profesionales certificados (matrícula MPPS / colegiados) en la Gran Caracas y Altos Mirandinos. Los pacientes publican solicitudes clínicas estructuradas y los profesionales reciben alertas en tiempo real vía WebSockets filtradas por zona geográfica, desbloqueando el contacto directo vía WhatsApp mediante un sistema de tokens.

---

## Arquitectura del Proyecto

### Backend (`/backend`)
- **Entorno:** Node.js, Express.
- **Base de Datos:** SQLite (`cuidarve.db`), administrada mediante `database.js` con migraciones automáticas.
- **Seguridad y Criptografía:** Módulo nativo `auth.js` (`crypto.scryptSync` para contraseñas y firmas HMAC-SHA256 para JWT sin dependencias externas).
- **Integración Cambiaria (BCV):** Módulo `bcvService.js` conectado en tiempo real al Banco Central de Venezuela para obtener la tasa oficial del dólar automáticamente y persistirla en la base de datos con actualización horaria.
- **Comunicación en Tiempo Real:** `ws` (WebSockets) con arquitectura de suscripción por canales (`SUBSCRIBE` con filtrado por rol y zona en el servidor).
- **Esquema de Base de Datos:**
  - `users`: Pacientes, enfermeros y administrador (`id`, `role`, `name`, `email`, `password_hash`, `phone`, `location`, `rating`, `reviews`, `avatar`, `mpps_license`).
  - `tokens`: Saldo actual de cada enfermero.
  - `token_transactions`: Auditoría completa de movimientos de saldo (`welcome`, `spent_case`, `recharge`, `refund`).
  - `requests`: Solicitudes médicas (`patient_id`, `zone`, `service_type`, `shift_type`, `description`, `patient_address`, `has_supplies`, `urgency`, `status`, `accepted_by`, `accepted_at`).
  - `recharge_requests`: Solicitudes de recarga vía Pago Móvil (Bs.) o Binance Pay (USDT).
  - `app_settings`: Configuración maestra persistente (métodos de pago dinámicos, tasa BCV y paquetes de tokens).
- **Endpoints Principales:**
  - `POST /api/auth/register`: Registro de paciente o enfermero con hash seguro de contraseñas.
  - `POST /api/auth/login`: Autenticación por correo/teléfono y contraseña, retorna JWT y balance.
  - `GET /api/auth/me`: Retorna perfil actual y saldo mediante Bearer token.
  - `POST /api/requests`: Crea solicitud médica y emite `NEW_REQUEST` únicamente a los enfermeros de esa zona.
  - `GET /api/requests`: Lista solicitudes pendientes sanitizadas (sin exponer teléfonos ni direcciones privadas a no autorizados).
  - `POST /api/requests/:id/accept`: **Transacción atómica**. Verifica que el caso siga pendiente, descuenta 1 token, asigna `accepted_by`, y retorna los datos de contacto y dirección del paciente.
  - `GET /api/tokens/balance`: Consulta de saldo.
  - `POST /api/tokens/recharge`: Reporte de Pago Móvil / Binance y acreditación de saldo. Emite evento WebSocket `NEW_TOKEN_RECHARGE` en tiempo real al administrador con sonido y alerta en vivo.
  - `GET /api/config/payment-info`: Datos bancarios venezolanos dinámicos (leídos de `app_settings`).
  - `GET /api/bcv/rate`: Consulta de la tasa oficial vigente reportada por el BCV.
  - `POST /api/admin/bcv/sync`: Sincronización forzada con el BCV para el dueño.
  - `GET /api/admin/stats`: Métricas de negocio (usuarios, casos, tokens vendidos, ingresos en Bs.).
  - `GET /api/admin/config`: Lectura de configuración para el dueño.
  - `PUT /api/admin/config`: Modificación de datos de Pago Móvil, Binance, Tasa BCV y precios de tokens.
  - `GET /api/admin/recharges`: Auditoría de pagos y recargas reportadas.
  - `GET /api/admin/users`: Directorio de usuarios y estado de colegiatura MPPS.
  - `PUT /api/admin/users/:id/verify`: Validación o revocación de colegiatura MPPS.
  - `POST /api/demo/reset`: Reinicio de solicitudes y tokens para demostración.

---

### Frontend (`/frontend`)
- **Entorno:** React 19, Vite.
- **Estilos:** Tailwind CSS 3 y CSS Animations.
- **Iconografía y Notificaciones:** `lucide-react` y `react-hot-toast`.
- **Estructura Modular (`/src`):**
  - `context/AuthContext.jsx`: Manejo de autenticación, JWT, persistencia en `localStorage`, saldo de tokens y control del Modo Demo.
  - `services/api.js`: Cliente HTTP centralizado con inyección automática de Bearer Token.
  - `utils/formatters.js`: Normalizador de teléfonos venezolanos para WhatsApp (`58414...`) y formateo de moneda en Bolívares (`Bs.`).
  - `components/Navbar.jsx`: Barra superior con acceso al Panel del Dueño (solo visible para admin), saldo de tokens, estado de guardia y toggle de demo.
  - `components/DemoSwitcher.jsx`: Barra flotante interactiva para alternar instantáneamente entre Dueño Master, Enfermera y Paciente, además de reiniciar casos de prueba.
  - `components/AdminDashboard.jsx`: **Panel exclusivo del dueño** para configurar pagos, tasa BCV, precios de tokens, ver ingresos facturados y auditar usuarios.
  - `components/AuthModal.jsx`: Modal de login y registro con soporte de matrícula MPPS y accesos demo rápidos para los tres roles.
  - `components/TokenStoreModal.jsx`: Tienda de recarga de tokens con Pago Móvil y Binance Pay para Venezuela.
  - `pages/Home.jsx`: Landing orientada a confianza y selección de roles.
  - `pages/PatientView.jsx`: Ficha médica estructurada (servicio, turno, material médico propio vs. enfermero) y matching con especialistas.
  - `pages/NurseDashboard.jsx`: Panel clínico en vivo con WebSockets por zona, alertas de urgencia y botón directo a WhatsApp.

---

## Cuentas de Acceso Predeterminadas
- **👑 Dueño / Administrador Master:** `admin@cuidarve.com` / `admin123`
- **👩‍⚕️ Profesional de Enfermería:** `maria@cuidarve.com` / `123456`
- **👤 Paciente / Familiar:** `juan@cuidarve.com` / `123456`

---

## Comandos Útiles de Desarrollo
- **Iniciar Backend:** Desde `/backend` ejecutar `npm run dev` (corre en `http://localhost:5001`).
- **Iniciar Frontend:** Desde `/frontend` ejecutar `npm run dev` (corre en `http://localhost:5173`).
- **Compilar Frontend para Producción:** Desde `/frontend` ejecutar `npm run build`.
