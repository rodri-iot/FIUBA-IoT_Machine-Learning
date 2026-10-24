"""Exporta el pipeline entrenado (.joblib) a un formato portable (models/model.json).

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

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "ml"))  # el pickle referencia el módulo `preprocessing`
warnings.filterwarnings("ignore")


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


def main():
    model = joblib.load(ROOT / "models" / "pipeline_model.joblib")
    prep = model.named_steps["preprocessing"]
    booster = model.named_steps["classifier"].booster_
    dump = booster.dump_model()
    assert dump["objective"].startswith("binary"), dump["objective"]
    out = {
        "format": 1,
        "feature_names": list(prep.feature_names_),
        "econ_scaler": {"mean": prep.scaler.mean_.tolist(), "scale": prep.scaler.scale_.tolist()},
        "econ_pca": {"mean": prep.pca.mean_.tolist(), "component": prep.pca.components_[0].tolist()},
        "sigmoid": float(dump["objective"].split("sigmoid:")[1]) if "sigmoid:" in dump["objective"] else 1.0,
        "trees": [flatten_tree(t["tree_structure"]) for t in dump["tree_info"]],
    }
    path = ROOT / "models" / "model.json"
    path.write_text(json.dumps(out, separators=(",", ":")))
    print(f"OK: {len(out['trees'])} árboles, {len(out['feature_names'])} features -> {path} "
          f"({path.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
