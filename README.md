#  Cloud-Based Lung Cancer Risk Prediction System

AI-Powered Web Application for Early Lung Cancer Risk Assessment Using Machine Learning

---

##  About The Project

Cloud-Based Lung Cancer Risk Prediction System is a full-stack healthcare application designed to assess an individual's risk of developing lung cancer based on health and lifestyle factors.

The system uses a trained Random Forest machine learning model to classify users into **Low Risk**, **Medium Risk**, or **High Risk** categories. To improve transparency, SHAP (SHapley Additive Explanations) is integrated to visualize the contribution of each feature toward the prediction.

The application provides secure user authentication, prediction history tracking, feedback collection, and cloud-based accessibility through a modern web interface.

---

##  Key Features

* Secure User Registration and Login
* JWT-Based Authentication
* Lung Cancer Risk Prediction
* Risk Classification (Low / Medium / High)
* Prediction Probability Score
* SHAP Feature Impact Analysis
* Prediction History Tracking
* Feedback Submission System
* Responsive User Interface
* Cloud-Based Deployment
* Secure Data Storage with MongoDB Atlas

---

##  Built With

* React.js (Vite)
* Tailwind CSS
* Flask (Python)
* MongoDB Atlas
* Scikit-learn
* Random Forest Classifier
* SHAP
* JWT Authentication
* bcrypt
* Chart.js
* Render

---

##  Project Structure

```text
lung-cancer-prediction/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── App.jsx
│
├── backend/
│   ├── app.py
│   ├── routes/
│   ├── models/
│   ├── shap_files/
│   ├── utils/
│   └── requirements.txt
│
├── README.md
│
└── Documentation
```

---

##  Getting Started

### Prerequisites

To run this project locally, you need:

* Python 3.9+
* Node.js 18+
* MongoDB Atlas Account
* Git

---

##  Installation

### Clone the Repository

```bash
git clone https://github.com/shreyabhargavi28/lung-cancer-prediction.git
```

### Backend Setup

```bash
cd backend

pip install -r requirements.txt

python app.py
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

##  Environment Variables

### Backend

```env
MONGO_URL=your_mongodb_connection_string
JWT_SECRET_KEY=your_secret_key
PORT=10000
```

### Frontend

```env
VITE_API_URL=https://lung-cancer-prediction-zo8h.onrender.com
```

---

##  Live Application

### Frontend

https://lung-cancer-frontend.onrender.com

### Backend API

https://lung-cancer-prediction-zo8h.onrender.com

> Note: The backend may take 30–60 seconds to respond to the first request because it is hosted on Render's free tier.

---

##  Machine Learning Model

* Algorithm: Random Forest Classifier
* Model Accuracy: 84%
* Trained Using: Scikit-learn
* Explainability: SHAP Feature Analysis
* Risk Categories:

  * Low Risk
  * Medium Risk
  * High Risk

---

##  Screenshots

* Home Page
* Login Page
* Signup Page
* Risk Assessment Form
* Prediction Results
* SHAP Feature Impact Analysis
* Prediction History

---

##  Team Members

* G. Rajeshwari
* K. Asritha Meenan
* N. Shreya Bhargavi

### Guide

Mrs. G. Sailaja
Assistant Professor
Department of Computer Science & Engineering
GNITS, Hyderabad

---

##  Future Enhancements

* Integration of Deep Learning Models
* Real-Time Health Monitoring
* Mobile Application Support
* Healthcare Analytics Dashboard
* Enhanced Prediction Accuracy
* Cloud-Based Reporting System

---

##  License

This project is intended for academic and educational purposes only.

---

##  Acknowledgements

This project was developed as part of Mini Project–I in the Department of Computer Science & Engineering, G. Narayanamma Institute of Technology & Science (GNITS), Hyderabad. The project demonstrates the application of Machine Learning, Cloud Computing, and Explainable AI in healthcare risk assessment.
