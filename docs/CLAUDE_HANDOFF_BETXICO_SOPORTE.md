# Betxico Soporte: Documento Maestro De Contexto Y Handoff

Actualizado: 2026-06-13

## 1. Proposito Del Documento

Este documento permite que otro asistente tecnico, especialmente Claude, pueda trabajar en `betxico-soporte` con suficiente contexto para entender el sistema, continuar su desarrollo y evitar romper flujos operativos existentes.

La fuente de verdad es el codigo actual dentro de:

```text
/Users/gerardocruz/Desktop/EXTENCION S:T Y BANCKEND/betxico-soporte/support-livechat-app
```

El README ubicado en la raiz de `betxico-soporte` puede estar desactualizado. Antes de tomar decisiones se debe revisar el codigo de `support-livechat-app`, su `README.md`, este documento y el estado actual de Git.

## 2. Resumen Ejecutivo

`betxico-soporte` es una aplicacion interna para agentes de soporte Betxico. Su superficie principal es un widget embebido dentro de LiveChat/Text. Centraliza en una sola interfaz:

- Inicio de sesion por Slack o correo y PIN.
- Identificacion del agente y validacion remota de acceso.
- Lectura del contexto del cliente activo en LiveChat.
- Consulta de tickets abiertos de Jira.
- Consulta de reportes operativos almacenados en Slack Lists.
- Consulta de conversaciones anteriores del cliente.
- Creacion de tickets Jira y reportes Slack.
- Asistente GPT interno con base documental, intents y plantillas seguras.
- Bienvenida y respuestas automaticas controladas en LiveChat.
- Alertas bloqueantes para agentes con confirmacion de lectura.
- Administracion remota de usuarios, flujos, listas, alertas y configuracion GPT.

La aplicacion esta desplegada en Vercel y usa funciones serverless existentes. Se evita crear funciones adicionales innecesarias para conservar simplicidad y compatibilidad con los limites del plan.

## 3. Principios Operativos Del Proyecto

1. Mantener lo que ya funciona. Los cambios deben ser aditivos o quirurgicos.
2. La interfaz real vive dentro de LiveChat; no crear herramientas separadas si la capacidad debe usarse durante la atencion.
3. Jira es la fuente canonica para tickets y clasificacion DEVWALLET.
4. Slack sirve para reportes, listas operativas y diagnostico; no sustituye Jira para DEVWALLET.
5. No reintroducir automatizacion Paybridge/Atena en este proyecto.
6. No prometer pagos, bonos, aprobaciones, desbloqueos o tiempos exactos sin validacion humana.
7. Los casos delicados no deben recibir respuesta automatica.
8. Nunca exponer tokens, API keys, PINs, cookies o contrasenas al frontend, logs, documentos o commits.
9. Antes de desplegar, ejecutar las pruebas locales y revisar el estado Git.
10. Distinguir siempre entre codigo local, preview y produccion.

## 4. Arquitectura General

```text
LiveChat / Text Agent App
        |
        | widget embebido + webhooks
        v
Vercel: support-livechat-app
        |
        +-- Autenticacion y cuentas de agentes
        +-- Contexto del cliente
        +-- Creacion y consulta Jira
        +-- Lectura y escritura Slack
        +-- Asistente GPT y plantillas seguras
        +-- Alertas administrativas
        |
        v
Vercel KV / Upstash Redis
        |
        +-- configuracion remota
        +-- cuentas cifradas
        +-- ejemplos y feedback GPT
        +-- tokens OAuth Slack cifrados
        +-- idempotencia LiveChat
        +-- confirmaciones de alertas
```

Servicios externos:

- LiveChat/Text: chats, contexto actual, historial y envio de mensajes.
- Jira Cloud: tickets, metadata, busqueda, comentarios y DEVWALLET.
- Slack: canales, Slack Lists, OAuth individual y paneles operativos.
- OpenAI Responses API: clasificacion y redaccion asistida.
- OpenAI Vector Store/File Search: conocimiento profundo.
- Vercel KV o Upstash Redis: configuracion y estado operativo.
- Vercel: hosting, variables de entorno y funciones serverless.

## 5. Estructura Principal

```text
support-livechat-app/
  api/                         Funciones serverless
  lib/                         Logica compartida e integraciones
  public/                      Widget de agentes y panel admin
  docs/                        Conocimiento, configuracion y documentacion
  scripts/                     Pruebas, despliegue y mineria de respuestas
  package.json                 Comandos operativos
  vercel.json                  Configuracion de despliegue y CSP
```

Archivos centrales:

- `public/index.html`, `public/app.js`, `public/styles.css`: aplicacion del agente.
- `public/admin.html`, `public/admin.js`: administracion remota.
- `api/support-ticket.js`: flujo principal Jira/Slack/GPT/LiveChat.
- `api/jira-search.js`: busqueda de Jira y vistas DEVWALLET basadas en Jira.
- `api/livechat-webhook.js`: recepcion de eventos y auto-respuestas seguras.
- `lib/remote-config.js`: esquema, defaults y acceso a `support:config`.
- `lib/account-store.js`: cuentas, PINs, sesiones y credenciales Jira cifradas.
- `lib/jira.js`: cliente Jira.
- `lib/slack.js`: cliente Slack, rutas y Slack Lists.
- `lib/livechat.js`: cliente LiveChat e idempotencia.
- `lib/safe-template-replies.js`: matching conservador de plantillas seguras.

## 6. Usuarios, Roles Y Autenticacion

### Roles

- `admin`: puede usar funciones operativas y abrir el panel administrativo.
- `agent`: puede usar las funciones operativas autorizadas.

El modulo GPT debe mostrarse solamente a administradores salvo que se tome una nueva decision operativa.

### Inicio de sesion

La app soporta:

1. Inicio de sesion con Slack OpenID Connect.
2. Inicio de sesion con correo y PIN.

Las sesiones usan una cookie:

```text
betxico_support_session
```

La cookie es `HttpOnly`, `Secure`, `SameSite=None`, dura 30 dias y esta firmada con `SUPPORT_SESSION_SECRET` o, como fallback, `SUPPORT_ENCRYPTION_KEY`.

### Validacion continua

`getCurrentAccount()` vuelve a consultar si el usuario sigue autorizado. Si un usuario se desactiva en configuracion remota, una sesion anterior deja de operar aunque la cookie no haya expirado.

### Almacenamiento de cuentas

Cada cuenta vive en KV:

```text
support:account:<correo normalizado>
```

El PIN no se puede recuperar: se guarda como hash `scrypt` con salt. Para entregar un PIN nuevo se debe resetear, no leer el anterior.

El token Jira individual se cifra con AES-256-GCM usando `SUPPORT_ENCRYPTION_KEY`.

Existe un mapa local de correos a Jira reporter account IDs en `lib/account-store.js`. Antes de agregar personal nuevo, confirmar si requiere un reporter ID y evitar borrar los existentes.

### Regla de autorizacion

La lista de usuarios autorizados vive en `support:config.authorizedUsers`.

- Si la lista esta vacia, se conserva el comportamiento permisivo heredado.
- Si contiene usuarios, solo los usuarios con `enabled !== false` pueden iniciar sesion u operar.
- Un admin puede definirse por `role: "admin"`, `adminEmails` o `SUPPORT_ADMIN_EMAILS`.

## 7. Superficies De Usuario

### Widget Del Agente

El widget se instala dentro de LiveChat/Text y permite:

- Ver el cliente activo, correo, AUTH ID y chat ID cuando estan disponibles.
- Ver contexto resumido:
  - tickets Jira abiertos/en curso;
  - reportes encontrados en Slack Lists;
  - conversaciones anteriores;
  - inferencia DEVWALLET basada en Jira.
- Crear tickets y reportes.
- Ejecutar acciones rapidas.
- Consultar el Asistente GPT cuando el rol lo permite.
- Enviar bienvenida y respuestas sugeridas.
- Recibir alertas bloqueantes.

Los tickets cerrados no deben dominar el contexto superior. El historial completo pertenece a busquedas o vistas secundarias.

### Panel Administrativo

El panel `public/admin.html` permite:

- Administrar usuarios autorizados y roles.
- Cambiar flujos Jira/Slack.
- Configurar Slack Routes y paneles de listas.
- Editar instrucciones GPT.
- Administrar ejemplos aprobados.
- Crear alertas para agentes.
- Ver quienes confirmaron cada alerta.
- Configurar automatizacion LiveChat.

El acceso se valida mediante sesion admin o mediante `x-internal-api-key` cuando `INTERNAL_API_KEY` esta configurada.

## 8. Matriz De APIs

### Autenticacion Y Cuenta

- `api/auth-login.js`: inicio de sesion por correo/PIN.
- `api/auth-logout.js`: cierre de sesion.
- `api/account-settings.js`: lectura y configuracion de cuenta/Jira por agente.
- `api/slack-user.js?action=signin-start`: inicia Slack Sign-In.
- `api/slack-user.js?action=signin-callback`: callback Slack Sign-In.
- `api/slack-user.js?action=start`: inicia OAuth individual para publicar como agente.
- `api/slack-user.js?action=callback`: callback OAuth individual.
- `api/slack-user.js?action=status`: estado OAuth del agente.

### Configuracion

- `api/config-status.js`: indica que servicios estan configurados sin revelar secretos.
- `api/support-config.js`: configuracion publica necesaria para el widget.
- `api/support-config.js?action=ack-alert`: confirma lectura de alerta.
- `api/admin-config.js`: lee/guarda configuracion remota completa.
- `api/admin-config.js?action=ai-examples`: CRUD de ejemplos GPT aprobados.

### Jira Y Slack

- `api/jira-metadata.js`: tipos de incidencia y campos Jira.
- `api/jira-search.js`: busqueda de tickets.
- `api/jira-search.js?mode=devwallet`: tickets DEVWALLET abiertos e inferencia por Jira.
- `api/jira-search.js?mode=devwallet-slack`: apoyo diagnostico Slack; no fuente canonica.
- `api/slack-list-schema.js`: esquema de una Slack List.
- `api/slack-list-schema.js?mode=items`: items de lista/panel.

### Flujo Principal

`api/support-ticket.js` maneja varias acciones para no crear funciones serverless adicionales:

- Sin `action`: crear ticket Jira, reportar Slack y auditar.
- `action=ai-chat`: clasificacion y respuesta del asistente.
- `action=ai-save-example`: guardar respuesta aprobada.
- `action=ai-feedback`: registrar respuesta incorrecta/correccion.
- `action=livechat-send-welcome`: enviar bienvenida.
- `action=livechat-send-message`: enviar mensaje manual.
- `action=livechat-auto-safe-template`: evaluar plantilla segura.
- `action=livechat-list-active`: listar chats activos.
- `action=livechat-get-chat`: obtener chat.
- `action=livechat-customer-history`: obtener historial del cliente.

### Webhook LiveChat

- `api/livechat-webhook.js` recibe eventos de LiveChat.
- Guarda mensajes recientes del chat.
- Puede evaluar y enviar una plantilla segura.
- Su comportamiento automatico depende de configuracion remota.

## 9. Jira

Jira es utilizado para:

- Crear tickets con campos reales del proyecto.
- Consultar metadata y tipos de incidencia.
- Buscar tickets relacionados con el cliente.
- Mostrar solo tickets abiertos/en curso en el contexto inmediato.
- Obtener la clasificacion DEVWALLET desde resumen, etiquetas y comentarios.
- Publicar o consultar comentarios cuando el flujo lo requiere.

El backend usa primero las credenciales Jira del agente activo. Si no existen, puede usar las variables globales de Vercel.

Configuracion Jira habitual:

- Proyecto: `BTF`.
- Team: `Betxico - Servicio al Cliente`.
- Tipos comunes: `Servicio al Cliente`, `Transacciones`, `Pago a Clientes` y otros configurados remotamente.

### DEVWALLET

Jira es la fuente canonica para DEVWALLET:

- `devwallet1`: misma cuenta o mismo titular; posible aprobacion por unica ocasion.
- `devwallet2`: cuentas/titulares diferentes; devolucion a origen y retiro manual.
- `devwallet3`: cuentas diferentes sin beneficiario confirmado; solicitar prueba bancaria.

La app puede inferir la clasificacion utilizando el contexto ya escrito en Jira. No debe inventar una clasificacion si el ticket no contiene evidencia suficiente.

### Limite Actual

La automatizacion que cruzaba Paybridge y Atena fue eliminada de este proyecto y se movio a otro frente. No debe reintroducirse aqui. Este proyecto conserva solamente:

- lectura Jira;
- inferencia por comentarios/resumen/etiquetas;
- visualizacion dentro de LiveChat.

## 10. Slack

Slack se utiliza para:

- Enviar mensajes a canales.
- Crear filas en Slack Lists.
- Leer Slack Lists y mostrarlas como paneles de contexto.
- Publicar como bot o, cuando existe OAuth individual, como agente.

La seleccion de ruta puede depender de:

- tipo Jira;
- grupo LiveChat;
- prioridad;
- etiquetas;
- workflow seleccionado.

`support:config.listPanels` es una lista. Al agregar una nueva Slack List debe agregarse un panel nuevo sin reemplazar los paneles existentes.

El panel por defecto de revision usa la lista:

```text
F0B1Z5R527P
```

Existe tambien configuracion documentada para el flujo de deposito no reflejado:

```text
Canal: C090D8TEVS6
Lista: F0AENAZPMFE
```

Estos IDs son identificadores operativos, no credenciales. Los tokens Slack siguen siendo secretos.

### Estado De Aprobacion

En listas de revision, el dato operativo relevante puede ser la columna de estado de aprobacion. Si dice `APROBAR`, el registro ya fue aprobado de acuerdo con la regla operativa definida anteriormente; no asumir que el texto visual `Pendiente` describe correctamente su estado final.

## 11. LiveChat Y Automatizacion

LiveChat proporciona:

- chat activo;
- mensajes;
- datos del cliente;
- historial;
- envio de mensajes;
- eventos webhook.

La credencial de servidor se obtiene de una de estas variables:

```text
LIVECHAT_BASIC_TOKEN
LIVECHAT_BASIC_AUTH_TOKEN
TEXT_BASIC_TOKEN
```

### Bienvenida

La bienvenida tiene idempotencia por chat:

```text
support:livechat:welcome:<chatId>
```

La configuracion por defecto permite bienvenida automatica solo para Gerardo, pero la configuracion remota puede cambiarlo.

### Plantillas Seguras

La fuente es:

```text
docs/betxico_fallback_templates_v1.json
```

Para usarse como plantilla segura debe cumplir:

- riesgo bajo;
- modo `plantilla_segura`;
- estado de revision `aprobada`;
- para auto-envio, `auto_send_allowed: true`.

La prioridad correcta es:

1. Recibir mensaje.
2. Bloquear si hay senales de riesgo.
3. Buscar plantilla segura conservadoramente.
4. Si hay match seguro, responder sin llamar OpenAI.
5. Si no hay match, usar OpenAI.
6. Si OpenAI falla, intentar fallback de rescate.
7. Si no existe respuesta segura, no inventar.

### Modos De Automatizacion

`support:config.liveChatAutomation.safeTemplateMode`:

- `disabled`: no usar automatizacion.
- `suggest_only`: sugerir; no enviar automaticamente. Es el default seguro.
- `auto_send_safe`: auto-enviar solamente plantillas aprobadas y permitidas.

El webhook no debe auto-enviar si:

- falta configuracion o falla su carga;
- el modo no es `auto_send_safe`;
- es saludo simple;
- no es el primer mensaje util;
- el mensaje fue enviado por agente/bot;
- hay senales de riesgo;
- ya se envio una plantilla en ese chat.

Casos que siempre requieren bloqueo o revision humana incluyen retiros ambiguos, cuenta bloqueada, cierre de cuenta, autoexclusion, fraude, suplantacion, amenaza legal, ganancia no reflejada, saldo descontado en juego y cliente muy molesto.

### Area Sensible A Regresion

La bienvenida repetida y el paso de bienvenida a plantilla segura han presentado problemas anteriormente. Antes de activar `auto_send_safe` en produccion, validar con chats de prueba:

- bienvenida una sola vez;
- esperar mensaje util del cliente;
- plantilla una sola vez;
- no responder al propio bot/agente;
- no responder casos riesgosos.

## 12. Asistente GPT

El asistente GPT vive dentro de:

```text
api/support-ticket.js?action=ai-chat
```

La llave OpenAI nunca debe enviarse al navegador.

### Jerarquia De Decision

1. Intents JSON: decision rapida y deduplicacion.
2. Plantillas aprobadas: respuestas basicas sin tokens.
3. Ejemplos KV: estilo y casos reales.
4. File Search MD: politicas y conocimiento profundo.
5. Contexto actual: cliente, chat, Jira, Slack y borradores.
6. OpenAI: redaccion compleja o caso ambiguo.

### Fuentes De Conocimiento

- `docs/betxico_intents_dataset_v1.json`: indice operativo.
- `docs/betxico_base_conocimiento_operativa_v1.md`: conocimiento profundo.
- `docs/betxico-soporte-knowledge.md`: conocimiento adicional.
- `docs/betxico_fallback_templates_v1.json`: plantillas seguras.
- `support:ai:examples`: ejemplos aprobados.
- `support:ai:feedback`: respuestas incorrectas y correcciones.

### Salida Estructurada Interna

La clasificacion interna considera:

- `selectedIntent`
- `subdiagnostic`
- `confidence`
- `missingData`
- `riskLevel`
- `canAutoRespond`
- `requiresTicket`
- `requiresDocuments`
- `requiresScreenshot`
- `response`

La UI muestra diagnostico probable, datos faltantes, riesgo, modo de uso y respuesta sugerida. No debe mostrar JSON crudo al cliente.

### Consumo De Tokens

- Una plantilla local segura no consume tokens OpenAI.
- File Search y respuestas OpenAI si consumen tokens.
- La configuracion estatica debe mantenerse al inicio del prompt para aprovechar caching.
- Solo deben enviarse ejemplos relevantes, no todo el historial.

## 13. Alertas Para Agentes

Los admins pueden crear alertas dirigidas a:

- todos;
- agentes;
- admins;
- correos especificos.

Una alerta puede bloquear la aplicacion hasta que el agente marque que la vio. Las confirmaciones viven en:

```text
support:alert-acks
```

El panel admin muestra confirmados y pendientes. Las alertas no necesitan publicarse constantemente; la app consulta la configuracion y determina si existe una alerta pendiente para el usuario activo.

## 14. Configuracion Remota Y Datos KV

Clave principal:

```text
support:config
```

Campos normalizados:

- `reportWorkflows`
- `slackRoutes`
- `listPanels`
- `authorizedUsers`
- `adminEmails`
- `aiAssistant`
- `liveChatAutomation`
- `traceability`
- `supportAlerts`
- `updatedAt`

Claves KV adicionales:

```text
support:account:<email>
support:ai:examples
support:ai:feedback
support:alert-acks
support:slack-user-tokens
support:livechat:welcome:<chatId>
support:livechat:safe-template:<chatId>
support:livechat:messages:<chatId>
support:slack-panel-cache:<panelId>
```

### Traceability Heredada

`support:config.traceability` todavia existe en el esquema y puede exponer depositos cargados manualmente. No equivale a la automatizacion eliminada de Paybridge/Atena. Debe tratarse como legado/manual hasta que se decida retirarlo o redefinirlo.

La clave eliminada y que no debe volver a usarse en este proyecto es:

```text
support:devwallet:results
```

## 15. Inventario De Secretos, Tokens Y PINs

### Regla Obligatoria

Los valores reales no deben guardarse en este documento, Git, Markdown, logs ni mensajes. Este inventario indica exactamente que secretos existen, donde viven y para que se usan.

### Variables Secretas De Vercel O Entorno Local

| Variable | Proposito | Ubicacion segura |
|---|---|---|
| `JIRA_API_TOKEN` | Jira global/fallback | Vercel Environment Variables o archivo local ignorado |
| `KV_REST_API_TOKEN` / `UPSTASH_REDIS_REST_TOKEN` | Acceso KV/Redis | Vercel Environment Variables |
| `SUPPORT_SESSION_SECRET` | Firma de cookies y estados OAuth | Vercel Environment Variables |
| `SUPPORT_ENCRYPTION_KEY` | Cifrado de tokens Jira/Slack | Vercel Environment Variables |
| `SLACK_BOT_TOKEN` | API Slack bot | Vercel Environment Variables |
| `SLACK_CLIENT_SECRET` | OAuth Slack individual | Vercel Environment Variables |
| `SLACK_SIGNIN_CLIENT_SECRET` | Slack Sign-In, si se separa | Vercel Environment Variables |
| `OPENAI_API_KEY` | Responses API/File Search | Vercel Environment Variables |
| `LIVECHAT_BASIC_TOKEN` / aliases | API LiveChat/Text | Vercel Environment Variables |
| `INTERNAL_API_KEY` | Acceso tecnico al admin | Vercel Environment Variables |
| `DEVWALLET_BRIDGE_TOKEN` | Proteccion de ruta bridge Jira | Vercel Environment Variables |

### Secretos Guardados En KV

| Dato | Clave | Proteccion |
|---|---|---|
| PIN de agente | `support:account:<email>.pin` | Hash scrypt; no recuperable |
| Token Jira por agente | `support:account:<email>.jiraApiTokenEncrypted` | AES-256-GCM |
| OAuth Slack por agente | `support:slack-user-tokens` | Cifrado con `SUPPORT_ENCRYPTION_KEY` |

### Valores No Secretos Pero Sensibles Operativamente

- Correos y roles de agentes.
- IDs de Jira accounts.
- IDs de canales/listas/columnas Slack.
- IDs de Vector Store.
- IDs de chats y tickets.
- AUTH IDs y datos de clientes.

No deben publicarse fuera del entorno autorizado.

### Como Verificar Sin Revelar Valores

1. Abrir `/api/config-status` para verificar presencia.
2. Revisar nombres de variables en Vercel sin copiar su contenido.
3. Revisar estado de cuenta desde la app, no leyendo KV directamente.
4. Para PIN olvidado, generar uno nuevo.
5. Para token comprometido, revocarlo, crear otro y actualizar Vercel/KV.

### Archivos Locales Que Nunca Deben Copiarse A Chats O Commits

```text
.env.local
.env.production.local
.env.vercel.local
otros archivos .env con valores reales
```

El archivo `.env.vercel.example` solo contiene nombres y ejemplos sin secretos.

## 16. Variables De Entorno

### Jira

```text
JIRA_BASE_URL
JIRA_EMAIL
JIRA_API_TOKEN
JIRA_PROJECT_KEY
JIRA_ISSUE_TYPE
JIRA_FIELD_MAP_JSON
JIRA_REPORTER_NAME
JIRA_REPORTER_ACCOUNT_ID
JIRA_DEFAULT_ASSIGNEE_NAME
JIRA_DEFAULT_ASSIGNEE_ACCOUNT_ID
JIRA_DEFAULT_TEAM_NAME
JIRA_DEFAULT_TEAM_ID
JIRA_DEFAULT_LABELS
```

### KV, Sesion Y Seguridad

```text
KV_REST_API_URL
KV_REST_API_TOKEN
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
SUPPORT_SESSION_SECRET
SUPPORT_ENCRYPTION_KEY
INTERNAL_API_KEY
ALLOW_UNAUTHENTICATED_WIDGET
DEVWALLET_BRIDGE_TOKEN
```

### Slack

```text
SLACK_BOT_TOKEN
SLACK_CLIENT_ID
SLACK_CLIENT_SECRET
SLACK_SIGNIN_CLIENT_ID
SLACK_SIGNIN_CLIENT_SECRET
SLACK_USER_SCOPES
SLACK_USER_OAUTH_CALLBACK_URL
SLACK_SIGNIN_CALLBACK_URL
SLACK_CHANNEL_ID
SLACK_LIST_ID
SLACK_LIST_COLUMNS_JSON
SLACK_LIST_COLUMN_TYPES_JSON
SLACK_ROUTES_JSON
```

### OpenAI

```text
OPENAI_API_KEY
OPENAI_MODEL
OPENAI_FALLBACK_MODEL
OPENAI_MAX_OUTPUT_TOKENS
OPENAI_REASONING_EFFORT
OPENAI_VECTOR_STORE_ID
```

### LiveChat/Text

```text
LIVECHAT_BASIC_TOKEN
LIVECHAT_BASIC_AUTH_TOKEN
TEXT_BASIC_TOKEN
```

### Configuracion Remota/Admin

```text
SUPPORT_REMOTE_CONFIG_JSON
SUPPORT_ADMIN_EMAILS
```

## 17. Despliegue Y Operacion

### Instalacion

```bash
cd "/Users/gerardocruz/Desktop/EXTENCION S:T Y BANCKEND/betxico-soporte/support-livechat-app"
npm install
```

### Verificacion Recomendada

```bash
npm run ai:test-support10-templates
npm run ai:test-auto-safe-templates
npm run check
```

`vercel dev` no siempre ha sido la ruta mas confiable en este repositorio. Para diagnostico rapido, priorizar las pruebas anteriores, `node --check`, imports y una preview real.

### Preview

```bash
npm run deploy:env
```

### Produccion

```bash
npm run deploy:env:prod
```

No desplegar automaticamente despues de modificar. Primero reportar:

- archivos modificados;
- pruebas ejecutadas;
- riesgos;
- diferencia entre local y produccion;
- confirmacion del usuario cuando el cambio sea sensible.

### Sincronizar Conocimiento OpenAI

```bash
npm run ai:sync-knowledge
```

Despues se debe configurar el nuevo `OPENAI_VECTOR_STORE_ID` y desplegar.

## 18. Scripts De IA Y Curacion

```text
npm run ai:extract-support10
npm run ai:curate-support10
npm run ai:integrate-support10
npm run ai:mine-flows
```

Objetivo:

- extraer conversaciones reales;
- detectar casos comunes;
- limpiar datos personales;
- proponer respuestas universales;
- aprobar antes de integrar;
- aumentar cobertura de plantillas sin depender siempre de OpenAI.

No cargar automaticamente respuestas reales sin revision. No incluir nombres, correos, AUTH IDs u otros datos sensibles en respuestas universales.

## 19. Estado Actual Al 2026-06-13

### Implementado

- Widget LiveChat/Text.
- Login por correo/PIN y Slack.
- Validacion remota de usuarios activos.
- Cuentas Jira individuales cifradas.
- Creacion y consulta Jira.
- Reportes y paneles Slack.
- Contexto de cliente.
- Asistente GPT estructurado.
- Base documental, intents y plantillas seguras.
- Fallback seguro antes de OpenAI.
- Webhook con auto-respuesta controlada.
- Alertas con confirmacion.
- Panel administrativo remoto.
- Inferencia DEVWALLET basada en Jira.

### Retirado O Movido

- Automatizacion local Paybridge/Atena para trazabilidad DEVWALLET.
- Lectura de resultados calculados desde `support:devwallet:results`.
- Cards generadas con la leyenda `Calculado con Paybridge + Atena`.
- Runner/LaunchAgent relacionado con `devwallet-automation`.

### Estado Git

Al crear este documento existen multiples cambios locales sin commit, incluyendo APIs, librerias, UI, pruebas y configuracion. Antes de modificar o desplegar:

```bash
git status --short
git diff --stat
```

No revertir cambios existentes sin confirmar su origen.

## 20. Riesgos Y Deuda Tecnica

1. `ALLOW_UNAUTHENTICATED_WIDGET=true` reduce proteccion. Es aceptable solo mientras la app sea privada y embebida; debe migrarse a validacion fuerte antes de hacerla publica.
2. Si `authorizedUsers` queda vacio, se habilita el comportamiento permisivo heredado.
3. La configuracion remota incorrecta puede afectar listas, rutas y automatizacion sin redeploy.
4. `traceability` sigue presente como legado aunque la automatizacion Paybridge/Atena fue retirada.
5. Las auto-respuestas requieren pruebas reales para evitar duplicados o respuestas fuera de contexto.
6. Los tokens por agente dependen de que `SUPPORT_ENCRYPTION_KEY` permanezca estable.
7. Cambiar `SUPPORT_SESSION_SECRET` cierra/invalida sesiones existentes.
8. Slack Lists puede cambiar esquemas/columnas y romper mapeos.
9. OpenAI puede alcanzar cuota o limites; las plantillas seguras deben cubrir lo basico.
10. No asumir que el codigo local ya esta desplegado.

## 21. Reglas Para Claude U Otro Asistente

Antes de trabajar:

1. Leer este documento.
2. Ejecutar `git status --short`.
3. Revisar los archivos relacionados antes de proponer cambios.
4. Confirmar si la solicitud afecta local, preview o produccion.
5. Mantener Jira como fuente canonica de DEVWALLET.
6. No reintroducir Paybridge/Atena.
7. No borrar paneles Slack al agregar uno nuevo.
8. No cambiar flujos existentes para resolver un caso aislado.
9. No revelar secretos.
10. No desplegar sin pruebas y autorizacion cuando el cambio sea sensible.

Durante la implementacion:

- Preferir cambios pequenos y verificables.
- Mantener APIs existentes antes de crear nuevas funciones.
- Agregar pruebas para matching, riesgo, autenticacion e idempotencia.
- Fallar de forma cerrada ante datos ambiguos.
- Evitar duplicar datos sensibles.
- Explicar claramente cualquier limitacion real.

Al terminar:

- Entregar archivos modificados.
- Entregar pruebas ejecutadas y resultados.
- Entregar riesgos pendientes.
- Indicar si el cambio esta solo local, en preview o en produccion.

## 22. Checklist De Primera Sesion Para Claude

```bash
cd "/Users/gerardocruz/Desktop/EXTENCION S:T Y BANCKEND/betxico-soporte/support-livechat-app"
git status --short
git diff --stat
npm run check
```

Despues revisar segun la tarea:

- UI: `public/app.js`, `public/index.html`, `public/styles.css`.
- Admin: `public/admin.js`, `public/admin.html`, `api/admin-config.js`.
- Jira: `lib/jira.js`, `api/jira-search.js`, `api/jira-metadata.js`.
- Slack: `lib/slack.js`, `api/slack-list-schema.js`, `api/slack-user.js`.
- GPT: `api/support-ticket.js`, `lib/safe-template-replies.js`, docs de conocimiento.
- LiveChat: `lib/livechat.js`, `api/livechat-webhook.js`.
- Acceso: `lib/account-store.js`, `lib/remote-config.js`.

Antes de tocar produccion:

```bash
npm run ai:test-support10-templates
npm run ai:test-auto-safe-templates
npm run check
```

## 23. Decision Tecnica Recomendada

La mejor ruta es seguir consolidando `support-livechat-app` como la superficie operativa central del equipo, mantener las respuestas basicas en plantillas seguras sin consumo OpenAI y utilizar GPT solamente para casos ambiguos o redaccion compleja.

La trazabilidad financiera profunda, Paybridge/Atena y otros procesos de backoffice deben permanecer en proyectos separados y exponer solamente resultados necesarios hacia soporte mediante contratos controlados. Esto reduce riesgo, evita mezclar permisos y mantiene el widget rapido.

