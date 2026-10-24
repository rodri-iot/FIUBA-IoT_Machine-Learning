// Contribución de cada variable a la predicción, en log-odds (equivalente a valores SHAP
// de un modelo de árboles, calculados con TreeSHAP exacto).
export default function SHAP({ contributions }) {
  if (!contributions || typeof contributions !== 'object') return null;

  const entries = Object.entries(contributions);
  const max = Math.max(...entries.map(([, v]) => Math.abs(v)), 1e-9);

  return (
    <div style={{ marginTop: '2rem', maxWidth: '600px', marginInline: 'auto' }}>
      <h3>Importancia de Variables (SHAP)</h3>
      <p style={{ fontSize: '0.85rem', color: '#555' }}>
        Verde empuja hacia <strong>“sí contrata”</strong>, rojo hacia <strong>“no contrata”</strong> (unidades: log-odds).
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Variable</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Contribución</th>
            <th style={{ padding: '0.5rem', width: '45%' }}></th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key}>
              <td style={{ padding: '0.4rem 0.5rem' }}>{key}</td>
              <td style={{ padding: '0.4rem 0.5rem' }}>{value.toFixed(4)}</td>
              <td style={{ padding: '0.4rem 0.5rem' }}>
                <div style={{ height: 10, width: `${(Math.abs(value) / max) * 100}%`, background: value >= 0 ? '#2e9e5b' : '#d64545', borderRadius: 3 }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
