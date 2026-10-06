import { useState } from 'react';
import BotonS from '../../base/BotonS.jsx';
import FormularioQuorum from './FormularioQuorum.jsx';
import ListaQuorum from './ListaQuorum.jsx';
import { useUI } from '../../../context/UIContext.jsx';
import '../../../styles/widgets/panelcontrol/Quorum.css';

export default function Quorum() {
  const { setPanelControlActivo } = useUI();
  const [enEdicion, setEnEdicion] = useState(null);

  return (
    <div className="widget-quorum">
      <div className="widget-quorum-volver">
        <BotonS onClick={() => setPanelControlActivo(null)}>Volver</BotonS>
      </div>
      <FormularioQuorum key={enEdicion?.id ?? 'nuevo'} integrante={enEdicion} onTerminar={() => setEnEdicion(null)} />
      <ListaQuorum onEditar={setEnEdicion} />
    </div>
  );
}
