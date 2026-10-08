# Requerimientos: Microsoft Entra ID

**Sistema:** SIGEP (Sistema de Gestión de Sesiones del Pleno)

Aplicación web para preparar, conducir y documentar las sesiones del Pleno: orden del día, calendario, quórum, votaciones, actas, resguardo de documentos y avisos por correo.

**Componentes:**

- **Front:** SPA en React con MSAL (`@azure/msal-browser`).
- **API y base de datos:** propios, en la infraestructura que se solicita. Persisten la información de forma centralizada y aplican los permisos.

---

## 1. Autenticación y roles

### Alcance

- MSAL se usa **únicamente para el inicio de sesión**. El front no llama a Microsoft Graph ni solicita permisos de Graph.
- El acceso se restringe al **tenant institucional** (single-tenant). No hay cuentas locales ni contraseñas propias en el sistema.
- La asignación de usuarios es obligatoria: quien no tenga rol asignado no puede ingresar.

### Roles de aplicación (App Roles)

| Rol | Valor | Descripción |
|---|---|---|
| Administrador | `Administrador` | Ingresa y opera: crea, edita y elimina puntos y sesiones, celebra, envía correos y descarga archivos. Sus permisos finos los define el API. |
| Lector | `Lector` | Ingresa en modo consulta: no puede editar ni descargar. |

Los roles son de tipo "Usuarios o grupos" y se asignan en Entra ID (Enterprise Application, Users and groups).

### Scopes del front

- `openid`, `profile`, `email`
- Scope propio del API: `api://<id-del-api>/access_as_user`

### Validación en el API

El API valida cada token antes de atender la petición:

- Firma
- Tenant (`tid`)
- Audiencia (`aud`)
- Claim `roles`

Los permisos finos dentro del sistema los asigna y controla el API en su propia base de datos, no Entra ID.

---

## 2. Microsoft Graph (fase posterior: envío real de correo y archivos)

No es necesario para el inicio de sesión. Se solicitará cuando se implemente el envío real de correos y el resguardo de archivos. El API usa su propia identidad (client credentials); el usuario final nunca recibe ni usa tokens de Graph.

| Permiso (aplicación) | Uso |
|---|---|
| `Mail.Send` | Enviar desde Outlook los avisos, engroses y convocatorias, desde un buzón institucional designado (acotado con una Application Access Policy de Exchange Online). |
| `Sites.Selected` (preferente) o `Files.ReadWrite.All` | Guardar los documentos de cada sesión en un sitio o biblioteca designada. |

Las credenciales del API se guardan en un almacén seguro (Key Vault o variables protegidas del servidor), nunca en el front; se prefiere certificado sobre secreto.

---

## 3. Resumen para el registro de aplicaciones

| Componente | Configuración | Tipo |
|---|---|---|
| SPA (front) | Plataforma "Aplicación de página única". Redirect URIs institucionales (desarrollo y producción, con HTTPS). Scopes `openid profile email` y `access_as_user`. | Delegado (solo login; requiere consentimiento de administrador) |
| API (back) | Application ID URI, scope `access_as_user` y App Roles `Administrador` y `Lector`. | Roles de aplicación |
| API (back, fase posterior) | Graph: `Mail.Send` y `Sites.Selected` (o `Files.ReadWrite.All`). | Aplicación (requiere consentimiento de administrador) |

---

## 4. Datos que se requieren de TI

| Dato | Detalle |
|---|---|
| Registro de la SPA | Application (client) ID y Directory (tenant) ID. |
| Registro del API | Application ID URI, scope `access_as_user` y App Roles creados. |
| Redirect URIs | Dominios institucionales de producción y pruebas del front. |
| Consentimiento de administrador (SPA) | El tenant no permite el consentimiento de los usuarios, así que un administrador debe conceder el consentimiento para los permisos delegados del registro de la SPA (`User.Read`, `openid`, `profile`, `email`) en Aplicaciones empresariales → la app → Permisos → "Conceder consentimiento de administrador". Sin esto, nadie puede iniciar sesión (aparece "Se necesita la aprobación del administrador"). |
| Asignación de roles | Usuarios o grupos con `Administrador` y con `Lector`, con "asignación requerida" activada. |
| Fase posterior | Credencial del API, consentimiento de administrador para Graph, destino de archivos y buzón remitente con su Application Access Policy. |

---

## 5. Estado actual (pruebas)

El front ya está preparado: el inicio de sesión, la pantalla de acceso y los dos roles funcionan con un registro de prueba (`SIGEP`) en el tenant institucional. Al recibir la infraestructura definitiva solo cambian tres valores de configuración (`VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_TENANT_ID` y `VITE_ENTRA_API_SCOPE`); no cambia el código.
