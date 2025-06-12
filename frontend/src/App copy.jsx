import { useState } from 'react';
import axios from 'axios';
import "bootstrap/dist/css/bootstrap.min.css";
import logo from './assets/logo-fiuba.png';

const initialInput = {
  age: 35,
  job: "technician",
  marital: "single",
  education: "university.degree",
  default: "no",
  housing: "yes",
  loan: "no",
  contact: "cellular",
  month: "may",
  day_of_week: "mon",
  duration: 100,
  campaign: 2,
  pdays: 999,
  previous: 0,
  poutcome: "nonexistent",
  "emp.var.rate": 1.1,
  "cons.price.idx": 93.994,
  "cons.conf.idx": -36.4,
  euribor3m: 4.857
};

const selectOptions = {
  job: ["admin.", "blue-collar", "entrepreneur", "housemaid", "management", "retired", "self-employed", "services", "student", "technician", "unemployed", "unknown"],
  marital: ["single", "married", "divorced", "unknown"],
  education: ["illiterate", "basic.4y", "basic.6y", "basic.9y", "high.school", "professional.course", "university.degree", "unknown"],
  default: ["yes", "no", "unknown"],
  housing: ["yes", "no", "unknown"],
  loan: ["yes", "no", "unknown"],
  contact: ["cellular", "telephone"],
  month: ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
  day_of_week: ["mon", "tue", "wed", "thu", "fri"],
  poutcome: ["failure", "nonexistent", "success"]
};

const fieldTooltips = {
  age: "Solo se aceptan valores numéricos entre 17 y 99 años",
  duration: "Duración de la última llamada en segundos (>=0)",
  campaign: "Cantidad de contactos realizados en esta campaña",
  pdays: "Días desde último contacto previo (999 si no hubo)",
  previous: "Número de contactos previos exitosos",
  "emp.var.rate": "Variación de tasa de empleo. Ej: 1.1",
  "cons.price.idx": "Índice de precios al consumidor",
  "cons.conf.idx": "Índice de confianza del consumidor",
  euribor3m: "Tasa del Euribor a 3 meses"
};

export default function App() {
  const [input, setInput] = useState(initialInput);
  const [result, setResult] = useState(null);
  const [shapValues, setShapValues] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInput({ ...input, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setShapValues(null);
    try {
      const res = await axios.post("http://localhost:8081/predict", input);
      setResult(res.data);
      const resExplain = await axios.post("http://localhost:8081/explain", input);
      setShapValues(resExplain.data.shap_values);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <header className="d-flex align-items-center justify-content-start mb-4">
        <img src={logo} alt="FIUBA Logo" height="60" className="me-2" />
        <span className="fs-4 fw-semibold me-2">|</span>
        <h1 className="mb-0 fs-4 fw-bold">Predicción Inteligente Bancaria</h1>
      </header>
      
      <div className="alert alert-secondary">
        Este modelo de Machine Learning predice si un cliente suscribirá un depósito a plazo.
        Se basa en características como edad, ocupación, historial de contacto y contexto económico.
        Está entrenado con LightGBM y desplegado en AWS SageMaker.
      </div>


      <h2 className="mb-4">Formulario de Predicción</h2>
      <form onSubmit={handleSubmit} className="row g-3">
        {Object.entries(initialInput).map(([key, value]) => (
          <div key={key} className="col-md-4">
            <label className="form-label">{key}</label>
            {selectOptions[key] ? (
              <select
                className="form-select"
                name={key}
                value={input[key]}
                onChange={handleChange}
                title={fieldTooltips[key] || ""}
                onFocus={(e) => {
                  if (fieldTooltips[key]) {
                    e.target.setAttribute("title", fieldTooltips[key]);
                  }
                }}
              >
                {selectOptions[key].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                step="any"
                className="form-control"
                name={key}
                value={input[key]}
                onChange={handleChange}
                required
                min={key === "age" ? 17 : undefined}
                max={key === "age" ? 99 : undefined}
                title={fieldTooltips[key] || ""}
                onFocus={(e) => {
                  if (fieldTooltips[key]) {
                    e.target.setAttribute("title", fieldTooltips[key]);
                  }
                }}
              />
            )}
          </div>
        ))}
        <div className="col-12">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Calculando..." : "Predecir"}
          </button>
        </div>
      </form>

      {result && (
        <div className="alert alert-info mt-4">
          {result.error ? (
            <div>Error: {result.error}</div>
          ) : (
            <div>
              <strong>Predicción:</strong> {result.prediction} <br />
              <strong>Probabilidad:</strong> {result.probability}
            </div>
          )}
        </div>
      )}

      {shapValues && (
        <div className="mt-4">
          <h5>Importancia de Variables (SHAP)</h5>
          <table className="table table-sm table-bordered mt-2">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Valor SHAP</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(shapValues)
                .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                .map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{value.toFixed(4)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <footer className="text-center mt-5 text-muted small">
        <hr />
        <p>
          © 2025 - Desarrollado por Rodrigo Jurgen Pinedo Nava · Proyecto académico FIUBA · AWS + ML
          {' '}<a href="https://github.com/rodri-iot/FIUBA-IoT_Machine-Learning" target="_blank" rel="noopener noreferrer">GitHub</a>
          {' '}|{' '}
          <a href="https://www.linkedin.com/in/rodrigopinedo/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </p>
      </footer>
    </div>
  );
}
