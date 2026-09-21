/**
 * Spanish integration setup guides. Generated from the guide source —
 * see `./index.ts` for how a locale is picked. Keep the step count,
 * links and `lastReviewed` in lockstep with `en.ts`; the parity test
 * in `tests/` compares them.
 */
import type { Guide } from './types.js';

export const GUIDES_ES: Record<string, Guide> = {
  openai: {
    intro:
      'Ejecuta un prompt personalizado por URL a través de la API de OpenAI — análisis de contenido, ideas de títulos, resúmenes. El uso se factura a tu propia cuenta de OpenAI; FreeCrawl es un intermediario gratuito, las llamadas a la API salen de tu bolsillo.',
    prereqs: [
      'Cuenta de OpenAI (regístrate gratis en https://platform.openai.com).',
      'Método de pago válido — OpenAI exige un saldo mínimo de 5 $ antes de que las claves funcionen.',
    ],
    steps: [
      {
        title: 'Inicia sesión en platform.openai.com',
        detail: 'Usa tu cuenta de OpenAI. Si aún no tienes una, "Sign up".',
        link: {
          label: 'platform.openai.com',
          url: 'https://platform.openai.com',
        },
      },
      {
        title: 'Haz clic en "API keys" en la barra lateral izquierda',
        detail:
          'Elemento de menú con icono de llave a la izquierda. También puedes ir directamente a la URL.',
        link: {
          label: 'Página de API keys',
          url: 'https://platform.openai.com/api-keys',
        },
      },
      {
        title: 'Haz clic en "+ Create new secret key" (arriba a la derecha)',
        detail:
          'En el diálogo:\n• Name: "FreeCrawl SEO Tool" (cualquier etiqueta recordatoria)\n• Project: Default project o el que prefieras\n• Permissions: All (lo más fácil; los ámbitos restringidos también funcionan)\ndespués "Create secret key".',
      },
      {
        title: 'COPIA la clave — no se volverá a mostrar',
        detail:
          'La clave empieza por `sk-...`. Si no la copias ahora la perderás para siempre (tendrías que crear una nueva). Guárdala en un gestor de contraseñas — no la dejes en una pestaña del navegador.',
      },
      {
        title: 'Pégala en el campo "API Key" de este panel + haz clic en Guardar',
        detail:
          'FreeCrawl guarda la clave cifrada en el almacén de credenciales del sistema (Windows DPAPI, Keychain de macOS, Secret Service de Linux). Nunca se escribe en texto plano.',
      },
      {
        title: 'Prueba en la pestaña AI',
        detail:
          'Cierra Ajustes → cambia a la pestaña superior "AI" → elige unas cuantas URL de un rastreo → haz clic en "Run AI". La primera llamada tarda ~2-3 s.',
      },
    ],
    troubleshooting: [
      {
        problem: '"You exceeded your current quota"',
        solution:
          'Tu cuenta de OpenAI no tiene saldo. Ve a platform.openai.com → Billing → "Add payment method" → añade una tarjeta y carga 5 $ o más. Las cuentas nuevas no reciben crédito automático; tienes que recargar.',
      },
      {
        problem: '"Incorrect API key provided" / 401',
        solution:
          'Probablemente la clave tiene un espacio suelto al principio o al final. Genera una nueva y cópiala con cuidado. Revoca la antigua.',
      },
      {
        problem: '"Rate limit exceeded"',
        solution:
          'Demasiadas peticiones en paralelo. Baja la concurrencia en Ajustes → AI (por defecto: 3). Las cuentas Tier 1 funcionan a 500-3500 RPM según el modelo.',
      },
    ],
    notes: [
      'Precios (2026-06): gpt-4o-mini ~0,15 $/1M tokens de entrada, gpt-4o ~2,50 $/1M de entrada. 1000 URL con un prompt + respuesta típicos: ~0,50-2 $.',
      'Fija un límite mensual duro en la página Usage limits — no quieres que un rastreo desbocado de 1M de URL genere una factura de 1000 $.',
    ],
    lastReviewed: '2026-06-01',
  },
  anthropic: {
    intro:
      'Ejecuta prompts contra Claude a través de la API de Anthropic. Los modelos de gama alta de Claude (Sonnet 4.6, Opus 4.8) producen un resultado SEO con menos "sabor a IA" que la competencia. Se factura a tu propia cuenta de Anthropic.',
    prereqs: [
      'Cuenta de Anthropic (https://console.anthropic.com).',
      'Método de pago registrado (los usuarios nuevos reciben 5 $ de crédito promocional).',
    ],
    steps: [
      {
        title: 'Inicia sesión en console.anthropic.com',
        link: {
          label: 'console.anthropic.com',
          url: 'https://console.anthropic.com',
        },
      },
      {
        title: 'Abre la página "API Keys" desde el desplegable superior derecho',
        detail: 'En el menú Settings, entrada "API Keys".',
        link: {
          label: 'Página de API Keys',
          url: 'https://console.anthropic.com/settings/keys',
        },
      },
      {
        title: 'Haz clic en "+ Create Key"',
        detail:
          'En el diálogo:\n• Name: "FreeCrawl SEO Tool"\n• Workspace: Default workspace\n• Environment: Production\ndespués "Create Key".',
      },
      {
        title: 'COPIA la clave — no se volverá a mostrar',
        detail: 'La clave empieza por `sk-ant-...`. Si la pierdes, crea una nueva.',
      },
      {
        title: 'Pégala en el campo "API Key" + Guardar',
      },
      {
        title: 'Opcional: elige un modelo',
        detail:
          'En Ajustes → AI, el campo "Model" acepta un id de modelo (por defecto: claude-sonnet-4-6). Prioridad velocidad: claude-haiku-4-5 (~10x más barato, 3x más rápido). Prioridad calidad: claude-opus-4-8.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Your credit balance is too low"',
        solution: 'console.anthropic.com → Settings → Billing → "Add credits" — mínimo 5 $.',
      },
      {
        problem: '"Number of request tokens has exceeded your rate limit"',
        solution:
          'Las cuentas Tier 1 van a ~50 RPM. Baja la concurrencia a 2-3 en Ajustes → AI. Para niveles superiores necesitas haber gastado 25 $ o más (Tier 2: 1000 RPM).',
      },
      {
        problem: '"Invalid API key"',
        solution:
          'Asegúrate de que el prefijo "sk-ant-" está intacto y no hay espacios sueltos. Revisa la página API Keys — si la clave aparece activa ahí, la clave en sí está bien.',
      },
    ],
    notes: [
      'Precios (2026-06): Haiku 4.5 ~0,25 $/1,25 $ (entrada/salida por 1M tokens), Sonnet 4.6 ~3 $/15 $, Opus 4.8 ~15 $/75 $.',
      'Anthropic admite caché de prompts — los system prompts largos repetidos en 5 min tienen un 90 % de descuento (el panel AI de FreeCrawl aún no usa caché — llegará en una versión posterior).',
    ],
    lastReviewed: '2026-06-01',
  },
  ollama: {
    intro:
      'Ollama es un runtime de código abierto para LLM alojados localmente. SIN clave de API, gratis para siempre, ni siquiera necesita internet. Coste cero; la única pega es la VRAM/RAM para modelos grandes.',
    prereqs: [
      'macOS 12+, Windows 10+ o Linux (Ubuntu 22.04+ recomendado).',
      'Al menos 8 GB de RAM (modelos pequeños). Llama 3.2 3B necesita ~2 GB de VRAM/RAM.',
      'GPU recomendada pero no obligatoria — la CPU funciona (más lento).',
    ],
    steps: [
      {
        title: 'Descarga e instala Ollama',
        detail:
          'Elige el instalador de tu sistema:\n• Windows: OllamaSetup.exe\n• macOS: Ollama.dmg\n• Linux: curl -fsSL https://ollama.com/install.sh | sh\n\nTras la instalación, Ollama se ejecuta en segundo plano (icono en la bandeja del sistema).',
        link: {
          label: 'ollama.com/download',
          url: 'https://ollama.com/download',
        },
      },
      {
        title: 'Descarga un modelo',
        detail:
          'Abre un terminal y ejecuta:\n\n  ollama pull llama3.2\n\nllama3.2 (3B parámetros) ocupa ~2GB, es rápido y consume pocos recursos. Opciones más grandes:\n  ollama pull llama3.3:70b   (~40GB, solo GPU potente)\n  ollama pull qwen2.5:7b     (~4GB, equilibrado)\n  ollama pull mistral:7b     (~4GB, alternativa)',
      },
      {
        title: 'Prueba rápida del modelo',
        detail:
          'En el terminal:\n  ollama run llama3.2\n\nSe abre un chat interactivo. Escribe "hello" — si recibes respuesta, todo bien. Ctrl+D para salir.',
      },
      {
        title: 'Introduce el endpoint de Ollama en este panel',
        detail:
          'Por defecto: http://localhost:11434 (ya rellenado). Cámbialo si Ollama se ejecuta en otro puerto.',
      },
      {
        title: 'Introduce el nombre del modelo que descargaste',
        detail:
          'P. ej. "llama3.2" o "qwen2.5:7b". Déjalo en blanco para que FreeCrawl elija el primer modelo disponible.',
      },
      {
        title: 'Guarda y prueba',
        detail: 'Ejecuta un lote pequeño en la pestaña AI. Solo CPU: ~5-15 s/URL. GPU: ~1-3 s.',
      },
    ],
    troubleshooting: [
      {
        problem: 'AI tab says "Connection refused"',
        solution:
          'Ollama no está en ejecución. En el terminal ejecuta "ollama serve" o lanza la app de Ollama desde la bandeja del sistema / menú Inicio.',
      },
      {
        problem: '"model \'X\' not found"',
        solution:
          'El modelo no está descargado. Ejecuta "ollama pull <nombre-del-modelo>". Usa "ollama list" para ver qué hay ya en disco.',
      },
      {
        problem: 'Replies are very slow (>30 s/URL)',
        solution:
          'El modelo no cabe en la VRAM y pasa a la CPU. Prueba un modelo más pequeño (llama3.2:1b o phi3:mini). Necesidades de VRAM: 3B ~2GB, 7B ~4GB, 13B ~8GB.',
      },
    ],
    notes: [
      'Totalmente sin conexión — el rastreo + análisis con IA sigue funcionando incluso sin internet.',
      'Calidad del análisis SEO local: los modelos de 3B son algo flojos, los de 7-13B decentes, los de 70B a nivel de GPT-4 (pero con hardware pesado).',
      'En Ajustes → AI mantén la concurrencia en 1-2 — los modelos locales serializan las peticiones paralelas.',
    ],
    lastReviewed: '2026-06-01',
  },
  pagespeed: {
    intro:
      'Google PageSpeed Insights audita cada URL con Lighthouse y devuelve puntuaciones de Rendimiento/SEO/Accesibilidad/Buenas prácticas + Core Web Vitals (LCP/CLS/INP). Una clave de API gratuita te da 25.000 auditorías/día.',
    prereqs: [
      'Cuenta de Google.',
      'Proyecto de Google Cloud Console (puedes crear uno en los pasos siguientes).',
    ],
    steps: [
      {
        title: 'Abre Google Cloud Console',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Elige o crea un proyecto',
        detail:
          'Desplegable de proyecto arriba a la izquierda → "New Project" → nombre: "FreeCrawl SEO" → Create. NO hace falta cuenta de facturación — el nivel gratuito de PSI solo necesita credenciales para autenticarse.',
      },
      {
        title: 'Habilita la PageSpeed Insights API',
        detail: 'Este enlace directo lleva a la página de habilitación de la API:',
        link: {
          label: 'PageSpeed Insights API → Enable',
          url: 'https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com',
        },
      },
      {
        title: 'Haz clic en el botón azul "Enable" → espera 30 s',
      },
      {
        title: 'Ve a Credentials',
        link: {
          label: 'Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'Haz clic en "+ Create Credentials" → "API key"',
        detail: 'Se genera una clave de API (empieza por `AIzaSy...`). Cópiala de inmediato.',
      },
      {
        title: 'Opcional: restringe la clave de API (recomendado)',
        detail:
          'Haz clic en "Edit API key" → "Restrict key":\n• API restrictions: "Restrict key" → "PageSpeed Insights API"\n• Application restrictions: "None" (FreeCrawl es una app de escritorio, así que el filtrado por referrer/IP no funcionará)\nLas claves sin restringir también funcionan, pero te recomendamos restringirla.',
      },
      {
        title: 'Pega la clave en el campo "API Key" de este panel + Guardar',
      },
      {
        title: 'Prueba en la pestaña PageSpeed',
        detail:
          'Pestaña superior "PageSpeed" → elige unas cuantas URL → "Run audit". La primera auditoría tarda ~10-15 s.',
      },
    ],
    troubleshooting: [
      {
        problem: '"This API method requires billing to be enabled"',
        solution:
          'Habilitaste la API equivocada (p. ej. una "Cloud PageSpeed Insights API" antigua). La correcta es "PageSpeed Insights API" (pagespeedonline.googleapis.com). Vuelve a abrir el enlace del paso 3.',
      },
      {
        problem: '"API key not valid"',
        solution:
          'Las restricciones de la clave están mal. Cloud Console → Credentials → haz clic en la clave → comprueba que "PageSpeed Insights API" está entre las API permitidas. O quita temporalmente las restricciones para verificarlo.',
      },
      {
        problem: '"Quota exceeded" — before hitting 25,000',
        solution:
          'También hay un límite por minuto: 240 consultas/min. En Ajustes → PageSpeed mantén la concurrencia en 2-3. El tope diario de 25K es altísimo — no lo verás en un uso normal.',
      },
    ],
    notes: [
      'Coste: GRATIS — una de las pocas API de Google que no exige facturación. El modo sin clave/anónimo es ahora de 0 consultas/día (cerrado a principios de 2026), así que la clave es obligatoria.',
      'Velocidad: cada URL ~5-10 s (Google ejecuta realmente una instancia de Lighthouse). 1000 URL ~2 horas.',
      'Móvil + Escritorio cuentan como llamadas a la API separadas — elegir "ambos" duplica el consumo de cuota.',
    ],
    lastReviewed: '2026-06-01',
  },
  ahrefs: {
    intro:
      'Obtén número de backlinks, domain rating, dominios de referencia y número de palabras clave orgánicas por URL a través de la API de Ahrefs. Es la integración más cara de Ahrefs — el acceso a la API está reservado a planes de 500 $/mes o más.',
    prereqs: [
      'Suscripción Ahrefs Standard (249 $/mes) o superior.',
      'Nivel adicional "API" (500 $/mes extra sobre el plan base, o un nivel distinto).',
    ],
    steps: [
      {
        title: 'Inicia sesión en Ahrefs → página API',
        link: {
          label: 'ahrefs.com/api',
          url: 'https://ahrefs.com/api',
        },
      },
      {
        title: 'Elige una suscripción (si aún no tienes acceso a la API)',
        detail:
          'El acceso a la API v3 viene con el nivel Enterprise y los planes de API dedicados. Contacta con ventas para un presupuesto.',
      },
      {
        title: 'Genera un token de API en tu cuenta',
        detail:
          'Panel de Ahrefs → Account settings → API → Generate token. Formato del token: `sk-...` o similar.',
      },
      {
        title: 'Pégalo en el campo "API Key" + Guardar',
      },
      {
        title: 'Prueba en la pestaña SEO Authority',
        detail:
          'Pestaña superior "SEO Authority" → proveedor: "Ahrefs" → elige unas cuantas URL → "Run".',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient credits"',
        solution:
          'Unidades de filas de API agotadas. Panel de Ahrefs → API → pestaña "Usage". Mejora el plan o espera al siguiente ciclo de facturación.',
      },
      {
        problem: '"Unauthorized"',
        solution:
          'Tu suscripción no incluye acceso a la API. "Ahrefs Standard" por sí solo no da derechos de API — necesitas un nivel de API explícito por encima.',
      },
    ],
    notes: [
      'Coste: aproximadamente 1-5 filas de API por auditoría de URL. Plan de API Standard ~25K filas/mes.',
      'Alternativas más baratas: Moz (99 $/mes, Domain Authority) o Majestic.',
    ],
    lastReviewed: '2026-06-01',
  },
  majestic: {
    intro:
      'Obtén Trust Flow, Citation Flow y número de backlinks a través de la API de Majestic. El proveedor centrado en backlinks más rentable.',
    prereqs: [
      'Suscripción Majestic Lite (49,99 $/mes) o superior.',
      'Acceso a la API — incluido con Lite.',
    ],
    steps: [
      {
        title: 'Abre el panel de desarrollador de Majestic',
        link: {
          label: 'majestic.com/account/api',
          url: 'https://majestic.com/account/api',
        },
      },
      {
        title: 'Genera una clave de API',
        detail: 'Panel → pestaña "Open API" → "Generate new key" → copiar.',
      },
      {
        title: 'Pégala en este panel + Guardar',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient resources" / "No analysis units"',
        solution:
          'Cuota mensual de unidades de análisis agotada. Plan Lite: 1000 unidades/mes; Pro: 20K+. Revisa el panel de Majestic → API → uso.',
      },
    ],
    notes: [
      'Coste: 1 consulta de backlinks de URL = 5 unidades. Plan Lite (1000 unidades) ~200 URL/mes.',
    ],
    lastReviewed: '2026-06-01',
  },
  moz: {
    intro:
      'Obtén Domain Authority (DA), Page Authority (PA) y Spam Score a través de la API de Moz. La opción más popular para presupuestos ajustados.',
    prereqs: [
      'Suscripción Moz Pro Standard (99 $/mes) o superior con el complemento "Moz API" activado.',
    ],
    steps: [
      {
        title: 'Abre la página de la API de Moz',
        link: {
          label: 'moz.com/api',
          url: 'https://moz.com/api',
        },
      },
      {
        title: 'Account → API → "Generate Credentials"',
        detail: 'Se generan dos valores: "Access ID" y "Secret Key". Copia ambos.',
      },
      {
        title: 'Pega cada uno en los campos "Access ID" + "Secret Key" de este panel + Guardar',
        detail: 'Dos campos separados — rellénalos en orden.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Authentication failed"',
        solution:
          'El Access ID o la Secret Key se copiaron mal. Vuelve a copiarlos del panel de Moz — el Access ID es corto (~13 caracteres), la Secret Key es larga (~40 caracteres).',
      },
    ],
    notes: [
      'Coste: plan Standard (1500 filas/mes), Medium (10K filas/mes), Large (100K filas/mes).',
    ],
    lastReviewed: '2026-06-01',
  },
  semrush: {
    intro:
      'Obtén palabras clave orgánicas, estimaciones de tráfico y funciones de SERP a través de la API de Semrush. Los datos de palabras clave + tráfico más completos.',
    prereqs: [
      'Suscripción Semrush Pro (129 $/mes) o superior.',
      '"API units" asociadas a la cuenta (el nivel Guru y superiores incluyen acceso a la API).',
    ],
    steps: [
      {
        title: 'Inicia sesión en Semrush → Subscription info → API',
        link: {
          label: 'Acceso a la API de Semrush',
          url: 'https://www.semrush.com/accounts/subscription-info/api-units/',
        },
      },
      {
        title: 'Copia la clave de API',
      },
      {
        title: 'Pégala en este panel + Guardar',
      },
    ],
    troubleshooting: [
      {
        problem: '"API units exhausted"',
        solution:
          'Cuota mensual de unidades agotada. Plan Guru: 7K unidades/mes, Business: 25K+. Revisa el panel de Semrush → API → uso.',
      },
    ],
    notes: [
      'Coste: 1 consulta de backlinks de URL = 10 unidades; 1 resumen de dominio = 1 unidad.',
    ],
    lastReviewed: '2026-06-01',
  },
  gsc: {
    intro:
      'Obtén métricas de Search Console por URL (clics, impresiones, CTR, posición media) a través de la API de Google Search Console. La API URL Inspection también te da el veredicto de cobertura + hora del último rastreo. Modelo "trae tu propio cliente" — creas tu propio cliente OAuth de Google Cloud y lo pegas; FreeCrawl no usa una app intermediaria compartida.',
    prereqs: [
      'Cuenta de Google (debe ser propietaria / copropietaria de la propiedad de GSC que quieres conectar).',
      'Al menos una propiedad de Google Search Console añadida + verificada.',
    ],
    steps: [
      {
        title: 'Abre Google Cloud Console y crea un proyecto nuevo',
        detail:
          'Desplegable de proyecto arriba a la izquierda → "New Project" → nombre: "FreeCrawl SEO Integrations" (el que quieras) → Create. Este proyecto es solo para credenciales OAuth — no hace falta facturación.',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Abre Google Auth Platform → Branding',
        detail:
          'Menú izquierdo "APIs & Services" → "OAuth consent screen" (UI nueva: "Google Auth Platform → Branding"). User Type: "External" → Create.',
        link: {
          label: 'OAuth consent screen',
          url: 'https://console.cloud.google.com/auth/branding',
        },
      },
      {
        title: 'Rellena la pantalla de consentimiento OAuth',
        detail:
          'Solo los campos obligatorios:\n• App name: "FreeCrawl Local"\n• User support email: tu correo\n• Developer contact information: tu correo\nDeja el resto en blanco. Save and Continue → Save and Continue → Save and Continue → Back to Dashboard.',
      },
      {
        title: 'CRÍTICO: añádete como Test User',
        detail:
          'Menú izquierdo → "Audience" (UI antigua "Test users") → "Add users" → pega el Gmail que vas a conectar → Save.\n\nAVISO: NO TE SALTES ESTE PASO. Saltártelo produce un 403 access_denied durante OAuth — las apps en estado "Testing" solo permiten conectar a las cuentas de la lista de usuarios de prueba.',
        link: {
          label: 'Página Audience',
          url: 'https://console.cloud.google.com/auth/audience',
        },
      },
      {
        title: 'Habilita la Google Search Console API',
        detail:
          'Este enlace va directo a la página de habilitación → haz clic en el botón azul "Enable" → espera 30 s.',
        link: {
          label: 'Search Console API → Enable',
          url: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com',
        },
      },
      {
        title: 'Crea un OAuth Client ID',
        detail:
          'Menú izquierdo → "Credentials" (UI nueva "Google Auth Platform → Clients") → "+ Create credentials" → "OAuth client ID".',
        link: {
          label: 'Página Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'Elige "Desktop app" como tipo de OAuth Client (¡NO Web app!)',
        detail:
          'Desplegable Application type → "Desktop app". Name: "FreeCrawl SEO Tool". Create → el diálogo muestra Client ID + Client Secret. Copia ambos de inmediato (el Secret no se vuelve a mostrar).\n\nPOR QUÉ DESKTOP: FreeCrawl usa un puerto local aleatorio (p. ej. 127.0.0.1:63092) por conexión. "Web application" necesita una lista fija de redirect URI — ese puerto aleatorio no puede coincidir → falla. "Desktop app" acepta automáticamente redirecciones loopback, sin importar el puerto.',
      },
      {
        title: 'Pega Client ID + Client Secret en este panel + Guardar',
        detail:
          'Dos campos: "OAuth Client ID" (...apps.googleusercontent.com) y "OAuth Client Secret" (GOCSPX-...). Guardar.',
      },
      {
        title: 'Haz clic en "Conectar" — se abre tu navegador',
        detail:
          'Tras Guardar, la tarjeta muestra un botón "Conectar". Haz clic → la pantalla de consentimiento de Google se abre en tu navegador predeterminado.',
      },
      {
        title: 'Inicia sesión con la cuenta de Google que añadiste como usuario de prueba',
        detail:
          'En el selector de cuentas elige el correo que añadiste a los usuarios de prueba. "Continue" → aviso "Google hasn\'t verified this app" (esperado en modo de pruebas). "Advanced" → "Go to FreeCrawl Local (unsafe)" → acepta los permisos → Allow.',
      },
      {
        title: 'De vuelta en FreeCrawl — deberías ver "Configurado"',
        detail:
          'La tarjeta de Search Console en Ajustes muestra ahora una insignia verde "Configurado". Ya puedes pasar a la pestaña superior "Search Console" para listar propiedades + obtener datos.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 access_denied"',
        solution:
          'No añadiste un usuario de prueba, o estás iniciando sesión con la cuenta de Google equivocada. Vuelve a la página Audience y comprueba que la cuenta que usas está en la lista de usuarios de prueba. Si tienes varias cuentas de Google, mira cuál está usando el selector de cuentas.',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'O bien la Search Console API no estaba habilitada O la casilla de permiso "View Search Console data for your verified sites" de la pantalla de consentimiento OAuth estaba desmarcada. (1) Habilita la Search Console API (paso 5), (2) myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → haz clic en Conectar de nuevo y marca todos los permisos en la pantalla de consentimiento.',
      },
      {
        problem: '"redirect_uri_mismatch"',
        solution:
          'Tipo de cliente OAuth equivocado. Elimina el cliente desde la página Credentials y vuelve a crearlo como "Desktop app" (paso 7). "Web application" nunca funcionará para este flujo.',
      },
      {
        problem: '"This app isn\'t verified" warning',
        solution:
          'Comportamiento esperado (app en modo de pruebas + ámbito sensible). Haz clic en "Advanced" → "Go to <app> (unsafe)" para continuar. La app está en modo de pruebas y solo deja entrar a usuarios de prueba — es segura.',
      },
      {
        problem: 'Connection broke after 7 days',
        solution:
          'Los refresh tokens de OAuth caducan cada 7 días en modo de pruebas. Ajustes → Integraciones → Search Console → "Desconectar" → "Conectar" para volver a autenticarte. Para librarte de la caducidad tienes que pasar la app por el proceso de verificación de Google (1-4 semanas).',
      },
    ],
    notes: [
      'Las propiedades de tu propiedad (sc-domain:example.com o https://example.com/) incluyen todos los sitios que tu cuenta ha verificado.',
      'Los datos de GSC llevan ~2 días de retraso — los clics de hoy no aparecen de inmediato.',
      'Cuota gratuita: 1200 consultas/min, 25.000 consultas/día — nunca la alcanzarás en un uso normal.',
    ],
    lastReviewed: '2026-06-01',
  },
  ga4: {
    intro:
      'Obtén métricas de GA4 por URL (sesiones, usuarios, tasa de rebote, tasa de interacción, conversiones). "Trae tu propio cliente" — usa tu propio cliente OAuth de GCP.',
    prereqs: [
      'Cuenta de Google con al menos acceso de Lector en la propiedad de GA4 que vas a conectar.',
      'Puedes REUTILIZAR el mismo cliente OAuth que configuraste para GSC — solo habilita las API correctas.',
    ],
    steps: [
      {
        title: 'Si ya configuraste GSC: REUTILIZA ese cliente OAuth',
        detail:
          'Si Search Console ya está configurado, puedes usar el mismo proyecto de Google Cloud y el mismo OAuth Client ID + Secret. No hace falta recrearlos — solo habilita las API de abajo y pega las credenciales aquí.',
      },
      {
        title: 'Habilita AMBAS API de GA4',
        detail:
          'GA4 necesita dos API distintas:\n\n1. Google Analytics Admin API (para listar propiedades)\n2. Google Analytics Data API (para los informes en sí)\n\nSi no habilitas ambas verás errores "API not enabled".',
        link: {
          label: 'Admin API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com',
        },
      },
      {
        title: 'Habilita también la Data API',
        link: {
          label: 'Data API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
        },
      },
      {
        title: 'Pega el mismo Client ID + Secret que usaste para GSC',
        detail:
          'Si GSC ya está conectado, puede que ni siquiera tengas que pegarlos — las tarjetas pueden compartir credenciales. Si configuras GA4 desde cero, copia el ID/Secret de tu cliente de GSC en este panel.',
      },
      {
        title: '"Conectar" → inicia sesión con Google + aprueba el ámbito de GA4',
        detail:
          'Inicia sesión con la cuenta de Google que añadiste como usuario de prueba. En la pantalla de consentimiento confirma que el permiso "Google Analytics: View Google Analytics property data" está marcado.',
      },
      {
        title: 'Lista propiedades + obtén datos en la pestaña GA4',
        detail:
          'Pasa a la pestaña superior "GA4" → "List Properties" muestra todas las propiedades de GA4 que tu cuenta puede ver → elige una → escoge una ventana (7/28/90 días) → "Fetch". GA4 es casi en tiempo real, los resultados aparecen de inmediato.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Google Analytics Admin API has not been used in project X"',
        solution:
          'Admin API no habilitada. Abre el enlace del paso 2 → Enable. Espera 30 s y reintenta. A continuación tendrás el mismo error con la Data API — abre el enlace del paso 3 y habilítala también.',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'El ámbito OAuth no cubre GA4. Ve a myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → haz clic en Conectar de nuevo → marca la casilla del permiso de Google Analytics.',
      },
      {
        problem: 'Property list comes back empty',
        solution:
          'La cuenta de Google que conectaste no tiene ningún rol en propiedades de GA4. Panel de GA4 → Admin → Property Access Management → confirma que tu correo tiene al menos Lector.',
      },
    ],
    notes: [
      'Los datos de GA4 son casi en tiempo real — los de hoy aparecen en 4-24 horas.',
      'Cuota gratuita: 200K peticiones/día, 50 peticiones/min por propiedad.',
    ],
    lastReviewed: '2026-06-01',
  },
  sheets: {
    intro:
      'Exporta los resultados del rastreo directamente a una hoja de Google Sheets. Mejor que "descargar CSV → abrir en Excel" cuando colaboras con compañeros en un documento compartido en vivo.',
    prereqs: [
      'Cuenta de Google.',
      'Puedes REUTILIZAR el mismo cliente OAuth que configuraste para GSC.',
    ],
    steps: [
      {
        title: 'Si configuraste GSC/GA4: REUTILIZA ese cliente OAuth',
        detail: 'Pega el mismo OAuth Client ID + Secret (o puede que ya estén guardados).',
      },
      {
        title: 'Habilita la Google Sheets API',
        link: {
          label: 'Sheets API → Enable',
          url: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
        },
      },
      {
        title: 'Habilita también la Google Drive API',
        detail:
          'La Sheets API también requiere un ámbito de Drive para crear/leer hojas de cálculo.',
        link: {
          label: 'Drive API → Enable',
          url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
        },
      },
      {
        title: 'Pega Client ID + Secret + Guardar',
      },
      {
        title: '"Conectar" → aprueba Sheets + Drive en la pantalla de consentimiento',
        detail:
          'El flujo OAuth muestra dos permisos:\n• See, edit, create, and delete all your Google Sheets spreadsheets\n• See, edit, create, and delete only the specific Google Drive files used with this app\nMarca ambos.',
      },
      {
        title: 'Prueba desde el menú Exportar',
        detail:
          'Archivo → Exportar → "Exportar a Google Sheets". Se crea automáticamente una hoja nueva y la URL se copia al portapapeles.',
      },
    ],
    troubleshooting: [
      {
        problem: '"insufficient authentication scopes"',
        solution:
          'No marcaste la casilla del permiso de Drive durante la conexión. Desconecta + Reconecta y marca ambos permisos.',
      },
    ],
    notes: [
      'Límite duro de Sheets: 10M de celdas por hoja de cálculo — los rastreos grandes (>500K URL) se dividen.',
      'El ámbito de Drive es "drive.file" — solo son accesibles los archivos que crea FreeCrawl, no tus archivos existentes.',
    ],
    lastReviewed: '2026-06-01',
  },
  bigquery: {
    intro:
      'Envía los datos del rastreo directamente a un conjunto de datos de BigQuery. Útil para acumular instantáneas fechadas en tu almacén de datos y visualizar tendencias de rastreo con una herramienta de BI (Looker Studio, Tableau, Metabase).',
    prereqs: [
      'Proyecto de Google Cloud con la BigQuery API habilitada.',
      'Conjunto de datos de BigQuery ya creado.',
      'JSON de cuenta de servicio (NO OAuth — autenticación servidor a servidor).',
      'Proyecto de GCP con facturación habilitada (nivel gratuito de BigQuery: 10GB de almacenamiento/mes + 1TB de consultas/mes; se cobra a partir de ahí).',
    ],
    steps: [
      {
        title: 'Crea un conjunto de datos de BigQuery',
        detail:
          'Consola de BigQuery → elige tu proyecto → "Create dataset" → ID: "freecrawl_seo" (o cualquier nombre) → Location: "EU" o "US" (importante — no se puede cambiar después) → Create dataset.',
        link: {
          label: 'Consola de BigQuery',
          url: 'https://console.cloud.google.com/bigquery',
        },
      },
      {
        title: 'Crea una cuenta de servicio',
        detail:
          'IAM & Admin → Service Accounts → "+ Create service account" → nombre: "freecrawl-bigquery" → Create and continue.',
        link: {
          label: 'Service Accounts',
          url: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
        },
      },
      {
        title: 'Añade roles',
        detail:
          'En el paso 2 "Grant this service account access to project" → añade dos roles:\n• BigQuery Data Editor\n• BigQuery Job User\nDespués "Continue" → "Done".',
      },
      {
        title: 'Descarga la clave JSON',
        detail:
          'En la lista de cuentas de servicio haz clic en la que acabas de crear → pestaña "Keys" → "Add key" → "Create new key" → Type: JSON → Create.\n\nEl JSON se descarga automáticamente. Ábrelo en un editor de texto y copia todo el contenido.\n\nAVISO: Este JSON contiene toda la credencial — trátalo como una contraseña. Nunca lo subas al control de versiones.',
      },
      {
        title: 'Pégalo en el campo "Service Account JSON" de este panel',
        detail:
          'Pega el JSON completo (desde la llave de apertura `{` hasta la de cierre `}`). FreeCrawl guarda el JSON cifrado en el almacén de credenciales del sistema.',
      },
      {
        title: 'Rellena "GCP Project ID"',
        detail:
          'El ID de tu proyecto de GCP (aparece en el desplegable superior izquierdo de Cloud Console, p. ej. "my-gcp-project-12345"). El JSON también tiene un campo "project_id" — puedes copiarlo de ahí.',
      },
      {
        title: 'Introduce el nombre del conjunto de datos + Guardar',
        detail:
          'El nombre del conjunto de datos que creaste en el paso 1 (p. ej. "freecrawl_seo").',
      },
      {
        title: 'Prueba desde el menú Exportar',
        detail:
          'Archivo → Exportar → "Exportar a BigQuery" → elige nombre/formato de tabla → ejecuta. Comprueba que la tabla apareció en la consola de BigQuery.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 PermissionDenied: caller does not have permission"',
        solution:
          'Faltan roles de IAM en la cuenta de servicio. IAM & Admin → IAM → busca el correo de tu cuenta de servicio → confirma que tiene asignados tanto "BigQuery Data Editor" como "BigQuery Job User".',
      },
      {
        problem: '"Dataset X not found"',
        solution:
          'Nombre de conjunto de datos incorrecto O discrepancia de ubicación (multirregión "EU" frente a región "europe-west1"). Copia el nombre exacto del conjunto de datos desde la consola de BigQuery.',
      },
      {
        problem: '"Invalid JSON"',
        solution:
          'Pegaste solo parte del JSON o hay un carácter suelto en los extremos. Abre el archivo JSON de la cuenta de servicio con un editor de verdad (VS Code recomendado, NO el Bloc de notas), Ctrl+A para seleccionar todo, copia, vacía el campo de FreeCrawl y pega.',
      },
    ],
    notes: [
      'Coste: el nivel gratuito de BigQuery (10GB de almacenamiento + 1TB de consultas/mes) cubre un uso normal. Un rastreo de 1M de URL ocupa ~500MB; el coste de las consultas depende de tu SQL.',
      'Evolución del esquema: FreeCrawl crea/actualiza la tabla de exportación automáticamente. Si el esquema CrawlUrlRow gana columnas nuevas, la tabla de exportación las incorpora (flexibilidad DDL de BigQuery).',
    ],
    lastReviewed: '2026-06-01',
  },
};
