"""Exporta el pipeline entrenado (.joblib) a un formato portable.

Genera:
  - models/model.json                 modelo + calibración + umbrales de prioridad (API)
  - frontend/src/data/insights.json   métricas, lift, calibración y escenarios (UI)

Motivo: LightGBM necesita libgomp (OpenMP), que el runtime de Vercel no incluye.
En producción se predice en Python puro a partir de este JSON (ver api/_model.py),
sin LightGBM, scikit-learn, pandas ni numpy.

Uso (desde la raíz, con requirements-train.txt instalado):
    python ml/export_model.py
"""
import json
import sys
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, roc_auc_score
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "ml"))  # el pickle referencia el módulo `preprocessing`
warnings.filterwarnings("ignore")

# Prioridad de llamada según probabilidad CALIBRADA.
TIERS = [("alta", 0.30), ("media", 0.12), ("baja", 0.0)]
MESES = {"mar": "Mar", "apr": "Abr", "may": "May", "jun": "Jun", "jul": "Jul", "aug": "Ago",
         "sep": "Sep", "oct": "Oct", "nov": "Nov", "dec": "Dic"}
MONTH_ORDER = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]


def flatten_tree(tree_structure: dict) -> dict:
    """Convierte el árbol anidado de `dump_model()` a arrays (nodos internos y hojas)."""
    n_internal = {"n": 0}

    def count(node):
        if "split_index" in node:
            n_internal["n"] += 1
            count(node["left_child"]); count(node["right_child"])

    count(tree_structure)
    n = n_internal["n"]
    t = {k: [None] * n for k in ("split_feature", "threshold", "left", "right", "default_left",
                                 "missing_type", "internal_count")}
    leaves = {}

    def child_ref(node):
        if "split_index" in node:
            return node["split_index"]
        leaves[node["leaf_index"]] = (node["leaf_value"], node.get("leaf_count", 0))
        return ~node["leaf_index"]  # negativo => hoja

    def walk(node):
        if "split_index" not in node:
            return
        i = node["split_index"]
        assert node["decision_type"] == "<=", node["decision_type"]
        t["split_feature"][i] = node["split_feature"]
        t["threshold"][i] = node["threshold"]
        t["default_left"][i] = bool(node["default_left"])
        t["missing_type"][i] = node["missing_type"]
        t["internal_count"][i] = node["internal_count"]
        t["left"][i] = child_ref(node["left_child"])
        t["right"][i] = child_ref(node["right_child"])
        walk(node["left_child"]); walk(node["right_child"])

    if n == 0:  # árbol de una sola hoja
        t["leaf_value"] = [tree_structure["leaf_value"]]
        t["leaf_count"] = [tree_structure.get("leaf_count", 0)]
        return t
    walk(tree_structure)
    t["leaf_value"] = [leaves[i][0] for i in range(len(leaves))]
    t["leaf_count"] = [leaves[i][1] for i in range(len(leaves))]
    return t


def tier_of(p: float) -> str:
    return next(t for t, lo in TIERS if p >= lo)


def build_scenarios(df: pd.DataFrame, probs: np.ndarray) -> list[dict]:
    """Períodos históricos (contexto macro) en orden cronológico; el dataset está ordenado por fecha."""
    d = df.assign(i=range(len(df)), p=probs)
    keys = ["emp.var.rate", "cons.price.idx", "cons.conf.idx", "nr.employed"]
    g = (d.groupby(keys).agg(n=("y", "size"), rate=("y", "mean"), eur=("euribor3m", "median"),
                             first=("i", "min"), month=("month", lambda s: s.iloc[0]))
          .reset_index().sort_values("first").reset_index(drop=True))
    year, prev, out = 2008, -1, []
    for _, r in g.iterrows():
        m = MONTH_ORDER.index(r["month"])
        if m < prev:
            year += 1
        prev = m
        out.append({"id": f"{year}-{m + 1:02d}-{len(out)}", "label": f"{MESES[r['month']]} {year}",
                    "month": r["month"], "emp.var.rate": float(r["emp.var.rate"]),
                    "cons.price.idx": float(r["cons.price.idx"]), "cons.conf.idx": float(r["cons.conf.idx"]),
                    "euribor3m": round(float(r["eur"]), 3), "nr.employed": float(r["nr.employed"]),
                    "n": int(r["n"]), "rate": round(float(r["rate"]), 4)})
    return out


def main():
    model = joblib.load(ROOT / "models" / "pipeline_model.joblib")
    prep = model.named_steps["preprocessing"]
    clf = model.named_steps["classifier"]
    booster = clf.booster_
    dump = booster.dump_model()
    assert dump["objective"].startswith("binary"), dump["objective"]

    # --- evaluación sobre el MISMO split de ml/train.py (test 20 %, random_state=42) ---
    df = pd.read_csv(ROOT / "data" / "raw" / "bank-additional-full.csv", sep=";")
    df["y"] = (df["y"] == "yes").astype(int)
    X, y = df.drop(columns=["y"]), df["y"]
    _, Xte, _, yte = train_test_split(X, y, stratify=y, test_size=0.2, random_state=42)
    raw = clf.predict(prep.transform(Xte), raw_score=True)
    lr = LogisticRegression(C=1e9).fit(raw.reshape(-1, 1), yte)  # calibración de Platt
    a, b = float(lr.coef_[0][0]), float(lr.intercept_[0])
    p_raw = 1 / (1 + np.exp(-raw))
    p_cal = 1 / (1 + np.exp(-(a * raw + b)))
    base = float(yte.mean())

    tiers = []
    bounds = [(t, lo, (TIERS[i - 1][1] if i else 1.01)) for i, (t, lo) in enumerate(TIERS)]
    for tid, lo, hi in bounds:
        mask = (p_cal >= lo) & (p_cal < hi)
        tiers.append({"id": tid, "min": lo, "share": round(float(mask.mean()), 4),
                      "real_rate": round(float(yte[mask].mean()), 4),
                      "lift": round(float(yte[mask].mean() / base), 2),
                      "capture": round(float(yte[mask].sum() / yte.sum()), 4), "n": int(mask.sum())})
    alta = p_cal >= TIERS[0][1]
    tp, fp = int((alta & (yte == 1)).sum()), int((alta & (yte == 0)).sum())
    fn, tn = int((~alta & (yte == 1)).sum()), int((~alta & (yte == 0)).sum())

    order = np.argsort(-p_cal)
    ys = yte.to_numpy()[order]
    decile_size = len(ys) // 10
    deciles = []
    for k in range(10):
        seg = ys[k * decile_size:(k + 1) * decile_size if k < 9 else len(ys)]
        deciles.append({"decile": k + 1, "rate": round(float(seg.mean()), 4),
                        "lift": round(float(seg.mean() / base), 2),
                        "capture_cum": round(float(ys[:(k + 1) * decile_size if k < 9 else len(ys)].sum() / ys.sum()), 4)})

    bins = [0, .05, .1, .15, .2, .3, .4, .5, .7, 1.0001]
    cats = pd.cut(p_cal, bins, right=False)
    calibration = []
    for iv in cats.categories:
        m = np.asarray(cats == iv)
        if m.sum():
            calibration.append({"label": f"{iv.left:.0%}–{min(iv.right, 1):.0%}", "predicted": round(float(p_cal[m].mean()), 4),
                                "real": round(float(yte[m].mean()), 4), "n": int(m.sum())})

    full_probs = 1 / (1 + np.exp(-(a * clf.predict(prep.transform(X), raw_score=True) + b)))
    insights = {
        "meta": {"n_total": int(len(df)), "n_test": int(len(yte)), "base_rate": round(base, 4),
                 "auc": round(float(roc_auc_score(yte, p_raw)), 4),
                 "brier_raw": round(float(brier_score_loss(yte, p_raw)), 4),
                 "brier_calibrated": round(float(brier_score_loss(yte, p_cal)), 4),
                 "alta_precision": round(tp / (tp + fp), 4), "alta_recall": round(tp / (tp + fn), 4)},
        "confusion_alta": {"tp": tp, "fp": fp, "fn": fn, "tn": tn},
        "tiers": tiers, "deciles": deciles, "calibration": calibration,
        "scenarios": build_scenarios(df, full_probs),
    }
    ipath = ROOT / "frontend" / "src" / "data" / "insights.json"
    ipath.parent.mkdir(parents=True, exist_ok=True)
    ipath.write_text(json.dumps(insights, ensure_ascii=False, separators=(",", ":")))

    out = {
        "format": 2,
        "feature_names": list(prep.feature_names_),
        "econ_scaler": {"mean": prep.scaler.mean_.tolist(), "scale": prep.scaler.scale_.tolist()},
        "econ_pca": {"mean": prep.pca.mean_.tolist(), "component": prep.pca.components_[0].tolist()},
        "sigmoid": float(dump["objective"].split("sigmoid:")[1]) if "sigmoid:" in dump["objective"] else 1.0,
        "calibration": {"a": a, "b": b, "base_rate": base},
        "tiers": [{"id": t, "min": lo} for t, lo in TIERS],
        "trees": [flatten_tree(t["tree_structure"]) for t in dump["tree_info"]],
    }
    path = ROOT / "models" / "model.json"
    path.write_text(json.dumps(out, separators=(",", ":")))
    print(f"OK: {len(out['trees'])} árboles -> {path} ({path.stat().st_size / 1024:.0f} KB); "
          f"calibración a={a:.3f} b={b:.3f}; insights -> {ipath} ({len(insights['scenarios'])} escenarios)")


if __name__ == "__main__":
    main()
