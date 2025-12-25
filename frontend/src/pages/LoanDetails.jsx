import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Percent,
  Clock,
  Shield,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { Card } from '../components/Card';
import Button from '../components/Button';
import { Input, Select } from '../components/Input';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/Table';
import Badge, { StatusBadge } from '../components/Badge';
import Modal from '../components/Modal';
import { PageLoading } from '../components/Loading';
import { loansAPI } from '../services/api';
import { useApp } from '../context/AppContext';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const LoanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useApp();
  const [loading, setLoading] = useState(true);
  const [loan, setLoan] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMode: 'UPI',
    referenceNumber: ''
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchLoanDetails();
  }, [id]);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      const response = await loansAPI.getById(id);
      setLoan(response.data);
    } catch (error) {
      showError('Failed to fetch loan details');
      navigate('/ongoing-loans');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    try {
      setProcessing(true);
      await loansAPI.recordPayment(id, {
        amount: parseFloat(paymentData.amount),
        paymentMode: paymentData.paymentMode,
        referenceNumber: paymentData.referenceNumber
      });
      showSuccess('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      setPaymentData({ amount: '', paymentMode: 'UPI', referenceNumber: '' });
      fetchLoanDetails();
    } catch (error) {
      showError(error.message || 'Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  if (!loan) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'schedule', label: 'Repayment Schedule' },
    { id: 'payments', label: 'Payment History' },
    { id: 'collaterals', label: 'Collaterals' }
  ];

  const paidInstallments = loan.repaymentSchedule?.filter(s => s.status === 'PAID').length || 0;
  const totalInstallments = loan.repaymentSchedule?.length || 0;
  const progress = (paidInstallments / totalInstallments) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/ongoing-loans')} />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-white">{loan.loanId}</h1>
              <StatusBadge status={loan.status} />
              {loan.marginCallStatus === 'TRIGGERED' && (
                <Badge variant="danger">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Margin Call
                </Badge>
              )}
            </div>
            <p className="text-dark-400 mt-1">
              {loan.customerId?.firstName} {loan.customerId?.lastName} • {loan.loanProductId?.productName}
            </p>
          </div>
        </div>
        {loan.status === 'ACTIVE' && (
          <Button onClick={() => setIsPaymentModalOpen(true)}>
            <CreditCard className="w-4 h-4 mr-2" /> Record Payment
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <IndianRupee className="w-6 h-6 text-primary-400 mx-auto mb-2" />
          <p className="text-dark-400 text-sm">Principal</p>
          <p className="text-xl font-bold text-white">{formatCurrency(loan.principalAmount)}</p>
        </Card>
        <Card className="text-center">
          <IndianRupee className="w-6 h-6 text-accent-400 mx-auto mb-2" />
          <p className="text-dark-400 text-sm">Outstanding</p>
          <p className="text-xl font-bold gradient-text">{formatCurrency(loan.totalOutstanding)}</p>
        </Card>
        <Card className="text-center">
          <Percent className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-dark-400 text-sm">Interest Rate</p>
          <p className="text-xl font-bold text-white">{loan.interestRate}% p.a.</p>
        </Card>
        <Card className="text-center">
          <Clock className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <p className="text-dark-400 text-sm">Tenure</p>
          <p className="text-xl font-bold text-white">{loan.tenureMonths} months</p>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-medium">Repayment Progress</p>
          <p className="text-dark-400">{paidInstallments} of {totalInstallments} EMIs paid</p>
        </div>
        <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-primary-400 border-primary-400'
                  : 'text-dark-400 border-transparent hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Loan Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-400">Application ID</span>
                <span className="text-white font-mono">{loan.applicationId?.applicationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">EMI Amount</span>
                <span className="text-white font-bold">{formatCurrency(loan.emiAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Total Interest</span>
                <span className="text-white">{formatCurrency(loan.totalInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Total Payable</span>
                <span className="text-white">{formatCurrency(loan.totalPayable)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Disbursement Date</span>
                <span className="text-white">{new Date(loan.disbursementDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">First EMI Date</span>
                <span className="text-white">{new Date(loan.firstEmiDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Last EMI Date</span>
                <span className="text-white">{new Date(loan.lastEmiDate).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Collateral Summary</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-dark-800/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-dark-400">Total Collateral Value</span>
                  <span className="text-xl font-bold text-white">
                    {formatCurrency(loan.totalCollateralValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark-400">Current LTV</span>
                  <span className={`text-xl font-bold ${
                    loan.currentLtv > 80 ? 'text-red-400' :
                    loan.currentLtv > 60 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {loan.currentLtv?.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm text-dark-400">
                  {loan.collaterals?.length || 0} mutual fund(s) pledged
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'schedule' && (
        <Card>
          <Table>
            <Thead>
              <Tr>
                <Th>#</Th>
                <Th>Due Date</Th>
                <Th>EMI Amount</Th>
                <Th>Principal</Th>
                <Th>Interest</Th>
                <Th>Outstanding</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loan.repaymentSchedule?.map((installment) => (
                <Tr key={installment.installmentNumber}>
                  <Td>{installment.installmentNumber}</Td>
                  <Td>{new Date(installment.dueDate).toLocaleDateString()}</Td>
                  <Td className="tabular-nums">{formatCurrency(installment.emiAmount)}</Td>
                  <Td className="tabular-nums">{formatCurrency(installment.principalComponent)}</Td>
                  <Td className="tabular-nums">{formatCurrency(installment.interestComponent)}</Td>
                  <Td className="tabular-nums">{formatCurrency(installment.outstandingAfter)}</Td>
                  <Td><StatusBadge status={installment.status} /></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {activeTab === 'payments' && (
        <Card>
          {loan.payments?.length > 0 ? (
            <Table>
              <Thead>
                <Tr>
                  <Th>Payment ID</Th>
                  <Th>Date</Th>
                  <Th>Amount</Th>
                  <Th>Mode</Th>
                  <Th>Reference</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {loan.payments.map((payment) => (
                  <Tr key={payment.paymentId}>
                    <Td className="font-mono text-primary-400">{payment.paymentId}</Td>
                    <Td>{new Date(payment.paymentDate).toLocaleDateString()}</Td>
                    <Td className="tabular-nums font-medium text-white">
                      {formatCurrency(payment.amount)}
                    </Td>
                    <Td>{payment.paymentMode}</Td>
                    <Td className="font-mono text-sm">{payment.referenceNumber}</Td>
                    <Td><StatusBadge status={payment.status} /></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <div className="text-center py-8 text-dark-500">No payments recorded yet</div>
          )}
        </Card>
      )}

      {activeTab === 'collaterals' && (
        <div className="space-y-4">
          {loan.collaterals?.map((col) => (
            <Card key={col._id}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-semibold">{col.mutualFund?.fundName}</p>
                  <p className="text-sm text-dark-400">{col.mutualFund?.fundHouse}</p>
                  <p className="text-xs font-mono text-primary-400 mt-1">
                    Folio: {col.mutualFund?.folioNumber} | ISIN: {col.mutualFund?.isin}
                  </p>
                </div>
                <StatusBadge status={col.lienStatus} />
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-dark-400 text-xs">Units</p>
                  <p className="text-white font-medium">{col.mutualFund?.units}</p>
                </div>
                <div>
                  <p className="text-dark-400 text-xs">Current NAV</p>
                  <p className="text-white font-medium">₹{col.mutualFund?.currentNav}</p>
                </div>
                <div>
                  <p className="text-dark-400 text-xs">Current Value</p>
                  <p className="text-white font-bold">{formatCurrency(col.mutualFund?.currentValue)}</p>
                </div>
                <div>
                  <p className="text-dark-400 text-xs">Eligible Loan</p>
                  <p className="text-accent-400 font-bold">{formatCurrency(col.eligibleLoanAmount)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-dark-800/50">
            <p className="text-dark-400 text-sm">EMI Amount</p>
            <p className="text-xl font-bold text-white">{formatCurrency(loan.emiAmount)}</p>
          </div>
          
          <Input
            label="Payment Amount (₹)"
            type="number"
            value={paymentData.amount}
            onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="Enter amount"
          />
          
          <Select
            label="Payment Mode"
            value={paymentData.paymentMode}
            onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMode: e.target.value }))}
            options={[
              { value: 'UPI', label: 'UPI' },
              { value: 'NETBANKING', label: 'Net Banking' },
              { value: 'NACH', label: 'NACH' },
              { value: 'NEFT', label: 'NEFT' },
              { value: 'RTGS', label: 'RTGS' },
              { value: 'CHEQUE', label: 'Cheque' }
            ]}
          />
          
          <Input
            label="Reference Number"
            value={paymentData.referenceNumber}
            onChange={(e) => setPaymentData(prev => ({ ...prev, referenceNumber: e.target.value }))}
            placeholder="Transaction reference"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              loading={processing}
              disabled={!paymentData.amount || !paymentData.referenceNumber}
            >
              Record Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoanDetails;

