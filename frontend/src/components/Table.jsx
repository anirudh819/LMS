import React from 'react';

export const Table = ({ children, className = '' }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        {children}
      </table>
    </div>
  );
};

export const Thead = ({ children }) => {
  return (
    <thead className="border-b border-white/10">
      {children}
    </thead>
  );
};

export const Tbody = ({ children }) => {
  return <tbody className="divide-y divide-white/5">{children}</tbody>;
};

export const Tr = ({ children, className = '', onClick }) => {
  return (
    <tr
      className={`table-row-hover transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export const Th = ({ children, className = '' }) => {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
};

export const Td = ({ children, className = '' }) => {
  return (
    <td className={`px-4 py-4 text-sm text-dark-200 ${className}`}>
      {children}
    </td>
  );
};

export default Table;

