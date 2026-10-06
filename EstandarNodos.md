# Estándar Nodos

Estándar de arquitectura front + API para proyectos React, **independiente de cualquier aplicación concreta**. Se aplica tanto a proyectos nuevos como a la reestructuración de código existente.

Dos objetivos guían todo lo demás:

1. **Reglas mecánicas y verificables.** La pertenencia de un archivo a una capa se decide por lo que importa, no por criterio caso por caso.
2. **Prototipo → producción sin reescribir.** El front se construye completo contra un API simulado; al conectar el backend real solo cambia una capa y una variable de entorno.

---

## 0. Regla obligatoria: el estándar se respeta

Todo lo que sigue es **obligatorio**. Si una petición exige romper una regla del estándar (una capa que importa lo que no debe, una excepción "solo por esta vez", un atajo que mezcla responsabilidades), **no se implementa tal cual**:

1. Se señala la regla que se rompería y por qué.
2. Se **buscan y proponen alternativas que sí la respeten**, con ventajas, costos y una recomendación.
3. Se espera la decisión. Solo si se decide cambiar la regla misma, se modifica primero este documento y después el código; nunca se hace una excepción silenciosa ni "provisional".

Un estándar con excepciones deja de ser verificable: la regla manda sobre la comodidad y la rapidez.

---

## 1. Las capas

| Capa | Qué es |
|---|---|
| `Skeleton` | Instancia única y global, siempre presente, el fondo visual. |
| `components/base/` | Átomos y moldes de layout puros. |
| `components/widgets/` | Todo lo que compone piezas de `base` y/o toca contexto directamente. |
| `context/` | Espejo en el cliente del estado de negocio + acciones. Es el **puente** hacia `services/`. |
| `services/` | I/O externo: el API (intercambiable local/real) y el almacenamiento del cliente. Solo lo llama `context/`. |
| `hooks/` | Comportamiento reutilizable con React (estado/efectos/refs), sin JSX y sin contexto. |
| `utils/` | Constantes y funciones puras, sin React ni estado. |
| `pages/` | Ensambla una vista completa. |
| `App.jsx` | Routing y piezas verdaderamente globales. |

---

## 2. La regla mecánica: `base` vs `widget`

**Un archivo es `base` solo si lo único que importa es: (1) su propio CSS, (2) React (hooks nativos como `useState`, `useEffect`, `useRef`, y `react-dom` para portales) y (3) hooks propios puros de `hooks/`. Si importa cualquier otra cosa — otro componente, un hook de contexto, `utils/`, `services/` — es `widget`.**

- No se pondera ni se acumula: con que dispare una condición de widget, es widget.
- Hooks nativos de React para estado puramente local de UI **no** cuentan.
- Hooks propios de `hooks/` **no** cuentan mientras sean **puros** (ver sección 8).
- Un componente que tiene varias piezas internas o estado propio sigue siendo `base` si nada de eso importa otro componente ni contexto.

---

## 3. `components/base/`

- Recibe **todo por props**, incluyendo posicionamiento y slots genéricos (`children`, `accionesHeader`, `botonCerrar`) sin saber qué se le va a meter.
- Nunca importa otro componente ni un hook de contexto. Lo único permitido fuera de su CSS es React y los hooks puros de `hooks/`.
- Cada componente tiene **su propio CSS** (`styles/base/`) que él mismo importa. No hay CSS compartido cargado globalmente: cada uno es autosuficiente. Duplicar unas líneas entre componentes parecidos es preferible a una dependencia cruzada.
- Un ícono/símbolo se vuelve **intrínseco** (escrito dentro del componente) cuando ese componente tiene un único uso con un único significado en todo el proyecto.
- **"Cada mesa su propio mantel":** un `base` se define una vez, pero cada page monta **su propia instancia**; nunca una compartida entre pages. Si una page no monta un componente, solo se ve el fondo — comportamiento correcto, no un bug a parchear.
- Los **overlays** (modales, menús flotantes) se montan con un portal a `document.body` y un `z-index` propio por encima de los demás niveles, para no depender de los contenedores que los alojan. Cierran con su ✕ intrínseco, con Esc y con clic fuera.
- Una capacidad nueva se agrega a un `base` **solo si es genuinamente reutilizable**, nunca para resolver la necesidad puntual de un solo lugar, y siempre **opt-in vía prop**, sin cambiar el comportamiento por defecto de los consumidores existentes.

## 4. `components/widgets/`

- Combina piezas de `base` y/o llama a hooks de contexto directamente — nunca recibe esos datos por props desde una page.
- No es obligatorio que use átomos de `base`: llamar contexto directamente ya lo hace widget.
- Si necesita iterar sub-ítems (un menú con N opciones), **la iteración vive en el mismo widget**, sin envolver cada ítem en su propio widget.
- **Dos sabores de widget, sin clasificación aparte** (ambos viven en `components/widgets/` y cumplen la misma regla mecánica; es un criterio de diseño, no una capa):
  - **Conectado:** llama a los hooks de contexto y contiene la lógica de su tarea concreta. Se elige cuando hace siempre lo mismo, con un único significado. Ej.: una barra superior que abre un panel y cierra sesión, o un formulario que añade un registro.
  - **Compuesto por props:** solo combina piezas de `base`, no toca contexto y recibe los manejadores desde fuera. Se elige cuando se reutiliza para comportamientos distintos. Ej.: un submenú que recibe `onSeleccionar` y `onAgregar`. Un widget reutilizable **nunca** cambia su comportamiento según la page o la vista en la que está (no lee `vistaActual` para ramificar): cada consumidor le pasa lo que debe hacer y la lógica vive en el widget consumidor.
- **Anfitrión / huésped:** quien aloja a otro componente (widget o page) controla **cuándo, dónde y cómo se ve**: visibilidad, hover, posición, qué botones se ocultan o se añaden (vía props/slots) y las reglas CSS que dependen del anfitrión (ej. `.anfitrion:hover .huesped { … }` va en el CSS del anfitrión, nunca en el del huésped; ej.: el CSS de un submenú que revela el botón "+" de su ítem al pasar el cursor). El huésped ejecuta su función propia y **no conoce a su anfitrión**. Un huésped conectado recibe del anfitrión solo **sobre qué actuar** (el dato) y cómo mostrarse, jamás la lógica de negocio; un huésped compuesto recibe los manejadores.
- **La estructura de la interfaz** (tablas de menú, textos, íconos) vive en el widget que la pinta, nunca en el context ni en el API.
- Cuando dos partes de un widget aparecen en regiones distintas del layout y son instancias separadas, el estado que las coordina **se levanta a `UIContext`**.
- Un widget puede controlar directamente una relación de comportamiento con un `base` si es intrínseca a él (sin pasar por la page).
- Si una pieza **solo se usa en un lugar, con un único significado, y ese lugar ya es un widget con acceso a contexto**, se embebe directamente ahí en vez de mantenerla como componente aparte.
- Su CSS propio vive en `styles/widgets/`.

## 5. `pages/`

- Monta instancias de `base`/`widgets` + contenido estático trivial. **No llama a contexto para construir contenido de negocio**; el contexto se conecta a los **widgets** (ellos lo llaman por sí mismos), nunca a la page. Qué sí y qué no hace una page con el contexto:
  - **Sí lee `UIContext`** para cablear los `base` que monta (`abierto`, `onCerrar`, posiciones…).
  - **Sí lee valores simples** de un contexto de negocio para pasarlos como props a un `base` (ej. el título de la sesión, un conteo).
  - **No** recorre, filtra ni transforma datos de negocio, no arma tarjetas ni listas, y no llama acciones de negocio. Si necesitara procesar datos para mostrarlos, esa parte es un widget. Los textos de presentación derivados de un dato crudo se arman en la page con una función de `utils/`; el contexto solo expone el dato.
- **Quien monta un `base` es quien wirea sus props estructurales** (`abierto`, `onCerrar`…). Un widget puede además disparar una acción de negocio sobre ese mismo estado compartido: son dos responsabilidades independientes.
- **"Sal al gusto":** un ajuste de estilo presentacional y de un solo uso sobre un componente reutilizable se aplica como `style` inline en un wrapper dentro de la page — nunca se modifica el CSS del componente compartido ni se crea un CSS nuevo para una sola declaración.
- No hay excepciones de carpeta: los paneles que un switcher genérico aloja (ej. los ítems del panel de control) son widgets normales; el switcher los registra en una tabla (`Panel`, y `AccionHeader` opcional para el botón del header, que es otro widget).

## 6. `context/`

- Solo aquí vive el estado de negocio **en el cliente** (un espejo de lo que dice el API) y las acciones que lo mueven. **Las reglas de negocio no viven aquí.**
- Expone datos y acciones — nunca lógica de presentación: ni tablas de menú, ni textos de interfaz, ni conteos para mostrar (se cuentan en el widget que los pinta).
- Los contextos **de negocio** son los puentes hacia `services/`. `UIContext` **no** lo es: solo estado de interfaz (sidebars abiertos, vista activa, búsqueda…), jamás llama a `services/`. Las preferencias visuales persistentes (vista, tema…) van en su propio contexto-puente (`AjustesVisualesContext`) hacia `services/AjustesVisuales.js` (`localStorage`); así no hay excepciones a la regla.
- Las acciones son **asíncronas**: llaman a `services/api.js`, esperan y actualizan el estado con **lo que el API devolvió**, nunca con lo que el cliente supone. Si pueden fallar, lanzan el error hacia el componente que las disparó (el widget decide cómo mostrarlo). El context lleva el estado de carga y de error **por recurso** (catálogos, sesiones, etc.), para que un fallo de uno no se borre al cargar otro, y expone `cargando` (alguno en curso) y `error` (el primer fallo activo, con su `mensaje`).
- Nunca se llama a `services/` desde dentro de un updater de `setState` (efecto secundario en una función pura; se ejecuta doble en StrictMode).

## 7. `services/`

- I/O externo puro. Funciones async simples, sin JSX, sin conocimiento de React.
- Solo los llama `context/`, nunca componentes.
- Estructura completa en la sección 9.

## 8. `hooks/` y `utils/`

### `hooks/`
- Hooks propios que encapsulan **lógica con estado/efectos/refs** reutilizable por varios consumidores, sin JSX.
- **Puros:** solo importan React. Nunca un contexto, un componente, `utils/` ni `services/`. Por eso los importan `base` y `widgets` sin cambiar la clasificación de nadie.
- Comparten la **lógica**, no el marcado: cada consumidor pone su propio JSX y CSS.
- Un hook que necesite contexto no va aquí: es lógica de un widget y vive en él.
- No es `utils/` (sin React ni estado) ni `context/` (estado de negocio compartido): un hook tiene estado propio **por instancia**.

### `utils/`
- Constantes y funciones **estáticas, reutilizables y sin estado**, sin JSX y sin React (ej. nombres de meses, formateo de fechas).
- **No se duplica el mismo dato/función en dos archivos.** Si dos capas lo necesitan, se extrae una sola vez a `utils/`; nunca se decide "cuál es el dueño".
- Lo importan `context/` y `widgets/`. `base/` **no** (si un `base` necesitara algo de `utils/`, se le pasa por props o ese componente es en realidad un widget).

## 9. Arquitectura de datos: cliente / API intercambiable

Se desarrolla como **prototipo 100% front** con un API simulado que se comporta como un servidor real, para que el usuario pruebe y se ajuste antes de conectar. Al conectar, **no cambia nada fuera de `services/` y de la configuración**.

```
context/ (puente)  ──▶  services/api.js  ──▶  LocalAPI/          (prototipo: servidor simulado + su propia IndexedDB)
                    │                    └──▶  ServerConnection/  (producción: fetch al backend real)
                    └─▶  services/SesionIndexedDB.js              (cliente, permanente en ambos modos)
```

### Quién controla qué
- **API (fuente de verdad):** todo lo que debe ser seguro, íntegro u oficial — identidad y roles, permisos, **confidencialidad** (el servidor no envía lo que el usuario no puede ver), validación de datos, estados derivados del reloj del servidor, consecutivos oficiales, unicidad, transiciones de estado atómicas, inmutabilidad tras cerrar un ciclo, IDs/timestamps/autoría, control de versiones (`version`), archivos, auditoría.
- **Catálogos de dominio** (listas de opciones del negocio): son **datos del API, no código**. El API ofrece un mecanismo genérico (`listarCatalogos()`) y cada proyecto carga sus propias filas (datos iniciales), con atributos que llevan las reglas (ej. `requiereAcuerdo`). Así el API valida y aplica reglas sin conocer el proyecto, y es reutilizable. El cliente los lee vía context y **nunca** los hardcodea ni los duplica.
- **Cliente:** la estructura de la interfaz (menús, textos, íconos), `UIContext`, borradores de formularios, validación de UX (**duplica** la del servidor, nunca la reemplaza), presentación derivada (etiquetas, agrupar, contar, filtrar), navegación.
- **Regla de decisión:** si una regla "valida" o "calcula" algo oficial, va en el API. Si aparece en un context o un componente, está del lado equivocado del puente. Los datos **derivados** (estados, consecutivos) nunca se persisten: se calculan al leer.

### Estructura de `services/`
| Archivo / carpeta | Rol | ¿Sobrevive a la conexión real? |
|---|---|---|
| `api.js` | Único punto de entrada para `context/`. Elige la implementación según `VITE_API_MODE` y re-exporta las mismas operaciones. | Sí |
| `ApiError.js` | Forma única de error `{ codigo, mensaje }` que ambas implementaciones lanzan. | Sí |
| `LocalAPI/` | Servidor simulado: `index.js` (operaciones), `reglas.js` (validaciones, estados, permisos, usuario simulado), datos iniciales de catálogos, `db.js` (su propia IndexedDB). | **No** — se borra la carpeta al conectar |
| `ServerConnection/` | Cliente del backend real. Mismas firmas que `LocalAPI`. | Sí |
| `AjustesVisuales.js` | `localStorage` del cliente: preferencias visuales del usuario (vista, tema…), un solo objeto JSON. Solo lo llama `AjustesVisualesContext`; con `try/catch` para tolerar almacenamiento bloqueado. Nunca datos de negocio. | Sí, siempre |
| `SesionIndexedDB.js` | IndexedDB **del cliente**: `borradores`, `cache` y a futuro `cola` (escritura offline). **Nunca es fuente de verdad**: si discrepa del servidor, gana el servidor. | Sí, siempre |

- **Dos bases distintas, dos roles:** la del cliente es del producto final; la de `LocalAPI` es el servidor de mentira. No se mezclan.
- **Interruptor:** `.env.development` → `VITE_API_MODE=local`; `.env.production` → `VITE_API_MODE=real` (+ `VITE_API_URL`). Se decide **al compilar**; el build de producción no incluye `LocalAPI`. Todo `VITE_*` queda visible en el bundle: nunca poner secretos.
- **Contrato:** un documento (`docs/CONTRATO_API.md`) con firmas, modelo de datos, errores y reglas. Es lo que se congela y lo que el backend implementa; `LocalAPI` y `ServerConnection` son gemelos que lo cumplen. Todo cambio de contrato se hace primero ahí.
- **`LocalAPI` se comporta como un servidor, no como un almacén:** las reglas viven en `reglas.js`, nunca en context ni componentes; operaciones atómicas (nunca "guardar todo"); todo async y puede fallar con `ApiError`.
- **Cambios de esquema de IndexedDB:** subir `DB_VERSION` **una sola vez, junto con el cambio completo**. Subirla antes de terminar el cambio deja bases a medias que el código final ya no repara.
- **Límites del modo local:** la seguridad real y el multiusuario no se pueden probar ahí. Sirve para validar flujo y contrato.

### Estado de sincronización
Cada dato que el context entrega lleva `sincronizacion`: `'servidor' | 'local' | 'error'`. Lo pone el cliente (context/cola), no el API. Un átomo `base` lo pinta (ícono + tooltip intrínsecos).

### Borradores
Un widget con formulario guarda su borrador **vía el context** (`guardarBorrador`/`obtenerBorrador`/`eliminarBorrador`), nunca llamando al almacenamiento directo. Clave por contexto de uso; guardado con debounce, restaurado al abrir y eliminado cuando el formulario queda vacío. No se guarda nada hasta que termina la restauración, para no pisar el borrador existente. **Los borradores guardan solo texto y banderas, nunca binarios** (archivos adjuntos): duplicar archivos grandes en el almacenamiento del cliente en cada guardado sería inviable.

## 10. `App.jsx`

- Decide el routing y monta solo las piezas **verdaderamente globales** que no pertenecen a ninguna page.
- No conoce el estado interno de ninguna page; esa lógica de cierre/reset vive centralizada en `UIContext`.
- "Controlar la apertura" de un componente y "montarlo" son responsabilidades independientes.

---

## 11. Reglas transversales

- **Nombres repetidos entre carpetas no chocan:** la ruta completa los distingue.
- **CSS con altura fija cuando otros elementos dependen de ella:** si un componente se usa para calcular offsets de posición de otros, su altura es explícita (`height` + `box-sizing: border-box`), nunca dependiente del contenido.
- **Sin sobre-ingeniería:** no crear abstracciones, wrappers, CSS o capas nuevas para necesidades hipotéticas o de un solo uso. Tres líneas parecidas son mejor que una abstracción prematura.
- **Sin comentarios en el código**, salvo petición explícita para un caso puntual.
- **Errores visibles:** una carga que falla no puede mostrarse como "no hay datos". Todo widget que pinta datos cargados distingue **tres estados** — cargando, error y vacío — y solo muestra el texto de "vacío" cuando la carga terminó **sin error**. En error muestra un aviso con el mensaje del API; en carga, "Cargando…". Los datos que ya se tenían (caché) se siguen mostrando junto al aviso. Un `base` no conoce estos estados: el widget le pasa el texto por props (ej. `textoVacio`, `subtitulo`).

## 12. Flujos de trabajo

### Planificación (antes de implementar una funcionalidad nueva)
Se explica en texto, **sin escribir código todavía**: qué capas se tocan y por qué, qué archivos se crean y modifican, y en qué orden. Se espera confirmación explícita antes de implementar. No aplica a preguntas conceptuales ni a fixes triviales ya acordados.

### Verificación
1. `npm run build` primero, siempre (y también en modo desarrollo si el modo de producción excluye código, como `LocalAPI`).
2. Para verificar UI: Playwright contra un dev server con puerto propio; si el entorno tiene proxy corporativo, usar el navegador del sistema como `executablePath`. Esperar `domcontentloaded` (no `load`) si hay recursos de CDN bloqueados.
3. Limpiar siempre al final: borrar scripts y capturas, desinstalar la dependencia temporal y detener el dev server.

---

## 13. Aplicar el estándar a código existente

Procedimiento para reestructurar un proyecto que no sigue este patrón:

1. **Inventario.** Listar todos los componentes y, de cada uno, qué importa.
2. **Clasificar con la regla mecánica** (sección 2): lo que solo importa CSS/React/hooks puros es `base`; lo demás es `widget`. Si un componente "debería ser base" pero importa contexto o componentes, se parte: el átomo puro a `base`, la parte que toca negocio a un widget.
3. **Sacar el negocio de los componentes.** Todo estado de negocio y toda llamada de I/O a `context/` y `services/`.
4. **Separar reglas de espejo.** Lo que valida o calcula algo oficial pasa a `LocalAPI/reglas.js` (y luego al backend); el context solo guarda lo que el API devuelve.
5. **Eliminar duplicados y constantes sueltas.** Datos de referencia a `utils/`; listas de opciones del negocio a catálogos del API; tablas de menú al widget que las pinta.
6. **Estado de UI compartido a `UIContext`**, un estado por responsabilidad.
7. **Escribir el contrato** antes de implementar `LocalAPI`.
8. **Verificar tras cada paso** con el flujo de la sección 12; migrar por funcionalidad completa, no por capa entera, para que la app siga funcionando en cada commit.
9. **Migrar por etapas.** Etapa 1: solo `components/` (clasificar `base`/`widgets`, un CSS por componente, armar las pages; los widgets llaman a los contextos que ya existen, sin cambiarlos). Etapa 2: `context/`, `services/` y `hooks/`. Lo que en la etapa 1 **no puede cumplir** el estándar (I/O directo en un componente, un hook que usa contexto) se registra como **deuda con nombre** en el plan de migración y **no se mueve a `widgets/` hasta limpiarse**: nunca se certifica como widget algo que rompe una regla "provisionalmente".
10. **Traducir, no copiar:** cuando se toma algo de un proyecto anterior como referencia visual o de comportamiento, se identifica qué parte es átomo (`base`), qué parte combina o toca negocio (`widget`) y qué parte es dato/acción (`context`). Nunca se copia su estructura de archivos tal cual.

---

## 14. Pendientes del estándar (por decidir)

Huecos que un proyecto con identidad, documentos e integraciones va a tocar. Cada uno lleva alternativas y una recomendación; **se decide antes de migrar la parte que lo necesita**, y entonces se pasa a la sección que corresponda.

### 14.1 Identidad, roles y permisos
- **A.** `AuthContext` como puente hacia un servicio de identidad (`services/Identidad.js`, que envuelve a MSAL u otro); el rol sale del token y los permisos finos los decide el API; el cliente recibe de `AuthContext` una función `puede(accion)` solo para UX.
- **B.** Un hook puro en `hooks/` (`usePermisos(rol)`) que recibe el rol por parámetro y devuelve los permisos de UX. Cumple la pureza, pero la tabla de permisos queda duplicada en el cliente.
- **Recomendación: A.** Un hook que lee contexto no es puro y no va en `hooks/`; y los permisos son del API.

### 14.2 Generación de documentos (Word, PDF, zip)
- **A.** Constructores puros en `utils/` (datos entran, `Blob` sale; sin React, sin estado, sin I/O); un widget los invoca con datos del contexto y descarga el resultado.
- **B.** Un servicio del cliente que llama el contexto (`services/Documentos.js`).
- **C.** El API genera el documento (operación del contrato) y el cliente solo lo descarga.
- **Recomendación: A** para documentos que se arman con datos que el cliente ya tiene; **C** si el documento es oficial o necesita datos que solo el servidor conoce.
- **Estado: se aplicó A** en el primer documento (el orden del día de una sesión): `utils/ordenDia.js` con la librería cargada por `import()` dinámico, invocado por un widget. Lo que dependa de un catálogo (por ejemplo qué secciones llevan título) es atributo del catálogo, no código.

### 14.3 Integraciones externas (correo, almacenamiento en la nube)
- **A.** Siempre detrás del API: el backend habla con el tercero y el cliente solo ve operaciones del contrato; `LocalAPI` las simula.
- **B.** El cliente llama al tercero directamente desde un servicio.
- **Recomendación: A.** Si no, el intercambio `LocalAPI`/`ServerConnection` deja de ser total y aparecen secretos y permisos en el cliente. La identidad es la única excepción natural (14.1).

### 14.4 Pruebas automatizadas
- **A.** Pruebas de contrato: la misma batería contra `LocalAPI` y, cuando exista, `ServerConnection`.
- **B.** Recorridos de Playwright por page como humo.
- **C.** Ambas.
- **Recomendación: C**, empezando por el contrato (es lo que garantiza que el backend real cumpla lo que el prototipo prometió).

### 14.5 Convención de lint para contextos
`react-refresh/only-export-components` marca los archivos que exportan el proveedor y su hook juntos.
- **A.** Separar en dos archivos (objeto de contexto y proveedor aparte del hook).
- **B.** Aceptar la excepción de la regla solo en `src/context/**` (afecta solo al refresco en caliente de desarrollo).
- **Recomendación: B**: no cambia la estructura y el efecto es solo de desarrollo.
