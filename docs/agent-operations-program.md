# Programa de Agente Operativo para Soporte

## Objetivo

Convertir el expediente de LiveChat en un asistente operativo supervisado que pueda:

1. Observar la conversacion y clasificar el caso.
2. Consultar fuentes autorizadas y guardar resultados verificables en el expediente.
3. Detectar y registrar adjuntos sin exponer documentos sensibles a modelos externos.
4. Proponer el siguiente paso y una respuesta para el cliente.
5. Solicitar aprobacion humana antes de cualquier escritura o accion sensible.
6. Ejecutar acciones aprobadas una sola vez, comprobar su resultado y solamente despues preparar la respuesta final.
7. Probar el mismo recorrido en un simulador privado sin crear un chat de LiveChat.

El programa no autoriza al modelo a aprobar retiros, validar identidad, modificar KYC, cambiar cuentas bancarias o prometer resultados no confirmados.

## Definicion de terminado

El programa se considera terminado cuando:

- Cada chat mantiene un expediente idempotente y trazable.
- Jira, Slack y cualquier fuente KYC autorizada exponen herramientas de consulta con resultado, fuente y fecha.
- Los adjuntos de LiveChat se detectan y se manejan con una politica explicita de privacidad.
- Las acciones de escritura requieren una aprobacion atribuible a un agente autenticado.
- Cada ejecucion usa una clave idempotente y conserva solicitud, aprobacion, resultado y verificacion.
- Ninguna respuesta comunica una aprobacion, pago o correccion hasta que la fuente correspondiente lo confirme.
- La aplicacion sigue operativa cuando la IA o una integracion externa falla.
- Las pruebas unitarias, de integracion simulada, de fallas y el recorrido de preview pasan.
- Existe documentacion de operacion, privacidad, recuperacion y activacion/desactivacion.
- El simulador permite alternar entre cliente, agente y respuesta de la app sin escribir en LiveChat.
- La activacion real queda protegida por configuracion remota o bandera y no se habilita sin evidencia del piloto.

## Reglas no negociables

- Lecturas y escrituras son herramientas distintas.
- El modelo propone; el backend autoriza y ejecuta.
- INE, selfies y documentos KYC no se envian a un proveedor gratuito de IA.
- KYC se mantiene manual hasta contar con un contrato API autenticado, autorizado y probado.
- Las lecturas de Slack Lists no se reactivan por chat; deben pasar por sincronizacion controlada y cache.
- Toda accion financiera, de identidad, bancaria o de cuenta requiere aprobacion humana.
- Los mensajes al cliente se basan en resultados verificados, no en la intencion de una accion.
- Produccion no cambia durante la construccion; primero se valida en preview con controles desactivados por defecto.

## Arquitectura objetivo

```text
LiveChat webhook
  -> expediente por chat
  -> clasificacion y datos faltantes
  -> herramientas de consulta
       Jira
       cache sincronizada de Slack Lista 8
       estado KYC de solo lectura, si existe API autorizada
  -> hechos verificados con fuente y fecha
  -> propuesta de plan y respuesta
  -> politica de riesgo
       bajo: sugerencia
       medio/alto: aprobacion humana
  -> ejecutor idempotente
       comentario Jira
       alta/mensaje Slack
       mensaje LiveChat
  -> verificador de resultado
  -> auditoria y estado final
```

## Fases

### Fase 0 - Linea base y contratos

Estado: COMPLETA EN LOCAL

- Inventariar capacidades actuales y dependencias.
- Definir contratos para hechos, herramientas, propuestas, aprobaciones, ejecuciones y verificaciones.
- Definir matriz de riesgo y permisos.
- Confirmar contratos reales de LiveChat, Jira, Slack y KYC antes de escribir conectores.
- Mantener un simulador para proveedores no disponibles durante desarrollo.

Criterio de salida:

- Contratos documentados y cubiertos por pruebas.
- Ninguna llamada externa necesaria para ejecutar la suite local.

### Fase 1 - Consultas y expediente enriquecido

Estado: COMPLETA EN LOCAL; SINCRONIZACION REAL DE LISTA 8 PENDIENTE

- Conectar Jira de solo lectura al expediente.
- Mantener Slack Lista 8 (`F0BS8SERTNE`) como fuente activa y Lista 7 (`F0BNV1FR02J`) como cache historica separada.
- Registrar `systemFacts` con fuente, fecha, estado y evidencia minima.
- Aplicar tiempos de expiracion y estados `available`, `not_found`, `unavailable` y `stale`.

Criterio de salida:

- Un retiro simulado encuentra o descarta Jira y Slack sin llamadas duplicadas.
- Una fuente caida no bloquea LiveChat ni se interpreta como `sin registro`.

### Fase 2 - Adjuntos y evidencia

Estado: COMPLETA EN LOCAL

- Detectar eventos de archivo en LiveChat.
- Guardar solamente metadatos necesarios y referencias seguras.
- Validar tipo, tamano y procedencia.
- Separar `archivo recibido` de `documento revisado`.
- Mantener INE, selfie y comprobantes fuera del proveedor de IA.

Criterio de salida:

- El expediente distingue texto, imagen y archivo, deduplica eventos y no filtra URLs sensibles en respuestas publicas o logs.

### Fase 3 - Propuestas y aprobaciones

Estado: COMPLETA EN LOCAL

- Generar un plan estructurado a partir de hechos verificados.
- Mostrar al agente datos utilizados, acciones propuestas y respuesta sugerida.
- Crear aprobaciones con agente, fecha, alcance y vencimiento.
- Rechazar aprobaciones antiguas o que no coincidan con el estado actual.

Criterio de salida:

- Ninguna escritura puede ejecutarse sin aprobacion valida.
- Cambiar los datos del caso invalida la aprobacion anterior.

### Fase 4 - Ejecucion y verificacion

Estado: IMPLEMENTADA EN LOCAL; PROVEEDORES REALES PENDIENTES

- Comentar Jira con confirmacion humana.
- Crear registro o mensaje Slack con confirmacion humana.
- Enviar respuesta LiveChat despues de verificar las acciones requeridas.
- Aplicar claves idempotentes, reintentos controlados y conciliacion.

Criterio de salida:

- Repetir una solicitud no duplica comentarios, registros ni mensajes.
- Un resultado ambiguo queda en `verification_pending` y no se anuncia como exitoso.

### Fase 5 - Panel operativo

Estado: COMPLETA EN LOCAL

- Exponer estado, hechos, faltantes y siguiente paso dentro del panel.
- Mantener acciones sensibles como controles explicitos.
- Mostrar fuente y antiguedad de cada dato.
- Incluir un interruptor administrativo para detener toda automatizacion.

Criterio de salida:

- El flujo completo cabe y funciona dentro del panel real de LiveChat.
- El agente puede continuar manualmente si una integracion falla.

### Fase 6 - Pruebas, preview y piloto

Estado: PREVIEW VALIDADA; PILOTO CON JIRA Y LISTA 8 DISPONIBLES PENDIENTE

- Probar casos normales, duplicados, limites, expiraciones, caidas y respuestas invalidas.
- Probar inyeccion de instrucciones y escalamiento de permisos.
- Validar privacidad y ausencia de datos sensibles en llamadas al modelo y logs.
- Ejecutar un recorrido de preview con datos ficticios o censurados.
- Activar para uno o dos supervisores antes de ampliar acceso.
- Recorrer como cliente y como agente la misma conversacion aislada.

Criterio de salida:

- Evidencia de pruebas y recorrido registrada en este documento.
- Sin fallas abiertas de severidad alta o critica.

### Fase 7 - Activacion controlada

Estado: PENDIENTE

- Preparar manual operativo, recuperacion y rollback.
- Activar capacidades por separado.
- Monitorear errores, tiempos, limites y acciones rechazadas.
- Conservar modo manual y apagado inmediato.

Criterio de salida:

- Activacion confirmada con evidencia de produccion y posibilidad de desactivar sin desplegar codigo.

## Linea base

Fecha: 2026-08-11

- Repositorio: `support-livechat-app`
- Rama: `main`
- Commit inicial: `5eb7303`
- Arbol de trabajo inicial: limpio
- `npm run check`: correcto
- `node scripts/test-case-orchestrator.mjs`: 20 pruebas correctas
- `node scripts/test-auto-safe-templates.mjs`: correcto
- `npm run ai:test-provider`: correcto; valida el adaptador local, no una consulta real al proveedor
- Slack Lists: lecturas pausadas en la app de soporte
- Orquestador: observa, clasifica y propone; no ejecuta acciones sensibles
- IA Groq/OpenAI: ruta de borradores existente, restringida a administrador y sin herramientas operativas
- KYC: abre busquedas por correo; no existe escritura automatizada autorizada

## Registro de decisiones

### D-001 - Agente supervisado

Se adopta un agente supervisado. Las consultas pueden automatizarse; las escrituras requieren aprobacion y las decisiones financieras o de identidad permanecen humanas.

### D-002 - Slack Lista 8 mediante sincronizacion y cache

No se restauraran consultas directas por chat. El expediente leera exclusivamente la cache de Lista 8, actualizada mediante una sincronizacion administrativa controlada.

### D-003 - Documentos de identidad fuera de IA gratuita

El modelo puede saber que existe un adjunto y recibir una clasificacion humana, pero no recibira el archivo ni su contenido.

### D-004 - Verificacion antes de comunicar

Una respuesta al cliente solamente puede afirmar el resultado que una fuente haya confirmado. `Enviado a revision` y `aprobado` son estados diferentes.

### D-005 - Aprobacion independiente

Cuando un agente humano propone una escritura, ese mismo correo no puede aprobarla. La propuesta conserva contenido exacto, destino, revision del expediente y vencimiento.

### D-006 - Recuperacion sin reenvio

Una accion detenida en `executing` se concilia leyendo Jira, Slack o LiveChat. La recuperacion nunca vuelve a ejecutar la escritura. Una accion con referencia externa pero sin confirmacion queda en `verification_pending`.

### D-007 - IA solo para borradores

El proveedor recibe una proyeccion redactada: mensajes del cliente sin identidad conocida, fuentes vigentes, estados de fuentes no vigentes y metadatos de evidencia sin URLs ni contenido. El resultado siempre requiere revision humana y no es ejecutable.

### D-008 - Jira por credencial del agente

Las busquedas del expediente y el buscador global usan el correo y token Jira del agente autenticado. Un token ausente, vencido o cifrado con una llave anterior no bloquea el inicio de sesion: la cuenta entra como `Jira sin configurar` y puede guardar un token nuevo.

### D-009 - Variables sensibles de Vercel

Los valores marcados como `Sensitive` no pueden recuperarse para clonarlos: `vercel env pull` entrega `[REDACTED]`. El despliegue omite esos marcadores. La preview usa sus variables remotas de sesion y KV, las credenciales Jira por agente y solamente las credenciales locales explicitamente disponibles.

### D-010 - Simulador privado aislado

El simulador usa los mismos clasificadores, consultas, borradores, reglas de respuesta, adjuntos y contratos de aprobacion que el flujo final, pero nunca llama a LiveChat. Sus casos y acciones usan espacios KV separados y vencen a las 24 horas. Solamente el administrador incluido en `SUPPORT_SIMULATOR_ALLOWED_EMAILS` puede entrar.

La interfaz expone una traza operativa, no el razonamiento oculto del modelo. Cada turno muestra la identidad utilizada, clasificacion, consultas de Jira/Slack/KYC, resultado recibido, rama seleccionada y siguiente paso. Una fuente `unavailable` o `stale` no detiene la conversacion y tampoco se interpreta como ausencia.

Una correccion explicita como `me equivoque de correo, el correcto es...` sustituye la identidad, invalida los resultados anteriores y repite las consultas. El historial conserva que la ruta anterior fue reemplazada. Cada llamada de IA suma proveedor, modelo, tokens de entrada/salida y costo estimado por conversacion, sin guardar razonamiento privado del modelo.

En modo `Cliente`, cada mensaje actualiza el expediente, consulta Jira, cache Slack y KYC, genera el borrador y muestra una respuesta segura de la app. En modo `Agente`, el mensaje se agrega manualmente y no produce una respuesta automatica adicional. Ambos tipos quedan diferenciados en la conversacion.

Los archivos seleccionados se muestran en el navegador para revision humana. El servidor conserva solamente nombre seguro, tipo, tamano, identificador y estado de revision; no guarda el contenido del documento ni lo envia al proveedor de IA.

Las escrituras reales del simulador estan apagadas por defecto. Para activarlas se requieren simultaneamente la bandera de escritura, un ticket Jira o ruta Slack autorizados, una propuesta aprobada, el PIN personal ingresado de nuevo y la frase exacta `EJECUTAR PRUEBA REAL`. Todo mensaje de prueba lleva la marca `SIMULADOR CONTROLADO - NO OPERAR` y despues se comprueba leyendo al proveedor.

## Controles de activacion

- `SUPPORT_AGENT_MODE=off`: desactiva el expediente asistido.
- `SUPPORT_AGENT_MODE=observe`: conserva observacion sin acciones.
- `SUPPORT_AGENT_MODE=suggest`: habilita expediente y borradores; es el valor seguro para preview.
- `SUPPORT_AGENT_MODE=approved_actions`: permite ejecutar solamente propuestas aprobadas.
- `SUPPORT_SLACK_LIST_READS_ENABLED=false`: impide consultas directas de listas desde los chats.
- `SUPPORT_SLACK_LIST_SYNC_ENABLED=false`: impide sincronizaciones administrativas de cache.
- `SUPPORT_LEGACY_AUTO_SAFE_SEND_ENABLED=false`: impide respuestas automaticas heredadas.
- `ALLOW_UNAUTHENTICATED_WIDGET=false`: exige sesion valida en el panel.
- `SUPPORT_SIMULATOR_ENABLED=true`: habilita la pagina privada `/simulator.html`.
- `SUPPORT_SIMULATOR_KNOWLEDGE_ENABLED=true`: habilita el manual estructurado solamente dentro del simulador.
- `SUPPORT_SIMULATOR_ALLOWED_EMAILS=gerardo.cruz@betxico.mx`: limita el acceso al simulador.
- `SUPPORT_SIMULATOR_REAL_ACTIONS_ENABLED=false`: mantiene apagadas las escrituras reales.
- `SUPPORT_SIMULATOR_JIRA_KEYS=`: tickets de prueba permitidos para comentarios reales.
- `SUPPORT_SIMULATOR_SLACK_ROUTES=`: rutas de prueba permitidas para mensajes reales.

La sincronizacion manual de Slack sigue disponible en `POST /api/slack-list-schema` con `panelId=revision` para administradores; `revision-7` conserva la lista historica. Adicionalmente, `/api/slack-list-cron` refresca Lista 8 cada cuatro minutos y Lista 7 solo cuando vence su ventana de 24 horas, usando `CRON_SECRET`. Ambos procesos aplican bloqueo y enfriamiento, detienen el proceso ante el primer `429` y conservan cobertura `complete` o `partial`. La consulta operativa usa Lista 8; Lista 7 se muestra como antecedente y no reemplaza el estado actual.

### D-011 - Jira y Lista 8 antes de KYC

En casos de retiro, el flujo consulta primero Jira y la cache de Lista 8 aunque todavia falten monto o fecha. KYC solo se consulta si una fuente verificada identifica una causa de identidad o si el cliente abrio directamente un caso KYC. Un retiro no encontrado no se convierte automaticamente en KYC.

## Bitacora de continuidad

### 2026-08-11 - Inicio

- Se fijo la linea base y se ejecutaron las pruebas existentes.
- Se inicio una auditoria paralela de LiveChat/adjuntos, Jira/Slack y seguridad/aprobaciones.
- Siguiente paso: consolidar los hallazgos, cerrar la Fase 0 y crear los contratos de dominio con pruebas.

### 2026-08-11 - Pausa solicitada por el usuario

- No se publico nada en preview ni en produccion.
- Se detuvieron los tres subagentes y no deben continuar hasta que el usuario reanude la tarea.
- Ya existen contratos y pruebas para consultas de Jira y cache de Slack, metadatos seguros de adjuntos, propuestas, aprobaciones de un solo uso, ejecucion idempotente, verificacion posterior, control de acceso, webhook autenticado, limites de intentos de acceso y auditoria redactada.
- La busqueda directa a Slack Lists desde la app sigue pausada; el expediente solo consulta cache para no volver a provocar rate limit.
- Antes de la pausa pasaron las pruebas de acceso al widget, almacén de acciones y ejecutor. La ultima prueba confirmada del ejecutor fue de 6 casos y la del almacen de 6 casos.
- Ultima edicion realizada y TODAVIA NO VALIDADA: se agrego soporte para reintentar solamente la verificacion de una accion ya ejecutada, sin volver a enviarla, y se comenzo el registro de revision humana de adjuntos.
- Archivos de la ultima edicion pendiente de validar: `lib/case-action-executor.js`, `lib/case-action-store.js`, `lib/case-orchestrator.js`, `api/support-ticket.js`, `scripts/test-case-action-executor.mjs` y `scripts/test-case-action-store.mjs`.
- Riesgo inmediato al reanudar: revisar sintaxis y forma de la propiedad `reviewedAt` en `operationalCaseView`, terminar pruebas de revision de evidencia y conectar las nuevas rutas al panel antes de avanzar con IA o Slack.
- Siguiente paso exacto: ejecutar validacion de sintaxis de los seis archivos anteriores; corregir cualquier fallo; agregar pruebas de `reviewCaseEvidence`; probar `case-action-verify`; despues continuar con el borrador de IA redactado y la sincronizacion controlada de cache Slack.

### 2026-08-11 - Reanudacion y cierre de implementacion local

- Se validaron y conectaron consultas exactas por identidad para Jira y cache de Slack.
- La cobertura de Slack distingue panel faltante y lista truncada. Ninguna cobertura parcial produce `not_found` verificado.
- Se agrego revision humana de evidencia y se eliminaron descargas del navegador desde URLs pegadas o arrastradas.
- Se agregaron propuestas inmutables, aprobacion independiente, ejecucion de un solo uso, verificacion exacta y conciliacion sin reenvio para Jira, Slack y LiveChat.
- La ruta directa de comentario Jira y el envio directo LiveChat ya no omiten el flujo supervisado.
- Se agrego generacion de borrador con Groq u OpenAI sobre un expediente redactado. No recibe URLs ni contenido de documentos y no puede ejecutar acciones.
- El webhook limita el cuerpo a 512 KB, rechaza replays, guarda una proyeccion redactada de hasta 20 mensajes y reduce la retencion a 30 dias.
- Se agrego sincronizacion administrativa de una lista Slack por vez, apagada por defecto, con bloqueo y cooldown.
- El panel recupera acciones activas, muestra contenido exacto, evidencia y borrador, y permite reintentar verificacion o conciliar una ejecucion interrumpida.
- `npm test`: 19 archivos de pruebas aprobados antes del ajuste Jira; despues se agrego una prueba especifica de credenciales por agente.
- `npm run check`: aprobado.
- No se desplego preview ni produccion.
- Los pendientes de esta entrada se completaron en la validacion y preview documentadas a continuacion.

### 2026-08-11 - Validacion visual, proveedores y preview

- El panel se probo a 400 x 900 y 320 x 900 px con expediente, Jira, Slack obsoleto, dos evidencias, borrador y accion supervisada. No se detectaron solapamientos ni texto ilegible.
- El borrador se probo una vez contra OpenAI con un expediente sintetico sin identidad ni archivos. El resultado exigio revision humana y regreso `executable=false`.
- LiveChat respondio 200 en una consulta real de solo lectura y KV respondio 200. No se envio ningun mensaje ni se modifico un chat.
- Las busquedas Jira ahora reciben las credenciales del agente autenticado. Se agrego una prueba que confirma URL y autenticacion por cuenta sin exponer el token.
- Si una credencial Jira cifrada no puede abrirse con la llave activa, deja de bloquear el acceso y se presenta como no configurada.
- Slack Lists permanece en modo cache. No se hizo una consulta directa ni una sincronizacion real para no volver a provocar rate limit.
- `npm audit fix --omit=dev` elimino la vulnerabilidad alta de `brace-expansion`. Permanece una advertencia moderada de `uuid` heredada por `exceljs`; la unica correccion automatica propuesta baja ExcelJS a una version incompatible y no se aplico.
- Preview final: `https://support-livechat-gpk85l3o3.vercel.app`, deployment `dpl_7qQRJhQFk1E4bgqC8f3SaifkE4um`, target `preview`, estado `READY`.
- La preview fuerza `SUPPORT_AGENT_MODE=suggest`, `ALLOW_UNAUTHENTICATED_WIDGET=false`, lecturas y sincronizacion Slack apagadas y envios automaticos heredados apagados.
- Produccion no fue desplegada ni promovida.
- Siguiente paso: iniciar sesion en la preview con una cuenta de supervisor, volver a guardar el token Jira si aparece como no configurado y recorrer un chat real sin ejecutar acciones. La activacion `approved_actions` queda fuera hasta completar ese piloto con aprobador independiente.

### 2026-08-11 - Acceso normal y simulador privado

- Se elimino la pantalla de mantenimiento, su PIN global, el registro de visitas y las rutas que lo consultaban. Se conservaron el acceso normal por correo y PIN de agente, el inicio con Slack y sus controles de sesion.
- Se integraron al expediente la revision KYC humana, la politica que bloquea afirmaciones finales sin fuente vigente y los hechos de acciones ya verificadas.
- Se creo `/simulator.html` como superficie privada independiente de LiveChat. Permite iniciar un cliente con correo, nombre y AUTH ID, conversar, adjuntar evidencia, revisar Jira, cache Slack y KYC, y alternar entre mensajes de Cliente y Agente.
- Los mensajes de Cliente activan la respuesta de la app. Los mensajes de Agente son manuales y se bloquean si afirman aprobacion, pago, correccion o resolucion sin evidencia vigente.
- Los casos y acciones del simulador usan espacios KV separados, vencen en 24 horas y se limitan al propietario autenticado.
- Las acciones Jira y Slack requieren propuesta, aprobacion, destino permitido, frase exacta, reingreso del PIN y verificacion posterior. Las escrituras permanecen apagadas por defecto.
- La revision visual controlada paso en 1440 x 900 y 390 x 844. Se recorrieron inicio, mensaje de cliente con respuesta de la app, mensaje manual de agente, adjunto, revision de evidencia, propuesta, aprobacion y ejecucion simulada verificada.
- La prueba automatica de fronteras confirma que el endpoint del simulador no importa ni invoca el cliente de LiveChat, usa almacenes separados, exige mismo origen y vuelve a autenticar el PIN antes de escribir.
- `npm test`: 28 archivos de pruebas aprobados, incluidos el selector Cliente/Agente, la separacion entre mensajes de la app y del agente, el bloqueo de afirmaciones sin evidencia, el aislamiento de LiveChat y la consolidacion de rutas API.
- `npm run check`: aprobado despues de integrar el simulador.
- Las rutas publicas de acceso y Jira conservan sus direcciones, pero comparten funciones internas para mantener el despliegue dentro del limite de 12 funciones de Vercel Hobby.
- El modo de mantenimiento ya no tiene codigo activo. El antiguo dato KV de visitas no se elimina todavia porque la version de produccion anterior podria volver a crearlo hasta que sea reemplazada.
- Preview del simulador: `https://support-livechat-qkoks1p0l.vercel.app/simulator.html`, deployment `dpl_EQ89iWYK4A47BvZh9DHTWkm9oDuG`, target `preview`, estado `READY`.
- Alias estable para el piloto: `https://support-livechat-preview-gerardo.vercel.app/simulator.html`.
- La preview mantiene escrituras reales apagadas, no consulta Slack directamente y no envia mensajes a LiveChat.
- Una captura del navegador del 2026-08-11 11:19 confirma que el alias abre el formulario normal de correo/PIN y Slack del simulador, sin pantalla de mantenimiento.
- La comprobacion externa con bypass de Vercel obtuvo `200` para el simulador y encontro los controles `Cliente` y `Agente` en el HTML publicado.
- El endpoint del simulador responde `403 simulator_same_origin_required` sin origen, `401 login_required` con origen valido pero sin sesion, y la ruta publica reescrita de Jira tambien responde `401 login_required` sin sesion.
- Falta la evidencia del piloto autenticado: iniciar sesion como Gerardo, crear un caso, verificar consultas reales y recorrer ambos roles. No se considera completada la fase LiveChat hasta registrar esa prueba.
- Siguiente paso exacto: iniciar sesion como Gerardo en la preview, comprobar una conversacion con consultas reales y despues definir un ticket Jira y una ruta Slack exclusivos para el piloto de escritura.

### 2026-08-11 - Motor de decisiones y alcance exclusivo Lista 8

- Se adapto el catalogo operativo para que un retiro consulte Jira y Lista 8 antes de pedir monto, fecha o documentos.
- Se agregaron rutas verificables para requisito KYC, rechazo bancario, revision Wallet, incidencia tecnica, motivo de retencion, seguimiento Jira, conflicto de fuentes, fuente no disponible y retiro sin coincidencia.
- KYC se consulta solamente cuando la ruta confirmada lo requiere. Una respuesta de Jira o Lista 8 sin causa KYC no abre ese flujo.
- Corregir correo o AUTH ID invalida Jira, Lista 8, KYC y Atena, conserva el cambio en la traza y repite las consultas con la identidad nueva.
- La IA recibe la ruta determinista y se bloquea cualquier solicitud de INE, selfie, estado de cuenta o comprobante de domicilio sin causa KYC y revision humana vigentes.
- La interfaz muestra resultado, estado, motivo, fuente, rama elegida y siguiente paso. No expone razonamiento privado del modelo.
- La configuracion remota, cache, sincronizacion y endpoint de Slack usan Lista 8 (`F0BS8SERTNE`) como fuente activa y conservan Lista 7 (`F0BNV1FR02J`) como cache historica de 24 horas. Un `429` corta la sincronizacion sin reintentos y respeta `Retry-After`.
- Se agregaron seis escenarios anonimizados derivados de conversaciones reales. Sus ocho contratos cubren motivos no KYC, KYC por Lista 8, KYC por Jira, fuente degradada, acuse sin adjunto y correcciones de identidad.
- Produccion permanece sin cambios. La siguiente publicacion sera exclusivamente preview.
- `npm test`: 32 archivos de pruebas aprobados. `npm run check`: aprobado.
- La revision visual paso en 1440 x 900 y 390 x 844 sin desbordamiento horizontal ni solapamientos. La traza mostro Jira, Lista 8, motivo, rama y siguiente paso.
- Preview segura: `https://support-livechat-qmnqd4ux4.vercel.app`, deployment `dpl_CdwQhqXFWx9s9GexgXJwb8C4ugnv`, estado `READY`.
- Alias estable: `https://support-livechat-preview-gerardo.vercel.app/simulator.html`.
- El acceso real por correo/PIN y el endpoint privado del simulador respondieron correctamente. Las escrituras reales permanecen apagadas.
- Un turno controlado real clasifico `withdrawal`, ejecuto una llamada de IA y mostro Jira y Lista 8 como `unavailable`; KYC fue omitido correctamente. No se afirmo que el retiro no existia.
- Se creo una preview temporal de sincronizacion y se intento una sola actualizacion de Lista 8. El endpoint respondio `missing_slack_config` antes de consultar Slack; por lo tanto no hubo sincronizacion ni riesgo de `429`.
- Produccion no se desplego ni se promovio.
- Siguiente paso exacto: configurar `SLACK_BOT_TOKEN` en Preview, ejecutar una sincronizacion administrativa unica de Lista 8, configurar o renovar el token Jira de Gerardo y repetir un caso conocido que tenga registro en Lista 8.

### 2026-08-11 - Credenciales de Preview y validacion de Lista 8

- Se valido el primer token Jira entregado mediante una consulta de solo lectura al perfil autenticado. El segundo token no fue necesario.
- Jira se configuro con base `https://betxico-cs.atlassian.net`, proyecto `BTF` y tipo de ticket existente de la aplicacion. `BTF` es la clave de proyecto, no el tipo de incidencia.
- Se configuro el token de Slack solamente en la configuracion privada de Preview. No se escribio en el repositorio ni se envio a produccion.
- Una preview temporal con sincronizacion habilitada actualizo exclusivamente Lista 8: 318 registros, 318 examinados y cobertura `complete`. No hubo `429`.
- La preview estable regreso inmediatamente a modo seguro: lecturas desde cache, sincronizacion apagada, acciones reales apagadas y sin cambios en produccion.
- Un caso controlado autentico con datos sinteticos confirmo: Jira `not_found`, Slack Lista 8 `not_found`, KYC omitido, ruta `Retiro no localizado en antecedentes` y una llamada de IA. La ausencia se trato como ausencia verificada, no como una fuente caida.
- Siguiente paso exacto: probar desde el simulador un correo de un caso conocido en Lista 8 y confirmar que la traza muestra el motivo de retencion y la rama correspondiente.

### 2026-08-11 - Estado de continuidad del motor conversacional

- **Base estable:** Jira, cache de Lista 8 y revision manual KYC siguen siendo conectores separados. Las nuevas decisiones se agregan en `lib/case-decision-engine.js`; no se debe modificar un conector para agregar una nueva variante conversacional.
- **Rama KYC de Lista 8:** una causa que exprese INE, identificacion, identidad, documento o KYC se interpreta como la misma familia operativa. Si incluye identificacion oficial, el primer mensaje solicita una foto clara de la INE por ambos lados. No depende de una frase textual exacta.
- **Validacion humana:** al recibir adjuntos, se revisan; despues el agente que actualizo KYC confirma `KYC completo` o `KYC incompleto`. La confirmacion se conserva en el registro KYC y se vuelve a evaluar la misma rama.
- **Continuacion de retiro:** KYC completo y confirmado por un humano transforma la ruta a `kyc_updated_withdrawal_ready`. El cliente recibe que sus datos fueron actualizados y que el retiro se comparte con el area correspondiente para continuar su proceso normal. Esta fase no escribe por si sola en Jira, Slack, KYC ni LiveChat.
- **Regla para nuevas ramas:** agregar primero una entrada semantica y una ruta determinista; despues un contrato de prueba con datos anonimos; por ultimo una redaccion humana. Las consultas, limites, cache y permisos existentes no se cambian salvo que la nueva fuente realmente lo requiera.
- **Siguiente bloque:** completar el contrato de esta rama, probarla en preview con una conversacion controlada y empezar el catalogo de rutas de retiro a partir de casos que se vean en Jira y Lista 8.
- **Validacion de esta entrada:** `npm run check` y los 32 grupos de `npm test` aprobaron. El contrato de regresion ahora cubre que un mensaje posterior sobre INE conserva el caso como retiro, no lo reclasifica como KYC aislado, y que la confirmacion humana `complete` llega a `kyc_updated_withdrawal_ready`.
- **Estado de despliegue:** estos cambios siguen locales; no se publico Preview ni Produccion en esta entrada.

### 2026-08-11 - Control de IA para produccion

- La IA tiene un interruptor de ejecucion separado de sus instrucciones y credenciales. Su estado inicial es apagado aunque exista una configuracion anterior o una llave de proveedor.
- Solo una cuenta administradora puede cambiarla desde Administracion. Cada cambio requiere volver a ingresar su PIN y queda registrado con fecha y cuenta responsable.
- Jira, buscador, creacion de tickets, Lista 8, KYC y los controles supervisados no dependen de este interruptor.

### 2026-08-12 - Publicacion en produccion

- Produccion fue publicada en `dpl_4CWCCjdHqYoWww6PjqqabinjhmMU` y el dominio principal apunta a esa version.
- Se confirmo que Jira y KV estan configurados en produccion. Slack y LiveChat conservan sus secretos existentes.
- Lectura de Lista 8 esta activa. La sincronizacion manual queda disponible para un administrador y el refresco automatico corre cada cuatro minutos; se conserva la proteccion de cooldown y corte ante `429`. No hay sincronizacion directa por chat.
- La IA permanece apagada por estado runtime. Puede activarse o apagarse desde Administracion unicamente por un administrador que reingrese su PIN.
- Modo de acciones supervisadas: `suggest`. Plantillas automaticas heredadas: apagadas.

### 2026-08-13 - Manual consultable en simulador

- El indice `knowledge/betxico-support-manual.v1.json` se genera de forma determinista desde el manual maestro y exige exactamente 91 casos o plantillas.
- El indice contiene 115 registros, 91 casos o plantillas y 14 fuentes documentadas.
- `case.knowledge.lookup` se ejecuta solamente en el simulador y solo cuando `SUPPORT_SIMULATOR_KNOWLEDGE_ENABLED=true`.
- La bandera se ignora con `VERCEL_ENV=production`, incluso si se configura accidentalmente como verdadera.
- Por turno se comparten como maximo cinco fragmentos pertinentes. El manual completo, correo, documentos y credenciales no se envian al modelo.
- El manual orienta procedimiento y redaccion; no confirma hechos ni autoriza pagos, KYC, publicaciones o cambios.
- Produccion no fue modificada ni desplegada por esta integracion.
- Siguiente paso: publicar una Preview, iniciar los conectores locales y validar una conversacion controlada con datos reales y fuentes solo lectura.

### 2026-08-13 - Respuesta progresiva y espera de evidencia

- La respuesta al cliente no debe cerrar una duda con una frase vacía. El motor ahora debe responder lo confirmado, separar explícitamente lo que sigue pendiente y pedir solamente el siguiente dato útil para avanzar.
- Se corrigió una falsa detección de resultado: frases como “no puedo confirmar que ya fue aprobado” ya no se tratan como una afirmación de aprobación. Las afirmaciones positivas de pago, aprobación o liberación siguen requiriendo evidencia vigente.
- En el simulador, una consulta de cliente espera hasta cuatro reintentos adicionales de los trabajos autenticados de Atena y KYC antes de preparar el borrador. El límite sigue siendo controlado por la función de preview y no realiza escrituras.
- La auditoría de cada turno conserva el estado de Jira, Lista 8, Atena, KYC, revisión KYC y conocimiento, sin guardar el correo ni contenido sensible. Esto permite distinguir una fuente pendiente o no disponible de una ausencia verificada.
- Para consultas de bonos, la IA recibe la instrucción de explicar requisitos documentados que apliquen y de distinguirlos de la confirmación particular de activación; no debe limitarse a una respuesta genérica.
- Validación local: `npm test` y `npm run check` aprobados después de agregar regresiones para explicación no concluyente, respuesta progresiva y borrador vacío.
- Siguiente paso: publicar este cambio exclusivamente en Preview y repetir una conversación controlada de retiro y otra de bono; verificar en la traza los estados de Atena y conocimiento antes de considerar el comportamiento validado.

### 2026-08-13 - Separación entre expediente y respuesta al cliente

- Se separó formalmente la información operativa del texto cliente. Atena, Jira, Slack, Lista 8, tickets, fuentes, consultas, expediente y pasos de investigación son exclusivamente del panel del agente y no deben aparecer en `customerDraft`.
- La ruta `Aguardando aprobación` ahora tiene una plantilla determinista orientada al cliente: estado explicado, monto y fecha cuando existan, ninguna acción adicional requerida y sin prometer una hora de acreditación.
- Las menciones internas generadas por IA se sustituyen antes de mostrar el mensaje. Las rutas de retiro en análisis, pagado y KYC conservan plantillas cliente seguras; las fuentes y razones técnicas permanecen en `analysis`, `nextStep` y la traza.
- Se añadieron regresiones para estado pendiente de aprobación, lenguaje condicional, y eliminación de términos internos. Las pruebas de respuesta, simulador, borrador y conversaciones reales anonimizadas aprobaron.
- Siguiente paso: desplegar exclusivamente a Preview y realizar un nuevo caso controlado con un retiro en `Aguardando aprobación`; la respuesta esperada no debe revelar ningún sistema interno.

### 2026-08-13 - Asociación segura de movimientos de Atena

- Una conversación controlada detectó que el orquestador estaba usando el último retiro de Atena aunque el cliente no hubiera indicado monto ni fecha. Eso podía asociar un movimiento anterior a la consulta actual y exponer una ruta incorrecta.
- La corrección exige coincidencia de monto y fecha entre el mensaje del cliente y el movimiento de Atena antes de usar el estado de ese movimiento para responder. Sin esa identidad, el cliente recibe una solicitud natural de monto y fecha, sin mencionar herramientas internas ni un retiro ajeno.
- Lista 8 conserva una excepción deliberada: por ser el registro operativo actual de retenciones, un motivo vigente puede orientar la rama sin depender de un retiro histórico. Jira continúa siendo contexto histórico y requiere que el movimiento esté identificado.
- Se corrigió además el parseo de fechas ISO para evitar comparar erróneamente `YYYY-MM-DD` como fecha parcial.
- Validación: los contratos de Atena, simulador y las diez conversaciones reales anonimizadas aprobaron. Se añadieron regresiones para ignorar un retiro pagado de monto y fecha diferentes y para pedir identificación cuando no existe una coincidencia segura.
- Siguiente paso: publicar exclusivamente a Preview y realizar una nueva conversación desde cero. Para una consulta de retiro, indicar monto y fecha permite asociar el movimiento correcto; sin esos datos no se hará una afirmación sobre un retiro anterior.

## Como continuar despues de una interrupcion

1. Leer este documento completo.
2. Ejecutar `git status --short --branch` y no descartar cambios existentes.
3. Identificar la primera fase con estado `EN CURSO`.
4. Revisar la ultima entrada de la bitacora.
5. Ejecutar `npm run check` y las pruebas indicadas en la ultima entrada.
6. Continuar solamente desde el siguiente paso documentado.
7. Antes de terminar una sesion, actualizar estados, pruebas, riesgos y siguiente paso.
