# Versión 1 — AWS (histórica, dada de baja)

Arquitectura original del proyecto (2025):

- **Frontend:** build de Vite subido a un bucket **S3** con website hosting.
- **Backend:** Flask (`backend/`) en una instancia **EC2** con Docker.
- **Inferencia:** `sagemaker_container/` — contenedor Flask que implementa el contrato de inferencia de SageMaker (`GET /ping`, `POST /invocations`, puerto 8080) más `/explain` con SHAP.

> **No se usó SageMaker administrado.** El contenedor corría simulado en la misma EC2 (ver `docker-compose.yml`); el backend lo llamaba por HTTP mediante `SAGEMAKER_ENDPOINT_URL`. El diseño sirve como base para migrar a un endpoint real.

Los recursos AWS fueron eliminados; este código se conserva sólo como referencia.

## Limitaciones conocidas de la v1 (corregidas en la v2)

- El formulario no enviaba `nr.employed`, variable que el modelo usa (se imputaba con 0).
- La UI mostraba invertido el significado de `prediction` (`1` = sí contrata).
- El historial usaba SQLite local, sin persistencia ante redeploys.
- No había límites de uso ni control de costos.
