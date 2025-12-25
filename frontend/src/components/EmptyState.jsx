import React from 'react';
import { FileX } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = FileX,
  title = 'No data found',
  description = 'There are no items to display.',
  action,
  actionLabel = 'Create New'
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-dark-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-dark-400 mb-6 max-w-sm">{description}</p>
      {action && (
        <Button onClick={action}>{actionLabel}</Button>
      )}
    </div>
  );
};

export default EmptyState;

