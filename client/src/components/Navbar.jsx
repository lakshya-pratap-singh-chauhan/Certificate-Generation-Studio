import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, Settings, Sun, Moon, FileText, Award } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generate-offer', label: 'Generate Offer Letter', icon: FileText },
    { id: 'generate-cert', label: 'Generate Certificate', icon: Award },
    { id: 'settings', label: 'Admin Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/50 dark:border-slate-800/50 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
        <div className="w-10 h-10 flex items-center justify-center">
          <img src="/logo.png" alt="Ston Technology" className="w-full h-full object-contain drop-shadow-md" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-white font-sans bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
            Ston Technology
          </h1>
          <p className="text-[10px] font-medium tracking-widest text-blue-600 dark:text-blue-400 uppercase">
            Doc Generator
          </p>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-600" />}
        </button>

        {/* Small Screen Nav Trigger */}
        <div className="md:hidden flex gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                title={item.label}
              >
                <Icon className="w-4.5 h-4.5" />
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
