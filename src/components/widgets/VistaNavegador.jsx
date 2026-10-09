import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import Scrollbar from '../base/Scrollbar.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { carpetasDeSesion, contenidoDeNivel, nombreConNumero } from '../../utils/arbolArchivos.js';
import { estiloArchivo } from '../../utils/archivos.js';
import { formatoTamano } from '../../utils/correos.js';
import { encabezadoSesion } from '../../utils/sesiones.js';
import '../../styles/widgets/VistaNavegador.css';

function partirNombre(nombre) {
  const punto = nombre.lastIndexOf('.');
  return punto > 0 ? { base: nombre.slice(0, punto), extension: nombre.slice(punto) } : { base: nombre, extension: '' };
}

function fechaCorta(iso) {
  return iso ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export default function VistaNavegador() {
  const { puedeEscribir } = useAuth();
  const { sesionSeleccionada, PUNTOS, listaCerrada, cargando, error, renombrarArchivo, renombrarCarpeta } = useProyecto();
  const { abrirVistaArchivo } = useUI();
  const [posicion, setPosicion] = useState({ sesionId: null, ruta: [] });
  const [renombrando, setRenombrando] = useState(null);
  const [textoNuevo, setTextoNuevo] = useState('');
  const [errorRenombrar, setErrorRenombrar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const sesionId = sesionSeleccionada?.id ?? null;
  const ruta = posicion.sesionId === sesionId ? posicion.ruta : [];
  const carpetas = carpetasDeSesion(PUNTOS, listaCerrada);
  const carpeta = ruta.length ? carpetas.find((c) => c.id === ruta[0]) : null;
  const subruta = carpeta ? ruta.slice(1) : [];
  const nivel = carpeta ? contenidoDeNivel(carpeta, subruta) : null;
  const puedeRenombrar = puedeEscribir && !!sesionSeleccionada && sesionSeleccionada.estado !== 'celebrada' && sesionSeleccionada.estado !== 'no-celebrada';
  const titulo = encabezadoSesion(sesionSeleccionada).titulo;

  function ir(nuevaRuta) {
    setRenombrando(null);
    setPosicion({ sesionId, ruta: nuevaRuta });
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

  const migas = [
    { clave: 'raiz', texto: titulo, alIr: () => ir([]) },
    ...(carpeta ? [{ clave: carpeta.id, texto: carpeta.nombre, alIr: () => ir([carpeta.id]) }] : []),
    ...subruta.map((segmento, i) => ({ clave: `${i}-${segmento}`, texto: segmento, alIr: () => ir([carpeta.id, ...subruta.slice(0, i + 1)]) })),
  ];

  const filasCarpetas = carpeta
    ? nivel.subcarpetas.map((sub) => {
      const rutaSub = [...subruta, sub.nombre].join('/');
      return {
        clave: `c:${rutaSub}`, nombre: sub.nombre, base: sub.nombre, prefijo: '', cantidad: sub.cantidad,
        alAbrir: () => ir([...ruta, sub.nombre]),
        renombrable: !!carpeta.renombrable,
        aplicar: (nuevo) => renombrarCarpeta(carpeta.puntoId, rutaSub, nuevo),
      };
    })
    : carpetas.map((c) => ({
      clave: `c:${c.id}`, nombre: c.nombre, base: c.prefijo ? c.nombre.slice(c.prefijo.length) : c.nombre, prefijo: c.prefijo || '', cantidad: c.archivos.length,
      alAbrir: () => ir([c.id]),
      renombrable: !!c.renombrable,
      aplicar: (nuevo) => renombrarCarpeta(c.puntoId, '', nuevo),
    }));
  const filasArchivos = nivel ? nivel.archivos : [];
  const vacio = filasCarpetas.length === 0 && filasArchivos.length === 0;

  return (
    <div className="widget-vista-navegador">
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

      <div className="widget-vista-navegador-encabezado">
        <span className="widget-vista-navegador-col-nombre">Nombre</span>
        <span className="widget-vista-navegador-col-fecha">Fecha</span>
        <span className="widget-vista-navegador-col-tamano">Tamaño</span>
        <span className="widget-vista-navegador-col-acciones"></span>
      </div>

      <div className="widget-vista-navegador-cuerpo">
        <Scrollbar>
          {!sesionSeleccionada && <div className="widget-vista-navegador-vacio">Selecciona una sesión para ver sus archivos.</div>}
          {sesionSeleccionada && cargando && PUNTOS.length === 0 && <div className="widget-vista-navegador-vacio">Cargando…</div>}
          {sesionSeleccionada && error && PUNTOS.length === 0 && <div className="widget-vista-navegador-vacio">No se pudieron cargar los archivos.</div>}
          {sesionSeleccionada && !cargando && !error && vacio && <div className="widget-vista-navegador-vacio">{carpeta ? 'Esta carpeta está vacía.' : 'Esta sesión aún no tiene archivos.'}</div>}

          {filasCarpetas.map((f) => {
            const editando = renombrando === f.clave;
            return (
              <div key={f.clave} className="widget-vista-navegador-fila" onClick={() => { if (!editando) f.alAbrir(); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' && !editando) f.alAbrir(); }}>
                <span className="widget-vista-navegador-col-nombre">
                  <i className="ri-folder-3-fill widget-vista-navegador-icono-carpeta"></i>
                  {editando ? campoEdicion(f.clave, f.base, f.prefijo, '', f.aplicar) : <span className="widget-vista-navegador-nombre">{f.nombre}</span>}
                </span>
                <span className="widget-vista-navegador-col-fecha"></span>
                <span className="widget-vista-navegador-col-tamano">{f.cantidad} {f.cantidad === 1 ? 'elemento' : 'elementos'}</span>
                <span className="widget-vista-navegador-col-acciones" onClick={(e) => e.stopPropagation()}>
                  {puedeRenombrar && f.renombrable && !editando && (
                    <BotonIcono icono="ri-pencil-line" ariaLabel="Renombrar carpeta" onClick={() => empezarRenombrar(f.clave, f.base)} />
                  )}
                </span>
              </div>
            );
          })}

          {filasArchivos.map((entrada) => {
            const { archivo } = entrada;
            const estilo = estiloArchivo(archivo.nombre);
            const claveArchivo = `a:${archivo.id}`;
            const editando = renombrando === claveArchivo;
            const aplicarArchivo = (nuevo) => renombrarArchivo(entrada.puntoId, archivo.id, `${nuevo}${partirNombre(archivo.nombre).extension}`);
            const { base, extension } = partirNombre(archivo.nombre);
            const prefijo = nombreConNumero(archivo).slice(0, nombreConNumero(archivo).length - archivo.nombre.length);
            return (
              <div
                key={archivo.id}
                className="widget-vista-navegador-fila"
                onClick={() => { if (!editando) abrirVistaArchivo(archivo); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' && !editando) abrirVistaArchivo(archivo); }}
              >
                <span className="widget-vista-navegador-col-nombre">
                  <i className={`${estilo.icono} widget-vista-navegador-icono widget-vista-navegador-icono-${estilo.tono}`}></i>
                  {editando ? campoEdicion(claveArchivo, base, prefijo, extension, aplicarArchivo) : (
                    <span className="widget-vista-navegador-nombre" title={`${prefijo}${base}${extension}`}>{nombreConNumero(archivo)}</span>
                  )}
                </span>
                <span className="widget-vista-navegador-col-fecha">{fechaCorta(archivo.creadoEn)}</span>
                <span className="widget-vista-navegador-col-tamano">{archivo.tamano ? formatoTamano(archivo.tamano) : '—'}</span>
                <span className="widget-vista-navegador-col-acciones" onClick={(e) => e.stopPropagation()}>
                  {puedeRenombrar && !archivo.autogenerado && !editando && (
                    <BotonIcono icono="ri-pencil-line" ariaLabel="Renombrar archivo" onClick={() => empezarRenombrar(claveArchivo, base)} />
                  )}
                </span>
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
