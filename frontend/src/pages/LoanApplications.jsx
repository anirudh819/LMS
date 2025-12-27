import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, CheckCircle, XCircle, FileText } from 'lucide-react';
import { Card } from '../components/Card';
import Button from '../components/Button';
import { Input, Select } from '../components/Input';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/Table';
import Badge, { StatusBadge } from '../components/Badge';
import Modal from '../components/Modal';
import { PageLoading } from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { loanApplicationsAPI } from '../services/api';
import { useApp } from '../context/AppContext';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const LoanApplications = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useApp();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [pagination.page, filters.status]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status })
      };
      
      const response = await loanApplicationsAPI.getAll(params);
      setApplications(response.data.applications);
      setStatusCounts(response.data.statusCounts);
      setPagination(prev => ({ ...prev, total: response.data.pagination.total }));
    } catch (error) {
      showError(error.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (app) => {
    try {
      const response = await loanApplicationsAPI.getById(app._id);
      setSelectedApp(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      showError('Failed to fetch application details');
    }
  };

  const handleAction = (type, app) => {
    setActionType(type);
    setSelectedApp(app);
    setActionRemarks('');
    setIsActionModalOpen(true);
  };

  const submitAction = async () => {
    try {
      setProcessing(true);
      
      if (actionType === 'review') {
        await loanApplicationsAPI.updateStatus(selectedApp._id, {
          status: 'UNDER_REVIEW',
          remarks: actionRemarks || 'Application moved to review'
        });
        showSuccess('Application moved to review');
      } else if (actionType === 'approve') {
        await loanApplicationsAPI.updateStatus(selectedApp._id, {
          status: 'APPROVED',
          remarks: actionRemarks,
          approvedAmount: selectedApp.requestedAmount,
          approvedTenureMonths: selectedApp.requestedTenureMonths
        });
        showSuccess('Application approved successfully');
      } else if (actionType === 'reject') {
        await loanApplicationsAPI.updateStatus(selectedApp._id, {
          status: 'REJECTED',
          remarks: actionRemarks
        });
        showSuccess('Application rejected');
      } else if (actionType === 'disburse') {
        await loanApplicationsAPI.disburse(selectedApp._id, {
          disbursementAccountNumber: selectedApp.customerId?.bankDetails?.accountNumber || '1234567890',
          disbursementIfsc: selectedApp.customerId?.bankDetails?.ifscCode || 'HDFC0001234'
        });
        showSuccess('Loan disbursed successfully');
      }

      setIsActionModalOpen(false);
      fetchApplications();
    } catch (error) {
      showError(error.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const statusFilters = [
    { value: '', label: 'All Statuses' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'DISBURSED', label: 'Disbursed' }
  ];

  if (loading && applications.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Loan Applications</h1>
          <p className="text-dark-400 mt-1">Manage all loan applications</p>
        </div>
        <Link to="/create-application">
          <Button icon={Plus}>New Application</Button>
        </Link>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card
            key={status}
            hover
            className={`cursor-pointer ${filters.status === status ? 'border border-primary-500/50' : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, status: prev.status === status ? '' : status }))}
          >
            <p className="text-dark-400 text-xs mb-1">{status.replace(/_/g, ' ')}</p>
            <p className="text-2xl font-bold text-white">{count}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            icon={Search}
            placeholder="Search applications..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <Select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          options={statusFilters}
          className="w-48"
        />
      </Card>

      {/* Applications Table */}
      <Card>
        {applications.length > 0 ? (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Application ID</Th>
                  <Th>Customer</Th>
                  <Th>Product</Th>
                  <Th>Requested Amount</Th>
                  <Th>Tenure</Th>
                  <Th>Collateral Value</Th>
                  <Th>Status</Th>
                  <Th>Source</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {applications.map((app) => (
                  <Tr key={app._id}>
                    <Td>
                      <span className="font-mono text-primary-400">{app.applicationId}</span>
                    </Td>
                    <Td>
                      <div>
                        <p className="text-white font-medium">
                          {app.customerId?.firstName} {app.customerId?.lastName}
                        </p>
                        <p className="text-xs text-dark-500">{app.customerId?.phone}</p>
                      </div>
                    </Td>
                    <Td>{app.loanProductId?.productCode || '-'}</Td>
                    <Td className="tabular-nums font-medium text-white">
                      {formatCurrency(app.requestedAmount)}
                    </Td>
                    <Td>{app.requestedTenureMonths} months</Td>
                    <Td className="tabular-nums">
                      {formatCurrency(app.totalCollateralValue || 0)}
                    </Td>
                    <Td><StatusBadge status={app.status} /></Td>
                    <Td>
                      <Badge variant={app.source === 'API' ? 'accent' : 'default'} size="sm">
                        {app.source}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleViewDetails(app)}
                        />
                        {app.status === 'SUBMITTED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAction('review', app)}
                          >
                            Review
                          </Button>
                        )}
                        {app.status === 'UNDER_REVIEW' && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              icon={CheckCircle}
                              onClick={() => handleAction('approve', app)}
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              icon={XCircle}
                              onClick={() => handleAction('reject', app)}
                            />
                          </>
                        )}
                        {app.status === 'APPROVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAction('disburse', app)}
                          >
                            Disburse
                          </Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
              <p className="text-sm text-dark-400">
                Showing {applications.length} of {pagination.total} applications
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page * pagination.limit >= pagination.total}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon={FileText}
            title="No applications found"
            description="No loan applications match your filters"
            action={() => navigate('/create-application')}
            actionLabel="Create Application"
          />
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Application Details"
        size="lg"
      >
        {selectedApp && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Application ID</p>
                <p className="text-xl font-mono text-primary-400">{selectedApp.applicationId}</p>
              </div>
              <StatusBadge status={selectedApp.status} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-dark-800/50">
                <p className="text-dark-400 text-sm mb-1">Requested Amount</p>
                <p className="text-2xl font-bold gradient-text">
                  {formatCurrency(selectedApp.requestedAmount)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-dark-800/50">
                <p className="text-dark-400 text-sm mb-1">Eligible Amount</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(selectedApp.eligibleLoanAmount || 0)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-dark-400">Customer</p>
                <p className="text-white">
                  {selectedApp.customerId?.firstName} {selectedApp.customerId?.lastName}
                </p>
              </div>
              <div>
                <p className="text-dark-400">Email</p>
                <p className="text-white">{selectedApp.customerId?.email}</p>
              </div>
              <div>
                <p className="text-dark-400">Product</p>
                <p className="text-white">{selectedApp.loanProductId?.productName}</p>
              </div>
              <div>
                <p className="text-dark-400">Interest Rate</p>
                <p className="text-white">{selectedApp.interestRate}% p.a.</p>
              </div>
              <div>
                <p className="text-dark-400">Tenure</p>
                <p className="text-white">{selectedApp.requestedTenureMonths} months</p>
              </div>
              <div>
                <p className="text-dark-400">Purpose</p>
                <p className="text-white">{selectedApp.purpose}</p>
              </div>
            </div>

            {selectedApp.collaterals?.length > 0 && (
              <div>
                <h4 className="text-white font-semibold mb-3">Collaterals</h4>
                <div className="space-y-2">
                  {selectedApp.collaterals.map((col) => (
                    <div key={col._id} className="p-3 rounded-xl bg-dark-800/50 flex justify-between">
                      <div>
                        <p className="text-white">{col.mutualFund?.fundName}</p>
                        <p className="text-xs text-dark-400">
                          {col.mutualFund?.units} units @ ₹{col.mutualFund?.currentNav}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white">{formatCurrency(col.mutualFund?.currentValue)}</p>
                        <StatusBadge status={col.lienStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedApp.statusHistory?.length > 0 && (
              <div>
                <h4 className="text-white font-semibold mb-3">Status History</h4>
                <div className="space-y-2">
                  {selectedApp.statusHistory.map((history, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <span className="w-2 h-2 rounded-full bg-primary-500" />
                      <StatusBadge status={history.status} />
                      <span className="text-dark-400">
                        {new Date(history.changedAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={
          actionType === 'review' ? 'Move to Review' :
          actionType === 'approve' ? 'Approve Application' :
          actionType === 'reject' ? 'Reject Application' :
          'Disburse Loan'
        }
        size="sm"
      >
        <div className="space-y-4">
          {actionType === 'disburse' ? (
            <p className="text-dark-300">
              Are you sure you want to disburse{' '}
              <span className="text-white font-bold">
                {formatCurrency(selectedApp?.approvedAmount || selectedApp?.requestedAmount)}
              </span>{' '}
              for this application?
            </p>
          ) : actionType === 'review' ? (
            <p className="text-dark-300">
              Move this application to <span className="text-white font-bold">Under Review</span> status to begin the approval process?
            </p>
          ) : (
            <>
              <p className="text-dark-300">
                {actionType === 'approve'
                  ? 'Provide remarks for approval (optional):'
                  : 'Provide reason for rejection:'}
              </p>
              <Input
                placeholder="Enter remarks..."
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                required={actionType === 'reject'}
              />
            </>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsActionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'reject' ? 'danger' : 'primary'}
              onClick={submitAction}
              loading={processing}
            >
              {actionType === 'review' ? 'Move to Review' :
               actionType === 'approve' ? 'Approve' :
               actionType === 'reject' ? 'Reject' : 'Disburse'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoanApplications;

