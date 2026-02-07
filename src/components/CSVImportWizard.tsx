'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Check, AlertCircle, ArrowRight, ArrowLeft, FileSpreadsheet, Loader2 } from 'lucide-react';
import { CONTACT_FIELDS } from '@/lib/csv';

interface ImportPreviewResult {
  headers: string[];
  suggestedMapping: Record<string, string>;
  preview: Record<string, any>[];
  totalRows: number;
}

interface ImportResult {
  imported: number;
  skipped: number;
  duplicates: string[];
  errors: { row: number; error: string }[];
}

interface CSVImportWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export default function CSVImportWizard({ onClose, onComplete }: CSVImportWizardProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<ImportPreviewResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle file drop/select
  const handleFile = useCallback(async (selectedFile: File) => {
    setError(null);
    
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('action', 'preview');

      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse CSV');
      }

      setCsvData(data);
      setMapping(data.suggestedMapping);
      setStep('mapping');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  // Validate mapping
  const validateMapping = (): string | null => {
    const mappedFields = Object.values(mapping).filter(Boolean);
    const requiredFields = ['firstName', 'lastName', 'email'];
    const missing = requiredFields.filter(f => !mappedFields.includes(f));
    
    if (missing.length > 0) {
      return `Please map the required fields: ${missing.map(f => 
        CONTACT_FIELDS.find(cf => cf.value === f)?.label || f
      ).join(', ')}`;
    }
    return null;
  };

  // Handle import
  const handleImport = async () => {
    if (!csvData) return;

    const validationError = validateMapping();
    if (validationError) {
      setError(validationError);
      return;
    }

    setStep('importing');
    setError(null);

    try {
      // Convert preview data back to rows format
      const rows = csvData.preview.map(row => {
        const obj: Record<string, string> = {};
        csvData.headers.forEach(h => {
          obj[h] = row[h] || '';
        });
        return obj;
      });

      // For actual import, we need to re-read the file
      if (!file) throw new Error('File not found');
      
      const content = await file.text();
      const lines = content.split(/\r?\n/).filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      const allRows = lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] || '';
        });
        return obj;
      });

      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: allRows,
          mapping,
          skipDuplicates
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data);
      setStep('complete');
    } catch (err: any) {
      setError(err.message);
      setStep('preview');
    }
  };

  // Simple CSV line parser
  const parseCSVLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          fields.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }
    fields.push(current.trim());
    return fields;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-[#FF3300]" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Import Contacts</h2>
              <p className="text-sm text-gray-500">
                {step === 'upload' && 'Upload a CSV file'}
                {step === 'mapping' && 'Map columns to contact fields'}
                {step === 'preview' && 'Review and import'}
                {step === 'importing' && 'Importing...'}
                {step === 'complete' && 'Import complete'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-4 px-6 bg-gray-50">
          {(['upload', 'mapping', 'preview', 'complete'] as const).map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step === s ? 'bg-[#FF3300] text-white' : 
                  (['mapping', 'preview', 'complete'].indexOf(step) >= i) ? 'bg-green-500 text-white' : 
                  'bg-gray-200 text-gray-500'}
              `}>
                {(['mapping', 'preview', 'complete'].indexOf(step) > i) ? <Check size={16} /> : i + 1}
              </div>
              {i < 3 && (
                <div className={`w-12 h-1 mx-1 ${
                  (['mapping', 'preview', 'complete'].indexOf(step) > i) ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Upload Step */}
          {step === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                border-2 border-dashed rounded-xl p-12 text-center transition
                ${dragActive ? 'border-[#FF3300] bg-[#FF3300]/5' : 'border-gray-300 hover:border-gray-400'}
                ${loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              `}
            >
              {loading ? (
                <Loader2 className="mx-auto text-[#FF3300] animate-spin" size={48} />
              ) : (
                <Upload className="mx-auto text-gray-400 mb-4" size={48} />
              )}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {loading ? 'Processing...' : 'Drop your CSV file here'}
              </h3>
              <p className="text-gray-500 mb-4">or click to browse</p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg font-medium cursor-pointer transition"
              >
                Select File
              </label>
              <p className="text-xs text-gray-400 mt-4">Maximum file size: 5MB</p>
            </div>
          )}

          {/* Mapping Step */}
          {step === 'mapping' && csvData && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Found {csvData.totalRows} rows. Map each CSV column to a contact field:
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {csvData.headers.map((header) => (
                  <div key={header} className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {header}
                      </label>
                      <select
                        value={mapping[header] || ''}
                        onChange={(e) => setMapping({ ...mapping, [header]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                      >
                        {CONTACT_FIELDS.map(field => (
                          <option 
                            key={field.value} 
                            value={field.value}
                            disabled={!!(field.value && Object.values(mapping).includes(field.value) && mapping[header] !== field.value)}
                          >
                            {field.label} {field.required && '*'}
                          </option>
                        ))}
                      </select>
                    </div>
                    {mapping[header] && (
                      <Check className="text-green-500 mt-6" size={20} />
                    )}
                  </div>
                ))}
              </div>

              {/* Preview of first row */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">First row preview:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {csvData.preview.slice(0, 1).map((row, i) => (
                    <div key={i}>
                      {Object.entries(mapping).filter(([_, v]) => v).map(([header, field]) => (
                        <span key={header} className="inline-block mr-4">
                          <span className="text-gray-400">{CONTACT_FIELDS.find(f => f.value === field)?.label}:</span>{' '}
                          <span className="font-medium">{row[header] || '—'}</span>
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && csvData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Ready to import <strong>{csvData.totalRows}</strong> contacts
                </p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="rounded border-gray-300 text-[#FF3300] focus:ring-[#FF3300]"
                  />
                  Skip duplicate emails
                </label>
              </div>

              {/* Preview table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.entries(mapping)
                          .filter(([_, field]) => field)
                          .slice(0, 5)
                          .map(([header, field]) => (
                            <th key={header} className="px-4 py-2 text-left font-medium text-gray-700">
                              {CONTACT_FIELDS.find(f => f.value === field)?.label}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.preview.map((row, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          {Object.entries(mapping)
                            .filter(([_, field]) => field)
                            .slice(0, 5)
                            .map(([header]) => (
                              <td key={header} className="px-4 py-2 text-gray-600">
                                {row[header] || '—'}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvData.totalRows > 5 && (
                  <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 border-t">
                    ... and {csvData.totalRows - 5} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="text-center py-12">
              <Loader2 className="mx-auto text-[#FF3300] animate-spin mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Importing contacts...</h3>
              <p className="text-gray-500">This may take a moment</p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && result && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-green-600" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Import Complete!</h3>
              
              <div className="grid grid-cols-3 gap-4 mt-6 max-w-md mx-auto">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{result.imported}</div>
                  <div className="text-sm text-green-700">Imported</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">{result.duplicates.length}</div>
                  <div className="text-sm text-yellow-700">Duplicates</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-600">{result.skipped}</div>
                  <div className="text-sm text-gray-700">Skipped</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-6 text-left max-w-md mx-auto">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Errors:</h4>
                  <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700 max-h-32 overflow-y-auto">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <div key={i}>Row {err.row}: {err.error}</div>
                    ))}
                    {result.errors.length > 5 && (
                      <div className="text-red-500">...and {result.errors.length - 5} more</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              if (step === 'mapping') setStep('upload');
              else if (step === 'preview') setStep('mapping');
            }}
            disabled={step === 'upload' || step === 'importing' || step === 'complete'}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition"
            >
              {step === 'complete' ? 'Close' : 'Cancel'}
            </button>
            
            {step === 'mapping' && (
              <button
                onClick={() => {
                  const err = validateMapping();
                  if (err) {
                    setError(err);
                  } else {
                    setError(null);
                    setStep('preview');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg font-medium transition"
              >
                Continue
                <ArrowRight size={18} />
              </button>
            )}
            
            {step === 'preview' && (
              <button
                onClick={handleImport}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg font-medium transition"
              >
                Import {csvData?.totalRows} Contacts
                <Check size={18} />
              </button>
            )}
            
            {step === 'complete' && (
              <button
                onClick={() => {
                  onComplete();
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg font-medium transition"
              >
                View Contacts
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
