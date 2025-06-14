import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AppSettings {
  appName: string;
}

interface AppSettingsContextType {
  settings: AppSettings;
  isLoading: boolean;
}

const AppSettingsContext = createContext<AppSettingsContextType>({
  settings: { appName: '' },
  isLoading: true
});

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({ appName: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/content/home-content');
        if (!response.ok) throw new Error('Failed to fetch content');
        const data = await response.json();
        setSettings({ appName: data?.appSettings?.appName || 'Brownie' });
      } catch (error) {
        console.error('Error fetching app settings:', error);
        setSettings({ appName: 'Brownie' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return (
    <AppSettingsContext.Provider value={{ settings, isLoading }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export const useAppSettings = () => useContext(AppSettingsContext);
