import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Layout from './components/Layout';

function PantallaPlaceholder({ titulo }) {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>{titulo}</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Esta sección se construirá en los próximos commits.
      </p>
    </div>
  );
}

function AppShell() {
  const [active, setActive] = useState('dashboard');

  let contenido;
  switch (active) {
    case 'dashboard':  contenido = <Dashboard />; break;
    case 'productos':  contenido = <Productos />; break;
    case 'categorias': contenido = <PantallaPlaceholder titulo="Categorías" />; break;
    case 'ventas':     contenido = <PantallaPlaceholder titulo="Ventas" />; break;
    case 'reportes':   contenido = <PantallaPlaceholder titulo="Reportes" />; break;
    default:           contenido = <Dashboard />;
  }

  return (
    <Layout active={active} onNavigate={setActive}>
      {contenido}
    </Layout>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--color-text-muted)',
      }}>
        Cargando…
      </div>
    );
  }

  return user ? <AppShell /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}