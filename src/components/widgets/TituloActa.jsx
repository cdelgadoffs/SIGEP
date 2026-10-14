import BadgeDinamico from '../base/BadgeDinamico.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import '../../styles/widgets/TituloActa.css';

export default function TituloActa() {
  const { sesionSeleccionada } = useProyecto();
  const { actaEditandoDe } = useUI();
  const editando = actaEditandoDe !== null && actaEditandoDe === sesionSeleccionada?.id;

  return (
    <span className="widget-titulo-acta">
      Acta de la sesión
      {editando && <BadgeDinamico texto="Editando" icono="ri-pencil-line" tono="naranja" />}
    </span>
  );
}
