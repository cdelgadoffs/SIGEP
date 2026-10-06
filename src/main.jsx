import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ProyectoProvider } from './context/ProyectoContext.jsx'
import { OrganoProvider } from './context/OrganoContext.jsx'
import { AjustesVisualesProvider } from './context/AjustesVisualesContext.jsx'
import { UIProvider } from './context/UIContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ProyectoProvider>
        <OrganoProvider>
          <AjustesVisualesProvider>
            <UIProvider>
              <App />
            </UIProvider>
          </AjustesVisualesProvider>
        </OrganoProvider>
      </ProyectoProvider>
    </AuthProvider>
  </StrictMode>,
)
