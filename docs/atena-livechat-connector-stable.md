# Conector Atena para LiveChat — versión estable 1.0.1

## Objetivo

Consultar desde la tarjeta **Atena** de LiveChat, usando la sesión autorizada del agente, sin exponer credenciales ni llamar a `localhost` desde el widget publicado.

La respuesta prioriza:

1. Retiro actual: monto, fecha y estado (`PAGADO`, `AGUARDANDO APROBACIÓN` o `EN ANÁLISIS`).
2. Saldo en la cuenta, marcado como `CON SALDO` o `SIN SALDO`.
3. Últimos tres movimientos del Extracto.

## Inicio normal

Abrir una sola Terminal y ejecutar:

```bash
cd "/Users/gerardocruz/Documents/Proyectos/EXTENCION S:T Y BANCKEND/betxico-soporte/support-livechat-app"
npm run atena:connector
```

El mensaje estable es:

```text
Atena connector 1.0.1-login-safe connected to the production bridge.
Login-safe idle mode: Atena will not reload until LiveChat sends a query.
```

El conector abre una ventana dedicada de Chrome con el perfil persistente `BetxicoAtenaConnector`. Si aparece el acceso de Atena, iniciar sesión una vez y terminarlo antes de pulsar **CONSULTAR**. Mientras no exista una consulta real, el conector no inspecciona ni navega la página, por lo que no recarga el formulario mientras se escribe la clave. Mantener abiertas la Terminal y esa ventana mientras se atienden consultas.

## Consulta desde LiveChat

1. Abrir el chat del cliente y verificar que LiveChat detectó su correo.
2. Pulsar **CONSULTAR** una sola vez.
3. La tarjeta puede mostrar primero `Esperando que la sesión de Atena esté lista...` y luego `Consultando retiro, saldo y extracto...`.
4. El resultado aparece en la misma tarjeta. No es necesario un segundo clic.

## Controles de estabilidad

- Sólo puede existir un conector activo. Un segundo intento termina con un mensaje claro y no abre otro Chrome.
- El navegador termina de abrir antes de que el conector reclame una consulta.
- Mientras se inicia sesión, Atena permanece intacto y no se recarga por el conector.
- Si se pulsa **CONSULTAR** antes de terminar el acceso, LiveChat indicará que se requiere iniciar sesión; al completarlo se pulsa **CONSULTAR** nuevamente.
- Cada cliente comienza desde la ruta limpia de Logins para que un modal anterior no intercepte la búsqueda siguiente.
- Los fallos transitorios de navegación se reintentan una vez.
- LiveChat espera hasta tres minutos y tolera tres fallos breves de red.
- Los trabajos permanecen diez minutos en el puente y los pendientes antiguos caducan de forma controlada.
- Chrome usa su sandbox normal; no se inicia con `--no-sandbox`.
- El puerto local de bloqueo `8791` entrega únicamente estado técnico mínimo (versión, tipo de página y contador de navegaciones) para diagnosticar la ventana dedicada sin exponer correo, contraseña ni contenido del cliente.

## Verificación

Antes de publicar cambios relacionados:

```bash
npm run test:atena
npm run check
```

Para una validación real, comprobar en este orden:

1. Una sola instancia del conector.
2. Sesión autenticada de Atena.
3. Consulta creada desde LiveChat.
4. Mensajes `query received` y `query completed` en Terminal.
5. Retiro, saldo y tres movimientos visibles en la tarjeta.

## Recuperación

- Si Chrome fue cerrado, el conector lo vuelve a abrir automáticamente.
- Si Atena cerró la sesión, iniciar sesión en la ventana dedicada; la consulta pendiente continuará si aún no caducó.
- Si la Terminal fue cerrada, ejecutar nuevamente `npm run atena:connector`.
- No iniciar dos terminales con el conector y no usar el antiguo puerto `8788`.
