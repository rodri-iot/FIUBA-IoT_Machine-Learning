export default function FormInput({ formData }) {
  const fields = [
    { name: 'age', label: 'Edad' },
    { name: 'job', label: 'Ocupación' },
    { name: 'marital', label: 'Estado civil' },
    { name: 'education', label: 'Educación' },
    { name: 'default', label: '¿Tiene deuda anterior?' },
    { name: 'housing', label: '¿Tiene hipoteca?' },
    { name: 'loan', label: '¿Tiene préstamo?' },
    { name: 'contact', label: 'Medio de contacto' },
    { name: 'month', label: 'Mes de contacto' },
    { name: 'day_of_week', label: 'Día de la semana' },
    { name: 'duration', label: 'Duración llamada (segundos)' },
    { name: 'campaign', label: 'Veces contactado en campaña' },
    { name: 'pdays', label: 'Días desde último contacto' },
    { name: 'previous', label: 'Número de contactos previos' },
    { name: 'poutcome', label: 'Resultado anterior' },
    { name: 'emp.var.rate', label: 'Tasa de empleo' },
    { name: 'cons.price.idx', label: 'Índice de precios' },
    { name: 'cons.conf.idx', label: 'Índice de confianza' },
    { name: 'euribor3m', label: 'Euribor 3m' }
  ];

  return (
    <div className="form-grid">
      {fields.map(({ name, label }) => (
        <div key={name}>
          <label htmlFor={name}>{label}</label>
          <input
            name={name}
            value={formData[name]}
            readOnly
          />
        </div>
      ))}
    </div>
  );
}
