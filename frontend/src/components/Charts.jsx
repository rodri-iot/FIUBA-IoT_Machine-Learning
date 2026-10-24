import { INSIGHTS, pct } from '../lib/config.js';

const W = 460, H = 240, PAD = { l: 44, r: 12, t: 12, b: 36 };
const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
const x = (v) => PAD.l + v * iw;
const y = (v) => PAD.t + (1 - v) * ih;
const ticks = [0, 0.25, 0.5, 0.75, 1];

function Frame({ children, xLabel, yLabel }) {
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img">
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} />
          <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end">{pct(t)}</text>
          <text x={x(t)} y={H - 18} textAnchor="middle">{pct(t)}</text>
        </g>
      ))}
      <text x={PAD.l + iw / 2} y={H - 3} textAnchor="middle">{xLabel}</text>
      <text transform={`translate(11 ${PAD.t + ih / 2}) rotate(-90)`} textAnchor="middle">{yLabel}</text>
      {children}
    </svg>
  );
}

/** Curva de ganancia: qué % de los clientes que contratan se encuentra llamando al X % mejor puntuado. */
export function GainsChart() {
  const pts = [[0, 0], ...INSIGHTS.deciles.map((d) => [d.decile / 10, d.capture_cum])];
  const path = pts.map(([a, b], i) => `${i ? 'L' : 'M'}${x(a)},${y(b)}`).join(' ');
  return (
    <Frame xLabel="% de llamadas (mejor puntuados primero)" yLabel="% de contrataciones encontradas">
      <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="var(--muted)" strokeDasharray="5 5" opacity=".6" />
      <path d={`${path} L${x(1)},${y(0)} L${x(0)},${y(0)} Z`} fill="var(--brand)" opacity=".12" />
      <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2.5" />
      {pts.slice(1).map(([a, b]) => <circle key={a} cx={x(a)} cy={y(b)} r="3.5" fill="var(--brand)" />)}
      <text x={x(0.55)} y={y(0.43)} fill="var(--muted)">llamando al azar</text>
    </Frame>
  );
}

/** Calibración: la probabilidad que el modelo dice vs. lo que realmente pasó. */
export function CalibrationChart() {
  const pts = INSIGHTS.calibration;
  return (
    <Frame xLabel="probabilidad que predice el modelo" yLabel="proporción que realmente contrató">
      <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="var(--muted)" strokeDasharray="5 5" opacity=".6" />
      {pts.map((p) => (
        <circle key={p.label} cx={x(p.predicted)} cy={y(p.real)} r={4 + Math.sqrt(p.n) / 9} fill="var(--high)" opacity=".75">
          <title>{`${p.label}: predice ${pct(p.predicted)}, real ${pct(p.real)} (${p.n} casos)`}</title>
        </circle>
      ))}
    </Frame>
  );
}

/** Tasa real de contratación por período: el contexto económico pesa más que el perfil. */
export function PeriodChart() {
  const data = INSIGHTS.scenarios;
  const max = 0.7, h = 220, bw = 14, gap = 6, left = 40;
  const width = left + data.length * (bw + gap);
  const yy = (v) => 10 + (1 - v / max) * (h - 44);
  const year = (s) => s.label.split(' ')[1];
  const colors = { 2008: 'var(--low)', 2009: 'var(--brand)', 2010: 'var(--high)' };
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${h}`} role="img" aria-label="Tasa de contratación por período">
      {[0, 0.2, 0.4, 0.6].map((t) => (
        <g key={t}><line className="grid" x1={left} x2={width} y1={yy(t)} y2={yy(t)} /><text x={left - 6} y={yy(t) + 4} textAnchor="end">{pct(t)}</text></g>
      ))}
      <line x1={left} x2={width} y1={yy(INSIGHTS.meta.base_rate)} y2={yy(INSIGHTS.meta.base_rate)} stroke="var(--text)" strokeDasharray="4 4" opacity=".5" />
      {data.map((s, i) => (
        <g key={s.id}>
          <rect x={left + i * (bw + gap)} y={yy(s.rate)} width={bw} height={yy(0) - yy(s.rate)} rx="3" fill={colors[year(s)]}>
            <title>{`${s.label}: contrató el ${pct(s.rate, 1)} (${s.n} llamadas)`}</title>
          </rect>
          {(i % 3 === 0) && <text x={left + i * (bw + gap) + bw / 2} y={h - 8} textAnchor="middle" style={{ fontSize: 9 }}>{s.label.replace(' 20', " '")}</text>}
        </g>
      ))}
    </svg>
  );
}
