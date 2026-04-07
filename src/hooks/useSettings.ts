import {useState, useEffect} from 'react';
import {AppSettings, onSettings} from '../services/mockData';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const unsubscribe = onSettings(s => setSettings(s));
    return unsubscribe;
  }, []);

  return settings;
}
