import React, { useState } from 'react';
import { Upload, HelpCircle } from 'lucide-react';
import Papa from 'papaparse';
import { SupabaseClient } from '@supabase/supabase-js';
import { clients } from '../data/clients';

interface CSVImportProps {
  months?: string[];
  supabase: SupabaseClient;
  formatRand: (value: string) => string;
  formatPercentage: (value: number) => string;
  extractNumber: (value: string) => number;
  onComplete?: () => void;
  onError?: (error: string) => void;
  setRows: React.Dispatch<React.SetStateAction<BudgetRow[]>>;
}

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
  selected?: boolean;
}

const columns = [
  { key: 'clientName', label: 'Client' },
  { key: 'productLine', label: 'Product/Service Line' },
  { key: 'accountLevel', label: 'Account Lead' },
  { key: 'classification', label: 'Classification' },
  { key: 'problemDescription', label: 'Problem Description' },
  { key: 'costOfSales', label: 'Cost of Sales' },
  { key: 'expectedDiff', label: 'GP%' },
];

const CSVImport: React.FC<CSVImportProps> = ({ 
  months = [], 
  supabase,
  formatRand,
  formatPercentage,
  extractNumber,
  onComplete,
  onError,
  setRows
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [monthMapping, setMonthMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV file');
          return;
        }

        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setPreviewData(results.data);
        
        // Initialize mappings
        const initialMapping: Record<string, string> = {};
        const initialMonthMapping: Record<string, string> = {};
        
        // Try to automatically map columns based on similar names
        headers.forEach(header => {
          const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          // Check for month matches first
          const monthMatch = months.find(month => 
            normalizedHeader.includes(month.toLowerCase().replace(/[^a-z0-9]/g, ''))
          );
          
          if (monthMatch) {
            initialMonthMapping[header] = monthMatch;
          } else {
            // Check for regular column matches
            const columnMatch = columns.find(col => 
              normalizedHeader.includes(col.key.toLowerCase())
            );
            if (columnMatch) {
              initialMapping[columnMatch.key] = header;
            }
          }
        });

        setColumnMapping(initialMapping);
        setMonthMapping(initialMonthMapping);
        setIsOpen(true);
      },
      error: (error) => {
        setError('Error reading CSV file: ' + error.message);
        onError?.('Error reading CSV file: ' + error.message);
      }
    });
  };

  const handleImport = async () => {
    try {
      setIsUploading(true);
      setError('');

      // Transform the data according to the mapping
      const transformedData = previewData.map((row, index) => {
        // Format months data
        const monthValues: Record<string, string> = {};
        Object.entries(monthMapping).forEach(([csvHeader, month]) => {
          if (csvHeader && month) {
            // Ensure we're handling empty or invalid values
            const rawValue = row[csvHeader];
            const value = rawValue ? formatRand(String(rawValue)) : 'R 0.00';
            monthValues[month] = value;
          }
        });

        // Ensure all months have a value
        months.forEach(month => {
          if (!monthValues[month]) {
            monthValues[month] = 'R 0.00';
          }
        });

        // Try to find matching client
        const clientName = row[columnMapping.clientName] || '';
        const matchingClient = clients.find(c => 
          c.name.toLowerCase() === clientName.toLowerCase()
        );

        // Calculate total amount from month values
        const total = Object.values(monthValues).reduce((sum, value) => 
          sum + extractNumber(value), 0
        );

        // Get cost of sales and GP%
        const costOfSales = extractNumber(String(row[columnMapping.costOfSales] || 0));
        const gpPercentage = row[columnMapping.expectedDiff] 
          ? parseFloat(String(row[columnMapping.expectedDiff])) 
          : total > 0 
            ? ((total - costOfSales) / total) * 100 
            : 0;

        // Format for Supabase
        const transformedRow = {
          id: crypto.randomUUID(),
          client_id: matchingClient?.id || null,
          client: clientName,
          product_line: row[columnMapping.productLine] || '',
          account_level: row[columnMapping.accountLevel] || '',
          classification: row[columnMapping.classification] || '',
          problem_description: row[columnMapping.problemDescription] || '',
          month_values: monthValues,
          cost_of_sales: costOfSales,
          total_amount: total,
          gp_percentage: gpPercentage
        };

        console.log(`Transformed Row ${index}:`, transformedRow);
        return transformedRow;
      });

      console.log('Final transformed data:', transformedData);

      // Save to Supabase
     
    const { data, error: upsertError } = await supabase
      .from('budget_items')
      .upsert(transformedData)
      .select();

    if (upsertError) {
      throw upsertError;
    }

   const formattedRows = transformedData.map(item => ({
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
      selected: false
    }));

    // Update rows state directly
    setRows(prevRows => [...prevRows, ...formattedRows]);
      
    // Clear file input and close modal
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    setIsOpen(false);
    
    // Wait for the completion callback before showing success
    await onComplete?.();
    
    // Only show success message if we got this far
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg z-50';
    successMessage.textContent = 'Data imported successfully';
    document.body.appendChild(successMessage);
    setTimeout(() => successMessage.remove(), 3000);

  } catch (error) {
    console.error('Error importing data:', error);
    const errorMsg = error instanceof Error ? error.message : 'Error importing data';
    setError(errorMsg);
    onError?.(errorMsg);
  } finally {
    setIsUploading(false);
  }
};

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        id="csv-upload"
      />
      <label
        htmlFor="csv-upload"
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
      >
        <Upload className="w-4 h-4" />
        Import CSV
      </label>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Map CSV Columns</h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Regular columns mapping */}
                <div className="space-y-4">
                  <h3 className="font-medium">Fields</h3>
                  {columns.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-4">
                      <div className="w-48 flex items-center gap-2">
                        {label}
                        <div className="relative group">
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-sm rounded hidden group-hover:block whitespace-nowrap">
                            Map to your {label} column
                          </div>
                        </div>
                      </div>
                      <select
                        className="flex-1 px-2 py-1 rounded border border-slate-200"
                        value={columnMapping[key] || ''}
                        onChange={(e) => setColumnMapping({
                          ...columnMapping,
                          [key]: e.target.value
                        })}
                      >
                        <option value="">Select column...</option>
                        {csvHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Month columns mapping */}
                {months.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Month Columns</h3>
                    {months.map(month => (
                      <div key={month} className="flex items-center gap-4">
                        <div className="w-48">{month}</div>
                        <select
                          className="flex-1 px-2 py-1 rounded border border-slate-200"
                          value={Object.entries(monthMapping)
                            .find(([, m]) => m === month)?.[0] || ''}
                          onChange={(e) => {
                            const newMapping = { ...monthMapping };
                            // Remove old mapping if it exists
                            Object.entries(monthMapping).forEach(([key, value]) => {
                              if (value === month) {
                                delete newMapping[key];
                              }
                            });
                            // Add new mapping if a column is selected
                            if (e.target.value) {
                              newMapping[e.target.value] = month;
                            }
                            setMonthMapping(newMapping);
                          }}
                        >
                          <option value="">Select column...</option>
                          {csvHeaders.map(header => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Importing...' : 'Import Data'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVImport;