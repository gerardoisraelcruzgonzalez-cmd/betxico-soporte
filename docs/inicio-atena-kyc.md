# Inicio rápido: Atena + KYC

## Encender todo

Abre una sola Terminal, copia y pega estas dos líneas y presiona Enter:

```sh
cd "/Users/gerardocruz/Documents/Proyectos/EXTENCION S:T Y BANCKEND/betxico-soporte/support-livechat-app"
npm run conectores
```

Este único comando enciende **Atena** y **KYC**. No es necesario ejecutar los dos comandos anteriores por separado.

## Qué debes dejar abierto

- La Terminal donde ejecutaste `npm run conectores`.
- La ventana dedicada de Atena.
- La ventana dedicada de KYC, aunque permanezca en blanco mientras no se consulta.

La ventana en blanco de KYC es normal: evita que Paybridge reciba tráfico mientras no estás usando **CONSULTAR**.

## Primera vez o sesión vencida

- Si Atena muestra su pantalla de acceso, inicia sesión ahí una vez. El conector no recargará la página mientras escribes.
- Termina el acceso de Atena antes de pulsar **CONSULTAR**. Si lo pulsaste antes, completa el acceso y vuelve a pulsarlo una vez.
- En la primera consulta de KYC, si abre el acceso de Paybridge, inicia sesión y vuelve a pulsar **CONSULTAR** en LiveChat.
- Las contraseñas permanecen en las sesiones locales de esas ventanas; no se envían a LiveChat.

## Consultar desde LiveChat

1. Abre el chat del cliente y confirma que aparece su correo.
2. Pulsa **CONSULTAR** en la tarjeta de Atena o KYC.
3. Espera el resultado en la misma tarjeta; no pulses varias veces.

## Cerrar y recuperar

- Para cerrar ambos conectores, vuelve a la Terminal y presiona `Control + C` una sola vez.
- Si la Terminal dice que un conector ya está activo, conserva sólo una Terminal: cierra la anterior con `Control + C` y ejecuta nuevamente `npm run conectores`.
- Si cierras por accidente una ventana dedicada, el conector correspondiente la vuelve a abrir cuando sea necesario.

Los comandos individuales `npm run atena:connector` y `npm run kyc:connector` siguen disponibles para diagnóstico, pero en la operación diaria usa solamente `npm run conectores`.
