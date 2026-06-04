import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const DEFAULT_INPUT_DIR = "tmp/livechat-response-mining";
const DEFAULT_OUTPUT_MD = "tmp/livechat-response-mining/plantillas_curadas_soporte10_v1.md";
const DEFAULT_OUTPUT_JSON = "tmp/livechat-response-mining/plantillas_curadas_soporte10_v1.json";
const MAX_RECOMMENDED_TEMPLATES = 20;

const PRIORITY_TEMPLATES = [
  {
    intent: "bono_sin_deposito_no_disponible",
    categoria: "bonos_promociones",
    subcategoria: "bono_sin_deposito",
    prioridad: "alta",
    riesgo: "bajo",
    modo: "plantilla_segura",
    triggers: ["bono sin deposito", "bono por registrarme", "descargar la app y obtener bono", "bono gratis", "bono de bienvenida gratis"],
    datos_requeridos: ["tipo de bono consultado", "si el cliente ya deposito", "si el bono aparece en promociones"],
    condiciones_para_usar: ["el cliente pregunta por bono gratis", "el cliente pregunta por bono sin deposito", "no existe promocion activa sin deposito"],
    no_usar_si: ["el cliente pregunta por bono de primer deposito", "el cliente ya tiene una promocion activa visible", "hay una excepcion aprobada internamente"],
    respuesta_base: "Por el momento no contamos con bono sin deposito o bono gratis por registro. La promocion disponible aplica con deposito conforme a las condiciones vigentes dentro de la plataforma. Si aparece alguna promocion aplicable para tu cuenta, podras verla directamente en el apartado de Promociones.",
    respuesta_cliente_molesto: "Entiendo la duda. Actualmente no tenemos activo un bono sin deposito o bono gratis por registro, por lo que no seria correcto prometerte un beneficio que no esta disponible. Te recomendamos revisar el apartado de Promociones para validar las ofertas vigentes aplicables a tu cuenta.",
    reglas_internas: ["no prometer bonos no visibles", "no ofrecer excepciones", "no usar si el cliente tiene una promocion especifica aprobada"]
  },
  {
    intent: "bono_primer_deposito_condiciones",
    categoria: "bonos_promociones",
    subcategoria: "primer_deposito",
    prioridad: "alta",
    riesgo: "bajo",
    modo: "plantilla_segura",
    triggers: ["bono primer deposito", "primer deposito", "deposite 100", "bono de 100", "no me dieron bono de bienvenida"],
    datos_requeridos: ["monto del primer deposito", "si fue una sola operacion", "si ya existian depositos previos"],
    condiciones_para_usar: ["el cliente pregunta por bono de primer deposito", "el bono depende del monto del primer deposito", "no hay validacion especial pendiente"],
    no_usar_si: ["el cliente pregunta por bono sin deposito", "el cliente jugo antes de activar otro bono", "se requiere revisar historial de depositos"],
    respuesta_base: "El bono de primer deposito aplica cuando el primer deposito cumple el monto minimo requerido en una sola operacion y conforme a las condiciones vigentes. Si el deposito se realizo en montos separados, ya existia un deposito previo o no cumple las condiciones, el sistema puede no activar el bono.",
    respuesta_cliente_molesto: "Entiendo que esperabas recibir el bono. Para revisarlo correctamente necesitamos validar el primer deposito y que haya cumplido las condiciones de la promocion en una sola operacion. Si no cumple esas condiciones, no seria posible activarlo manualmente sin validacion interna.",
    reglas_internas: ["validar primer deposito antes de afirmar aplicacion", "no prometer activacion manual", "no mezclar con bono 10% casino"]
  },
  {
    intent: "bono_10_casino_activacion",
    categoria: "bonos_promociones",
    subcategoria: "bono_10_casino",
    prioridad: "alta",
    riesgo: "bajo",
    modo: "plantilla_segura",
    triggers: ["bono 10%", "10 casino", "promocion 10", "activar bono", "bono en depositos arriba de 250"],
    datos_requeridos: ["monto depositado", "si el bono fue activado antes de jugar", "si el saldo ya fue usado"],
    condiciones_para_usar: ["el cliente pregunta como activar bono 10%", "el deposito cumple monto minimo", "el cliente aun no jugo con el saldo"],
    no_usar_si: ["el cliente ya jugo antes de activar", "el deposito no cumple monto minimo", "no aparece promocion aplicable"],
    respuesta_base: "Para activar la promocion del 10% en casino, realiza un deposito que cumpla el monto minimo vigente y despues entra al apartado de Promociones para activar el bono antes de jugar o apostar. Es importante activarlo antes de usar el saldo, porque si juegas primero el beneficio puede dejar de aplicar sobre ese deposito.",
    respuesta_cliente_molesto: "Entiendo la molestia. Esta promocion requiere activarse desde Promociones antes de jugar o apostar con el saldo. Si el saldo se uso antes de activar el bono, el beneficio puede dejar de aplicar conforme a las reglas de la promocion.",
    reglas_internas: ["no activar si el cliente ya jugo", "no prometer aplicacion retroactiva", "validar monto minimo"]
  },
  {
    intent: "bono_no_disponible_cashback_lealtad",
    categoria: "bonos_promociones",
    subcategoria: "bono_no_disponible",
    prioridad: "alta",
    riesgo: "bajo",
    modo: "plantilla_segura",
    triggers: ["cashback", "bono cumpleaños", "bono lealtad", "bono referido", "bono no visible", "no tengo promociones"],
    datos_requeridos: ["bono solicitado", "captura de promociones si aplica"],
    condiciones_para_usar: ["el cliente pide un bono que no esta disponible", "no hay promocion visible aplicable", "no existe aprobacion interna"],
    no_usar_si: ["hay promocion activa en la cuenta", "el cliente reclama un bono ya ganado", "requiere validar historial"],
    respuesta_base: "Por el momento no contamos con ese bono o beneficio disponible para tu cuenta. Si en el futuro se activa una promocion aplicable, podras verla directamente desde el apartado de Promociones dentro de tu cuenta.",
    respuesta_cliente_molesto: "Entiendo que esperabas un beneficio adicional. En este momento no contamos con ese bono disponible para tu cuenta, por lo que no podemos prometerlo ni aplicarlo como excepcion. Cualquier promocion vigente aparecera directamente en Promociones.",
    reglas_internas: ["no ofrecer bonos manuales", "no prometer futuras promociones", "no escalar como excepcion sin instruccion interna"]
  },
  {
    intent: "deposito_spei_no_reflejado_pedir_cep",
    categoria: "depositos",
    subcategoria: "spei_no_reflejado",
    prioridad: "alta",
    riesgo: "bajo",
    modo: "plantilla_segura",
    triggers: ["deposite y no aparece", "hice transferencia y no se refleja", "mi deposito no llego", "spei no reflejado", "ya me descontaron"],
    datos_requeridos: ["correo registrado", "monto", "fecha aproximada", "CEP o clave de rastreo"],
    condiciones_para_usar: ["el cliente indica transferencia SPEI", "el deposito no se refleja en saldo", "no hay confirmacion suficiente del proveedor"],
    no_usar_si: ["el cliente deposito con tarjeta", "el saldo ya aparece dentro del juego", "el caso ya fue reportado a pagos"],
    respuesta_base: "Con gusto te apoyo. Para revisar tu deposito, por favor comparteme el CEP de Banxico o la clave de rastreo de la transferencia, junto con el monto y la hora aproximada en la que realizaste el movimiento. Con esa informacion podremos validar correctamente el estatus del pago.",
    respuesta_cliente_molesto: "Entiendo la molestia. Para revisarlo correctamente necesitamos validar el movimiento con el CEP o la clave de rastreo, ya que ese dato permite confirmar el estado real de la transferencia. Por favor compartemelo y con gusto lo revisamos.",
    reglas_internas: ["no confirmar abono sin CEP", "no prometer tiempo exacto", "no decir que el dinero esta perdido"]
  },
  {
    intent: "deposito_comprobante_no_sustituye_cep",
    categoria: "depositos",
    subcategoria: "comprobante_sin_cep",
    prioridad: "alta",
    riesgo: "bajo",
    modo: "plantilla_segura",
    triggers: ["tengo comprobante", "no tengo cep", "solo tengo captura", "comprobante bancario", "no me da cep"],
    datos_requeridos: ["comprobante bancario", "clave de rastreo", "monto", "fecha", "banco emisor"],
    condiciones_para_usar: ["el cliente solo tiene comprobante bancario", "la operacion fue SPEI", "el CEP no esta disponible aun"],
    no_usar_si: ["el metodo fue tarjeta", "ya existe CEP exitoso", "el deposito ya aparece abonado"],
    respuesta_base: "El comprobante bancario ayuda a revisar la operacion, pero no sustituye el CEP de Banxico. El CEP es el documento que confirma el estado real del SPEI. Si aun no aparece disponible, intenta consultarlo mas tarde y compartelo en PDF junto con la clave de rastreo para continuar la validacion.",
    respuesta_cliente_molesto: "Entiendo que ya tienes un comprobante, pero para validar correctamente un SPEI necesitamos el CEP de Banxico o la clave de rastreo. Ese documento permite confirmar si la operacion fue liquidada, rechazada o sigue pendiente.",
    reglas_internas: ["explicar diferencia comprobante vs CEP", "no rechazar evidencia parcial", "dejar en monitoreo si CEP no aparece"]
  },
  {
    intent: "deposito_tarjeta_cobrado_no_reflejado",
    categoria: "depositos",
    subcategoria: "tarjeta_cobrado_no_reflejado",
    prioridad: "alta",
    riesgo: "medio",
    modo: "sugerencia_agente",
    triggers: ["pague con tarjeta", "me cobraron tarjeta", "cargo en tarjeta", "tarjeta cobrado", "deposito con tarjeta no aparece"],
    datos_requeridos: ["correo registrado", "monto", "fecha y hora", "captura bancaria del cargo", "ultimos digitos si el proceso lo permite"],
    condiciones_para_usar: ["el cliente deposito con tarjeta", "el cargo aparece en su banco", "el saldo no aparece en Betxico"],
    no_usar_si: ["fue SPEI", "fue Oxxo/Spin/Mexpago", "el cargo esta rechazado o reversado"],
    respuesta_base: "Para revisar un deposito con tarjeta que aparece cobrado y no reflejado, por favor comparteme una captura completa del movimiento en tu banca donde se vea monto, fecha y estado del cargo. Con esa evidencia se revisa la conciliacion con el proveedor de pagos.",
    respuesta_cliente_molesto: "Entiendo la preocupacion. Cuando el banco muestra el cargo pero el saldo no aparece, necesitamos revisar la conciliacion con el proveedor. Comparte la captura completa del cargo y lo revisamos sin prometer abono hasta confirmar el estado de la operacion.",
    reglas_internas: ["no pedir CEP en tarjeta", "no confirmar abono sin conciliacion", "no prometer devolucion sin validacion"]
  },
  {
    intent: "deposito_saldo_visible_en_juego",
    categoria: "depositos",
    subcategoria: "saldo_visible_juego",
    prioridad: "alta",
    riesgo: "bajo",
    modo: "plantilla_segura",
    triggers: ["no aparece mi saldo", "saldo no refleja en lobby", "saldo dentro del juego", "deposito aparece en juego", "saldo disponible en casino"],
    datos_requeridos: ["correo registrado", "monto", "hora aproximada", "resultado de revisar dentro del juego"],
    condiciones_para_usar: ["el deposito aparece en sistema", "el saldo no se ve en pantalla principal", "se necesita validar sincronizacion visual"],
    no_usar_si: ["el deposito no aparece en sistema", "el saldo tampoco aparece dentro del juego", "hay error de proveedor confirmado"],
    respuesta_base: "Por favor ingresa a cualquier juego de casino y revisa si dentro del juego aparece tu saldo disponible. En ocasiones el saldo puede tardar en sincronizarse correctamente en la pantalla principal. Despues de entrar, sal del juego y revisa nuevamente tu saldo en la cuenta. Quedo atento a lo que te aparezca.",
    respuesta_cliente_molesto: "Entiendo la molestia. Para confirmar si es un tema de sincronizacion visual, necesitamos validar si el saldo aparece dentro de un juego de casino. Ingresa a cualquier juego, revisa el saldo disponible y despues vuelve a la pantalla principal para confirmar si se actualiza.",
    reglas_internas: ["usar solo si hay indicios de saldo en sistema", "si no aparece dentro del juego, escalar a pagos", "no decir que ya esta resuelto hasta confirmacion del cliente"]
  },
  {
    intent: "acceso_cambio_password_pedir_captura",
    categoria: "acceso_cuenta",
    subcategoria: "recuperacion_password",
    prioridad: "alta",
    riesgo: "bajo",
    modo: "plantilla_segura",
    triggers: ["no puedo entrar", "contraseña temporal", "me rechaza la contraseña", "cambiar contraseña", "recuperar contraseña"],
    datos_requeridos: ["correo registrado", "captura del error en login", "dispositivo o navegador"],
    condiciones_para_usar: ["el cliente no puede iniciar sesion", "el problema es credencial o login", "no hay bloqueo confirmado"],
    no_usar_si: ["cuenta bloqueada por seguridad", "KYC delicado", "autoexclusion o cierre definitivo"],
    respuesta_base: "Para ayudarte con el acceso, por favor enviame una captura del area de inicio de sesion donde se vea el correo que estas usando y el mensaje de error. Con eso validamos si el problema viene de la contraseña, el correo o la sesion.",
    respuesta_cliente_molesto: "Entiendo que es molesto no poder entrar. Para revisar el acceso correctamente necesito una captura del login con el correo usado y el mensaje de error. Asi evitamos darte una indicacion incorrecta.",
    reglas_internas: ["no enviar contraseñas reales en plantillas", "no exponer datos de cuenta", "validar titularidad si se cambia acceso"]
  },
  {
    intent: "acceso_cuenta_ya_registrada",
    categoria: "acceso_cuenta",
    subcategoria: "cuenta_existente",
    prioridad: "alta",
    riesgo: "medio",
    modo: "sugerencia_agente",
    triggers: ["ya tengo cuenta", "no me deja registrarme", "correo ya registrado", "cuenta existente", "betmexico"],
    datos_requeridos: ["correo registrado", "confirmacion de titularidad", "captura del error"],
    condiciones_para_usar: ["el sistema muestra cuenta ya registrada", "el cliente intenta crear cuenta nueva", "se requiere guiar recuperacion de acceso"],
    no_usar_si: ["hay cierre definitivo", "hay bloqueo por seguridad", "hay sospecha de suplantacion"],
    respuesta_base: "El sistema indica que ya existe una cuenta asociada a ese correo. Para ayudarte a recuperar el acceso, necesitamos validar que el correo sea tuyo y revisar la captura del error que aparece al intentar ingresar o registrarte.",
    respuesta_cliente_molesto: "Entiendo la confusion. Si ya existe una cuenta registrada, no conviene crear otra. Primero necesitamos validar el correo y el error que aparece para ayudarte a recuperar el acceso de forma segura.",
    reglas_internas: ["no crear cuentas duplicadas", "validar titularidad", "no revelar correos completos en respuestas universales"]
  },
  {
    intent: "acceso_enlace_externo_navegador_integrado",
    categoria: "acceso_cuenta",
    subcategoria: "navegador_externo",
    prioridad: "media",
    riesgo: "bajo",
    modo: "plantilla_segura",
    triggers: ["facebook", "instagram", "enlace externo", "navegador integrado", "no carga", "se cierra sesion"],
    datos_requeridos: ["navegador usado", "dispositivo", "captura del error"],
    condiciones_para_usar: ["el cliente abre desde app externa", "hay error de carga o sesion", "no hay bloqueo confirmado"],
    no_usar_si: ["error aparece tambien en Chrome/Safari", "hay bloqueo de cuenta", "hay problema de pagos o retiro"],
    respuesta_base: "Por favor cierra esa ventana y abre Betxico directamente desde Google Chrome o Safari escribiendo betxico.mx en la barra del navegador. Los enlaces abiertos desde Facebook, Instagram u otros navegadores integrados pueden generar errores de sesion o carga.",
    respuesta_cliente_molesto: "Entiendo que el error es incomodo. Para descartar que venga del navegador integrado, abre Betxico directamente desde Chrome o Safari escribiendo betxico.mx. Si el problema continua desde ahi, envianos captura del error.",
    reglas_internas: ["no asumir bloqueo", "pedir captura si persiste", "reclasificar si afecta retiro o KYC"]
  },
  {
    intent: "acceso_error_camara_verificacion",
    categoria: "acceso_cuenta",
    subcategoria: "camara_verificacion",
    prioridad: "media",
    riesgo: "medio",
    modo: "sugerencia_agente",
    triggers: ["camara", "cámara", "no abre la camara", "verificacion no carga", "selfie no carga", "permiso de camara"],
    datos_requeridos: ["dispositivo", "navegador", "captura del error", "si concedio permisos de camara"],
    condiciones_para_usar: ["el problema es la camara durante verificacion", "no hay rechazo documental confirmado", "se requieren pruebas de navegador"],
    no_usar_si: ["documento ya fue rechazado por calidad", "hay sospecha de suplantacion", "el problema es acceso general"],
    respuesta_base: "Para revisar el error de camara, intenta ingresar desde Chrome o Safari, concede permisos de camara al navegador y evita abrir Betxico desde enlaces externos. Si el error continua, comparte una captura del mensaje que aparece y el dispositivo que estas usando.",
    respuesta_cliente_molesto: "Entiendo la molestia. Para verificar si es un problema de permisos o navegador, necesitamos que pruebes desde Chrome o Safari con permisos de camara activos. Si persiste, envianos captura del error para revisarlo.",
    reglas_internas: ["no aprobar verificacion sin evidencia", "pedir captura si persiste", "escalar si falla despues de pruebas"]
  },
  {
    intent: "kyc_pedir_ine_ambos_lados",
    categoria: "kyc_documentos",
    subcategoria: "ine_ambos_lados",
    prioridad: "alta",
    riesgo: "bajo",
    modo: "plantilla_segura",
    triggers: ["ine", "documentos", "verificar cuenta", "validar identidad", "retiro por verificar"],
    datos_requeridos: ["INE frente", "INE reverso", "imagenes claras y legibles"],
    condiciones_para_usar: ["se requiere verificacion de identidad", "falta INE", "no hay rechazo por suplantacion"],
    no_usar_si: ["documento ya fue rechazado por fraude", "cliente no es titular", "se requiere caratula bancaria"],
    respuesta_base: "Para continuar con la verificacion, por favor comparte fotografia clara y legible de tu INE por ambos lados. Asegurate de que los datos se vean completos, sin recortes, reflejos o partes borrosas.",
    respuesta_cliente_molesto: "Entiendo que el proceso puede ser incomodo, pero la verificacion es necesaria para proteger tu cuenta. Envia tu INE por ambos lados de forma clara y legible para poder continuar la revision.",
    reglas_internas: ["no aprobar KYC manualmente", "no aceptar imagen borrosa", "validar titularidad"]
  },
  {
    intent: "kyc_pedir_selfie_sosteniendo_ine",
    categoria: "kyc_documentos",
    subcategoria: "selfie_ine",
    prioridad: "alta",
    riesgo: "bajo",
    modo: "plantilla_segura",
    triggers: ["selfie", "foto sosteniendo ine", "sosteniendo tu ine", "documento para retiro", "validacion de rostro"],
    datos_requeridos: ["selfie clara", "INE junto al rostro", "rostro y documento visibles"],
    condiciones_para_usar: ["falta selfie con INE", "se requiere validacion del titular", "no hay sospecha delicada confirmada"],
    no_usar_si: ["hay foto de foto", "hay suplantacion sospechada", "el cierre de cuenta requiere protocolo especial"],
    respuesta_base: "Para completar la validacion, por favor envia una selfie clara sosteniendo tu INE junto a tu rostro. Deben verse completos tu rostro y el documento, sin ediciones, reflejos o partes borrosas.",
    respuesta_cliente_molesto: "Entiendo la molestia. Esta selfie se solicita para confirmar que el tramite lo realiza el titular de la cuenta. Por favor compartela de forma clara sosteniendo tu INE junto a tu rostro.",
    reglas_internas: ["no aceptar foto de foto", "no aprobar si no coincide titularidad", "escalar si hay inconsistencia"]
  },
  {
    intent: "retiro_no_permitido_verificacion_pendiente",
    categoria: "retiros",
    subcategoria: "verificacion_pendiente",
    prioridad: "alta",
    riesgo: "medio",
    modo: "sugerencia_agente",
    triggers: ["no puedo retirar", "me piden documentos para retirar", "verificacion pendiente", "validar retiro", "documentacion para retiro"],
    datos_requeridos: ["estado de verificacion", "documentos faltantes", "monto del retiro", "correo registrado"],
    condiciones_para_usar: ["el retiro depende de verificacion", "faltan documentos", "no hay dictamen final"],
    no_usar_si: ["retiro failed/congelado", "retiro devuelto por banco", "KYC ya fue rechazado definitivamente"],
    respuesta_base: "Para continuar con el proceso de retiro, primero es necesario completar la verificacion solicitada. Comparte los documentos requeridos de forma clara y legible. Una vez recibidos, se enviaran a revision; el envio de documentos no significa aprobacion inmediata.",
    respuesta_cliente_molesto: "Entiendo la urgencia. La documentacion se solicita como parte del protocolo de seguridad para proteger la cuenta y confirmar al titular. En cuanto la compartas completa y legible, se enviara a revision para continuar con el retiro.",
    reglas_internas: ["no prometer liberacion inmediata", "validar documentos faltantes", "no mezclar con retiro failed"]
  },
  {
    intent: "retiro_bajo_revision_sin_tiempo",
    categoria: "retiros",
    subcategoria: "revision",
    prioridad: "alta",
    riesgo: "medio",
    modo: "sugerencia_agente",
    triggers: ["retiro en revision", "retiro pendiente", "no me han pagado", "cuanto tarda mi retiro", "retiro aprobado no reflejado"],
    datos_requeridos: ["estado actual del retiro", "monto", "fecha de solicitud", "si hay dictamen o documentos pendientes"],
    condiciones_para_usar: ["el retiro esta pendiente o en revision", "no hay dictamen confirmado", "no hay failed/congelado confirmado"],
    no_usar_si: ["retiro fue devuelto por banco", "retiro failed/congelado", "faltan documentos confirmados"],
    respuesta_base: "Tu retiro se encuentra en revision por el area correspondiente. Este proceso forma parte de las validaciones de seguridad y control. Por el momento no contamos con un tiempo exacto ni con un dictamen final; en cuanto exista una actualizacion o se requiera informacion adicional, se te notificara.",
    respuesta_cliente_molesto: "Entiendo tu molestia por la espera. En este momento el retiro continua en revision y no seria correcto darte un tiempo exacto o una causa no confirmada. En cuanto exista una actualizacion, se te notificara por este medio o directamente en tu cuenta.",
    reglas_internas: ["no prometer pago", "no dar tiempo exacto", "validar si ya existe dictamen"]
  },
  {
    intent: "retiro_congelado_failed_proveedor",
    categoria: "retiros",
    subcategoria: "failed_congelado",
    prioridad: "alta",
    riesgo: "medio",
    modo: "sugerencia_agente",
    triggers: ["retiro failed", "retiro congelado", "retiro atorado", "proveedor de pagos", "cancelacion de retiro"],
    datos_requeridos: ["estado failed o congelado", "monto", "fecha de solicitud", "si esta en seguimiento general"],
    condiciones_para_usar: ["el retiro aparece failed o congelado", "se requiere cancelacion/devolucion a saldo", "dependemos del proveedor"],
    no_usar_si: ["solo esta bajo revision", "fue devuelto por banco", "faltan documentos"],
    respuesta_base: "El retiro aparece detenido por una intermitencia del proveedor de pagos. El caso debe mantenerse en seguimiento para solicitar la cancelacion y devolucion del monto a saldo de casino. Este proceso no tiene tiempo exacto porque depende de la actualizacion del proveedor.",
    respuesta_cliente_molesto: "Entiendo que necesitas una respuesta exacta. En este tipo de casos dependemos de la actualizacion del proveedor de pagos, por eso no podemos prometer un tiempo definido. El seguimiento debe mantenerse hasta que el monto pueda devolverse a saldo de casino o exista una actualizacion.",
    reglas_internas: ["no duplicar tickets si ya esta en seguimiento", "no prometer devolucion inmediata", "validar estado failed/congelado"]
  },
  {
    intent: "juego_problema_pedir_evidencia",
    categoria: "juegos_saldo_proveedor",
    subcategoria: "pedir_evidencia_juego",
    prioridad: "alta",
    riesgo: "medio",
    modo: "sugerencia_agente",
    triggers: ["juego no abre", "juego se queda cargando", "error en juego", "me saca del juego", "problema con juego"],
    datos_requeridos: ["nombre exacto del juego", "captura o video del error", "hora aproximada", "dispositivo", "conexion usada"],
    condiciones_para_usar: ["el cliente reporta error tecnico de juego", "se requiere evidencia para revisar proveedor", "no hay validacion previa"],
    no_usar_si: ["solo reclama perdidas sin error", "es deposito no reflejado", "es saldo visible en juego"],
    respuesta_base: "Para revisar el problema con el juego, por favor comparte el nombre exacto del juego, captura o video del error, hora aproximada en que ocurrio, dispositivo utilizado y si estabas usando WiFi o datos moviles. Con esa informacion podremos revisar el caso con el proveedor si corresponde.",
    respuesta_cliente_molesto: "Entiendo la molestia. Para evitar darte una respuesta incorrecta necesitamos evidencia del error: nombre del juego, captura o video, hora aproximada, dispositivo y conexion usada. Con esos datos podemos revisar la sesion y validar el incidente.",
    reglas_internas: ["no prometer reposicion", "pedir evidencia completa", "si no hay error tecnico, reclasificar como perdidas"]
  },
  {
    intent: "juego_ganancia_no_reflejada_historial",
    categoria: "juegos_saldo_proveedor",
    subcategoria: "ganancia_no_reflejada",
    prioridad: "alta",
    riesgo: "medio",
    modo: "sugerencia_agente",
    triggers: ["ganancia no reflejada", "no me pago el juego", "premio no aparece", "historial del juego", "saldo descontado"],
    datos_requeridos: ["nombre exacto del juego", "hora de la jugada", "captura del historial", "monto reclamado", "captura del saldo"],
    condiciones_para_usar: ["el cliente reclama premio o saldo de juego", "se requiere validar historial", "no hay resolucion del proveedor"],
    no_usar_si: ["el reclamo es deposito", "solo son perdidas sin error", "el historial ya muestra resultado correcto"],
    respuesta_base: "Para revisar una ganancia o jugada no reflejada, comparte el nombre exacto del juego, hora aproximada, captura del historial de juego donde deberia verse la jugada y captura del saldo o movimiento afectado. Con esa evidencia se puede validar si existe una jugada pendiente o diferencia registrada.",
    respuesta_cliente_molesto: "Entiendo la preocupacion. Para revisar si hubo una ganancia o jugada pendiente necesitamos evidencia del historial del juego y del saldo afectado. Sin esa validacion no podemos confirmar reposicion o ajuste.",
    reglas_internas: ["no prometer reposicion", "validar historial antes de escalar", "no confundir con deposito no reflejado"]
  },
  {
    intent: "cliente_molesto_slots_perdidas",
    categoria: "cliente_molesto_quejas",
    subcategoria: "slots_perdidas",
    prioridad: "media",
    riesgo: "alto",
    modo: "sugerencia_agente",
    triggers: ["los slots no pagan", "me robaron", "casino fraude", "perdi todo", "quiero compensacion"],
    datos_requeridos: ["si existe error tecnico", "nombre del juego", "hora aproximada", "evidencia si reclama fallo"],
    condiciones_para_usar: ["el cliente reclama perdidas o acusa fraude", "no hay evidencia tecnica confirmada", "se debe mantener tono firme"],
    no_usar_si: ["hay evidencia concreta de error tecnico", "el reclamo es deposito o retiro", "existe caso escalado con dictamen"],
    respuesta_base: "Entendemos tu molestia. Los juegos de casino funcionan con resultados aleatorios y no existe garantia de ganancia por deposito o sesion. No podemos ofrecer compensacion por perdidas de juego. Si consideras que hubo un error tecnico especifico, comparte nombre del juego, hora aproximada y evidencia para revisarlo.",
    respuesta_cliente_molesto: "Entiendo que la situacion te moleste. Aun asi, no podemos confirmar compensacion por perdidas de juego sin evidencia de un error tecnico. Si hubo una falla especifica, comparte el nombre del juego, hora y captura o video para revisarlo conforme al proceso.",
    reglas_internas: ["no aceptar responsabilidad falsa", "no ofrecer bono por perdidas", "si hay evidencia, mover a problema tecnico de juego"]
  }
];

const DECISION_TREES = {
  depositos: [
    "Cliente dice: 'deposite y no aparece'.",
    "1. Si fue SPEI/transferencia, pedir CEP Banxico o clave de rastreo.",
    "2. Si fue tarjeta, pedir comprobante bancario completo y revisar conciliacion/proveedor.",
    "3. Si el deposito aparece en backoffice, validar si el saldo aparece dentro de un juego.",
    "4. Si el saldo aparece dentro del juego, tratar como sincronizacion visual.",
    "5. Si no aparece en backoffice ni dentro del juego, pedir evidencia completa y dejar en monitoreo/revision.",
    "6. Si solo tiene comprobante bancario, explicar que no sustituye el CEP."
  ],
  retiros: [
    "1. Confirmar estado del retiro: revision, approved, failed, congelado, devuelto o pendiente documental.",
    "2. Si esta en revision sin dictamen, no dar tiempo exacto ni prometer aprobacion.",
    "3. Si esta failed/congelado, usar seguimiento de proveedor y no prometer devolucion inmediata.",
    "4. Si faltan documentos, pedir documentos claros y explicar que se revisan antes de liberar.",
    "5. Si fue devuelto por banco/CLABE, pedir validacion bancaria y esperar regreso a saldo."
  ],
  bonos: [
    "1. Identificar si el cliente pide bono sin deposito, primer deposito, 10% casino u otro beneficio.",
    "2. Si pide bono sin deposito, informar que no esta disponible si no aparece promocion vigente.",
    "3. Si pide primer deposito, validar monto, una sola operacion y si ya hubo depositos previos.",
    "4. Si pide 10% casino, explicar activacion desde Promociones antes de jugar.",
    "5. Si ya jugo antes de activar, no prometer aplicacion retroactiva."
  ],
  acceso_cuenta: [
    "1. Identificar si no puede entrar, intenta registrarse, usa enlace externo o falla camara/sesion.",
    "2. Para login/password, pedir captura del login con correo y error.",
    "3. Para cuenta ya registrada, validar titularidad y evitar cuentas duplicadas.",
    "4. Para enlaces externos, pedir abrir betxico.mx directo en Chrome/Safari.",
    "5. Para camara/verificacion, revisar permisos y pedir captura si persiste."
  ],
  kyc_documentos: [
    "1. Confirmar que documento falta: INE, selfie, comprobante domicilio o caratula bancaria.",
    "2. Pedir imagen clara, completa y legible, sin recortes ni reflejos.",
    "3. Si hay selfie, solicitar rostro e INE visibles.",
    "4. Si hay rechazo por calidad, pedir nueva imagen clara.",
    "5. Si hay sospecha de suplantacion o foto de foto, no automatizar y escalar."
  ],
  juegos_saldo: [
    "1. Separar error tecnico de juego, saldo descontado, ganancia no reflejada o queja por perdidas.",
    "2. Para error tecnico, pedir juego, hora, captura/video, dispositivo y conexion.",
    "3. Para ganancia no reflejada, pedir historial de juego y captura de saldo.",
    "4. Para perdidas sin error, explicar aleatoriedad y no ofrecer compensacion.",
    "5. Si hay evidencia tecnica, escalar con proveedor."
  ],
  cliente_molesto: [
    "1. Reconocer molestia sin aceptar responsabilidad no confirmada.",
    "2. Identificar si reclama deposito, retiro, juego, bloqueo o perdida.",
    "3. Si amenaza legal/fraude/suplantacion/cierre definitivo, no automatizar.",
    "4. Pedir evidencia concreta si acusa error tecnico o movimiento de dinero.",
    "5. No prometer pagos, bonos, compensaciones ni tiempos exactos."
  ]
};

const DISCARD_REASONS = [
  { reason: "demasiado_especifica", patterns: [/bloqueo.*solicitado directamente por ti/i, /cl[aá]usula 14/i, /no sera posible volver a abrir/i, /Julio/i] },
  { reason: "incompleta", patterns: [/^ok\b/i, /^ahora$/i, /^realizaste alguna transferencia/i, /^puedes cancelarlo/i, /^por favor cierre sesion/i] },
  { reason: "mezcla_varios_temas", patterns: [/deposito.*cuenta.*volver a abrirla/i, /bono.*cep/i, /retiro.*partido/i] },
  { reason: "requiere_revision_manual", patterns: [/cuenta bloqueada/i, /autoexclusion/i, /cierre de cuenta/i, /dinero urgente/i, /proveedor/i, /backoffice/i] },
  { reason: "no_aporta_valor_como_plantilla", patterns: [/dame un momento/i, /quedo atento$/i, /tienes alguna duda/i, /gracias por esperar/i] }
];

const args = parseArgs(process.argv.slice(2));

try {
  main();
} catch (error) {
  console.error(`curate-support10-response-candidates failed: ${error.message}`);
  process.exit(1);
}

function main() {
  const inputPath = args.input || findLatestCandidateFile(DEFAULT_INPUT_DIR);
  const outputMd = args.outputMd || args["output-md"] || DEFAULT_OUTPUT_MD;
  const outputJson = args.outputJson || args["output-json"] || DEFAULT_OUTPUT_JSON;
  const source = readJson(inputPath);
  const candidates = Array.isArray(source.candidates) ? source.candidates : [];
  const enriched = candidates.map((candidate, index) => ({
    ...candidate,
    candidateId: candidate.candidateId || `support10_candidate_${String(index + 1).padStart(4, "0")}`
  }));

  const grouped = groupByRealIntent(enriched);
  const curatedTemplates = buildCuratedTemplates(enriched);
  const duplicateGroups = detectDuplicates(enriched);
  const duplicateIds = new Set(duplicateGroups.flatMap((group) => group.items.slice(1).map((item) => item.candidate_id)));
  const usedIds = new Set(curatedTemplates.flatMap((template) => template.fuentes.map((source) => source.candidate_id)));
  const discarded = buildDiscarded(enriched, usedIds, duplicateIds);

  const output = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    sourceInput: inputPath,
    summary: {
      totalCandidatasLeidas: enriched.length,
      totalGruposDetectados: grouped.length,
      totalPlantillasRecomendadas: curatedTemplates.length,
      totalDescartadas: discarded.items.length,
      totalDuplicadas: duplicateGroups.reduce((acc, group) => acc + Math.max(0, group.items.length - 1), 0),
      categoriasCubiertas: [...new Set(curatedTemplates.map((template) => template.categoria))].sort()
    },
    reglasGlobales: [
      "no prometer tiempos exactos",
      "no usar datos personales",
      "no confirmar abonos/retiros sin revisar",
      "no automatizar casos de alto riesgo",
      "usar tono formal Betxico"
    ],
    arbolesDecision: DECISION_TREES,
    gruposDetectados: grouped,
    plantillasRecomendadas: curatedTemplates,
    duplicadosDetectados: duplicateGroups,
    respuestasDescartadas: discarded,
    siguientePasoRecomendado: buildNextSteps(curatedTemplates)
  };

  fs.mkdirSync(path.dirname(outputMd), { recursive: true });
  fs.mkdirSync(path.dirname(outputJson), { recursive: true });
  fs.writeFileSync(outputJson, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  fs.writeFileSync(outputMd, toMarkdown(output), "utf8");

  console.log(`Candidatas leidas: ${output.summary.totalCandidatasLeidas}`);
  console.log(`Grupos detectados: ${output.summary.totalGruposDetectados}`);
  console.log(`Plantillas recomendadas: ${output.summary.totalPlantillasRecomendadas}`);
  console.log(`Descartadas: ${output.summary.totalDescartadas}`);
  console.log(`Duplicadas: ${output.summary.totalDuplicadas}`);
  console.log(`Categorias cubiertas: ${output.summary.categoriasCubiertas.join(", ")}`);
  console.log(`MD: ${outputMd}`);
  console.log(`JSON: ${outputJson}`);
}

function buildCuratedTemplates(candidates) {
  return PRIORITY_TEMPLATES
    .map((template) => {
      const matched = findSourcesForTemplate(candidates, template);
      return {
        ...template,
        fuentes: matched.slice(0, 5).map(toSource),
        estado_revision: "pendiente_aprobacion"
      };
    })
    .filter((template) => template.fuentes.length > 0 || mustKeepTemplate(template.intent))
    .slice(0, MAX_RECOMMENDED_TEMPLATES);
}

function mustKeepTemplate(intent) {
  return [
    "deposito_spei_no_reflejado_pedir_cep",
    "deposito_saldo_visible_en_juego",
    "bono_sin_deposito_no_disponible",
    "bono_primer_deposito_condiciones",
    "kyc_pedir_ine_ambos_lados",
    "kyc_pedir_selfie_sosteniendo_ine",
    "juego_problema_pedir_evidencia"
  ].includes(intent);
}

function findSourcesForTemplate(candidates, template) {
  const triggerWords = template.triggers.map(normalizeText);
  const categoryAliases = categoryAliasesFor(template.categoria);
  return candidates
    .map((candidate) => {
      const text = normalizeText([
        candidate.category,
        candidate.suggestedIntent,
        candidate.customerSituation,
        candidate.realAgentResponse,
        candidate.cleanRecommendedResponse,
        candidate.confirmationFragment
      ].join("\n"));
      let score = categoryAliases.some((category) => normalizeText(candidate.category) === category) ? 8 : 0;
      for (const trigger of triggerWords) {
        if (text.includes(trigger)) score += 8;
      }
      for (const word of keywordsForTemplate(template)) {
        if (text.includes(normalizeText(word))) score += 3;
      }
      if (candidate.customerConfirmed) score += 2;
      if (candidate.riskLevel === template.riesgo || riskToSpanish(candidate.riskLevel) === template.riesgo) score += 1;
      return { candidate, score };
    })
    .filter((item) => item.score >= 8)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.candidate);
}

function keywordsForTemplate(template) {
  const byIntent = {
    bono_sin_deposito_no_disponible: ["gratis", "registro", "sin deposito", "descargar", "no contamos"],
    bono_primer_deposito_condiciones: ["primer deposito", "100", "monto", "operacion", "depositos separados"],
    bono_10_casino_activacion: ["10%", "250", "promociones", "activar", "casino"],
    bono_no_disponible_cashback_lealtad: ["cumpleaños", "cashback", "lealtad", "referido", "no cuenta"],
    deposito_spei_no_reflejado_pedir_cep: ["spei", "cep", "banxico", "clave de rastreo", "transferencia"],
    deposito_comprobante_no_sustituye_cep: ["comprobante", "cep", "banxico", "no sustituye", "clave"],
    deposito_tarjeta_cobrado_no_reflejado: ["tarjeta", "cargo", "banco", "conciliacion", "proveedor"],
    deposito_saldo_visible_en_juego: ["juego", "saldo", "lobby", "sincronizar", "aparece dentro"],
    acceso_cambio_password_pedir_captura: ["contraseña", "login", "captura", "correo", "error"],
    acceso_cuenta_ya_registrada: ["cuenta", "registrada", "correo", "titularidad"],
    acceso_enlace_externo_navegador_integrado: ["facebook", "instagram", "chrome", "safari", "enlace"],
    acceso_error_camara_verificacion: ["camara", "selfie", "permiso", "verificacion"],
    kyc_pedir_ine_ambos_lados: ["ine", "ambos lados", "credencial", "documentos"],
    kyc_pedir_selfie_sosteniendo_ine: ["selfie", "sosteniendo", "rostro", "ine"],
    retiro_no_permitido_verificacion_pendiente: ["retiro", "documentos", "verificacion", "pendiente"],
    retiro_bajo_revision_sin_tiempo: ["retiro", "revision", "pendiente", "validacion"],
    retiro_congelado_failed_proveedor: ["failed", "congelado", "proveedor", "cancelacion"],
    juego_problema_pedir_evidencia: ["juego", "captura", "video", "error", "proveedor"],
    juego_ganancia_no_reflejada_historial: ["ganancia", "historial", "jugada", "premio", "saldo"],
    cliente_molesto_slots_perdidas: ["robo", "fraude", "slots", "perdidas", "compensacion"]
  };
  return byIntent[template.intent] || [];
}

function categoryAliasesFor(category) {
  const aliases = {
    acceso_cuenta: ["acceso_cuenta"],
    bonos_promociones: ["bonos_promociones"],
    depositos: ["depositos", "juegos_saldo_proveedor"],
    retiros: ["retiros", "kyc_documentos"],
    kyc_documentos: ["kyc_documentos", "perfil_datos"],
    juegos_saldo_proveedor: ["juegos_saldo_proveedor", "depositos"],
    perfil_datos: ["perfil_datos"],
    cliente_molesto_quejas: ["cliente_molesto_quejas", "general"]
  };
  return aliases[category] || [category];
}

function toSource(candidate) {
  return {
    candidate_id: candidate.candidateId,
    chat_id: candidate.chatId || "",
    created_at: candidate.source?.agentEventAt || candidate.dateMx || "",
    agent: candidate.source?.agentName || "Soporte 10"
  };
}

function groupByRealIntent(candidates) {
  const groups = new Map();
  for (const candidate of candidates) {
    const intent = inferRealIntent(candidate);
    if (!groups.has(intent.intent)) {
      groups.set(intent.intent, {
        intent: intent.intent,
        categoria: intent.categoria,
        subcategoria: intent.subcategoria,
        total: 0,
        ejemplos: []
      });
    }
    const group = groups.get(intent.intent);
    group.total += 1;
    if (group.ejemplos.length < 3) {
      group.ejemplos.push({
        candidate_id: candidate.candidateId,
        chat_id: candidate.chatId,
        situacion: safeSnippet(candidate.customerSituation),
        respuesta: safeSnippet(candidate.cleanRecommendedResponse)
      });
    }
  }
  return [...groups.values()].sort((a, b) => b.total - a.total || a.intent.localeCompare(b.intent));
}

function inferRealIntent(candidate) {
  const text = normalizeText(`${candidate.category}\n${candidate.customerSituation}\n${candidate.cleanRecommendedResponse}`);
  const match = PRIORITY_TEMPLATES
    .map((template) => {
      let score = categoryAliasesFor(template.categoria).includes(normalizeText(candidate.category)) ? 6 : 0;
      for (const word of keywordsForTemplate(template)) {
        if (text.includes(normalizeText(word))) score += 3;
      }
      for (const trigger of template.triggers) {
        if (text.includes(normalizeText(trigger))) score += 5;
      }
      return { template, score };
    })
    .sort((a, b) => b.score - a.score)[0];
  if (match?.score > 0) {
    return {
      intent: match.template.intent,
      categoria: match.template.categoria,
      subcategoria: match.template.subcategoria
    };
  }
  return {
    intent: candidate.suggestedIntent || "general_soporte",
    categoria: candidate.category || "general",
    subcategoria: "sin_subcategoria"
  };
}

function detectDuplicates(candidates) {
  const buckets = new Map();
  for (const candidate of candidates) {
    const key = `${candidate.category}:${normalizeForDuplicate(candidate.cleanRecommendedResponse)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(candidate);
  }
  return [...buckets.values()]
    .filter((items) => items.length > 1)
    .map((items) => ({
      motivo: "respuesta_similar",
      intent_sugerido: inferRealIntent(items[0]).intent,
      total: items.length,
      items: items.map((item) => ({
        candidate_id: item.candidateId,
        chat_id: item.chatId,
        fragmento: safeSnippet(item.cleanRecommendedResponse, 180)
      }))
    }));
}

function buildDiscarded(candidates, usedIds, duplicateIds) {
  const groups = {
    demasiado_especifica: [],
    incompleta: [],
    contiene_datos_personales: [],
    mezcla_varios_temas: [],
    requiere_revision_manual: [],
    no_aporta_valor_como_plantilla: [],
    duplicada: []
  };

  for (const candidate of candidates) {
    if (usedIds.has(candidate.candidateId)) continue;
    if (duplicateIds.has(candidate.candidateId)) {
      groups.duplicada.push(discardItem(candidate, "duplicada"));
      continue;
    }
    const reason = detectDiscardReason(candidate);
    groups[reason].push(discardItem(candidate, reason));
  }

  return {
    porMotivo: Object.fromEntries(Object.entries(groups).map(([reason, items]) => [reason, items.length])),
    items: Object.entries(groups).flatMap(([, items]) => items)
  };
}

function detectDiscardReason(candidate) {
  const text = `${candidate.customerSituation}\n${candidate.cleanRecommendedResponse}`;
  if (hasSensitiveLeak(text)) return "contiene_datos_personales";
  for (const rule of DISCARD_REASONS) {
    if (rule.patterns.some((pattern) => pattern.test(text))) return rule.reason;
  }
  if (cleanText(candidate.cleanRecommendedResponse).length < 70) return "incompleta";
  return "requiere_revision_manual";
}

function discardItem(candidate, reason) {
  return {
    candidate_id: candidate.candidateId,
    chat_id: candidate.chatId,
    categoria: candidate.category,
    motivo: reason,
    fragmento: safeSnippet(candidate.cleanRecommendedResponse, 220)
  };
}

function buildNextSteps(templates) {
  return {
    intentsJson: templates.filter((template) => ["plantilla_segura", "sugerencia_agente"].includes(template.modo)).map((template) => template.intent),
    fallbackSinGpt: templates.filter((template) => template.modo === "plantilla_segura").map((template) => template.intent),
    kvExamples: templates.filter((template) => template.fuentes.length > 0).map((template) => template.intent),
    baseMdOperativa: templates.filter((template) => template.reglas_internas.length >= 3 || template.riesgo !== "bajo").map((template) => template.intent)
  };
}

function toMarkdown(output) {
  const lines = [];
  lines.push("# Plantillas Curadas Soporte 10 V1");
  lines.push("");
  lines.push("## Resumen");
  lines.push("");
  lines.push(`- total candidatas leidas: ${output.summary.totalCandidatasLeidas}`);
  lines.push(`- total grupos detectados: ${output.summary.totalGruposDetectados}`);
  lines.push(`- total plantillas recomendadas: ${output.summary.totalPlantillasRecomendadas}`);
  lines.push(`- total descartadas: ${output.summary.totalDescartadas}`);
  lines.push(`- total duplicadas: ${output.summary.totalDuplicadas}`);
  lines.push(`- fecha del analisis: ${output.generatedAt}`);
  lines.push(`- categorias cubiertas: ${output.summary.categoriasCubiertas.join(", ")}`);
  lines.push("");
  lines.push("## Reglas globales");
  lines.push("");
  for (const rule of output.reglasGlobales) lines.push(`- ${rule}`);
  lines.push("");
  lines.push("## Arboles de decision");
  lines.push("");
  addDecisionTree(lines, "Depositos", output.arbolesDecision.depositos);
  addDecisionTree(lines, "Retiros", output.arbolesDecision.retiros);
  addDecisionTree(lines, "Bonos", output.arbolesDecision.bonos);
  addDecisionTree(lines, "Acceso / cuenta", output.arbolesDecision.acceso_cuenta);
  addDecisionTree(lines, "KYC / documentos", output.arbolesDecision.kyc_documentos);
  addDecisionTree(lines, "Juegos / saldo / proveedor", output.arbolesDecision.juegos_saldo);
  addDecisionTree(lines, "Cliente molesto", output.arbolesDecision.cliente_molesto);
  lines.push("## Plantillas recomendadas");
  lines.push("");
  for (const template of output.plantillasRecomendadas) {
    lines.push(`### ${template.intent}`);
    lines.push("");
    lines.push(`- categoria: ${template.categoria}`);
    lines.push(`- subcategoria: ${template.subcategoria}`);
    lines.push(`- prioridad: ${template.prioridad}`);
    lines.push(`- riesgo: ${template.riesgo}`);
    lines.push(`- modo: ${template.modo}`);
    lines.push(`- estado_revision: ${template.estado_revision}`);
    lines.push(`- cuando usar: ${template.condiciones_para_usar.join("; ")}`);
    lines.push(`- cuando no usar: ${template.no_usar_si.join("; ")}`);
    lines.push(`- datos requeridos: ${template.datos_requeridos.join("; ")}`);
    lines.push("");
    lines.push("**Respuesta base**");
    lines.push("");
    lines.push(blockquote(template.respuesta_base));
    lines.push("");
    lines.push("**Respuesta cliente molesto**");
    lines.push("");
    lines.push(blockquote(template.respuesta_cliente_molesto));
    lines.push("");
    lines.push(`**Reglas internas:** ${template.reglas_internas.join("; ")}`);
    lines.push("");
    lines.push("**Fuentes candidatas usadas**");
    lines.push("");
    if (!template.fuentes.length) {
      lines.push("- Sin fuente directa suficiente; plantilla prioritaria definida por regla operativa.");
    } else {
      for (const source of template.fuentes) {
        lines.push(`- ${source.candidate_id} | chat ${source.chat_id} | ${source.created_at} | ${source.agent}`);
      }
    }
    lines.push("");
  }
  lines.push("## Duplicados detectados");
  lines.push("");
  if (!output.duplicadosDetectados.length) {
    lines.push("- Sin duplicados relevantes detectados.");
  } else {
    for (const group of output.duplicadosDetectados.slice(0, 30)) {
      lines.push(`- ${group.intent_sugerido}: ${group.total} respuestas similares`);
      for (const item of group.items.slice(0, 5)) lines.push(`  - ${item.candidate_id} | chat ${item.chat_id} | ${item.fragmento}`);
    }
  }
  lines.push("");
  lines.push("## Respuestas descartadas");
  lines.push("");
  for (const [reason, total] of Object.entries(output.respuestasDescartadas.porMotivo)) {
    lines.push(`### ${reason} (${total})`);
    lines.push("");
    for (const item of output.respuestasDescartadas.items.filter((entry) => entry.motivo === reason).slice(0, 12)) {
      lines.push(`- ${item.candidate_id} | chat ${item.chat_id} | ${item.fragmento}`);
    }
    lines.push("");
  }
  lines.push("## Siguiente paso recomendado");
  lines.push("");
  lines.push("- Subir a intents JSON: " + output.siguientePasoRecomendado.intentsJson.join(", "));
  lines.push("- Activar en fallback sin GPT: " + output.siguientePasoRecomendado.fallbackSinGpt.join(", "));
  lines.push("- Convertir en KV examples: " + output.siguientePasoRecomendado.kvExamples.join(", "));
  lines.push("- Ampliar base MD operativa: " + output.siguientePasoRecomendado.baseMdOperativa.join(", "));
  lines.push("");
  lines.push("Nota: este archivo es de revision. No modifica KV, intents JSON ni la base documental productiva.");
  return `${lines.join("\n")}\n`;
}

function addDecisionTree(lines, title, steps) {
  lines.push(`### ${title}`);
  lines.push("");
  for (const step of steps) lines.push(`- ${step}`);
  lines.push("");
}

function blockquote(text) {
  return cleanText(text).split("\n").map((line) => `> ${line}`).join("\n");
}

function findLatestCandidateFile(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`candidate_dir_not_found: ${dir}`);
  }
  const files = fs.readdirSync(dir)
    .filter((file) => file.startsWith("respuestas_candidatas_") && file.endsWith(".json"))
    .map((file) => path.join(dir, file))
    .map((file) => ({ file, mtime: fs.statSync(file).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (!files.length) {
    throw new Error(`candidate_json_not_found_in: ${dir}`);
  }
  return files[0].file;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function normalizeForDuplicate(value) {
  return normalizeText(value)
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\b\d+\b/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 28)
    .join(" ");
}

function safeSnippet(value, max = 160) {
  const clean = cleanText(value);
  return clean.length > max ? `${clean.slice(0, max - 3)}...` : clean;
}

function hasSensitiveLeak(value) {
  return /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(value)
    || /\b\d{10,}\b/.test(value)
    || /contrase(?:ñ|n)a\s+(?:sera|será|es|temporal)\s*:?\s*(?!\[)/i.test(value);
}

function riskToSpanish(value) {
  const clean = normalizeText(value);
  if (clean === "low") return "bajo";
  if (clean === "medium") return "medio";
  if (clean === "high") return "alto";
  return clean;
}

function cleanText(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\u200e/g, "")
    .replace(/\u00a0/g, " ")
    .trim();
}

function normalizeText(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
