import { useState } from 'react';
import './App.css';
import FormInput from './components/FormInput.jsx';
import FeatureTable from './components/FeatureTable.jsx';
import SHAP from './components/SHAP.jsx';
import logo from './assets/logo-fiuba.png';
import HistoryPanel from './components/HistoryPanel';


function App() {
  const [formData, setFormData] = useState({
    age: '', job: '', marital: '', education: '', default: '', housing: '', loan: '',
    contact: '', month: '', day_of_week: '', duration: '', campaign: '', pdays: '',
    previous: '', poutcome: '', 'emp.var.rate': '', 'cons.price.idx': '', 'cons.conf.idx': '', euribor3m: ''
  });
  const [result, setResult] = useState(null);
  const [shap, setShap] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const isValid = Object.entries(formData).every(([_, value]) => value !== '');
    if (!isValid) {
      alert("Por favor completa todos los campos antes de predecir.");
      return;
    }


    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/predict', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResult(data);

      const shapRes = await fetch(import.meta.env.VITE_API_URL + '/explain', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const shapData = await shapRes.json();
      setShap(shapData.shap_values);

    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al contactar el servidor de predicción.");
    }
  };

  const loadCase = (name) => {
    const cases = {
      rodrigo: {
        age: 35, job: 'technician', marital: 'single', education: 'university.degree', default: 'no',
        housing: 'yes', loan: 'no', contact: 'cellular', month: 'may', day_of_week: 'mon', duration: 100,
        campaign: 2, pdays: 999, previous: 0, poutcome: 'nonexistent', 'emp.var.rate': 1.1,
        'cons.price.idx': 93.994, 'cons.conf.idx': -36.4, euribor3m: 4.857
      },
      jurgen: {
        age: 45, job: 'admin.', marital: 'married', education: 'secondary', default: 'no',
        housing: 'yes', loan: 'yes', contact: 'telephone', month: 'jul', day_of_week: 'wed', duration: 150,
        campaign: 3, pdays: 7, previous: 1, poutcome: 'success', 'emp.var.rate': 1.4,
        'cons.price.idx': 92.893, 'cons.conf.idx': -46.2, euribor3m: 4.857
      },
      shirley: {
        age: 59, job: 'blue-collar', marital: 'married', education: 'basic.4y', default: 'no',
        housing: 'yes', loan: 'yes', contact: 'telephone', month: 'nov', day_of_week: 'thu', duration: 57,
        campaign: 3, pdays: 999, previous: 0, poutcome: 'nonexistent', 'emp.var.rate': -1.8, 
        'cons.price.idx': 92.893, 'cons.conf.idx': -46.2, euribor3m: 1.299
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
          <p><strong>Caso:</strong> Un operador del Banco “Portugal” realiza una <strong>llamada telefónica al cliente Rodrigo</strong> con el objetivo de convencerlo de que contrate un <strong>depósito a plazo</strong>.</p>
          <p><strong>Llamada:</strong> El operador completa el formulario con la información que Juan le brinda en tiempo real.</p>
          <p><strong>Machine Learning:</strong> Al presionar “Predecir”, el sistema utiliza un modelo entrenado con LightGBM para estimar si Juan aceptará o no la propuesta.</p>
          <p><strong>Resultado:</strong> Además de la predicción, el sistema muestra la <strong>importancia relativa de las variables (SHAP)</strong> utilizadas por el modelo para tomar la decisión.</p>
       <HistoryPanel />
      
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
              <button type="submit">Predecir</button>
            </div>
          </form>

          {result && (
            <div style={{ background: '#f0f8ff', padding: '1.5rem', borderRadius: '12px', maxWidth: '600px', margin: '1rem auto', border: '2px solid #ccc' }}>
              <h3 style={{ marginBottom: '1rem' }}>📊 Resultado del Modelo</h3>
              <p style={{ fontSize: '1.1rem' }}>
                <strong>Predicción:</strong>{' '}
                {result.prediction === 1 ? (
                  <span style={{ color: 'red', fontWeight: 'bold' }}>🔴 El cliente NO hará un depósito a plazo.</span>
                ) : (
                  <span style={{ color: 'green', fontWeight: 'bold' }}>🟢 El cliente SÍ hará un depósito a plazo.</span>
                )}
              </p>
              <p style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
                <strong>Probabilidad:</strong> {result.probability?.toFixed(4)}
              </p>
            </div>
          )}
            
          <SHAP shap={shap} />

           
        </div>

        
      </div>

      <FeatureTable />
            
      <footer style={{ marginTop: '2rem', fontSize: '0.8rem', textAlign: 'center', color: '#555' }}>
        © 2025 – Rodrigo Jurgen Pinedo Nava · Proyecto académico FIUBA · AWS + ML | <a href="https://github.com/rodri-iot/FIUBA-IoT_Machine-Learning/tree/main" target="_blank">GitHub</a> | <a href="https://www.linkedin.com/in/rodrigopinedo/" target="_blank">LinkedIn</a>
      </footer>
    </div>
  );
}

export default App;
