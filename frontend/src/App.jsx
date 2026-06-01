import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Categorias from './pages/Categorias';
import Reportes from './pages/Reportes';
import Layout from './components/Layout';

const ACCESO = {
  dashboard:  ['admin', 'gerente', 'vendedor', 'inventario', 'cajero'],
  productos:  ['admin', 'gerente', 'vendedor', 'inventario', 'cajero'],
  categorias: ['admin', 'gerente', 'inventario'],
  ventas:     ['admin', 'gerente', 'vendedor', 'cajero'],
  reportes:   ['admin', 'gerente'],
};

function SinAcceso({ pagina }) {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Acceso restringido</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Tu rol no tiene permiso para ver <strong>{pagina}</strong>.
      </p>
    </div>
  );
}

function PantallaVentas() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Ventas</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
        El registro de ventas se realiza a traves del API con stored procedures y transacciones.
      </p>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
      }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-soft)' }}>
          Para ver el listado de ventas, consulta el reporte{' '}
          <strong>Ventas detalladas</strong> en la seccion Reportes.
        </p>
      </div>
    </div>
  );
}

function AppShell() {
  const { user } = useAuth();
  const rol = user?.rol || '';

  const paginaInicial = ACCESO.dashboard.includes(rol) ? 'dashboard' : 'productos';
  const [active, setActive] = useState(paginaInicial);

  function navegar(pagina) {
    if (ACCESO[pagina]?.includes(rol)) {
      setActive(pagina);
    }
  }

  function renderContenido() {
    if (!ACCESO[active]?.includes(rol)) {
      return <SinAcceso pagina={active} />;
    }
    switch (active) {
      case 'dashboard':  return <Dashboard />;
      case 'productos':  return <Productos />;
      case 'categorias': return <Categorias />;
      case 'ventas':     return <PantallaVentas />;
      case 'reportes':   return <Reportes />;
      default:           return <Dashboard />;
    }
  }

  return (
    <Layout active={active} onNavigate={navegar}>
      {renderContenido()}
    </Layout>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--color-text-muted)' }}>
        Cargando...
      </div>
    );
  }
  return user ? <AppShell /> : <Login />;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
