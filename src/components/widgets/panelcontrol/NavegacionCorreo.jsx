import BotonS from '../../base/BotonS.jsx';
import BotonSeleccionableMenu from '../../base/BotonSeleccionableMenu.jsx';
import { useUI } from '../../../context/UIContext.jsx';
import { useCorreo } from '../../../context/CorreoContext.jsx';
import '../../../styles/widgets/panelcontrol/NavegacionCorreo.css';

const GRUPOS = [
  { titulo: 'Favoritos', secciones: [{ id: 'enviados', label: 'Enviados' }] },
  { titulo: 'Personas', secciones: [{ id: 'contactos', label: 'Contactos' }, { id: 'listas', label: 'Listas de destinatarios' }] },
  { titulo: 'Configuración', secciones: [{ id: 'remitentes', label: 'Correo de remitentes' }, { id: 'plantillas', label: 'Plantillas' }] },
];

export default function NavegacionCorreo() {
  const { emailSeccion, setEmailSeccion, setPanelControlActivo } = useUI();
  const { CORREOS_ENVIADOS, CONTACTOS_CORREO, LISTAS_CORREO, PLANTILLAS_CORREO } = useCorreo();

  const totales = {
    enviados: CORREOS_ENVIADOS.length,
    contactos: CONTACTOS_CORREO.length,
    listas: LISTAS_CORREO.length,
    plantillas: PLANTILLAS_CORREO.length,
  };

  return (
    <nav className="widget-navegacion-correo">
      <BotonS variant="claro" onClick={() => setPanelControlActivo(null)}>‹ Panel de control</BotonS>
      <button
        type="button"
        className={'widget-navegacion-correo-nuevo' + (emailSeccion === 'nuevo' ? ' widget-navegacion-correo-nuevo-activo' : '')}
        onClick={() => setEmailSeccion('nuevo')}
      >
        <i className="ri-mail-add-line"></i>
        Nuevo correo
      </button>
      {GRUPOS.map((grupo) => (
        <div key={grupo.titulo} className="widget-navegacion-correo-grupo">
          <span className="widget-navegacion-correo-titulo">{grupo.titulo}</span>
          {grupo.secciones.map((s) => (
            <BotonSeleccionableMenu
              key={s.id}
              activo={emailSeccion === s.id}
              badge={totales[s.id]}
              onClick={() => setEmailSeccion(s.id)}
            >
              {s.label}
            </BotonSeleccionableMenu>
          ))}
        </div>
      ))}
    </nav>
  );
}
