import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useAjustesVisuales } from '../../context/AjustesVisualesContext.jsx';
import Scrollbar from '../base/Scrollbar.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { carpetasDeSesion, contenidoDeNivel, nombreConNumero } from '../../utils/arbolArchivos.js';
import { estiloArchivo } from '../../utils/archivos.js';
import { formatoTamano } from '../../utils/correos.js';
import { encabezadoSesion, listaNoPublicada, hayActaVisible, infoNavegadorAbierta, TEXTO_LISTA_NO_PUBLICADA } from '../../utils/sesiones.js';
import { normalizarTexto, puntoCoincide } from '../../utils/puntos.js';
import '../../styles/widgets/VistaNavegador.css';

function partirNombre(nombre) {
  const punto = nombre.lastIndexOf('.');
  return punto > 0 ? { base: nombre.slice(0, punto), extension: nombre.slice(punto) } : { base: nombre, extension: '' };
}

function fechaCorta(iso) {
  return iso ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

function buscarEnCarpetas(carpetas, consulta) {
  const q = normalizarTexto(consulta);
  const carpetasEncontradas = [];
  const archivosEncontrados = [];
  carpetas.forEach((c) => {
    if (normalizarTexto(c.nombre).includes(q)) {
      carpetasEncontradas.push({ clave: `c:${c.id}`, nombre: c.nombre, origen: '', cantidad: c.archivos.length, rutaDestino: [c.id] });
    }
    const vistas = new Set();
    c.archivos.forEach((entrada) => {
      const segmentos = (entrada.archivo.ruta || '').split('/').filter(Boolean);
      segmentos.forEach((segmento, i) => {
        const rutaSub = segmentos.slice(0, i + 1).join('/');
        if (vistas.has(rutaSub) || !normalizarTexto(segmento).includes(q)) return;
        vistas.add(rutaSub);
        carpetasEncontradas.push({
          clave: `c:${c.id}/${rutaSub}`,
          nombre: segmento,
          origen: [c.nombre, ...segmentos.slice(0, i)].join(' / '),
          cantidad: c.archivos.filter((e) => { const r = e.archivo.ruta || ''; return r === rutaSub || r.startsWith(`${rutaSub}/`); }).length,
          rutaDestino: [c.id, ...segmentos.slice(0, i + 1)],
        });
      });
      if (normalizarTexto(nombreConNumero(entrada.archivo)).includes(q)) {
        archivosEncontrados.push({ ...entrada, origen: [c.nombre, ...segmentos].join(' / ') });
      }
    });
  });
  return { carpetasEncontradas, archivosEncontrados };
}

export default function VistaNavegador() {
  const { puedeEscribir } = useAuth();
  const { sesionSeleccionada, FECHAS_SESIONES, SECCIONES_DOCUMENTO, PUNTOS, cargando, error, renombrarArchivo, renombrarCarpeta } = useProyecto();
  const { abrirVistaArchivo, terminoBusqueda, elementoNavegador, setElementoNavegador, irAPunto } = useUI();
  const { infoNavegadorPorSesion, cambiarInfoNavegador } = useAjustesVisuales();
  const [posicion, setPosicion] = useState({ sesionId: null, ruta: [], busqueda: '' });
  const [renombrando, setRenombrando] = useState(null);
  const [textoNuevo, setTextoNuevo] = useState('');
  const [errorRenombrar, setErrorRenombrar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const sesionId = sesionSeleccionada?.id ?? null;
  const ruta = posicion.sesionId === sesionId ? posicion.ruta : [];
  const busqueda = posicion.sesionId === sesionId ? posicion.busqueda : '';
  const buscando = busqueda.trim() !== '';
  const todasLasCarpetas = carpetasDeSesion(PUNTOS, sesionSeleccionada, FECHAS_SESIONES, SECCIONES_DOCUMENTO);
  const terminoGlobal = terminoBusqueda.trim();
  const puntoDeCarpeta = (c) => PUNTOS.find((p) => p.id === c.puntoRef);
  const carpetas = terminoGlobal
    ? todasLasCarpetas.filter((c) => { const p = puntoDeCarpeta(c); return p && puntoCoincide(p, terminoGlobal); })
    : todasLasCarpetas;
  const carpeta = ruta.length ? todasLasCarpetas.find((c) => c.id === ruta[0]) : null;
  const subruta = carpeta ? ruta.slice(1) : [];
  const nivel = carpeta ? contenidoDeNivel(carpeta, subruta) : null;
  const puedeRenombrar = puedeEscribir && !!sesionSeleccionada && sesionSeleccionada.estado !== 'celebrada' && sesionSeleccionada.estado !== 'no-celebrada';
  const titulo = encabezadoSesion(sesionSeleccionada).titulo;
  const hayActa = hayActaVisible(sesionSeleccionada, puedeEscribir);
  const infoAbierta = infoNavegadorAbierta(infoNavegadorPorSesion, sesionSeleccionada?.id, hayActa);
  const hayVistaProyecto = sesionSeleccionada?.estado === 'proxima' || sesionSeleccionada?.estado === 'pendiente';
  const claveSeleccionada = elementoNavegador && elementoNavegador.sesionId === sesionId ? elementoNavegador.clave : null;

  function ir(nuevaRuta) {
    setRenombrando(null);
    setElementoNavegador(null);
    setPosicion({ sesionId, ruta: nuevaRuta, busqueda: '' });
  }

  function buscar(texto) {
    setRenombrando(null);
    setElementoNavegador(null);
    setPosicion({ sesionId, ruta, busqueda: texto });
  }

  function subir() {
    if (buscando) ir(ruta);
    else if (ruta.length) ir(ruta.slice(0, -1));
  }

  function teclaNavegador(e) {
    if (errorRenombrar || e.target.tagName === 'INPUT') return;
    if (e.key === 'Backspace' || (e.altKey && e.key === 'ArrowLeft')) {
      e.preventDefault();
      subir();
    }
  }

  function empezarRenombrar(clave, base) {
    setRenombrando(clave);
    setTextoNuevo(base);
  }

  async function confirmarRenombrar(clave, base, aplicar) {
    const nuevo = textoNuevo.trim();
    if ((!nuevo && !clave.startsWith('c:')) || nuevo === base) {
      setRenombrando(null);
      return;
    }
    setGuardando(true);
    try {
      await aplicar(nuevo);
      setRenombrando(null);
      setElementoNavegador(null);
    } catch (e) {
      setErrorRenombrar(e.mensaje || 'No se pudo renombrar.');
    } finally {
      setGuardando(false);
    }
  }

  function teclaRenombrar(e, clave, base, aplicar) {
    if (e.key === 'Enter') confirmarRenombrar(clave, base, aplicar);
    if (e.key === 'Escape') setRenombrando(null);
  }

  function campoEdicion(clave, base, prefijo, extension, aplicar) {
    return (
      <span className="widget-vista-navegador-edicion" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        {prefijo && <span className="widget-vista-navegador-prefijo">{prefijo}</span>}
        <input
          className="widget-vista-navegador-entrada"
          value={textoNuevo}
          autoFocus
          disabled={guardando}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setTextoNuevo(e.target.value)}
          onKeyDown={(e) => teclaRenombrar(e, clave, base, aplicar)}
          onBlur={() => { if (!guardando) setRenombrando(null); }}
          aria-label="Nuevo nombre"
        />
        {extension && <span className="widget-vista-navegador-extension">{extension}</span>}
      </span>
    );
  }

  function botonIrAPunto(puntoId) {
    return (
      <span className="widget-vista-navegador-col-acciones">
        {hayVistaProyecto && puntoId && PUNTOS.some((p) => p.id === puntoId) && (
          <button
            type="button"
            className="widget-vista-navegador-ir"
            onClick={(e) => { e.stopPropagation(); irAPunto(puntoId, PUNTOS.find((p) => p.id === puntoId).seccion); }}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            Ir al punto
          </button>
        )}
      </span>
    );
  }

  const migas = [
    { clave: 'raiz', texto: titulo, alIr: () => ir([]) },
    ...(carpeta ? [{ clave: carpeta.id, texto: carpeta.nombre, alIr: () => ir([carpeta.id]) }] : []),
    ...subruta.map((segmento, i) => ({ clave: `${i}-${segmento}`, texto: segmento, alIr: () => ir([carpeta.id, ...subruta.slice(0, i + 1)]) })),
  ];

  const resultados = buscando ? buscarEnCarpetas(carpetas, busqueda.trim()) : null;

  const filasCarpetas = buscando
    ? resultados.carpetasEncontradas.map((r) => ({
      clave: r.clave, nombre: r.nombre, base: r.nombre, prefijo: '', origen: r.origen, cantidad: r.cantidad,
      puntoId: carpetas.find((c) => c.id === r.rutaDestino[0])?.puntoRef ?? null,
      ubicacion: r.origen,
      alAbrir: () => ir(r.rutaDestino),
      renombrable: false,
    }))
    : carpeta
    ? nivel.subcarpetas.map((sub) => {
      const rutaSub = [...subruta, sub.nombre].join('/');
      return {
        clave: `c:${rutaSub}`, nombre: sub.nombre, base: sub.nombre, prefijo: '', cantidad: sub.cantidad,
        puntoId: carpeta.puntoRef,
        ubicacion: [carpeta.nombre, ...subruta].join(' / '),
        alAbrir: () => ir([...ruta, sub.nombre]),
        renombrable: !!carpeta.renombrable,
        aplicar: (nuevo) => renombrarCarpeta(carpeta.puntoId, rutaSub, nuevo),
      };
    })
    : carpetas.map((c) => ({
      clave: `c:${c.id}`, nombre: c.nombre, base: c.prefijo ? c.nombre.slice(c.prefijo.length) : c.nombre, prefijo: c.prefijo || '', cantidad: c.archivos.length,
      puntoId: c.puntoRef,
      ubicacion: titulo,
      alAbrir: () => ir([c.id]),
      renombrable: !!c.renombrable,
      aplicar: (nuevo) => renombrarCarpeta(c.puntoId, '', nuevo),
    }));
  const entradasArchivos = buscando ? resultados.archivosEncontrados : nivel ? nivel.archivos : [];
  const filasArchivos = entradasArchivos.map((entrada) => {
    const { archivo } = entrada;
    const { base, extension } = partirNombre(archivo.nombre);
    const nombreNumerado = nombreConNumero(archivo);
    return {
      entrada,
      clave: `a:${archivo.id}`,
      base,
      extension,
      prefijo: nombreNumerado.slice(0, nombreNumerado.length - archivo.nombre.length),
      estilo: estiloArchivo(archivo.nombre),
      renombrable: !archivo.autogenerado,
      aplicar: (nuevo) => renombrarArchivo(entrada.puntoId, archivo.id, `${nuevo}${extension}`),
    };
  });
  const vacio = filasCarpetas.length === 0 && filasArchivos.length === 0;

  function seleccionarCarpeta(f) {
    setElementoNavegador({ sesionId, clave: f.clave, tipo: 'carpeta', nombre: f.nombre, icono: 'ri-folder-3-fill', tono: 'carpeta', cantidad: f.cantidad, ubicacion: f.ubicacion, puntoId: f.puntoId });
  }

  function seleccionarArchivo(f) {
    const { archivo } = f.entrada;
    setElementoNavegador({
      sesionId, clave: f.clave, tipo: 'archivo', nombre: nombreConNumero(archivo), icono: f.estilo.icono, tono: f.estilo.tono, extension: f.extension,
      tamano: archivo.tamano, fecha: archivo.creadoEn, puntoId: f.entrada.puntoId,
      ubicacion: f.entrada.origen || [carpeta?.nombre, ...subruta].filter(Boolean).join(' / '),
    });
  }

  const filaSeleccionada = claveSeleccionada
    ? filasCarpetas.find((f) => f.clave === claveSeleccionada) || filasArchivos.find((f) => f.clave === claveSeleccionada)
    : null;
  const puedeRenombrarSeleccion = puedeRenombrar && !buscando && !!filaSeleccionada && filaSeleccionada.renombrable && renombrando === null;

  return (
    <div className="widget-vista-navegador" tabIndex={-1} onKeyDown={teclaNavegador}>
      <div className="widget-vista-navegador-barra">
        <div className="widget-vista-navegador-migas">
          {migas.map((m, i) => (
            <span key={m.clave} className="widget-vista-navegador-miga-envoltorio">
              {i > 0 && <i className="ri-arrow-right-s-line widget-vista-navegador-separador"></i>}
              <button
                type="button"
                className={'widget-vista-navegador-miga' + (i === migas.length - 1 ? ' widget-vista-navegador-miga-actual' : '')}
                onClick={m.alIr}
                disabled={i === migas.length - 1}
              >
                {m.texto}
              </button>
            </span>
          ))}
        </div>
        <div className="widget-vista-navegador-busqueda">
          <i className="ri-search-line"></i>
          <input
            className="widget-vista-navegador-busqueda-entrada"
            value={busqueda}
            placeholder="Buscar en la sesión"
            disabled={!sesionSeleccionada}
            onChange={(e) => buscar(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') buscar(''); }}
            aria-label="Buscar en la sesión"
          />
          {busqueda && (
            <button type="button" className="widget-vista-navegador-busqueda-limpiar" onClick={() => buscar('')} aria-label="Limpiar búsqueda" title="Limpiar búsqueda">
              <i className="ri-close-line"></i>
            </button>
          )}
        </div>
      </div>
      <div className="widget-vista-navegador-herramientas">
        <BotonIcono icono="ri-arrow-up-line" ariaLabel="Subir un nivel" onClick={subir} disabled={!buscando && ruta.length === 0} />
        <BotonIcono
          icono="ri-pencil-line"
          ariaLabel="Renombrar"
          onClick={() => filaSeleccionada && empezarRenombrar(filaSeleccionada.clave, filaSeleccionada.base)}
          disabled={!puedeRenombrarSeleccion}
        />
        <span className="widget-vista-navegador-herramientas-espacio"></span>
        <BotonIcono
          icono={infoAbierta ? 'ri-information-fill' : 'ri-information-line'}
          ariaLabel="Información"
          onClick={() => cambiarInfoNavegador(sesionSeleccionada?.id, !infoAbierta)}
        />
      </div>

      <div className="widget-vista-navegador-encabezado">
        <span className="widget-vista-navegador-col-nombre">Nombre</span>
        <span className="widget-vista-navegador-col-fecha">Fecha</span>
        <span className="widget-vista-navegador-col-tamano">Tamaño</span>
        <span className="widget-vista-navegador-col-acciones"></span>
      </div>

      <div className="widget-vista-navegador-cuerpo" onClick={() => setElementoNavegador(null)}>
        <Scrollbar>
          {!sesionSeleccionada && <div className="widget-vista-navegador-vacio">Selecciona una sesión para ver sus archivos.</div>}
          {sesionSeleccionada && cargando && PUNTOS.length === 0 && <div className="widget-vista-navegador-vacio">Cargando…</div>}
          {sesionSeleccionada && error && PUNTOS.length === 0 && <div className="widget-vista-navegador-vacio">No se pudieron cargar los archivos.</div>}
          {sesionSeleccionada && !cargando && !error && vacio && <div className="widget-vista-navegador-vacio">{listaNoPublicada(sesionSeleccionada, puedeEscribir) ? TEXTO_LISTA_NO_PUBLICADA : buscando ? `Sin resultados para «${busqueda.trim()}».` : carpeta ? 'Esta carpeta está vacía.' : terminoGlobal ? `Ningún punto coincide con «${terminoGlobal}».` : 'Esta sesión aún no tiene archivos.'}</div>}

          {filasCarpetas.map((f) => {
            const editando = renombrando === f.clave;
            const vacia = f.cantidad === 0;
            return (
              <div
                key={f.clave}
                className={'widget-vista-navegador-fila' + (f.clave === claveSeleccionada ? ' widget-vista-navegador-fila-seleccionada' : '') + (vacia ? ' widget-vista-navegador-fila-vacia' : '')}
                onClick={(e) => { e.stopPropagation(); if (!editando && !vacia) seleccionarCarpeta(f); }}
                onDoubleClick={() => { if (!editando && !vacia) f.alAbrir(); }}
                role="button"
                aria-disabled={vacia}
                tabIndex={vacia ? -1 : 0}
                onKeyDown={(e) => { if (e.key === 'Enter' && !editando && !vacia) f.alAbrir(); }}
              >
                <span className="widget-vista-navegador-col-nombre">
                  <i className="ri-folder-3-fill widget-vista-navegador-icono-carpeta"></i>
                  {editando ? campoEdicion(f.clave, f.base, f.prefijo, '', f.aplicar) : <span className="widget-vista-navegador-nombre">{f.nombre}</span>}
                  {f.origen && <span className="widget-vista-navegador-origen" title={f.origen}>{f.origen}</span>}
                </span>
                <span className="widget-vista-navegador-col-fecha"></span>
                <span className="widget-vista-navegador-col-tamano">{f.cantidad} {f.cantidad === 1 ? 'elemento' : 'elementos'}</span>
                {botonIrAPunto(f.puntoId)}
              </div>
            );
          })}

          {filasArchivos.map((f) => {
            const { archivo } = f.entrada;
            const editando = renombrando === f.clave;
            return (
              <div
                key={archivo.id}
                className={'widget-vista-navegador-fila' + (f.clave === claveSeleccionada ? ' widget-vista-navegador-fila-seleccionada' : '')}
                onClick={(e) => { e.stopPropagation(); if (!editando) seleccionarArchivo(f); }}
                onDoubleClick={() => { if (!editando) abrirVistaArchivo(archivo); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' && !editando) abrirVistaArchivo(archivo); }}
              >
                <span className="widget-vista-navegador-col-nombre">
                  <i className={`${f.estilo.icono} widget-vista-navegador-icono widget-vista-navegador-icono-${f.estilo.tono}`}></i>
                  {editando ? campoEdicion(f.clave, f.base, f.prefijo, f.extension, f.aplicar) : (
                    <span className="widget-vista-navegador-nombre" title={nombreConNumero(archivo)}>{nombreConNumero(archivo)}</span>
                  )}
                  {f.entrada.origen && <span className="widget-vista-navegador-origen" title={f.entrada.origen}>{f.entrada.origen}</span>}
                </span>
                <span className="widget-vista-navegador-col-fecha">{fechaCorta(archivo.creadoEn)}</span>
                <span className="widget-vista-navegador-col-tamano">{archivo.tamano ? formatoTamano(archivo.tamano) : '—'}</span>
                {botonIrAPunto(f.entrada.puntoId)}
              </div>
            );
          })}
        </Scrollbar>
      </div>

      <Modal abierto={!!errorRenombrar} titulo="Renombrar archivo" onCerrar={() => setErrorRenombrar(null)}>
        <p className="widget-vista-navegador-mensaje">{errorRenombrar}</p>
        <div className="widget-vista-navegador-modal-acciones">
          <BotonS variant="claro" onClick={() => setErrorRenombrar(null)}>Cerrar</BotonS>
        </div>
      </Modal>
    </div>
  );
}
