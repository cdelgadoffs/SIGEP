# Contrato del API (v1)

Fuente de verdad de lo que `services/LocalAPI/` simula y `services/ServerConnection/` consume. Es lo que implementa el backend. Cualquier cambio se hace **aquí primero**.

Todas las operaciones son asíncronas. Los datos viajan como JSON. Los errores tienen siempre la forma `{ codigo, mensaje }` (`services/ApiError.js`).

## Convenciones

- Todos los timestamps son ISO 8601 UTC, asignados por el **servidor**.
- Todo registro modificable lleva `version` (entero, empieza en 1, +1 en cada cambio). Se usa para detectar conflictos.
- El **reloj del servidor** define "hoy". El cliente nunca decide estados.
- Los datos **derivados** (`estado`, `numeroSesion`) no se guardan: se calculan al leer.
- La identidad y el rol salen del token en el servidor, nunca del cliente.

## Modelo

### Sesión
| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Fecha `YYYY-MM-DD`. Es la identidad natural: **una sesión por fecha**. |
| `numeroSesion` | int \| null | Derivado. Consecutivo oficial **dentro de su año** (el de `id`): reinicia en 1 cada año. Avanza en `celebrada`, `proxima` y `pendiente`; una `no-celebrada` no tiene número (`null`) ni consume uno. |
| `estado` | string | Derivado. `celebrada` · `proxima` · `no-celebrada` · `pendiente`. |
| `celebrada` | bool | Hecho persistido. |
| `celebradaEn` | string \| null | Timestamp. |
| `version` | int | |

Reglas de `estado` (con la fecha de hoy del servidor, entre sesiones ordenadas por `id`):
`celebrada` si `celebrada`; `proxima` si es la primera con `id >= hoy` y no celebrada; `no-celebrada` si `id < hoy` y no celebrada; `pendiente` en cualquier otro caso.

### Calendario
Un calendario por año: es el dato a partir del cual se generan las sesiones ordinarias.

| Campo | Tipo | Notas |
|---|---|---|
| `anio` | int | Identidad natural: **un calendario por año**. |
| `diaSemana` | int | 1 (lunes) … 5 (viernes): día de las sesiones ordinarias. |
| `vacaciones` | `{ inicio, fin }[]` | Periodos `YYYY-MM-DD`, con `inicio <= fin`. |
| `asuetos` | `{ fecha, destino }[]` | `fecha`: día de sesión del año que se reprograma (debe caer en `diaSemana`); `destino`: el día anterior o el siguiente (`fecha ± 1`). Una entrada por `fecha`. Se administran **solo** con `agregarAsueto` y `quitarAsueto`; no se mandan al generar. |
| `version`, `modificadoEn`, `modificadoPor` | | Control de versiones y autoría, del servidor. |

Generación de fechas (regla del servidor): desde el primer `diaSemana` del año, una fecha cada 7 días hasta terminar el año. Una fecha dentro de unas vacaciones se omite; si tiene asueto se usa su `destino`, que a su vez se omite si cae en vacaciones.

### Punto
| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Asignado por el servidor (UUID). |
| `sesionId` | string | Sesión a la que pertenece. Obligatorio. |
| `seccion` | string | `id` de un elemento del catálogo `secciones`. |
| `remitente` | string | `id` de un elemento del catálogo `remitentes`. |
| `contenido` | string | Obligatorio, máx. 20 000 caracteres. |
| `acuerdo` | string | Obligatorio si la sección tiene `requiereAcuerdo: true`; si no, se guarda vacío. Máx. 20 000. |
| `confidencial` | bool | |
| `archivos` | `Archivo[]` | Metadatos de los archivos adjuntos (ver "Archivo"). |
| `orden` | int | Posición dentro de su (sesión, sección), 1…n (ver "Orden"). |
| `tratado` | bool | Marca de la celebración: el punto ya se trató. Empieza en `false`; los puntos anteriores al campo se leen como `false`. Solo cambia con `marcarPunto`. |
| `numero` | int | **Derivado.** Posición del punto en el orden del documento de su sesión, empezando en 1 (ver "Numeración y puntos fijos"). Todo `Punto` que el API devuelve lo lleva. |
| `fijo` | bool | **Derivado.** `true` en los puntos autogenerados (no se guardan como puntos; ver abajo). |
| `encabezado` | bool | **Derivado.** Solo en puntos fijos que funcionan como título de una sección (cuentan en la numeración, pero no son puntos a tratar). |
| `version` | int | |
| `creadoPor`, `creadoEn`, `modificadoEn` | string | Autoría y fechas, del servidor. |

### Archivo
| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Asignado por el servidor. |
| `nombre` | string | Nombre original del archivo. |
| `tipo` | string | Tipo MIME. |
| `tamano` | int | Bytes. |
| `creadoEn`, `creadoPor` | string | Del servidor. |

`Punto.archivos` es `Archivo[]`. Reglas, todas del servidor (los valores se editan en `LocalAPI/reglas.js` y en el backend):
- Máximo **100 MB por archivo** y **30 archivos por punto**.
- Tipos permitidos: PDF, Word (`.doc`, `.docx`), Excel (`.xls`, `.xlsx`) e imágenes (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`). Cualquier otro → `ARCHIVO_INVALIDO`.
- El contenido binario nunca viaja dentro del `Punto`: se obtiene con `descargarArchivo`. El caché del cliente guarda solo los metadatos.

### Numeración y puntos fijos

El **orden del documento** de una sesión es: las secciones en el orden de su catálogo; dentro de cada sección, primero los puntos fijos (en el orden de su catálogo) y después los puntos del capturista por `orden`. El `numero` de cada punto es su posición en ese orden (1…N), **contando también los confidenciales y los fijos**. Se calcula al leer: nunca se guarda, y cambia solo si el orden cambia (crear, eliminar, mover, cambiar de sección). El cliente lo presenta como `PLE/001`.

**Puntos fijos (autogenerados).** Los define el catálogo `puntosFijos`; el servidor los agrega a `listarPuntos` de cada sesión ordinaria. En este proyecto:

| `id` del catálogo | Sección | Texto | Condición |
|---|---|---|---|
| `orden-dia` | `actas` | "Aprobación, en su caso, del orden del día." | Siempre |
| `acta-anterior` | `actas` | "Aprobación, en su caso, del acta de la sesión ordinaria del {fecha}." | Solo si la sesión anterior ya fue celebrada (`{fecha}`: la de esa sesión, "7 de octubre de 2026") |
| `asuntos-generales` | `asuntos-generales` | "Asuntos generales." | Siempre (es `encabezado`) |

- El `id` de un punto fijo es `fijo:<sesionId>:<id del catálogo>`. Siempre ocupan el primer lugar de su sección y **no se pueden editar, eliminar, mover ni adjuntarles archivos** (`VALIDACION`).
- Sí se pueden marcar como tratados (`marcarPunto`, `marcarPuntos`); el servidor guarda esa marca en la sesión. Un `encabezado` no se marca.
- Los fijos nunca existen como registros en el almacén de puntos: se generan al leer.

### Orden
- `Punto.orden`: entero (1…n) dentro de cada (`sesionId`, `seccion`). Al crear un punto queda **al final** de su sección. `listarPuntos` devuelve ordenado por `orden`.
- No tiene que ser contiguo tras eliminar; `reordenarPuntos` lo reescribe a 1…n.
- Solo cambian de `version` y `modificadoEn` los puntos cuyo `orden` cambió.
- Si `editarPunto` cambia la `seccion` de un punto, queda **al final** de la nueva sección.
- Los puntos creados antes de existir `orden` reciben uno al actualizar la base, según su fecha de creación.

### Catálogos

Los catálogos de dominio son **datos, no código**: el API ofrece un mecanismo genérico y cada proyecto carga sus propias filas (semilla). El API valida contra lo que haya cargado y aplica los atributos sin saber qué significan. Así el motor es reutilizable entre proyectos.

El **orden** de cada catálogo es significativo: es el orden en que el cliente los presenta.

`listarCatalogos()` devuelve `{ [nombreCatalogo]: Item[] }`, donde cada `Item` es `{ id, nombre, ...atributos }`. En este proyecto:

| Catálogo | Atributos | Valores actuales |
|---|---|---|
| `secciones` | `requiereAcuerdo: bool` | En este orden: `actas`, `proyectos-de-acuerdo`, `tomas-de-nota-licencias`, `informes` (false), `asuntos-generales` (todas las demás: true) |
| `remitentes` | — | `pleno`, `presidencia`, `secretaria-general` |

Lo que **no** es catálogo y vive solo en el cliente: la estructura de la interfaz (menú, textos, íconos).

## Operaciones

| Operación | Entrada | Salida | Errores |
|---|---|---|---|
| `listarCatalogos()` | — | `{ secciones: Item[], remitentes: Item[] }` | — |
| `listarSesiones()` | — | `Sesion[]` (con derivados, ordenadas por `id`) | — |
| `crearSesiones(fechas)` | `string[]` de fechas `YYYY-MM-DD` | `Sesion[]` (la lista completa actualizada) | `NO_AUTORIZADO`, `VALIDACION` |
| `celebrarSesion(id)` | id de sesión | `Sesion` actualizada | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA` |
| `listarPuntos(sesionId)` | id de sesión | `Punto[]` en el orden del documento, con `numero`, **incluyendo los puntos fijos y con los confidenciales ocultos según el usuario** (ver "Permisos") | — |
| `crearPunto(sesionId, datos)` | sesión + `{ seccion, remitente, contenido, acuerdo, confidencial, archivos }` | `Punto` creado | `NO_AUTORIZADO`, `VALIDACION`, `NO_ENCONTRADO`, `SESION_CELEBRADA` |
| `editarPunto(id, version, cambios)` | id, `version` que el cliente tiene, campos a cambiar | `Punto` actualizado | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `CONFLICTO`, `VALIDACION` |
| `eliminarPunto(id)` | id | — | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA` |

### Operaciones de calendario

| Operación | Entrada | Salida | Errores |
|---|---|---|---|
| `obtenerCalendario(anio)` | año (int) | `Calendario` \| `null` | `VALIDACION` |
| `generarCalendarioAnual(anio, datos, sobrescribir)` | año, `{ diaSemana, vacaciones }`, bool | `{ calendario, sesiones }` (el calendario guardado y la lista completa de sesiones con derivados) | `NO_AUTORIZADO`, `VALIDACION`, `CALENDARIO_EXISTE` |
| `agregarAsueto(anio, asueto)` | año, `{ fecha, destino }` | `{ calendario, sesiones }` | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `VALIDACION`, `SESION_CELEBRADA` |
| `quitarAsueto(anio, fecha)` | año, fecha del asueto | `{ calendario, sesiones }` | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `VALIDACION`, `SESION_CELEBRADA` |

- `generarCalendarioAnual` guarda el calendario del año y crea las sesiones que falten (las existentes se conservan con su `celebrada`). Es **atómica** y **idempotente**.
- Si ya existe un calendario de ese año y `sobrescribir` no es `true` → `CALENDARIO_EXISTE`.
- Con `sobrescribir: true` se eliminan las sesiones **de ese año** que ya no corresponden a las fechas generadas, **siempre que no estén celebradas y no tengan puntos**; las demás se conservan.
- Al generar se aplican también los `asuetos` que el calendario ya tenía, salvo que cambie `diaSemana` (entonces se descartan, porque dependen del día).
- Validación (`VALIDACION`): `anio` entero entre 2000 y 2100; `diaSemana` entero de 1 a 5; cada vacación con fechas válidas e `inicio <= fin`.
- **Asuetos sin regenerar el calendario.** `agregarAsueto` exige que el año ya tenga calendario (`NO_ENCONTRADO` si no). Valida que `fecha` sea del año y caiga en `diaSemana`, que `destino` sea `fecha ± 1` y no caiga en vacaciones, y que no haya ya un asueto en esa `fecha`. La sesión de `fecha` debe existir, no estar celebrada (`SESION_CELEBRADA`) ni tener puntos (`VALIDACION`): se elimina y se crea la del `destino` (si no existía). `quitarAsueto` revierte: elimina la sesión del `destino` (que no debe estar celebrada ni tener puntos) y recrea la de `fecha` si no cae en vacaciones. Ambas son atómicas y suben la `version` del calendario.
- `crearSesiones(fechas)` sigue en el contrato (para sesiones sueltas, como las extraordinarias), pero el cliente no la usa hoy.

### Operaciones de archivos, de orden y de celebración

| Operación | Entrada | Salida | Errores |
|---|---|---|---|
| `marcarPunto(id, tratado)` | id de punto + bool | `Punto` actualizado | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `VALIDACION` |
| `marcarPuntos(sesionId, tratado)` | id de sesión + bool | `Punto[]` de la sesión (ordenados, ya filtrados según el usuario) | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `VALIDACION` |
| `adjuntarArchivos(puntoId, archivos)` | id de punto + archivos (binarios) | `Punto` actualizado (`version` + 1) | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `ARCHIVO_INVALIDO` |
| `eliminarArchivo(puntoId, archivoId)` | ids | `Punto` actualizado | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA` |
| `descargarArchivo(archivoId)` | id | `{ nombre, tipo, blob }` (en el servidor real, una URL firmada) | `NO_AUTORIZADO`, `NO_ENCONTRADO` |
| `reordenarPuntos(sesionId, seccion, ids)` | sesión, sección e **ids de la sección en el orden deseado** | `Punto[]` de esa sección, ya ordenados | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `CONFLICTO`, `VALIDACION` |

- `marcarPunto(id, tratado)` fija `tratado` (bool) del punto y devuelve el `Punto` actualizado. Es **idempotente** (repetir el mismo valor no cambia nada ni sube `version`) y no exige `version`: solo guarda un valor, no hay edición concurrente que proteger. Errores: `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `VALIDACION` (si `tratado` no es booleano). Solo cuando cambia el valor se incrementa `version` y se actualiza `modificadoEn`.
- `marcarPuntos` fija `tratado` en **todos** los puntos de la sesión que el usuario puede ver, en una sola operación **atómica** (o se aplican todos o ninguno). Es idempotente: solo cambian de `version` y `modificadoEn` los puntos cuyo valor cambió.
- `editarPunto` **no** modifica `tratado`.
- **Todo `Punto` que devuelve el API lleva su `numero`.** Como crear, eliminar, mover o cambiar de sección **renumera** a otros puntos, el cliente vuelve a pedir `listarPuntos` después de esas operaciones; `marcarPunto`, `adjuntarArchivos` y `eliminarArchivo` no renumeran y devuelven el punto ya con su `numero`.
- Las operaciones que modifican un punto (`editarPunto`, `eliminarPunto`, `adjuntarArchivos`, `eliminarArchivo`) rechazan un **punto fijo** con `VALIDACION`. `marcarPunto` y `marcarPuntos` sí lo marcan (salvo los `encabezado`).
- `crearPunto` acepta `archivos` (binarios) opcionales y los valida con las mismas reglas de `adjuntarArchivos`. El formato antiguo `[{ nombre }]` se rechaza con `ARCHIVO_INVALIDO`.
- Las operaciones que tocan el punto y sus binarios (crear con archivos, adjuntar, quitar, y la cascada al eliminar el punto) son **atómicas**: o se aplican todas o ninguna.
- `editarPunto` **no** modifica `archivos` ni `orden`: para eso están `adjuntarArchivos`, `eliminarArchivo` y `reordenarPuntos`.
- `reordenarPuntos` recibe el orden **completo** de los puntos del capturista de la sección (**sin** los fijos, que siempre van primero) y devuelve todos los puntos de esa sección, fijos incluidos y con su `numero` nuevo; recibe el orden **completo** de la sección (atómico e idempotente: repetir el mismo orden no cambia nada). Si `ids` no es exactamente el conjunto actual de puntos de esa sección → `CONFLICTO` y el cliente recarga. Sección inexistente o `ids` que no es una lista → `VALIDACION`.

Notas de comportamiento:
- `crearSesiones` es **idempotente**: las fechas que ya existen se ignoran (no resetea `celebrada`); devuelve siempre la lista completa porque los derivados de las demás sesiones pueden cambiar.
- `celebrarSesion` devuelve solo la sesión celebrada; como `proxima` y `numeroSesion` de las demás pueden cambiar, el cliente vuelve a llamar `listarSesiones`.
- `editarPunto` con `version` distinta de la actual → `CONFLICTO` (el cliente debe recargar). Solo se modifican los campos permitidos del punto; el resultado se valida completo.
- Una sesión **celebrada es inmutable**: no admite crear, editar ni eliminar puntos.

## Códigos de error

| Código | Cuándo |
|---|---|
| `NO_AUTORIZADO` | El usuario no tiene permiso para la operación. |
| `NO_ENCONTRADO` | La sesión o el punto no existe. |
| `VALIDACION` | Datos inválidos (fecha, sección, remitente, campos obligatorios, longitudes). |
| `CONFLICTO` | `version` desactualizada. |
| `SESION_CELEBRADA` | La operación no aplica a una sesión ya celebrada. |
| `ARCHIVO_INVALIDO` | Archivo con tipo no permitido, que excede el tamaño (100 MB) o que supera el máximo por punto (30). |
| `CALENDARIO_EXISTE` | Ya hay un calendario de ese año y no se pidió sobrescribirlo. |
| `NO_IMPLEMENTADO` | Solo `ServerConnection` mientras no exista backend. |

## Permisos

| Rol | Sesiones y puntos | Confidenciales |
|---|---|---|
| `capturista` | Lectura y escritura (único con CRUD de puntos y de sesiones) | Los ve |
| Lectores (remitentes, colaboradores) | Solo lectura | **Ocultos**: reciben el punto con su `numero` y `confidencial: true`, pero con `contenido: "CONFIDENCIAL"`, sin acuerdo y sin archivos. Así la numeración es la misma para todos y no se filtra el contenido. |

Las restricciones finas de lectura por remitente/colaborador están por definir; la regla siempre se aplica en el servidor.

## Pendiente de definir

- Estado de publicación de la sesión (`en preparación` → `publicado` → `celebrada`): si los lectores ven los puntos al crearse o al publicarse.
- Administración de catálogos (hoy solo lectura; las filas se cargan por semilla).
- Archivos en el servidor real: URLs firmadas, antivirus y cuotas totales (los límites por archivo y por punto ya están definidos arriba).
- Autenticación (MSAL) y origen del rol.
- Auditoría (bitácora de cambios).
