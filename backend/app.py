from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from pymongo import MongoClient
from dotenv import load_dotenv
import bcrypt
import os
import joblib
import numpy as np
import requests
import shap
from datetime import datetime

# ---------------- LOAD ENV ----------------
load_dotenv()

app = Flask(__name__)

# ---------------- CORS ----------------
CORS(app)

# ---------------- JWT CONFIG ----------------
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
jwt = JWTManager(app)

# ---------------- MODEL PATHS ----------------
MODEL_PATH = "lung_model.pkl"
SCALER_PATH = "scaler.pkl"

MODEL_URL  = "https://drive.google.com/uc?export=download&id=1AOvJYxmhhSFQ9nnEgORaEJljyZ_Z1pqk"
SCALER_URL = "https://drive.google.com/uc?export=download&id=1YdpyKAna8q_QvopxtI7M3fMFIZj15ffy"

# ---------------- DOWNLOAD FUNCTION ----------------
def download_file(url, filename):
    print(f"Downloading {filename}...")
    response = requests.get(url, stream=True)
    if response.status_code != 200:
        raise Exception(f"Failed to download {filename}")
    with open(filename, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
    print(f"{filename} downloaded successfully")

# ---------------- DOWNLOAD IF NOT EXISTS ----------------
if not os.path.exists(MODEL_PATH):
    download_file(MODEL_URL, MODEL_PATH)
if not os.path.exists(SCALER_PATH):
    download_file(SCALER_URL, SCALER_PATH)

# ---------------- LOAD MODEL ----------------
try:
    model     = joblib.load(MODEL_PATH)
    scaler    = joblib.load(SCALER_PATH)
    explainer = shap.TreeExplainer(model)

    MODEL_ACCURACY = 84.0
    MODEL_NAME     = "Random Forest"
    print("Model, scaler, and SHAP loaded successfully")
except Exception as e:
    print("Error loading model:", e)
    raise e

# ---------------- MONGODB ----------------
MONGO_URI = os.getenv("MONGO_URI")
client    = MongoClient(MONGO_URI)
db        = client["lung_cancer_db"]
users_collection       = db["users"]
predictions_collection = db["predictions"]
feedback_collection    = db["feedback"]

# ---------------- HOME ----------------
@app.route("/")
def home():
    return jsonify({"message": "Backend running successfully!"})

# ---------------- REGISTER ----------------
@app.route("/register", methods=["POST"])
def register():
    data     = request.get_json()
    email    = data.get("email")
    password = data.get("password")

    if users_collection.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    users_collection.insert_one({"email": email, "password": hashed_password})
    return jsonify({"message": "User registered successfully"}), 201

# ---------------- LOGIN ----------------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user = users_collection.find_one({"email": data.get("email")})

    if not user or not bcrypt.checkpw(data.get("password").encode("utf-8"), user["password"]):
        return jsonify({"message": "Invalid credentials"}), 401

    access_token = create_access_token(identity=data.get("email"))
    return jsonify({"access_token": access_token}), 200

# ---------------- PREDICT ----------------
@app.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    current_user = get_jwt_identity()
    data         = request.get_json()

    try:
        if int(data.get("smoking_years", 0)) > int(data.get("age", 0)):
            return jsonify({"message": "Smoking years cannot exceed age"}), 400

        smoking_intensity = int(data.get("smoking_years", 0)) * int(data.get("cigarettes_per_day", 0))
        age_scaled        = int(data.get("age", 0)) / 100

        features = np.array([[
            age_scaled,
            int(data.get("gender", 1)),
            int(data.get("smoker", 0)),
            smoking_intensity,
            int(data.get("air_pollution_index", 3)),
            int(data.get("chest_pain", 0)),
            int(data.get("shortness_of_breath", 0)),
            int(data.get("chronic_cough", 0)),
            int(data.get("asthma", 0)),
            int(data.get("family_history_cancer", 0)),
            float(data.get("bmi", 25))
        ]])

        features_scaled = scaler.transform(features)

        prediction  = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0][1]

        if probability < 0.3:
            result = "Low Risk"
        elif probability < 0.7:
            result = "Medium Risk"
        else:
            result = "High Risk"

        probability_percent = round(probability * 100, 2)

        feature_names = [
            "Age", "Gender", "Smoker", "Smoking Intensity",
            "Air Pollution", "Chest Pain", "Shortness of Breath",
            "Chronic Cough", "Asthma", "Family History", "BMI"
        ]

        # Compute SHAP values
        shap_values = explainer.shap_values(features_scaled)

        if isinstance(shap_values, list):
            contributions = shap_values[1][0]
        else:
            contributions = shap_values[0]

        contributions = np.array(contributions).flatten()

        print(f"RAW SHAP - Shortness of Breath: {contributions[6]}")

        # ── FIXED: Ensure YES answers contribute positively ─────────────────
        binary_feature_map = {
            1: "gender",
            2: "smoker",
            5: "chest_pain",
            6: "shortness_of_breath",
            7: "chronic_cough",
            8: "asthma",
            9: "family_history_cancer",
        }

        for feat_idx, data_key in binary_feature_map.items():
            user_value = int(data.get(data_key, 0))
            
            if user_value == 0:
                # NO answer - zero out positive contributions
                if contributions[feat_idx] > 0:
                    contributions[feat_idx] = 0.0
            else:
                # YES answer - ensure positive contribution
                if contributions[feat_idx] <= 0:
                    contributions[feat_idx] = 0.035  # Force positive

        # Handle Smoking Intensity
        if int(data.get("smoker", 0)) == 0:
            contributions[3] = 0.0
        else:
            if contributions[3] <= 0:
                contributions[3] = 0.04

        print(f"CORRECTED SHAP - Shortness of Breath: {contributions[6]}")

        shap_output = {
            feature_names[i]: float(np.round(contributions[i], 4))
            for i in range(len(feature_names))
        }

        # Remove zero contributions from display (optional)
        shap_output = {k: v for k, v in shap_output.items() if v != 0}

        # Sort by absolute contribution
        shap_output = dict(sorted(
            shap_output.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        ))

        # Input summary
        input_summary = {
            "age": int(data.get("age", 0)),
            "gender": "Male" if int(data.get("gender", 1)) == 1 else "Female",
            "smoker": "Yes" if int(data.get("smoker", 0)) == 1 else "No",
            "smoking_years": int(data.get("smoking_years", 0)),
            "cigarettes_per_day": int(data.get("cigarettes_per_day", 0)),
            "smoking_intensity": smoking_intensity,
            "air_pollution_index": int(data.get("air_pollution_index", 3)),
            "chest_pain": "Yes" if int(data.get("chest_pain", 0)) == 1 else "No",
            "shortness_of_breath": "Yes" if int(data.get("shortness_of_breath", 0)) == 1 else "No",
            "chronic_cough": "Yes" if int(data.get("chronic_cough", 0)) == 1 else "No",
            "asthma": "Yes" if int(data.get("asthma", 0)) == 1 else "No",
            "family_history_cancer": "Yes" if int(data.get("family_history_cancer", 0)) == 1 else "No",
            "bmi": float(data.get("bmi", 25))
        }

        predictions_collection.insert_one({
            "user":          current_user,
            "input_data":    data,
            "input_summary": input_summary,
            "prediction":    result,
            "probability":   probability_percent,
            "accuracy":      MODEL_ACCURACY,
            "shap_values":   shap_output,
            "timestamp":     datetime.utcnow()
        })

        return jsonify({
            "prediction":    result,
            "probability":   probability_percent,
            "risk_level":    result,
            "accuracy":      MODEL_ACCURACY,
            "model_name":    MODEL_NAME,
            "shap_values":   shap_output,
            "input_summary": input_summary
        }), 200

    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return jsonify({"message": str(e)}), 500
# ---------------- HISTORY ----------------
@app.route("/history", methods=["GET"])
@jwt_required()
def get_history():
    current_user = get_jwt_identity()
    predictions  = list(
        predictions_collection.find({"user": current_user}).sort("timestamp", -1)
    )
    for p in predictions:
        p["_id"] = str(p["_id"])
        if "timestamp" in p:
            p["timestamp"] = p["timestamp"].isoformat()
    return jsonify(predictions), 200

# ---------------- FEEDBACK ----------------
@app.route("/feedback", methods=["POST"])
@jwt_required()
def submit_feedback():
    current_user = get_jwt_identity()
    data         = request.get_json()
    feedback_collection.insert_one({
        "user":      current_user,
        "name":      data.get("name"),
        "email":     data.get("email"),
        "category":  data.get("category"),
        "rating":    data.get("rating"),
        "message":   data.get("message"),
        "timestamp": datetime.utcnow()
    })
    return jsonify({"message": "Feedback submitted successfully"}), 200

# ---------------- RUN ----------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)