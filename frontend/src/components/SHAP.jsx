export default function SHAP({ shap }) {
  if (!shap || typeof shap !== 'object') return null;

  return (
    <div style={{ marginTop: '2rem', maxWidth: '600px', marginInline: 'auto' }}>
      <h3>Importancia de Variables (SHAP)</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Variable</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Valor SHAP</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(shap).map(([key, value]) => (
            <tr key={key}>
              <td style={{ padding: '0.5rem' }}>{key}</td>
              <td style={{ padding: '0.5rem' }}>{value.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
