# Flujos automáticos verificados

Este documento describe respuestas automáticas limitadas a evidencia confirmada.
No sustituye la revisión humana de acciones sensibles.

## Conversación

1. El saludo de bienvenida pregunta en qué se puede ayudar.
2. Si el caso requiere una consulta asíncrona, el cliente recibe un mensaje de
   espera y se conserva el chat abierto.
3. Si la evidencia no confirma una ruta, el sistema hace una pregunta concreta
   o deja un borrador para el agente; no inventa un resultado.

## Juego inaccesible

Variantes como `no abre`, `no carga`, `se queda cargando`, `me saca`,
`no puedo entrar` o `se congela` se clasifican como `game_access`.

- Requisito: AUTH ID válido en el caso y permiso BoB para el agente.
- Acción: se crea un trabajo de cierre de sesiones en BoB una sola vez por caso.
- Confirmación: el mensaje final se envía sólo después de que BoB devuelva
  `completed`.
- Mensaje final: confirma el cierre y pide esperar aproximadamente diez minutos
  antes de intentar abrir el juego de nuevo.

## Retiro aguardando aprobación

La consulta de Atena permanece en su adaptador de sólo lectura. Cuando Atena
confirma `AGUARDANDO APROBACIÓN` para un retiro actual inequívoco, se responde
que está pendiente de revisión y aprobación, que no requiere acción adicional,
y que no hay un plazo exacto de acreditación.

La respuesta no menciona Atena, Jira, Slack, herramientas internas ni pasos de
investigación.

## Requisito de identificación

Cuando Jira o Lista 8 normalizados indican un requisito KYC, se solicita una
foto clara de la INE por ambos lados y una selfie sosteniendo la INE. La
validación KYC y cualquier continuidad del retiro siguen bajo revisión humana.

## Límites y configuración

- Las tres respuestas anteriores sólo se envían automáticamente cuando
  `liveChatAutomation.enabled` está activo y `evidenceResponseMode` es
  `auto_send_verified`.
- Cualquier otra ruta queda en revisión humana.
- Cada envío usa una llave idempotente de LiveChat: reintentos de webhooks,
  consultas o conectores no deben duplicar mensajes ni cierres.
- Atena, BoB, KYC, Jira y Lista 8 mantienen adaptadores independientes.
