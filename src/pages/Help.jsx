import React from 'react';
import { HelpCircle, User, Users, Cigarette, Calendar, AlertCircle } from 'lucide-react';

const Help = () => {
  const inputFields = [
    {
      icon: User,
      label: 'Age',
      description: 'Enter your age in years (e.g., 45)',
      example: 'Between 18-100 years'
    },
    {
      icon: Users,
      label: 'Gender',
      description: 'Select your gender from the dropdown menu. Male, Female, or Other',
      options: ['Male', 'Female', 'Other']
    },
    {
      icon: Cigarette,
      label: 'Smoking Habits',
      description: 'Select "Current" if you currently smoke, "Never" if you\'ve never smoked, or "Other" if you don\'t know your smoking habits.',
      options: ['Never', 'Former', 'Current']
    },
    {
      icon: Calendar,
      label: 'Years of Smoking',
      description: 'Enter the total number of years you have smoked. If you\'ve never smoked, enter zero.',
      example: '0 for non-smokers'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4">
          <HelpCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-4">Help Center</h1>
        <p className="text-xl text-gray-600">
          Understanding the input fields and how to use PulmoPredict
        </p>
      </div>

      {/* Input Field Explanation */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Input Field Explanation</h2>
        <div className="space-y-4">
          {inputFields.map((field, index) => (
            <div key={index} className="card">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <field.icon className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{field.label}</h3>
                  <p className="text-gray-600 mb-2">{field.description}</p>
                  {field.options && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.options.map((opt, i) => (
                        <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                  {field.example && (
                    <p className="text-sm text-gray-500 mt-2">Example: {field.example}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Help */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-purple-50">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Frequently Asked Questions</h3>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-gray-700">How accurate is the prediction?</p>
              <p className="text-gray-600">Our model has an accuracy rate of 84% based on clinical validation.</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Is my data secure?</p>
              <p className="text-gray-600">Yes, all data is encrypted and stored securely following healthcare data protection standards.</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Should I consult a doctor?</p>
              <p className="text-gray-600">Yes, this tool is for screening purposes only. Always consult healthcare professionals for medical advice.</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-pink-50 to-purple-50">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Important Notes</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Provide accurate information for best results</li>
                <li>• All fields are required for prediction</li>
                <li>• Results are estimates, not diagnoses</li>
                <li>• Regular screenings are recommended</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;