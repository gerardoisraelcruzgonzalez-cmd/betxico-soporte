# Evidencia de Atena y KYC para el orquestador

Actualizado: 2026-08-13

## Alcance

Esta integración incorpora dos herramientas de consulta de solo lectura:

- `case.atena.lookup`: estado operativo del cliente y retiros en Atena.
- `case.kyc.lookup`: identidad y verificación en KYC, consultando Usuarios KYC y Verificaciones.

Paybridge de transferencias no forma parte de este alcance. El dominio de KYC puede contener el nombre Paybridge porque así se llama el servicio donde vive KYC, pero el orquestador no consulta ni interpreta transferencias de Paybridge.

La revisión manual ya existente se conserva como una tercera evidencia independiente:

- `case.kyc-review.lookup`: resultado registrado por un agente humano.

## Flujo implementado

```text
caso de soporte
  -> crea o reanuda trabajo privado
  -> cola Redis/Upstash
  -> conector local con sesion persistente
  -> consulta real de solo lectura
  -> resultado completo en la cola
  -> normalizador minimo
  -> evidencia Atena o KYC
  -> decision determinista
  -> contexto redactado para IA
  -> borrador no ejecutable
  -> revision humana
```

Las consultas web no esperan tres minutos dentro de una sola funcion. Cada llamada espera hasta ocho segundos y, si el conector sigue trabajando, devuelve un estado reanudable. El panel consulta despues el mismo `jobId` cada dos segundos, hasta aproximadamente tres minutos. Ese seguimiento no repite Jira ni Slack Lista 8.

## Sobre de evidencia

Cada herramienta devuelve:

```json
{
  "tool": "case.atena.lookup",
  "mode": "read",
  "source": "atena",
  "status": "available | not_found | unavailable | stale",
  "verified": true,
  "checkedAt": "ISO-8601",
  "query": {
    "type": "email",
    "hash": "HMAC-SHA256"
  },
  "freshness": {
    "ttlSeconds": 300,
    "expiresAt": "ISO-8601"
  },
  "data": {},
  "error": null
}
```

El correo solo se usa dentro de la consulta privada. La evidencia y las trazas publicas contienen un HMAC irreversible. El `jobId` interno se elimina antes de responder al navegador.

## Evidencia permitida para IA

### Atena

- estado general del cliente;
- saldo y existencia de saldo;
- periodo consultado;
- retiro mas reciente: fecha, detalle, monto y estado normalizado;
- tres movimientos recientes.

Estados normalizados: `PAGADO`, `EN ANÁLISIS`, `AGUARDANDO APROBACIÓN`, `CANCELADO`, `SIN ESTADO`. Se aceptan variantes equivalentes en español y portugues.

### KYC

- coincidencias exactas totales y por fuente;
- estado general de los controles;
- verificaciones de selfie, documento, domicilio y prueba de vida;
- existencia de selfie, INE frontal e INE reverso;
- indicadores de duplicidad;
- categorias limitadas de riesgo;
- fecha y fuente.

No pasan al modelo: correo, nombre, telefono, CURP, numero de documento, biometria, imagenes, enlaces de documentos, cookies, contrasenas ni tokens.

## Reglas operativas

- `unavailable` no significa `not_found`.
- Un resultado vencido no respalda afirmaciones.
- Solo Atena puede respaldar el estado actual de un retiro.
- Un retiro `PAGADO` en Atena prevalece sobre un requisito historico de Jira o Lista 8.
- Jira y Slack Lista 8 pueden explicar antecedentes o motivos.
- KYC automatico puede identificar documentos faltantes, pero no sustituye la revision humana.
- KYC solo puede describirse como completo cuando los controles automaticos estan completos y existe una confirmacion humana vigente.
- Corregir el correo o ID elimina todas las evidencias anteriores y reinicia las consultas.
- El borrador siempre devuelve `requiresHumanReview: true` y `executable: false`.

## Variables

```text
CASE_EVIDENCE_HASH_SECRET
KV_REST_API_URL
KV_REST_API_TOKEN
OPENAI_API_KEY o GROQ_API_KEY
ATENA_CONNECTOR_TOKEN
KYC_CONNECTOR_TOKEN
```

`CASE_EVIDENCE_HASH_SECRET` se usa para correlacion tecnica y no debe exponerse al navegador. Si no existe, el servidor puede utilizar `SUPPORT_SESSION_SECRET`. Los tokens de conectores solo pertenecen a `claim` y `complete`; no se entregan al orquestador ni a la IA.

## Pruebas

El 2026-08-12 se aprobaron los 37 archivos del conjunto completo con `npm test`. Incluyen:

- ciclo `pending -> processing -> completed`;
- reanudacion sin trabajo duplicado;
- pertenencia del trabajo al agente;
- coincidencia exacta de correo;
- separacion de Usuarios KYC y Verificaciones;
- redaccion de identidad y documentos;
- diferencia entre error y ausencia;
- prioridad del estado actual de Atena;
- invalidacion por correccion de identidad;
- borrador real mediante adaptador de modelo;
- acciones sensibles bloqueadas o sujetas a aprobacion.

## Prueba real controlada

Comando:

```sh
CASE_TEST_EMAIL='correo-autorizado' \
CASE_TEST_OWNER_EMAIL='agente-autorizado' \
npm run test:evidence:e2e
```

El comando no imprime el correo y no realiza escrituras. Verifica trabajo, conector, resultado, evidencia, contexto de IA, borrador y controles de privacidad.

Resultado observado el 2026-08-13:

```text
trabajos creados
-> conectores recibieron los dos trabajos
-> Atena: pending -> processing -> completed, evidencia available
-> KYC: pending -> completed, evidencia available
-> KYC consulto Usuarios KYC y Verificaciones y encontro una coincidencia exacta
-> Atena normalizo el retiro actual como PAGADO
-> decision withdrawal_paid respaldada por Atena
-> borrador OpenAI gpt-5.4-mini uso evidencia de Atena y KYC
-> borrador sujeto a revision humana y marcado como no ejecutable
-> correo ausente de evidencia, prompt y borrador
-> imagenes y enlaces de documentos ausentes del contexto del modelo
-> cero escrituras
```

La prueba integral termino correctamente en 18 segundos. Demostro el recorrido real desde el correo del caso hasta los conectores autenticados, la normalizacion de evidencia, la decision, el borrador de IA y la barrera de revision humana. El envio final del borrador permanece pendiente de aprobacion humana por diseno.

## Escrituras

No se implementaron escrituras en Atena ni KYC. La integracion tampoco comenta Jira, publica Slack ni envia mensajes a LiveChat durante una consulta de evidencia. Las acciones existentes siguen su flujo separado de propuesta, aprobacion, ejecucion y verificacion humana.
