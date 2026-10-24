function Node({ x, y, w = 128, h = 48, title, sub, tone = '', dashed = false }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="10" className={`dg-node ${tone} ${dashed ? 'dashed' : ''}`} />
      <text x={x + w / 2} y={y + (sub ? 20 : 29)} textAnchor="middle" className="dg-title">{title}</text>
      {sub && <text x={x + w / 2} y={y + 36} textAnchor="middle" className="dg-sub">{sub}</text>}
    </g>
  );
}

const Arrow = ({ d, dashed }) => <path d={d} className={`dg-arrow ${dashed ? 'dashed' : ''}`} markerEnd="url(#dg-head)" />;

function Defs() {
  return (
    <defs>
      <marker id="dg-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" className="dg-head" />
      </marker>
    </defs>
  );
}

function V1() {
  return (
    <svg className="dg" viewBox="0 0 480 330" role="img" aria-label="Arquitectura v1 en AWS">
      <Defs />
      <Node x={176} y={8} w={128} title="Usuario" sub="navegador" />
      <Node x={176} y={86} title="S3" sub="web estática · HTTP" tone="warn" />
      <rect x={20} y={158} width={440} height={166} rx="14" className="dg-zone" />
      <text x={34} y={178} className="dg-zonelabel">Una instancia EC2 (siempre encendida)</text>
      <Node x={36} y={196} w={132} title="Flask" sub="backend + SQLite" tone="warn" />
      <Node x={206} y={196} w={132} title="Contenedor Docker" sub="imita a SageMaker" tone="warn" />
      <Node x={362} y={196} w={84} h={48} title="SHAP" sub="/explain" />
      <Node x={206} y={268} w={240} h={44} title="SageMaker real: nunca se usó" dashed />
      <Arrow d="M240 56 L240 86" />
      <Arrow d="M240 134 L120 196" />
      <Arrow d="M168 220 L206 220" />
      <Arrow d="M338 220 L362 220" />
      <Arrow d="M272 244 L272 268" dashed />
    </svg>
  );
}

function V2() {
  return (
    <svg className="dg" viewBox="0 0 480 330" role="img" aria-label="Arquitectura v2 en Vercel">
      <Defs />
      <Node x={176} y={8} w={128} title="Usuario" sub="navegador" />
      <Node x={150} y={86} w={180} title="Vercel CDN + firewall" sub="bankml.mydatavibe.com · HTTPS" tone="ok" />
      <rect x={20} y={158} width={440} height={166} rx="14" className="dg-zone ok" />
      <text x={34} y={178} className="dg-zonelabel">Función serverless (solo corre cuando alguien la usa)</text>
      <Node x={36} y={196} w={132} title="FastAPI" sub="validación + límites" tone="ok" />
      <Node x={206} y={196} w={132} title="Motor del modelo" sub="JSON · Python puro" tone="ok" />
      <Node x={362} y={196} w={84} title="SHAP" sub="misma llamada" />
      <Node x={36} y={268} w={202} h={44} title="Sin base de datos" sub="límites en memoria · no guarda nada" tone="ok" />
      <Arrow d="M240 56 L240 86" />
      <Arrow d="M240 134 L120 196" />
      <Arrow d="M168 220 L206 220" />
      <Arrow d="M338 220 L362 220" />
      <Arrow d="M102 244 L102 268" />
    </svg>
  );
}

const ROWS = [
  ['Frontend', 'S3 (sitio estático, sin HTTPS)', 'Vercel CDN con dominio propio y HTTPS', 'HTTPS gratis y despliegue en cada push'],
  ['Backend', 'Flask en EC2 con Docker, siempre encendido', 'FastAPI serverless, corre bajo demanda', 'Sin servidor que mantener ni pagar 24/7'],
  ['Modelo', 'Contenedor "compatible con SageMaker" (simulado)', 'Modelo exportado a JSON + motor en Python puro', 'LightGBM no corre en Vercel; 221 KB y ~40 ms'],
  ['Explicación', 'Segunda llamada a /explain (SHAP)', 'Misma llamada, TreeSHAP exacto', 'La mitad de las invocaciones'],
  ['Datos', 'SQLite en el disco de la instancia', 'Sin base de datos: la demo no guarda nada', 'Menos piezas, nada que migrar ni proteger'],
  ['Costo', 'EC2 encendida todo el mes', '$0 en planes gratuitos', 'Se cerró la cuenta de AWS sin perder la demo'],
  ['Calidad', 'Sin tests ni límites de uso', '15 tests, paridad con LightGBM y topes anti-abuso', 'Se corrigieron 3 errores de la v1'],
];

export default function VersionsDiagram() {
  return (
    <>
      <div className="grid cols-2">
        <div className="card">
          <span className="pill warn">2025 · v1 · AWS</span>
          <h3 style={{ marginTop: 8 }}>Cómo era</h3>
          <V1 />
          <p>El contenedor del modelo imitaba el contrato de SageMaker (<code>/ping</code> e <code>/invocations</code>) para poder migrar después, pero <strong>nunca se usó SageMaker administrado</strong>: todo corría en una sola EC2.</p>
        </div>
        <div className="card">
          <span className="pill ok">2026 · v2 · Vercel</span>
          <h3 style={{ marginTop: 8 }}>Cómo es ahora</h3>
          <V2 />
          <p>Frontend y API viven en el mismo dominio, el modelo se exportó a un formato portable y la demo corre en planes gratuitos con topes duros contra el abuso.</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, overflowX: 'auto' }}>
        <h3>Qué cambió y por qué</h3>
        <table className="compare">
          <thead><tr><th>Pieza</th><th>v1 · AWS</th><th>v2 · Vercel</th><th>Por qué</th></tr></thead>
          <tbody>
            {ROWS.map(([k, a, b, c]) => (
              <tr key={k}><th scope="row">{k}</th><td>{a}</td><td>{b}</td><td className="why">{c}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
