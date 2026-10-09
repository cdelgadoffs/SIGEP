import { useRef, useState } from 'react';
import BotonS from '../base/BotonS.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import { entradasDeArrastre, entradasDeLista, separarPermitidos } from '../../utils/archivos.js';
import '../../styles/widgets/SelectorArchivos.css';

export default function SelectorArchivos({ onSeleccionar, onAviso, compacto = false, arrastrar = false, botones = true, carpetas = true, disabled = false }) {
  const entradaArchivos = useRef(null);
  const entradaCarpeta = useRef(null);
  const [encima, setEncima] = useState(false);

  function entregar(entradas) {
    if (entradas.length === 0) return;
    const { validas, omitidos } = separarPermitidos(entradas);
    if (omitidos.length > 0 && onAviso) {
      onAviso(`Se omitieron ${omitidos.length} archivo${omitidos.length === 1 ? '' : 's'} de un tipo no permitido: ${omitidos.join(', ')}.`);
    }
    if (validas.length > 0) onSeleccionar(validas);
  }

  function elegir(e) {
    const entradas = entradasDeLista(e.target.files);
    e.target.value = '';
    entregar(entradas);
  }

  async function soltar(e) {
    e.preventDefault();
    setEncima(false);
    if (disabled) return;
    entregar(await entradasDeArrastre(e.dataTransfer));
  }

  const entradas = (
    <>
      <input ref={entradaArchivos} type="file" multiple hidden onChange={elegir} />
      {carpetas && <input ref={entradaCarpeta} type="file" multiple hidden webkitdirectory="" directory="" onChange={elegir} />}
    </>
  );

  if (compacto) {
    return (
      <>
        <BotonIcono icono="ri-attachment-2" ariaLabel="Adjuntar archivos" disabled={disabled} onClick={() => entradaArchivos.current.click()} />
        {carpetas && <BotonIcono icono="ri-folder-add-line" ariaLabel="Adjuntar carpeta" disabled={disabled} onClick={() => entradaCarpeta.current.click()} />}
        {entradas}
      </>
    );
  }

  return (
    <div className="widget-selector-archivos">
      {botones && (
      <div className="widget-selector-archivos-botones">
        <BotonS variant="claro" disabled={disabled} onClick={() => entradaArchivos.current.click()}>Archivos</BotonS>
        <BotonS variant="claro" disabled={disabled} onClick={() => entradaCarpeta.current.click()}>Carpeta</BotonS>
      </div>
      )}
      {arrastrar && (
        <div
          className={'widget-selector-archivos-zona' + (botones ? '' : ' widget-selector-archivos-zona-grande') + (encima ? ' widget-selector-archivos-zona-encima' : '')}
          role="button"
          tabIndex={0}
          onClick={() => !disabled && entradaArchivos.current.click()}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) { e.preventDefault(); entradaArchivos.current.click(); } }}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setEncima(true); }}
          onDragLeave={() => setEncima(false)}
          onDrop={soltar}
        >
          Arrastra aquí archivos o carpetas, o haz clic para elegir archivos
        </div>
      )}
      {entradas}
    </div>
  );
}
