import joblib
import numpy as np
import pandas as pd
import shap
from flask import Flask, request, jsonify

model = joblib.load("models/pipeline_model.joblib")

explainer = shap.Explainer(model.named_steps["classifier"])
app = Flask(__name__)

@app.route("/predict", methods=["POST"])
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
    data = request.get_json(force=True)
    input_df = pd.DataFrame([data])
    shap_values = explainer(input_df)
    return jsonify(shap_values[0].values.tolist())

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)