from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from pydantic import BaseModel, ValidationError, constr, conint, confloat
from typing import Literal
import os
import requests

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///predictions.db'
SAGEMAKER_ENDPOINT_URL = os.environ.get("SAGEMAKER_ENDPOINT_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

SAGEMAKER_ENDPOINT_URL = os.environ.get("SAGEMAKER_ENDPOINT_URL")

# --------------------------
# SQLAlchemy DB model
# --------------------------
class Prediction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    input_data = db.Column(db.JSON, nullable=False)
    prediction = db.Column(db.Integer, nullable=False)
    probability = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# --------------------------
# Pydantic validation model
# --------------------------
class PredictionInput(BaseModel):
    age: conint(ge=18, le=99)
    job: str
    marital: str
    education: str
    default: Literal['yes', 'no']
    housing: Literal['yes', 'no']
    loan: Literal['yes', 'no']
    contact: Literal['cellular', 'telephone']
    month: str
    day_of_week: str
    duration: conint(gt=0)
    campaign: conint(ge=1)
    pdays: conint(ge=0)
    previous: conint(ge=0)
    poutcome: str
    emp_var_rate: confloat()
    cons_price_idx: confloat()
    cons_conf_idx: confloat()
    euribor3m: confloat()

    class Config:
        fields = {
            'emp_var_rate': 'emp.var.rate',
            'cons_price_idx': 'cons.price.idx',
            'cons_conf_idx': 'cons.conf.idx'
        }

# --------------------------
# Endpoints
# --------------------------

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if not SAGEMAKER_ENDPOINT_URL:
            return jsonify({"error": "SAGEMAKER_ENDPOINT_URL no está configurado"}), 500

        raw_data = request.get_json()
        validated = PredictionInput(**raw_data)
        payload = validated.dict(by_alias=True)

        response = requests.post(
            SAGEMAKER_ENDPOINT_URL,
            headers={"Content-Type": "application/json"},
            json=payload
        )
        if response.status_code != 200:
            return jsonify({"error": "Error desde SageMaker", "detail": response.text}), 500

        result = response.json()

        # Guardar en DB
        record = Prediction(
            input_data=payload,
            prediction=result['prediction'],
            probability=result['probability']
        )
        db.session.add(record)
        db.session.commit()

        return jsonify(result), 200

    except ValidationError as ve:
        return jsonify({"error": "Datos inválidos", "details": ve.errors()}), 422

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/explain", methods=["POST"])
def explain():
    try:
        if not SAGEMAKER_ENDPOINT_URL:
            return jsonify({"error": "SAGEMAKER_ENDPOINT_URL no está configurado"}), 500

        input_data = request.get_json()
        explain_url = SAGEMAKER_ENDPOINT_URL.replace("/invocations", "/explain")

        response = requests.post(
            explain_url,
            headers={"Content-Type": "application/json"},
            json=input_data
        )
        return jsonify(response.json()), response.status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/history", methods=["GET"])
def history():
    try:
        records = Prediction.query.order_by(Prediction.created_at.desc()).limit(50).all()
        return jsonify([
            {
                "id": r.id,
                "input_data": r.input_data,
                "prediction": r.prediction,
                "probability": r.probability,
                "created_at": r.created_at.isoformat()
            } for r in records
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8081, debug=True)
