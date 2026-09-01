# Conectores locales por agente

## Objetivo

Cada agente usa sus propias sesiones locales de Atena, KYC y BoB. La aplicacion
dirige una solicitud al equipo del agente que la crea; ningun otro conector
puede reclamarla.

## Provisionar a un agente

1. El administrador habilita al agente en el grupo `operations` o `complete`.
2. El administrador registra tres credenciales independientes en la variable
   de produccion `SUPPORT_CONNECTOR_AGENT_TOKENS_JSON`. La estructura es:

```json
{
  "agente@betxico.mx": {
    "atena": "secreto-unico",
    "kyc": "secreto-unico",
    "bob": "secreto-unico"
  }
}
```

3. En la Mac del agente se crea `.env.agent.local` a partir de
   `.env.agent.example` con el correo y los tres secretos que le corresponden.
4. El agente ejecuta `npm run conectores:operador` y entra manualmente en
   Atena, KYC y BoB cuando se abran sus ventanas.

Las claves no se guardan en el repositorio, Vercel logs, LiveChat ni tickets.
Se comparten una sola vez por un canal de secretos aprobado y se rotan al
retirar el acceso del agente.

## Operacion

- Los trabajos del agente se agregan a su cola privada por servicio.
- Los conectores heredados siguen utilizando la cola general hasta que se les
  asigne su propia credencial.
- Un conector con identidad de agente solo puede completar trabajos creados
  por ese mismo correo.
- Si el conector del agente esta apagado o su sesion vencio, la solicitud no
  cambia de operador ni utiliza otra sesion. Expira con un error claro.

## Verificacion inicial

1. Iniciar los tres conectores en la Mac del agente.
2. Confirmar inicio manual de las tres plataformas.
3. Desde una sesion de LiveChat de ese mismo correo, ejecutar una consulta
   controlada de Atena, una de KYC y un cierre de BoB autorizado.
4. Verificar que cada resultado vuelve al mismo agente y que el conector
   heredado no registra el trabajo.
