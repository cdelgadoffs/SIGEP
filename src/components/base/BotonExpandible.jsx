import { Fragment, useEffect, useRef, useState } from 'react';
import '../../styles/base/BotonExpandible.css';

export default function BotonExpandible({ icono, ariaLabel, opciones, onSeleccionar, textoVacio = 'Sin opciones.' }) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const botonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    function cerrarSiFuera(e) {
      if (menuRef.current?.contains(e.target) || botonRef.current?.contains(e.target)) return;
      setAbierto(false);
    }
    function cerrarConEsc(e) {
      if (e.key === 'Escape') setAbierto(false);
    }
    function cerrarPorScrollOResize(e) {
      if (menuRef.current?.contains(e.target)) return;
      setAbierto(false);
    }
    document.addEventListener('mousedown', cerrarSiFuera);
    document.addEventListener('keydown', cerrarConEsc);
    window.addEventListener('scroll', cerrarPorScrollOResize, true);
    window.addEventListener('resize', cerrarPorScrollOResize);
    return () => {
      document.removeEventListener('mousedown', cerrarSiFuera);
      document.removeEventListener('keydown', cerrarConEsc);
      window.removeEventListener('scroll', cerrarPorScrollOResize, true);
      window.removeEventListener('resize', cerrarPorScrollOResize);
    };
  }, [abierto]);

  function alternar() {
    if (!abierto && botonRef.current) {
      const rect = botonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: document.documentElement.clientWidth - rect.right });
    }
    setAbierto((v) => !v);
  }

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        className={'base-boton-expandible' + (abierto ? ' base-boton-expandible-abierto' : '')}
        aria-label={ariaLabel}
        title={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={alternar}
      >
        <i className={icono}></i>
      </button>
      {abierto && (
        <div ref={menuRef} className="base-boton-expandible-menu" role="menu" style={{ top: pos.top, right: pos.right }}>
          {opciones.length === 0 && <div className="base-boton-expandible-vacio">{textoVacio}</div>}
          {opciones.map((op, i) => (
            <Fragment key={op.id}>
              {op.grupo && op.grupo !== opciones[i - 1]?.grupo && (
                <div className="base-boton-expandible-grupo" role="presentation">{op.grupo}</div>
              )}
              <div
                role="menuitem"
                className="base-boton-expandible-item"
                onClick={() => onSeleccionar(op.id)}
              >
                {op.icono && <i className={op.icono}></i>}
                <span>{op.label}</span>
              </div>
            </Fragment>
          ))}
        </div>
      )}
    </>
  );
}
