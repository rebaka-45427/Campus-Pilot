import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const SettingsContext = createContext();

const ACCENT_RGB_MAP = {
  purple: '147 51 234', // #9333EA
  blue: '37 99 235', // #2563EB
  green: '22 163 74', // #16A34A
  rose: '225 29 72', // #E11D48
  indigo: '79 70 229', // #4F46E5
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    theme: 'system',
    accent_color: 'purple',
    notifications: true,
    email_notifications: false,
    desktop_notifications: false,
    language: 'English',
    timezone: 'UTC'
  });
  const [loading, setLoading] = useState(true);

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings.theme]);

  // Apply Accent Color
  useEffect(() => {
    const root = window.document.documentElement;
    const rgb = ACCENT_RGB_MAP[settings.accent_color] || ACCENT_RGB_MAP.purple;
    root.style.setProperty('--color-primary', rgb);
  }, [settings.accent_color]);

  // Update Settings
  const updateSettings = async (newSettings) => {
    // Optimistic UI update
    setSettings(newSettings);
    try {
      await api.put('/settings', newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Revert on failure
      fetchSettings();
      throw error;
    }
  };

  const resetSettings = async () => {
    try {
      const res = await api.post('/settings/reset');
      setSettings(res.data);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, loading, refetchSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
