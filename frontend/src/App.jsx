import { useEffect, useState } from 'react';

function App() {
  const [estado, setEstado] = useState('cargando...');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Probar que el proxy al backend funciona
    fetch('/health')
      .then((r) => r.json())
      .then((data) => setEstado(`Backend: ${data.status} | DB: ${data.database}`))
      .catch((err) => setEstado(`Error: ${err.message}`));

    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => setStats(data.stats))
      .catch(() => setStats(null));
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Sistema de Inventario - Frontend</h1>
      <p style={{ marginTop: '20px' }}>{estado}</p>

      {stats && (
        <div style={{ marginTop: '30px' }}>
          <h2>Estadísticas de la base de datos</h2>
          <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
            {stats.map((s) => (
              <li key={s.tabla}>
                <strong>{s.tabla}:</strong> {s.total} registros
              </li>
            ))}
          </ul>
        </div>
      )}

      <p style={{ marginTop: '40px', color: '#718096', fontSize: '14px' }}>
        Si ves los conteos, frontend, backend y BD están conectados correctamente.
      </p>
    </div>
  );
}

export default App;