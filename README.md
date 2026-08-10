# Sovereign Fiscal · AI Business Loan Analyzer

Aplicación full-stack para preanalizar solicitudes de préstamos empresariales. El backend conserva cada importe junto con su divisa ISO 4217, calcula métricas financieras determinísticas y solicita una interpretación estructurada a Anthropic Claude o, como alternativa accesible, a GPT-OSS 20B mediante Groq. La solicitud y el análisis quedan almacenados en PostgreSQL y se exponen a un frontend institucional construido con React.

El resultado apoya la revisión de un analista humano: la aplicación no aprueba ni rechaza préstamos.

## Estructura

```text
.
├── backend/   API REST, autenticación, PostgreSQL, Sequelize, Claude y Groq
├── frontend/  React, TypeScript, Vite, Tailwind CSS, Lucide y Motion
└── README.md  Documentación unificada
```

## Stack

### Backend

- Node.js 20+ y CommonJS
- Express 5
- PostgreSQL 16
- Sequelize y Sequelize CLI
- JWT y bcrypt
- SDK oficial de Anthropic con Claude
- Groq SDK con `openai/gpt-oss-20b` como fallback de configuración
- Zod, Helmet, CORS y rate limiting

### Frontend

- React y TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Motion for React
- React Router

## Inicio rápido

Requisitos: Node.js 20.19+, npm y PostgreSQL.

### 1. Backend

```bash
cd backend
npm install
```

Copia `backend/.env.example` a `backend/.env` y configura:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgres://postgres:<PASSWORD>@localhost:5432/ai_business_loan_analyzer
DATABASE_SSL=false
CORS_ORIGIN=http://127.0.0.1:5173

JWT_SECRET=<SECRETO-LARGO-Y-ALEATORIO>
JWT_EXPIRES_IN=8h

CLAUDE_API_KEY=
CLAUDE_MODEL=claude-sonnet-5

GROQ_API_KEY=<GROQ-API-KEY>
GROQ_MODEL=openai/gpt-oss-20b
GROQ_TEMPERATURE=0.1
GROQ_TIMEOUT_MS=20000
```

Selección del proveedor:

- Si `CLAUDE_API_KEY` y `CLAUDE_MODEL` no tienen valores vacíos, el backend utiliza Anthropic Claude.
- Si falta cualquiera de esas dos variables, utiliza Groq con `GROQ_API_KEY` y `GROQ_MODEL`.
- El mismo proveedor realiza la búsqueda web de cotizaciones. Claude usa su herramienta de búsqueda; Groq usa la búsqueda nativa de `GROQ_MODEL` y una segunda llamada estructurada al mismo modelo para normalizar el resultado.
- La organización de Anthropic debe tener habilitada la búsqueda web en Claude Console. Si está deshabilitada, el endpoint de cotización devuelve el error del proveedor y no cambia silenciosamente a Groq.
- Una clave de Claude configurada pero inválida produce un error explícito; no se oculta el problema cambiando de proveedor durante la misma petición.
- Nunca expongas las claves LLM mediante variables `VITE_*`: ambas permanecen exclusivamente en el backend.

Prepara PostgreSQL y levanta la API:

```bash
npm run db:create
npm run db:reset
npm run dev
```

La API queda disponible en `http://127.0.0.1:3000/api`.

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
```

Copia `frontend/.env.example` a `frontend/.env` si necesitas cambiar la URL de la API:

```env
VITE_API_BASE_URL=http://127.0.0.1:3000/api
VITE_DEFAULT_OPERATING_CURRENCY=ARS
VITE_DEFAULT_FINANCING_CURRENCY=USD
```

Las dos últimas variables sólo controlan las selecciones iniciales del formulario. No fijan la moneda en el backend: el usuario puede elegir una divisa diferente para cada importe.

Inicia Vite:

```bash
npm run dev
```

Abre `http://127.0.0.1:5173`.

## Usuario demo

Después de ejecutar el seeder:

```json
{
  "email": "demo@businessloan.local",
  "password": "DemoPass123!"
}
```

El frontend también permite crear una cuenta desde `/register`, sin autenticación mediante Google o Apple.

## Vistas del frontend

| Ruta           | Acceso  | Función                                                               |
| -------------- | ------- | --------------------------------------------------------------------- |
| `/`            | Público | Landing basada en el diseño Fiscal Precision                          |
| `/login`       | Público | Inicio de sesión                                                      |
| `/register`    | Público | Registro por nombre, correo y contraseña                              |
| `/app`         | JWT     | Overview conectado al último análisis almacenado                      |
| `/app/analyze` | JWT     | Crear, analizar y almacenar una solicitud                             |
| `/app/history` | JWT     | Explorar el historial paginado del usuario y abrir cualquier análisis |
| `/app/lookup`  | JWT     | Recuperar una solicitud y análisis por UUID                           |

El dashboard contiene Overview, Analizar solicitud, Historial y Consultar análisis. Tanto las tarjetas del historial como el último análisis del Overview redirigen a `/app/lookup?id=<UUID>` para reutilizar el mismo flujo de consulta. No incluye las vistas Analytics o Market del concepto original.

## Endpoints del backend

URL base: `http://127.0.0.1:3000/api`

| Método | Endpoint                                         | Autenticación | Función                                          |
| ------ | ------------------------------------------------ | ------------- | ------------------------------------------------ |
| `GET`  | `/health`                                        | No            | Estado del servicio                              |
| `POST` | `/auth/register`                                 | No            | Crear cuenta y devolver JWT                      |
| `POST` | `/auth/login`                                    | No            | Iniciar sesión y devolver JWT                    |
| `GET`  | `/currencies`                                    | Bearer JWT    | Catálogo ISO 4217 disponible para los selectores |
| `POST` | `/exchange-rates/quote`                          | Bearer JWT    | Buscar y firmar cotizaciones con USD como base   |
| `POST` | `/loan-applications/analyze`                     | Bearer JWT    | Analizar y almacenar una solicitud               |
| `GET`  | `/loan-applications/latest`                      | Bearer JWT    | Obtener el último análisis del usuario           |
| `GET`  | `/loan-applications/history?limit=12&cursor=...` | Bearer JWT    | Historial paginado del usuario autenticado       |
| `GET`  | `/loan-applications/:id`                         | Bearer JWT    | Recuperar una solicitud por UUID                 |

### Buscar cotizaciones y crear un análisis

El frontend deriva las monedas utilizadas en los cinco importes. Por cada moneda distinta de USD solicita una única tasa con `USD` como base:

```json
{
  "targetCurrencyCodes": ["ARS", "EUR"]
}
```

`POST /exchange-rates/quote` devuelve las tasas, su fecha, fuente y proveedor, además de un `quoteToken` firmado y vinculado al usuario. El navegador muestra esos datos como sólo lectura. El token evita que una tasa sea alterada antes de enviarla al análisis y vence después de una hora.

Las cotizaciones confirmadas se guardan en PostgreSQL por par `USD → moneda`. Una tasa de hasta 60 minutos se reutiliza sin llamar nuevamente al proveedor; si Claude o Groq responde `429`, el backend puede reutilizar una tasa trazable de hasta 24 horas y la identifica con `cacheStatus: "rate-limit-fallback"`. Si no existe una tasa segura, la API conserva el `retryAfter` del proveedor y la interfaz muestra una cuenta regresiva, reintenta automáticamente y mantiene deshabilitado el análisis para no mezclar monedas sin conversión válida.

```json
{
  "business": {
    "name": "Café Norte SAS",
    "industry": "Alimentos y bebidas",
    "yearsInBusiness": 5
  },
  "financialData": {
    "monthlyRevenue": 85000000,
    "monthlyRevenueCurrencyCode": "ARS",
    "monthlyExpenses": 57000000,
    "monthlyExpensesCurrencyCode": "ARS",
    "existingDebt": 22000,
    "existingDebtCurrencyCode": "USD",
    "monthlyDebtPayment": 2000,
    "monthlyDebtPaymentCurrencyCode": "USD",
    "requestedAmount": 110000,
    "requestedAmountCurrencyCode": "USD",
    "loanPurpose": "Comprar equipamiento productivo y ampliar la distribución mayorista",
    "exchangeRateQuoteToken": "<TOKEN-DEVUELTO-POR-EXCHANGE-RATES-QUOTE>"
  }
}
```

USD es siempre la moneda de valuación. Una tasa `USD → ARS = 1350` significa que `1 USD = 1350 ARS`; por tanto, un importe en ARS se divide por `1350` para normalizarlo a USD. El backend calcula:

- Flujo de caja mensual neto.
- Ratio de gastos sobre ingresos.
- Monto solicitado sobre ingresos mensuales normalizados.
- Deuda existente sobre ingresos mensuales normalizados.
- Pago mensual de deuda sobre ingresos mensuales normalizados.

El LLM no realiza las conversiones ni los ratios: recibe los importes originales, las cotizaciones con procedencia y las métricas ya calculadas. La respuesta utiliza JSON Schema estricto y contiene salud financiera, nivel de riesgo, resumen, factores positivos, riesgos y preguntas de seguimiento. El prompt exige español y Zod aplica una segunda validación, incluida la comprobación de idioma, antes de persistirla. Si el modelo responde en otro idioma, el backend reintenta una vez y nunca entrega esa respuesta al cliente.

El historial acepta `limit` entre 1 y 50 y utiliza un cursor opaco para paginación estable. Cada registro se filtra directamente por el `userId` extraído del JWT.

## Modelo de datos

```text
User 1 ── N Business 1 ── N LoanApplication 1 ── 1 LoanAnalysis
  └────── N AnalysisHistory N ──────────────────── 1 LoanApplication
Currency 1 ── N LoanApplication por cada campo monetario
Currency 1 ── N LoanApplicationExchangeRate N ── 1 LoanApplication
Currency 1 ── N ExchangeRateQuote (caché global USD → moneda)
```

- `User`: propietario de negocios y solicitudes.
- `Business`: identidad básica del negocio.
- `Currency`: catálogo de 162 códigos ISO conocidos por Node.js; `code` es su clave primaria funcional.
- `LoanApplication`: fotografía financiera inmutable, estado del proceso y cinco FKs independientes hacia `Currencies.code`.
- `LoanApplicationExchangeRate`: cotización `USD → moneda`, tasa decimal, fecha efectiva, fuente HTTPS, proveedor, modelo y momento de consulta.
- `ExchangeRateQuote`: última cotización global por par `USD → moneda`; evita repetir búsquedas y permite una recuperación controlada ante límites temporales del proveedor.
- `LoanAnalysis`: respuesta normalizada del proveedor seleccionado y métricas del backend.
- `AnalysisHistory`: índice relacional del historial, asociado al usuario autenticado y a una solicitud única.

Los campos `monthlyRevenueCurrencyCode`, `monthlyExpensesCurrencyCode`, `existingDebtCurrencyCode`, `monthlyDebtPaymentCurrencyCode` y `requestedAmountCurrencyCode` referencian `Currencies.code`. Los importes utilizan `DECIMAL(19,4)` y las tasas `DECIMAL(24,10)` para evitar errores de punto flotante en la persistencia. Arrays y métricas utilizan PostgreSQL `JSONB`.

## Scripts del backend

Ejecutar desde `backend/`:

| Script                    | Función                                           |
| ------------------------- | ------------------------------------------------- |
| `npm start`               | Iniciar la API                                    |
| `npm run dev`             | Iniciar con Nodemon                               |
| `npm run db:create`       | Crear la base configurada                         |
| `npm run db:drop`         | Eliminar la base configurada                      |
| `npm run db:migrate`      | Ejecutar migraciones pendientes                   |
| `npm run db:migrate:undo` | Revertir la última migración                      |
| `npm run db:seed`         | Ejecutar todos los seeders                        |
| `npm run db:seed:undo`    | Revertir todos los seeders                        |
| `npm run db:reset`        | Revertir migraciones, migrar y sembrar nuevamente |
| `npm test`                | Ejecutar pruebas                                  |
| `npm run lint`            | Ejecutar ESLint                                   |
| `npm run format:check`    | Verificar Prettier                                |

`db:drop` y `db:reset` son destructivos y deben utilizarse únicamente con bases de desarrollo descartables.

## Scripts del frontend

Ejecutar desde `frontend/`:

| Script              | Función                                     |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Servidor Vite en el puerto 5173             |
| `npm run build`     | Type-check y build de producción            |
| `npm run typecheck` | Verificación TypeScript sin emitir archivos |
| `npm run preview`   | Previsualizar el build en el puerto 4173    |

## Diseño

La interfaz replica la referencia **Fiscal Precision** del ZIP proporcionado:

- Fondo Cool White y capas tonales de bajo contraste.
- Deep Navy para estructura y navegación.
- Emerald Success usado de forma puntual.
- Tipografía Inter y cifras tabulares.
- Cards con borde fino, radio de 8px y sombras ambientales mínimas.
- Dashboard con sidebar fijo de 280px.
- Animaciones de entrada, transiciones y microinteracciones mediante Motion.
- Iconografía consistente mediante Lucide React.
- Diez temas financieros preconfigurados en Tailwind: Soberano, Océano, Bosque, Grafito, Borgoña, Índigo, Cobre, Ártico, Medianoche y Ciruela.

El selector de tema se abre desde el icono de configuración situado junto al perfil del sidebar. La elección se aplica antes de montar React para evitar destellos y se persiste en `localStorage` bajo `sovereign-fiscal:theme`; sólo se guarda el nombre del tema, nunca los valores hexadecimales.

La interfaz es responsive y respeta `prefers-reduced-motion`.

## Calidad

```bash
cd backend
npm test
npm run lint
npm run format:check

cd ../frontend
npm run typecheck
npm run build
```

## Decisiones técnicas

- Ninguna transacción permanece abierta mientras se espera a Claude o Groq.
- Las operaciones matemáticas son determinísticas y no dependen del LLM.
- USD es la única moneda base: se consulta una tasa directa por cada moneda distinta y los importes se normalizan antes de calcular ratios.
- Las cotizaciones se validan con Zod, se vinculan al usuario mediante un JWT firmado y se almacenan con procedencia. Se reutilizan 15 minutos en memoria, 60 minutos desde PostgreSQL y, únicamente ante un `AI_RATE_LIMIT`, hasta 24 horas como recuperación explícitamente identificada.
- El código ISO es el identificador persistido; los símbolos monetarios nunca se usan como claves porque no son únicos.
- Las FKs de moneda están indexadas y usan `ON UPDATE CASCADE` y `ON DELETE RESTRICT`.
- Los prompts y respuestas crudas no se almacenan; sólo se persiste la salida normalizada.
- Los endpoints `latest`, `history` y `:id` filtran por el propietario autenticado.
- La creación de `LoanAnalysis` y `AnalysisHistory` se completa en una misma transacción.
- El token se guarda localmente en el navegador para esta demostración; una aplicación productiva debería evaluar cookies `httpOnly` y protección CSRF.
- El registro aplica hash bcrypt y una política mínima de contraseña.
