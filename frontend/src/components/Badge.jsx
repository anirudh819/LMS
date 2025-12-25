import React from 'react';

const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const variants = {
    default: 'bg-dark-700 text-dark-300 border-dark-600',
    primary: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    accent: 'bg-accent-500/20 text-accent-400 border-accent-500/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border font-medium ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const statusConfig = {
    // Loan Application statuses
    DRAFT: { variant: 'default', label: 'Draft' },
    SUBMITTED: { variant: 'info', label: 'Submitted' },
    UNDER_REVIEW: { variant: 'warning', label: 'Under Review' },
    DOCUMENTS_PENDING: { variant: 'warning', label: 'Documents Pending' },
    COLLATERAL_VERIFICATION: { variant: 'info', label: 'Verifying Collateral' },
    CREDIT_CHECK: { variant: 'info', label: 'Credit Check' },
    APPROVED: { variant: 'success', label: 'Approved' },
    REJECTED: { variant: 'danger', label: 'Rejected' },
    DISBURSED: { variant: 'primary', label: 'Disbursed' },
    CANCELLED: { variant: 'danger', label: 'Cancelled' },
    EXPIRED: { variant: 'default', label: 'Expired' },
    
    // Loan statuses
    ACTIVE: { variant: 'success', label: 'Active' },
    CLOSED: { variant: 'default', label: 'Closed' },
    OVERDUE: { variant: 'warning', label: 'Overdue' },
    NPA: { variant: 'danger', label: 'NPA' },
    WRITTEN_OFF: { variant: 'danger', label: 'Written Off' },
    SETTLED: { variant: 'success', label: 'Settled' },
    FORECLOSED: { variant: 'info', label: 'Foreclosed' },
    
    // Collateral statuses
    PENDING: { variant: 'warning', label: 'Pending' },
    MARKED: { variant: 'success', label: 'Marked' },
    RELEASED: { variant: 'info', label: 'Released' },
    INVOKED: { variant: 'danger', label: 'Invoked' },
    LIQUIDATED: { variant: 'danger', label: 'Liquidated' },
    
    // Product statuses
    INACTIVE: { variant: 'default', label: 'Inactive' },
    DISCONTINUED: { variant: 'danger', label: 'Discontinued' },
    
    // KYC statuses
    IN_PROGRESS: { variant: 'info', label: 'In Progress' },
    VERIFIED: { variant: 'success', label: 'Verified' },
  };

  const config = statusConfig[status] || { variant: 'default', label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default Badge;

