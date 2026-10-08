import { createContext, useContext, useEffect, useState } from 'react';
import {
  restaurarSesion, iniciarSesion as iniciarSesionEnServicio, cerrarSesion as cerrarSesionEnServicio, obtenerToken,
} from '../services/auth.js';
import { limpiarCliente } from '../services/SesionIndexedDB.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    restaurarSesion()
      .then((u) => vigente && setUsuario(u))
      .catch((e) => vigente && setError(e.message || 'No se pudo comprobar la sesión.'))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, []);

  async function iniciarSesion() {
    setError('');
    try {
      setUsuario(await iniciarSesionEnServicio());
    } catch (e) {
      setError(e.message || 'No se pudo iniciar sesión. Verifica tu cuenta institucional e intenta de nuevo.');
    }
  }

  async function cerrarSesion() {
    try {
      await cerrarSesionEnServicio();
    } finally {
      await limpiarCliente().catch(() => {});
      setUsuario(null);
    }
  }

  const rol = usuario?.rol ?? null;
  const esAdministrador = rol === 'administrador';

  const value = {
    usuario, rol, cargando, error,
    puedeEscribir: esAdministrador,
    puedeDescargar: esAdministrador,
    iniciarSesion, cerrarSesion, obtenerToken,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
