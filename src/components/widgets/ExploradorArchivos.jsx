import { useState } from 'react';
import Scrollbar from '../base/Scrollbar.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { contenidoDeNivel, nombreConNumero } from '../../utils/arbolArchivos.js';
import { estiloArchivo } from '../../utils/archivos.js';
import { formatoTamano } from '../../utils/correos.js';
import { normalizarTexto } from '../../utils/puntos.js';
import '../../styles/widgets/ExploradorArchivos.css';

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

export default function ExploradorArchivos({
  clave = null,
  carpetas,
  filtroRaiz,
  tituloRaiz,
  placeholderBusqueda = 'Buscar',
  busquedaDeshabilitada = false,
  aviso = null,
  textoVacio,
  claveSeleccionada = null,
  onSeleccionar,
  onAbrirArchivo,
  puedeRenombrar = false,
  onRenombrarCarpeta,
  onRenombrarArchivo,
  accionFila,
  herramientas,
}) {
  const [posicion, setPosicion] = useState({ clave: null, ruta: [], busqueda: '' });
  const [renombrando, setRenombrando] = useState(null);
  const [textoNuevo, setTextoNuevo] = useState('');
  const [errorRenombrar, setErrorRenombrar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const ruta = posicion.clave === clave ? posicion.ruta : [];
  const busqueda = posicion.clave === clave ? posicion.busqueda : '';
  const buscando = busqueda.trim() !== '';
  const carpetasRaiz = filtroRaiz ? carpetas.filter(filtroRaiz) : carpetas;
  const carpeta = ruta.length ? carpetas.find((c) => c.id === ruta[0]) : null;
  const subruta = carpeta ? ruta.slice(1) : [];
  const nivel = carpeta ? contenidoDeNivel(carpeta, subruta) : null;
  const titulo = tituloRaiz;
  const conRenombrar = !!onRenombrarCarpeta || !!onRenombrarArchivo;

  function ir(nuevaRuta) {
    setRenombrando(null);
    onSeleccionar(null);
    setPosicion({ clave, ruta: nuevaRuta, busqueda: '' });
  }

  function buscar(texto) {
    setRenombrando(null);
    onSeleccionar(null);
    setPosicion({ clave, ruta, busqueda: texto });
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
      onSeleccionar(null);
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
      <span className="widget-explorador-archivos-edicion" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        {prefijo && <span className="widget-explorador-archivos-prefijo">{prefijo}</span>}
        <input
          className="widget-explorador-archivos-entrada"
          value={textoNuevo}
          autoFocus
          disabled={guardando}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setTextoNuevo(e.target.value)}
          onKeyDown={(e) => teclaRenombrar(e, clave, base, aplicar)}
          onBlur={() => { if (!guardando) setRenombrando(null); }}
          aria-label="Nuevo nombre"
        />
        {extension && <span className="widget-explorador-archivos-extension">{extension}</span>}
      </span>
    );
  }

  function celdaAccion(puntoId) {
    return <span className="widget-explorador-archivos-col-acciones">{accionFila ? accionFila(puntoId) : null}</span>;
  }

  const migas = [
    { clave: 'raiz', texto: titulo, alIr: () => ir([]) },
    ...(carpeta ? [{ clave: carpeta.id, texto: carpeta.nombre, alIr: () => ir([carpeta.id]) }] : []),
    ...subruta.map((segmento, i) => ({ clave: `${i}-${segmento}`, texto: segmento, alIr: () => ir([carpeta.id, ...subruta.slice(0, i + 1)]) })),
  ];

  const resultados = buscando ? buscarEnCarpetas(carpetasRaiz, busqueda.trim()) : null;

  const filasCarpetas = buscando
    ? resultados.carpetasEncontradas.map((r) => ({
      clave: r.clave, nombre: r.nombre, base: r.nombre, prefijo: '', origen: r.origen, cantidad: r.cantidad,
      puntoId: carpetasRaiz.find((c) => c.id === r.rutaDestino[0])?.puntoRef ?? null,
      tono: carpetasRaiz.find((c) => c.id === r.rutaDestino[0])?.tono,
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
        tono: carpeta.tono,
        ubicacion: [carpeta.nombre, ...subruta].join(' / '),
        alAbrir: () => ir([...ruta, sub.nombre]),
        renombrable: !!carpeta.renombrable && !!onRenombrarCarpeta,
        aplicar: (nuevo) => onRenombrarCarpeta(carpeta, rutaSub, nuevo),
      };
    })
    : carpetasRaiz.map((c) => ({
      clave: `c:${c.id}`, nombre: c.nombre, base: c.prefijo ? c.nombre.slice(c.prefijo.length) : c.nombre, prefijo: c.prefijo || '', cantidad: c.archivos.length,
      puntoId: c.puntoRef,
      tono: c.tono,
      origen: c.detalle,
      ubicacion: titulo,
      alAbrir: () => ir([c.id]),
      renombrable: !!c.renombrable && !!onRenombrarCarpeta,
      aplicar: (nuevo) => onRenombrarCarpeta(c, '', nuevo),
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
      renombrable: !archivo.autogenerado && !!onRenombrarArchivo,
      aplicar: (nuevo) => onRenombrarArchivo(entrada.puntoId, archivo.id, `${nuevo}${extension}`),
    };
  });
  const vacio = filasCarpetas.length === 0 && filasArchivos.length === 0;

  function seleccionarCarpeta(f) {
    onSeleccionar({ clave: f.clave, tipo: 'carpeta', nombre: f.nombre, icono: 'ri-folder-3-fill', tono: 'carpeta', cantidad: f.cantidad, ubicacion: f.ubicacion, puntoId: f.puntoId });
  }

  function seleccionarArchivo(f) {
    const { archivo } = f.entrada;
    onSeleccionar({
      clave: f.clave, tipo: 'archivo', nombre: nombreConNumero(archivo), icono: f.estilo.icono, tono: f.estilo.tono, extension: f.extension,
      tamano: archivo.tamano, fecha: archivo.creadoEn, puntoId: f.entrada.puntoId,
      ubicacion: f.entrada.origen || [carpeta?.nombre, ...subruta].filter(Boolean).join(' / '),
    });
  }

  const filaSeleccionada = claveSeleccionada
    ? filasCarpetas.find((f) => f.clave === claveSeleccionada) || filasArchivos.find((f) => f.clave === claveSeleccionada)
    : null;
  const puedeRenombrarSeleccion = puedeRenombrar && !buscando && !!filaSeleccionada && filaSeleccionada.renombrable && renombrando === null;

  return (
    <div className="widget-explorador-archivos" tabIndex={-1} onKeyDown={teclaNavegador}>
      <div className="widget-explorador-archivos-barra">
        <div className="widget-explorador-archivos-migas">
          {migas.map((m, i) => (
            <span key={m.clave} className="widget-explorador-archivos-miga-envoltorio">
              {i > 0 && <i className="ri-arrow-right-s-line widget-explorador-archivos-separador"></i>}
              <button
                type="button"
                className={'widget-explorador-archivos-miga' + (i === migas.length - 1 ? ' widget-explorador-archivos-miga-actual' : '')}
                onClick={m.alIr}
                disabled={i === migas.length - 1}
              >
                {m.texto}
              </button>
            </span>
          ))}
        </div>
        <div className="widget-explorador-archivos-busqueda">
          <i className="ri-search-line"></i>
          <input
            className="widget-explorador-archivos-busqueda-entrada"
            value={busqueda}
            placeholder={placeholderBusqueda}
            disabled={busquedaDeshabilitada}
            onChange={(e) => buscar(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') buscar(''); }}
            aria-label={placeholderBusqueda}
          />
          {busqueda && (
            <button type="button" className="widget-explorador-archivos-busqueda-limpiar" onClick={() => buscar('')} aria-label="Limpiar búsqueda" title="Limpiar búsqueda">
              <i className="ri-close-line"></i>
            </button>
          )}
        </div>
      </div>
      <div className="widget-explorador-archivos-herramientas">
        <BotonIcono icono="ri-arrow-up-line" ariaLabel="Subir un nivel" onClick={subir} disabled={!buscando && ruta.length === 0} />
        {conRenombrar && (
          <BotonIcono
            icono="ri-pencil-line"
            ariaLabel="Renombrar"
            onClick={() => filaSeleccionada && empezarRenombrar(filaSeleccionada.clave, filaSeleccionada.base)}
            disabled={!puedeRenombrarSeleccion}
          />
        )}
        <span className="widget-explorador-archivos-herramientas-espacio"></span>
        {herramientas}
      </div>

      <div className="widget-explorador-archivos-encabezado">
        <span className="widget-explorador-archivos-col-nombre">Nombre</span>
        <span className="widget-explorador-archivos-col-fecha">Fecha</span>
        <span className="widget-explorador-archivos-col-tamano">Tamaño</span>
        <span className="widget-explorador-archivos-col-acciones"></span>
      </div>

      <div className="widget-explorador-archivos-cuerpo" onClick={() => onSeleccionar(null)}>
        <Scrollbar>
          {aviso && <div className="widget-explorador-archivos-vacio">{aviso}</div>}
          {!aviso && vacio && <div className="widget-explorador-archivos-vacio">{textoVacio ? textoVacio({ buscando, busqueda: busqueda.trim(), enCarpeta: !!carpeta }) : buscando ? `Sin resultados para «${busqueda.trim()}».` : 'Esta carpeta está vacía.'}</div>}

          {!aviso && filasCarpetas.map((f) => {
            const editando = renombrando === f.clave;
            const vacia = f.cantidad === 0 && !f.tono;
            return (
              <div
                key={f.clave}
                className={'widget-explorador-archivos-fila' + (f.clave === claveSeleccionada ? ' widget-explorador-archivos-fila-seleccionada' : '') + (vacia ? ' widget-explorador-archivos-fila-vacia' : '') + (f.tono ? ` widget-explorador-archivos-carpeta-${f.tono}` : '')}
                onClick={(e) => { e.stopPropagation(); if (!editando && !vacia) seleccionarCarpeta(f); }}
                onDoubleClick={() => { if (!editando && !vacia) f.alAbrir(); }}
                role="button"
                aria-disabled={vacia}
                tabIndex={vacia ? -1 : 0}
                onKeyDown={(e) => { if (e.key === 'Enter' && !editando && !vacia) f.alAbrir(); }}
              >
                <span className="widget-explorador-archivos-col-nombre">
                  <i className="ri-folder-3-fill widget-explorador-archivos-icono-carpeta"></i>
                  {editando ? campoEdicion(f.clave, f.base, f.prefijo, '', f.aplicar) : <span className="widget-explorador-archivos-nombre">{f.nombre}</span>}
                  {f.origen && <span className="widget-explorador-archivos-origen" title={f.origen}>{f.origen}</span>}
                </span>
                <span className="widget-explorador-archivos-col-fecha"></span>
                <span className="widget-explorador-archivos-col-tamano">{f.cantidad} {f.cantidad === 1 ? 'elemento' : 'elementos'}</span>
                {celdaAccion(f.puntoId)}
              </div>
            );
          })}

          {!aviso && filasArchivos.map((f) => {
            const { archivo } = f.entrada;
            const editando = renombrando === f.clave;
            return (
              <div
                key={archivo.id}
                className={'widget-explorador-archivos-fila' + (f.clave === claveSeleccionada ? ' widget-explorador-archivos-fila-seleccionada' : '')}
                onClick={(e) => { e.stopPropagation(); if (!editando) seleccionarArchivo(f); }}
                onDoubleClick={() => { if (!editando) onAbrirArchivo(archivo); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' && !editando) onAbrirArchivo(archivo); }}
              >
                <span className="widget-explorador-archivos-col-nombre">
                  <i className={`${f.estilo.icono} widget-explorador-archivos-icono widget-explorador-archivos-icono-${f.estilo.tono}`}></i>
                  {editando ? campoEdicion(f.clave, f.base, f.prefijo, f.extension, f.aplicar) : (
                    <span className="widget-explorador-archivos-nombre" title={nombreConNumero(archivo)}>{nombreConNumero(archivo)}</span>
                  )}
                  {f.entrada.origen && <span className="widget-explorador-archivos-origen" title={f.entrada.origen}>{f.entrada.origen}</span>}
                </span>
                <span className="widget-explorador-archivos-col-fecha">{fechaCorta(archivo.creadoEn)}</span>
                <span className="widget-explorador-archivos-col-tamano">{archivo.tamano ? formatoTamano(archivo.tamano) : '—'}</span>
                {celdaAccion(f.entrada.puntoId)}
              </div>
            );
          })}
        </Scrollbar>
      </div>

      <Modal abierto={!!errorRenombrar} titulo="Renombrar archivo" onCerrar={() => setErrorRenombrar(null)}>
        <p className="widget-explorador-archivos-mensaje">{errorRenombrar}</p>
        <div className="widget-explorador-archivos-modal-acciones">
          <BotonS variant="claro" onClick={() => setErrorRenombrar(null)}>Cerrar</BotonS>
        </div>
      </Modal>
    </div>
  );
}
