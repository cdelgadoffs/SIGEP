const CLAVE_SALIDA = 'sigep-local-salio';
const ROLES = ['administrador', 'lector'];

let actual = null;

function usuarioLocal() {
  const rol = import.meta.env.VITE_LOCAL_ROL;
  return { id: 'usuario-local', nombre: 'Usuario local', correo: 'local@sigep.test', rol: ROLES.includes(rol) ? rol : 'administrador' };
}

function haSalido() {
  try {
    return sessionStorage.getItem(CLAVE_SALIDA) === '1';
  } catch {
    return false;
  }
}

function marcarSalida(valor) {
  try {
    if (valor) sessionStorage.setItem(CLAVE_SALIDA, '1');
    else sessionStorage.removeItem(CLAVE_SALIDA);
  } catch {
    return;
  }
}

export async function restaurarSesion() {
  actual = haSalido() ? null : usuarioLocal();
  return actual;
}

export async function iniciarSesion() {
  marcarSalida(false);
  actual = usuarioLocal();
  return actual;
}

export async function cerrarSesion() {
  marcarSalida(true);
  actual = null;
}

export function usuarioActual() {
  return actual;
}

export async function obtenerToken() {
  return actual ? 'token-local' : null;
}
