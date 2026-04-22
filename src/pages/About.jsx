import React from 'react';
import { Target, Brain, Users, Award } from 'lucide-react';

const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold gradient-text mb-4">About PulmoPredict</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Empowering early detection through innovative technology
        </p>
      </div>

      {/* Mission */}
      <div className="card mb-8">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Our Mission</h2>
            <p className="text-gray-600 text-lg">
              To democratize early lung cancer detection by making it possible for 
              anyone to access a reliable and affordable medical resource.
            </p>
          </div>
        </div>
      </div>

      {/* Approach */}
      <div className="card mb-8">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Our Approach</h2>
            <p className="text-gray-600 text-lg">
              Combining cutting-edge machine learning with established medical 
              research to create reliable, accessible solutions.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">84%</div>
          <p className="text-gray-600">Model Accuracy</p>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">11</div>
          <p className="text-gray-600">Key Health Factors</p>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-pink-600 mb-2">24/7</div>
          <p className="text-gray-600">Available Access</p>
        </div>
      </div>

      {/* Team Values */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <Users className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Patient-Centered</h3>
          <p className="text-gray-600">
            We design our tools with the patient's needs and understanding in mind, 
            ensuring accessibility and clarity.
          </p>
        </div>
        <div className="card">
          <Award className="w-8 h-8 text-purple-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Research-Backed</h3>
          <p className="text-gray-600">
            Our algorithms are built on peer-reviewed medical research and 
            validated clinical data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;