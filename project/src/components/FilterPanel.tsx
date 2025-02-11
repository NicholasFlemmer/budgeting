import React from 'react';
import { X } from 'lucide-react';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    client: string;
    productLine: string;
    classification: string;
    accountLevel: string;
  };
  onFilterChange: (key: keyof typeof filters, value: string) => void;
  clients: string[];
  productLines: string[];
  classifications: string[];
  accountLevels: string[];
}

export function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  clients,
  subsidiaries,
  productLines,
  classifications,
  accountLevels,
}: FilterPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end">
      <div className="w-96 bg-white h-full shadow-xl flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Client</label>
            <select
              className="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              value={filters.client}
              onChange={(e) => onFilterChange('client', e.target.value)}
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Product Line</label>
            <select
              className="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              value={filters.productLine}
              onChange={(e) => onFilterChange('productLine', e.target.value)}
            >
              <option value="">All Product Lines</option>
              {productLines.map(line => (
                <option key={line} value={line}>{line}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Subsidiary</label>
            <select
              className="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              value={filters.subsidiary}
              onChange={(e) => onFilterChange('subsidiary', e.target.value)}
            >
              <option value="">All Subsidiaries</option>
              {subsidiaries.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Classification</label>
            <select
              className="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              value={filters.classification}
              onChange={(e) => onFilterChange('classification', e.target.value)}
            >
              <option value="">All Classifications</option>
              {classifications.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Account Level</label>
            <select
              className="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              value={filters.accountLevel}
              onChange={(e) => onFilterChange('accountLevel', e.target.value)}
            >
              <option value="">All Account Leads</option>
              {accountLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => {
              Object.keys(filters).forEach(key => {
                onFilterChange(key as keyof typeof filters, '');
              });
            }}
            className="w-full px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
}
