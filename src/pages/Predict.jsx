import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictionAPI } from '../services/api';
import {
  Activity, Loader, User, Users, Cigarette, Wind,
  Heart, AlertCircle, CheckCircle, ArrowRight,
  TrendingUp, TrendingDown, ChevronRight,
  Info, BarChart2,Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell,
} from 'recharts';
 
/* ─────────────────────────────────────────────────────────────
   Shared primitives
   ───────────────────────────────────────────────────────────── */
 
const SectionCard = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-5">
    <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-50">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-blue-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
    </div>
    {children}
  </div>
);
 
const FieldLabel = ({ children, hint }) => (
  <div className="mb-2">
    <span className="block text-sm font-semibold text-gray-700">{children}</span>
  </div>
);
 
const TextInput = ({ hint, ...props }) => (
  <div>
    <input
      {...props}
      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white text-gray-800
        placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400
        transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
    />
    {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
  </div>
);
 
/* Segmented toggle (Male/Female, No/Yes for smoker) */
const SegmentToggle = ({ name, value, options, onChange }) => (
  <div
    className="grid rounded-xl overflow-hidden border border-gray-200"
    style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
  >
    {options.map(([v, label]) => (
      <button
        key={v}
        type="button"
        onClick={() => onChange({ target: { name, value: v } })}
        className={`py-3 text-sm font-semibold transition-all duration-150
          border-r border-gray-200 last:border-r-0
          ${value === v
            ? 'bg-blue-500 text-white shadow-sm'
            : 'bg-white text-gray-500 hover:bg-gray-50'}`}
      >
        {label}
      </button>
    ))}
  </div>
);
 
/* Yes/No toggle matching screenshots: No=green when selected, Yes=red when selected */
const YesNoToggle = ({ name, value, onChange, hint }) => {
  const isYes = value === '1';
  return (
    <div>
      <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-gray-200">
        <button
          type="button"
          onClick={() => onChange({ target: { name, value: '0' } })}
          className={`py-3 text-sm font-semibold transition-all duration-150
            border-r border-gray-200
            ${!isYes
              ? 'bg-green-50 text-green-700 border border-green-300'
              : 'bg-white text-gray-400 hover:bg-gray-50'}`}
        >
          No
        </button>
        <button
          type="button"
          onClick={() => onChange({ target: { name, value: '1' } })}
          className={`py-3 text-sm font-semibold transition-all duration-150
            ${isYes
              ? 'bg-red-50 text-red-600 border border-red-300'
              : 'bg-white text-gray-400 hover:bg-gray-50'}`}
        >
          Yes
        </button>
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
};
 
/* SVG circular gauge — matches screenshot exactly */
const CircularGauge = ({ value, color }) => {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="90" cy="90" r={r} fill="none" stroke="#e5e7eb" strokeWidth="14" />
        <circle
          cx="90" cy="90" r={r} fill="none"
          stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color }}>{value}%</span>
        <span className="text-xs text-gray-400 font-medium mt-0.5">Risk Score</span>
      </div>
    </div>
  );
};
 
/* Custom SHAP tooltip */
const ShapTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const pos = d?.original > 0;
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-xl shadow-xl">
      <p className="font-semibold mb-1">{d?.feature}</p>
      <p className={pos ? 'text-red-300' : 'text-green-300'}>
        {pos ? 'Increases' : 'Decreases'} risk: {d?.original > 0 ? '+' : ''}{d?.original?.toFixed(4)}
      </p>
    </div>
  );
};
 
/* ─────────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────────── */
const Predict = () => {
  const navigate = useNavigate();
 
  const [formData, setFormData] = useState({
    age: '',
    gender: '1',
    smoker: '0',
    smoking_years: '0',
    cigarettes_per_day: '0',
    air_pollution_index: '',
    chest_pain: '0',
    shortness_of_breath: '0',
    chronic_cough: '0',
    asthma: '0',
    family_history_cancer: '0',
    bmi: '',
  });
 
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
 
  /* ── Unchanged logic ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'smoker' && value === '0') {
      setFormData(prev => ({ ...prev, [name]: value, smoking_years: '0', cigarettes_per_day: '0' }));
    }
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        age: parseInt(formData.age),
        gender: parseInt(formData.gender),
        smoker: parseInt(formData.smoker),
        smoking_years: parseInt(formData.smoking_years),
        cigarettes_per_day: parseInt(formData.cigarettes_per_day),
        air_pollution_index: parseInt(formData.air_pollution_index),
        chest_pain: parseInt(formData.chest_pain),
        shortness_of_breath: parseInt(formData.shortness_of_breath),
        chronic_cough: parseInt(formData.chronic_cough),
        asthma: parseInt(formData.asthma),
        family_history_cancer: parseInt(formData.family_history_cancer),
        bmi: parseFloat(formData.bmi),
      };
      const response = await predictionAPI.predict(payload);
      setResult(response.data);
      setShowResults(true);
      toast.success('Prediction completed!');
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };
 
  /* ── Derived data ── */
  const riskLevel = result?.risk_level || 'Low Risk';
  const gaugeColor =
    riskLevel === 'Low Risk' ? '#22c55e' :
    riskLevel === 'High Risk' ? '#ef4444' : '#f59e0b';
 
  const riskBadgeClass =
    riskLevel === 'Low Risk' ? 'bg-green-100 text-green-700 border border-green-200' :
    riskLevel === 'High Risk' ? 'bg-red-100 text-red-700 border border-red-200' :
    'bg-yellow-100 text-yellow-700 border border-yellow-200';
 
  // ✅ FIXED: Show ALL attributes that have any non-zero contribution
  const shapEntries = result?.shap_values
    ? Object.entries(result.shap_values)
        .map(([key, val]) => ({
          feature: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          value: val,
          original: val,
          absVal: Math.abs(val),
        }))
        // ✅ Only filter out exact zero values, keep everything else
        .filter(d => Math.abs(d.original) > 0)
        .sort((a, b) => b.absVal - a.absVal)
    : [];
 
  // ✅ Get ALL risk factors (positive values)
  const topRiskFactors = shapEntries.filter(d => d.original > 0);
  
  // ✅ Get ALL protective factors (negative values)
  const protectiveFactors = shapEntries.filter(d => d.original < 0);
  
  // Primary factor is the one with largest absolute impact
  const primaryFactor = shapEntries.length > 0 ? shapEntries[0] : null;
 
  /* ══════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50">
 
      {/* ════════════ FORM VIEW ════════════ */}
      {!showResults && (
        <div className="max-w-3xl mx-auto px-4 py-10">
 
          {/* Page title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 shadow-lg shadow-blue-200 mb-5">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900">Lung Cancer Risk Assessment</h1>
            <p className="text-gray-400 mt-2 text-sm max-w-md mx-auto">
              Complete the form below to receive a personalized risk assessment based on your health factors.
            </p>
          </div>
 
          <form onSubmit={handleSubmit}>
 
            {/* 1 — Personal Information */}
            <SectionCard icon={User} title="Personal Information">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <FieldLabel>Age</FieldLabel>
                  <TextInput
                    type="number" name="age" value={formData.age}
                    onChange={handleChange} required min="18" max="100"
                    placeholder="Enter your current age in years"
                    hint="Enter your current age in years"
                  />
                </div>
                <div>
                  <FieldLabel>Gender</FieldLabel>
                  <SegmentToggle
                    name="gender" value={formData.gender}
                    options={[['0', 'Female'], ['1', 'Male']]}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="mt-6 max-w-xs">
                <FieldLabel>BMI (Body Mass Index)</FieldLabel>
                <TextInput
                  type="number" name="bmi" value={formData.bmi}
                  onChange={handleChange} step="0.1" min="10" max="60"
                  placeholder="e.g., 24"
                  hint="Weight(kg) / Height(m)²"
                />
              </div>
            </SectionCard>
 
            {/* 2 — Smoking History */}
            <SectionCard icon={Cigarette} title="Smoking History">
              <div className="mb-6">
                <FieldLabel>Are you a smoker?</FieldLabel>
                <SegmentToggle
                  name="smoker" value={formData.smoker}
                  options={[['0', 'No'], ['1', 'Yes']]}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-400 mt-1.5">Current or former smoker</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <FieldLabel>Years of Smoking</FieldLabel>
                  <TextInput
                    type="number" name="smoking_years" value={formData.smoking_years}
                    onChange={handleChange} disabled={formData.smoker === '0'} min="0"
                    placeholder="0"
                    hint="Total years as a smoker (enter 0 if never smoked)"
                  />
                </div>
                <div>
                  <FieldLabel>Cigarettes per Day</FieldLabel>
                  <TextInput
                    type="number" name="cigarettes_per_day" value={formData.cigarettes_per_day}
                    onChange={handleChange} disabled={formData.smoker === '0'} min="0"
                    placeholder="0"
                    hint="Average daily consumption (enter 0 if non-smoker)"
                  />
                </div>
              </div>
            </SectionCard>
 
            {/* 3 — Environmental Factors */}
            <SectionCard icon={Wind} title="Environmental Factors">
              <div className="max-w-sm">
                <FieldLabel>Air Pollution Index</FieldLabel>
                <TextInput
                  type="number" name="air_pollution_index"
                  value={formData.air_pollution_index}
                  onChange={handleChange} min="1" max="500"
                  placeholder="e.g., 149"
                  hint="Local air quality index (0–500, higher = more pollution)"
                />
              </div>
            </SectionCard>
 
            {/* 4 — Current Symptoms */}
            <SectionCard icon={Heart} title="Current Symptoms">
              <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
                {[
                  { name: 'chest_pain', label: 'Chest Pain', hint: 'Persistent pain in chest area' },
                  { name: 'shortness_of_breath', label: 'Shortness of Breath', hint: 'Difficulty breathing during normal activities' },
                  { name: 'chronic_cough', label: 'Chronic Cough', hint: 'Persistent cough lasting 3+ weeks' },
                  { name: 'asthma', label: 'Asthma', hint: 'Diagnosed asthma condition' },
                ].map(f => (
                  <div key={f.name}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">{f.label}</p>
                    <YesNoToggle name={f.name} value={formData[f.name]} onChange={handleChange} hint={f.hint} />
                  </div>
                ))}
              </div>
            </SectionCard>
 
            {/* 5 — Medical History */}
            <SectionCard icon={Users} title="Medical History">
              <div className="max-w-sm">
                <p className="text-sm font-semibold text-gray-700 mb-2">Family History of Cancer</p>
                <YesNoToggle
                  name="family_history_cancer"
                  value={formData.family_history_cancer}
                  onChange={handleChange}
                  hint="Immediate family members diagnosed with cancer"
                />
              </div>
            </SectionCard>
 
            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-white text-base
                bg-gradient-to-r from-blue-500 to-indigo-600
                hover:from-blue-600 hover:to-indigo-700
                shadow-lg shadow-blue-200 transition-all duration-150
                flex items-center justify-center gap-2.5
                disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? (
                <><Loader className="w-5 h-5 animate-spin" /> Analysing…</>
              ) : (
                <><Activity className="w-5 h-5" /> Get Risk Assessment <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              Your data is securely stored to provide prediction history and insights.
            </p>
 
          </form>
        </div>
      )}
 
      {/* ════════════ RESULTS VIEW ════════════ */}
      {showResults && result && (
        <div id="results-section" className="max-w-4xl mx-auto px-4 py-10">
 
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900">Risk Assessment Results</h1>
            <p className="text-gray-400 mt-2 text-sm">Based on the information you provided</p>
          </div>
 
{/* ── Prediction Summary ── */}
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
    <h2 className="text-white font-bold text-base tracking-wide">Prediction Summary</h2>
  </div>
  <div className="px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
    {/* Risk Level */}
    <div className="text-center sm:text-left">
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-3">Risk Level</p>
      <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold ${riskBadgeClass}`}>
        {riskLevel === 'Low Risk'
          ? <CheckCircle className="w-4 h-4" />
          : <AlertCircle className="w-4 h-4" />}
        {riskLevel}
      </span>
    </div>
    
    {/* Gauge */}
    <CircularGauge value={result.probability} color={gaugeColor} />
    
    {/* Primary Risk Factor with Accuracy */}
    <div className="text-center sm:text-right">
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-3">Model Accuracy</p>
      <div className="inline-block px-5 py-3 rounded-xl bg-blue-50 border border-blue-100 text-left">
        <p className="text-blue-600 font-bold text-sm flex items-center gap-1">
          <Shield className="w-4 h-4" />
          {result.accuracy}% Accurate
        </p>
        <p className="text-blue-400 text-xs mt-0.5">
          Random Forest Model
        </p>
      </div>
    </div>
  </div>
  
  {/* Add Primary Factor below */}
  {primaryFactor && (
    <div className="px-8 pb-6 text-center border-t border-gray-100 pt-4">
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-2">Primary Risk Factor</p>
      <p className="text-gray-800 font-bold">
        {primaryFactor.feature}
        <span className="text-red-500 ml-2">+{primaryFactor.original.toFixed(3)}</span>
      </p>
    </div>
  )}
</div>
 
          {/* ── Top Risk + Protective Factors ── */}
          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-sm text-red-700">Risk Factors</h3>
              </div>
              {topRiskFactors.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {topRiskFactors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{f.feature}</span>
                      <span className="text-xs font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-lg">
                        +{f.original.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">None identified</p>
              )}
            </div>
 
            <div className="bg-green-50 rounded-2xl border border-green-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4 text-green-600" />
                <h3 className="font-bold text-sm text-green-700">Protective Factors</h3>
              </div>
              {protectiveFactors.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {protectiveFactors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{f.feature}</span>
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-lg">
                        {f.original.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-green-600 font-medium">None identified</p>
              )}
            </div>
          </div>
 
          {/* ── SHAP Feature Impact Chart ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-gray-800">Feature Impact Analysis</h3>
            </div>
            <p className="text-xs text-gray-400 mb-5">SHAP values showing how each factor influenced the prediction</p>
 
            {/* Info box */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 mb-6">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-blue-800">
                  <strong>How to read this chart:</strong> Each bar shows how much a factor influenced the
                  prediction. All input features with any contribution are shown.
                </p>
                <div className="flex items-center gap-5 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                    Increases risk
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                    <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                    Decreases risk
                  </span>
                </div>
              </div>
            </div>
 
            {/* Diverging bar chart - ✅ Shows ALL features */}
            {shapEntries.length > 0 ? (
              <div style={{ height: Math.max(350, shapEntries.length * 42) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shapEntries}
                    layout="vertical"
                    margin={{ top: 4, right: 40, left: 120, bottom: 20 }}
                    barSize={18}
                  >
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickFormatter={v => v.toFixed(2)}
                    />
                    <YAxis
                      type="category"
                      dataKey="feature"
                      width={115}
                      tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ShapTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                    <ReferenceLine x={0} stroke="#d1d5db" strokeWidth={1.5} />
                    <Bar dataKey="original" radius={[4, 4, 4, 4]}>
                      {shapEntries.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.original > 0 ? '#ef4444' : '#22c55e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-10">No feature impact data available</p>
            )}
          </div>
 
{/* ── Patient Info summary ── */}
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
  <h3 className="font-bold text-gray-800 mb-4">Your Input Summary</h3>
  {result.input_summary ? (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Object.entries(result.input_summary).map(([key, value]) => (
        <div key={key} className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400 font-medium capitalize">
            {key.replace(/_/g, ' ')}
          </p>
          <p className="text-sm font-bold text-gray-800 mt-0.5">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      ))}
    </div>
  ) : (
    // Fallback to formData if input_summary not available
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[
        { label: 'Age', value: `${formData.age} years` },
        { label: 'Gender', value: formData.gender === '1' ? 'Male' : 'Female' },
        { label: 'BMI', value: formData.bmi || '—' },
        { label: 'Smoker', value: formData.smoker === '1' ? 'Yes' : 'No' },
        { label: 'Smoking Years', value: formData.smoking_years || '0' },
        { label: 'Cigarettes/Day', value: formData.cigarettes_per_day || '0' },
        { label: 'Air Pollution', value: formData.air_pollution_index },
        { label: 'Chest Pain', value: formData.chest_pain === '1' ? 'Yes' : 'No' },
        { label: 'Shortness of Breath', value: formData.shortness_of_breath === '1' ? 'Yes' : 'No' },
        { label: 'Chronic Cough', value: formData.chronic_cough === '1' ? 'Yes' : 'No' },
        { label: 'Asthma', value: formData.asthma === '1' ? 'Yes' : 'No' },
        { label: 'Family History', value: formData.family_history_cancer === '1' ? 'Yes' : 'No' },
        { label: 'Model Accuracy', value: `${result.accuracy}%` },
      ].map((item, i) => (
        <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400 font-medium">{item.label}</p>
          <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
        </div>
      ))}
    </div>
  )}
</div>
 
          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8">
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Medical Disclaimer:</strong> This assessment is generated by an AI model for informational
              purposes only and does not constitute medical advice. Please consult a qualified healthcare professional
              for proper diagnosis and treatment.
            </p>
          </div>
 
          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => navigate('/history')}
              className="px-6 py-3 text-sm font-semibold text-gray-600 bg-white border border-gray-200
                rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              View History <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowResults(false); setResult(null); }}
              className="px-6 py-3 text-sm font-semibold text-white
                bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl
                hover:from-blue-600 hover:to-indigo-700
                shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" /> New Assessment
            </button>
          </div>
 
        </div>
      )}
    </div>
  );
};
 
export default Predict;