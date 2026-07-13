# Betxico Soporte - LiveChat App

App privada para mover el flujo de soporte fuera de una extension de Chrome.

La ruta recomendada es instalar esta app como widget interno de LiveChat Agent App y conectar el backend con Jira y Slack. La extension actual queda como referencia y respaldo, no como superficie principal de operacion.

## Que incluye este scaffold

- `public/index.html`: panel para el agente dentro de LiveChat con campos reales de Jira.
- `public/app.js`: lectura basica del perfil del cliente, carga de metadata de Jira y envio al backend.
- `api/support-ticket.js`: endpoint para crear ticket de Jira, reportar en Slack y registrar auditoria.
- `api/support-ticket.js?action=ai-chat`: endpoint interno para consultar GPT desde la app sin exponer la llave en el navegador.
- `api/support-ticket.js?action=game-sessions-close`: accion interna para cerrar sesiones BoB desde LiveChat reutilizando el backend de APP Betxico.
- `api/jira-metadata.js`: endpoint para leer tipos de incidencia y campos configurados en Jira.
- `api/livechat-webhook.js`: endpoint base para recibir eventos de LiveChat.
- `lib/jira.js`: cliente minimo para Jira Cloud.
- `lib/slack.js`: cliente para canales y Slack Lists con rutas por grupo/tipo de ticket.
- `docs/plan-soporte-livechat-app.md`: plan tecnico y operativo.
- `.env.example`: variables necesarias.

## Desarrollo local

```bash
npm install
npm run dev
```

En desarrollo puedes abrir:

```text
http://localhost:3000
```

Para LiveChat real, el widget debe publicarse en HTTPS y configurarse en Text Developer Console.

## Deploy recomendado

Usa Vercel para mantener la misma superficie operativa que el backend actual:

```bash
npx vercel
```

Configura las variables de entorno antes de probar tickets reales.

Para el widget instalado en LiveChat necesitas que Vercel tenga Jira y Slack. La forma segura es:

```bash
cp .env.vercel.example .env.vercel.local
```

Llena `.env.vercel.local` con los tokens reales sin subirlo ni pegarlo en chats. Luego despliega una preview con esas variables:

```bash
npm run deploy:env
```

Si quieres una URL estable para dejarla fija en Text Developer Console, usa produccion:

```bash
npm run deploy:env:prod
```

Puedes revisar si Vercel ya tiene todo sin revelar secretos en:

```text
/api/config-status
```

## Flujo de tickets Jira y Slack

El widget consulta Jira y muestra los tipos reales del proyecto `BTF`, por ejemplo `Servicio al Cliente`, `Transacciones`, `Pago a Clientes` y los demas tipos configurados. Al elegir un tipo, carga los campos editables de ese tipo. Al crear el ticket, el backend crea Jira y despues reporta el caso en Slack.

Campos que se llenan automaticamente cuando LiveChat los trae o cuando el agente ya los capturo:

- `Email Cliente`
- `AUTH ID:`
- `Nombre y Apellido del Cliente`
- `Amplify URL`
- `Resumen`
- `Descripcion`
- `Etiquetas`
- `Prioridad`
- `Informador`
- `Persona asignada`
- `Team`
- `Adjuntos`

Defaults operativos actuales:

- Tipo de incidencia: `Servicio al Cliente`
- Informador: `gerardo.cruz`
- Persona asignada: automatico con selector de usuarios de soporte
- Team: `Betxico - Servicio al Cliente`
- Prioridad: `Media`
- Descripcion: obligatoria
- Etiquetas: opcional

Slack se configura desde Vercel para no cambiar codigo cuando soporte use otros grupos o listas.

La configuracion operativa vive de forma remota en KV bajo `support:config`. Desde la app, los usuarios admin ven `Configuracion > Administracion remota` y pueden cambiar canales, listas, columnas y usuarios autorizados sin redeploy. Si no existe config remota, el backend usa las variables de Vercel como fallback.

Variables basicas para una sola ruta:

```text
SLACK_BOT_TOKEN=
SLACK_CHANNEL_ID=
SLACK_LIST_ID=
SLACK_LIST_COLUMNS_JSON={"summary":"Col...","customerEmail":"Col...","jiraUrl":"Col..."}
SLACK_LIST_COLUMN_TYPES_JSON={"Col...":"rich_text"}
```

Para varias rutas usa `SLACK_ROUTES_JSON`. El backend puede elegir ruta por tipo de Jira, grupo de LiveChat, prioridad o etiqueta:

```json
[
  {
    "id": "retiros",
    "name": "Retiros",
    "mode": "both",
    "match": {
      "issueTypes": ["Retiro no reflejado"],
      "groupIds": ["12"]
    },
    "channelId": "C0123456789",
    "listId": "F0123456789",
    "listColumns": {
      "summary": "Col...",
      "issueType": "Col...",
      "priority": "Col...",
      "customerEmail": "Col...",
      "authId": "Col...",
      "chatId": "Col...",
      "jiraKey": "Col...",
      "jiraUrl": "Col...",
      "status": "Col...",
      "createdAt": "Col..."
    },
    "listColumnTypes": {
      "Col...": "rich_text"
    }
  }
]
```

Campos soportados para `listColumns`: `summary`, `issueType`, `priority`, `customerName`, `customerEmail`, `authId`, `chatId`, `livechatGroupId`, `jiraKey`, `jiraUrl`, `status`, `description`, `createdAt`, `reporter`.

Para la lista actual de `DEPOSITO NO REFLEJADO`:

- Canal Slack: `C090D8TEVS6`
- Slack List: `F0AENAZPMFE`
- Columnas visibles: `ID`, `Correo`, `CLAVE DE RASTREO`, `MONTO`, `CEPY CAPTURA DE MOVIMIENTO`, `STATUS`, `DETALLE`, `agentes`, `TICKET EN JIRA`, `FECHA`

Campos soportados para esa lista: `customerId`, `customerEmail`, `trackingKey`, `amount`, `movementProof`, `status`, `description`, `agentName`, `jiraUrl`, `createdAt`.

Cuando `SLACK_BOT_TOKEN` ya este cargado, el endpoint tecnico para detectar IDs reales de columnas es:

```text
/api/slack-list-schema?listId=F0AENAZPMFE
```

Plantilla de configuracion remota:

```text
docs/support-remote-config.example.json
```

La lista de usuarios autorizados tambien es remota:

```json
{
  "authorizedUsers": [
    {
      "email": "agente@betxico.mx",
      "displayName": "Nombre Agente",
      "role": "agent",
      "enabled": true
    }
  ],
  "adminEmails": ["gerardo.cruz@betxico.mx"]
}
```

Si `authorizedUsers` esta vacio, el backend conserva el comportamiento anterior para no bloquear cuentas existentes. En cuanto agregues usuarios, solo esos correos podran crear/iniciar sesion.

La ruta recomendada para soporte es:

1. Mantener `SLACK_BOT_TOKEN` en Vercel.
2. Crear una Slack List por flujo operativo real, por ejemplo retiros, depositos, cuenta/KYC o escalaciones.
3. Copiar los IDs de columnas en `SLACK_ROUTES_JSON`.
4. Probar primero en preview con una lista de pruebas.
5. Pasar a produccion cuando Jira, mensaje de canal y fila de lista queden correctos.

El campo `Team` se manda con `JIRA_DEFAULT_TEAM_ID`, porque Jira Cloud no acepta el nombre visible del team en la API.

## Configuracion por agente

La app soporta sesion por agente:

- El agente entra en `Configuracion`.
- Crea/inicia sesion con correo y PIN.
- Guarda su Jira email y API token una sola vez.
- El token se guarda cifrado en KV/Redis usando `SUPPORT_ENCRYPTION_KEY`.
- La sesion queda en cookie HttpOnly firmada con `SUPPORT_SESSION_SECRET`.
- Al crear tickets, el backend usa las credenciales del agente activo.

Variables necesarias para este modulo:

```text
KV_REST_API_URL
KV_REST_API_TOKEN
SUPPORT_SESSION_SECRET
SUPPORT_ENCRYPTION_KEY
```

## Cierre remoto de sesiones BoB desde LiveChat

La accion rapida `Cerrar sesiones` no controla BoB directamente. La app de soporte manda el `AUTH ID` al backend existente de APP Betxico y ese backend ejecuta el flujo ya configurado de cierre de sesiones.

Variables necesarias:

```text
BETXICO_ASSISTANT_API_URL=https://tu-backend-betxico/api
BETXICO_ASSISTANT_ACCESS_TOKEN=SERVICE_API_TOKEN_de_APP_Betxico
```

Para pruebas locales con el backend de APP Betxico en `NODE_ENV=development`, tambien puedes usar:

```text
BETXICO_ASSISTANT_API_URL=http://127.0.0.1:8787/api
BETXICO_ASSISTANT_LOCAL_TOKEN=valor_de_LOCAL_BACKEND_TOKEN
```

Requisitos del backend APP Betxico:

- `ACTION_CLOSE_GAME_SESSIONS=true`.
- El token recomendado es `SERVICE_API_TOKEN` de APP Betxico; entra como integracion interna admin.
- `GAME_SESSION_RUNNER_DIR` y el runner de cierre deben seguir configurados en APP Betxico.
- El endpoint usado es `POST /api/game-sessions/close`; no se crea un segundo runner en esta app.

### Clientes de dispositivo (Raycast)

Raycast y otros clientes internos usan tokens personales revocables, no
`INTERNAL_API_KEY`. El cliente inicia sesion una vez con correo y PIN mediante
`POST /api/account-settings?action=device-auth`; el backend devuelve un token `btq_...` valido por 90
dias y guarda solamente su hash en KV.

- `POST /api/account-settings?action=device-auth`: crear token personal.
- `GET /api/account-settings?action=device-auth`: validar token actual.
- `DELETE /api/account-settings?action=device-auth`: revocar token actual.

Las peticiones posteriores envian `Authorization: Bearer btq_...`. Cada
peticion vuelve a validar que el usuario siga autorizado.

## Asistente GPT interno

La app incluye un panel `Asistente GPT` para que los agentes consulten dudas operativas, redacten respuestas para clientes o resuman el caso activo. La integracion vive dentro de `api/support-ticket.js?action=ai-chat` para que la llave no quede expuesta en el navegador y para no aumentar el numero de funciones serverless en Vercel.

Variables necesarias en Vercel:

```text
OPENAI_API_KEY
OPENAI_MODEL=gpt-5.4-mini
OPENAI_MAX_OUTPUT_TOKENS=900
OPENAI_REASONING_EFFORT=low
OPENAI_VECTOR_STORE_ID=
```

`OPENAI_MODEL`, `OPENAI_MAX_OUTPUT_TOKENS` y `OPENAI_REASONING_EFFORT` son opcionales. El default esta pensado para bajo costo y baja latencia en soporte.

La configuracion editable del asistente vive en `support:config.aiAssistant` y se administra desde `admin.html > Entrenamiento GPT`. Ahi se pueden cambiar instrucciones, tono, reglas de seguridad, formato y `vectorStoreId` sin redeploy.

Los ejemplos aprobados se guardan en KV bajo `support:ai:examples`. Los agentes tambien pueden guardar una respuesta como buena desde el widget o registrar que una respuesta fue incorrecta para revision posterior. En cada consulta, el backend selecciona solo ejemplos relevantes para no mandar todo el historial.

La base documental inicial esta en:

```text
docs/betxico-soporte-knowledge.md
docs/betxico_base_conocimiento_operativa_v1.md
docs/betxico_intents_dataset_v1.json
```

Para subirla a OpenAI Vector Store y guardar el ID en archivos locales ignorados:

```bash
npm run ai:sync-knowledge
```

Despues carga `OPENAI_VECTOR_STORE_ID` en Vercel y redeploya produccion.

Regla fuerte del asistente: antes de crear una respuesta debe consultar la base de conocimiento operativa; no debe crear diagnosticos nuevos si el caso puede pertenecer a un intent universal existente; debe usar subdiagnosticos y variantes para evitar duplicidad.

`docs/betxico_intents_dataset_v1.json` es el indice operativo para clasificacion rapida y deduplicacion de intents. No reemplaza File Search. El flujo recomendado es:

1. JSON de intents: decision rapida del intent universal, subdiagnostico y reglas criticas.
2. File Search MD: conocimiento profundo y politicas completas.
3. Ejemplos aprobados KV: estilo, respuestas buenas y casos reales validados.
4. Contexto del chat: datos actuales del cliente, ticket, Slack/Jira y ultimo mensaje.

En `api/support-ticket.js?action=ai-chat`, el asistente clasifica internamente cada consulta antes de devolver la respuesta sugerida. La salida visible para el agente se muestra como diagnostico probable, datos faltantes, riesgo, modo de uso y respuesta sugerida; no se muestra JSON crudo al cliente.

### Extraccion de respuestas reales de Soporte 10

Para ampliar la base del asistente sin fine-tuning ni gasto de tokens, existe un extractor local que revisa conversaciones de LiveChat atendidas por Soporte 10 y genera un documento de revision antes de cargar cualquier respuesta a KV o a la base documental.

Modo API, usando los ultimos 7 dias y el token de LiveChat configurado en el entorno:

```bash
npm run ai:extract-support10
```

Modo archivo local, usando un raw ya descargado:

```bash
npm run ai:extract-support10 -- --input tmp/livechat-search/livechat_archives_2026-06-03_0000_2313_raw.json
```

Salidas generadas en `tmp/livechat-response-mining/`:

- `revision_respuestas_*.md`: documento principal para revisar y aprobar.
- `respuestas_candidatas_*.json`: dataset estructurado para futura carga a intents/KV.
- `respuestas_candidatas_*.csv`: lectura rapida en hoja de calculo.
- `livechat_archives_*_raw.json`: raw descargado cuando se usa modo API.

El flujo no modifica `support:ai:examples`, `docs/betxico_intents_dataset_v1.json` ni la base MD. Primero se revisan las respuestas candidatas; despues, las respuestas universales aprobadas pasan a intents, los casos reales pasan a ejemplos KV y las reglas largas pasan a la base documental.

Para depurar esas candidatas y convertirlas en casos comunes universales antes de aprobarlas:

```bash
npm run ai:curate-support10
```

Tambien puedes pasar un archivo especifico:

```bash
npm run ai:curate-support10 -- --input tmp/livechat-response-mining/respuestas_candidatas_2026-05-28T15-11-58_2026-06-04T15-11-58_soporte-10.json
```

Esta fase genera:

- `tmp/livechat-response-mining/plantillas_curadas_soporte10_v1.md`
- `tmp/livechat-response-mining/plantillas_curadas_soporte10_v1.json`

El curador agrupa por casos comunes, propone hasta 20 plantillas universales, agrega arboles de decision, semaforo de riesgo y separa descartes/duplicados. Tampoco carga nada al asistente sin aprobacion.

Para integrar respuestas ya aprobadas sin tocar KV ni produccion, primero corre el dry-run:

```bash
npm run ai:integrate-support10 -- --dry-run
```

Esto genera `tmp/livechat-response-mining/integration_dry_run_soporte10_v1.md` y muestra que cambiaria. Para aplicar solo archivos locales:

```bash
npm run ai:integrate-support10 -- --apply
```

La integracion local actualiza `docs/betxico_intents_dataset_v1.json`, crea/actualiza `docs/betxico_fallback_templates_v1.json` y agrega la seccion `Curación Soporte 10 V1` en `docs/betxico_base_conocimiento_operativa_v1.md`. No escribe en KV salvo que se ejecute explicitamente con `--apply-kv`.

Para probar los mensajes base antes de usarlo:

```bash
npm run ai:test-support10-templates
```

Usuarios disponibles en el selector de asignacion:

- Blanca Azucena Gutierrez Hernandez
- Patricio Maldonado
- Ivonne Cruz Rodriguez
- anahy.haro
- adriana.lobato
- gerardo.cruz
- patricio.garza
- Montserrat Quirarte
- Valeria Garza Salazar
- luis.salazar
- Pedro Salazar Arreozola
- Admin Betxico

## Siguiente paso manual obligatorio

En Text Developer Console:

1. Crear una app privada.
2. Agregar `LiveChat Widgets`.
3. Usar como Widget source URL la URL desplegada de `public/index.html`.
4. Elegir placement `Details section`.
5. Instalar en `Private installation`.
6. Opcional: agregar `Chat Webhooks` apuntando a `/api/livechat-webhook`.

Checklist detallado: `docs/livechat-console-checklist.md`.
