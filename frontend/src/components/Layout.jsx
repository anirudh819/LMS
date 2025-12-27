import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Package,
  FileText,
  PlusCircle,
  Wallet,
  Shield,
  Users,
  Menu,
  X,
  TrendingUp,
  Bell,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/loan-products', label: 'Loan Products', icon: Package },
  { path: '/loan-applications', label: 'Applications', icon: FileText },
  { path: '/create-application', label: 'New Application', icon: PlusCircle },
  { path: '/ongoing-loans', label: 'Ongoing Loans', icon: Wallet },
  { path: '/collaterals', label: 'Collaterals', icon: Shield },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/partners', label: 'API Partners', icon: Building2 },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useApp();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col glass transition-all duration-300 ${
          sidebarOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center h-20 border-b border-white/5 ${sidebarOpen ? 'justify-between px-6' : 'justify-center px-2'}`}>
          <Link to="/" className={`flex items-center ${sidebarOpen ? 'gap-3' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-display font-bold text-white">LAMF</h1>
                <p className="text-xs text-dark-400">Loan Management</p>
              </div>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Collapse/Expand Button (Desktop Only) */}
        <div className={`hidden lg:flex border-b border-white/5 ${sidebarOpen ? 'justify-end px-4 py-2' : 'justify-center py-2'}`}>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-dark-400 hover:text-white"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <div key={item.path} className="relative group/nav">
                <Link
                  to={item.path}
                  className={`flex items-center rounded-xl transition-all duration-200 ${
                    sidebarOpen ? 'gap-3 px-4 py-3' : 'justify-center py-3'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-white border border-primary-500/30'
                      : 'text-dark-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-400' : 'group-hover/nav:text-primary-400'}`} />
                  {sidebarOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
                {/* Tooltip for collapsed state */}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-dark-800 text-white text-sm rounded-lg opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-dark-800"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className={`border-t border-white/5 ${sidebarOpen ? 'p-4' : 'p-2'}`}>
          {sidebarOpen ? (
            <div className="p-4 rounded-xl glass-light">
              <p className="text-xs text-dark-400 mb-2">API Status</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 status-active"></span>
                <span className="text-sm text-green-400">Connected</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="relative group/status">
                <span className="w-3 h-3 rounded-full bg-green-500 status-active block"></span>
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-3 py-2 bg-dark-800 text-white text-sm rounded-lg opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none bottom-0">
                  API Connected
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-dark-800"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 glass flex items-center justify-between px-6 border-b border-white/5">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:block">
            <h2 className="text-lg font-display font-semibold text-white">
              {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-dark-400" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-500"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <span className="text-sm font-semibold text-white">A</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default Layout;

