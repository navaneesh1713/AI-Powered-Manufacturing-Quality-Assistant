import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { 
  FilePlus, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Settings, 
  Layers, 
  Sliders,
  Loader2,
  Sparkles
} from 'lucide-react';

const InspectionFormPage = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [batchNumber, setBatchNumber] = useState(`B${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-01`);
  const [stage, setStage] = useState('Final Assembly');
  const [operatorName, setOperatorName] = useState('John Miller');
  const [materialLot, setMaterialLot] = useState('LOT-ALU-9921');
  const [notes, setNotes] = useState('');
  
  // Machine settings map
  const [spindleRpm, setSpindleRpm] = useState('14500');
  const [feedRate, setFeedRate] = useState('1200');
  const [coolantTemp, setCoolantTemp] = useState('24.5');

  // Measurements & Defects state
  const [measurements, setMeasurements] = useState([]);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Fetch product specifications on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(response.data);
        if (response.data.length > 0) {
          setSelectedProductId(response.data[0]._id);
          populateSpecs(response.data[0]);
        }
      } catch (error) {
        console.error('Failed to load products', error);
      }
    };
    fetchProducts();
  }, []);

  const populateSpecs = (product) => {
    if (!product || !product.quality_specifications) return;
    const initialMeasurements = product.quality_specifications.map(spec => ({
      parameter: spec.parameter,
      value: spec.target_value ?? spec.min_limit,
      unit: spec.unit || 'mm',
      min_limit: spec.min_limit,
      max_limit: spec.max_limit
    }));
    setMeasurements(initialMeasurements);
    if (product.process_stages && product.process_stages.length > 0) {
      setStage(product.process_stages[0]);
    }
  };

  const handleProductChange = (e) => {
    const prodId = e.target.value;
    setSelectedProductId(prodId);
    const prod = products.find(p => p._id === prodId);
    populateSpecs(prod);
  };

  const handleMeasurementChange = (index, value) => {
    const updated = [...measurements];
    updated[index].value = value;
    setMeasurements(updated);
  };

  const addCustomMeasurement = () => {
    setMeasurements([
      ...measurements,
      { parameter: 'Custom Parameter', value: 0, unit: 'mm', min_limit: 0, max_limit: 100 }
    ]);
  };

  const removeMeasurement = (index) => {
    setMeasurements(measurements.filter((_, i) => i !== index));
  };

  const addDefect = () => {
    setDefects([
      ...defects,
      { defect_type: 'Surface Burr', count: 1, severity: 'Minor', description: 'Minor burr near edge' }
    ]);
  };

  const updateDefect = (index, field, value) => {
    const updated = [...defects];
    updated[index][field] = value;
    setDefects(updated);
  };

  const removeDefect = (index) => {
    setDefects(defects.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        batch_number: batchNumber,
        product_id: selectedProductId,
        stage,
        operator_name: operatorName,
        material_lots: [materialLot],
        machine_settings: {
          spindle_rpm: Number(spindleRpm) || 0,
          feed_rate_mm_min: Number(feedRate) || 0,
          coolant_temp_c: Number(coolantTemp) || 0
        },
        measurements: measurements.map(m => ({
          parameter: m.parameter,
          value: Number(m.value),
          unit: m.unit,
          min_limit: Number(m.min_limit),
          max_limit: Number(m.max_limit)
        })),
        defect_logs: defects,
        notes
      };

      const response = await api.post('/inspections', payload);
      setToast({ message: 'Quality Inspection record submitted successfully!', type: 'success' });
      
      setTimeout(() => {
        navigate(`/inspections/${response.data._id}`);
      }, 1000);
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to submit inspection', type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <FilePlus className="w-7 h-7 text-blue-500" />
          Log Quality Inspection Batch
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Record batch physical dimensions, machine settings, and physical defects for automated Gemini AI root-cause analysis
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Batch & Header Details */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-blue-400" />
            1. Batch Metadata & Line Info
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Product</label>
              <select
                value={selectedProductId}
                onChange={handleProductChange}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.product_code} - {p.product_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Batch Tracking Number</label>
              <input
                type="text"
                required
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Process Stage</label>
              <input
                type="text"
                required
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Inspector / Operator Name</label>
              <input
                type="text"
                required
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Material Lot Number(s)</label>
              <input
                type="text"
                value={materialLot}
                onChange={(e) => setMaterialLot(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Machine Settings */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Settings className="w-4 h-4 text-blue-400" />
            2. Machine Operating Parameters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Spindle Speed (RPM)</label>
              <input
                type="number"
                value={spindleRpm}
                onChange={(e) => setSpindleRpm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Feed Rate (mm/min)</label>
              <input
                type="number"
                value={feedRate}
                onChange={(e) => setFeedRate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Coolant Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={coolantTemp}
                onChange={(e) => setCoolantTemp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Measurements & Live Spec Check */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              3. Specification Measurements & Tolerance Check
            </h2>
            <button
              type="button"
              onClick={addCustomMeasurement}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-blue-400 border border-slate-700 rounded transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Parameter
            </button>
          </div>

          <div className="space-y-3">
            {measurements.map((m, idx) => {
              const val = Number(m.value);
              const isWithin = val >= m.min_limit && val <= m.max_limit;

              return (
                <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Parameter</span>
                      <input
                        type="text"
                        value={m.parameter}
                        onChange={(e) => {
                          const updated = [...measurements];
                          updated[idx].parameter = e.target.value;
                          setMeasurements(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Measured Value</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          value={m.value}
                          onChange={(e) => handleMeasurementChange(idx, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono font-bold text-slate-100"
                        />
                        <span className="text-xs text-slate-500 font-mono">{m.unit}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Spec Limits (Min - Max)</span>
                      <div className="text-xs font-mono text-slate-300 pt-1">
                        {m.min_limit} - {m.max_limit} {m.unit}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Live Validation</span>
                      <div className="pt-1">
                        {isWithin ? (
                          <span className="inline-flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Within Spec
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3 mr-1" /> BREACHED LIMIT
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeMeasurement(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition self-end md:self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Defect Logs */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              4. Physical Defect Logs (Optional)
            </h2>
            <button
              type="button"
              onClick={addDefect}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-amber-400 border border-slate-700 rounded transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Defect Record
            </button>
          </div>

          {defects.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No physical defect logs added for this inspection.</p>
          ) : (
            <div className="space-y-3">
              {defects.map((d, idx) => (
                <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Defect Type</span>
                    <input
                      type="text"
                      value={d.defect_type}
                      onChange={(e) => updateDefect(idx, 'defect_type', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Severity</span>
                    <select
                      value={d.severity}
                      onChange={(e) => updateDefect(idx, 'severity', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    >
                      <option value="Minor">Minor</option>
                      <option value="Major">Major</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Description / Location</span>
                    <input
                      type="text"
                      value={d.description}
                      onChange={(e) => updateDefect(idx, 'description', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Count</span>
                      <input
                        type="number"
                        min="1"
                        value={d.count}
                        onChange={(e) => updateDefect(idx, 'count', Number(e.target.value))}
                        className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 text-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDefect(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Notes & Submit */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg space-y-4">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Shift Observations & Inspection Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any contextual operator notes, ambient temperature shifts, or tool changes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-blue-200" />}
              Save Inspection & Open Gemini Analysis
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InspectionFormPage;
