import joblib
import numpy as np
import pandas as pd
import shap
import json
from flask import Flask, request, jsonify

model = joblib.load("models/pipeline_model.joblib")

explainer = shap.Explainer(model.named_steps["classifier"])

app = Flask(__name__)

@app.route("/ping", methods=["GET"])
def ping():
    return "pong", 200

@app.route("/invocations", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
        input_df = pd.DataFrame([data])
        proba = model.predict_proba(input_df)[0][1]
        pred = model.predict(input_df)[0]

        return jsonify({
            "prediction": int(pred),
            "probability": round(float(proba), 4)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
@app.route("/explain", methods=["POST"])
def explain():
    try:
        data = request.get_json(force=True)
        input_df = pd.DataFrame([data])
        explainer = shap.Explainer(model.named_steps["classifier"])
        preprocessed = model.named_steps["preprocessing"].transform(input_df)
        shap_values = explainer(preprocessed)

        shap_dict = {
            f: round(float(v), 4)
            for f, v in zip(model.named_steps["preprocessing"].feature_names_, shap_values.values[0])
        }

        return jsonify({"shap_values": shap_dict})

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)