"""Inferencia en Python puro: sin LightGBM, scikit-learn, pandas ni numpy.

Carga models/model.json (generado por ml/export_model.py) y replica:
  1. el preprocesamiento de ml/preprocessing.py (con la semántica de ENTRENAMIENTO),
  2. el ensamble de árboles de LightGBM (predicción binaria),
  3. TreeSHAP exacto (equivale a `predict(..., pred_contrib=True)` de LightGBM).
La paridad con el pipeline original se verifica en tests/test_parity.py.
"""
import json
import math
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "model.json"
ECON_VARS = ("euribor3m", "cons.price.idx", "cons.conf.idx")

JOB_GROUP = {"blue-collar": 1, "housemaid": 1, "services": 1, "admin.": 2, "management": 2,
             "technician": 2, "entrepreneur": 2, "self-employed": 2, "student": 3, "retired": 3,
             "unemployed": 3, "unknown": 4}
MARITAL = {"single": 0, "married": 1, "divorced": 2, "unknown": 2}
EDUCATION = {"illiterate": 0, "basic.4y": 1, "basic.6y": 2, "basic.9y": 3, "high.school": 4,
             "professional.course": 5, "university.degree": 6, "unknown": 3}
YES_NO = {"no": 0, "yes": 1, "unknown": 1}
CONTACT = {"telephone": 0, "cellular": 1}
# Grupo de mes -> columna dummy. "MAY" es la categoría base (drop_first) y no tiene columna.
MONTH_GROUP = {"jan": "Q1", "feb": "Q1", "mar": "Q1", "apr": "Q2", "may": "MAY", "jun": "Q2",
               "jul": "Q3", "aug": "Q3", "sep": "Q3", "oct": "Q4", "nov": "Q4", "dec": "Q4"}


class Model:
    def __init__(self, path: Path = MODEL_PATH):
        spec = json.loads(Path(path).read_text())
        self.feature_names: list[str] = spec["feature_names"]
        self.scaler_mean = spec["econ_scaler"]["mean"]
        self.scaler_scale = spec["econ_scaler"]["scale"]
        self.pca_mean = spec["econ_pca"]["mean"]
        self.pca_component = spec["econ_pca"]["component"]
        self.sigmoid = spec["sigmoid"]
        self.trees = spec["trees"]
        self.base_value = sum(self._expected_value(t) for t in self.trees)

    # ---- preprocesamiento -------------------------------------------------
    def encode(self, p: dict) -> list[float]:
        """p usa las claves originales del dataset (p. ej. 'emp.var.rate')."""
        age = p["age"]
        age_bin = 0 if age <= 25 else 1 if age <= 35 else 2 if age <= 45 else 3 if age <= 55 else 4 if age <= 65 else 5
        scaled = [(p[v] - m) / s for v, m, s in zip(ECON_VARS, self.scaler_mean, self.scaler_scale)]
        economic_index = sum((x - m) * c for x, m, c in zip(scaled, self.pca_mean, self.pca_component))
        group = MONTH_GROUP[p["month"]]
        f = {
            "campaign": float(min(p["campaign"], 7)),
            "nr.employed": float(p["nr.employed"]),
            "prev_contact": 1.0 if p["pdays"] == 999 else 0.0,
            "age_bin": float(age_bin),
            "economic_index": economic_index,
            "job_group": float(JOB_GROUP[p["job"]]),
            "marital_code": float(MARITAL[p["marital"]]),
            "education_ord": float(EDUCATION[p["education"]]),
            "default_bin": float(YES_NO[p["default"]]),
            "housing_bin": float(YES_NO[p["housing"]]),
            "loan_bin": float(YES_NO[p["loan"]]),
            "contact_bin": float(CONTACT[p["contact"]]),
            **{f"month_Q{i}": 1.0 if group == f"Q{i}" else 0.0 for i in range(1, 5)},
            **{f"pout_{k}": 1.0 if p["poutcome"] == k else 0.0 for k in ("failure", "nonexistent", "success")},
        }
        return [f[name] for name in self.feature_names]

    # ---- árboles ----------------------------------------------------------
    @staticmethod
    def _goes_left(t: dict, node: int, x: list[float]) -> bool:
        v = x[t["split_feature"][node]]
        mt = t["missing_type"][node]
        if math.isnan(v) and mt != "NaN":
            v = 0.0
        if (mt == "Zero" and abs(v) <= 1e-35) or (mt == "NaN" and math.isnan(v)):
            return t["default_left"][node]
        return v <= t["threshold"][node]

    def raw_score(self, x: list[float]) -> float:
        total = 0.0
        for t in self.trees:
            if not t["split_feature"]:
                total += t["leaf_value"][0]
                continue
            node = 0
            while node >= 0:
                node = t["left"][node] if self._goes_left(t, node, x) else t["right"][node]
            total += t["leaf_value"][~node]
        return total

    def probability(self, x: list[float]) -> float:
        return 1.0 / (1.0 + math.exp(-self.sigmoid * self.raw_score(x)))

    # ---- TreeSHAP (Lundberg et al.), mismo algoritmo que LightGBM ----------
    @staticmethod
    def _count(t: dict, ref: int) -> float:
        return t["leaf_count"][~ref] if ref < 0 else t["internal_count"][ref]

    def _expected_value(self, t: dict) -> float:
        if not t["split_feature"]:
            return t["leaf_value"][0]
        total = float(t["internal_count"][0])
        return sum(v * c for v, c in zip(t["leaf_value"], t["leaf_count"])) / total

    def contributions(self, x: list[float]) -> list[float]:
        """Contribución (log-odds) por feature, en el orden de `feature_names`."""
        phi = [0.0] * len(x)
        for t in self.trees:
            if t["split_feature"]:
                self._tree_shap(t, x, phi)
        return phi

    def _tree_shap(self, t: dict, x: list[float], phi: list[float]) -> None:
        def extend(path, depth, zf, of, fi):
            path.append([fi, zf, of, 1.0 if depth == 0 else 0.0])
            for i in range(depth - 1, -1, -1):
                path[i + 1][3] += of * path[i][3] * (i + 1) / (depth + 1)
                path[i][3] = zf * path[i][3] * (depth - i) / (depth + 1)

        def unwind(path, depth, idx):
            of, zf = path[idx][2], path[idx][1]
            nxt = path[depth][3]
            for i in range(depth - 1, -1, -1):
                if of != 0:
                    tmp = path[i][3]
                    path[i][3] = nxt * (depth + 1) / ((i + 1) * of)
                    nxt = tmp - path[i][3] * zf * (depth - i) / (depth + 1)
                else:
                    path[i][3] = path[i][3] * (depth + 1) / (zf * (depth - i))
            for i in range(idx, depth):
                path[i][0:3] = path[i + 1][0:3]
            path.pop()

        def unwound_sum(path, depth, idx):
            of, zf = path[idx][2], path[idx][1]
            nxt = path[depth][3]
            total = 0.0
            for i in range(depth - 1, -1, -1):
                if of != 0:
                    tmp = nxt * (depth + 1) / ((i + 1) * of)
                    total += tmp
                    nxt = path[i][3] - tmp * zf * (depth - i) / (depth + 1)
                else:
                    total += (path[i][3] / zf) / ((depth - i) / (depth + 1))
            return total

        def recurse(ref, path, depth, zf, of, fi):
            path = [e[:] for e in path]
            extend(path, depth, zf, of, fi)
            if ref < 0:
                leaf = t["leaf_value"][~ref]
                for i in range(1, depth + 1):
                    w = unwound_sum(path, depth, i)
                    phi[path[i][0]] += w * (path[i][2] - path[i][1]) * leaf
                return
            feat = t["split_feature"][ref]
            hot, cold = (t["left"][ref], t["right"][ref]) if self._goes_left(t, ref, x) \
                else (t["right"][ref], t["left"][ref])
            cover = self._count(t, ref)
            hot_zf, cold_zf = self._count(t, hot) / cover, self._count(t, cold) / cover
            in_zf = in_of = 1.0
            for k in range(1, depth + 1):
                if path[k][0] == feat:
                    in_zf, in_of = path[k][1], path[k][2]
                    unwind(path, depth, k)
                    depth -= 1
                    break
            recurse(hot, path, depth + 1, hot_zf * in_zf, in_of, feat)
            recurse(cold, path, depth + 1, cold_zf * in_zf, 0.0, feat)

        recurse(0, [], 0, 1.0, 1.0, -1)
