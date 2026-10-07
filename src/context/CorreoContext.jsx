import { createContext, useContext, useEffect, useState } from 'react';
import {
  listarContactosCorreo, crearContactoCorreo, eliminarContactoCorreo as eliminarContactoEnApi,
  listarPlantillasCorreo, crearPlantillaCorreo, eliminarPlantillaCorreo as eliminarPlantillaEnApi,
  listarListasCorreo, crearListaCorreo, eliminarListaCorreo as eliminarListaEnApi,
  listarCorreosRemitentes, listarCorreosEnviados, guardarCorreoRemitente as guardarCorreoRemitenteEnApi,
  enviarCorreo as enviarCorreoEnApi,
} from '../services/api.js';
import { guardarCache, obtenerCache, guardarBorrador, obtenerBorrador, eliminarBorrador } from '../services/SesionIndexedDB.js';

const CorreoContext = createContext(null);

const RECURSOS = [
  { clave: 'contactos', cache: 'contactosCorreo', listar: listarContactosCorreo },
  { clave: 'plantillas', cache: 'plantillasCorreo', listar: listarPlantillasCorreo },
  { clave: 'listas', cache: 'listasCorreo', listar: listarListasCorreo },
  { clave: 'correosRemitentes', cache: 'correosRemitentes', listar: listarCorreosRemitentes },
  { clave: 'correosEnviados', cache: 'correosEnviados', listar: listarCorreosEnviados },
];

export function CorreoProvider({ children }) {
  const [datos, setDatos] = useState({ contactos: [], plantillas: [], listas: [], correosRemitentes: [], correosEnviados: [] });
  const [cargas, setCargas] = useState(() => Object.fromEntries(RECURSOS.map((r) => [r.clave, { cargando: true }])));

  function marcarCarga(clave, estado) {
    setCargas((c) => ({ ...c, [clave]: estado }));
  }

  function aplicar(recurso, lista) {
    setDatos((d) => ({ ...d, [recurso.clave]: lista }));
    guardarCache(recurso.cache, lista);
  }

  useEffect(() => {
    let vigente = true;
    RECURSOS.forEach((recurso) => {
      let listo = false;
      obtenerCache(recurso.cache).then((c) => {
        if (vigente && !listo && Array.isArray(c)) setDatos((d) => ({ ...d, [recurso.clave]: c }));
      });
      recurso.listar()
        .then((lista) => {
          if (!vigente) return;
          listo = true;
          aplicar(recurso, lista);
          marcarCarga(recurso.clave, {});
        })
        .catch((e) => vigente && marcarCarga(recurso.clave, { error: e }));
    });
    return () => { vigente = false; };
  }, []);

  const recurso = (clave) => RECURSOS.find((r) => r.clave === clave);

  async function recargar(clave) {
    const r = recurso(clave);
    aplicar(r, await r.listar());
  }

  async function agregarContacto(campos) {
    await crearContactoCorreo(campos);
    await recargar('contactos');
  }
  async function eliminarContacto(id) {
    await eliminarContactoEnApi(id);
    await recargar('contactos');
  }
  async function agregarPlantilla(campos) {
    await crearPlantillaCorreo(campos);
    await recargar('plantillas');
  }
  async function eliminarPlantilla(id) {
    await eliminarPlantillaEnApi(id);
    await recargar('plantillas');
  }
  async function agregarLista(campos) {
    await crearListaCorreo(campos);
    await recargar('listas');
  }
  async function eliminarLista(id) {
    await eliminarListaEnApi(id);
    await recargar('listas');
  }
  async function guardarCorreoRemitente(remitenteId, correo) {
    await guardarCorreoRemitenteEnApi(remitenteId, correo);
    await recargar('correosRemitentes');
  }
  async function enviarCorreo(campos) {
    const enviado = await enviarCorreoEnApi(campos);
    await recargar('correosEnviados');
    return enviado;
  }

  const cargando = Object.values(cargas).some((c) => c.cargando);
  const error = Object.values(cargas).map((c) => c.error).find(Boolean) ?? null;

  const value = {
    CONTACTOS_CORREO: datos.contactos,
    PLANTILLAS_CORREO: datos.plantillas,
    LISTAS_CORREO: datos.listas,
    CORREOS_REMITENTES: datos.correosRemitentes,
    CORREOS_ENVIADOS: datos.correosEnviados,
    agregarContacto, eliminarContacto,
    agregarPlantilla, eliminarPlantilla,
    agregarLista, eliminarLista,
    guardarCorreoRemitente, enviarCorreo,
    guardarBorrador, obtenerBorrador, eliminarBorrador,
    cargando, error,
  };
  return <CorreoContext.Provider value={value}>{children}</CorreoContext.Provider>;
}

export function useCorreo() {
  return useContext(CorreoContext);
}
