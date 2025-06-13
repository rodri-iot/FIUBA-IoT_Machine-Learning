import './FeatureTable.css';

const features = [
  { field: 'age', label: 'Edad del cliente', type: 'número', values: '18–99' },
  { field: 'job', label: 'Ocupación', type: 'texto', values: 'admin., technician, etc.' },
  { field: 'marital', label: 'Estado civil', type: 'texto', values: 'single, married, etc.' },
  { field: 'education', label: 'Educación', type: 'texto', values: 'primary, secondary, etc.' },
  { field: 'default', label: 'Deuda anterior', type: 'sí/no', values: 'yes, no' },
  { field: 'housing', label: 'Hipoteca', type: 'sí/no', values: 'yes, no' },
  { field: 'loan', label: 'Préstamo', type: 'sí/no', values: 'yes, no' },
  { field: 'contact', label: 'Medio de contacto', type: 'texto', values: 'cellular, telephone' },
  { field: 'month', label: 'Mes del contacto', type: 'texto', values: 'may, jun, jul, etc.' },
  { field: 'day_of_week', label: 'Día del contacto', type: 'texto', values: 'mon, tue, etc.' },
  { field: 'duration', label: 'Duración llamada', type: 'número', values: 'segundos' },
  { field: 'campaign', label: 'Contactos en campaña', type: 'número', values: '1–30' },
  { field: 'pdays', label: 'Días desde último contacto', type: 'número', values: '999 = nunca' },
  { field: 'previous', label: 'Contactos previos', type: 'número', values: '0–N' },
  { field: 'poutcome', label: 'Resultado anterior', type: 'texto', values: 'success, failure, nonexistent' },
  { field: 'emp.var.rate', label: 'Tasa de empleo', type: 'número', values: '1.1, 1.4, etc.' },
  { field: 'cons.price.idx', label: 'Índice precios', type: 'número', values: 'ej. 93.994' },
  { field: 'cons.conf.idx', label: 'Índice confianza', type: 'número', values: 'ej. -36.4' },
  { field: 'euribor3m', label: 'Euribor a 3 meses', type: 'número', values: 'ej. 4.857' }
];

export default function FeatureTable() {
  return (
    <div className="feature-cards-container">
      <details>
        <summary className="accordion-title">ℹ️ ¿Qué significa cada campo?</summary>
        <div className="feature-cards">
          {features.map(({ field, label, type, values }) => (
            <div key={field} className="feature-card">
              <h4>{field}</h4>
              <p><strong>Descripción:</strong> {label}</p>
              <p><strong>Formato:</strong> {type}</p>
              <p><strong>Valores:</strong> {values}</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
