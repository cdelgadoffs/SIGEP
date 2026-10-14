import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/base/ListaExpandible.css';

export default function ListaExpandible({ valorActual, etiquetaActual, opciones, onSeleccionar, unaLinea = false, alinearDerecha = false }) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, right: 0, width: 0, maxAncho: 0 });
  const botonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function manejarClickFuera(e) {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        botonRef.current && !botonRef.current.contains(e.target)
      ) setAbierto(false);
    }
    document.addEventListener('mousedown', manejarClickFuera);
    return () => document.removeEventListener('mousedown', manejarClickFuera);
  }, []);

  useEffect(() => {
    if (!abierto) return;
    function cerrarPorScrollOResize(e) {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setAbierto(false);
    }
    window.addEventListener('scroll', cerrarPorScrollOResize, true);
    window.addEventListener('resize', cerrarPorScrollOResize);
    return () => {
      window.removeEventListener('scroll', cerrarPorScrollOResize, true);
      window.removeEventListener('resize', cerrarPorScrollOResize);
    };
  }, [abierto]);

  function toggle() {
    if (!abierto && botonRef.current) {
      const rect = botonRef.current.getBoundingClientRect();
      const anchoVentana = document.documentElement.clientWidth;
      setPos({
        top: rect.bottom + 6,
        left: rect.left,
        right: anchoVentana - rect.right,
        width: rect.width,
        maxAncho: (alinearDerecha ? rect.right : anchoVentana - rect.left) - 12,
      });
    }
    setAbierto((v) => !v);
  }

  return (
    <>
      <div
        ref={botonRef}
        className={'base-lista-expandible-toggle' + (abierto ? ' base-lista-expandible-toggle-abierto' : '')}
        onClick={toggle}
      >
        {etiquetaActual}
        <span className="base-lista-expandible-chevron">▾</span>
      </div>
      {abierto && createPortal(
        <div
          ref={menuRef}
          className={'base-lista-expandible-menu' + (unaLinea ? ' base-lista-expandible-menu-una-linea' : '')}
          style={{ top: pos.top, ...(alinearDerecha ? { right: pos.right } : { left: pos.left }), minWidth: pos.width, ...(unaLinea ? { maxWidth: pos.maxAncho } : null) }}
        >
          {opciones.map((op) => (
            <div
              key={op.id}
              className={'base-lista-expandible-item' + (op.id === valorActual ? ' base-lista-expandible-item-activo' : '')}
              title={op.title}
              onClick={() => { onSeleccionar(op.id); setAbierto(false); }}
            >
              {op.label}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
