# Ruta de aprendizaje del backend de SIGEP

Guía para quien viene del front (React) y va a construir y mantener el backend (.NET 10, SQL Server, Entra ID). No es el estándar del backend: ese se redactará cuando el esqueleto esté estable. Este documento dice qué hay que entender y en qué orden.

## Principio

Se aprende construyendo, un corte vertical a la vez (ver `docs/CONTRATO_API.md` como fuente de verdad). Antes de cada paso se explica el concepto que se va a usar. Lo que no se necesita todavía no se estudia.

## Orden de construcción

| Paso | Qué se hace | Necesita base de datos |
|---|---|---|
| 1 | `Sigep.Core`: reglas puras portadas de `LocalAPI/reglas.js` (estados, numeración con ancla, puntos fijos, validaciones), con pruebas | No |
| 2 | Esqueleto: API que valida el token de Entra, chequeo de salud, `info/usuario`, conexión a SQL Server y primera migración | Sí, local |
| 3 | Primer corte vertical de solo lectura: `listarCatalogos` y `listarSesiones`, conectados al front con `VITE_API_MODE=real` | Sí, local |
| 4 | Escrituras por funcionalidad: calendario, puntos, archivos, votación, celebrar, historial, correo | Sí |

Ciclo de cada funcionalidad: revisar el contrato, escribir la regla en `Core` con pruebas, repositorio y migración, endpoint, operación en `ServerConnection`, prueba con el front. Se puede correr el mismo escenario contra `LocalAPI` y contra el servidor para comprobar que son gemelos.

## Qué estudiar

### Nivel 1 — antes de empezar
- **C# básico:** clases, tipos, colecciones, `async/await`, LINQ.
- **SQL básico:** `SELECT`, `JOIN`, llaves primarias y foráneas, índices, transacciones.
- **HTTP y REST:** métodos, códigos de estado, JSON, cabeceras.
- **Tokens (JWT / OAuth):** qué contiene un token, quién lo firma, qué valida el servidor.

### Nivel 2 — mientras se construye
- **ASP.NET Core:** inyección de dependencias, middleware, endpoints, políticas de autorización.
- **Entity Framework Core:** entidades, relaciones, migraciones, transacciones, concurrencia.
- **Pruebas con xUnit:** unitarias para las reglas, de integración contra una base real.

### Nivel 3 — antes de producción
- **Seguridad:** OWASP Top 10 y las guías de OWASP para ASP.NET Core.
- **Operación:** registros estructurados, respaldos y restauración, despliegue, monitoreo.

Fuentes: Microsoft Learn (rutas de C#, ASP.NET Core y EF Core), OWASP y un curso corto de SQL con ejercicios.

### No estudiar todavía
Microservicios, CQRS y event sourcing, colas de mensajes, Kubernetes, MongoDB, capas de caché.

## Decisiones difíciles de cambiar (acertarlas desde el día 1)

1. **Llaves de las tablas:** llave interna estable (`Guid`) y restricción de unicidad en la fecha de la sesión, en vez de usar la fecha como llave.
2. **Identidad del usuario:** guardar el identificador permanente de Entra (`oid`), no el correo ni el nombre.
3. **Fechas y horas:** marcas de tiempo en UTC con zona (`DateTimeOffset`), fechas de sesión como solo fecha (`DateOnly`), reloj del servidor como único árbitro.
4. **Collation de SQL Server:** define cómo se busca sin acentos ni mayúsculas; se elige al crear la base.
5. **Historial solo de adición:** nunca se edita ni se borra un evento; se registra en la misma transacción que el cambio. Lo no registrado no se reconstruye.
6. **Control de concurrencia** (`version`, `rowversion`) desde la primera tabla.
7. **Migraciones:** una migración ya aplicada no se edita nunca; la base se crea solo con migraciones.
8. **Versión en las rutas:** `/api/v1/…`.
9. **Archivos:** dónde se guardan y cómo se nombran (fuera de la carpeta pública, nombres aleatorios, metadatos en la base).
10. **Respaldos y restauración probados** antes de tener datos reales.

## Glosario

| Término | Qué es |
|---|---|
| Entidad | Clase de C# que representa una fila de una tabla (`Sesion`, `Punto`). |
| Migración | Archivo que describe un cambio en la estructura de la base; la historia de la base queda en el repositorio. |
| Código primero (*code-first*) | Las clases definen la base; las migraciones la generan. |
| DTO | Objeto que viaja por la API; nunca se devuelve la entidad directamente. |
| Inyección de dependencias | El framework entrega a cada clase las piezas que necesita, en lugar de que las cree ella. |
| Middleware | Pieza que procesa cada petición antes o después del endpoint (errores, autenticación). |
| Transacción | Grupo de cambios que se guardan todos o ninguno (celebrar una sesión es una). |
| Token de concurrencia | Valor que cambia en cada edición y evita que dos personas se pisen (`version`). |
| JWT | Token firmado que el servidor valida sin consultar a nadie más. |
| `oid` | Identificador permanente de una cuenta en Entra ID. |
| Collation | Regla de comparación de texto de la base de datos (acentos, mayúsculas). |
| Solo de adición (*append-only*) | Tabla donde solo se insertan filas; el historial de cada punto es una. |
| Corte vertical | Una funcionalidad pequeña construida de punta a punta (cliente, API, base). |
| Contrato | `docs/CONTRATO_API.md`: lo que el cliente y el servidor se prometen entre sí. |
