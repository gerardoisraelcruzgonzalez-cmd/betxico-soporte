# Auditoria de accesos de soporte

Fecha de revision: 2026-08-14 (America/Mexico_City)

## Alcance

Esta auditoria revisa la configuracion remota activa, los registros de cuenta y
el estado de conexion personal de Slack. No contiene PINes, contrasenas,
tokens, cookies ni hashes.

Los PINes de la aplicacion se guardan como verificadores con hash. Se puede
comprobar que una cuenta tiene PIN configurado, pero no recuperar ni exportar
el PIN original. Para verificar un PIN concreto se debe iniciar sesion con ese
correo y PIN, o restablecerlo por el flujo administrativo.

## Resultado de identidad y permisos

El inicio por correo/PIN y el inicio con Slack terminan usando el mismo
identificador: el correo normalizado de la cuenta.

1. El inicio por correo/PIN autentica ese correo mediante `authenticateAccount`.
2. El inicio con Slack obtiene el correo verificado por OpenID y crea o
   reutiliza exactamente esa misma cuenta.
3. Ambos dejan la sesion asociada al mismo correo.
4. Al cargar las herramientas, ambos pasan por `getAgentToolAccess(email)`.

Por lo tanto, cuando el correo de Slack coincide exactamente con el correo
asignado abajo, los permisos son iguales. Slack no debe usarse con un correo
distinto para intentar heredar permisos de otra persona.

La conexion personal de Slack es independiente del inicio de sesion con Slack:
solo es necesaria para las acciones que leen o publican usando las credenciales
personales del agente.

## Inventario seguro

| Correo | Estado | Rol efectivo | Grupo de herramientas | PIN configurado | Conexion personal Slack |
| --- | --- | --- | --- | --- | --- |
| admin@betxico.mx | Deshabilitado | Administrador | Basico | Si | No |
| adriana.lobato@betxico.mx | Activo | Agente | Basico | Si | No |
| anahy.haro@betxico.mx | Activo | Administrador | Completo | Si | Si |
| azucena.rodriguez@betxico.mx | Activo | Agente | Basico | Si | No |
| blanca.gutierrez@betxico.mx | Activo | Agente | Basico | Si | No |
| gerardo.cruz@betxico.mx | Activo | Administrador | Completo | Si | Si |
| ivonne.cruz@betxico.mx | Activo | Administrador | Completo | Si | No |
| luis.salazar@betxico.mx | Activo | Agente | Basico | Si | No |
| miriam.vazquez@betxico.mx | Activo | Agente | Basico | Si | Si |
| montserrat.quirarte@betxico.mx | Activo | Agente | Basico | Si | No |
| patricio.garza@betxico.mx | Activo | Agente | Operacion | Si | No |
| patricio.maldonado@betxico.mx | Activo | Agente | Basico | Si | No |
| pedro.salazar@betxico.mx | Deshabilitado | Agente | Basico | Si | No |
| valeria.garza@betxico.mx | Deshabilitado | Agente | Basico | Si | No |
| oriana.moreno@betxico.mx | Activo | Agente | Operacion | Si | No |

## Grupos de herramientas

Todos los usuarios activos conservan Jira, Lista 8 de Slack y creacion de
tickets. Los modulos adicionales dependen del grupo:

| Grupo | Atena | KYC | BoB | IA |
| --- | --- | --- | --- | --- |
| Basico | No | No | No | No |
| Operacion | Si | Si | Si | No |
| IA | No | No | No | Si |
| Completo / Administrador | Si | Si | Si | Si |

## Hallazgos y acciones pendientes

- Hay 12 cuentas activas y 3 cuentas deshabilitadas. Las deshabilitadas no
  deben poder iniciar ni por PIN ni por Slack.
- Todas las cuentas inventariadas tienen un registro y un PIN configurado.
  Esto no prueba el valor conocido por cada agente: esa comprobacion requiere
  una prueba de inicio por agente o un restablecimiento controlado.
- Solo Anahy, Gerardo y Miriam tienen actualmente una conexion personal de
  Slack registrada. El inicio con Slack puede seguir funcionando para una
  cuenta autorizada, pero las operaciones que requieran su token personal de
  Slack no estaran disponibles hasta que conecten Slack desde la aplicacion.
- Si una persona cambia de correo en Slack, debe actualizarse primero su correo
  autorizado en la configuracion. No se deben compartir ni reutilizar PINes.

## Cuenta de Gerardo

- Correo: `gerardo.cruz@betxico.mx`
- Estado: activo
- Rol: administrador
- Grupo efectivo: completo
- Modulos: Atena, KYC, BoB e IA
- PIN: configurado, pero no recuperable ni visible
- Slack personal: conectado
