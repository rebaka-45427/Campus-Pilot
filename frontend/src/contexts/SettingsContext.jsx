import React, { createContext, useState, useEffect, useContext } from 'react';
import { KEYS, getItem, setItem } from '../utils/storage';
import { DEFAULT_SETTINGS } from '../utils/defaults';

const SettingsContext = createContext();

const ACCENT_RGB_MAP = {
  purple: '147 51 234',
  blue:   '37 99 235',
  green:  '22 163 74',
  rose:   '225 29 72',
  indigo: '79 70 229',
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    return getItem(KEYS.settings, DEFAULT_SETTINGS);
  });

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

  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    setItem(KEYS.settings, merged);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setItem(KEYS.settings, DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, loading: false }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
