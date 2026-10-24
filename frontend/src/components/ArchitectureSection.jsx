const box = { fill: 'var(--bs-body-bg, #fff)', stroke: '#444', strokeWidth: 1.2, rx: 8 };
const txt = { fontSize: 12, textAnchor: 'middle', fill: '#222' };

function Node({ x, y, w = 150, h = 54, lines, accent }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} {...box} stroke={accent || box.stroke} />
      {lines.map((l, i) => (
        <text key={l} x={x + w / 2} y={y + 22 + i * 16} {...txt} fontWeight={i === 0 ? 700 : 400}>{l}</text>
      ))}
    </g>
  );
}

const arrow = { stroke: '#444', strokeWidth: 1.4, markerEnd: 'url(#arr)' };

export default function ArchitectureSection() {
  return (
    <section style={{ maxWidth: 980, margin: '2rem auto 0', background: '#fff', padding: '1.5rem', borderRadius: 12, boxShadow: '0 0 6px rgba(0,0,0,0.1)', textAlign: 'left' }}>
      <details>
        <summary className="accordion-title">🏗️ Arquitectura del proyecto</summary>

        <h4 style={{ marginTop: '1rem' }}>v2 · Vercel (actual)</h4>
        <svg viewBox="0 0 900 190" role="img" aria-label="Diagrama de arquitectura en Vercel" style={{ width: '100%', height: 'auto' }}>
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" fill="#444" />
            </marker>
          </defs>
          <Node x={10} y={68} w={130} lines={['Navegador', 'React + Vite']} />
          <Node x={200} y={68} w={150} lines={['Vercel CDN', 'bankml.mydatavibe.com']} accent="#000" />
          <Node x={420} y={20} w={190} h={70} lines={['Vercel Function (Python)', 'FastAPI · /api/predict', 'límites anti-abuso']} accent="#000" />
          <Node x={420} y={112} w={190} lines={['Modelo en memoria', 'LightGBM + pipeline (350 KB)']} />
          <Node x={700} y={20} w={190} h={70} lines={['Neon Postgres', 'historial + contadores', '(free tier, se duerme)']} accent="#2e9e5b" />
          <path d="M140 95 L200 95" {...arrow} />
          <path d="M350 85 L420 60" {...arrow} />
          <path d="M515 90 L515 112" {...arrow} />
          <path d="M610 55 L700 55" {...arrow} />
          <text x={305} y={150} {...txt} fontSize={11}>DNS: CNAME en Hostinger</text>
        </svg>

        <ul>
          <li><strong>Una invocación por consulta:</strong> <code>/api/predict</code> devuelve predicción y contribuciones por variable (LightGBM <code>pred_contrib</code>, equivalente a SHAP en árboles).</li>
          <li><strong>Cuidado del free tier:</strong> validación estricta de entrada, tope de 4 KB por request, 6 consultas/min y 40/día por IP (hash), 1500/día globales, y purga automática de datos a los 2 días.</li>
          <li><strong>Sin servidores que mantener:</strong> serverless, sin instancias ni costos fijos.</li>
        </ul>

        <h4>v1 · AWS (histórico)</h4>
        <p>
          La primera versión (2025) usó <strong>S3</strong> para el frontend estático y <strong>EC2 + Docker</strong> para el backend Flask.
          El modelo se empaquetó en un contenedor que implementa el contrato de inferencia de SageMaker
          (<code>/ping</code> e <code>/invocations</code>) para poder migrar a un endpoint real,
          pero <strong>no se usó SageMaker administrado</strong>: el contenedor corría simulado sobre EC2.
          El código sigue disponible en <code>legacy/aws/</code>.
        </p>

        <h4>Si fuera a producción</h4>
        <ul>
          <li>Endpoint de SageMaker (o batch transform) con versionado de modelos en un registry.</li>
          <li>Monitoreo de drift y de calidad (el modelo depende de variables macroeconómicas trimestrales).</li>
          <li>Umbral de decisión según costo de contacto vs. valor del depósito.</li>
          <li>Autenticación para el operador y auditoría de predicciones.</li>
        </ul>
      </details>
    </section>
  );
}
