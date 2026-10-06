import ListaExpandible from '../base/ListaExpandible.jsx';
import Textarea from '../base/Textarea.jsx';
import Checkbox from '../base/Checkbox.jsx';
import '../../styles/widgets/SelectorVotacion.css';

function siguiente(lista, id) {
  const i = lista.findIndex((o) => o.id === id);
  return lista[(i + 1) % lista.length];
}

export default function SelectorVotacion({
  value,
  onChange,
  tiposVoto = [],
  tiposVotacion = [],
  estadosVoto = [],
  integrantes = [],
  disabled = false,
}) {
  const votoActual = tiposVoto.find((o) => o.id === value?.voto) || tiposVoto[0];
  const votacionActual = tiposVotacion.find((o) => o.id === value?.votacion) || tiposVotacion[0];
  const estadoActual = estadosVoto.find((o) => o.id === value?.estado) || estadosVoto[0];
  if (!votoActual || !votacionActual || !estadoActual) {
    return <div className="widget-selector-votacion-vacio">Las opciones de votación no están disponibles.</div>;
  }

  const quorum = value?.quorum || [];
  const precision = value?.precision || '';
  const votosRequeridos = votoActual.votosRequeridos || 0;
  const requiereQuorum = votosRequeridos > 0;
  const quorumCompleto = quorum.length >= votosRequeridos;
  const mostrarPrecision = !!votoActual.admitePrecision && !!votacionActual.admitePrecision;

  function emitir(cambios) {
    onChange({
      voto: votoActual.id,
      votacion: votacionActual.id,
      estado: estadoActual.id,
      quorum,
      precision,
      ...cambios,
    });
  }

  function alternarQuorum(nombre, marcado) {
    if (marcado) {
      if (quorumCompleto) return;
      emitir({ quorum: [...quorum, nombre] });
    } else {
      emitir({ quorum: quorum.filter((n) => n !== nombre) });
    }
  }

  return (
    <div className={'widget-selector-votacion' + (disabled ? ' widget-selector-votacion-deshabilitado' : '')}>
      <div className="widget-selector-votacion-campo">
        <label className="widget-selector-votacion-etiqueta">Voto</label>
        <ListaExpandible
          valorActual={votoActual.id}
          etiquetaActual={votoActual.nombre}
          opciones={tiposVoto.map((o) => ({ id: o.id, label: o.nombre }))}
          onSeleccionar={(id) => emitir({ voto: id, quorum: [] })}
        />
      </div>

      <div className="widget-selector-votacion-campo">
        <label className="widget-selector-votacion-etiqueta widget-selector-votacion-oculta">Votación</label>
        {requiereQuorum ? (
          <span className={'widget-selector-votacion-quorum-badge' + (quorumCompleto ? ' completo' : '')}>
            {quorumCompleto
              ? quorum.map((id) => integrantes.find((i) => i.id === id)?.nombre ?? id).join(', ')
              : `Requiere ${votosRequeridos} voto${votosRequeridos === 1 ? '' : 's'}`}
          </span>
        ) : (
          <button
            type="button"
            className={'widget-selector-votacion-boton ' + (votoActual.sinVotacion ? 'widget-selector-votacion-boton-inactivo' : 'widget-selector-votacion-tono-' + votacionActual.tono)}
            disabled={disabled || votoActual.sinVotacion}
            onClick={() => emitir({ votacion: siguiente(tiposVotacion, votacionActual.id).id })}
          >
            {votoActual.sinVotacion ? 'No aplica votación' : votacionActual.nombre}
          </button>
        )}
      </div>

      <div className="widget-selector-votacion-campo widget-selector-votacion-campo-estado">
        <label className="widget-selector-votacion-etiqueta widget-selector-votacion-oculta">Estado</label>
        <button
          type="button"
          className={'widget-selector-votacion-boton widget-selector-votacion-tono-' + estadoActual.tono}
          disabled={disabled}
          onClick={() => emitir({ estado: siguiente(estadosVoto, estadoActual.id).id })}
        >
          {estadoActual.nombre}
        </button>
      </div>

      {mostrarPrecision && (
        <div className="widget-selector-votacion-ancho">
          <label className="widget-selector-votacion-etiqueta">Precisión</label>
          <Textarea value={precision} onChange={(texto) => emitir({ precision: texto })} placeholder="Con la precisión de que..." />
        </div>
      )}

      {requiereQuorum && (
        <div className="widget-selector-votacion-ancho">
          <label className="widget-selector-votacion-etiqueta">Quórum ({quorum.length}/{votosRequeridos})</label>
          <div className="widget-selector-votacion-quorum">
            {integrantes.map(({ id, nombre }) => {
              const marcado = quorum.includes(id);
              return (
                <Checkbox
                  key={id}
                  label={nombre}
                  checked={marcado}
                  disabled={disabled || (!marcado && quorumCompleto)}
                  onChange={(v) => alternarQuorum(id, v)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
