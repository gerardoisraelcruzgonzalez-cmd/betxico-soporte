# Conector BoB para LiveChat

## Estado de implementación

La integración usa un perfil persistente independiente de Chrome (`BetxicoBobConnector`). El conector local obtiene la sesión autenticada de ese perfil y utiliza la misma acción nativa de cierre que utiliza BoB para su pantalla de sesiones. La sesión y sus cookies nunca salen del equipo local.

El flujo es: agente autorizado -> puente privado Atena/KYC/BoB en Vercel/Redis -> conector local autenticado -> acción nativa de BoB dentro de la sesión local -> resultado verificable para el agente.

El conector permanece inactivo salvo que exista un trabajo pendiente. En espera sólo consulta el puente privado; no navega ni consulta BoB.

Al verificarse correctamente un cierre, el puente crea una incidencia Jira con tipo `Servicio al Cliente` usando la cuenta Jira configurada del agente que solicitó el cierre. El resumen es `ID <AUTH ID> __ CIERRE DE SESIONES _ <PROVEEDOR>` y la descripción conserva sesiones cerradas, fechas, pendientes y `Pending Win`. Si la cuenta Jira del agente no está configurada, el cierre se mantiene correcto y el historial muestra el error de creación; nunca usa otro agente como reportero.

## Permisos remotos

Todos empiezan con el grupo `basic`: Jira, Lista Slack y tickets. Desde Administración se asigna uno de estos grupos:

- `operations`: Atena, KYC y BoB.
- `ai`: IA, sin Atena, KYC ni BoB.
- `complete`: todos los módulos.

El servidor valida el permiso; ocultar un panel no concede acceso.

## Cierre de sesiones

Al recibir un trabajo, el conector consulta por ID de cliente exacto en bloques mensuales. Esto evita que BoB devuelva una lista vacía al pedir todo el historial de una sola vez. Sólo considera pendientes las sesiones que no muestran `finalizedSession` ni fecha de finalización. BoB representa una fecha ausente como el texto `null`; el conector lo normaliza como ausencia de fecha.

Para cada candidata usa la acción nativa `manuallyFinalizeSession` desde la sesión local autenticada. Después de cada cierre vuelve a consultar BoB hasta cinco veces. El trabajo sólo queda correcto cuando la misma fuente ya no reporta sesiones pendientes. Cada solicitud admite hasta 150 sesiones para un mismo ID; por encima de ese límite se detiene sin ejecutar cierres.

## Requisito local

1. Configurar `BOB_CONNECTOR_TOKEN` únicamente en Vercel y en `.env.bob.local`.
2. Ejecutar `npm run bob:connector`.
3. Iniciar sesión manualmente en el navegador BoB dedicado.

Cuando ya exista un navegador BoB autenticado, `BOB_CDP_URL` permite que el conector se conecte a ese perfil sin cerrarlo ni abrir una segunda sesión.

Si la sesión no está iniciada, el trabajo devuelve `bob_login_required`; no se intenta un cierre.

## Verificación realizada

El 14 de agosto de 2026 se comprobó con el ID autorizado proporcionado que la acción nativa devuelve confirmación de cierre y que una consulta posterior de BoB muestra las sesiones como `finalizedSession`. La verificación final del rango consultado devolvió cero sesiones pendientes.

## Estado de despliegue

El 13 de agosto de 2026 las primeras vistas previas fallaron después de compilar. Se identificó el motivo: el plan actual de Vercel admite doce funciones y el archivo independiente `api/bob-bridge.js` elevaba el total a trece. BoB se integró como `service=bob` dentro del puente ya existente `api/atena-bridge.js`, conservando su propia cola, token y permisos. La vista previa posterior quedó lista y el `claim` de una cola vacía devolvió `ok` sin contactar BoB.

La cola y el permiso remoto continúan en producción; el proceso local debe permanecer encendido y con la sesión de BoB iniciada para ejecutar solicitudes.
