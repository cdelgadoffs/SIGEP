import ListaExpandible from '../base/ListaExpandible.jsx';
import Textarea from '../base/Textarea.jsx';
import '../../styles/widgets/SelectorInforme.css';

export default function SelectorInforme({ value, onChange, tiposConocimiento = [], disabled = false }) {
  const actual = tiposConocimiento.find((o) => o.id === value?.conocimiento) || tiposConocimiento[0];
  if (!actual) {
    return <div className="widget-selector-informe-vacio">Las opciones del informe no están disponibles.</div>;
  }
  const complemento = value?.complemento || '';

  function emitir(cambios) {
    onChange({ conocimiento: actual.id, complemento, ...cambios });
  }

  return (
    <div className={'widget-selector-informe' + (disabled ? ' widget-selector-informe-deshabilitado' : '')}>
      <label className="widget-selector-informe-etiqueta">Conocimiento del Pleno</label>
      <ListaExpandible
        valorActual={actual.id}
        etiquetaActual={actual.nombre}
        opciones={tiposConocimiento.map((o) => ({ id: o.id, label: o.nombre }))}
        onSeleccionar={(id) => onChange({ conocimiento: id, complemento: '' })}
      />
      {actual.admiteComplemento && (
        <div className="widget-selector-informe-complemento">
          <Textarea value={complemento} onChange={(texto) => emitir({ complemento: texto })} placeholder="...las acciones realizadas en materia de..." />
        </div>
      )}
    </div>
  );
}
