import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useScrollbarPersonalizada } from '../../hooks/useScrollbarPersonalizada.js';
import '../../styles/base/CampoAutocompletar.css';

function ListaSugerencias({ children }) {
  const { contenedorRef, thumb, onScroll, onArrastrarThumb } = useScrollbarPersonalizada();
  return (
    <>
      <div className="base-campo-autocompletar-scroll" ref={contenedorRef} onScroll={onScroll}>{children}</div>
      {thumb.visible && (
        <div
          className="base-campo-autocompletar-thumb"
          style={{ height: thumb.alto, top: thumb.top }}
          onMouseDown={onArrastrarThumb}
        />
      )}
    </>
  );
}

export default function CampoAutocompletar({ texto, onCambiarTexto, opciones, onSeleccionar, valorActual, placeholder, textoVacio = 'Sin coincidencias', error, ariaLabel }) {
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    function manejarClickFuera(e) {
      if (menuRef.current?.contains(e.target) || inputRef.current?.contains(e.target)) return;
      setAbierto(false);
    }
    function cerrarPorScrollOResize(e) {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setAbierto(false);
    }
    document.addEventListener('mousedown', manejarClickFuera);
    window.addEventListener('scroll', cerrarPorScrollOResize, true);
    window.addEventListener('resize', cerrarPorScrollOResize);
    return () => {
      document.removeEventListener('mousedown', manejarClickFuera);
      window.removeEventListener('scroll', cerrarPorScrollOResize, true);
      window.removeEventListener('resize', cerrarPorScrollOResize);
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto || !menuRef.current) return;
    menuRef.current.querySelector('.base-campo-autocompletar-item-activo')?.scrollIntoView({ block: 'nearest' });
  }, [activo, abierto]);

  function abrir() {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setAbierto(true);
  }

  function elegir(op) {
    onSeleccionar(op.id);
    setAbierto(false);
  }

  function alEscribir(valor) {
    onCambiarTexto(valor);
    setActivo(0);
    abrir();
  }

  function alPulsar(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!abierto) { abrir(); return; }
      setActivo((i) => Math.min(i + 1, opciones.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      if (!abierto || !opciones[activo]) return;
      e.preventDefault();
      elegir(opciones[activo]);
    } else if (e.key === 'Escape' && abierto) {
      e.stopPropagation();
      setAbierto(false);
    } else if (e.key === 'Tab') {
      setAbierto(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        className={'base-campo-autocompletar' + (error ? ' base-campo-autocompletar-error' : '')}
        value={texto}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        onChange={(e) => alEscribir(e.target.value)}
        onFocus={(e) => { e.target.select(); setActivo(0); abrir(); }}
        onClick={() => { if (!abierto) abrir(); }}
        onKeyDown={alPulsar}
      />
      {error && <div className="base-campo-autocompletar-mensaje">{error}</div>}
      {abierto && createPortal(
        <div ref={menuRef} className="base-campo-autocompletar-menu" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          <ListaSugerencias>
          {opciones.length === 0 && <div className="base-campo-autocompletar-vacio">{textoVacio}</div>}
          {opciones.map((op, i) => (
            <div
              key={op.id}
              className={'base-campo-autocompletar-item'
                + (i === activo ? ' base-campo-autocompletar-item-activo' : '')
                + (op.id === valorActual ? ' base-campo-autocompletar-item-elegido' : '')}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActivo(i)}
              onClick={() => elegir(op)}
            >
              <span className="base-campo-autocompletar-label">{op.label}</span>
              {op.detalle && <span className="base-campo-autocompletar-detalle">{op.detalle}</span>}
            </div>
          ))}
          </ListaSugerencias>
        </div>,
        document.body
      )}
    </>
  );
}
