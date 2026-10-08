import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/pages/Gates.css';

export default function LoginGate() {
  const { iniciarSesion, error } = useAuth();
  const [fechaHoy] = useState(() => {
    const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('es-ES', opciones);
  });

  return (
    <div className="lg-gate">
      <div className="lg-panel-oscuro">
        <div className="lg-ledger" aria-hidden="true">
          <span>I.</span><span>II.</span><span>III.</span>
        </div>
        <div className="lg-oscuro-contenido">
          <img
            src="https://raw.githubusercontent.com/cdelgadoffs/CGD/535876195bedc1b602f98438ee3a42ff11cbb817/logo.png"
            alt="Logo institucional"
            className="lg-logo"
          />
          <div className="lg-eyebrow">OAJ · SISTEMA DE SESIONES</div>
          <h1 className="lg-titulo">
            Generador de<br />Orden del Día
          </h1>
          <p className="lg-descripcion">
            Planeación, votación y actas del Pleno del Órgano de Administración Judicial,
            en un solo lugar.
          </p>
          <div className="lg-fecha">{fechaHoy}</div>
        </div>
      </div>

      <div className="lg-panel-claro">
        <div className="lg-box">
          <div className="lg-box-eyebrow">Acceso institucional</div>
          <h2 className="lg-box-titulo">Inicia sesión</h2>
          <p className="lg-box-sub">Acceso restringido a cuentas institucionales autorizadas.</p>

          <button className="lg-btn" onClick={iniciarSesion}>Iniciar sesión con Microsoft</button>
          {error && <p className="lg-error">{error}</p>}

          <div className="lg-box-footer">Órgano de Administración Judicial</div>
        </div>
      </div>
    </div>
  );
}
