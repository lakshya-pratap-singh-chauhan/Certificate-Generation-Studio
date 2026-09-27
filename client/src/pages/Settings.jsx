import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { Save, Upload, Database, Scroll, ToggleLeft, ToggleRight, CheckCircle, FileText, UploadCloud, ShieldAlert, Award, RefreshCw } from 'lucide-react';

export default function Settings() {
  const toast = useToast();
  const [settings, setSettings] = useState({
    company_name: 'Ston Technology',
    ceo_signature_path: '',
    company_logo_path: '',
    next_intern_id: 2001,
    enable_draft_watermark: 0,
    verification_base_url: 'http://localhost:5173/verify',
  });

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  // File Upload states
  const [logoFile, setLogoFile] = useState(null);
  const [sigFile, setSigFile] = useState(null);
  const [fontFile, setFontFile] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);
  const [templateType, setTemplateType] = useState('offer_letter');

  useEffect(() => {
    fetchSettings();
    fetchAuditLogs();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        toast.error('Failed to load settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Connection error, settings unavailable');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/audit-logs');
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: name === 'next_intern_id' ? parseInt(value) || 0 : value
    }));
  };

  const handleToggleWatermark = async () => {
    const newVal = settings.enable_draft_watermark === 1 ? 0 : 1;
    setSettings((prev) => ({ ...prev, enable_draft_watermark: newVal }));
    try {
      const response = await fetch('http://localhost:5000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable_draft_watermark: newVal })
      });
      if (response.ok) {
        toast.success(`Draft Watermark ${newVal === 1 ? 'ENABLED' : 'DISABLED'}`);
        fetchAuditLogs();
      } else {
        toast.error('Failed to toggle watermark');
        // revert
        setSettings((prev) => ({ ...prev, enable_draft_watermark: settings.enable_draft_watermark }));
      }
    } catch (err) {
      toast.error('Network error toggling watermark');
      setSettings((prev) => ({ ...prev, enable_draft_watermark: settings.enable_draft_watermark }));
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: settings.company_name,
          next_intern_id: settings.next_intern_id,
          verification_base_url: settings.verification_base_url
        })
      });

      if (response.ok) {
        toast.success('Company settings saved successfully!');
        fetchAuditLogs();
      } else {
        toast.error('Failed to save company settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Network error saving settings');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleFileUpload = async (fieldname, file, additionalBody = {}) => {
    if (!file) {
      toast.error(`Please select a ${fieldname} file first`);
      return;
    }

    toast.info(`Uploading ${fieldname}...`);
    try {
      const formData = new FormData();
      formData.append(fieldname, file);

      Object.entries(additionalBody).forEach(([key, val]) => {
        formData.append(key, val);
      });

      const response = await fetch('http://localhost:5000/api/settings/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast.success(`${fieldname.toUpperCase()} uploaded successfully!`);

        // Reset states
        if (fieldname === 'logo') setLogoFile(null);
        if (fieldname === 'signature') setSigFile(null);
        if (fieldname === 'font') setFontFile(null);
        if (fieldname === 'template') setTemplateFile(null);

        fetchSettings();
        fetchAuditLogs();
      } else {
        toast.error(`Failed to upload ${fieldname}`);
      }
    } catch (error) {
      console.error(`File upload error:`, error);
      toast.error(`Connection error uploading ${fieldname}`);
    }
  };

  const handleRemoveTemplate = async () => {
    toast.info(`Removing custom template...`);
    try {
      const response = await fetch(`http://localhost:5000/api/settings/template/${templateType}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success(`Custom template removed successfully!`);
        fetchSettings();
        fetchAuditLogs();
      } else {
        toast.error(`Failed to remove template`);
      }
    } catch (error) {
      console.error(`Template remove error:`, error);
      toast.error(`Connection error removing template`);
    }
  };

  const handleBackupNow = async () => {
    setBackupLoading(true);
    toast.info('Initiating database backup...');
    try {
      const response = await fetch('http://localhost:5000/api/backup', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        toast.success(`Backup saved successfully as ${data.file}!`);
        fetchAuditLogs();
      } else {
        toast.error('Failed to create database backup');
      }
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Connection error during backup');
    } finally {
      setBackupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 gap-2.5">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-400 font-medium">Loading settings panel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">
          Admin Settings
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage system configurations, template overrides, CE signatures, watermark status, and database backups.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Form Settings (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">

          {/* Company Settings Form */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
            <h3 className="text-md font-bold text-slate-800 dark:text-white font-sans border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Company & System Profile
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={settings.company_name}
                  onChange={handleChange}
                  className="w-full px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Verification Portal Link Base
                </label>
                <input
                  type="text"
                  name="verification_base_url"
                  value={settings.verification_base_url}
                  onChange={handleChange}
                  className="w-full px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Starting Intern ID Counter (e.g. 2001)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    name="next_intern_id"
                    value={settings.next_intern_id}
                    onChange={handleChange}
                    className="w-32 px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold"
                    min="1000"
                    required
                  />
                  <span className="text-xs text-slate-450 dark:text-slate-500">
                    Changing this updates the sequence of the next generated document ID.
                  </span>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-1.5 px-5 rounded-xl cursor-pointer shadow-md shadow-blue-500/10 transition-all"
                >
                  {saveLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Configurations
                </button>
              </div>
            </form>
          </div>

          {/* Watermark Feature Toggle */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between">
            <div className="space-y-1 pr-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Enable Draft Watermark
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                When enabled, every generated document PDF will include a diagonal, semi-transparent <strong>DRAFT</strong> watermark text overlaid across every page at 12% opacity.
              </p>
            </div>
            <button
              onClick={handleToggleWatermark}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {settings.enable_draft_watermark === 1 ? (
                <ToggleRight className="w-14 h-10 text-blue-600 dark:text-blue-500" />
              ) : (
                <ToggleLeft className="w-14 h-10 text-slate-350 dark:text-slate-700" />
              )}
            </button>
          </div>

          {/* Logo & Signature Assets Upload */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* CEO Signature Upload */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                CEO Signature File
              </h3>
              {settings.ceo_signature_path ? (
                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/50 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
                    {settings.ceo_signature_path.split('/').pop()}
                  </span>
                  <span className="text-[10px] uppercase font-extrabold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">Active</span>
                </div>
              ) : (
                <p className="text-xs text-rose-500 font-medium">No CEO signature file uploaded yet.</p>
              )}

              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  id="sig-file"
                  className="hidden"
                  onChange={(e) => setSigFile(e.target.files[0])}
                />
                <label
                  htmlFor="sig-file"
                  className="flex-1 text-center border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  {sigFile ? sigFile.name : 'Select Signature'}
                </label>
                <button
                  onClick={() => handleFileUpload('signature', sigFile)}
                  disabled={!sigFile}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Company Logo Upload */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Company Logo File
              </h3>
              {settings.company_logo_path ? (
                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/50 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
                    {settings.company_logo_path.split('/').pop()}
                  </span>
                  <span className="text-[10px] uppercase font-extrabold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">Active</span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500">No logo file uploaded yet (using default).</p>
              )}

              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  id="logo-file"
                  className="hidden"
                  onChange={(e) => setLogoFile(e.target.files[0])}
                />
                <label
                  htmlFor="logo-file"
                  className="flex-1 text-center border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  {logoFile ? logoFile.name : 'Select Logo'}
                </label>
                <button
                  onClick={() => handleFileUpload('logo', logoFile)}
                  disabled={!logoFile}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Upload
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Template Files, DB Backups, Logs (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">

          {/* Template Replacements & Fonts */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-500" />
              Template Overrides & Fonts
            </h3>

            {/* Custom Template Upload */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                Override Document Design Template
              </label>
              <div className="flex gap-2">
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300"
                >
                  <option value="offer_letter">Offer Letter</option>
                  <option value="certificate">Certificate</option>
                </select>
                <input
                  type="file"
                  accept=".pdf, .png, .jpg, .jpeg"
                  id="template-file"
                  className="hidden"
                  onChange={(e) => setTemplateFile(e.target.files[0])}
                />
                <label
                  htmlFor="template-file"
                  className="flex-1 text-center border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {templateFile ? templateFile.name : 'Select Template'}
                </label>
                <button
                  onClick={() => handleFileUpload('template', templateFile, { type: templateType })}
                  disabled={!templateFile}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Upload
                </button>
              </div>
              {settings[`${templateType}_template`] && (
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg mt-2 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 font-medium">Custom {templateType.replace('_', ' ')} template is active.</span>
                  <button
                    onClick={handleRemoveTemplate}
                    className="text-xs bg-rose-100 hover:bg-rose-200 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 font-semibold px-2 py-1 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Custom Font Upload */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
              <label className="block text-xs font-semibold text-slate-400 dark:text-slate-555 uppercase tracking-wider">
                Upload Custom Font (.ttf / .otf)
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".ttf, .otf"
                  id="font-file"
                  className="hidden"
                  onChange={(e) => setFontFile(e.target.files[0])}
                />
                <label
                  htmlFor="font-file"
                  className="flex-1 text-center border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {fontFile ? fontFile.name : 'Select Font File'}
                </label>
                <button
                  onClick={() => handleFileUpload('font', fontFile)}
                  disabled={!fontFile}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Upload
                </button>
              </div>
            </div>

          </div>

          {/* Database Backup & Restore */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-500" />
              Database Backups
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              SQLite is backed up automatically once daily. Trigger a manual copy instantly below. File saved in <code>database/backups/</code> folder.
            </p>
            <button
              onClick={handleBackupNow}
              disabled={backupLoading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 text-white py-1.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 cursor-pointer transition-all"
            >
              {backupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Backup Database Now
            </button>
          </div>

          {/* Audit Logs list */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
              <span className="flex items-center gap-2">
                <Scroll className="w-5 h-5 text-amber-500" />
                Audit Logs
              </span>
              <button
                onClick={fetchAuditLogs}
                className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold uppercase"
              >
                Refresh
              </button>
            </h3>

            <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 font-sans text-xs">
              {auditLogs.length === 0 ? (
                <p className="text-center text-slate-400 dark:text-slate-500 py-6">No audit records found.</p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-slate-100/50 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30 space-y-1 text-slate-600 dark:text-slate-350 hover:border-slate-200 dark:hover:border-slate-800 transition-all"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <span>{log.action}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="leading-relaxed text-slate-800 dark:text-slate-200 text-xs font-semibold">
                      {log.details}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
