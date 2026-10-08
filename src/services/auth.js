const implementacion = import.meta.env.VITE_AUTH_MODE === 'entra'
  ? await import('./Auth/EntraAuth.js')
  : await import('./Auth/LocalAuth.js');

export const {
  restaurarSesion,
  iniciarSesion,
  cerrarSesion,
  usuarioActual,
  obtenerToken,
} = implementacion;
