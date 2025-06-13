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

const numericHints = {
  age: "Edad del cliente entre 17 y 99 años.",
  duration: "Duración última llamada en segundos.",
  campaign: "Cantidad de contactos realizados durante la campaña actual.",
  pdays: "Días desde el último contacto previo (999 = no contactado).",
  previous: "Número de contactos previos.",
  "emp.var.rate": "Tasa de variación de empleo (ej: 1.1).",
  "cons.price.idx": "Índice de precios al consumidor.",
  "cons.conf.idx": "Índice de confianza del consumidor.",
  euribor3m: "Euribor a 3 meses en porcentaje."
};

export default function App() {
  const [input, setInput] = useState(initialInput);
  const [result, setResult] = useState(null);
  const [shapValues, setShapValues] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInput({ ...input, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/predict`, input);
      setResult(res.data);
      const resExplain = await axios.post(`${import.meta.env.VITE_API_URL}/explain`, input);
      setShapValues(resExplain.data.shap_values);
    } catch (err) {
      setResult({ error: err.message });
    }
  };

  return (
    <div style={{ backgroundColor: "#f5f7fa", minHeight: "100vh", paddingBottom: "2rem" }}>
      <div className="container pt-4">
        <div className="row align-items-start">
          {/* Izquierda: logo + descripción */}
          <div className="col-md-4 text-center text-md-start mb-4 mb-md-0">
            <img src={logo} alt="FIUBA Logo" height="100" className="mb-3" />
            <h2 className="fw-bold border-bottom pb-2">Predicción Inteligente Bancaria</h2>
            <p className="mt-3 text-muted">
              Este proyecto tiene como objetivo optimizar las campañas de marketing bancario mediante la predicción de qué clientes son más propensos a aceptar un depósito a plazo fijo. Utilizamos técnicas avanzadas de Machine Learning y análisis de datos para mejorar la eficiencia, reducir costos y personalizar la experiencia del cliente.
            </p>
            <p className="mt-3 text-muted">
              Este formulario permite ingresar datos de un posible cliente y, con base en un modelo de Machine Learning entrenado con LightGBM, predecir si suscribirá un depósito a plazo. La predicción se apoya en variables personales, históricas y económicas.
            </p>
          </div>

          {/* Derecha: tarjeta con formulario */}
          <div className="col-md-8">
            <div className="card shadow-sm">
              <div className="card-body">
                <h4 className="card-title mb-4">Formulario de Predicción</h4>
                <form onSubmit={handleSubmit} className="row g-3">
                  {Object.entries(initialInput).map(([key]) => (
                    <div key={key} className="col-md-4">
                      <label className="form-label">{key}</label>
                      {selectOptions[key] ? (
                        <select
                          className="form-select"
                          name={key}
                          value={input[key]}
                          onChange={handleChange}
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
                          placeholder={numericHints[key] || "Ingrese valor"}
                        />
                      )}
                      {numericHints[key] && (
                        <div className="form-text">{numericHints[key]}</div>
                      )}
                    </div>
                  ))}
                  <div className="col-12">
                    <button className="btn btn-primary" type="submit">
                      Predecir
                    </button>
                  </div>
                </form>

                {result && (
                  <div className="alert alert-info mt-4">
                    {result.error ? (
                      <div><strong>Error:</strong> {result.error}</div>
                    ) : (
                      <>
                        <strong>Predicción:</strong> {result.prediction} <br />
                        <strong>Probabilidad:</strong> {result.probability}
                      </>
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center mt-5 text-muted small">
        <hr />
        <p>
          © 2025 - Rodrigo Jurgen Pinedo Nava · Proyecto académico FIUBA · AWS + ML |
          {' '}<a href="https://github.com/rodri-iot/FIUBA-IoT_Machine-Learning" target="_blank" rel="noopener noreferrer">GitHub</a>
          {' '}|{' '}
          <a href="https://www.linkedin.com/in/rodrigopinedo/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </p>
      </footer>
    </div>
  );
}
