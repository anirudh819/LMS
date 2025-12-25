import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, AlertTriangle, Wallet, IndianRupee } from 'lucide-react';
import { Card, StatCard } from '../components/Card';
import Button from '../components/Button';
import { Input, Select } from '../components/Input';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/Table';
import { StatusBadge } from '../components/Badge';
import { PageLoading } from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { loansAPI } from '../services/api';
import { useApp } from '../context/AppContext';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const OngoingLoans = () => {
  const { showError } = useApp();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ status: 'ACTIVE', search: '' });

  useEffect(() => {
    fetchLoans();
  }, [pagination.page, filters.status]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await loansAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status })
      });
      setLoans(response.data.loans);
      setSummary(response.data.summary);
      setPagination(prev => ({ ...prev, total: response.data.pagination.total }));
    } catch (error) {
      showError(error.message || 'Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'OVERDUE', label: 'Overdue' },
    { value: 'NPA', label: 'NPA' },
    { value: 'CLOSED', label: 'Closed' }
  ];

  if (loading && loans.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Ongoing Loans</h1>
        <p className="text-dark-400 mt-1">Monitor and manage active loans</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Loans"
          value={summary.totalLoans || 0}
          icon={Wallet}
          color="primary"
        />
        <StatCard
          title="Total Disbursed"
          value={formatCurrency(summary.totalDisbursed || 0)}
          icon={IndianRupee}
          color="accent"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(summary.totalOutstanding || 0)}
          icon={IndianRupee}
          color="orange"
        />
        <StatCard
          title="Collateral Value"
          value={formatCurrency(summary.totalCollateralValue || 0)}
          icon={AlertTriangle}
          color="green"
        />
      </div>

      {/* Filters */}
      <Card className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            icon={Search}
            placeholder="Search loans..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <Select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          options={statusOptions}
          className="w-48"
        />
      </Card>

      {/* Loans Table */}
      <Card>
        {loans.length > 0 ? (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Loan ID</Th>
                  <Th>Customer</Th>
                  <Th>Product</Th>
                  <Th>Principal</Th>
                  <Th>Outstanding</Th>
                  <Th>EMI</Th>
                  <Th>LTV</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {loans.map((loan) => (
                  <Tr key={loan._id}>
                    <Td>
                      <Link
                        to={`/loans/${loan._id}`}
                        className="font-mono text-primary-400 hover:text-primary-300"
                      >
                        {loan.loanId}
                      </Link>
                    </Td>
                    <Td>
                      <div>
                        <p className="text-white font-medium">
                          {loan.customerId?.firstName} {loan.customerId?.lastName}
                        </p>
                        <p className="text-xs text-dark-500">{loan.customerId?.email}</p>
                      </div>
                    </Td>
                    <Td>{loan.loanProductId?.productCode || '-'}</Td>
                    <Td className="tabular-nums">{formatCurrency(loan.principalAmount)}</Td>
                    <Td className="tabular-nums font-medium text-white">
                      {formatCurrency(loan.totalOutstanding)}
                    </Td>
                    <Td className="tabular-nums">{formatCurrency(loan.emiAmount)}</Td>
                    <Td>
                      <span className={`font-medium ${
                        loan.currentLtv > 80 ? 'text-red-400' :
                        loan.currentLtv > 60 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {loan.currentLtv?.toFixed(1)}%
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={loan.status} />
                        {loan.marginCallStatus === 'TRIGGERED' && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Margin Call" />
                        )}
                      </div>
                    </Td>
                    <Td>
                      <Link to={`/loans/${loan._id}`}>
                        <Button variant="ghost" size="sm" icon={Eye}>
                          View
                        </Button>
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
              <p className="text-sm text-dark-400">
                Showing {loans.length} of {pagination.total} loans
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
            icon={Wallet}
            title="No loans found"
            description="No loans match your current filters"
          />
        )}
      </Card>
    </div>
  );
};

export default OngoingLoans;

