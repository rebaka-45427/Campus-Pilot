import React, { useState, useEffect } from 'react';
import { Palette, Bell, Moon, Sun, Monitor, Globe, Clock, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import { useSettings } from '../contexts/SettingsContext';

const ACCENT_COLORS = [
  { name: 'Purple', value: 'purple', class: 'bg-purple-600' },
  { name: 'Blue', value: 'blue', class: 'bg-blue-600' },
  { name: 'Green', value: 'green', class: 'bg-green-600' },
  { name: 'Rose', value: 'rose', class: 'bg-rose-600' },
  { name: 'Indigo', value: 'indigo', class: 'bg-indigo-600' },
];

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Hindi'];
const TIMEZONES = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'];

export default function Settings() {
  const { settings: globalSettings, updateSettings, resetSettings, loading } = useSettings();
  const [localSettings, setLocalSettings] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (globalSettings) {
      setLocalSettings(globalSettings);
    }
  }, [globalSettings]);

  const handleSave = async () => {
    if (!localSettings) return;
    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all settings to their default values?")) return;
    setIsResetting(true);
    try {
      await resetSettings();
      toast.success('Settings reset to defaults');
    } catch (error) {
      toast.error('Failed to reset settings');
    } finally {
      setIsResetting(false);
    }
  };

  if (loading || !localSettings) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-4xl mx-auto">
      
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-500 mt-1">Customize your operating system experience.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleReset} disabled={isResetting || isSaving} className="text-gray-600">
            <RotateCcw size={18} className="mr-2" /> Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isResetting}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Appearance */}
        <Card>
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
            <div className="p-2 bg-gray-100 text-gray-700 rounded-lg"><Palette size={20} /></div>
            <h3 className="text-lg font-bold text-gray-900">Appearance</h3>
          </div>

          <div className="space-y-8">
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-3">Theme Preference</h4>
              <div className="flex gap-4">
                {[
                  { id: 'light', icon: Sun, label: 'Light' },
                  { id: 'dark', icon: Moon, label: 'Dark' },
                  { id: 'system', icon: Monitor, label: 'System' }
                ].map(themeOpt => (
                  <button 
                    key={themeOpt.id}
                    onClick={() => setLocalSettings({...localSettings, theme: themeOpt.id})}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${localSettings.theme === themeOpt.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:border-primary/50 text-gray-600'}`}
                  >
                    <themeOpt.icon size={24} className="mb-2" />
                    <span className="text-sm font-medium">{themeOpt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-3">Accent Color</h4>
              <div className="flex gap-3">
                {ACCENT_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setLocalSettings({...localSettings, accent_color: color.value})}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${color.class} ${localSettings.accent_color === color.value ? 'ring-4 ring-offset-2 ring-gray-900 scale-110 shadow-lg' : 'hover:scale-110'}`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
            <div className="p-2 bg-gray-100 text-gray-700 rounded-lg"><Bell size={20} /></div>
            <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Enable Push Notifications</h4>
                <p className="text-sm text-gray-500 mt-1">Receive in-app alerts for tasks and schedules.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={localSettings.notifications} onChange={e => setLocalSettings({...localSettings, notifications: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-500 mt-1">Receive daily summary emails.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={localSettings.email_notifications} onChange={e => setLocalSettings({...localSettings, email_notifications: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Desktop Notifications</h4>
                <p className="text-sm text-gray-500 mt-1">Show native OS notifications.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={localSettings.desktop_notifications} onChange={e => setLocalSettings({...localSettings, desktop_notifications: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Localization */}
        <Card>
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
            <div className="p-2 bg-gray-100 text-gray-700 rounded-lg"><Globe size={20} /></div>
            <h3 className="text-lg font-bold text-gray-900">Localization</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Display Language</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select 
                  value={localSettings.language} 
                  onChange={e => setLocalSettings({...localSettings, language: e.target.value})} 
                  className="w-full pl-10 pr-4 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Timezone</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select 
                  value={localSettings.timezone} 
                  onChange={e => setLocalSettings({...localSettings, timezone: e.target.value})} 
                  className="w-full pl-10 pr-4 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
