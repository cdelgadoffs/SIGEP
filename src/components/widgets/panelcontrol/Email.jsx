import { useEffect } from 'react';
import Scrollbar from '../../base/Scrollbar.jsx';
import NavegacionCorreo from './NavegacionCorreo.jsx';
import ListaCorreos from './ListaCorreos.jsx';
import LecturaCorreo from './LecturaCorreo.jsx';
import RedactarCorreo from './RedactarCorreo.jsx';
import ContactosCorreo from './ContactosCorreo.jsx';
import ListasDestinatarios from './ListasDestinatarios.jsx';
import CorreosRemitentes from './CorreosRemitentes.jsx';
import PlantillasCorreo from './PlantillasCorreo.jsx';
import { useUI } from '../../../context/UIContext.jsx';
import '../../../styles/widgets/panelcontrol/Email.css';

const PANELES = {
  contactos: ContactosCorreo,
  listas: ListasDestinatarios,
  remitentes: CorreosRemitentes,
  plantillas: PlantillasCorreo,
};

export default function Email() {
  const { setSidebar5Amplio, emailSeccion, setEmailSeccion, setCorreoSeleccionadoId } = useUI();

  useEffect(() => {
    setSidebar5Amplio(true);
    return () => {
      setSidebar5Amplio(false);
      setEmailSeccion('enviados');
      setCorreoSeleccionadoId(null);
    };
  }, [setSidebar5Amplio, setEmailSeccion, setCorreoSeleccionadoId]);

  const Panel = PANELES[emailSeccion];
  const redactando = emailSeccion === 'nuevo';

  return (
    <div className="widget-email">
      <NavegacionCorreo />
      {redactando ? (
        <div className="widget-email-contenido">
          <RedactarCorreo />
        </div>
      ) : Panel ? (
        <div className="widget-email-contenido">
          <Scrollbar>
            <div className="widget-email-panel">
              <Panel />
            </div>
          </Scrollbar>
        </div>
      ) : (
        <>
          <ListaCorreos />
          <LecturaCorreo />
        </>
      )}
    </div>
  );
}
