# Arquitectura y decisiones

## Visión general

```mermaid
flowchart TB
    subgraph Cliente
      B[Navegador · React + Vite]
    end
    subgraph Vercel
      CDN[CDN estático<br/>frontend/dist]
      FN[Function Python · FastAPI<br/>POST /api/predict · GET /api/history · GET /api/health]
      G[Guard: validación + límites]
      MD[(models/model.json<br/>motor Python puro)]
    end
    subgraph Datos
      PG[(Neon Postgres<br/>tabla predictions)]
    end
    B -->|HTML/JS/CSS| CDN
    B -->|fetch /api/*| FN
    FN --> G --> MD
    G <--> PG
```

Todo vive bajo un mismo dominio (`bankml.mydatavibe.com`), así que no hay CORS ni URLs de API configurables en el frontend.

## Flujo de una predicción

1. El frontend envía el formulario a `POST /api/predict`.
2. **Validación** (Pydantic): enums y rangos derivados del dataset; campos extra rechazados; máximo 4 KB.
3. **Guard:** una sola consulta SQL cuenta predicciones del minuto/día por IP hasheada y del día global; si se excede algún tope responde `429` con `Retry-After`.
4. **Inferencia** (`api/_model.py`): preprocesamiento, ensamble de árboles y **TreeSHAP exacto** en Python puro (~40 ms).
5. Se registra `(predicción, probabilidad, ip_hash, fecha)` — **no se guardan los datos del formulario**.

## Decisiones y trade-offs

| Decisión | Motivo | Costo / alternativa |
|---|---|---|
| Serverless (Vercel Functions) | El modelo pesa 350 KB; no justifica un servidor siempre encendido. $0 fijo. | Cold start de algunos segundos tras inactividad. |
| Modelo exportado a JSON + motor en Python puro (en vez de cargar el `.joblib`) | LightGBM necesita `libgomp` (OpenMP), que el runtime de Vercel no trae: el deploy fallaba al importarlo. Al exportar el modelo desaparecen LightGBM, scikit-learn, pandas y numpy de producción: bundle y cold start menores y sin acoplamiento a versiones del pickle. | Hay que mantener el motor propio; un test de paridad (features, probabilidad y SHAP vs. LightGBM, tolerancia 1e-8) lo protege. |
| TreeSHAP propio en vez de la librería `shap` | Mismos valores exactos para árboles, sin numba/llvmlite. | Sólo válido para modelos de árboles. |
| Una invocación por consulta (predicción + explicación juntas) | La v1 hacía 2 requests; esto reduce a la mitad el consumo del free tier. | Respuesta algo más grande. |
| Límites en la aplicación y en base de datos | Los contadores compartidos funcionan aunque haya varias instancias; evitan que bots agoten la cuota. | Un `SELECT` extra por request; si la DB falla se degrada a contadores en memoria por instancia. |
| Neon Postgres en vez de SQLite | El filesystem de una función serverless es efímero. | Se duerme por inactividad (~1 s para despertar). |
| No guardar inputs | Minimiza datos y almacenamiento. | Menos riqueza para análisis posterior. |
| Preprocesamiento con semántica de entrenamiento | La v1 aplicaba `get_dummies(drop_first=True)` a un único registro y anulaba la variable `month` (26 % de predicciones distintas a las del lote). | El preprocesamiento vive en dos lugares (entrenamiento y API); el test de paridad los mantiene alineados. |

## v1 en AWS (histórico)

Frontend en S3 + backend Flask en EC2 (Docker). El modelo corría en un contenedor con el contrato de inferencia de SageMaker (`/ping`, `/invocations`), **pero no se usó SageMaker administrado**. Ver [`legacy/aws/README.md`](../legacy/aws/README.md).

## Qué haría para producción real

- **Serving:** endpoint de SageMaker (o batch transform) con auto-scaling, o un servicio containerizado detrás de un balanceador.
- **MLOps:** registry de modelos con versionado, pipeline de reentrenamiento y validación antes de promover.
- **Monitoreo:** drift de datos y de predicciones; las variables macroeconómicas son trimestrales y cambian el contexto.
- **Decisión de negocio:** umbral calibrado según costo de contacto vs. valor del depósito, en lugar de 0.5 fijo.
- **Seguridad:** autenticación del operador, auditoría y control de acceso a datos de clientes.
- **Calidad del modelo:** el dataset es de 2008–2010; evaluar con validación temporal y recalibrar.
