import { useEffect, useState } from 'react';
import BotonIcono from '../base/BotonIcono.jsx';
import '../../styles/widgets/BarraHerramientasTexto.css';

const TABLA_MAX_FILAS = 8;
const TABLA_MAX_COLS = 10;

export default function BarraHerramientasTexto({ obtenerEditor, onError }) {
  const [tablaAbierta, setTablaAbierta] = useState(false);
  const [tablaHover, setTablaHover] = useState({ filas: 0, cols: 0 });

  useEffect(() => {
    if (!tablaAbierta) return;
    function cerrar(e) {
      if (!e.target.closest('.widget-barra-texto-tabla-envoltorio')) setTablaAbierta(false);
    }
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [tablaAbierta]);

  const cadena = () => obtenerEditor()?.chain().focus();

  async function copiarSeleccion() {
    const editor = obtenerEditor();
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const texto = from === to ? editor.getText() : editor.state.doc.textBetween(from, to, '\n');
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      onError('No se pudo copiar al portapapeles.');
    }
  }

  async function pegarPortapapeles() {
    const editor = obtenerEditor();
    if (!editor) return;
    try {
      const texto = await navigator.clipboard.readText();
      if (texto) editor.chain().focus().insertContent(texto).run();
    } catch {
      onError('No se pudo pegar desde el portapapeles.');
    }
  }

  function capitalizarSeleccion() {
    const editor = obtenerEditor();
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const texto = editor.state.doc.textBetween(from, to, ' ');
    if (!texto.trim()) return;
    const capitalizado = texto.replace(/\S+/g, (p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
    editor.chain().focus().insertContentAt({ from, to }, capitalizado).run();
  }

  function cambiarTamano(delta) {
    const editor = obtenerEditor();
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const actual = editor.getAttributes('fontSize').size;
    const tamano = actual ? parseFloat(actual) : 13;
    const nuevo = Math.min(72, Math.max(8, Math.round(tamano + delta)));
    editor.chain().focus().setMark('fontSize', { size: `${nuevo}px` }).run();
  }

  function insertarTabla(filas, cols) {
    setTablaAbierta(false);
    cadena()?.insertTable({ rows: filas, cols, withHeaderRow: true }).run();
  }

  return (
    <>
      <span className="widget-barra-texto-separador"></span>
      <BotonIcono icono="ri-file-copy-line" ariaLabel="Copiar" sinRobarFoco onClick={copiarSeleccion} />
      <BotonIcono icono="ri-clipboard-line" ariaLabel="Pegar" sinRobarFoco onClick={pegarPortapapeles} />
      <div className="widget-barra-texto-tabla-envoltorio">
        <BotonIcono
          icono="ri-table-line"
          ariaLabel="Insertar tabla"
          sinRobarFoco
          onClick={() => { setTablaHover({ filas: 0, cols: 0 }); setTablaAbierta((abierta) => !abierta); }}
        />
        {tablaAbierta && (
          <div className="widget-barra-texto-tabla" onMouseLeave={() => setTablaHover({ filas: 0, cols: 0 })}>
            <div className="widget-barra-texto-tabla-rejilla">
              {Array.from({ length: TABLA_MAX_FILAS }).map((_, f) => (
                <div key={f} className="widget-barra-texto-tabla-fila">
                  {Array.from({ length: TABLA_MAX_COLS }).map((__, c) => (
                    <div
                      key={c}
                      className={'widget-barra-texto-tabla-celda' + (f < tablaHover.filas && c < tablaHover.cols ? ' widget-barra-texto-tabla-celda-activa' : '')}
                      onMouseEnter={() => setTablaHover({ filas: f + 1, cols: c + 1 })}
                      onMouseDown={(e) => { e.preventDefault(); insertarTabla(f + 1, c + 1); }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="widget-barra-texto-tabla-etiqueta">
              {tablaHover.filas > 0 ? `${tablaHover.filas} x ${tablaHover.cols}` : 'Selecciona tamaño'}
            </div>
          </div>
        )}
      </div>
      <span className="widget-barra-texto-separador"></span>
      <BotonIcono icono="ri-bold" ariaLabel="Negrita" sinRobarFoco onClick={() => cadena()?.toggleBold().run()} />
      <BotonIcono icono="ri-italic" ariaLabel="Itálica" sinRobarFoco onClick={() => cadena()?.toggleItalic().run()} />
      <BotonIcono icono="ri-list-ordered" ariaLabel="Viñeta numérica" sinRobarFoco onClick={() => cadena()?.toggleOrderedList().run()} />
      <BotonIcono ariaLabel="Capitalizar selección" sinRobarFoco onClick={capitalizarSeleccion}>Aa</BotonIcono>
      <BotonIcono ariaLabel="Aumentar tamaño de fuente" sinRobarFoco onClick={() => cambiarTamano(2)}>A<sup>+</sup></BotonIcono>
      <BotonIcono ariaLabel="Disminuir tamaño de fuente" sinRobarFoco onClick={() => cambiarTamano(-2)}>A<sup>-</sup></BotonIcono>
      <span className="widget-barra-texto-separador"></span>
      <BotonIcono icono="ri-align-left" ariaLabel="Alinear a la izquierda" sinRobarFoco onClick={() => cadena()?.setTextAlign('left').run()} />
      <BotonIcono icono="ri-align-center" ariaLabel="Centrar" sinRobarFoco onClick={() => cadena()?.setTextAlign('center').run()} />
      <BotonIcono icono="ri-align-right" ariaLabel="Alinear a la derecha" sinRobarFoco onClick={() => cadena()?.setTextAlign('right').run()} />
    </>
  );
}
