# Checklist - Text Developer Console

## Crear app privada

1. Entrar a `https://platform.text.com/console`.
2. Ir a `Apps`.
3. Crear una app nueva: `Betxico Soporte`.
4. En `Display details`, agregar nombre e icono interno si lo piden.

## Widget del agente

1. Entrar a `Building blocks`.
2. Agregar `LiveChat Widgets`.
3. En `Widget source URL`, pegar la URL HTTPS del deploy:

```text
https://TU-APP.vercel.app
```

4. Elegir placement `Details section`.
5. Guardar.

Este placement es el correcto para soporte porque aparece junto al perfil/conversacion del cliente.

## Instalacion privada

1. Ir a `Private installation`.
2. Instalar la app en el workspace.
3. Abrir LiveChat Agent App.
4. Abrir una conversacion.
5. Confirmar que aparece el panel `Betxico Soporte`.

## Webhook opcional

Para eventos automaticos:

1. Agregar building block `Chat Webhooks`.
2. Usar como URL:

```text
https://TU-APP.vercel.app/api/livechat-webhook
```

3. Activar primero eventos de bajo riesgo, por ejemplo `incoming_chat` o eventos de tags.
4. Validar logs antes de automatizar creacion de tickets.

## Variables en Vercel

Configurar:

```text
JIRA_BASE_URL
JIRA_EMAIL
JIRA_API_TOKEN
JIRA_PROJECT_KEY
JIRA_ISSUE_TYPE
SLACK_BOT_TOKEN
SLACK_CHANNEL_ID
```

Para una prueba privada rapida puedes usar:

```text
ALLOW_UNAUTHENTICATED_WIDGET=true
```

Eso no debe quedarse asi en produccion. La version final debe validar sesion/OAuth de LiveChat o una sesion propia del backend.

