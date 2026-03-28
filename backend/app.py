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

# ---------------- LOAD ENV ----------------
load_dotenv()

app = Flask(__name__)

# ---------------- CORS ----------------
CORS(app)

# ---------------- JWT CONFIG ----------------
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
jwt = JWTManager(app)

# ---------------- LOAD MODEL + SCALER ----------------
MODEL_PATH = "lung_model.pkl"
SCALER_PATH = "scaler.pkl"

MODEL_URL = "https://drive.google.com/uc?export=download&id=1ApAMww9zfTradgjXM0sfd-KkuI4i_gIx"
SCALER_URL = "https://drive.google.com/uc?export=download&id=1gMDnah5kVkBIqJ5xUQLMmnnGpv0K6g8f"

# Download model if not present
if not os.path.exists(MODEL_PATH):
    print("Downloading model...")
    r = requests.get(MODEL_URL)
    with open(MODEL_PATH, "wb") as f:
        f.write(r.content)

# Download scaler if not present
if not os.path.exists(SCALER_PATH):
    print("Downloading scaler...")
    r = requests.get(SCALER_URL)
    with open(SCALER_PATH, "wb") as f:
        f.write(r.content)

# Load model and scaler
model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

# ---------------- MONGODB ----------------
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)

db = client["lung_cancer_db"]
users_collection = db["users"]
predictions_collection = db["predictions"]

# ---------------- HOME ----------------
@app.route("/")
def home():
    return jsonify({"message": "Backend running successfully!"})

# ---------------- REGISTER ----------------
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if users_collection.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    users_collection.insert_one({
        "email": email,
        "password": hashed_password
    })

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
    data = request.get_json()

    try:
        # VALIDATION
        if data["smoking_years"] > data["age"]:
            return jsonify({"message": "Smoking years cannot exceed age"}), 400

        # FEATURE ENGINEERING
        smoking_intensity = data["smoking_years"] * data["cigarettes_per_day"]
        age_scaled = data["age"] / 100

        features = np.array([[
            age_scaled,
            data["gender"],
            data["smoker"],
            smoking_intensity,
            data["air_pollution_index"],
            data["chest_pain"],
            data["shortness_of_breath"],
            data["chronic_cough"],
            data["asthma"],
            data["family_history_cancer"],
            data["bmi"]
        ]])

        # SCALE
        features_scaled = scaler.transform(features)

        # PREDICTION
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0][1]

        # RISK LEVEL
        if probability < 0.3:
            result = "Low Risk"
        elif probability < 0.7:
            result = "Medium Risk"
        else:
            result = "High Risk"

        probability_percent = round(probability * 100, 2)

        # ---------------- CONTRIBUTION LOGIC ----------------
        feature_names = [
            "Age",
            "Gender",
            "Smoker",
            "Smoking Intensity",
            "Air Pollution",
            "Chest Pain",
            "Shortness of Breath",
            "Chronic Cough",
            "Asthma",
            "Family History",
            "BMI"
        ]

        raw_values = features[0]
        total = sum(abs(x) for x in raw_values) + 1e-6
        contributions = [round(abs(x)/total, 3) for x in raw_values]

        shap_output = dict(zip(feature_names, contributions))

        # STORE IN DB
        predictions_collection.insert_one({
            "user": current_user,
            "input_data": data,
            "prediction": result,
            "probability": probability_percent
        })

        return jsonify({
            "prediction": result,
            "probability": probability_percent,
            "risk_level": result,
            "shap_values": shap_output
        }), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 500

# ---------------- PROTECTED ----------------
@app.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    return jsonify({"message": "Access granted!"})

# ---------------- RUN ----------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)