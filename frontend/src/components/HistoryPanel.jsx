import { useEffect, useState } from 'react';

export default function HistoryPanel({ refreshKey }) {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => { setRecords(Array.isArray(data) ? data : []); setError(null); })
      .catch(() => setError('Error al cargar el historial'));
  }, [refreshKey]);

  return (
    <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 0 6px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginBottom: '1rem' }}>📚 Historial de Predicciones</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><th>Fecha</th><th>Resultado</th><th>Prob. de “sí”</th></tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString()}</td>
                <td style={{ color: r.prediction === 1 ? 'green' : 'red' }}>
                  {r.prediction === 1 ? 'Sí contrata' : 'No contrata'}
                </td>
                <td>{(r.probability * 100).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
