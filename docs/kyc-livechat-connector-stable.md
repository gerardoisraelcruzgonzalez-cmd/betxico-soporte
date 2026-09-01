# Conector KYC para LiveChat — versión estable 1.0.1

## Objetivo

Consultar un correo desde LiveChat en las dos fuentes obligatorias de Paybridge KYC:

1. **Usuarios KYC** (`/api/kyc-users`).
2. **Verificaciones** (`/api/verifications`).

Las fuentes nunca se sustituyen ni se deduplican entre sí. Si el correo existe en ambas, LiveChat muestra ambos bloques y todos los resultados exactos recibidos.

## Operación diaria

Desde la carpeta de la aplicación:

```sh
npm run kyc:connector
```

El conector abre una ventana dedicada de Chrome con el perfil persistente `BetxicoKycConnector`. Mientras está inactivo, la ventana permanece en blanco para impedir actualizaciones de fondo de Paybridge. Mantener abiertas la Terminal y esa ventana durante las consultas.

En la primera consulta, si aparece el acceso de Paybridge KYC, iniciar sesión una sola vez y volver a pulsar **CONSULTAR**. Las consultas siguientes reutilizan esa sesión.

Cuando la terminal muestre:

```text
Idle mode: zero Paybridge KYC traffic until LiveChat sends a query.
```

la tarjeta **KYC** de LiveChat puede usar **CONSULTAR**.

## Resultado mostrado

Cada coincidencia incluye:

- fuente y estado;
- nombre, apellidos, correo y teléfono;
- fecha de nacimiento, CURP, sexo y profesión;
- tipo y número de documento;
- estado de selfie, documento, domicilio y prueba de vida;
- alerta de duplicado, cuando existe;
- selfie, INE frente e INE reverso;
- acceso al registro original de Paybridge.

Las imágenes se muestran como miniaturas. Al seleccionarlas se abre un visor y un enlace al tamaño completo para que el agente revise la legibilidad manualmente.

## Límites de seguridad

- El conector sólo usa solicitudes `GET` y no ejecuta aprobaciones, rechazos, bloqueos, eliminaciones ni reemplazos de documentos.
- Mientras no haya una consulta pendiente, el conector sólo revisa la cola privada de LiveChat y no llama a ninguna ruta de Paybridge KYC.
- Al arrancar estaciona la ventana en `about:blank`; la sesión autorizada permanece guardada, pero la página KYC no queda ejecutándose.
- Después de cada consulta, vuelve automáticamente a la página en blanco para detener cualquier actualización interna del backoffice.
- Las credenciales nunca pasan por LiveChat, Vercel ni el código; permanecen en el perfil local autorizado.
- Los enlaces temporales de documentos viven sólo en el trabajo de consulta de corta duración y en la pantalla del agente que solicitó el correo.
- Los resultados se limpian al cambiar de cliente.
- Sólo una instancia del conector puede usar el puerto de bloqueo `8792`.

## Recuperación

- Si la sesión expiró, iniciar sesión nuevamente en la ventana dedicada.
- Si la terminal fue cerrada, ejecutar otra vez `npm run kyc:connector`.
- Si aparece que el conector ya está activo, conservar la primera terminal y cerrar la duplicada.
- Si un documento no existe en Paybridge, se muestra `No disponible`; no se sustituye con otro tipo de archivo.
