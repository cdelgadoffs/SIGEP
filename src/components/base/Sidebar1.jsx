import { useScrollbarPersonalizada } from '../../hooks/useScrollbarPersonalizada.js';
import '../../styles/base/Sidebar1.css';

export default function Sidebar1({ izquierda = 0, arriba = 52, ancho, titulo, subtitulo, accionesHeader, pie, children }) {
  const { contenedorRef, thumb, onScroll, onArrastrarThumb } = useScrollbarPersonalizada();
  return (
    <aside className="base-sidebar1" style={{ left: izquierda, top: arriba, height: `calc(100vh - ${arriba}px)`, ...(ancho && { width: ancho }) }}>
      <div className="base-sidebar1-header">
        <div className="base-sidebar1-header-top">
          <div className="base-sidebar1-title">{titulo}</div>
          {accionesHeader}
        </div>
        <div className="base-sidebar1-subtitle">{subtitulo}</div>
      </div>
      <div className="base-sidebar1-nav-wrap">
        <nav className="base-sidebar1-nav" ref={contenedorRef} onScroll={onScroll}>{children}</nav>
        {thumb.visible && (
          <div
            className="base-scrollbar-thumb"
            style={{ height: thumb.alto, top: thumb.top }}
            onMouseDown={onArrastrarThumb}
          />
        )}
      </div>
      {pie && <div className="base-sidebar1-pie">{pie}</div>}
    </aside>
  );
}
