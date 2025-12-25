import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { Card } from '../components/Card';
import Button from '../components/Button';
import { Input, Select, Textarea } from '../components/Input';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/Table';
import { StatusBadge } from '../components/Badge';
import Modal from '../components/Modal';
import { PageLoading } from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { loanProductsAPI } from '../services/api';
import { useApp } from '../context/AppContext';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const initialFormState = {
  productCode: '',
  productName: '',
  description: '',
  interestRate: '',
  interestType: 'REDUCING_BALANCE',
  minLoanAmount: '',
  maxLoanAmount: '',
  minTenureMonths: '',
  maxTenureMonths: '',
  processingFeePercent: '1',
  ltv: '50',
  eligibleMutualFundTypes: [],
  prepaymentChargePercent: '0',
  latePaymentChargePercent: '2',
  status: 'ACTIVE'
};

const LoanProducts = () => {
  const { showSuccess, showError } = useApp();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [saving, setSaving] = useState(false);

  const fundTypes = [
    { value: 'EQUITY', label: 'Equity' },
    { value: 'DEBT', label: 'Debt' },
    { value: 'HYBRID', label: 'Hybrid' },
    { value: 'LIQUID', label: 'Liquid' },
    { value: 'ELSS', label: 'ELSS' },
    { value: 'INDEX', label: 'Index' }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await loanProductsAPI.getAll({ limit: 50 });
      setProducts(response.data.products);
    } catch (error) {
      showError(error.message || 'Failed to fetch loan products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        productCode: product.productCode,
        productName: product.productName,
        description: product.description,
        interestRate: product.interestRate.toString(),
        interestType: product.interestType,
        minLoanAmount: product.minLoanAmount.toString(),
        maxLoanAmount: product.maxLoanAmount.toString(),
        minTenureMonths: product.minTenureMonths.toString(),
        maxTenureMonths: product.maxTenureMonths.toString(),
        processingFeePercent: product.processingFeePercent.toString(),
        ltv: product.ltv.toString(),
        eligibleMutualFundTypes: product.eligibleMutualFundTypes || [],
        prepaymentChargePercent: product.prepaymentChargePercent.toString(),
        latePaymentChargePercent: product.latePaymentChargePercent.toString(),
        status: product.status
      });
    } else {
      setEditingProduct(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(initialFormState);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFundTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      eligibleMutualFundTypes: prev.eligibleMutualFundTypes.includes(type)
        ? prev.eligibleMutualFundTypes.filter(t => t !== type)
        : [...prev.eligibleMutualFundTypes, type]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const payload = {
        ...formData,
        interestRate: parseFloat(formData.interestRate),
        minLoanAmount: parseFloat(formData.minLoanAmount),
        maxLoanAmount: parseFloat(formData.maxLoanAmount),
        minTenureMonths: parseInt(formData.minTenureMonths),
        maxTenureMonths: parseInt(formData.maxTenureMonths),
        processingFeePercent: parseFloat(formData.processingFeePercent),
        ltv: parseFloat(formData.ltv),
        prepaymentChargePercent: parseFloat(formData.prepaymentChargePercent),
        latePaymentChargePercent: parseFloat(formData.latePaymentChargePercent)
      };

      if (editingProduct) {
        await loanProductsAPI.update(editingProduct._id, payload);
        showSuccess('Loan product updated successfully');
      } else {
        await loanProductsAPI.create(payload);
        showSuccess('Loan product created successfully');
      }

      handleCloseModal();
      fetchProducts();
    } catch (error) {
      showError(error.message || 'Failed to save loan product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!confirm('Are you sure you want to discontinue this product?')) return;
    
    try {
      await loanProductsAPI.delete(product._id);
      showSuccess('Loan product discontinued');
      fetchProducts();
    } catch (error) {
      showError(error.message || 'Failed to discontinue product');
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Loan Products</h1>
          <p className="text-dark-400 mt-1">Manage loan products for LAMF</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {products.map((product) => (
            <Card key={product._id} className="group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{product.productName}</h3>
                    <p className="text-sm font-mono text-primary-400">{product.productCode}</p>
                  </div>
                </div>
                <StatusBadge status={product.status} />
              </div>

              <p className="text-sm text-dark-400 mb-4 line-clamp-2">{product.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-dark-800/50">
                  <p className="text-xs text-dark-500 mb-1">Interest Rate</p>
                  <p className="text-lg font-bold gradient-text">{product.interestRate}% p.a.</p>
                </div>
                <div className="p-3 rounded-xl bg-dark-800/50">
                  <p className="text-xs text-dark-500 mb-1">LTV Ratio</p>
                  <p className="text-lg font-bold text-white">{product.ltv}%</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Loan Range</span>
                  <span className="text-white">
                    {formatCurrency(product.minLoanAmount)} - {formatCurrency(product.maxLoanAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Tenure</span>
                  <span className="text-white">
                    {product.minTenureMonths} - {product.maxTenureMonths} months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Processing Fee</span>
                  <span className="text-white">{product.processingFeePercent}%</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {product.eligibleMutualFundTypes?.map((type) => (
                  <span
                    key={type}
                    className="px-2 py-1 rounded-lg bg-primary-500/10 text-primary-400 text-xs"
                  >
                    {type}
                  </span>
                ))}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Edit2}
                  onClick={() => handleOpenModal(product)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDelete(product)}
                >
                  Discontinue
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Package}
            title="No loan products"
            description="Create your first loan product to get started"
            action={() => handleOpenModal()}
            actionLabel="Add Product"
          />
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Edit Loan Product' : 'Create Loan Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Product Code"
              name="productCode"
              value={formData.productCode}
              onChange={handleChange}
              placeholder="e.g., LAMF-EQUITY"
              required
            />
            <Input
              label="Product Name"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              placeholder="e.g., Loan Against Equity MF"
              required
            />
          </div>

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Describe the loan product..."
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Interest Rate (%)"
              name="interestRate"
              type="number"
              step="0.1"
              value={formData.interestRate}
              onChange={handleChange}
              required
            />
            <Select
              label="Interest Type"
              name="interestType"
              value={formData.interestType}
              onChange={handleChange}
              options={[
                { value: 'REDUCING_BALANCE', label: 'Reducing Balance' },
                { value: 'FIXED', label: 'Fixed' },
                { value: 'FLOATING', label: 'Floating' }
              ]}
            />
            <Input
              label="LTV Ratio (%)"
              name="ltv"
              type="number"
              value={formData.ltv}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Loan Amount (₹)"
              name="minLoanAmount"
              type="number"
              value={formData.minLoanAmount}
              onChange={handleChange}
              required
            />
            <Input
              label="Max Loan Amount (₹)"
              name="maxLoanAmount"
              type="number"
              value={formData.maxLoanAmount}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Tenure (months)"
              name="minTenureMonths"
              type="number"
              value={formData.minTenureMonths}
              onChange={handleChange}
              required
            />
            <Input
              label="Max Tenure (months)"
              name="maxTenureMonths"
              type="number"
              value={formData.maxTenureMonths}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Processing Fee (%)"
              name="processingFeePercent"
              type="number"
              step="0.1"
              value={formData.processingFeePercent}
              onChange={handleChange}
            />
            <Input
              label="Prepayment Charge (%)"
              name="prepaymentChargePercent"
              type="number"
              step="0.1"
              value={formData.prepaymentChargePercent}
              onChange={handleChange}
            />
            <Input
              label="Late Payment (%)"
              name="latePaymentChargePercent"
              type="number"
              step="0.1"
              value={formData.latePaymentChargePercent}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Eligible Mutual Fund Types
            </label>
            <div className="flex flex-wrap gap-2">
              {fundTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleFundTypeChange(type.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    formData.eligibleMutualFundTypes.includes(type.value)
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'bg-dark-800/50 text-dark-400 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LoanProducts;

