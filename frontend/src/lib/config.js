import insights from '../data/insights.json';

export const INSIGHTS = insights;
export const SCENARIOS = insights.scenarios;

const opts = (pairs) => pairs.map(([value, label]) => ({ value, label }));

export const JOBS = opts([
  ['admin.', 'Administrativo/a'], ['blue-collar', 'Obrero/a u operario/a'], ['entrepreneur', 'Emprendedor/a'],
  ['housemaid', 'Empleado/a doméstico/a'], ['management', 'Gerencia / dirección'], ['retired', 'Jubilado/a'],
  ['self-employed', 'Trabajador/a independiente'], ['services', 'Servicios / comercio'], ['student', 'Estudiante'],
  ['technician', 'Técnico/a'], ['unemployed', 'Sin empleo'], ['unknown', 'No informado'],
]);
export const MARITAL = opts([
  ['single', 'Soltero/a'], ['married', 'Casado/a'], ['divorced', 'Divorciado/a o viudo/a'], ['unknown', 'No informado'],
]);
export const EDUCATION = opts([
  ['illiterate', 'Sin estudios'], ['basic.4y', 'Primaria incompleta'], ['basic.6y', 'Primaria completa'],
  ['basic.9y', 'Secundaria básica'], ['high.school', 'Secundaria completa'],
  ['professional.course', 'Formación técnica / profesional'], ['university.degree', 'Universitaria'],
  ['unknown', 'No informado'],
]);
export const YES_NO_UNKNOWN = opts([['yes', 'Sí'], ['no', 'No'], ['unknown', 'No sabe']]);
export const CONTACT = opts([['cellular', 'Celular'], ['telephone', 'Teléfono fijo']]);

export const TIER_META = {
  alta: {
    label: 'Prioridad alta', short: 'Alta', tone: 'high', icon: '🔥',
    advice: 'Conviene llamar primero: este perfil tiene muchas más chances de contratar que el cliente promedio.',
  },
  media: {
    label: 'Prioridad media', short: 'Media', tone: 'mid', icon: '👍',
    advice: 'Llamar si hay capacidad: las chances son algo superiores al promedio.',
  },
  baja: {
    label: 'Prioridad baja', short: 'Baja', tone: 'low', icon: '🕓',
    advice: 'Las chances son menores al promedio. Conviene dejarlo para después o probar otro canal.',
  },
};

export const EMPTY_FORM = {
  age: '', job: '', marital: '', education: '', default: 'no', housing: '', loan: '',
  contact: 'cellular', campaign: 1, contactedBefore: 'no', previousOutcome: 'failure', periodId: '',
};

const periodId = (label) => SCENARIOS.find((s) => s.label === label)?.id ?? '';

export const PRESETS = [
  {
    id: 'lucia', name: 'Lucía', tag: '27 años · estudiante',
    story: 'Ya compró un producto en una campaña anterior. La llamamos en noviembre de 2009.',
    form: { ...EMPTY_FORM, age: 27, job: 'student', marital: 'single', education: 'university.degree',
      housing: 'no', loan: 'no', contactedBefore: 'yes', previousOutcome: 'success', periodId: periodId('Nov 2009') },
  },
  {
    id: 'elena', name: 'Elena', tag: '58 años · emprendedora',
    story: 'Una campaña anterior no la convenció. La llamamos en abril de 2009.',
    form: { ...EMPTY_FORM, age: 58, job: 'entrepreneur', marital: 'married', education: 'university.degree',
      housing: 'no', loan: 'no', contactedBefore: 'yes', previousOutcome: 'failure', periodId: periodId('Abr 2009') },
  },
  {
    id: 'carlos', name: 'Carlos', tag: '52 años · obrero',
    story: 'Primera llamada, con hipoteca y un préstamo personal. Mayo de 2008, por teléfono fijo.',
    form: { ...EMPTY_FORM, age: 52, job: 'blue-collar', marital: 'married', education: 'basic.4y',
      housing: 'yes', loan: 'yes', contact: 'telephone', campaign: 4, periodId: periodId('May 2008') },
  },
];

/** Traduce el formulario amigable a lo que espera la API (los mismos campos del dataset original). */
export function buildPayload(f) {
  const s = SCENARIOS.find((x) => x.id === f.periodId);
  const before = f.contactedBefore === 'yes';
  return {
    age: Number(f.age), job: f.job, marital: f.marital, education: f.education,
    default: f.default, housing: f.housing, loan: f.loan, contact: f.contact,
    month: s.month, day_of_week: 'mon', duration: 0, // el modelo ignora duración y día (data leakage / sin señal)
    campaign: Number(f.campaign),
    pdays: before ? 6 : 999, previous: before ? 1 : 0,
    poutcome: before ? f.previousOutcome : 'nonexistent',
    'emp.var.rate': s['emp.var.rate'], 'cons.price.idx': s['cons.price.idx'],
    'cons.conf.idx': s['cons.conf.idx'], euribor3m: s.euribor3m, 'nr.employed': s['nr.employed'],
  };
}

export function validate(f) {
  const e = {};
  const age = Number(f.age);
  if (!f.age || !Number.isInteger(age) || age < 18 || age > 99) e.age = 'Ingresá una edad entre 18 y 99.';
  if (!f.job) e.job = 'Elegí una ocupación.';
  if (!f.marital) e.marital = 'Elegí el estado civil.';
  if (!f.education) e.education = 'Elegí el nivel educativo.';
  if (!f.housing) e.housing = 'Indicá si tiene crédito hipotecario.';
  if (!f.loan) e.loan = 'Indicá si tiene un préstamo personal.';
  const c = Number(f.campaign);
  if (!Number.isInteger(c) || c < 1 || c > 30) e.campaign = 'Entre 1 y 30 contactos.';
  if (!f.periodId) e.periodId = 'Elegí en qué período se hace la llamada.';
  return e;
}

const label = (list, v) => list.find((o) => o.value === v)?.label ?? v;
const yn = (v) => ({ yes: 'Sí', no: 'No', unknown: 'No sabe' }[v]);

/** Agrupa las 19 contribuciones del modelo en factores comprensibles. */
export function groupFactors(contributions, f) {
  const sum = (pred) => Object.entries(contributions).filter(([k]) => pred(k)).reduce((a, [, v]) => a + v, 0);
  const period = SCENARIOS.find((x) => x.id === f.periodId);
  const before = f.contactedBefore === 'yes';
  const one = (k) => contributions[k] ?? 0;
  const list = [
    { key: 'context', label: 'Contexto económico del período', detail: period?.label,
      value: one('nr.employed') + one('economic_index'),
      hint: 'Empleo, tasas e índices del momento de la llamada.' },
    { key: 'history', label: 'Historial con campañas anteriores',
      detail: before ? (f.previousOutcome === 'success' ? 'Compró antes' : 'No compró antes') : 'Primer contacto',
      value: one('prev_contact') + sum((k) => k.startsWith('pout_')) },
    { key: 'campaign', label: 'Contactos en esta campaña', detail: `${f.campaign}`, value: one('campaign') },
    { key: 'age', label: 'Edad', detail: `${f.age} años`, value: one('age_bin') },
    { key: 'job', label: 'Ocupación', detail: label(JOBS, f.job), value: one('job_group') },
    { key: 'education', label: 'Nivel educativo', detail: label(EDUCATION, f.education), value: one('education_ord') },
    { key: 'marital', label: 'Estado civil', detail: label(MARITAL, f.marital), value: one('marital_code') },
    { key: 'housing', label: 'Crédito hipotecario', detail: yn(f.housing), value: one('housing_bin') },
    { key: 'loan', label: 'Préstamo personal', detail: yn(f.loan), value: one('loan_bin') },
    { key: 'default', label: 'Deudas en mora', detail: yn(f.default), value: one('default_bin') },
    { key: 'contact', label: 'Medio de contacto', detail: label(CONTACT, f.contact), value: one('contact_bin') },
    { key: 'season', label: 'Época del año', detail: period?.label.split(' ')[0], value: sum((k) => k.startsWith('month_')) },
  ];
  return list.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

export const pct = (v, digits = 0) =>
  new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: digits }).format(v);
export const num = (v, digits = 1) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: digits }).format(v);
