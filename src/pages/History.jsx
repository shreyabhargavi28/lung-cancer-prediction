import React, { useState, useEffect, useMemo } from 'react';
import { predictionAPI } from '../services/api';
import { 
  History as HistoryIcon, Calendar, ChevronDown, ChevronUp, Loader,
  TrendingUp, TrendingDown, Info, BarChart2, User, Search, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell,
} from 'recharts';

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

/* Format date to Indian Time (IST) */
const formatToIST = (timestamp) => {
  if (!timestamp) return 'N/A';

  // Force UTC if timezone missing
  const date = timestamp.includes('Z') || timestamp.includes('+')
    ? new Date(timestamp)
    : new Date(timestamp + 'Z');

  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};


/* Get date string for filtering (YYYY-MM-DD in IST) */
const getISTDateString = (timestamp) => {
  if (!timestamp) return '';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return formatter.format(new Date(timestamp)); // gives YYYY-MM-DD
};

const History = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [searchDate, setSearchDate] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await predictionAPI.getHistory();
      setPredictions(response.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      toast.error('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  // Filter predictions by selected date
  const filteredPredictions = useMemo(() => {
    if (!searchDate) return predictions;
    return predictions.filter(p => getISTDateString(p.timestamp) === searchDate);
  }, [predictions, searchDate]);

  const clearSearch = () => {
    setSearchDate('');
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low Risk': 
        return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100 text-green-700 border-green-200' };
      case 'Medium Risk': 
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
      case 'High Risk': 
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-700 border-red-200' };
      default: 
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const getShapEntries = (shapValues) => {
    if (!shapValues) return [];
    return Object.entries(shapValues)
      .map(([key, val]) => ({
        feature: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value: val,
        original: val,
        absVal: Math.abs(val),
      }))
      .filter(d => Math.abs(d.original) > 0)
      .sort((a, b) => b.absVal - a.absVal);
  };

  const getRiskFactors = (shapEntries) => {
    return shapEntries.filter(d => d.original > 0);
  };

  const getProtectiveFactors = (shapEntries) => {
    return shapEntries.filter(d => d.original < 0);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 shadow-lg shadow-blue-200 mb-5">
            <HistoryIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">Prediction History</h1>
          <p className="text-gray-400 mt-2 text-sm">
            View your past lung cancer risk assessments
          </p>
        </div>

        {/* Search Filter */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-2 shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="text-sm border-0 outline-none focus:ring-0 bg-transparent text-gray-700"
              placeholder="Filter by date"
            />
            {searchDate && (
              <button
                onClick={clearSearch}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          {searchDate && (
            <span className="ml-3 text-sm text-gray-500 self-center">
              {filteredPredictions.length} result{filteredPredictions.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>

        {filteredPredictions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              {searchDate ? 'No predictions on this date' : 'No predictions yet'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {searchDate ? 'Try another date or clear the filter' : 'Complete a risk assessment to see your history'}
            </p>
            {searchDate && (
              <button
                onClick={clearSearch}
                className="mt-4 text-blue-500 text-sm font-medium hover:text-blue-600"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPredictions.map((prediction) => {
              const riskColors = getRiskColor(prediction.prediction);
              const shapEntries = getShapEntries(prediction.shap_values);
              const riskFactors = getRiskFactors(shapEntries);
              const protectiveFactors = getProtectiveFactors(shapEntries);
              const isExpanded = expandedId === prediction._id;

              return (
                <div key={prediction._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all">
                  
                  {/* Header - Always visible */}
                  <div 
                    className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : prediction._id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setExpandedId(isExpanded ? null : prediction._id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${riskColors.badge}`}>
                        {prediction.prediction}
                      </span>
                      <span className="text-2xl font-black text-gray-800">
                        {prediction.probability}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {formatToIST(prediction.timestamp)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-100 animate-fade-in">
                      
                      {/* Input Summary */}
                      {prediction.input_summary && (
                        <div className="mt-5 mb-5">
                          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-500" />
                            Input Summary
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.entries(prediction.input_summary).slice(0, 12).map(([key, value]) => (
                              <div key={key} className="bg-gray-50 rounded-lg px-3 py-2">
                                <p className="text-xs text-gray-400 font-medium capitalize">
                                  {key.replace(/_/g, ' ')}
                                </p>
                                <p className="text-sm font-bold text-gray-800">
                                  {typeof value === 'number' ? value.toLocaleString() : value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Risk and Protective Factors */}
                      <div className="grid sm:grid-cols-2 gap-4 mb-5">
                        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-red-500" />
                            <h5 className="font-bold text-sm text-red-700">Risk Factors</h5>
                          </div>
                          {riskFactors.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {riskFactors.map((f, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <span className="text-sm text-gray-700">{f.feature}</span>
                                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                                    +{f.original.toFixed(3)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">None identified</p>
                          )}
                        </div>

                        <div className="bg-green-50 rounded-xl border border-green-100 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingDown className="w-4 h-4 text-green-600" />
                            <h5 className="font-bold text-sm text-green-700">Protective Factors</h5>
                          </div>
                          {protectiveFactors.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {protectiveFactors.map((f, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <span className="text-sm text-gray-700">{f.feature}</span>
                                  <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-lg">
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

                      {/* SHAP Feature Impact Chart */}
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart2 className="w-5 h-5 text-blue-500" />
                          <h4 className="font-bold text-gray-800">Feature Impact Analysis</h4>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">
                          SHAP values showing how each factor influenced the prediction
                        </p>

                        {/* Info box */}
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 mb-4">
                          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-blue-800">
                              <strong>How to read this chart:</strong> Each bar shows how much a factor influenced the prediction.
                            </p>
                            <div className="flex items-center gap-4 mt-1.5">
                              <span className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                                Increases risk
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                                Decreases risk
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Chart */}
                        {shapEntries.length > 0 ? (
                          <div style={{ height: Math.max(250, shapEntries.length * 38) }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={shapEntries}
                                layout="vertical"
                                margin={{ top: 4, right: 30, left: 110, bottom: 10 }}
                                barSize={16}
                              >
                                <XAxis
                                  type="number"
                                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                                  tickLine={false}
                                  axisLine={{ stroke: '#e5e7eb' }}
                                  tickFormatter={v => v.toFixed(2)}
                                />
                                <YAxis
                                  type="category"
                                  dataKey="feature"
                                  width={105}
                                  tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <Tooltip content={<ShapTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
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
                          <p className="text-sm text-gray-400 text-center py-8">
                            No feature impact data available
                          </p>
                        )}
                      </div>

                      {/* Model Info */}
                      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-end gap-4">
                        <span className="text-xs text-gray-400">
                          Model Accuracy: <span className="font-bold text-blue-600">{prediction.accuracy || 84}%</span>
                        </span>
                        <span className="text-xs text-gray-400">
                          Model: Random Forest
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;