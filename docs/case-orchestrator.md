# Case Orchestrator V1

## Objetivo

El Case Orchestrator convierte los eventos de LiveChat en un expediente operativo por `chatId`. La primera version solamente observa, clasifica y propone el siguiente paso. No envia respuestas nuevas ni ejecuta acciones sensibles.

## Alcance de la primera fase

- Conserva mensajes de cliente y agente recibidos por webhook.
- Deduplica eventos repetidos.
- Redacta correos dentro del texto, CLABE completas y credenciales.
- Clasifica once familias operativas.
- Calcula riesgo, datos faltantes, revisiones internas y siguiente accion.
- Conserva una maquina de estados por chat.
- Registra el expediente en KV con retencion de 180 dias.
- Usa un bloqueo corto por chat para evitar escrituras concurrentes.
- Si el orquestador falla, el flujo previo del webhook continua.

## Fuera de alcance

- Enviar una respuesta generada al cliente.
- Consultar Atena, KYC, Paybridge, BoB, First Sports o proveedores.
- Crear o modificar Jira desde el orquestador.
- Ejecutar cierres de sesiones.
- Aprobar dinero, documentos, identidad, CLABE o cierres de cuenta.
- Marcar un caso como resuelto automaticamente.

## Estados

```text
new
identified
classified
waiting_evidence
investigating
waiting_customer
waiting_approval
escalated
resolved
```

`resolved`, `escalated`, `waiting_customer` y las acciones de aprobacion quedan reservados para fases posteriores con resultados verificados.

## Flujos reconocidos

| Flujo | Riesgo base | Aprobacion humana |
|---|---|---|
| `game_access` | Medio | Si |
| `casino_win_missing` | Alto | Si |
| `sports_bet` | Alto | Si |
| `withdrawal` | Alto | Si |
| `kyc_identity` | Alto | Si |
| `bank_account` | Alto | Si |
| `deposit` | Alto | Si |
| `bonus_rollover` | Medio | Si |
| `devwallet` | Alto | Si |
| `account_closure` | Alto | Si |
| `ticket_followup` | Bajo | No para lectura |

Los mensajes que no coinciden permanecen en `unknown` y solicitan aclaracion.

## Expediente

La clave de almacenamiento es:

```text
support:case:v1:<chatId>
```

Campos principales:

```json
{
  "schemaVersion": 1,
  "chatId": "",
  "state": "waiting_evidence",
  "customer": {
    "liveChatCustomerId": "",
    "authId": "",
    "email": "",
    "name": ""
  },
  "workflow": {
    "id": "withdrawal",
    "category": "withdrawals",
    "confidence": 0.85,
    "riskLevel": "high",
    "requiresHumanApproval": true
  },
  "facts": {},
  "systemFacts": {},
  "events": [],
  "missingData": [],
  "pendingChecks": [],
  "nextAction": {},
  "decisionHistory": [],
  "automation": {
    "mode": "suggest_only",
    "canSendAutomatically": false,
    "canExecuteSensitiveAction": false,
    "requiresVerifiedToolResult": true
  }
}
```

## Integracion con LiveChat

`api/livechat-webhook.js` conserva el flujo anterior y, adicionalmente:

1. Extrae mensajes de cliente y agente.
2. Actualiza el expediente.
3. Registra estado, flujo y riesgo en auditoria.
4. Devuelve solamente un resumen sin identidad ni mensajes.
5. Atrapa cualquier error del orquestador para no bloquear LiveChat.

La respuesta automatica de plantillas seguras sigue siendo independiente. El orquestador no la amplia ni cambia su politica.

## Seguridad

- Los textos almacenados reemplazan correos por `[EMAIL_REDACTED]`.
- Las secuencias de 18 digitos se reemplazan por `[CLABE_REDACTED]`.
- Password, contrasena, token, NIP o PIN con valor se reemplazan por `[CREDENTIAL_REDACTED]`.
- El resumen publico no contiene cliente, eventos ni hechos internos.
- La politica de automatizacion esta fijada en `suggest_only`.
- Cualquier flujo financiero, KYC, cuenta bancaria o cierre exige aprobacion humana.

## Validacion

Ejecutar:

```bash
node scripts/test-case-orchestrator.mjs
npm run check
node scripts/test-auto-safe-templates.mjs
node scripts/test-support10-template-integration.mjs
```

Las pruebas cubren los once flujos, roles de mensajes, idempotencia, redaccion, resumen publico, prohibicion de autoacciones y continuidad del webhook cuando el expediente no puede persistirse.

## Limitaciones conocidas

- La clasificacion V1 usa reglas deterministas; un mensaje ambiguo se mantiene en `unknown`.
- El expediente recibe solamente eventos entregados por el webhook; todavia no realiza sincronizacion retrospectiva con `get_chat`.
- Los chequeos de sistemas son una lista pendiente, no llamadas reales.
- KV permite persistencia operativa, pero una fase posterior debe agregar historial consultable y metricas duraderas.
- Antes de depender del webhook para automatizacion de produccion debe validarse su secreto o firma de origen.

## Siguiente fase

La siguiente fase debe exponer el expediente al widget y conectar herramientas de solo lectura:

1. Jira: ticket principal, duplicados y estado.
2. BoB: sesiones y `Pending Win`.
3. Atena: movimientos, deposito y retiro.
4. KYC/Paybridge: estado y diferencias, sin modificar datos.

Los resultados deben escribirse como `systemFacts` con fuente y fecha. Solamente despues de validar esos contratos se habilitan propuestas de acciones o aprobaciones.
