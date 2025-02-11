import React, { useState, useEffect } from 'react';
import type { Client } from '../data/clients';
import { loadClients, getClients } from '../data/clients';

interface ClientDropdownProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function ClientDropdown({ value, onChange }: ClientDropdownProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeClients = async () => {
      try {
        setLoading(true);
        setError(null);
        await loadClients();
        const loadedClients = getClients();
        console.log('Loaded clients:', loadedClients);
        setClients(loadedClients);
      } catch (err) {
        console.error('Error initializing clients:', err);
        setError('Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    initializeClients();
  }, []);

  if (loading) {
    return (
      <select className="w-full px-2 py-1 rounded border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors">
        <option>Loading clients...</option>
      </select>
    );
  }

  if (error) {
    return (
      <select className="w-full px-2 py-1 rounded border border-red-200 focus:border-red-500 focus:ring-1 focus:ring-red-100 transition-colors">
        <option>Error loading clients</option>
      </select>
    );
  }

  return (
    <select
      className="w-full px-2 py-1 rounded border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors"
      value={value}
      onChange={onChange}
    >
      <option value="">Select Client...</option>
      {clients
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(client => (
          <option key={client.id} value={client.name}>
            {client.name}
          </option>
        ))}
    </select>
  );
}