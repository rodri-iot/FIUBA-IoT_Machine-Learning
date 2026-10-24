"""API de predicción (Vercel Function, FastAPI).

Un único endpoint de inferencia devuelve predicción + contribuciones por variable,
así cada consulta de un usuario consume UNA sola invocación (cuida el free tier).
"""
import sys
from pathlib import Path
from typing import Literal

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI, Request  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from pydantic import BaseModel, ConfigDict, Field  # noqa: E402

from _guard import Guard, client_ip  # noqa: E402
from _model import Model  # noqa: E402

MAX_BODY_BYTES = 4096

model = Model()  # inferencia en Python puro (ver api/_model.py)
guard = Guard()

app = FastAPI(title="Bank ML API", docs_url=None, redoc_url=None, openapi_url=None)


class PredictionInput(BaseModel):
    """Contrato de entrada. Rangos = rango observado en el dataset + margen."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    age: int = Field(ge=17, le=100)
    job: Literal["admin.", "blue-collar", "entrepreneur", "housemaid", "management", "retired",
                 "self-employed", "services", "student", "technician", "unemployed", "unknown"]
    marital: Literal["divorced", "married", "single", "unknown"]
    education: Literal["basic.4y", "basic.6y", "basic.9y", "high.school", "illiterate",
                       "professional.course", "university.degree", "unknown"]
    default: Literal["yes", "no", "unknown"]
    housing: Literal["yes", "no", "unknown"]
    loan: Literal["yes", "no", "unknown"]
    contact: Literal["cellular", "telephone"]
    month: Literal["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    day_of_week: Literal["mon", "tue", "wed", "thu", "fri"]
    duration: int = Field(default=0, ge=0, le=6000)  # el modelo lo descarta (data leakage)
    campaign: int = Field(ge=1, le=60)
    pdays: int = Field(ge=0, le=999)
    previous: int = Field(ge=0, le=10)
    poutcome: Literal["failure", "nonexistent", "success"]
    emp_var_rate: float = Field(alias="emp.var.rate", ge=-5, le=3)
    cons_price_idx: float = Field(alias="cons.price.idx", ge=90, le=96)
    cons_conf_idx: float = Field(alias="cons.conf.idx", ge=-60, le=-20)
    euribor3m: float = Field(ge=0, le=6)
    nr_employed: float = Field(alias="nr.employed", ge=4800, le=5400)


def _error(status: int, message: str, retry_after: int | None = None) -> JSONResponse:
    headers = {"Retry-After": str(retry_after)} if retry_after else None
    return JSONResponse({"error": message, "retry_after": retry_after}, status_code=status, headers=headers)


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > MAX_BODY_BYTES:
        return _error(413, "Payload demasiado grande")
    return await call_next(request)


@app.get("/api/health")
def health():
    return {"status": "ok", "model_features": len(model.feature_names), "trees": len(model.trees)}


@app.post("/api/predict")
def predict(payload: PredictionInput, request: Request):
    decision = guard.check(client_ip(request))
    if not decision.allowed:
        return _error(429, decision.message, decision.retry_after)

    x = model.encode(payload.model_dump(by_alias=True))
    score = model.probability(x)
    probability = model.calibrated_probability(x)
    tier = model.tier(probability)
    contributions = {n: round(v, 4) for n, v in zip(model.feature_names, model.contributions(x))}
    contributions = dict(sorted(contributions.items(), key=lambda kv: abs(kv[1]), reverse=True))

    guard.record(client_ip(request))
    return {
        "tier": tier,  # prioridad de llamada: alta | media | baja
        "probability": round(probability, 4),  # calibrada: coincide con la tasa real observada
        "base_rate": round(model.base_rate, 4),
        "lift": round(probability / model.base_rate, 2),  # veces más probable que un cliente promedio
        "score": round(score, 4),  # score crudo del modelo (no es una probabilidad real)
        "contributions": contributions,
        "base_value": round(model.base_value, 4),
    }


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception):
    return _error(500, "Error interno")


# Vercel detecta el objeto ASGI `app`.
