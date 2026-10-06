import { useState } from 'react';
import CampoTexto from '../../base/CampoTexto.jsx';
import ListaExpandible from '../../base/ListaExpandible.jsx';
import BotonS from '../../base/BotonS.jsx';
import { useOrgano } from '../../../context/OrganoContext.jsx';
import { useProyecto } from '../../../context/ProyectoContext.jsx';
import '../../../styles/widgets/panelcontrol/FormularioSecretario.css';

export default function FormularioSecretario({ onTerminar }) {
  const { SECRETARIO_EJECUTIVO: secretario, guardarSecretarioEjecutivo } = useOrgano();
  const { GENEROS } = useProyecto();
  const editando = !!secretario;
  const [nombre, setNombre] = useState(secretario?.nombre ?? '');
  const [email, setEmail] = useState(secretario?.email ?? '');
  const [genero, setGenero] = useState(secretario?.genero ?? '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const generoActual = genero || GENEROS[0]?.id || '';

  async function guardar() {
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await guardarSecretarioEjecutivo({ nombre, email, genero: generoActual });
      onTerminar();
    } catch (e) {
      setError(e.mensaje || 'No se pudo guardar al Secretario Ejecutivo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="widget-formulario-secretario">
      <div className="widget-formulario-secretario-campo">
        <span className="widget-formulario-secretario-etiqueta">Nombre completo</span>
        <CampoTexto value={nombre} onChange={setNombre} onEnter={guardar} placeholder="Nombre completo" ariaLabel="Nombre completo" />
      </div>
      <div className="widget-formulario-secretario-campo">
        <span className="widget-formulario-secretario-etiqueta">Correo (opcional)</span>
        <CampoTexto type="email" value={email} onChange={setEmail} onEnter={guardar} placeholder="correo@ejemplo.com" ariaLabel="Correo" />
      </div>
      <div className="widget-formulario-secretario-campo">
        <span className="widget-formulario-secretario-etiqueta">Género</span>
        <div className="widget-formulario-secretario-selector">
          <ListaExpandible
            valorActual={generoActual}
            etiquetaActual={GENEROS.find((g) => g.id === generoActual)?.nombre ?? ''}
            opciones={GENEROS.map((g) => ({ id: g.id, label: g.nombre }))}
            onSeleccionar={setGenero}
          />
        </div>
      </div>
      {error && <div className="widget-formulario-secretario-error">{error}</div>}
      <div className="widget-formulario-secretario-acciones">
        <BotonS onClick={guardar} disabled={enviando}>{editando ? 'Guardar cambios' : 'Registrar Secretario'}</BotonS>
        {editando && <BotonS onClick={onTerminar}>Cancelar</BotonS>}
      </div>
    </div>
  );
}
