import { useEffect, useState } from 'react';
import { TIER_META, pct } from '../lib/config.js';

export default function HistoryPanel({ refreshKey }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    fetch('/api/history').then((r) => r.json()).then((d) => setRows(Array.isArray(d) ? d.slice(0, 8) : [])).catch(() => setRows([]));
  }, [refreshKey]);
  if (!rows.length) return null;
  return (
    <section className="block" id="historial">
      <div className="container">
        <div className="card">
          <h3>Últimas consultas a la demo</h3>
          <p>Se guardan solo la prioridad, la probabilidad y la fecha. No se guardan los datos del formulario.</p>
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table className="history">
              <thead><tr><th>Fecha</th><th>Prioridad</th><th>Probabilidad</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.created_at).toLocaleString('es-AR')}</td>
                    <td><span className={`chip ${TIER_META[r.tier]?.tone ?? 'low'}`}>{TIER_META[r.tier]?.short ?? r.tier}</span></td>
                    <td>{pct(r.probability, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
