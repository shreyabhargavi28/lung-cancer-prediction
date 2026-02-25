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

# ---------------- LOAD ENV ----------------
load_dotenv()

app = Flask(__name__)

# ✅ SIMPLE AND CORRECT CORS
CORS(app, supports_credentials=True)

# ✅ HANDLE PREFLIGHT PROPERLY
@app.after_request
def after_request(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response

# ---------------- JWT CONFIG ----------------
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
jwt = JWTManager(app)

# ---------------- MONGODB CONNECTION ----------------
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)

db = client["lung_cancer_db"]
users_collection = db["users"]

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
    port = int(os.environ.get("PORT", 10000))  # Render uses dynamic port
    app.run(host="0.0.0.0", port=port)