import { createContext, useContext, useEffect, useState } from 'react';
import {
  listarIntegrantes, crearIntegrante, editarIntegrante as editarIntegranteEnApi, eliminarIntegrante as eliminarIntegranteEnApi,
  obtenerSecretarioEjecutivo, guardarSecretarioEjecutivo as guardarSecretarioEnApi, eliminarSecretarioEjecutivo as eliminarSecretarioEnApi,
} from '../services/api.js';
import { guardarCache, obtenerCache } from '../services/SesionIndexedDB.js';

const OrganoContext = createContext(null);

const CACHE_INTEGRANTES = 'integrantes';
const CACHE_SECRETARIO = 'secretarioEjecutivo';

export function OrganoProvider({ children }) {
  const [integrantes, setIntegrantes] = useState([]);
  const [secretario, setSecretario] = useState(null);
  const [cargas, setCargas] = useState({ integrantes: { cargando: true }, secretario: { cargando: true } });

  function marcarCarga(recurso, estado) {
    setCargas((c) => ({ ...c, [recurso]: estado }));
  }

  useEffect(() => {
    let vigente = true;
    let integrantesListos = false;
    let secretarioListo = false;
    obtenerCache(CACHE_INTEGRANTES).then((c) => {
      if (vigente && !integrantesListos && Array.isArray(c)) setIntegrantes(c);
    });
    obtenerCache(CACHE_SECRETARIO).then((c) => {
      if (vigente && !secretarioListo && c) setSecretario(c);
    });
    listarIntegrantes()
      .then((lista) => {
        if (!vigente) return;
        integrantesListos = true;
        setIntegrantes(lista);
        guardarCache(CACHE_INTEGRANTES, lista);
        marcarCarga('integrantes', {});
      })
      .catch((e) => vigente && marcarCarga('integrantes', { error: e }));
    obtenerSecretarioEjecutivo()
      .then((s) => {
        if (!vigente) return;
        secretarioListo = true;
        setSecretario(s);
        guardarCache(CACHE_SECRETARIO, s);
        marcarCarga('secretario', {});
      })
      .catch((e) => vigente && marcarCarga('secretario', { error: e }));
    return () => { vigente = false; };
  }, []);

  function aplicarIntegrantes(lista) {
    setIntegrantes(lista);
    guardarCache(CACHE_INTEGRANTES, lista);
  }
  function aplicarSecretario(s) {
    setSecretario(s);
    guardarCache(CACHE_SECRETARIO, s);
  }

  async function agregarIntegrante(datos) {
    await crearIntegrante(datos);
    aplicarIntegrantes(await listarIntegrantes());
  }
  async function editarIntegrante(id, version, cambios) {
    try {
      await editarIntegranteEnApi(id, version, cambios);
    } catch (e) {
      if (e.codigo === 'CONFLICTO') aplicarIntegrantes(await listarIntegrantes());
      throw e;
    }
    aplicarIntegrantes(await listarIntegrantes());
  }
  async function eliminarIntegrante(id) {
    await eliminarIntegranteEnApi(id);
    aplicarIntegrantes(await listarIntegrantes());
  }
  async function guardarSecretarioEjecutivo(datos) {
    aplicarSecretario(await guardarSecretarioEnApi(datos));
  }
  async function eliminarSecretarioEjecutivo() {
    await eliminarSecretarioEnApi();
    aplicarSecretario(null);
  }

  const cargando = Object.values(cargas).some((c) => c.cargando);
  const error = Object.values(cargas).map((c) => c.error).find(Boolean) ?? null;

  const value = {
    INTEGRANTES: integrantes,
    SECRETARIO_EJECUTIVO: secretario,
    agregarIntegrante, editarIntegrante, eliminarIntegrante,
    guardarSecretarioEjecutivo, eliminarSecretarioEjecutivo,
    cargando, error,
  };
  return <OrganoContext.Provider value={value}>{children}</OrganoContext.Provider>;
}

export function useOrgano() {
  return useContext(OrganoContext);
}
