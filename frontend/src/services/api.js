import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Source': 'WEB'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error?.message || 'Something went wrong';
    return Promise.reject({ message, ...error.response?.data?.error });
  }
);

// Loan Products API
export const loanProductsAPI = {
  getAll: (params) => api.get('/loan-products', { params }),
  getById: (id) => api.get(`/loan-products/${id}`),
  create: (data) => api.post('/loan-products', data),
  update: (id, data) => api.put(`/loan-products/${id}`, data),
  delete: (id) => api.delete(`/loan-products/${id}`)
};

// Customers API
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  searchByPan: (pan) => api.get(`/customers/search/pan/${pan}`)
};

// Collaterals API
export const collateralsAPI = {
  getAll: (params) => api.get('/collaterals', { params }),
  getById: (id) => api.get(`/collaterals/${id}`),
  create: (data) => api.post('/collaterals', data),
  updateNav: (id, newNav) => api.patch(`/collaterals/${id}/nav`, { newNav }),
  updateLien: (id, data) => api.patch(`/collaterals/${id}/lien`, data),
  release: (id) => api.patch(`/collaterals/${id}/release`),
  getSummaryByFundType: () => api.get('/collaterals/summary/by-fund-type'),
  bulkNavUpdate: (updates) => api.post('/collaterals/bulk-nav-update', { updates })
};

// Loan Applications API
export const loanApplicationsAPI = {
  getAll: (params) => api.get('/loan-applications', { params }),
  getById: (id) => api.get(`/loan-applications/${id}`),
  create: (data) => api.post('/loan-applications', data),
  updateStatus: (id, data) => api.patch(`/loan-applications/${id}/status`, data),
  disburse: (id, data) => api.post(`/loan-applications/${id}/disburse`, data),
  addCollateral: (id, data) => api.post(`/loan-applications/${id}/collaterals`, data)
};

// Loans API
export const loansAPI = {
  getAll: (params) => api.get('/loans', { params }),
  getById: (id) => api.get(`/loans/${id}`),
  getSchedule: (id, params) => api.get(`/loans/${id}/schedule`, { params }),
  recordPayment: (id, data) => api.post(`/loans/${id}/payments`, data),
  getPayments: (id) => api.get(`/loans/${id}/payments`),
  prepay: (id, data) => api.post(`/loans/${id}/prepay`, data),
  getSummary: () => api.get('/loans/summary'),
  getMarginCalls: () => api.get('/loans/margin-calls')
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;

