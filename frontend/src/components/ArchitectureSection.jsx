import VersionsDiagram from './VersionsDiagram.jsx';

const FLOW = [
  ['Formulario', 'El usuario responde unas pocas preguntas en español. La app las traduce al formato del modelo (19 variables).'],
  ['CDN y firewall de Vercel', 'Sirve la app React estática desde bankml.mydatavibe.com y frena a más de 20 pedidos por minuto por IP antes de llegar a la función.'],
  ['Función Python', 'FastAPI valida cada campo, aplica un límite por IP y responde en ~40 ms.'],
  ['Motor del modelo', '100 árboles LightGBM exportados a JSON; predicción, calibración y TreeSHAP en Python puro.'],
];

const DECISIONS = [
  ['Serverless y gratis', 'El modelo pesa 221 KB: no justifica un servidor siempre prendido. Todo corre en planes gratuitos, con firewall y un límite por IP contra el abuso.'],
  ['Motor propio en lugar del .joblib', 'LightGBM necesita libgomp, que Vercel no incluye. Se exportó el modelo a JSON y se reimplementó la inferencia; un test de paridad lo compara contra LightGBM (tolerancia 1e-8).'],
  ['Probabilidad calibrada', 'El entrenamiento con scale_pos_weight infla las probabilidades. Se calibró (Platt) y se midió: el error Brier baja a la mitad.'],
  ['Una sola llamada por consulta', 'La v1 hacía dos requests (predicción y explicación). Ahora una devuelve todo, usando la mitad de la cuota.'],
  ['Preprocesamiento fiel al entrenamiento', 'La v1 anulaba la variable "mes" en inferencia individual (get_dummies con una sola fila). Se corrigió y se testea.'],
  ['Sin estado persistente', 'La demo no tiene base de datos ni guarda las respuestas del formulario: menos piezas, nada que proteger ni que migrar.'],
];

export default function ArchitectureSection() {
  return (
    <section className="block" id="arquitectura">
      <div className="container">
        <div className="section-head">
          <h2>Arquitectura</h2>
          <p>De una app en AWS a una arquitectura serverless, medida, testeada y sin costos fijos.</p>
        </div>

        <h3 style={{ margin: '0 0 12px' }}>Cómo viaja una consulta</h3>
        <div className="flow">
          {FLOW.map(([t, d]) => (
            <div className="card hover step" key={t}><h4>{t}</h4><p>{d}</p></div>
          ))}
        </div>

        <h3 style={{ margin: '28px 0 12px' }}>De la v1 a la v2</h3>
        <VersionsDiagram />

        <h3 style={{ margin: '28px 0 12px' }}>Decisiones de diseño</h3>
        <div className="grid cols-3">
          {DECISIONS.map(([t, d]) => (<div className="card hover" key={t}><h3>{t}</h3><p>{d}</p></div>))}
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3>Si esto fuera a producción</h3>
          <ul>
            <li>Servir el modelo en un endpoint administrado (SageMaker u otro) con escalado automático y versionado en un registry.</li>
            <li>Reentrenar con datos recientes y validar en el tiempo (el patrón actual es propio de 2008–2010).</li>
            <li>Monitorear drift de datos y de predicciones; elegir el umbral por costo de contacto vs. valor del depósito.</li>
            <li>Autenticación del operador, auditoría y control de acceso a los datos de clientes.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
