import { useScrollbarPersonalizada } from '../../hooks/useScrollbarPersonalizada.js';
import '../../styles/base/Sidebar5.css';

export default function Sidebar5({ abierto = false, ancho = false, amplio = false, claro = false, arriba = 52, accionesHeader, onCerrar, mostrarCerrar = true, children }) {
  const { contenedorRef, thumb, onScroll, onArrastrarThumb } = useScrollbarPersonalizada();
  return (
    <aside
      className={'base-sidebar5' + (abierto ? ' base-sidebar5-open' : '') + (ancho ? ' base-sidebar5-ancho' : '') + (amplio ? ' base-sidebar5-amplio' : '') + (claro ? ' base-sidebar5-claro' : '')}
      style={{ top: arriba, height: `calc(100vh - ${arriba}px)` }}
    >
      <div className="base-sidebar5-header">
        <div className="base-sidebar5-header-top">
          <div className="base-sidebar5-title">Panel de control</div>
          <div className="base-sidebar5-header-acciones">
            {accionesHeader}
            {mostrarCerrar && (
              <button type="button" className="base-sidebar5-cerrar" aria-label="Cerrar panel" onClick={onCerrar}>✕</button>
            )}
          </div>
        </div>
      </div>
      <div className="base-sidebar5-nav-wrap">
        <nav className="base-sidebar5-nav" ref={contenedorRef} onScroll={onScroll}>{children}</nav>
        {thumb.visible && (
          <div
            className="base-sidebar5-scrollbar-thumb"
            style={{ height: thumb.alto, top: thumb.top }}
            onMouseDown={onArrastrarThumb}
          />
        )}
      </div>
    </aside>
  );
}
