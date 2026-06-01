import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Login.module.css';

const USUARIOS = [
  { username: 'palvarado',   rol: 'admin',      color: '#7c3aed' },
  { username: 'smonterroso', rol: 'gerente',    color: '#0369a1' },
  { username: 'lcabrera',    rol: 'vendedor',   color: '#059669' },
  { username: 'omarroquin',  rol: 'inventario', color: '#d97706' },
  { username: 'forellana',   rol: 'cajero',     color: '#dc2626' },
];

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  }

  function usarUsuario(u) {
    setUsername(u);
    setPassword('password123');
    setError(null);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>T</div>
          <h1 className={styles.title}>Bienvenido</h1>
          <p className={styles.subtitle}>Sistema de inventario y ventas</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">Usuario</label>
            <input
              id="username"
              className={styles.input}
              type="text"
              placeholder="palvarado"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Contrasena</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              placeholder="password123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Ingresar'}
          </button>
        </form>

        <div className={styles.hint}>
          <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 13 }}>
            Usuarios de prueba — clic para autocompletar
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {USUARIOS.map((u) => (
              <button
                key={u.username}
                type="button"
                onClick={() => usarUsuario(u.username)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'none',
                  border: '1px solid var(--color-border-soft)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: u.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {u.username[0].toUpperCase()}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>
                    {u.username}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                    {u.rol}
                  </span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  password123
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
