import { Fragment } from 'react';
import LoginGate from './LoginGate.jsx';
import BloqueadoGate from './BloqueadoGate.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/pages/Gates.css';

export default function AccesoGate({ children }) {
  const { cargando, usuario, rol } = useAuth();

  if (cargando || !usuario) return <LoginGate />;
  if (!rol) return <BloqueadoGate />;
  return <Fragment key={usuario.id}>{children}</Fragment>;
}
