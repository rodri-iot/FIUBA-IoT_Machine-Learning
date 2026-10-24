import { useRef, useState } from 'react';
import ClientForm from './components/ClientForm.jsx';
import ResultPanel from './components/ResultPanel.jsx';
import ModelSection from './components/ModelSection.jsx';
import InsightSection from './components/InsightSection.jsx';
import ArchitectureSection from './components/ArchitectureSection.jsx';
import logo from './assets/logo-fiuba.png';
import { EMPTY_FORM, INSIGHTS, PRESETS, buildPayload, num, pct, validate } from './lib/config.js';

const GITHUB = 'https://github.com/rodri-iot/FIUBA-IoT_Machine-Learning';

export default function App() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [resultForm, setResultForm] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const tryRef = useRef(null);

  const onChange = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const predict = async (values) => {
    const e = validate(values);
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload(values)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 429 de la API (límite propio) o 429/403 del firewall de Vercel (respuesta sin JSON).
        const limited = res.status === 429 || res.status === 403;
        setError(limited ? (data.error || 'Demasiadas consultas seguidas. Esperá un minuto y probá de nuevo.')
          : 'No pudimos calcular el resultado. Probá de nuevo en unos segundos.');
        return;
      }
      setResult(data);
      setResultForm(values);
      if (window.innerWidth <= 920) requestAnimationFrame(() => document.getElementById('resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch {
      setError('No pudimos conectar con el servidor. Revisá tu conexión y probá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset) => {
    setForm(preset.form);
    predict(preset.form);
    tryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submit = (ev) => { ev.preventDefault(); predict(form); };
  const reset = () => { setForm(EMPTY_FORM); setErrors({}); setResult(null); setError(null); };

  return (
    <>
      <header className="topbar">
        <div className="container">
          <a className="brand" href="#top"><span className="brand-mark" aria-hidden="true">◎</span>Bank Propensity Scorer</a>
          <nav className="nav" aria-label="Secciones">
            <a href="#probar">Probar</a><a href="#modelo">Modelo</a><a href="#hallazgo">Hallazgo</a><a href="#arquitectura">Arquitectura</a>
            <a className="gh" href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="container">
            <span className="eyebrow">Machine Learning · Marketing bancario</span>
            <h1>Priorizá las llamadas con más chances de cerrar un <span>depósito a plazo</span></h1>
            <p className="lead">
              Un modelo entrenado con {INSIGHTS.meta.n_total.toLocaleString('es-AR')} llamadas reales estima qué tan probable es que un cliente contrate,
              te dice por qué y te sugiere a quién llamar primero.
            </p>
            <div className="hero-actions">
              <a className="btn primary" href="#probar">Probar ahora</a>
              <a className="btn" href="#arquitectura">Ver la arquitectura</a>
            </div>
            <div className="stats">
              <div className="stat"><b>{num(INSIGHTS.meta.auc, 2)}</b><span>AUC en datos nunca vistos</span></div>
              <div className="stat"><b>{num(INSIGHTS.tiers[0].lift)}×</b><span>más contrataciones en la prioridad alta</span></div>
              <div className="stat"><b>{pct(INSIGHTS.tiers[0].capture)}</b><span>de las ventas con el {pct(INSIGHTS.tiers[0].share)} de las llamadas</span></div>
            </div>
          </div>
        </section>

        <section className="block" id="probar" ref={tryRef}>
          <div className="container">
            <div className="section-head">
              <h2>Probalo con un cliente</h2>
              <p>Elegí un perfil de ejemplo para ver un resultado al instante, o cargá los datos de un cliente.</p>
            </div>
            <div className="presets">
              {PRESETS.map((p) => (
                <button key={p.id} type="button" className="preset" onClick={() => loadPreset(p)}>
                  <header><span className="avatar" aria-hidden="true">{p.name[0]}</span><span><strong>{p.name}</strong><small>{p.tag}</small></span></header>
                  <p>{p.story}</p>
                </button>
              ))}
            </div>
            <div className="try">
              <ClientForm form={form} errors={errors} loading={loading} onChange={onChange} onSubmit={submit} onReset={reset} />
              <ResultPanel result={result} form={resultForm ?? form} loading={loading} error={error} />
            </div>
          </div>
        </section>

        <ModelSection />
        <InsightSection />
        <ArchitectureSection />
      </main>

      <footer>
        <div className="container">
          <span><img src={logo} alt="FIUBA" />Proyecto académico · FIUBA · Ingeniería en IoT y Machine Learning</span>
          <span>Hecho en <a href="https://mydatavibe.com" target="_blank" rel="noreferrer">mydatavibe.com</a> · © 2026 Rodrigo Pinedo · <a href={GITHUB} target="_blank" rel="noreferrer">GitHub</a> · <a href="https://www.linkedin.com/in/rodrigopinedo/" target="_blank" rel="noreferrer">LinkedIn</a></span>
        </div>
      </footer>
    </>
  );
}
