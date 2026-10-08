import { useState } from 'react';
import BotonSeleccionableMenu from '../base/BotonSeleccionableMenu.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import Scrollbar from '../base/Scrollbar.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { estiloArchivo, numerarPendientes } from '../../utils/archivos.js';
import '../../styles/widgets/ListaAdjuntosPunto.css';

const rellenar = (numero) => String(numero).padStart(2, '0');

export default function ListaAdjuntosPunto() {
  const { PUNTOS, SECCIONES_DOCUMENTO, eliminarArchivo, reordenarArchivos } = useProyecto();
  const { puntoEnEdicionId, seccionNuevoPunto, archivosNuevoPunto, setArchivosNuevoPunto } = useUI();
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [archivoAQuitar, setArchivoAQuitar] = useState(null);
  const [errorQuitar, setErrorQuitar] = useState(null);
  const [errorOrden, setErrorOrden] = useState(null);

  const punto = puntoEnEdicionId ? PUNTOS.find((p) => p.id === puntoEnEdicionId) : null;
  const seccion = SECCIONES_DOCUMENTO.find((s) => s.id === seccionNuevoPunto);

  const items = punto
    ? punto.archivos.map((a, i) => ({
        clave: a.id ?? `sin-id-${i}`, nombre: a.nombre, ruta: a.ruta ?? '', numero: a.origen === 'punto' ? null : a.numero,
        guardado: a.id ? a : null, suelto: !!a.id && !a.ruta && !a.autogenerado, quitable: !!a.id && !a.autogenerado,
      }))
    : numerarPendientes(archivosNuevoPunto, seccion?.primerNumeroArchivo ?? 1, !!seccion?.requiereAcuerdo).map((e) => ({
        clave: `${e.ruta}/${e.archivo.name}-${e.indice}`, nombre: e.archivo.name, ruta: e.ruta, numero: e.numero,
        indice: e.indice, suelto: !e.ruta, quitable: true,
      }));
  const sueltos = items.filter((item) => item.suelto);

  async function mover(item, delta) {
    setErrorOrden(null);
    const posicion = sueltos.findIndex((s) => s.clave === item.clave);
    const destino = sueltos[posicion + delta];
    if (!destino) return;
    if (item.guardado) {
      const ids = sueltos.map((s) => s.guardado.id);
      [ids[posicion], ids[posicion + delta]] = [ids[posicion + delta], ids[posicion]];
      try {
        await reordenarArchivos(punto.id, ids);
      } catch (e) {
        setErrorOrden(e.mensaje || 'No se pudo cambiar el orden.');
      }
      return;
    }
    setArchivosNuevoPunto((actuales) => {
      const copia = [...actuales];
      [copia[item.indice], copia[destino.indice]] = [copia[destino.indice], copia[item.indice]];
      return copia;
    });
  }

  function quitar(item) {
    if (item.guardado) {
      setArchivoAQuitar(item.guardado);
      return;
    }
    setArchivosNuevoPunto((actuales) => actuales.filter((_, i) => i !== item.indice));
  }

  function cancelarQuitar() {
    setArchivoAQuitar(null);
    setErrorQuitar(null);
  }

  async function confirmarQuitar() {
    setErrorQuitar(null);
    try {
      await eliminarArchivo(punto.id, archivoAQuitar.id);
      setArchivoAQuitar(null);
    } catch (e) {
      setErrorQuitar(e.mensaje || 'No se pudo quitar el archivo.');
    }
  }

  function fila(item, anteriorRuta) {
    const posicion = sueltos.findIndex((s) => s.clave === item.clave);
    return (
      <div key={item.clave}>
        {item.ruta && item.ruta !== anteriorRuta && (
          <div className="widget-adjuntos-punto-carpeta" title={item.ruta}>
            <i className="ri-folder-line"></i>
            <span>{item.ruta}</span>
          </div>
        )}
        <BotonSeleccionableMenu
          variante={estiloArchivo(item.nombre).tono}
          activo={item.clave === seleccionadoId}
          onClick={() => setSeleccionadoId(item.clave)}
          accion={item.suelto || item.quitable ? (
            <span className="widget-adjuntos-punto-acciones" onClick={(e) => e.stopPropagation()}>
              {item.suelto && sueltos.length > 1 && (
                <>
                  <span className="widget-adjuntos-punto-boton">
                    <BotonIcono icono="ri-arrow-up-s-line" ariaLabel="Subir archivo" disabled={posicion === 0} onClick={() => mover(item, -1)} />
                  </span>
                  <span className="widget-adjuntos-punto-boton">
                    <BotonIcono icono="ri-arrow-down-s-line" ariaLabel="Bajar archivo" disabled={posicion === sueltos.length - 1} onClick={() => mover(item, 1)} />
                  </span>
                </>
              )}
              {item.quitable && (
                <span className="widget-adjuntos-punto-boton">
                  <BotonIcono icono="ri-close-line" ariaLabel="Quitar archivo" onClick={() => quitar(item)} />
                </span>
              )}
            </span>
          ) : null}
        >
          <span className="widget-adjuntos-punto-numero">{item.numero != null ? rellenar(item.numero) : ''}</span>
          <span className="widget-adjuntos-punto-nombre" title={item.ruta ? `${item.ruta}/${item.nombre}` : item.nombre}>
            {item.nombre}
          </span>
        </BotonSeleccionableMenu>
      </div>
    );
  }

  return (
    <div className="widget-adjuntos-punto">
      <div className="widget-adjuntos-punto-titulo">
        Adjuntos del punto{items.length > 0 ? ` (${items.length})` : ''}
      </div>
      <div className="widget-adjuntos-punto-cuerpo">
        <Scrollbar>
          <div className="widget-adjuntos-punto-contenido">
            {errorOrden && <div className="widget-adjuntos-punto-error widget-adjuntos-punto-error-lista">{errorOrden}</div>}
            {items.length === 0 && <div className="widget-adjuntos-punto-vacio">Aún no hay archivos adjuntos.</div>}
            {items.map((item, i) => fila(item, i > 0 ? items[i - 1].ruta : ''))}
          </div>
        </Scrollbar>
      </div>
      <Modal abierto={!!archivoAQuitar} titulo="Quitar archivo" onCerrar={cancelarQuitar}>
        <p className="widget-adjuntos-punto-modal-mensaje">
          ¿Quieres quitar «{archivoAQuitar?.nombre}» de este punto? Esta acción no se puede deshacer.
        </p>
        {errorQuitar && <div className="widget-adjuntos-punto-error">{errorQuitar}</div>}
        <div className="widget-adjuntos-punto-modal-acciones">
          <BotonS variant="claro" onClick={cancelarQuitar}>Cancelar</BotonS>
          <BotonS variant="claro" onClick={confirmarQuitar}>Quitar</BotonS>
        </div>
      </Modal>
    </div>
  );
}
