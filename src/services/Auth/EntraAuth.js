import { PublicClientApplication } from '@azure/msal-browser';

const CLIENT_ID = import.meta.env.VITE_ENTRA_CLIENT_ID;
const TENANT_ID = import.meta.env.VITE_ENTRA_TENANT_ID;
const SCOPE_API = import.meta.env.VITE_ENTRA_API_SCOPE;

const ROLES_ENTRA = { Administrador: 'administrador', Lector: 'lector' };
const ORDEN_ROLES = ['Administrador', 'Lector'];
const SCOPES_LOGIN = ['openid', 'profile', 'email'];

let msal = null;
let promesaMsal = null;
let actual = null;

function aUsuario(cuenta) {
  const roles = cuenta.idTokenClaims?.roles ?? [];
  const rolEntra = ORDEN_ROLES.find((r) => roles.includes(r));
  return {
    id: cuenta.localAccountId,
    nombre: cuenta.name || cuenta.username,
    correo: cuenta.username,
    rol: rolEntra ? ROLES_ENTRA[rolEntra] : null,
  };
}

function obtenerMsal() {
  if (!promesaMsal) {
    promesaMsal = (async () => {
      if (!CLIENT_ID || !TENANT_ID) {
        throw new Error('Falta configurar VITE_ENTRA_CLIENT_ID y VITE_ENTRA_TENANT_ID.');
      }
      const instancia = new PublicClientApplication({
        auth: {
          clientId: CLIENT_ID,
          authority: `https://login.microsoftonline.com/${TENANT_ID}`,
          redirectUri: window.location.origin,
        },
        cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false },
      });
      await instancia.initialize();
      msal = instancia;
      return instancia;
    })().catch((e) => {
      promesaMsal = null;
      throw e;
    });
  }
  return promesaMsal;
}

function fijarCuenta(cuenta) {
  msal.setActiveAccount(cuenta);
  actual = aUsuario(cuenta);
  return actual;
}

export async function restaurarSesion() {
  const instancia = await obtenerMsal();
  const resultado = await instancia.handleRedirectPromise();
  const cuenta = resultado?.account ?? instancia.getAllAccounts()[0];
  return cuenta ? fijarCuenta(cuenta) : null;
}

export async function iniciarSesion() {
  const instancia = await obtenerMsal();
  const resultado = await instancia.loginPopup({ scopes: SCOPES_LOGIN });
  return fijarCuenta(resultado.account);
}

export async function cerrarSesion() {
  const instancia = await obtenerMsal();
  const cuenta = instancia.getActiveAccount();
  actual = null;
  if (cuenta) await instancia.logoutPopup({ account: cuenta });
}

export function usuarioActual() {
  return actual;
}

export async function obtenerToken() {
  if (!SCOPE_API) return null;
  const instancia = await obtenerMsal();
  const cuenta = instancia.getActiveAccount();
  if (!cuenta) return null;
  try {
    return (await instancia.acquireTokenSilent({ scopes: [SCOPE_API], account: cuenta })).accessToken;
  } catch {
    return (await instancia.acquireTokenPopup({ scopes: [SCOPE_API] })).accessToken;
  }
}
