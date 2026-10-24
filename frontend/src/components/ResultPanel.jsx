import { INSIGHTS, TIER_META, groupFactors, num, pct } from '../lib/config.js';

const TIERS = INSIGHTS.tiers; // alta, media, baja (de mayor a menor)
const MEDIA_MIN = TIERS.find((t) => t.id === 'media').min;
const ALTA_MIN = TIERS.find((t) => t.id === 'alta').min;
const clampPct = (p) => `${Math.min(Math.max(p, 0), 1) * 100}%`;

function Meter({ probability, tone, base }) {
  return (
    <div className="meter" aria-hidden="true">
      <div className="meter-track">
        <i className="z-low" style={{ width: clampPct(MEDIA_MIN) }} />
        <i className="z-mid" style={{ width: clampPct(ALTA_MIN - MEDIA_MIN) }} />
        <i className="z-high" style={{ width: clampPct(1 - ALTA_MIN) }} />
      </div>
      <div className="meter-base" style={{ left: clampPct(base) }} />
      <span className="meter-base-label" style={{ left: clampPct(base) }}>promedio {pct(base, 1)}</span>
      <div className={`meter-dot ${tone}`} style={{ left: clampPct(probability) }} />
      <div className="meter-labels">
        <span style={{ left: clampPct(ALTA_MIN) }}>alta ≥ {pct(ALTA_MIN)}</span>
        <span style={{ left: '100%', transform: 'translateX(-100%)' }}>100 %</span>
      </div>
    </div>
  );
}

function Factors({ result, form }) {
  const factors = groupFactors(result.contributions, form).slice(0, 5);
  const max = Math.max(...factors.map((f) => Math.abs(f.value)), 0.01);
  return (
    <>
      <h4 className="sub">Qué influyó más en este resultado</h4>
      <ul className="factors">
        {factors.map((f) => {
          const w = `${(Math.abs(f.value) / max) * 50}%`;
          return (
            <li className="factor" key={f.key}>
              <div className="name">{f.label}<small>{f.detail} · {f.value >= 0 ? 'a favor' : 'en contra'}</small></div>
              <div className="bar" role="img" aria-label={`${f.label}: ${f.value >= 0 ? 'a favor' : 'en contra'}`}>
                <i className={f.value >= 0 ? 'pos' : 'neg'} style={{ width: w }} />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="legend"><span>← en contra de contratar</span><span>a favor →</span></div>
    </>
  );
}

export default function ResultPanel({ result, form, loading, error }) {
  const data = result;
  return (
    <aside id="resultado" className="card sticky" aria-live="polite" aria-busy={loading}>
      {error && <div className="alert" role="alert">{error}</div>}
      {loading && !data && (
        <div style={{ display: 'grid', gap: 12 }}><div className="skeleton" style={{ width: '40%' }} /><div className="skeleton" style={{ height: 52, width: '60%' }} /><div className="skeleton" /></div>
      )}
      {!data && !loading && (
        <div className="result-empty">
          <div className="big">🎯</div>
          <h3>Tu resultado aparece acá</h3>
          <p>Elegí un perfil de ejemplo o completá el formulario y calculá la prioridad de la llamada.</p>
        </div>
      )}
      {data && (() => {
        const meta = TIER_META[data.tier];
        const faster = data.lift >= 1;
        return (
          <>
            <span className={`badge ${meta.tone}`}>{meta.icon} {meta.label}</span>
            <div className={`prob ${meta.tone}`}>{pct(data.probability, data.probability < 0.1 ? 1 : 0)}</div>
            <p className="muted">de probabilidad de contratar un depósito a plazo</p>
            <p style={{ marginTop: 8 }}>
              <strong>{faster ? `${num(data.lift)}× más probable` : `${num(1 / Math.max(data.lift, 0.01))}× menos probable`}</strong>{' '}
              que un cliente promedio ({pct(data.base_rate, 1)}).
            </p>
            <Meter probability={data.probability} tone={meta.tone} base={data.base_rate} />
            <p className="advice">{meta.advice}</p>
            <Factors result={data} form={form} />
            <details className="tech">
              <summary>Ver detalle técnico</summary>
              <table>
                <tbody>
                  <tr><td>Score crudo del modelo (sin calibrar)</td><td>{num(data.score, 3)}</td></tr>
                  <tr><td>Valor base (log-odds)</td><td>{num(data.base_value, 3)}</td></tr>
                  {Object.entries(data.contributions).map(([k, v]) => <tr key={k}><td><code>{k}</code></td><td>{v > 0 ? '+' : ''}{num(v, 3)}</td></tr>)}
                </tbody>
              </table>
              <p className="disclaimer">Contribuciones TreeSHAP en log-odds: suman, junto al valor base, el score del modelo.</p>
            </details>
            <p className="disclaimer">Demo educativa con datos de un banco portugués (2008–2010). No usar para decisiones reales.</p>
          </>
        );
      })()}
    </aside>
  );
}
