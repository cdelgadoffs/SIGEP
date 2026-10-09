import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Modal from '../base/Modal.jsx';
import BotonS from '../base/BotonS.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { guardarEnDisco, tipoDeVistaPrevia } from '../../utils/archivos.js';
import '../../styles/widgets/VisorArchivo.css';

const SIN_CARGAR = { id: null, error: null, archivo: null, url: null, texto: '' };

export default function VisorArchivo() {
  const { puedeDescargar } = useAuth();
  const { archivoEnVista, cerrarVistaArchivo } = useUI();
  const { descargarArchivo } = useProyecto();
  const [estado, setEstado] = useState(SIN_CARGAR);
  const contenedorWord = useRef(null);

  const idEnVista = archivoEnVista?.id;
  const puedeBajar = puedeDescargar && !archivoEnVista?.soloLectura;
  const cargado = estado.id === idEnVista ? estado : SIN_CARGAR;
  const cargando = !!idEnVista && cargado.id === null;
  const vista = cargado.archivo ? tipoDeVistaPrevia(cargado.archivo.nombre, cargado.archivo.tipo) : null;

  useEffect(() => {
    if (!idEnVista) return undefined;
    let vigente = true;
    let urlActual = null;
    descargarArchivo(idEnVista)
      .then(async (archivo) => {
        const tipoVista = tipoDeVistaPrevia(archivo.nombre, archivo.tipo);
        if (tipoVista === 'imagen' || tipoVista === 'pdf') urlActual = URL.createObjectURL(archivo.blob);
        const texto = tipoVista === 'texto' ? await archivo.blob.text() : '';
        if (vigente) setEstado({ id: idEnVista, error: null, archivo, url: urlActual, texto });
      })
      .catch((e) => {
        if (vigente) setEstado({ ...SIN_CARGAR, id: idEnVista, error: e.mensaje || e.message || 'No se pudo abrir el archivo.' });
      });
    return () => {
      vigente = false;
      if (urlActual) URL.revokeObjectURL(urlActual);
    };
  }, [idEnVista, descargarArchivo]);

  useEffect(() => {
    if (vista !== 'word' || !cargado.archivo || !contenedorWord.current) return undefined;
    let vigente = true;
    const contenedor = contenedorWord.current;
    contenedor.innerHTML = '';
    import('docx-preview')
      .then(({ renderAsync }) => renderAsync(cargado.archivo.blob, contenedor, undefined, {
        className: 'docx-preview',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        breakPages: true,
      }))
      .catch(() => {
        if (vigente) setEstado((e) => ({ ...e, error: 'No se pudo generar la vista previa de este documento Word.' }));
      });
    return () => {
      vigente = false;
      contenedor.innerHTML = '';
    };
  }, [vista, cargado.archivo]);

  function descargar() {
    if (cargado.archivo) guardarEnDisco(cargado.archivo.nombre, cargado.archivo.blob);
  }

  function contenido() {
    if (cargando) return <p className="widget-visor-archivo-mensaje">Cargando…</p>;
    if (cargado.error) return <p className="widget-visor-archivo-mensaje widget-visor-archivo-error">{cargado.error}</p>;
    if (!cargado.archivo) return null;
    if (vista === 'imagen') return <img className="widget-visor-archivo-imagen" src={cargado.url} alt={cargado.archivo.nombre} />;
    if (vista === 'pdf') return <embed className="widget-visor-archivo-pdf" src={`${cargado.url}#toolbar=0&navpanes=0`} type="application/pdf" />;
    if (vista === 'texto') return <pre className="widget-visor-archivo-texto">{cargado.texto}</pre>;
    if (vista === 'word') return <div className="widget-visor-archivo-word" ref={contenedorWord}></div>;
    return <p className="widget-visor-archivo-mensaje">No se puede mostrar vista previa de este tipo de archivo ({cargado.archivo.tipo || 'desconocido'}).{puedeBajar ? ' Puedes descargarlo.' : ''}</p>;
  }

  return (
    <Modal
      abierto={!!archivoEnVista}
      titulo={archivoEnVista?.nombre}
      onCerrar={cerrarVistaArchivo}
      tamano={vista === 'word' || vista === 'pdf' ? 'documento' : vista ? 'completo' : 'normal'}
      acciones={cargado.archivo && puedeBajar && <BotonS variant="claro" onClick={descargar}>Descargar</BotonS>}
    >
      <div className="widget-visor-archivo">{contenido()}</div>
    </Modal>
  );
}
