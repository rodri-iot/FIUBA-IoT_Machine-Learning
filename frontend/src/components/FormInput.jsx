export default function FormInput({ formData, handleChange}) {
  const selectFields  = {
    job: ['admin.', 'technician', 'blue-collar', 'entrepreneur', 'services', 'management', 'unemployed', 'self-employed', 'housemaid', 'retired', 'student', 'unknown'],
    marital: ['single', 'married', 'divorced'],
    education: ['basic.4y', 'basic.6y', 'basic.9y', 'high.school', 'university.degree', 'professional.course', 'illiterate', 'unknown'],
    default: ['yes', 'no'],
    housing: ['yes', 'no'],
    loan: ['yes', 'no'],
    contact: ['cellular', 'telephone'],
    month: ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'],
    day_of_week: ['mon','tue','wed','thu','fri'],
    poutcome: ['success', 'failure', 'nonexistent']
  };

   const numericFields = [
    'age', 'duration', 'campaign', 'pdays', 'previous',
    'emp.var.rate', 'cons.price.idx', 'cons.conf.idx', 'euribor3m'
  ];

  return (
    <div className="form-grid">
      {Object.entries(formData).map(([name, value]) => (
        <div key={name}>
          <label htmlFor={name}>{name}</label>
          {selectFields[name] ? (
            <select name={name} value={value} onChange={handleChange} required>
              <option value="">Seleccione</option>
              {selectFields[name].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : numericFields.includes(name) ? (
            <input
              type="number"
              name={name}
              value={value}
              onChange={handleChange}
              required
            />
          ) : (
            <input
              type="text"
              name={name}
              value={value}
              onChange={handleChange}
              required
            />
          )}
        </div>
      ))}
    </div>
  );
}
