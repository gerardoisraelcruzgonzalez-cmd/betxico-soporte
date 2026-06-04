# Plan - App de Soporte en LiveChat

## Decision principal

La opcion mas viable es construir una app privada de LiveChat con backend propio. Para soporte es mejor que una extension porque se instala una vez en el workspace, vive dentro del panel del agente y centraliza tokens, permisos, auditoria y despliegues.

La extension actual debe quedarse como respaldo temporal mientras se valida esta app.

## Arquitectura recomendada

```text
LiveChat Agent App
  Details Widget
    Panel de soporte
      Categoria, prioridad, resumen, notas
      Cliente detectado desde LiveChat
        |
        v
Backend Vercel
  /api/support-ticket
    Jira issue create
    Slack notification
    Audit log
  /api/livechat-webhook
    Eventos automaticos de LiveChat
```

## MVP operativo

1. Panel embebido en LiveChat para que el agente cree un caso sin salir del chat.
2. Captura automatica de `chat_id`, nombre, correo y variables del cliente cuando LiveChat las entregue.
3. Campos manuales minimos: categoria, prioridad, resumen y notas.
4. Creacion centralizada de ticket en Jira.
5. Notificacion a Slack con link al ticket y datos principales.
6. Registro de auditoria para diagnosticar fallas.

## Datos iniciales

Tabla futura recomendada `support_reports`:

```text
id
livechat_chat_id
livechat_thread_id
customer_id
customer_name
customer_email
agent_email
category
priority
summary
notes
jira_key
jira_url
slack_channel
slack_ts
status
error_message
created_at
updated_at
```

Para el primer MVP el scaffold registra en logs. La base de datos se agrega cuando ya confirmemos campos reales de Jira y flujo de agentes.

## Roles

- Agente soporte: crea casos desde LiveChat.
- Lider soporte: revisa historial, fallas y tickets duplicados.
- Admin tecnico: configura tokens, campos Jira, Slack y webhooks.

## Flujo de usuario

1. El agente abre un chat en LiveChat.
2. El widget muestra cliente, correo y chat ID.
3. El agente selecciona categoria y prioridad.
4. Escribe resumen y notas operativas.
5. Da clic en `Crear ticket`.
6. El backend crea Jira, avisa a Slack y devuelve el link.

## Categorias iniciales

- pago
- retiro
- cuenta
- verificacion
- bug
- seguimiento
- otro

## Riesgos

- LiveChat solo entrega algunos datos si el perfil del cliente no los tiene capturados.
- El endpoint del widget no debe quedar abierto sin autenticacion en produccion.
- Los campos custom de Jira deben mapearse con IDs reales antes de usarlo con todo el equipo.
- Slack Lists puede requerir permisos adicionales; para MVP conviene mandar mensaje a canal primero.

## Implementacion por fases

### Fase 1 - MVP privado

- Publicar widget en Vercel.
- Instalar app privada en LiveChat.
- Crear tickets Jira basicos.
- Mandar aviso Slack a canal.

### Fase 2 - Auditoria y controles

- Agregar base de datos.
- Evitar duplicados por `livechat_chat_id`.
- Pantalla de historial y reintentos.
- Validaciones por categoria.

### Fase 3 - Automatizacion

- Webhooks para detectar chats nuevos o tags.
- Reglas de prioridad.
- Reporte diario de casos.
- Dashboard de tiempos y volumen por categoria.

## Alternativas ordenadas

1. App privada LiveChat + backend: mejor balance entre estabilidad, operacion y mantenimiento.
2. Webhooks puros: bueno para automatizar, pero menos control humano.
3. Dashboard externo: flexible, pero obliga al agente a salir del flujo.
4. Extension Chrome: rapida, pero fragil y costosa de mantener.

