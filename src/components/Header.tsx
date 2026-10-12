import React from 'react';
import { User } from 'firebase/auth';
import { SheetConfig } from '../services/googleSheets';
import { FileSpreadsheet, CheckCircle2, AlertCircle, LogOut, ExternalLink, BarChart3, ClipboardList, Settings, Sparkles } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  sheetConfig: SheetConfig | null;
  onOpenConfig: () => void;
  currentView: 'survey' | 'dashboard' | 'config';
  onViewChange: (view: 'survey' | 'dashboard' | 'config') => void;
  totalResponsesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onSignIn,
  onSignOut,
  sheetConfig,
  onOpenConfig,
  currentView,
  onViewChange,
  totalResponsesCount,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                  Encuesta de Hábitos y Procrastinación
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-3 h-3 mr-1" /> 28 Preguntas
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Instrumento académico sincronizado en tiempo real con Google Sheets
              </p>
            </div>
          </div>

          {/* Right Section: Navigation Tabs & Google Auth */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher Tabs */}
            <nav className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => onViewChange('survey')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  currentView === 'survey'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Encuesta</span>
              </button>

              <button
                type="button"
                onClick={() => onViewChange('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Respuestas</span>
                {totalResponsesCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-900 text-emerald-300 font-bold text-[10px]">
                    {totalResponsesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onViewChange('config')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  currentView === 'config'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Google Sheets</span>
              </button>
            </nav>

            {/* Google Sheets Pill / Shortcut */}
            {sheetConfig ? (
              <a
                href={sheetConfig.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs hover:bg-emerald-900/40 transition-colors"
                title="Abrir hoja de cálculo vinculada en Google Sheets"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[130px] truncate font-medium">
                  {sheetConfig.sheetTitle || 'Hoja vinculada'}
                </span>
                <ExternalLink className="w-3 h-3 text-emerald-400" />
              </a>
            ) : (
              <button
                type="button"
                onClick={onOpenConfig}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-300 text-xs hover:bg-amber-900/40 transition-colors"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Sin Hoja vinculada</span>
              </button>
            )}

            {/* Google User Sign-In Button or Profile Pill */}
            {user ? (
              <div className="flex items-center gap-2 bg-slate-800/80 pl-2 pr-1 py-1 rounded-xl border border-slate-700/60">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="w-6 h-6 rounded-full border border-slate-600"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {user.email ? user.email.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-xs text-slate-300 hidden sm:inline max-w-[120px] truncate">
                  {user.displayName || user.email}
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  title="Cerrar sesión de Google"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl font-medium text-xs shadow-sm transition-all border border-slate-200 active:scale-95 cursor-pointer"
              >
                {/* Official Google 'G' Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Acceder con Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
