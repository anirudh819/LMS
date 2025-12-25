import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Shield, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card, StatCard } from '../components/Card';
import Button from '../components/Button';
import { Input, Select } from '../components/Input';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/Table';
import Badge, { StatusBadge } from '../components/Badge';
import Modal from '../components/Modal';
import { PageLoading } from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { collateralsAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const CollateralManagement = () => {
  const { showSuccess, showError } = useApp();
  const [loading, setLoading] = useState(true);
  const [collaterals, setCollaterals] = useState([]);
  const [summary, setSummary] = useState({});
  const [fundTypeSummary, setFundTypeSummary] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ status: 'ACTIVE', lienStatus: '' });
  const [selectedCollateral, setSelectedCollateral] = useState(null);
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);
  const [newNav, setNewNav] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [pagination.page, filters.status, filters.lienStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [collateralsRes, fundTypeRes] = await Promise.all([
        collateralsAPI.getAll({
          page: pagination.page,
          limit: pagination.limit,
          ...(filters.status && { status: filters.status }),
          ...(filters.lienStatus && { lienStatus: filters.lienStatus })
        }),
        collateralsAPI.getSummaryByFundType()
      ]);
      
      setCollaterals(collateralsRes.data.collaterals);
      setSummary(collateralsRes.data.summary);
      setPagination(prev => ({ ...prev, total: collateralsRes.data.pagination.total }));
      setFundTypeSummary(fundTypeRes.data);
    } catch (error) {
      showError('Failed to fetch collateral data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNav = async () => {
    try {
      setProcessing(true);
      await collateralsAPI.updateNav(selectedCollateral._id, parseFloat(newNav));
      showSuccess('NAV updated successfully');
      setIsNavModalOpen(false);
      setNewNav('');
      fetchData();
    } catch (error) {
      showError(error.message || 'Failed to update NAV');
    } finally {
      setProcessing(false);
    }
  };

  const handleRelease = async (collateral) => {
    if (!confirm('Are you sure you want to release this collateral?')) return;
    
    try {
      await collateralsAPI.release(collateral._id);
      showSuccess('Collateral released successfully');
      fetchData();
    } catch (error) {
      showError(error.message || 'Failed to release collateral');
    }
  };

  const COLORS = ['#2a91ff', '#d946ef', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading && collaterals.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Collateral Management</h1>
          <p className="text-dark-400 mt-1">Track and manage mutual fund collaterals</p>
        </div>
        <Button icon={RefreshCw} variant="secondary" onClick={fetchData}>
          Refresh NAV
        </Button>
      </div>

      {/* Stats and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Collaterals"
          value={summary.totalCollaterals || 0}
          icon={Shield}
          color="primary"
        />
        <StatCard
          title="Total Value"
          value={formatCurrency(summary.totalValue || 0)}
          icon={TrendingUp}
          color="accent"
        />
        <StatCard
          title="Eligible Loan Amount"
          value={formatCurrency(summary.totalEligibleAmount || 0)}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Fund Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Distribution by Fund Type</h3>
          {fundTypeSummary.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {fundTypeSummary.map((item, index) => (
                <div key={item._id} className="p-4 rounded-xl bg-dark-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-dark-300 font-medium">{item._id}</span>
                  </div>
                  <p className="text-xl font-bold text-white">{formatCurrency(item.totalValue)}</p>
                  <p className="text-sm text-dark-400">{item.count} units</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dark-500">No data available</div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Value Distribution</h3>
          {fundTypeSummary.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={fundTypeSummary}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="totalValue"
                  nameKey="_id"
                >
                  {fundTypeSummary.map((entry, index) => (
                    <Cell key={entry._id} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1a1b1e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-dark-500">
              No data
            </div>
          )}
        </Card>
      </div>

      {/* Filters */}
      <Card className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            icon={Search}
            placeholder="Search collaterals..."
          />
        </div>
        <Select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'RELEASED', label: 'Released' },
            { value: 'LIQUIDATED', label: 'Liquidated' }
          ]}
          className="w-40"
        />
        <Select
          value={filters.lienStatus}
          onChange={(e) => setFilters(prev => ({ ...prev, lienStatus: e.target.value }))}
          options={[
            { value: '', label: 'All Lien Status' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'MARKED', label: 'Marked' },
            { value: 'RELEASED', label: 'Released' }
          ]}
          className="w-40"
        />
      </Card>

      {/* Collaterals Table */}
      <Card>
        {collaterals.length > 0 ? (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Collateral ID</Th>
                  <Th>Fund Details</Th>
                  <Th>Customer</Th>
                  <Th>Units</Th>
                  <Th>NAV</Th>
                  <Th>Value</Th>
                  <Th>Lien Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {collaterals.map((col) => {
                  const valueChange = col.mutualFund?.currentValue - col.mutualFund?.valueAtPledge;
                  const changePercent = (valueChange / col.mutualFund?.valueAtPledge) * 100;
                  
                  return (
                    <Tr key={col._id}>
                      <Td>
                        <span className="font-mono text-primary-400">{col.collateralId}</span>
                      </Td>
                      <Td>
                        <div>
                          <p className="text-white font-medium">{col.mutualFund?.fundName}</p>
                          <p className="text-xs text-dark-500">{col.mutualFund?.fundHouse}</p>
                          <Badge variant="info" size="sm" className="mt-1">
                            {col.mutualFund?.fundType}
                          </Badge>
                        </div>
                      </Td>
                      <Td>
                        <p className="text-white">
                          {col.customerId?.firstName} {col.customerId?.lastName}
                        </p>
                      </Td>
                      <Td className="tabular-nums">{col.mutualFund?.units}</Td>
                      <Td>
                        <div className="tabular-nums">
                          <p className="text-white">₹{col.mutualFund?.currentNav}</p>
                          <p className="text-xs text-dark-500">
                            Pledge: ₹{col.mutualFund?.navAtPledge}
                          </p>
                        </div>
                      </Td>
                      <Td>
                        <div>
                          <p className="text-white font-bold tabular-nums">
                            {formatCurrency(col.mutualFund?.currentValue)}
                          </p>
                          <p className={`text-xs flex items-center gap-1 ${
                            changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {changePercent >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {changePercent.toFixed(1)}%
                          </p>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={col.lienStatus} />
                          {col.marginCallTriggered && (
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCollateral(col);
                              setNewNav(col.mutualFund?.currentNav?.toString());
                              setIsNavModalOpen(true);
                            }}
                          >
                            Update NAV
                          </Button>
                          {col.status === 'ACTIVE' && col.lienStatus === 'MARKED' && !col.loanId && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRelease(col)}
                            >
                              Release
                            </Button>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
              <p className="text-sm text-dark-400">
                Showing {collaterals.length} of {pagination.total} collaterals
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
            icon={Shield}
            title="No collaterals found"
            description="No collaterals match your current filters"
          />
        )}
      </Card>

      {/* NAV Update Modal */}
      <Modal
        isOpen={isNavModalOpen}
        onClose={() => setIsNavModalOpen(false)}
        title="Update NAV"
        size="sm"
      >
        {selectedCollateral && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-dark-800/50">
              <p className="text-white font-medium">{selectedCollateral.mutualFund?.fundName}</p>
              <p className="text-sm text-dark-400">
                {selectedCollateral.mutualFund?.units} units
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-dark-400 text-sm">Current NAV</p>
                <p className="text-white font-bold">₹{selectedCollateral.mutualFund?.currentNav}</p>
              </div>
              <div>
                <p className="text-dark-400 text-sm">Current Value</p>
                <p className="text-white font-bold">
                  {formatCurrency(selectedCollateral.mutualFund?.currentValue)}
                </p>
              </div>
            </div>

            <Input
              label="New NAV (₹)"
              type="number"
              step="0.01"
              value={newNav}
              onChange={(e) => setNewNav(e.target.value)}
              placeholder="Enter new NAV"
            />

            {newNav && (
              <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
                <p className="text-dark-400 text-sm">New Value</p>
                <p className="text-xl font-bold gradient-text">
                  {formatCurrency(selectedCollateral.mutualFund?.units * parseFloat(newNav))}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setIsNavModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateNav} loading={processing} disabled={!newNav}>
                Update NAV
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CollateralManagement;

