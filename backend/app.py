from flask import Flask, request, jsonify
import os
import requests

app = Flask(__name__)

SAGEMAKER_ENDPOINT_URL = os.environ.get("SAGEMAKER_ENDPOINT_URL")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if not SAGEMAKER_ENDPOINT_URL:
            return jsonify({"error": "SAGEMAKER_ENDPOINT_URL no está configurado"}), 500

        input_data = request.get_json()
        response = requests.post(
            SAGEMAKER_ENDPOINT_URL,
            headers={"Content-Type": "application/json"},
            json=input_data
        )
        return jsonify(response.json()), response.status_code

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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8081, debug=True)
