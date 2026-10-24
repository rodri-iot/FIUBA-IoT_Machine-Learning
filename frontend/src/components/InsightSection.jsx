import { PeriodChart } from './Charts.jsx';
import { INSIGHTS, pct } from '../lib/config.js';

export default function InsightSection() {
  const s = INSIGHTS.scenarios;
  const may08 = s.find((x) => x.label === 'May 2008');
  const crisis = s.filter((x) => !x.label.endsWith('2008') && x.n >= 150);
  const best = [...crisis].sort((a, b) => b.rate - a.rate)[0];
  return (
    <section className="block" id="hallazgo">
      <div className="container">
        <div className="section-head">
          <h2>El hallazgo: importa más <em>cuándo</em> llamás que <em>a quién</em></h2>
          <p>
            En 2008 la mayoría de las campañas convirtió entre el 3 % y el 6 %. En plena crisis (2009–2010) el banco llegó al {pct(best.rate)} ({best.label}).
            El modelo aprendió sobre todo eso: el contexto económico es la señal más fuerte.
          </p>
        </div>
        <div className="card chart-card">
          <h3>Tasa real de contratación por período</h3>
          <p className="cap">
            <span style={{ color: 'var(--low)' }}>■</span> 2008 &nbsp; <span style={{ color: 'var(--brand)' }}>■</span> 2009 &nbsp;
            <span style={{ color: 'var(--high)' }}>■</span> 2010 &nbsp;·&nbsp; la línea punteada es el promedio ({pct(INSIGHTS.meta.base_rate, 1)}).
          </p>
          <PeriodChart />
        </div>
        <div className="callout">
          <span className="ico">💡</span>
          <div>
            <p><strong>Probalo vos:</strong> cargá a Lucía y cambiá solo el período a “{may08.label}”. Mismo cliente, otra prioridad.</p>
            <p>Para un uso real convendría reentrenar con datos recientes, porque este patrón es propio de 2008–2010.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
