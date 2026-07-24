import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Box, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Layers, 
  Sliders, 
  Loader2
} from 'lucide-react';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Form state
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [processStages, setProcessStages] = useState('Investment Casting, CNC Machining, Thermal Coating, Final Inspection');
  const [qualitySpecs, setQualitySpecs] = useState([
    { parameter: 'Airfoil Thickness', min_limit: 12.40, max_limit: 12.60, unit: 'mm', target_value: 12.50 }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addSpecRow = () => {
    setQualitySpecs([
      ...qualitySpecs,
      { parameter: 'Parameter Name', min_limit: 0, max_limit: 100, unit: 'mm', target_value: 50 }
    ]);
  };

  const removeSpecRow = (idx) => {
    setQualitySpecs(qualitySpecs.filter((_, i) => i !== idx));
  };

  const updateSpecRow = (idx, field, value) => {
    const updated = [...qualitySpecs];
    updated[idx][field] = value;
    setQualitySpecs(updated);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const stagesArray = processStages.split(',').map(s => s.trim()).filter(Boolean);
      const payload = {
        product_code: productCode.toUpperCase(),
        product_name: productName,
        process_stages: stagesArray,
        quality_specifications: qualitySpecs.map(s => ({
          parameter: s.parameter,
          min_limit: Number(s.min_limit),
          max_limit: Number(s.max_limit),
          target_value: Number(s.target_value),
          unit: s.unit
        }))
      };

      await api.post('/products', payload);
      setToast({ message: `Product Plan ${productCode} created successfully!`, type: 'success' });
      setIsCreating(false);
      setProductCode('');
      setProductName('');
      fetchProducts();
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to create product plan', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Box className="w-7 h-7 text-blue-500" />
            Manufacturing Product Specifications & Plan Limits
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure Quality Control min/max specification limits, target values, and process stage workflows
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/30 transition flex items-center gap-2 self-start md:self-auto"
        >
          {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isCreating ? 'Cancel New Spec Plan' : 'Define New Product Specs'}
        </button>
      </div>

      {/* New Product Plan Form */}
      {isCreating && (
        <form onSubmit={handleCreateProduct} className="p-6 bg-slate-900 border border-blue-500/40 rounded-xl shadow-2xl space-y-6">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            Create Product Specification Master
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Code (e.g. TB-900)</label>
              <input
                type="text"
                required
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="TB-900"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name</label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Titanium Turbine Blade Gen-9"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Process Stages (Comma Separated)</label>
            <input
              type="text"
              value={processStages}
              onChange={(e) => setProcessStages(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Quality Specifications & Min/Max Limits
              </label>
              <button
                type="button"
                onClick={addSpecRow}
                className="px-2.5 py-1 bg-slate-800 text-xs text-blue-400 rounded hover:bg-slate-700 transition"
              >
                + Add Parameter
              </button>
            </div>

            {qualitySpecs.map((spec, idx) => (
              <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Parameter</span>
                  <input
                    type="text"
                    required
                    value={spec.parameter}
                    onChange={(e) => updateSpecRow(idx, 'parameter', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Min Limit</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={spec.min_limit}
                    onChange={(e) => updateSpecRow(idx, 'min_limit', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Max Limit</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={spec.max_limit}
                    onChange={(e) => updateSpecRow(idx, 'max_limit', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Target / Unit</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      value={spec.target_value}
                      onChange={(e) => updateSpecRow(idx, 'target_value', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    />
                    <input
                      type="text"
                      value={spec.unit}
                      onChange={(e) => updateSpecRow(idx, 'unit', e.target.value)}
                      className="w-12 bg-slate-900 border border-slate-800 rounded px-1 py-1 text-xs text-slate-200 text-center font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeSpecRow(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Product Specification
            </button>
          </div>
        </form>
      )}

      {/* Product List Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <Box className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-medium">No product plans registered.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((prod) => (
            <div key={prod._id} className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-xs text-blue-400 font-bold px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded">
                    {prod.product_code}
                  </span>
                  <h3 className="text-base font-bold text-slate-100 mt-1">{prod.product_name}</h3>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Process Workflow Stages:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {prod.process_stages?.map((stage, idx) => (
                    <span key={idx} className="text-[11px] px-2 py-0.5 bg-slate-950 text-slate-300 border border-slate-800 rounded">
                      {idx + 1}. {stage}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Quality Specification Bounds:
                </span>
                <div className="space-y-1.5">
                  {prod.quality_specifications?.map((spec, idx) => (
                    <div key={idx} className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-200">{spec.parameter}</span>
                      <span className="font-mono text-slate-400">
                        {spec.min_limit} to {spec.max_limit} {spec.unit} (Target: {spec.target_value ?? 'N/A'})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
