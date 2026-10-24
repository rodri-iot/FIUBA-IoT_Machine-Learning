"""Paridad del motor en Python puro contra el pipeline original (sklearn + LightGBM).

Se compara contra la inferencia EN LOTE (la semántica de entrenamiento). La inferencia
fila por fila del pipeline original difiere por get_dummies(drop_first=True) sobre un
único registro; ese comportamiento era un bug de la v1.
Requiere requirements-train.txt; se omite si no está instalado.
"""
import math
import sys
import warnings
from pathlib import Path

import pytest

np = pytest.importorskip("numpy")
pd = pytest.importorskip("pandas")
joblib = pytest.importorskip("joblib")
pytest.importorskip("lightgbm")
warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "ml"))
sys.path.insert(0, str(ROOT / "api"))

from _model import Model  # noqa: E402


@pytest.fixture(scope="module")
def setup():
    pipeline = joblib.load(ROOT / "models" / "pipeline_model.joblib")
    df = pd.read_csv(ROOT / "data" / "raw" / "bank-additional-full.csv", sep=";").drop(columns=["y"])
    sample = df.sample(400, random_state=11).reset_index(drop=True)
    return pipeline, sample, Model()


def test_features_probability_and_contributions_match_lightgbm(setup):
    pipeline, sample, model = setup
    prep, clf = pipeline.named_steps["preprocessing"], pipeline.named_steps["classifier"]
    X = prep.transform(sample)
    ref_proba = pipeline.predict_proba(sample)[:, 1]
    ref_contrib = clf.predict(X, pred_contrib=True)  # (n, 19+1) con sesgo al final

    for i, row in sample.iterrows():
        x = model.encode(row.to_dict())
        assert np.allclose(x, X.iloc[i].to_numpy(dtype=float), atol=1e-9), f"features fila {i}"
        assert math.isclose(model.probability(x), ref_proba[i], abs_tol=1e-9), f"proba fila {i}"
        contrib = model.contributions(x)
        assert np.allclose(contrib, ref_contrib[i, :-1], atol=1e-8), f"shap fila {i}"
    assert math.isclose(model.base_value, ref_contrib[0, -1], abs_tol=1e-8)
