import { useScrollbarPersonalizada } from '../../hooks/useScrollbarPersonalizada.js';
import '../../styles/base/Sidebar6.css';

export default function Sidebar6({ abierto = false, izquierda = 0, arriba = 52, titulo, subtitulo, onCerrar, mostrarCerrar = true, children }) {
  const { contenedorRef, thumb, onScroll, onArrastrarThumb } = useScrollbarPersonalizada();
  return (
    <aside
      className={'base-sidebar6' + (abierto ? '' : ' base-sidebar6-oculto')}
      style={{ left: izquierda, top: arriba, height: `calc(100vh - ${arriba}px)` }}
    >
      <div className="base-sidebar6-header">
        <div className="base-sidebar6-header-top">
          <div>
            <div className="base-sidebar6-titulo">{titulo}</div>
            {subtitulo && <div className="base-sidebar6-subtitulo">{subtitulo}</div>}
          </div>
          {mostrarCerrar && (
            <button type="button" className="base-sidebar6-cerrar" aria-label="Cerrar panel" onClick={onCerrar}>✕</button>
          )}
        </div>
      </div>
      <div className="base-sidebar6-cuerpo-wrap">
        <div className="base-sidebar6-cuerpo" ref={contenedorRef} onScroll={onScroll}>{children}</div>
        {thumb.visible && (
          <div
            className="base-sidebar6-scrollbar-thumb"
            style={{ height: thumb.alto, top: thumb.top }}
            onMouseDown={onArrastrarThumb}
          />
        )}
      </div>
    </aside>
  );
}
