import json
import math
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "api"))

import index  # noqa: E402
import _guard  # noqa: E402

SAMPLE = {
    "age": 32, "job": "admin.", "marital": "single", "education": "university.degree",
    "default": "no", "housing": "yes", "loan": "no", "contact": "cellular", "month": "may",
    "day_of_week": "mon", "duration": 720, "campaign": 1, "pdays": 999, "previous": 0,
    "poutcome": "nonexistent", "emp.var.rate": -1.1, "cons.price.idx": 93.918,
    "cons.conf.idx": -42.0, "euribor3m": 1.344, "nr.employed": 5099.1,
}


@pytest.fixture(autouse=True)
def fresh_guard(monkeypatch):
    monkeypatch.setattr(index, "guard", _guard.Guard())
    monkeypatch.setattr(_guard, "LIMIT_PER_MIN", 6)


client = TestClient(index.app)


def test_predict_returns_prediction_and_contributions():
    r = client.post("/api/predict", json=SAMPLE)
    assert r.status_code == 200
    body = r.json()
    assert body["tier"] in ("alta", "media", "baja")
    assert 0 <= body["probability"] <= 1 and 0 <= body["score"] <= 1
    assert math.isclose(body["lift"], body["probability"] / body["base_rate"], abs_tol=0.02)
    assert len(body["contributions"]) == 19


def test_contributions_reconstruct_model_score():
    body = client.post("/api/predict", json=SAMPLE).json()
    logit = body["base_value"] + sum(body["contributions"].values())
    assert math.isclose(1 / (1 + math.exp(-logit)), body["score"], abs_tol=2e-3)


def test_calibrated_probability_is_below_raw_score_and_tier_matches():
    body = client.post("/api/predict", json=SAMPLE).json()
    assert body["probability"] < body["score"]  # el score crudo está inflado por scale_pos_weight
    expected = "alta" if body["probability"] >= 0.30 else "media" if body["probability"] >= 0.12 else "baja"
    assert body["tier"] == expected


def test_numbers_as_strings_are_accepted():
    payload = {k: (str(v) if isinstance(v, (int, float)) else v) for k, v in SAMPLE.items()}
    assert client.post("/api/predict", json=payload).status_code == 200


@pytest.mark.parametrize("patch", [{"age": 5}, {"job": "astronaut"}, {"nr.employed": 10}, {"extra": 1}])
def test_invalid_input_rejected(patch):
    assert client.post("/api/predict", json={**SAMPLE, **patch}).status_code == 422


def test_missing_field_rejected():
    payload = dict(SAMPLE); payload.pop("nr.employed")
    assert client.post("/api/predict", json=payload).status_code == 422


def test_oversized_body_rejected():
    r = client.post("/api/predict", content=json.dumps({**SAMPLE, "pad": "x" * 6000}),
                    headers={"content-type": "application/json"})
    assert r.status_code == 413


def test_per_minute_rate_limit():
    codes = [client.post("/api/predict", json=SAMPLE).status_code for _ in range(8)]
    assert codes[:6] == [200] * 6
    assert codes[6:] == [429, 429]
    r = client.post("/api/predict", json=SAMPLE)
    assert r.headers["retry-after"] == "60"


def test_per_day_limit_per_ip(monkeypatch):
    monkeypatch.setattr(_guard, "LIMIT_PER_DAY_IP", 3)
    monkeypatch.setattr(_guard, "LIMIT_PER_MIN", 100)
    ip = {"x-forwarded-for": "9.9.9.9"}
    codes = [client.post("/api/predict", json=SAMPLE, headers=ip).status_code for _ in range(5)]
    assert codes == [200, 200, 200, 429, 429]
    other = client.post("/api/predict", json=SAMPLE, headers={"x-forwarded-for": "8.8.8.8"})
    assert other.status_code == 200  # el límite es por IP


def test_no_history_endpoint():
    assert client.get("/api/history").status_code == 404


def test_health():
    body = client.get("/api/health").json()
    assert body["status"] == "ok" and "db" not in body
