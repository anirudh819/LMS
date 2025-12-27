import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { useApp } from '../context/AppContext';
import api from '../services/api';

export default function PartnerManagement() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [newCredentials, setNewCredentials] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    businessType: '',
    search: ''
  });
  const { showSuccess, showError } = useApp();

  const [formData, setFormData] = useState({
    partnerName: '',
    companyName: '',
    contactPerson: {
      name: '',
      email: '',
      phone: '',
      designation: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    businessType: 'FINTECH',
    gstNumber: '',
    panNumber: '',
    webhookUrl: '',
    notes: ''
  });

  useEffect(() => {
    fetchPartners();
  }, [filters]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.businessType) params.append('businessType', filters.businessType);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/partners?${params.toString()}`);
      setPartners(response.data.partners);
    } catch (error) {
      showError('Failed to fetch partners');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/partners', formData);
      setNewCredentials(response.data.credentials);
      setShowCreateModal(false);
      setShowCredentialsModal(true);
      fetchPartners();
      showSuccess('Partner created successfully');
      resetForm();
    } catch (error) {
      showError(error.response?.data?.error?.message || 'Failed to create partner');
    }
  };

  const handleUpdateStatus = async (partnerId, newStatus) => {
    try {
      await api.patch(`/partners/${partnerId}/status`, { status: newStatus });
      fetchPartners();
      showSuccess(`Partner status updated to ${newStatus}`);
    } catch (error) {
      showError('Failed to update partner status');
    }
  };

  const handleRegenerateCredentials = async (partnerId) => {
    if (!confirm('Are you sure? This will invalidate the old credentials immediately.')) {
      return;
    }

    try {
      const response = await api.post(`/partners/${partnerId}/regenerate-credentials`);
      setNewCredentials(response.data);
      setShowCredentialsModal(true);
      showSuccess('Credentials regenerated successfully');
    } catch (error) {
      showError('Failed to regenerate credentials');
    }
  };

  const handleViewStatistics = async (partnerId) => {
    try {
      const response = await api.get(`/partners/${partnerId}/statistics`);
      setSelectedPartner(response.data);
      // You can show this in a modal or navigate to a detail page
      alert(JSON.stringify(response.data, null, 2));
    } catch (error) {
      showError('Failed to fetch statistics');
    }
  };

  const resetForm = () => {
    setFormData({
      partnerName: '',
      companyName: '',
      contactPerson: {
        name: '',
        email: '',
        phone: '',
        designation: ''
      },
      address: {
        street: '',
        city: '',
        state: '',
        pincode: ''
      },
      businessType: 'FINTECH',
      gstNumber: '',
      panNumber: '',
      webhookUrl: '',
      notes: ''
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      ACTIVE: 'success',
      INACTIVE: 'secondary',
      SUSPENDED: 'error',
      PENDING_APPROVAL: 'warning'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const columns = [
    {
      header: 'Partner ID',
      accessor: 'partnerId',
      cell: (row) => <span className="font-mono text-sm">{row.partnerId}</span>
    },
    {
      header: 'Partner Name',
      accessor: 'partnerName',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.partnerName}</div>
          <div className="text-sm text-gray-500">{row.companyName}</div>
        </div>
      )
    },
    {
      header: 'Business Type',
      accessor: 'businessType',
      cell: (row) => <Badge variant="info">{row.businessType}</Badge>
    },
    {
      header: 'Contact',
      accessor: 'contactPerson',
      cell: (row) => (
        <div className="text-sm">
          <div>{row.contactPerson.name}</div>
          <div className="text-gray-500">{row.contactPerson.email}</div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Applications',
      accessor: 'statistics',
      cell: (row) => (
        <div className="text-sm">
          <div>Total: {row.statistics?.totalApplications || 0}</div>
          <div className="text-green-600">Approved: {row.statistics?.approvedApplications || 0}</div>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex gap-2">
          {row.status === 'PENDING_APPROVAL' && (
            <Button
              size="sm"
              variant="success"
              onClick={() => handleUpdateStatus(row._id, 'ACTIVE')}
            >
              Approve
            </Button>
          )}
          {row.status === 'ACTIVE' && (
            <Button
              size="sm"
              variant="warning"
              onClick={() => handleUpdateStatus(row._id, 'SUSPENDED')}
            >
              Suspend
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleRegenerateCredentials(row._id)}
          >
            Regenerate Key
          </Button>
          <Button
            size="sm"
            variant="info"
            onClick={() => handleViewStatistics(row._id)}
          >
            Stats
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Partner Management</h1>
          <p className="text-gray-600 mt-1">Manage API partners and their access</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + Add New Partner
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Search"
            placeholder="Search partners..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.businessType}
              onChange={(e) => setFilters({ ...filters, businessType: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="NBFC">NBFC</option>
              <option value="FINTECH">Fintech</option>
              <option value="BANK">Bank</option>
              <option value="AGGREGATOR">Aggregator</option>
              <option value="BROKER">Broker</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => setFilters({ status: '', businessType: '', search: '' })}>
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Partners Table */}
      <Card>
        {partners.length === 0 ? (
          <EmptyState
            title="No partners found"
            description="Get started by adding your first partner"
            actionLabel="Add Partner"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <Table columns={columns} data={partners} />
        )}
      </Card>

      {/* Create Partner Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Partner"
        size="large"
      >
        <form onSubmit={handleCreatePartner} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Partner Name"
              required
              value={formData.partnerName}
              onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
            />
            <Input
              label="Company Name"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Contact Person</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Name"
                required
                value={formData.contactPerson.name}
                onChange={(e) => setFormData({
                  ...formData,
                  contactPerson: { ...formData.contactPerson, name: e.target.value }
                })}
              />
              <Input
                label="Email"
                type="email"
                required
                value={formData.contactPerson.email}
                onChange={(e) => setFormData({
                  ...formData,
                  contactPerson: { ...formData.contactPerson, email: e.target.value }
                })}
              />
              <Input
                label="Phone"
                required
                value={formData.contactPerson.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  contactPerson: { ...formData.contactPerson, phone: e.target.value }
                })}
              />
              <Input
                label="Designation"
                value={formData.contactPerson.designation}
                onChange={(e) => setFormData({
                  ...formData,
                  contactPerson: { ...formData.contactPerson, designation: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Business Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  required
                >
                  <option value="FINTECH">Fintech</option>
                  <option value="NBFC">NBFC</option>
                  <option value="BANK">Bank</option>
                  <option value="AGGREGATOR">Aggregator</option>
                  <option value="BROKER">Broker</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <Input
                label="GST Number"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              />
              <Input
                label="PAN Number"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
              />
              <Input
                label="Webhook URL"
                placeholder="https://partner.com/webhook"
                value={formData.webhookUrl}
                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about this partner..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Partner</Button>
          </div>
        </form>
      </Modal>

      {/* Credentials Modal */}
      <Modal
        isOpen={showCredentialsModal}
        onClose={() => {
          setShowCredentialsModal(false);
          setNewCredentials(null);
        }}
        title="API Credentials"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ Important: Save these credentials securely. The API Secret will not be shown again.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={newCredentials?.apiKey || ''}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(newCredentials?.apiKey || '');
                  showSuccess('API Key copied to clipboard');
                }}
              >
                Copy
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={newCredentials?.apiSecret || ''}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(newCredentials?.apiSecret || '');
                  showSuccess('API Secret copied to clipboard');
                }}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Integration Instructions:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Include the API Key in the <code className="bg-blue-100 px-1 rounded">X-API-Key</code> header</li>
              <li>Store the API Secret securely in your environment variables</li>
              <li>Use the Partner ID in the <code className="bg-blue-100 px-1 rounded">X-Partner-Id</code> header (optional)</li>
              <li>Make requests to: <code className="bg-blue-100 px-1 rounded">{window.location.origin}/api/loan-applications</code></li>
            </ol>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => {
              setShowCredentialsModal(false);
              setNewCredentials(null);
            }}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

