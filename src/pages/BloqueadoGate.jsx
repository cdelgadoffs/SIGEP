import { useAuth } from '../context/AuthContext.jsx';
import '../styles/pages/Gates.css';

export default function BloqueadoGate() {
  const { usuario, cerrarSesion } = useAuth();
  return (
    <div className="lg-gate">
      <div className="lg-panel-oscuro" style={{ gridColumn: '1 / -1' }}>
        <div className="lg-oscuro-contenido" style={{ maxWidth: '480px', textAlign: 'center' }}>
          <img
            src="https://raw.githubusercontent.com/cdelgadoffs/CGD/535876195bedc1b602f98438ee3a42ff11cbb817/logo.png"
            alt="Logo institucional"
            className="lg-logo"
            style={{ margin: '0 auto 28px' }}
          />
          <div className="lg-eyebrow">OAJ · SIGEP</div>
          <h1 className="lg-titulo" style={{ fontSize: '28px' }}>Acceso restringido</h1>
          <p className="lg-descripcion" style={{ margin: '0 auto 32px' }}>
            Tu cuenta inició sesión correctamente, pero aún no tiene
            permisos asignados en esta aplicación. Contacta al administrador para que active tu acceso.
          </p>
          {(usuario?.correo || usuario?.nombre) && (
            <div className="lg-eyebrow" style={{ margin: '0 auto 24px', textTransform: 'none', letterSpacing: '0.04em' }}>
              Sesión iniciada como {usuario.correo || usuario.nombre}
            </div>
          )}
          <button className="lg-btn" style={{ maxWidth: '260px', margin: '0 auto' }} onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
