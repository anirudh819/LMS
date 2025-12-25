import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Plus, Trash2, CheckCircle, Search } from 'lucide-react';
import { Card } from '../components/Card';
import Button from '../components/Button';
import { Input, Select, Textarea } from '../components/Input';
import Badge from '../components/Badge';
import { PageLoading } from '../components/Loading';
import { loanProductsAPI, customersAPI, loanApplicationsAPI } from '../services/api';
import { useApp } from '../context/AppContext';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const fundTypes = [
  { value: 'EQUITY', label: 'Equity' },
  { value: 'DEBT', label: 'Debt' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'LIQUID', label: 'Liquid' },
  { value: 'ELSS', label: 'ELSS' },
  { value: 'INDEX', label: 'Index' }
];

const CreateApplication = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useApp();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '',
    loanProductId: '',
    requestedAmount: '',
    requestedTenureMonths: '',
    purpose: ''
  });

  const [collaterals, setCollaterals] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [productsRes, customersRes] = await Promise.all([
        loanProductsAPI.getAll({ status: 'ACTIVE' }),
        customersAPI.getAll({ limit: 100 })
      ]);
      setProducts(productsRes.data.products);
      setCustomers(customersRes.data.customers);
    } catch (error) {
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({ ...prev, customerId: customer._id }));
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p._id === productId);
    setSelectedProduct(product);
    setFormData(prev => ({ ...prev, loanProductId: productId }));
  };

  const addCollateral = () => {
    setCollaterals(prev => [...prev, {
      id: Date.now(),
      fundName: '',
      fundHouse: '',
      schemeCode: '',
      folioNumber: '',
      isin: '',
      fundType: 'EQUITY',
      units: '',
      navAtPledge: ''
    }]);
  };

  const updateCollateral = (id, field, value) => {
    setCollaterals(prev =>
      prev.map(col =>
        col.id === id ? { ...col, [field]: value } : col
      )
    );
  };

  const removeCollateral = (id) => {
    setCollaterals(prev => prev.filter(col => col.id !== id));
  };

  const calculateEligibility = () => {
    if (!selectedProduct) return { totalValue: 0, eligibleAmount: 0 };
    
    const totalValue = collaterals.reduce((sum, col) => {
      const units = parseFloat(col.units) || 0;
      const nav = parseFloat(col.navAtPledge) || 0;
      return sum + (units * nav);
    }, 0);

    const eligibleAmount = totalValue * (selectedProduct.ltv / 100);
    return { totalValue, eligibleAmount };
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      const { totalValue, eligibleAmount } = calculateEligibility();
      const requestedAmount = parseFloat(formData.requestedAmount);

      if (requestedAmount > eligibleAmount) {
        showError(`Requested amount exceeds eligible amount of ${formatCurrency(eligibleAmount)}`);
        return;
      }

      const payload = {
        customerId: formData.customerId,
        loanProductId: formData.loanProductId,
        requestedAmount,
        requestedTenureMonths: parseInt(formData.requestedTenureMonths),
        purpose: formData.purpose,
        collaterals: collaterals.map(col => ({
          fundName: col.fundName,
          fundHouse: col.fundHouse,
          schemeCode: col.schemeCode,
          folioNumber: col.folioNumber,
          isin: col.isin,
          fundType: col.fundType,
          units: parseFloat(col.units),
          navAtPledge: parseFloat(col.navAtPledge),
          currentNav: parseFloat(col.navAtPledge)
        })),
        source: 'WEB'
      };

      const response = await loanApplicationsAPI.create(payload);
      showSuccess('Loan application created successfully');
      navigate('/loan-applications');
    } catch (error) {
      showError(error.message || 'Failed to create application');
    } finally {
      setSubmitting(false);
    }
  };

  const isStep1Valid = selectedCustomer && selectedProduct;
  const isStep2Valid = collaterals.length > 0 && collaterals.every(col =>
    col.fundName && col.folioNumber && col.isin && col.units && col.navAtPledge
  );
  const isStep3Valid = formData.requestedAmount && formData.requestedTenureMonths && formData.purpose;

  const filteredCustomers = customers.filter(c =>
    `${c.firstName} ${c.lastName} ${c.email} ${c.panNumber}`
      .toLowerCase()
      .includes(customerSearch.toLowerCase())
  );

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Create New Application</h1>
          <p className="text-dark-400 mt-1">Complete the steps to submit a loan application</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 p-4 glass rounded-2xl">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`flex items-center gap-2 cursor-pointer ${step >= s ? 'text-white' : 'text-dark-500'}`}
              onClick={() => s < step && setStep(s)}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step > s
                    ? 'bg-green-500'
                    : step === s
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500'
                    : 'bg-dark-700'
                }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              <span className="hidden sm:inline font-medium">
                {s === 1 ? 'Customer & Product' : s === 2 ? 'Collaterals' : 'Loan Details'}
              </span>
            </div>
            {s < 3 && (
              <div className={`flex-1 h-0.5 ${step > s ? 'bg-green-500' : 'bg-dark-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Customer & Product Selection */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Customer Selection */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Select Customer</h3>
            <Input
              icon={Search}
              placeholder="Search by name, email, or PAN..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="mb-4"
            />
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer._id}
                  onClick={() => handleCustomerSelect(customer)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedCustomer?._id === customer._id
                      ? 'bg-primary-500/20 border border-primary-500/50'
                      : 'bg-dark-800/50 hover:bg-dark-800 border border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p className="text-sm text-dark-400">{customer.email}</p>
                    </div>
                    <Badge variant="info" size="sm">{customer.panNumber}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Product Selection */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Select Loan Product</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  onClick={() => handleProductSelect(product._id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedProduct?._id === product._id
                      ? 'bg-primary-500/20 border border-primary-500/50'
                      : 'bg-dark-800/50 hover:bg-dark-800 border border-transparent'
                  }`}
                >
                  <p className="text-white font-semibold">{product.productName}</p>
                  <p className="text-xs text-primary-400 font-mono mb-2">{product.productCode}</p>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-dark-400">Rate: </span>
                      <span className="text-white">{product.interestRate}%</span>
                    </div>
                    <div>
                      <span className="text-dark-400">LTV: </span>
                      <span className="text-white">{product.ltv}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button disabled={!isStep1Valid} onClick={() => setStep(2)}>
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Collateral Entry */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Add Collaterals</h3>
              <Button icon={Plus} variant="secondary" onClick={addCollateral}>
                Add Mutual Fund
              </Button>
            </div>

            {collaterals.length === 0 ? (
              <div className="text-center py-8 text-dark-500">
                <p>No collaterals added yet</p>
                <p className="text-sm">Click "Add Mutual Fund" to add collateral</p>
              </div>
            ) : (
              <div className="space-y-4">
                {collaterals.map((col, index) => (
                  <div key={col.id} className="p-4 rounded-xl bg-dark-800/50 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-white font-medium">Mutual Fund #{index + 1}</h4>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => removeCollateral(col.id)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Fund Name"
                        value={col.fundName}
                        onChange={(e) => updateCollateral(col.id, 'fundName', e.target.value)}
                        placeholder="e.g., HDFC Top 100 Fund"
                      />
                      <Input
                        label="Fund House"
                        value={col.fundHouse}
                        onChange={(e) => updateCollateral(col.id, 'fundHouse', e.target.value)}
                        placeholder="e.g., HDFC Mutual Fund"
                      />
                      <Input
                        label="Scheme Code"
                        value={col.schemeCode}
                        onChange={(e) => updateCollateral(col.id, 'schemeCode', e.target.value)}
                        placeholder="e.g., HDFC100"
                      />
                      <Input
                        label="Folio Number"
                        value={col.folioNumber}
                        onChange={(e) => updateCollateral(col.id, 'folioNumber', e.target.value)}
                        placeholder="e.g., FOL123456"
                      />
                      <Input
                        label="ISIN"
                        value={col.isin}
                        onChange={(e) => updateCollateral(col.id, 'isin', e.target.value)}
                        placeholder="e.g., INF179K01234"
                      />
                      <Select
                        label="Fund Type"
                        value={col.fundType}
                        onChange={(e) => updateCollateral(col.id, 'fundType', e.target.value)}
                        options={fundTypes}
                      />
                      <Input
                        label="Units"
                        type="number"
                        value={col.units}
                        onChange={(e) => updateCollateral(col.id, 'units', e.target.value)}
                        placeholder="e.g., 100"
                      />
                      <Input
                        label="Current NAV (₹)"
                        type="number"
                        step="0.01"
                        value={col.navAtPledge}
                        onChange={(e) => updateCollateral(col.id, 'navAtPledge', e.target.value)}
                        placeholder="e.g., 850.25"
                      />
                    </div>

                    {col.units && col.navAtPledge && (
                      <div className="flex justify-between p-3 rounded-lg bg-dark-900/50 text-sm">
                        <span className="text-dark-400">Value:</span>
                        <span className="text-white font-bold">
                          {formatCurrency(parseFloat(col.units) * parseFloat(col.navAtPledge))}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Eligibility Summary */}
            {collaterals.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-dark-400 text-sm">Total Collateral Value</p>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(calculateEligibility().totalValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-400 text-sm">LTV Ratio</p>
                    <p className="text-xl font-bold text-white">{selectedProduct?.ltv || 0}%</p>
                  </div>
                  <div>
                    <p className="text-dark-400 text-sm">Eligible Loan Amount</p>
                    <p className="text-xl font-bold gradient-text">
                      {formatCurrency(calculateEligibility().eligibleAmount)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button disabled={!isStep2Valid} onClick={() => setStep(3)}>
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Loan Details */}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Loan Details</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-dark-800/50">
                <p className="text-dark-400 text-sm">Eligible Amount</p>
                <p className="text-2xl font-bold gradient-text">
                  {formatCurrency(calculateEligibility().eligibleAmount)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-dark-800/50">
                <p className="text-dark-400 text-sm">Interest Rate</p>
                <p className="text-2xl font-bold text-white">{selectedProduct?.interestRate}% p.a.</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Requested Amount (₹)"
                type="number"
                value={formData.requestedAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, requestedAmount: e.target.value }))}
                placeholder="Enter loan amount"
              />
              
              <Select
                label="Tenure (months)"
                value={formData.requestedTenureMonths}
                onChange={(e) => setFormData(prev => ({ ...prev, requestedTenureMonths: e.target.value }))}
                options={[
                  { value: '', label: 'Select tenure' },
                  ...Array.from(
                    { length: (selectedProduct?.maxTenureMonths || 36) - (selectedProduct?.minTenureMonths || 6) + 1 },
                    (_, i) => ({
                      value: ((selectedProduct?.minTenureMonths || 6) + i).toString(),
                      label: `${(selectedProduct?.minTenureMonths || 6) + i} months`
                    })
                  )
                ]}
              />

              <Textarea
                label="Loan Purpose"
                value={formData.purpose}
                onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="Describe the purpose of the loan..."
                rows={3}
              />
            </div>

            {/* EMI Preview */}
            {formData.requestedAmount && formData.requestedTenureMonths && selectedProduct && (
              <div className="mt-6 p-4 rounded-xl bg-dark-800/50">
                <h4 className="text-white font-medium mb-3">EMI Preview</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-dark-400 text-sm">Monthly EMI</p>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(
                        (() => {
                          const p = parseFloat(formData.requestedAmount);
                          const r = selectedProduct.interestRate / 12 / 100;
                          const n = parseInt(formData.requestedTenureMonths);
                          return p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
                        })()
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-400 text-sm">Processing Fee</p>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(parseFloat(formData.requestedAmount) * (selectedProduct.processingFeePercent / 100))}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-400 text-sm">Total Interest</p>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(
                        (() => {
                          const p = parseFloat(formData.requestedAmount);
                          const r = selectedProduct.interestRate / 12 / 100;
                          const n = parseInt(formData.requestedTenureMonths);
                          const emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
                          return emi * n - p;
                        })()
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Summary */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Application Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-400">Customer</span>
                <span className="text-white">{selectedCustomer?.firstName} {selectedCustomer?.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Product</span>
                <span className="text-white">{selectedProduct?.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Collaterals</span>
                <span className="text-white">{collaterals.length} mutual fund(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Collateral Value</span>
                <span className="text-white">{formatCurrency(calculateEligibility().totalValue)}</span>
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              disabled={!isStep3Valid}
              loading={submitting}
              onClick={handleSubmit}
            >
              Submit Application
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateApplication;

