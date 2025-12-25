import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  FileText,
  Wallet,
  Shield,
  ArrowRight,
  IndianRupee,
  AlertTriangle
} from 'lucide-react';
import { Card, StatCard } from '../components/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/Table';
import { StatusBadge } from '../components/Badge';
import { PageLoading } from '../components/Loading';
import Button from '../components/Button';
import { loansAPI, loanApplicationsAPI, collateralsAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const Dashboard = () => {
  const { showError } = useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLoans: 0,
    totalDisbursed: 0,
    totalOutstanding: 0,
    totalCollateralValue: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loansByStatus, setLoansByStatus] = useState([]);
  const [collateralSummary, setCollateralSummary] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [loansData, applicationsData, collateralData] = await Promise.all([
        loansAPI.getAll({ status: 'ACTIVE', limit: 100 }),
        loanApplicationsAPI.getAll({ limit: 5 }),
        collateralsAPI.getSummaryByFundType()
      ]);

      setStats(loansData.data.summary);
      setRecentApplications(applicationsData.data.applications);
      setCollateralSummary(collateralData.data);

      // Calculate loans by status
      const statusCounts = applicationsData.data.statusCounts;
      const statusData = Object.entries(statusCounts || {}).map(([status, count]) => ({
        name: status.replace(/_/g, ' '),
        value: count
      }));
      setLoansByStatus(statusData);
      
    } catch (error) {
      showError(error.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#2a91ff', '#d946ef', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  const monthlyData = [
    { name: 'Jul', amount: 2400000 },
    { name: 'Aug', amount: 1398000 },
    { name: 'Sep', amount: 9800000 },
    { name: 'Oct', amount: 3908000 },
    { name: 'Nov', amount: 4800000 },
    { name: 'Dec', amount: 3800000 },
  ];

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Loans"
          value={stats.totalLoans}
          icon={Wallet}
          color="primary"
          trend="+12% this month"
          trendUp
        />
        <StatCard
          title="Total Disbursed"
          value={formatCurrency(stats.totalDisbursed)}
          icon={IndianRupee}
          color="accent"
          trend="+8% this month"
          trendUp
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.totalOutstanding)}
          icon={TrendingUp}
          color="orange"
        />
        <StatCard
          title="Collateral Value"
          value={formatCurrency(stats.totalCollateralValue)}
          icon={Shield}
          color="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Disbursement Trend */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-semibold text-white">
              Disbursement Trend
            </h3>
            <select className="px-3 py-1.5 rounded-lg bg-dark-800/50 border border-white/10 text-sm text-dark-300">
              <option>Last 6 months</option>
              <option>Last year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2a91ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2a91ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2e33" />
              <XAxis dataKey="name" stroke="#5f636d" />
              <YAxis stroke="#5f636d" tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} />
              <Tooltip
                contentStyle={{
                  background: '#1a1b1e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px'
                }}
                formatter={(value) => [formatCurrency(value), 'Amount']}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#2a91ff"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Collateral Distribution */}
        <Card>
          <h3 className="text-lg font-display font-semibold text-white mb-6">
            Collateral by Fund Type
          </h3>
          {collateralSummary.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={collateralSummary}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="totalValue"
                    nameKey="_id"
                  >
                    {collateralSummary.map((entry, index) => (
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
              <div className="space-y-2 mt-4">
                {collateralSummary.map((item, index) => (
                  <div key={item._id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-dark-300">{item._id}</span>
                    </div>
                    <span className="text-white font-medium tabular-nums">
                      {formatCurrency(item.totalValue)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-dark-500">
              No collateral data
            </div>
          )}
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-display font-semibold text-white">
            Recent Applications
          </h3>
          <Link to="/loan-applications">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        
        {recentApplications.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>Application ID</Th>
                <Th>Customer</Th>
                <Th>Amount</Th>
                <Th>Product</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {recentApplications.map((app) => (
                <Tr key={app._id}>
                  <Td>
                    <span className="font-mono text-primary-400">{app.applicationId}</span>
                  </Td>
                  <Td>
                    <div>
                      <p className="text-white font-medium">
                        {app.customerId?.firstName} {app.customerId?.lastName}
                      </p>
                      <p className="text-xs text-dark-500">{app.customerId?.email}</p>
                    </div>
                  </Td>
                  <Td className="tabular-nums">{formatCurrency(app.requestedAmount)}</Td>
                  <Td>{app.loanProductId?.productName || '-'}</Td>
                  <Td><StatusBadge status={app.status} /></Td>
                  <Td className="text-dark-400">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <div className="text-center py-8 text-dark-500">
            No recent applications
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/create-application">
          <Card hover className="group cursor-pointer border border-primary-500/20 hover:border-primary-500/40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">New Application</h3>
                <p className="text-sm text-dark-400">Create a loan application</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/ongoing-loans">
          <Card hover className="group cursor-pointer border border-accent-500/20 hover:border-accent-500/40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Manage Loans</h3>
                <p className="text-sm text-dark-400">View ongoing loans</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/collaterals">
          <Card hover className="group cursor-pointer border border-green-500/20 hover:border-green-500/40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Collaterals</h3>
                <p className="text-sm text-dark-400">Manage mutual fund pledges</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;

