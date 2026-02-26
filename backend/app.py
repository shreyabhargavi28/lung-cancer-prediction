
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

# ---------------- LOAD ENV ----------------
load_dotenv()

app = Flask(__name__)

# ---------------- CORS ----------------
CORS(app)

# ---------------- JWT CONFIG ----------------
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
jwt = JWTManager(app)

# ---------------- LOAD TRAINED MODEL ----------------
model = joblib.load("lung_model.pkl")

# ---------------- MONGODB CONNECTION ----------------
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)

db = client["lung_cancer_db"]
users_collection = db["users"]
predictions_collection = db["predictions"]   # NEW collection

# ---------------- HOME ----------------
@app.route("/")
def home():
    return jsonify({"message": "Backend running successfully!"})

# ---------------- REGISTER ----------------
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data:
        return jsonify({"message": "Invalid request"}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    )

    users_collection.insert_one({
        "email": email,
        "password": hashed_password
    })

    return jsonify({"message": "User registered successfully"}), 201

# ---------------- LOGIN ----------------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"message": "Invalid request"}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    user = users_collection.find_one({"email": email})

    if not user:
        return jsonify({"message": "Invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({"message": "Invalid credentials"}), 401

    access_token = create_access_token(identity=email)

    return jsonify({"access_token": access_token}), 200

# ---------------- PREDICT ROUTE ----------------
@app.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    current_user = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"message": "Invalid request"}), 400

    try:
        features = [
            data["age"],
            data["gender"],
            data["smoker"],
            data["smoking_years"],
            data["cigarettes_per_day"],
            data["air_pollution_index"],
            data["chest_pain"],
            data["shortness_of_breath"],
            data["chronic_cough"],
            data["asthma"],
            data["family_history_cancer"],
            data["bmi"]
        ]

        prediction = model.predict([features])
        result = "High Risk" if prediction[0] == 1 else "Low Risk"

        # Store prediction in MongoDB
        predictions_collection.insert_one({
            "user": current_user,
            "input_data": data,
            "prediction": result
        })

        return jsonify({"prediction": result}), 200

    except KeyError as e:
        return jsonify({"message": f"Missing field: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# ---------------- PROTECTED TEST ROUTE ----------------
@app.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify({
        "message": "Access granted!",
        "logged_in_as": current_user
    })

# ---------------- RUN SERVER ----------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)