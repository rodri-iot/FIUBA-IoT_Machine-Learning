import { CONTACT, EDUCATION, JOBS, MARITAL, SCENARIOS, YES_NO_UNKNOWN, pct } from '../lib/config.js';

function Segmented({ name, value, onChange, options, ariaLabel }) {
  return (
    <div className="seg" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <label key={o.value}>
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(name, o.value)} />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function Select({ id, value, onChange, options, error, placeholder = 'Elegí una opción' }) {
  return (
    <select id={id} name={id} value={value} onChange={(e) => onChange(id, e.target.value)} className={error ? 'invalid' : ''}
      aria-invalid={Boolean(error)}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

const Err = ({ msg }) => (msg ? <span className="error" role="alert">{msg}</span> : null);
const years = [...new Set(SCENARIOS.map((s) => s.label.split(' ')[1]))];

export default function ClientForm({ form, errors, loading, onChange, onSubmit, onReset }) {
  return (
    <form className="card" onSubmit={onSubmit} noValidate>
      <fieldset>
        <legend><span className="num">1</span> Datos del cliente</legend>
        <div className="fields">
          <div className="field">
            <label htmlFor="age">Edad</label>
            <input id="age" type="number" inputMode="numeric" min="18" max="99" value={form.age}
              onChange={(e) => onChange('age', e.target.value)} className={errors.age ? 'invalid' : ''} aria-invalid={Boolean(errors.age)} />
            <Err msg={errors.age} />
          </div>
          <div className="field">
            <label htmlFor="job">Ocupación</label>
            <Select id="job" value={form.job} onChange={onChange} options={JOBS} error={errors.job} />
            <Err msg={errors.job} />
          </div>
          <div className="field">
            <label htmlFor="marital">Estado civil</label>
            <Select id="marital" value={form.marital} onChange={onChange} options={MARITAL} error={errors.marital} />
            <Err msg={errors.marital} />
          </div>
          <div className="field">
            <label htmlFor="education">Nivel educativo</label>
            <Select id="education" value={form.education} onChange={onChange} options={EDUCATION} error={errors.education} />
            <Err msg={errors.education} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend><span className="num">2</span> Situación financiera</legend>
        <div className="fields">
          <div className="field">
            <span className="label" id="l-housing">¿Tiene crédito hipotecario?</span>
            <Segmented name="housing" value={form.housing} onChange={onChange} options={YES_NO_UNKNOWN} ariaLabel="Crédito hipotecario" />
            <Err msg={errors.housing} />
          </div>
          <div className="field">
            <span className="label">¿Tiene un préstamo personal?</span>
            <Segmented name="loan" value={form.loan} onChange={onChange} options={YES_NO_UNKNOWN} ariaLabel="Préstamo personal" />
            <Err msg={errors.loan} />
          </div>
          <div className="field full">
            <span className="label">¿Tiene deudas en mora?</span>
            <Segmented name="default" value={form.default} onChange={onChange} options={YES_NO_UNKNOWN} ariaLabel="Deudas en mora" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend><span className="num">3</span> La llamada</legend>
        <div className="fields">
          <div className="field">
            <span className="label">Medio de contacto</span>
            <Segmented name="contact" value={form.contact} onChange={onChange} options={CONTACT} ariaLabel="Medio de contacto" />
          </div>
          <div className="field">
            <label htmlFor="campaign">Contactos en esta campaña</label>
            <input id="campaign" type="number" inputMode="numeric" min="1" max="30" value={form.campaign}
              onChange={(e) => onChange('campaign', e.target.value)} className={errors.campaign ? 'invalid' : ''} />
            <span className="help">Incluí la llamada actual.</span>
            <Err msg={errors.campaign} />
          </div>
          <div className="field">
            <span className="label">¿Lo contactaron en campañas anteriores?</span>
            <Segmented name="contactedBefore" value={form.contactedBefore} onChange={onChange}
              options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Sí' }]} ariaLabel="Contacto previo" />
          </div>
          {form.contactedBefore === 'yes' && (
            <div className="field">
              <span className="label">¿Cómo terminó esa vez?</span>
              <Segmented name="previousOutcome" value={form.previousOutcome} onChange={onChange}
                options={[{ value: 'success', label: 'Compró' }, { value: 'failure', label: 'No compró' }]} ariaLabel="Resultado anterior" />
            </div>
          )}
          <div className="field full">
            <label htmlFor="periodId">¿Cuándo se hace la llamada?</label>
            <select id="periodId" value={form.periodId} onChange={(e) => onChange('periodId', e.target.value)}
              className={errors.periodId ? 'invalid' : ''} aria-invalid={Boolean(errors.periodId)}>
              <option value="">Elegí un período</option>
              {years.map((y) => (
                <optgroup key={y} label={y}>
                  {SCENARIOS.filter((s) => s.label.endsWith(y)).map((s) => (
                    <option key={s.id} value={s.id}>{s.label} — contrató el {pct(s.rate)} de los llamados</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <span className="help">Con esto se completan solos el empleo, las tasas y los índices económicos de ese momento.</span>
            <Err msg={errors.periodId} />
          </div>
        </div>
      </fieldset>

      <div className="form-actions">
        <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Calculando…' : 'Calcular prioridad'}</button>
        <button className="btn" type="button" onClick={onReset}>Limpiar</button>
      </div>
    </form>
  );
}
