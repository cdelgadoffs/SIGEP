import Skeleton from './components/Skeleton.jsx';
import Sidebar4 from './components/base/Sidebar4.jsx';
import AvisoEdicionCorreo from './components/widgets/AvisoEdicionCorreo.jsx';
import Inicio from './pages/Inicio.jsx';
import ProyectoOrdenDia from './pages/ProyectoOrdenDia.jsx';
import Sesion from './pages/Sesion.jsx';
import Historial from './pages/Historial.jsx';
import { useUI } from './context/UIContext.jsx';

const PAGES = {
  inicio: Inicio,
  proyecto: ProyectoOrdenDia,
  sesion: Sesion,
  historial: Historial,
};

function App() {
  const { vistaActual, sidebar4Abierto, setSidebar4Abierto } = useUI();
  const Page = PAGES[vistaActual];

  return (
    <>
      <Skeleton>
        {Page && <Page />}
      </Skeleton>
      <Sidebar4 abierto={sidebar4Abierto} onCerrar={() => setSidebar4Abierto(false)} />
      <AvisoEdicionCorreo />
    </>
  );
}

export default App;
