import { useState } from 'react';
import './App.css';
import FormInput from './components/FormInput.jsx';
import FeatureTable from './components/FeatureTable.jsx';
import SHAP from './components/SHAP.jsx';
import logo from './assets/logo-fiuba.png';
import HistoryPanel from './components/HistoryPanel';
import ArchitectureSection from './components/ArchitectureSection.jsx';


function App() {
  const [formData, setFormData] = useState({
    age: '', job: '', marital: '', education: '', default: '', housing: '', loan: '',
    contact: '', month: '', day_of_week: '', duration: '', campaign: '', pdays: '',
    previous: '', poutcome: '', 'emp.var.rate': '', 'cons.price.idx': '', 'cons.conf.idx': '', euribor3m: '', 'nr.employed': ''
  });
  const [result, setResult] = useState(null);
  const [contributions, setContributions] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const isValid = Object.values(formData).every((value) => value !== '');
    if (!isValid) {
      alert("Por favor completa todos los campos antes de predecir.");
      return;
    }


    setLoading(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult(null); setContributions(null);
        setError(res.status === 429 ? data.error
          : res.status === 422 ? "Algún valor está fuera del rango permitido. Revisá la tabla de campos."
          : "Ocurrió un error al contactar el servidor de predicción.");
        return;
      }
      setResult(data);
      setContributions(data.contributions);
      setHistoryKey(k => k + 1);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al contactar el servidor de predicción.");
    } finally {
      setLoading(false);
    }
  };

  const loadCase = (name) => {
    const cases = {
      rodrigo: {
        age: 35, job: 'technician', marital: 'single', education: 'university.degree', default: 'no',
        housing: 'yes', loan: 'no', contact: 'cellular', month: 'may', day_of_week: 'mon', duration: 100,
        campaign: 2, pdays: 999, previous: 0, poutcome: 'nonexistent', 'emp.var.rate': 1.1,
        'cons.price.idx': 93.994, 'cons.conf.idx': -36.4, euribor3m: 4.857, 'nr.employed': 5191
      },
      jurgen: {
        age: 45, job: 'admin.', marital: 'married', education: 'high.school', default: 'no',
        housing: 'yes', loan: 'yes', contact: 'telephone', month: 'jul', day_of_week: 'wed', duration: 150,
        campaign: 3, pdays: 7, previous: 1, poutcome: 'success', 'emp.var.rate': 1.4,
        'cons.price.idx': 92.893, 'cons.conf.idx': -46.2, euribor3m: 4.857, 'nr.employed': 5228.1
      },
      shirley: {
        age: 59, job: 'blue-collar', marital: 'married', education: 'basic.4y', default: 'no',
        housing: 'yes', loan: 'yes', contact: 'telephone', month: 'nov', day_of_week: 'thu', duration: 57,
        campaign: 3, pdays: 999, previous: 0, poutcome: 'nonexistent', 'emp.var.rate': -1.8, 
        'cons.price.idx': 92.893, 'cons.conf.idx': -46.2, euribor3m: 1.299, 'nr.employed': 5099.1
      }
    };
    setFormData(cases[name]);
  };

  return (
    <div className="App" style={{ padding: '2rem', background: '#f5f5f5' }}>
     
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        <div style={{ flex: 1, maxWidth: '350px' }}>
          <img src={logo} alt="FIUBA logo" style={{ height: '100px', marginBottom: '1rem' }} />
          <h2 style={{ borderBottom: '2px solid black', paddingBottom: '0.5rem' }}>Predicción Inteligente Bancaria</h2>
          <p><strong>🧠 Simulación de una campaña de marketing telefónico real</strong></p>
          <p><strong>Objetivo:</strong> Predecir si un cliente hara un <strong>depósito a plazo</strong>.</p>
          <p><strong>Caso:</strong> Un operador del Banco “Portugal” realiza una <strong>llamada telefónica al cliente</strong> con el objetivo de convencerlo de que contrate un <strong>depósito a plazo</strong>.</p>
          <p><strong>Llamada:</strong> El operador completa el formulario con la información que el cliente le brinda en tiempo real.</p>
          <p><strong>Machine Learning:</strong> Al presionar “Predecir”, el sistema utiliza un modelo entrenado con LightGBM para estimar si el cliente aceptará o no la propuesta.</p>
          <p><strong>Resultado:</strong> Además de la predicción, el sistema muestra la <strong>importancia relativa de las variables (SHAP)</strong> utilizadas por el modelo para tomar la decisión.</p>
       <HistoryPanel refreshKey={historyKey} />
      
        </div>

        <div style={{ flex: 2 }}>
          <h3>Formulario de Predicción</h3>
          <p style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
            Selecciona un caso precargado para simular la predicción:
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button onClick={() => loadCase('rodrigo')}>📋 Caso Rodrigo</button>
            <button onClick={() => loadCase('jurgen')}>📋 Caso Jurgen</button>
            <button onClick={() => loadCase('shirley')}>📋 Caso Shirley</button>
          </div>

          <form onSubmit={handleSubmit} className="form-card">
            <FormInput formData={formData} handleChange={handleChange} />

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button type="submit" disabled={loading}>{loading ? 'Consultando el modelo…' : 'Predecir'}</button>
            </div>
          </form>

          {error && (
            <div role="alert" style={{ background: '#fff3f3', color: '#a33', padding: '1rem', borderRadius: '12px', maxWidth: '600px', margin: '1rem auto', border: '1px solid #e0a0a0' }}>{error}</div>
          )}

          {result && (
            <div style={{ background: '#f0f8ff', padding: '1.5rem', borderRadius: '12px', maxWidth: '600px', margin: '1rem auto', border: '2px solid #ccc' }}>
              <h3 style={{ marginBottom: '1rem' }}>📊 Resultado del Modelo</h3>
              <p style={{ fontSize: '1.1rem' }}>
                <strong>Predicción:</strong>{' '}
                {result.prediction === 1 ? (
                  <span style={{ color: 'green', fontWeight: 'bold' }}>🟢 El cliente SÍ hará un depósito a plazo.</span>
                ) : (
                  <span style={{ color: 'red', fontWeight: 'bold' }}>🔴 El cliente NO hará un depósito a plazo.</span>
                )}
              </p>
              <p style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
                <strong>Probabilidad de “sí”:</strong> {result.probability?.toFixed(4)}
              </p>
            </div>
          )}
            
          <SHAP contributions={contributions} />

           
        </div>

        
      </div>

      <FeatureTable />

      <ArchitectureSection />
            
      <footer style={{ marginTop: '2rem', fontSize: '0.8rem', textAlign: 'center', color: '#555' }}>
        © 2025 – Rodrigo Jurgen Pinedo Nava · Proyecto académico FIUBA · ML en Vercel (v1 en AWS) | <a href="https://github.com/rodri-iot/FIUBA-IoT_Machine-Learning/tree/main" target="_blank">GitHub</a> | <a href="https://www.linkedin.com/in/rodrigopinedo/" target="_blank">LinkedIn</a>
      </footer>
    </div>
  );
}

export default App;
