import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Shield, Brain, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="gradient-text">Predict Lung Cancer Risk</span>
              <br />
              <span className="text-gray-800">Intelligently</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Advanced AI analyzes patient health data to provide instant, accurate 
              lung cancer risk assessments with personalized recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={isAuthenticated ? "/predict" : "/signup"}
                className="btn-primary inline-flex items-center justify-center space-x-2"
              >
                <Activity className="w-5 h-5" />
                <span>Start Prediction</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/about"
                className="btn-secondary inline-flex items-center justify-center space-x-2"
              >
                <Shield className="w-5 h-5" />
                <span>Learn More</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">AI-Powered Analysis</h3>
            <p className="text-gray-600">
              Advanced machine learning algorithms trained on extensive medical data 
              provide accurate risk assessments.
            </p>
          </div>

          <div className="card hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Instant Results</h3>
            <p className="text-gray-600">
              Get immediate risk assessment results with detailed breakdowns 
              and personalized recommendations.
            </p>
          </div>

          <div className="card hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Privacy First</h3>
            <p className="text-gray-600">
              Your health data is encrypted and secure. We prioritize your privacy 
              and data protection.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white/50 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">
            Why Choose PulmoPredict?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                'Early detection can significantly improve outcomes',
                'Non-invasive preliminary screening tool',
                'Based on established medical research',
                'Easy-to-understand results with explanations',
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Important Disclaimer</h3>
              <p className="text-blue-50">
                PulmoPredict is a screening tool and should not replace professional 
                medical advice. Always consult with healthcare providers for proper 
                diagnosis and treatment.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;