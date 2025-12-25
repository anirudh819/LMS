import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit2, Users } from 'lucide-react';
import { Card } from '../components/Card';
import Button from '../components/Button';
import { Input, Select, Textarea } from '../components/Input';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/Table';
import Badge, { StatusBadge } from '../components/Badge';
import Modal from '../components/Modal';
import { PageLoading } from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { customersAPI } from '../services/api';
import { useApp } from '../context/AppContext';

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  panNumber: '',
  aadharNumber: '',
  employmentType: 'SALARIED',
  monthlyIncome: '',
  address: {
    street: '',
    city: '',
    state: '',
    pincode: ''
  },
  bankDetails: {
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: 'SAVINGS'
  }
};

const Customers = () => {
  const { showSuccess, showError } = useApp();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') {
        fetchCustomers();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search })
      });
      setCustomers(response.data.customers);
      setPagination(prev => ({ ...prev, total: response.data.pagination.total }));
    } catch (error) {
      showError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const payload = {
        ...formData,
        monthlyIncome: parseFloat(formData.monthlyIncome)
      };

      if (selectedCustomer) {
        await customersAPI.update(selectedCustomer._id, payload);
        showSuccess('Customer updated successfully');
      } else {
        await customersAPI.create(payload);
        showSuccess('Customer created successfully');
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      showError(error.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth?.split('T')[0] || '',
      panNumber: customer.panNumber,
      aadharNumber: customer.aadharNumber,
      employmentType: customer.employmentType,
      monthlyIncome: customer.monthlyIncome?.toString() || '',
      address: customer.address || {},
      bankDetails: customer.bankDetails || {}
    });
    setIsModalOpen(true);
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  const employmentTypes = [
    { value: 'SALARIED', label: 'Salaried' },
    { value: 'SELF_EMPLOYED', label: 'Self Employed' },
    { value: 'BUSINESS', label: 'Business' },
    { value: 'PROFESSIONAL', label: 'Professional' },
    { value: 'RETIRED', label: 'Retired' },
    { value: 'OTHER', label: 'Other' }
  ];

  if (loading && customers.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Customers</h1>
          <p className="text-dark-400 mt-1">Manage customer information</p>
        </div>
        <Button icon={Plus} onClick={() => {
          setSelectedCustomer(null);
          setFormData(initialFormState);
          setIsModalOpen(true);
        }}>
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <Card className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Search by name, email, or PAN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {/* Customers Table */}
      <Card>
        {customers.length > 0 ? (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Customer ID</Th>
                  <Th>Name</Th>
                  <Th>Contact</Th>
                  <Th>PAN</Th>
                  <Th>Employment</Th>
                  <Th>KYC Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {customers.map((customer) => (
                  <Tr key={customer._id}>
                    <Td>
                      <span className="font-mono text-primary-400">{customer.customerId}</span>
                    </Td>
                    <Td>
                      <p className="text-white font-medium">
                        {customer.firstName} {customer.lastName}
                      </p>
                    </Td>
                    <Td>
                      <div>
                        <p className="text-white">{customer.email}</p>
                        <p className="text-xs text-dark-500">{customer.phone}</p>
                      </div>
                    </Td>
                    <Td className="font-mono">{customer.panNumber}</Td>
                    <Td>
                      <Badge variant="info" size="sm">
                        {customer.employmentType?.replace(/_/g, ' ')}
                      </Badge>
                    </Td>
                    <Td><StatusBadge status={customer.kycStatus} /></Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleViewDetails(customer)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit2}
                          onClick={() => handleEdit(customer)}
                        />
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
              <p className="text-sm text-dark-400">
                Showing {customers.length} of {pagination.total} customers
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
            icon={Users}
            title="No customers found"
            description={search ? 'No customers match your search' : 'Add your first customer to get started'}
            action={() => {
              setSelectedCustomer(null);
              setFormData(initialFormState);
              setIsModalOpen(true);
            }}
            actionLabel="Add Customer"
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCustomer ? 'Edit Customer' : 'Add Customer'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div>
            <h4 className="text-white font-medium mb-3">Personal Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <Input
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
              <Input
                label="PAN Number"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
                placeholder="ABCDE1234F"
                required
              />
              <Input
                label="Aadhar Number"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleChange}
                placeholder="XXXX-XXXX-XXXX"
                required
              />
              <Select
                label="Employment Type"
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                options={employmentTypes}
              />
              <Input
                label="Monthly Income (₹)"
                name="monthlyIncome"
                type="number"
                value={formData.monthlyIncome}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-white font-medium mb-3">Address</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Street"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className="col-span-2"
              />
              <Input
                label="City"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
              />
              <Input
                label="State"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
              />
              <Input
                label="Pincode"
                name="address.pincode"
                value={formData.address.pincode}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <h4 className="text-white font-medium mb-3">Bank Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Bank Name"
                name="bankDetails.bankName"
                value={formData.bankDetails.bankName}
                onChange={handleChange}
              />
              <Input
                label="Account Number"
                name="bankDetails.accountNumber"
                value={formData.bankDetails.accountNumber}
                onChange={handleChange}
              />
              <Input
                label="IFSC Code"
                name="bankDetails.ifscCode"
                value={formData.bankDetails.ifscCode}
                onChange={handleChange}
              />
              <Select
                label="Account Type"
                name="bankDetails.accountType"
                value={formData.bankDetails.accountType}
                onChange={handleChange}
                options={[
                  { value: 'SAVINGS', label: 'Savings' },
                  { value: 'CURRENT', label: 'Current' }
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {selectedCustomer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Customer Details"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {selectedCustomer.firstName?.[0]}{selectedCustomer.lastName?.[0]}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h3>
                <p className="text-primary-400 font-mono">{selectedCustomer.customerId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-dark-400">Email</p>
                <p className="text-white">{selectedCustomer.email}</p>
              </div>
              <div>
                <p className="text-dark-400">Phone</p>
                <p className="text-white">{selectedCustomer.phone}</p>
              </div>
              <div>
                <p className="text-dark-400">PAN Number</p>
                <p className="text-white font-mono">{selectedCustomer.panNumber}</p>
              </div>
              <div>
                <p className="text-dark-400">Date of Birth</p>
                <p className="text-white">
                  {new Date(selectedCustomer.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-dark-400">Employment</p>
                <p className="text-white">{selectedCustomer.employmentType?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-dark-400">Monthly Income</p>
                <p className="text-white">
                  ₹{selectedCustomer.monthlyIncome?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-dark-400">KYC Status</p>
                <StatusBadge status={selectedCustomer.kycStatus} />
              </div>
              <div>
                <p className="text-dark-400">Risk Profile</p>
                <Badge variant={
                  selectedCustomer.riskProfile === 'LOW' ? 'success' :
                  selectedCustomer.riskProfile === 'HIGH' ? 'danger' : 'warning'
                }>
                  {selectedCustomer.riskProfile}
                </Badge>
              </div>
            </div>

            {selectedCustomer.address && (
              <div>
                <h4 className="text-white font-medium mb-2">Address</h4>
                <p className="text-dark-300">
                  {selectedCustomer.address.street}, {selectedCustomer.address.city},{' '}
                  {selectedCustomer.address.state} - {selectedCustomer.address.pincode}
                </p>
              </div>
            )}

            {selectedCustomer.bankDetails && (
              <div>
                <h4 className="text-white font-medium mb-2">Bank Details</h4>
                <div className="p-3 rounded-xl bg-dark-800/50">
                  <p className="text-white">{selectedCustomer.bankDetails.bankName}</p>
                  <p className="text-sm text-dark-400">
                    A/C: {selectedCustomer.bankDetails.accountNumber} • IFSC: {selectedCustomer.bankDetails.ifscCode}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Customers;

