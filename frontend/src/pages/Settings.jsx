import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Palette, Bell, Moon, Sun, Monitor, Globe, Clock,
  RotateCcw, Download, Upload, Trash2
} from 'lucide-react';
import { KEYS, getList, getItem, setItem } from '../utils/storage';
import { resetToDefaults } from '../utils/defaults';
import { useSettings } from '../contexts/SettingsContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';

const ACCENT_COLORS = [
  { name: 'purple', value: 'purple', bg: 'bg-purple-500' },
  { name: 'blue', value: 'blue', bg: 'bg-blue-500' },
  { name: 'green', value: 'green', bg: 'bg-green-500' },
  { name: 'rose', value: 'rose', bg: 'bg-rose-500' },
  { name: 'indigo', value: 'indigo', bg: 'bg-indigo-500' },
];

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Hindi', value: 'hi' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Asia/Kolkata',
  'Asia/Tokyo',
];

export default function Settings() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings || {});
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key) => {
    setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset ALL application data to defaults? This cannot be undone.'
    );
    if (!confirmed) return;
    setIsResetting(true);
    try {
      resetToDefaults();
      resetSettings();
      toast.success('Application has been reset successfully.');
      setTimeout(() => window.location.reload(), 500);
    } catch {
      toast.error('Reset failed');
      setIsResetting(false);
    }
  };

  const handleExport = () => {
    try {
      const data = {
        tasks: getList(KEYS.tasks),
        assignments: getList(KEYS.assignments),
        subjects: getList(KEYS.subjects),
        notes: getList(KEYS.notes),
        timetable: getList(KEYS.timetable),
        settings: getItem(KEYS.settings, {}),
        profile: getItem(KEYS.profile, {}),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campuspilot_backup_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleImport = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
          toast.error('Invalid backup file');
          return;
        }
        if (parsed.tasks) setItem(KEYS.tasks, parsed.tasks);
        if (parsed.assignments) setItem(KEYS.assignments, parsed.assignments);
        if (parsed.subjects) setItem(KEYS.subjects, parsed.subjects);
        if (parsed.notes) setItem(KEYS.notes, parsed.notes);
        if (parsed.timetable) setItem(KEYS.timetable, parsed.timetable);
        if (parsed.settings) setItem(KEYS.settings, parsed.settings);
        if (parsed.profile) setItem(KEYS.profile, parsed.profile);
        toast.success('Data imported successfully');
        setTimeout(() => window.location.reload(), 500);
      } catch {
        toast.error('Invalid backup file');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1 text-sm">Manage your preferences and account settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleReset}
            disabled={isResetting}
            variant="ghost"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-800/40"
          >
            {isResetting ? <Loader size="sm" /> : <RotateCcw className="w-4 h-4" />}
            <span className="ml-1.5">Reset</span>
          </Button>
          <Button onClick={handleSave} disabled={isSaving} variant="primary">
            {isSaving ? <Loader size="sm" /> : null}
            <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      {/* Appearance Card */}
      <Card className="p-5 space-y-5">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-400" /> Appearance
        </h2>

        {/* Theme */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Theme</label>
          <div className="flex gap-2">
            {[
              { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
              { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
              { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => handleChange('theme', opt.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${localSettings.theme === opt.value
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-gray-700/60 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Accent Color</label>
          <div className="flex gap-3">
            {ACCENT_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() => handleChange('accentColor', color.value)}
                title={color.name}
                className={`w-8 h-8 rounded-full ${color.bg} transition-all
                  ${localSettings.accentColor === color.value
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Notifications Card */}
      <Card className="p-5 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-400" /> Notifications
        </h2>
        {[
          { key: 'notifications', label: 'Enable Notifications', desc: 'Receive in-app notifications' },
          { key: 'emailNotifications', label: 'Email Notifications', desc: 'Get notified via email' },
          { key: 'desktopNotifications', label: 'Desktop Notifications', desc: 'Browser push notifications' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm text-white font-medium">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
            <button
              onClick={() => handleToggle(key)}
              className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none
                ${localSettings[key] ? 'bg-purple-600' : 'bg-gray-600'}`}
              role="switch"
              aria-checked={!!localSettings[key]}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                  ${localSettings[key] ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        ))}
      </Card>

      {/* Localization Card */}
      <Card className="p-5 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-purple-400" /> Localization
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Language
            </label>
            <select
              value={localSettings.language || 'en'}
              onChange={e => handleChange('language', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Timezone
            </label>
            <select
              value={localSettings.timezone || 'UTC'}
              onChange={e => handleChange('timezone', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Data Management Card */}
      <Card className="p-5 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Download className="w-4 h-4 text-purple-400" /> Data Management
        </h2>
        <p className="text-gray-400 text-sm">
          Export your data as a backup or import a previous backup. Reset will wipe all app data.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white
              rounded-lg text-sm font-medium transition-colors border border-gray-600"
          >
            <Download className="w-4 h-4 text-green-400" />
            Export Data
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white
              rounded-lg text-sm font-medium transition-colors border border-gray-600"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            Import Data
          </button>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400
              hover:text-red-300 rounded-lg text-sm font-medium transition-colors border border-red-800/50"
          >
            <Trash2 className="w-4 h-4" />
            Reset All Data
          </button>
        </div>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
