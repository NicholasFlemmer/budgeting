import React, { useState, useEffect, useMemo } from 'react';
import { Table, Filter, Download, Trash2, HelpCircle } from 'lucide-react';
import { useTableDragScroll } from './hooks/TableDragScroll';
import { FilterPanel } from './components/FilterPanel';
import { Auth } from './components/Auth';
import { ClientDropdown } from './components/ClientDropdown';
import { DepartmentSelector } from './components/DepartmentSelector';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Tooltip } from './components/Tooltip';
import type { BudgetItem } from './types/database';
import { getClients } from './data/clients';

interface BudgetRow {
  id: string;
  clientId: number | null;
  clientName: string;
  productLine: string;
  accountLevel: string;
  classification: string;
  problemDescription: string;
  months: Record<string, string>;
  costOfSales: string;
  totalAmount: string;
  expectedDiff: string;
  department: string;
  selected?: boolean;
}

export default function App() {
  const tableContainerRef = useTableDragScroll();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    client: '',
    productLine: '',
    classification: '',
    accountLevel: ''
  });

  const months = [
    'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025', 
    'August 2025', 'September 2025', 'October 2025', 'November 2025', 
    'December 2025', 'January 2026', 'February 2026'
  ];

  const [rows, setRows] = useState<BudgetRow[]>([getEmptyRow()]);

  const productLineOptions = [
    // ... (keep your existing product line options)
  ];

  const classifications = ['New', 'Adjacency', 'Renewal', 'Repeat Business', 'Uplift'];
  const accountLevels = [
    // ... (keep your existing account levels)
  ];

  function getEmptyRow(): BudgetRow {
    return {
      id: crypto.randomUUID(),
      clientId: null,
      clientName: '',
      productLine: '',
      accountLevel: '',
      classification: '',
      problemDescription: '',
      months: months.reduce((acc, month) => ({ ...acc, [month]: '' }), {}),
      costOfSales: 'R 0.00',
      totalAmount: 'R 0.00',
      expectedDiff: '0.0%',
      department: selectedDepartment || 'tt',
      selected: false
    };
  }

  const formatRand = (value: string) => {
    if (!value) return '';
    const number = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(number);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  const extractNumber = (value: string) => {
    const number = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(number) ? 0 : number;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
      } catch (err) {
        console.error('Auth error:', err);
        setError('Authentication failed. Please try again.');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const loadBudgetItems = async () => {
      if (!user) return;
      
      try {
        const query = supabase
          .from('budget_items')
          .select('*');

        if (selectedDepartment) {
          query.eq('department', selectedDepartment);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error loading budget items:', error);
          return;
        }

        if (data) {
          const formattedRows = data.map(item => ({
            id: item.id,
            clientId: item.client_id,
            clientName: item.client || '',
            productLine: item.product_line || '',
            accountLevel: item.account_level || '',
            classification: item.classification || '',
            problemDescription: item.problem_description || '',
            months: item.month_values || {},
            costOfSales: formatRand(String(item.cost_of_sales || 0)),
            totalAmount: formatRand(String(item.total_amount || 0)),
            expectedDiff: formatPercentage(item.gp_percentage || 0),
            department: item.department || 'tt',
            selected: false
          }));

          setRows(formattedRows.length > 0 ? formattedRows : [getEmptyRow()]);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadBudgetItems();
  }, [user, selectedDepartment]);

  const calculateTotals = (row: BudgetRow, updatedField?: string) => {
    const total = Object.values(row.months).reduce((sum, value) => sum + extractNumber(value), 0);
    let costOfSales = extractNumber(row.costOfSales);
    let gpPercentage = extractNumber(row.expectedDiff);

    if (updatedField === 'expectedDiff') {
      gpPercentage = extractNumber(row.expectedDiff);
      costOfSales = total * (1 - gpPercentage / 100);
    } else {
      costOfSales = extractNumber(row.costOfSales);
      gpPercentage = total > 0 ? ((total - costOfSales) / total) * 100 : 0;
    }
    
    return {
      totalAmount: formatRand(String(total)),
      costOfSales: formatRand(String(costOfSales)),
      expectedDiff: formatPercentage(gpPercentage)
    };
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const saveRow = async (row: BudgetRow) => {
    try {
      const budgetItem = {
        id: row.id,
        client_id: row.clientId,
        client: row.clientName,
        product_line: row.productLine,
        account_level: row.accountLevel,
        classification: row.classification,
        problem_description: row.problemDescription,
        month_values: row.months,
        cost_of_sales: extractNumber(row.costOfSales),
        total_amount: extractNumber(row.totalAmount),
        gp_percentage: extractNumber(row.expectedDiff),
        department: row.department
      };

      const { error } = await supabase
        .from('budget_items')
        .upsert(budgetItem)
        .select();

      if (error) {
        console.error('Error saving row:', error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateCell = async (rowId: string, field: string, value: string) => {
    const updatedRows = rows.map(row => {
      if (row.id === rowId) {
        let updatedRow;
        if (field.includes('202') || field === 'costOfSales') {
          const numericValue = value.replace(/[^\d.-]/g, '');
          const formattedValue = numericValue ? formatRand(numericValue) : '';
          if (field === 'costOfSales') {
            updatedRow = { ...row, costOfSales: formattedValue };
          } else {
            updatedRow = {
              ...row,
              months: { ...row.months, [field]: formattedValue }
            };
          }
        } else if (field === 'expectedDiff') {
          const numericValue = value.replace(/[^\d.-]/g, '');
          updatedRow = { ...row, expectedDiff: formatPercentage(parseFloat(numericValue)) };
        } else if (field === 'clientName') {
          const selectedClient = clients.find(c => c.name === value);
          updatedRow = { 
            ...row, 
            clientName: value,
            clientId: selectedClient ? selectedClient.id : null
          };
        } else {
          updatedRow = { ...row, [field]: value };
        }
        
        const finalRow = {
          ...updatedRow,
          ...calculateTotals(updatedRow, field)
        };
        
        saveRow(finalRow);
        return finalRow;
      }
      return row;
    });

    setRows(updatedRows);
  };

  const addRow = async () => {
    const newRow = getEmptyRow();
    setRows(prev => [...prev, newRow]);
    await saveRow(newRow);
  };

  const deleteRows = async (rowIds: string[]) => {
    try {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .in('id', rowIds);

      if (error) {
        console.error('Error deleting rows:', error);
        return;
      }

      setRows(rows.filter(row => !rowIds.includes(row.id)));
      setSelectedRows([]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => {
      if (prev.includes(id)) {
        return prev.filter(rowId => rowId !== id);
      }
      return [...prev, id];
    });
  };

  const toggleAllRows = () => {
    if (selectedRows.length === filteredRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredRows.map(row => row.id));
    }
  };

  const deleteSelectedRows = () => {
    deleteRows(selectedRows);
  };

  const filteredRows = useMemo(() => 
    rows.filter(row => {
      return (
        (!filters.client || row.clientName === filters.client) &&
        (!filters.productLine || row.productLine === filters.productLine) &&
        (!filters.classification || row.classification === filters.classification) &&
        (!filters.accountLevel || row.accountLevel === filters.accountLevel)
      );
    }),
    [rows, filters]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="container mx-auto">
        <DepartmentSelector
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
        />

        <div className="bg-white rounded-xl shadow-lg border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Table className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-xl font-semibold text-slate-800">Total Budget</h1>
            </div>
            <div className="flex gap-3">
              {selectedRows.length > 0 && (
                <button
                  onClick={deleteSelectedRows}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-medium">Delete Selected ({selectedRows.length})</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="sticky top-0 z-10 overflow-x-auto" ref={tableContainerRef} style={{ maxHeight: 'calc(100vh - 300px)' }}>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-2 px-2 text-left font-semibold text-slate-700 w-24">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === filteredRows.length && filteredRows.length > 0}
                      onChange={toggleAllRows}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-2 px-2 text-left font-semibold text-slate-700 w-96">
                    <Tooltip content="Select the client">
                      <div className="flex items-center gap-1">
                        Client
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                      </div>
                    </Tooltip>
                  </th>
                  <th className="py-2 px-2 text-left font-semibold text-slate-700 w-96">
                    <Tooltip content="Enter the product line">
                      <div className="flex items-center gap-1">
                        Product/Service Line
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                      </div>
                    </Tooltip>
                  </th>
                  <th className="py-2 px-2 text-left font-semibold text-slate-700 w-96">
                    <Tooltip content="Select the account level">
                      <div className="flex items-center gap-1">
                        Account Lead
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                      </div>
                    </Tooltip>
                  </th>
                  <th className="py-2 px-2 text-left font-semibold text-slate-700 w-96">
                    <Tooltip content="Select the classification">
                      <div className="flex items-center gap-1">
                        Classification
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                      </div>
                    </Tooltip>
                  </th>
                  <th className="py-2 px-2 text-left font-semibold text-slate-700 w-96">
                    <Tooltip content="Describe the problem being solved">
                      <div className="flex items-center gap-1">
                        Problem Description
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                      </div>
                    </Tooltip>
                  </th>
                  {months.map(month => (
                    <th key={month} className="py-2 px-2 text-left font-semibold text-slate-700 w-96 whitespace-nowrap">
                      <Tooltip content={`Enter amount for ${month}`}>
                        <div className="flex items-center gap-1">
                          {month}
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                        </div>
                      </Tooltip>
                    </th>
                  ))}
                  <th className="py-2 px-2 text-left font-semibold text-slate-700 w-72 whitespace-nowrap">
                    <Tooltip content="Gross profit percentage">
                      <div className="flex items-center gap-1">
                        GP%
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                      </div>
                    </Tooltip>
                  </th>
                  <th className="py-2 px-2 text-left font-semibold text-slate-700 w-96 whitespace-nowrap">
                    <Tooltip content="Enter cost of sales">
                      <div className="flex items-center gap-1">
                        Cost of Sales
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                      </div>
                    </Tooltip>
                  </th>
                  <th className="py-2 px-2 text-left font-semibold text-slate-700 w-96 whitespace-nowrap">
                    <Tooltip content="Calculated total amount">
                      <div className="flex items-center gap-1">
                        Total Amount
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                      </div>
                    </Tooltip>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/70">
                    <td className="p-1 min-w-[48px]">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => toggleRowSelection(row.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-1 min-w-[192px]">
                      <ClientDropdown
                        value={row.clientName}
                        onChange={(e) => updateCell(row.id, 'clientName', e.target.value)}
                      />
                    </td>
                    <td className="p-1 min-w-[192px]">
                      <input
                        type="text"
                        className="w-full px-2 py-1 rounded border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors"
                        value={row.productLine}
                        onChange={(e) => updateCell(row.id, 'productLine', e.target.value)}
                        placeholder="Enter Product Line..."
                      />
                    </td>
                    <td className="p-1 min-w-[192px]">
                      <input
                        type="text"
                        className="w-full px-2 py-1 rounded border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors"
                        value={row.accountLevel}
                        onChange={(e) => updateCell(row.id, 'accountLevel', e.target.value)}
                        placeholder="Enter Account Lead..."
                      />
                    </td>
                    <td className="p-1 min-w-[192px]">
                      <select
                        className="w-full px-2 py-1 rounded border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors"
                        value={row.classification}
                        onChange={(e) => updateCell(row.id, 'classification', e.target.value)}
                      >
                        <option value="">Select Classification...</option>
                        {classifications.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1 min-w-[192px]">
                      <textarea
                        className="w-full px-2 py-1 rounded border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors resize-none"
                        value={row.problemDescription}
                        onChange={(e) => updateCell(row.id, 'problemDescription', e.target.value)}
                        placeholder="Describe the problem being solved..."
                        rows={3}
                      />
                    </td>
                    {months.map(month => (
                      <td key={month} className="p-1 min-w-[192px]">
                        <input
                          type="text"
                          className="w-full px-2 py-1 rounded border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors text-right"
                          value={row.months[month]}
                          onChange={(e) => updateCell(row.id, month, e.target.value)}
                          placeholder="R 0.00"
                        />
                      </td>
                    ))}
                    <td className="p-1 min-w-[144px]">
                      <input
                        type="text"
                        className="w-full px-2 py-1 rounded border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors text-right"
                        value={row.expectedDiff}
                        onChange={(e) => updateCell(row.id, 'expectedDiff', e.target.value)}
                        placeholder="0.0%"
                      />
                    </td>
                    <td className="p-1 min-w-[192px]">
                      <input
                        type="text"
                        className="w-full px-2 py-1 rounded border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors text-right"
                        value={row.costOfSales}
                        onChange={(e) => updateCell(row.id, 'costOfSales', e.target.value)}
                        placeholder="R 0.00"
                      />
                    </td>
                    <td className="p-1 min-w-[192px]">
                      <input
                        type="text"
                        className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-right font-medium"
                        value={row.totalAmount}
                        readOnly
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={addRow}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium focus:ring-4 focus:ring-blue-100"
            >
              Add Row
            </button>
          </div>

          <div className="p-4 border-t border-slate-200">
            <div className="flex justify-end gap-8">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-500 mb-1">Total Revenue</div>
                <div className="text-lg font-semibold text-slate-800">
                  {formatRand(String(rows.reduce((sum, row) => sum + extractNumber(row.totalAmount), 0)))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-500 mb-1">Total Cost of Sales</div>
                <div className="text-lg font-semibold text-slate-800">
                  {formatRand(String(rows.reduce((sum, row) => sum + extractNumber(row.costOfSales), 0)))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-500 mb-1">Total Gross Profit</div>
                <div className="text-lg font-semibold text-slate-800">
                  {formatRand(String(rows.reduce((sum, row) => 
                    sum + (extractNumber(row.totalAmount) - extractNumber(row.costOfSales)), 0
                  )))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-500 mb-1">Average GP%</div>
                <div className="text-lg font-semibold text-slate-800">
                  {formatPercentage(
                    rows.length > 0
                      ? rows.reduce((sum, row) => sum + extractNumber(row.expectedDiff), 0) / rows.length
                      : 0
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        clients={rows.map(row => row.clientName)}
        productLines={productLineOptions}
        classifications={classifications}
        accountLevels={accountLevels}
      />
    </div>
  );
}