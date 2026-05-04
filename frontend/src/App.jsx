import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

function PantallaPrincipal() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Hola, {user.nombre} {user.apellido}</h1>
      <p style={{ marginTop: 8, color: 'var(--color-text-muted)' }}>
        Rol: {user.rol} · Usuario: {user.username}
      </p>
      <p style={{ marginTop: 24, color: 'var(--color-text-soft)' }}>
        El layout completo (sidebar, dashboard, fichas) viene en el siguiente commit.
      </p>
      <button
        onClick={logout}
        style={{
          marginTop: 24,
          padding: '10px 20px',
          background: 'var(--color-danger-soft)',
          color: 'var(--color-danger)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 500,
        }}
      >
        Cerrar sesión
      </button>
    </div>
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
        Cargando...
      </div>
    );
  }

  return user ? <PantallaPrincipal /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}