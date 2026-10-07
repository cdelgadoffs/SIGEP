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
| `tipo` | string | `id` del catálogo `tiposSesion` (`ordinaria` · `extraordinaria`). Hecho persistido; las sesiones anteriores al campo se leen como `ordinaria`. Las ordinarias salen del calendario; las extraordinarias se crean una a una (`crearSesionExtraordinaria`). |
| `numeroSesion` | int \| null | Derivado. Consecutivo oficial **dentro de su año** (el de `id`) **y de su tipo**: reinicia en 1 cada año y las extraordinarias llevan su propia cuenta, sin avanzar la de las ordinarias. Avanza en `celebrada`, `proxima` y `pendiente`; una `no-celebrada` no tiene número (`null`) ni consume uno. |
| `estado` | string | Derivado. `celebrada` · `proxima` · `no-celebrada` · `pendiente`. |
| `celebrada` | bool | Hecho persistido. |
| `celebradaEn` | string \| null | Timestamp. |
| `asistentes` | `{ integranteId, nombre, tratamiento, presidente, presente }[]` \| null | Hecho persistido al celebrar (ver "Asistencia a la sesión"); `null` si no está celebrada. |
| `horaInicio` | string \| null | Hecho persistido: timestamp (ISO) en que comenzó la celebración (`comenzarSesion`). |
| `horaFin` | string \| null | Hecho persistido: timestamp (ISO) en que terminó la celebración; la fija `celebrarSesion`. |
| `enCurso` | bool | **Derivado.** `horaInicio` fijada y sesión aún no celebrada. |
| `listaCerrada` | bool | Hecho persistido: el registro de puntos de la sesión está cerrado (ver "Lista cerrada"). Empieza en `false`. |
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
| `contenidoDoc` | `Documento` | Texto con formato del punto de acuerdo o del informe. Obligatorio: su texto plano no puede estar vacío (ver "Documento"). |
| `acuerdoDoc` | `Documento` | Texto con formato del acuerdo. Obligatorio (texto plano no vacío) si la sección tiene `requiereAcuerdo: true`; si no, se guarda vacío. |
| `contenido` | string | **Derivado.** Texto plano de `contenidoDoc` (un párrafo por línea). Máx. 20 000 caracteres. Es lo que leen las listas, el orden del día y los textos derivados. |
| `acuerdo` | string | **Derivado.** Texto plano de `acuerdoDoc` (un párrafo por línea). Máx. 20 000. |
| `plantilla` | string | `id` del catálogo `plantillasActa`. Por omisión, la `plantillaPorOmision` de su sección o, sin ella, la primera. |
| `introDoc`, `puenteDoc` | `Documento` | Fundamento y frase puente de la hoja del punto (se usan según la plantilla). Por omisión, los textos `intro` y `puente` del catálogo `textosActa`. |
| `bloquesActa` | `BloqueActa[]` | Secciones adicionales de la hoja: `{ id, tipo, titulo?, doc }`. `tipo` es un `id` de `tiposBloqueActa`; `titulo` solo en `personalizada`. Por omisión, los bloques de la plantilla (con `doc` vacío). |
| `confidencial` | bool | |
| `archivos` | `Archivo[]` | Metadatos de los archivos adjuntos (ver "Archivo"). |
| `orden` | int | Posición dentro de su (sesión, sección), 1…n (ver "Orden"). |
| `tratado` | bool | Marca de la celebración: el punto ya se trató. Empieza en `false`; los puntos anteriores al campo se leen como `false`. Solo cambia con `marcarPunto`. |
| `engroseEnviado` | bool | Hecho persistido: el engrose del punto ya se envió (`enviarEngrose`). Empieza en `false`. |
| `engroseEnviadoEn` | string \| null | Timestamp del último envío. |
| `numero` | int | **Derivado.** Posición del punto en el orden del documento de su sesión, empezando en 1 (ver "Numeración y puntos fijos"). Todo `Punto` que el API devuelve lo lleva. |
| `fijo` | bool | **Derivado.** `true` en los puntos autogenerados (no se guardan como puntos; ver abajo). |
| `encabezado` | bool | **Derivado.** Solo en puntos fijos que funcionan como título de una sección (cuentan en la numeración, pero no son puntos a tratar). |
| `version` | int | |
| `creadoPor`, `creadoEn`, `modificadoEn` | string | Autoría y fechas, del servidor. |

### Documento (texto con formato)

Un `Documento` es un **documento ProseMirror/TipTap en JSON** (`{ type: 'doc', content: [...] }`), no un texto con marcas. Es la forma estable de guardar texto con formato: estructurada, validable y sin analizar cadenas.

- **Nodos permitidos:** `doc`, `paragraph` (atributo opcional `textAlign`: `left`, `center`, `right`, `justify`), `text`, `hardBreak`, `orderedList`, `listItem`, `table`, `tableRow`, `tableHeader`, `tableCell` (atributos `colspan`, `rowspan`, `colwidth`, `align`). **Marcas permitidas:** `bold`, `italic`, `oculto` (texto marcado para ocultar en la versión pública) y `fontSize` (atributo `size`, ej. `"18px"`). Cualquier otro nodo, marca o atributo → `VALIDACION`.
- **Límites:** profundidad máxima 12; tamaño serializado máximo 200 000 caracteres; texto plano máximo 20 000.
- **Texto plano derivado:** los párrafos de nivel superior, de las listas y de las celdas se unen con `\n` (las celdas de una fila, con tabulador); `hardBreak` es un `\n`.
- **Ítems del acuerdo:** para `acuerdoLineas` y para los prefijos ÚNICO/PRIMERO…, cada **párrafo de nivel superior con texto** es un ítem (las listas y las tablas no cuentan como ítems). El ítem *k* de `acuerdoLineas` corresponde al *k*-ésimo párrafo de nivel superior con texto.
- **Entrada tolerante:** `crearPunto` y `editarPunto` aceptan `contenido` / `acuerdo` en texto plano en lugar de `contenidoDoc` / `acuerdoDoc` (un párrafo por línea); si llegan ambos, gana el documento. El servidor siempre guarda y devuelve documentos.
- **Migración:** los puntos anteriores (con `contenido` / `acuerdo` en texto) se convierten a documentos y se completan los campos de la hoja con sus valores por omisión.

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

### Integrante

Persona que integra el Pleno (el quórum). Máximo **5**. No es una sesión ni un punto: es un dato del órgano.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Asignado por el servidor (UUID). |
| `nombre` | string | Obligatorio, máx. 200. |
| `email` | string | Obligatorio, formato válido, **único** entre integrantes (sin distinguir mayúsculas). |
| `genero` | string | `id` del catálogo `generos`. |
| `grado` | string | `id` del catálogo `grados`. |
| `presidente` | bool | A lo sumo **uno** en todo el Pleno: marcar a un integrante como presidente se lo quita al anterior, en la misma operación. |
| `tratamiento` | string | **Derivado.** Artículo del género + título del grado según el género (`el licenciado`, `la maestra`…). Nunca se guarda. |
| `version`, `creadoEn`, `modificadoEn` | | Control de versiones y fechas, del servidor. |

### Secretario ejecutivo del Pleno (SEPLE)

Registro **único** (puede no existir). No cuenta en el quórum ni en los votos.

| Campo | Tipo | Notas |
|---|---|---|
| `nombre` | string | Obligatorio, máx. 200. |
| `email` | string | Opcional; si se indica, formato válido. |
| `genero` | string | `id` del catálogo `generos`. |
| `version`, `modificadoEn` | | Del servidor. |

### Numeración y puntos fijos

El **orden del documento** de una sesión es: las secciones en el orden de su catálogo; dentro de cada sección, primero los puntos fijos (en el orden de su catálogo) y después los puntos del capturista por `orden`. El `numero` de cada punto es su posición en ese orden (1…N), **contando también los confidenciales y los fijos**. Se calcula al leer: nunca se guarda, y cambia solo si el orden cambia (crear, eliminar, mover, cambiar de sección). El cliente lo presenta como `PLE/001`.

**Puntos fijos (autogenerados).** Los define el catálogo `puntosFijos`; el servidor los agrega a `listarPuntos` de cada sesión ordinaria. En este proyecto:

| `id` del catálogo | Sección | Texto | Condición |
|---|---|---|---|
| `orden-dia` | `actas` | "Aprobación, en su caso, del orden del día." | Siempre |
| `acta-anterior` | `actas` | "Aprobación, en su caso, del acta de la sesión ordinaria del {fecha}." | Solo si la sesión anterior ya fue celebrada (`{fecha}`: la de esa sesión, "7 de octubre de 2026") |
| `asuntos-generales` | `asuntos-generales` | "Asuntos generales." | Siempre (es `encabezado`) |

Cada fila del catálogo lleva `tipos: string[]` (ids de `tiposSesion` en los que aplica; sin el atributo, todos). Hoy `orden-dia` aplica a ambos tipos; `acta-anterior` y `asuntos-generales`, solo a `ordinaria`: **una sesión extraordinaria solo lleva "Aprobación, en su caso, del orden del día."** Para `acta-anterior`, "la sesión anterior" es la **ordinaria** anterior (las extraordinarias no cuentan).

**Actas de sesiones extraordinarias (`acta-auto-<fecha>`).** Además de las filas del catálogo, a cada sesión **ordinaria** se le agrega un punto fijo "Aprobación, en su caso, del acta de la sesión extraordinaria del {fecha}." por cada extraordinaria **celebrada** que cumpla, con `f` la fecha de la extraordinaria, `S` la de la sesión y `A` la de la ordinaria anterior (si no hay, `S` menos 7 días):
- si `f + 1 día = S`: no se incluye (su acta aún no está lista);
- si no, si `f + 1 día = A`: se incluye cuando `f < S` (su acta no alcanzó a la sesión anterior);
- en cualquier otro caso se incluye cuando `A < f < S`.

Son `fijo: true` de la sección `actas` (sin `encabezado`), con `id` `fijo:<sesionId>:acta-auto-<fecha>`; van después del punto `acta-anterior` (o del orden del día si ese no aplica), ordenados por fecha, y llevan el mismo `textoVoto` que `acta-anterior`. Se marcan como tratados como cualquier fijo.

- El `id` de un punto fijo es `fijo:<sesionId>:<id del catálogo>`. Siempre ocupan el primer lugar de su sección y **no se pueden editar, eliminar, mover ni adjuntarles archivos** (`VALIDACION`).
- Sí se pueden marcar como tratados (`marcarPunto`, `marcarPuntos`); el servidor guarda esa marca en la sesión. Un `encabezado` no se marca.
- Los fijos nunca existen como registros en el almacén de puntos: se generan al leer.

### Lista cerrada

Cada sesión tiene un registro de puntos que el capturista puede **cerrar** (`listaCerrada: true`) para congelar el orden del día antes de celebrar. Reglas del servidor:

- Con la lista cerrada **no se pueden crear, editar, eliminar ni mover puntos** (`LISTA_CERRADA`). La excepción son las secciones del catálogo con el atributo `admiteConListaCerrada: true` (hoy `asuntos-generales`), donde **sí se pueden crear** puntos; editarlos, eliminarlos y moverlos sigue prohibido. Adjuntar y quitar archivos, y marcar puntos como tratados, siguen permitidos.
- La lista se puede **reabrir** mientras la sesión no esté celebrada. Una sesión celebrada es inmutable (`SESION_CELEBRADA`).
- **No se puede celebrar una sesión con la lista abierta** (`LISTA_ABIERTA`).

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
| `secciones` | `plantillaPorOmision: string` (opcional; `id` de `plantillasActa` con que arranca un punto nuevo de esa sección; solo `tomas-de-nota-licencias` la lleva, con `proyecto`; sin ella, la primera plantilla), `requiereAcuerdo: bool`, `admiteConListaCerrada: bool` (solo `asuntos-generales`), `permiteCambiarSeccion: bool` (solo `asuntos-generales`: el formulario ofrece elegir la sección al crear), `excluidaDelActa: bool` (solo `asuntos-generales`: sus puntos no entran al acta), `sinTituloEnDocumento: bool` (`actas` y `asuntos-generales`: en el documento del orden del día no llevan encabezado de sección) | En este orden: `actas`, `proyectos-de-acuerdo`, `tomas-de-nota-licencias`, `informes` (false), `asuntos-generales` (todas las demás: true) |
| `categorias` | — | `pleno`, `direcciones` (Direcciones generales), `comisiones` |
| `remitentes` | `categoria: string` (id de `categorias`) | Pleno; DGEJ, DEGETD, DGTI, DGJJ, DGIPDI, DGRH (direcciones); Administración, Creación de nuevos órganos, Adscripción, Carrera judicial, Presupuesto (comisiones). La categoría de un punto no se guarda: se deduce de su remitente |
| `tiposVoto` | `frase: string` (texto del voto en el resultado), `votosRequeridos: number` (si existe, el voto exige ese número de integrantes del quórum), `sinVotacion: bool` (no aplica tipo de votación), `admitePrecision: bool` | `unanimidad` (admite precisión), `mayoria-4` (1 voto), `mayoria-3` (2 votos), `retirar` (sin votación) |
| `tiposVotacion` | `admitePrecision: bool` | `economica`, `concurrente` (admite precisión) |
| `estadosVoto` | — | `aprueba`, `acuerda` |
| `plantillasActa` | `bloques: string[]` (ids de `tiposBloqueActa` que trae por omisión), `orden: string[]` (secciones de la hoja, en orden: `intro`, `bloques`, `puente`, `contenido`, `tituloAcuerdo`, `acuerdo`) | `introduccion` (`intro, bloques, puente, contenido, acuerdo`; bloque `considerando`), `proyecto` (`contenido, bloques, tituloAcuerdo, acuerdo`; bloques `antecedente`, `considerando`), `personalizada` (`bloques, contenido, acuerdo`; sin bloques) |
| `tiposBloqueActa` | `titulo: string \| null` (encabezado en mayúsculas; `null` en `personalizada`, que lleva el suyo) | `considerando` ("CONSIDERANDO"), `antecedente` ("ANTECEDENTES"), `personalizada` |
| `textosActa` | `texto: string`, `negrita?: string` (primer tramo en negritas) | `intro` (fundamento del Pleno), `puente` ("Por lo anterior, se emite el siguiente:"), `contenido` (texto con que arranca un punto de acuerdo nuevo), `contenidoInforme` ("Informe") |
| `tiposSesion` | — | `ordinaria`, `extraordinaria` |
| `tiposConocimiento` | `texto` (frase completa) o `textoBase` + `admiteComplemento: bool` | Para informes: `simple`, `extendido` |
| `generos` | `articulo: string` (`el`, `la`) | `masculino`, `femenino` |
| `grados` | `titulo: { [genero]: string }` (ej. `{ masculino: 'licenciado', femenino: 'licenciada' }`) | `licenciatura`, `maestria`, `doctorado` |

La precisión de un voto aplica solo cuando el tipo de voto **y** el tipo de votación elegidos admiten precisión (hoy: unanimidad + concurrente). 
### Votación de un punto

`Punto.votacion` es `null` o un objeto con ids de catálogo: para secciones con acuerdo, `{ voto, votacion, estado, quorum, precision }` (`quorum` es una lista de ids de `integrantes`); para informes, `{ conocimiento, complemento }`. Ambos admiten `textoManual` (texto que sustituye al generado). Operación `registrarVotacion(id, votacion)` (pasar `null` la borra), idempotente. Reglas del servidor:

- El punto debe estar **tratado** (`VALIDACION` si no), no ser fijo ni encabezado, y la sesión no estar celebrada. No depende de la lista cerrada. Cambia `version` solo si el valor cambia. Cambiar la sección del punto reinicia su votación.
- Los campos omitidos toman la primera opción del catálogo. Cada id debe existir. El quórum no repite integrantes y su tamaño es como máximo `votosRequeridos` del tipo de voto (0 si no tiene); puede estar incompleto.
- La `precision` solo se conserva si el tipo de voto **y** el de votación admiten precisión; el `complemento` solo si el tipo de conocimiento admite complemento.
- **Campos derivados al leer (no se guardan):** `acuerdoLineas` (`[{ prefijo, texto }]`, prefijos ÚNICO/PRIMERO/SEGUNDO…) y `textoVotacion` (texto oficial de la votación: el `textoManual` si existe, si no el generado con las reglas de PlenoLOCAL; con acuerdo único se fusiona al final del texto; los puntos fijos usan el `textoVoto` del catálogo `puntosFijos`). Un punto confidencial llega a los lectores con `votacion: null`, `textoVotacion: null` y `acuerdoLineas: []`.
- **`engrose` (derivado al leer, no se guarda):** `{ parrafo, firmaPresidente: { nombre, cargo1, cargo2 }, firmaSecretario: { ... } }` para los puntos con hoja de acuerdo (no los fijos ni los confidenciales; `null` en los demás). El párrafo sale del texto `engrose` del catálogo `textosActa` (con `{votacion}`, `{tipo}` y `{fecha}` en letras) y la forma de votar de `Punto.votacion` (`fraseEngrose` de `tiposVoto`; mayoría: "con el voto en contra de…"; concurrente; retirar). **Antes de celebrar** los firmantes son el presidente y el secretario ejecutivo actuales; **al celebrar** se congelan (la copia de `asistentes` y `secretarioEjecutivo` de la sesión), así el engrose no cambia después. Falta el nombre → `<<presidente>>` / `<<secretario>>`.

### Operaciones del órgano (integrantes y SEPLE)

Lectura para cualquier usuario autenticado; escritura solo del capturista.

| Operación | Entrada | Salida | Errores |
|---|---|---|---|
| `listarIntegrantes()` | — | `Integrante[]` (en orden de alta) | — |
| `crearIntegrante(datos)` | `{ nombre, email, genero, grado, presidente }` | `Integrante` | `NO_AUTORIZADO`, `VALIDACION`, `DUPLICADO`, `LIMITE_ALCANZADO` |
| `editarIntegrante(id, version, cambios)` | id, versión, campos a cambiar | `Integrante` | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `CONFLICTO`, `VALIDACION`, `DUPLICADO` |
| `eliminarIntegrante(id)` | id | — | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `EN_USO` |
| `obtenerSecretarioEjecutivo()` | — | `SecretarioEjecutivo` \| `null` | — |
| `guardarSecretarioEjecutivo(datos)` | `{ nombre, email, genero }` | `SecretarioEjecutivo` (lo crea o lo reemplaza) | `NO_AUTORIZADO`, `VALIDACION` |
| `eliminarSecretarioEjecutivo()` | — | — | `NO_AUTORIZADO` |

- Marcar `presidente: true` (al crear o editar) deja `presidente: false` en los demás, de forma atómica. Editar el presidente sin marcarlo lo deja sin presidente.
- Los integrantes son los únicos que pueden figurar en el `quorum` de una votación (ver "Votación de un punto"). Al **editar** un integrante, el texto de las votaciones que lo mencionan cambia solo (se deriva al leer). Al **eliminarlo**, se quita del quórum de las votaciones de las sesiones aún no celebradas; si figura en la votación de una sesión **ya celebrada** no se puede eliminar (`EN_USO`), para no alterar un acta.

### Horarios de la celebración

Una sesión se celebra en tres pasos: **cerrar la lista**, **comenzar** y **celebrar** (finalizar). Reglas del servidor:

| Operación | Entrada | Salida | Errores |
|---|---|---|---|
| `comenzarSesion(id)` | id de sesión | `Sesion` actualizada (`horaInicio` = ahora) | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `LISTA_ABIERTA` |
| `editarHorario(id, cambios)` | id, `{ horaInicio?: "HH:MM", horaFin?: "HH:MM" }` | `Sesion` actualizada | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `VALIDACION`, `HORARIO_INVALIDO` |

- `comenzarSesion` exige la lista cerrada y es idempotente (si ya comenzó, no cambia la hora). No aplica a una sesión celebrada.
- `celebrarSesion` exige que la sesión haya comenzado (`SESION_NO_COMENZADA`) y además de `celebrada` fija `horaFin` = ahora.
- `editarHorario` corrige la **hora del día** de una marca ya existente, **conservando su fecha**: no se puede editar `horaFin` sin que exista, ni `horaInicio` sin haber comenzado (`VALIDACION`); el formato es `HH:MM` (`VALIDACION`); y la hora de inicio no puede ser posterior a la de fin (`HORARIO_INVALIDO`). Se permite también con la sesión ya celebrada (excepción documentada a su inmutabilidad): PlenoLOCAL deja corregir las horas siempre.

### Asistencia a la sesión

La asistencia es **por sesión** (en PlenoLOCAL era una marca global de cada integrante). El servidor guarda en la sesión solo las **ausencias** (`ausentes`: ids de integrantes marcados como no presentes; lista vacía por omisión): **todos los integrantes están presentes salvo que se marquen ausentes**, así que un integrante nuevo entra como presente, igual que en PlenoLOCAL.

| Operación | Entrada | Salida | Errores |
|---|---|---|---|
| `listarAsistencia(sesionId)` | id de sesión | `Asistencia[]`: `{ integranteId, presente }` por cada integrante actual, en su orden | `NO_ENCONTRADO` |
| `registrarAsistencia(sesionId, integranteId, presente)` | sesión, integrante, bool | `Asistencia[]` actualizada | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `VALIDACION` |

- Una sesión **celebrada** no admite cambios de asistencia (`SESION_CELEBRADA`). `registrarAsistencia` es idempotente.
- **Se congela al celebrar:** `celebrarSesion` guarda en la sesión una copia de los asistentes (`asistentes`: `{ integranteId, nombre, tratamiento, presidente, presente }` por cada integrante del momento) y la sesión celebrada la entrega tal cual (`null` en las celebradas antes de este cambio y en las no celebradas). `listarAsistencia` de una celebrada lee de esa copia, así el acta no cambia si luego se edita o elimina un integrante.
- El conteo (presentes / total) no se entrega: lo calcula quien lo muestra.
- Al eliminar un integrante, se quita de `ausentes` de las sesiones no celebradas.

### Sesiones extraordinarias

| Operación | Entrada | Salida | Errores |
|---|---|---|---|
| `listarFechasExtraordinaria()` | — | `string[]` (fechas `YYYY-MM-DD` disponibles, ascendentes) | — |
| `crearSesionExtraordinaria(fecha)` | fecha | `Sesion` creada (con derivados) | `NO_AUTORIZADO`, `VALIDACION`, `FECHA_NO_DISPONIBLE` |
| `eliminarSesion(id)` | id de sesión | `Sesion[]` (lista completa, con derivados) | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_ORDINARIA`, `SESION_CELEBRADA` |

- **Fechas disponibles** (con el reloj del servidor, `hoy`): desde `hoy` —o desde el día siguiente si `hoy` es una sesión ordinaria— hasta el día anterior a la **siguiente sesión ordinaria**, o hasta `hoy` + 60 días si no hay ninguna. Se excluyen sábados y domingos, el día de sesión ordinaria del calendario de ese año (`diaSemana`, si el año tiene calendario) y toda fecha que ya tenga una sesión (una por fecha).
- `crearSesionExtraordinaria` rechaza con `FECHA_NO_DISPONIBLE` cualquier fecha que no esté en esa lista. Crea la sesión con `tipo: 'extraordinaria'`, sin celebrar y con la lista abierta.
- `eliminarSesion` solo aplica a **extraordinarias** (`SESION_ORDINARIA` si es ordinaria; las ordinarias se ajustan con vacaciones o asuetos) y no a las celebradas (`SESION_CELEBRADA`). Elimina también los puntos de la sesión y sus archivos, en una sola transacción.
- Las extraordinarias no pertenecen al calendario: `agregarAsueto` / `quitarAsueto` rechazan (`VALIDACION`) una sesión extraordinaria como origen o destino, y `generarCalendarioAnual` con `sobrescribir` las **archiva** junto con el resto de las sesiones del año (ver "Sobrescribir = archivar y empezar de cero").

### Operaciones de calendario

| Operación | Entrada | Salida | Errores |
|---|---|---|---|
| `obtenerCalendario(anio)` | año (int) | `Calendario` \| `null` | `VALIDACION` |
| `generarCalendarioAnual(anio, datos, sobrescribir)` | año, `{ diaSemana, vacaciones }`, bool | `{ calendario, sesiones, generacion }` (el calendario guardado, la lista completa de sesiones con derivados y la `Generacion` creada, o `null` si no se archivó nada) | `NO_AUTORIZADO`, `VALIDACION`, `CALENDARIO_EXISTE` |
| `resumenArchivoCalendario(anio)` | año | `{ sesiones, celebradas, extraordinarias, puntos, archivos }`: lo que archivaría sobrescribir ese año | `NO_AUTORIZADO`, `VALIDACION` |
| `listarGeneraciones(anio)` | año | `Generacion[]` del año, la más reciente primero | `VALIDACION` |
| `agregarAsueto(anio, asueto)` | año, `{ fecha, destino }` | `{ calendario, sesiones }` | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `VALIDACION`, `SESION_CELEBRADA` |
| `quitarAsueto(anio, fecha)` | año, fecha del asueto | `{ calendario, sesiones }` | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `VALIDACION`, `SESION_CELEBRADA` |

- `generarCalendarioAnual` guarda el calendario del año y crea las sesiones que falten (las existentes se conservan con su `celebrada`). Es **atómica** y **idempotente**.
- Si ya existe un calendario de ese año y `sobrescribir` no es `true` → `CALENDARIO_EXISTE`.
- **Sobrescribir = archivar y empezar de cero.** Con `sobrescribir: true`, **todo lo del año** (todas las sesiones —ordinarias y extraordinarias, celebradas o no—, sus puntos, los binarios de sus archivos y la asistencia y demás hechos guardados en la sesión) se **mueve, sin perderse**, a almacenes de archivo, en la **misma transacción atómica** que guarda el calendario nuevo y crea sus sesiones. Los almacenes activos quedan limpios (las listas, los consecutivos y las actas automáticas se recalculan solos y la numeración vuelve a empezar en 1), y la sesión nueva de una fecha que ya existía no choca con la archivada. Los **asuetos se reinician** (el calendario nuevo nace sin asuetos; se agregan después). El integrante, el SEPLE y los catálogos no son del año y no se tocan.
- **`Generacion`** (un registro por cada archivado): `{ id, anio, creadoEn, creadoPor, calendario (el anterior, o null), resumen: { sesiones, celebradas, extraordinarias, puntos, archivos } }`. Los datos archivados conservan sus ids y llevan el `generacionId`; ninguna operación activa los devuelve (se consultarán desde la papelería de reciclaje, pendiente, que también podrá restaurarlos). `resumenArchivoCalendario` permite mostrar al usuario lo que se archivará antes de confirmar.
- Validación (`VALIDACION`): `anio` entero entre 2000 y 2100; `diaSemana` entero de 1 a 5; cada vacación con fechas válidas e `inicio <= fin`.
- **Asuetos sin regenerar el calendario.** `agregarAsueto` exige que el año ya tenga calendario (`NO_ENCONTRADO` si no). Valida que `fecha` sea del año y caiga en `diaSemana`, que `destino` sea `fecha ± 1` y no caiga en vacaciones, y que no haya ya un asueto en esa `fecha`. La sesión de `fecha` debe existir, no estar celebrada (`SESION_CELEBRADA`) ni tener puntos (`VALIDACION`): se elimina y se crea la del `destino` (si no existía). `quitarAsueto` revierte: elimina la sesión del `destino` (que no debe estar celebrada ni tener puntos) y recrea la de `fecha` si no cae en vacaciones. Ambas son atómicas y suben la `version` del calendario.
- `crearSesiones(fechas)` sigue en el contrato (crea sesiones **ordinarias** sueltas), pero el cliente no la usa; las extraordinarias se crean con `crearSesionExtraordinaria`.

### Operaciones de archivos, de orden y de celebración

| Operación | Entrada | Salida | Errores |
|---|---|---|---|
| `registrarVotacion(id, votacion)` | id de punto, `Votacion \| null` | `Punto` actualizado | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `VALIDACION` |
| `marcarPunto(id, tratado)` | id de punto + bool | `Punto` actualizado | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `VALIDACION` |
| `enviarEngrose(puntoId)` | id de punto | `Punto` actualizado (`engroseEnviado: true`, `engroseEnviadoEn` = ahora) | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_NO_CELEBRADA`, `VALIDACION` |
| `marcarPuntos(sesionId, tratado)` | id de sesión + bool | `Punto[]` de la sesión (ordenados, ya filtrados según el usuario) | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `VALIDACION` |
| `adjuntarArchivos(puntoId, archivos)` | id de punto + archivos (binarios) | `Punto` actualizado (`version` + 1) | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `ARCHIVO_INVALIDO` |
| `eliminarArchivo(puntoId, archivoId)` | ids | `Punto` actualizado | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA` |
| `descargarArchivo(archivoId)` | id | `{ nombre, tipo, blob }` (en el servidor real, una URL firmada) | `NO_AUTORIZADO`, `NO_ENCONTRADO` |
| `reordenarPuntos(sesionId, seccion, ids)` | sesión, sección e **ids de la sección en el orden deseado** | `Punto[]` de esa sección, ya ordenados | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `CONFLICTO`, `VALIDACION` |

- `enviarEngrose(puntoId)` **simula** el envío del engrose (el servidor real mandará el correo al remitente): solo aplica a puntos con engrose (con hoja de acuerdo; no fijos ni confidenciales; si no, `VALIDACION`) de una sesión **celebrada** (`SESION_NO_CELEBRADA`), marca `engroseEnviado` y fija `engroseEnviadoEn`. Se puede repetir (reenviar: solo actualiza el timestamp y `version`). Es una excepción documentada a la inmutabilidad de la sesión celebrada, como `editarHorario`. Los correos de los remitentes aún no son parte del contrato.
- `marcarPunto(id, tratado)` fija `tratado` (bool) del punto y devuelve el `Punto` actualizado. Es **idempotente** (repetir el mismo valor no cambia nada ni sube `version`) y no exige `version`: solo guarda un valor, no hay edición concurrente que proteger. Errores: `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `VALIDACION` (si `tratado` no es booleano). Solo cuando cambia el valor se incrementa `version` y se actualiza `modificadoEn`.
- `marcarPuntos` fija `tratado` en **todos** los puntos de la sesión que el usuario puede ver, en una sola operación **atómica** (o se aplican todos o ninguno). Es idempotente: solo cambian de `version` y `modificadoEn` los puntos cuyo valor cambió.
- `editarPunto` **no** modifica `tratado`.
- `crearPunto` / `editarPunto` aceptan, además de los campos de siempre, `contenidoDoc`, `acuerdoDoc`, `plantilla`, `introDoc`, `puenteDoc` y `bloquesActa` (ver "Documento"). Cambiar de sección reinicia la votación; cambiar de plantilla no borra los bloques que el cliente envía.
- `crearPunto` (salvo en una sección que `admiteConListaCerrada`), `editarPunto`, `eliminarPunto` y `reordenarPuntos` rechazan con `LISTA_CERRADA` si la sesión tiene la lista cerrada.
- `establecerListaCerrada` es **idempotente** (fijar el mismo valor no cambia nada).
- **Todo `Punto` que devuelve el API lleva su `numero`.** Como crear, eliminar, mover o cambiar de sección **renumera** a otros puntos, el cliente vuelve a pedir `listarPuntos` después de esas operaciones; `marcarPunto`, `adjuntarArchivos` y `eliminarArchivo` no renumeran y devuelven el punto ya con su `numero`.
- Las operaciones que modifican un punto (`editarPunto`, `eliminarPunto`, `adjuntarArchivos`, `eliminarArchivo`) rechazan un **punto fijo** con `VALIDACION`. `marcarPunto` y `marcarPuntos` sí lo marcan (salvo los `encabezado`).
- `crearPunto` acepta `archivos` (binarios) opcionales y los valida con las mismas reglas de `adjuntarArchivos`. El formato antiguo `[{ nombre }]` se rechaza con `ARCHIVO_INVALIDO`.
- Las operaciones que tocan el punto y sus binarios (crear con archivos, adjuntar, quitar, y la cascada al eliminar el punto) son **atómicas**: o se aplican todas o ninguna.
- `editarPunto` **no** modifica `archivos` ni `orden`: para eso están `adjuntarArchivos`, `eliminarArchivo` y `reordenarPuntos`.
- `reordenarPuntos` recibe el orden **completo** de los puntos del capturista de la sección (**sin** los fijos, que siempre van primero) y devuelve todos los puntos de esa sección, fijos incluidos y con su `numero` nuevo; recibe el orden **completo** de la sección (atómico e idempotente: repetir el mismo orden no cambia nada). Si `ids` no es exactamente el conjunto actual de puntos de esa sección → `CONFLICTO` y el cliente recarga. Sección inexistente o `ids` que no es una lista → `VALIDACION`.

Notas de comportamiento:
- `crearSesiones` es **idempotente**: las fechas que ya existen se ignoran (no resetea `celebrada`); devuelve siempre la lista completa porque los derivados de las demás sesiones pueden cambiar.
- `celebrarSesion` exige que la sesión haya comenzado (`SESION_NO_COMENZADA`) y fija `horaFin`; devuelve solo la sesión celebrada; como `proxima` y `numeroSesion` de las demás pueden cambiar, el cliente vuelve a llamar `listarSesiones`.
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
| `LISTA_CERRADA` | La sesión tiene la lista de puntos cerrada y la operación no está permitida con ella cerrada. |
| `LISTA_ABIERTA` | Se intentó celebrar una sesión con la lista de puntos abierta. |
| `ARCHIVO_INVALIDO` | Archivo con tipo no permitido, que excede el tamaño (100 MB) o que supera el máximo por punto (30). |
| `SESION_NO_CELEBRADA` | La operación exige una sesión ya celebrada (`enviarEngrose`). |
| `SESION_NO_COMENZADA` | Se intentó celebrar una sesión que aún no ha comenzado. |
| `HORARIO_INVALIDO` | La hora de inicio quedaría posterior a la de fin. |
| `FECHA_NO_DISPONIBLE` | La fecha no está entre las disponibles para una sesión extraordinaria. |
| `SESION_ORDINARIA` | La operación solo aplica a sesiones extraordinarias. |
| `CALENDARIO_EXISTE` | Ya hay un calendario de ese año y no se pidió sobrescribirlo. |
| `DUPLICADO` | Ya existe un integrante con ese correo. |
| `LIMITE_ALCANZADO` | Ya hay 5 integrantes. |
| `EN_USO` | El integrante figura en la votación de una sesión celebrada. |
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
