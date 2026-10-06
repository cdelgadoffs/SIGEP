import { useState } from 'react';
import BotonS from '../../base/BotonS.jsx';
import FormularioSecretario from './FormularioSecretario.jsx';
import SecretarioEjecutivo from './SecretarioEjecutivo.jsx';
import { useUI } from '../../../context/UIContext.jsx';
import { useOrgano } from '../../../context/OrganoContext.jsx';
import '../../../styles/widgets/panelcontrol/SEPLE.css';

export default function SEPLE() {
  const { setPanelControlActivo } = useUI();
  const { SECRETARIO_EJECUTIVO } = useOrgano();
  const [editando, setEditando] = useState(false);

  return (
    <div className="widget-seple">
      <div className="widget-seple-volver">
        <BotonS onClick={() => setPanelControlActivo(null)}>Volver</BotonS>
      </div>
      <p className="widget-seple-nota">
        Secretario Ejecutivo del Pleno. No participa en el conteo de quórum ni de votos; solo puede haber uno registrado.
      </p>
      {!SECRETARIO_EJECUTIVO || editando
        ? <FormularioSecretario onTerminar={() => setEditando(false)} />
        : <SecretarioEjecutivo onEditar={() => setEditando(true)} />}
    </div>
  );
}
