'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  [key: string]: unknown; // Allow any key-value pair in settings
}

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch settings');
        }
        const data = await response.json();
        setSettings(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, error }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
