import { CalibrationChart, GainsChart } from './Charts.jsx';
import { INSIGHTS, TIER_META, num, pct } from '../lib/config.js';

const { meta, tiers } = INSIGHTS;
const alta = tiers.find((t) => t.id === 'alta');
const baja = tiers.find((t) => t.id === 'baja');

export default function ModelSection() {
  return (
    <section className="block" id="modelo">
      <div className="container">
        <div className="section-head">
          <h2>¿Qué tan bien funciona el modelo?</h2>
          <p>Medido sobre {meta.n_test.toLocaleString('es-AR')} llamadas que el modelo nunca vio al entrenar (20 % del total de {meta.n_total.toLocaleString('es-AR')}).</p>
        </div>

        <div className="metrics">
          <div className="card hover metric"><b>{num(meta.auc, 2)}</b><span>AUC · capacidad de ordenar clientes (0,5 = azar, 1 = perfecto)</span></div>
          <div className="card hover metric"><b>{pct(alta.real_rate)}</b><span>de los clientes de <strong>prioridad alta</strong> contrataron, contra {pct(meta.base_rate)} del total ({num(alta.lift)}×)</span></div>
          <div className="card hover metric"><b>{pct(alta.capture)}</b><span>de todas las contrataciones, llamando solo al {pct(alta.share)} de los clientes</span></div>
          <div className="card hover metric"><b>{num(meta.brier_raw, 3)} → {num(meta.brier_calibrated, 3)}</b><span>error de las probabilidades (Brier) antes y después de calibrar</span></div>
        </div>

        <div className="grid cols-2">
          <div className="card chart-card">
            <h3>Curva de ganancia</h3>
            <p className="cap">Si llamás primero a los mejor puntuados, encontrás las contrataciones mucho antes que al azar.</p>
            <GainsChart />
          </div>
          <div className="card chart-card">
            <h3>Calibración de probabilidades</h3>
            <p className="cap">Cerca de la diagonal = cuando el modelo dice “30 %”, de verdad contrata ~30 %. Cada punto agrupa casos similares.</p>
            <CalibrationChart />
          </div>
        </div>

        <div className="card" style={{ marginTop: 16, overflowX: 'auto' }}>
          <h3>Las tres prioridades</h3>
          <p>Se definen por la probabilidad calibrada y se verificaron en el set de test.</p>
          <table className="tiers" style={{ marginTop: 10 }}>
            <thead><tr><th>Prioridad</th><th>Regla</th><th>% de los clientes</th><th>Contrató realmente</th><th>vs. promedio</th><th>Contrataciones cubiertas</th></tr></thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.id}>
                  <td><span className={`chip ${TIER_META[t.id].tone}`}>{TIER_META[t.id].short}</span></td>
                  <td>{t.id === 'alta' ? `≥ ${pct(t.min)}` : t.id === 'media' ? `${pct(t.min)} – ${pct(tiers[0].min)}` : `< ${pct(tiers[1].min)}`}</td>
                  <td>{pct(t.share)}</td><td>{pct(t.real_rate, 1)}</td><td>{num(t.lift)}×</td><td>{pct(t.capture)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="callout">
          <span className="ico">⚖️</span>
          <div>
            <p><strong>Límites a tener en cuenta.</strong> Es un modelo para <em>priorizar</em>, no para descartar: la prioridad baja todavía contiene el {pct(baja.capture)} de las contrataciones.</p>
            <p>Además, los datos son de 2008–2010 y de un solo banco; el desempeño en otro contexto habría que volver a medirlo.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
