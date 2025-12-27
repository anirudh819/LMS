import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LoanProducts from './pages/LoanProducts';
import LoanApplications from './pages/LoanApplications';
import CreateApplication from './pages/CreateApplication';
import OngoingLoans from './pages/OngoingLoans';
import LoanDetails from './pages/LoanDetails';
import CollateralManagement from './pages/CollateralManagement';
import Customers from './pages/Customers';
import PartnerManagement from './pages/PartnerManagement';
import Notifications from './components/Notifications';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen grid-pattern">
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/loan-products" element={<LoanProducts />} />
              <Route path="/loan-applications" element={<LoanApplications />} />
              <Route path="/create-application" element={<CreateApplication />} />
              <Route path="/ongoing-loans" element={<OngoingLoans />} />
              <Route path="/loans/:id" element={<LoanDetails />} />
              <Route path="/collaterals" element={<CollateralManagement />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/partners" element={<PartnerManagement />} />
            </Routes>
          </Layout>
          <Notifications />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;

