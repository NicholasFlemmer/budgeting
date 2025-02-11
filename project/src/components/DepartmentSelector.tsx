import React from 'react';

interface Department {
  id: string;
  name: string;
  color: string;
}

interface DepartmentSelectorProps {
  selectedDepartment: string | null;
  onDepartmentChange: (department: string | null) => void;
}

const departments: Department[] = [
  { id: 'tt', name: 'TT', color: 'bg-blue-600 hover:bg-blue-700' },
  { id: 'td', name: 'TD/BD', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { id: 'cs', name: 'CS', color: 'bg-amber-600 hover:bg-amber-700' },
  { id: 'impactful', name: 'Impactful', color: 'bg-rose-600 hover:bg-rose-700' }
];

export function DepartmentSelector({ selectedDepartment, onDepartmentChange }: DepartmentSelectorProps) {
  return (
    <div className="mb-6 flex gap-3">
      {departments.map(dept => (
        <button
          key={dept.id}
          onClick={() => onDepartmentChange(dept.id)}
          className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${
            selectedDepartment === dept.id 
              ? dept.color
              : 'bg-slate-500 hover:bg-slate-600'
          }`}
        >
          {dept.name}
        </button>
      ))}
      {selectedDepartment && (
        <button
          onClick={() => onDepartmentChange(null)}
          className="px-6 py-3 rounded-lg text-slate-600 bg-slate-200 hover:bg-slate-300 font-medium transition-colors"
        >
          Show All
        </button>
      )}
    </div>
  );
}