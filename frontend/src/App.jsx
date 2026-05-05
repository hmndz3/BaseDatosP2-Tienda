import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Categorias from './pages/Categorias';
import Reportes from './pages/Reportes';
import Layout from './components/Layout';

function PantallaVentas() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Ventas</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
        El registro de ventas se realiza a través del API con transacciones explícitas (BEGIN/COMMIT/ROLLBACK).
      </p>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
      }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-soft)' }}>
          Para ver el listado completo de ventas, consultá el reporte{' '}
          <strong>Ventas detalladas</strong> en la sección Reportes.
        </p>
      </div>
    </div>
  );
}

function AppShell() {
  const [active, setActive] = useState('dashboard');

  let contenido;
  switch (active) {
    case 'dashboard':  contenido = <Dashboard />; break;
    case 'productos':  contenido = <Productos />; break;
    case 'categorias': contenido = <Categorias />; break;
    case 'ventas':     contenido = <PantallaVentas />; break;
    case 'reportes':   contenido = <Reportes />; break;
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
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--color-text-muted)' }}>
        Cargando…
      </div>
    );
  }
  return user ? <AppShell /> : <Login />;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}