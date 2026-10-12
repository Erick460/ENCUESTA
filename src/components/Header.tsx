import React from 'react';
import { User } from 'firebase/auth';
import { SheetConfig } from '../services/googleSheets';
import {
  FileSpreadsheet,
  BarChart3,
  ClipboardList,
  Settings,
  GraduationCap,
  Shield,
  CheckCircle2,
} from 'lucide-react';

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
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-3">
          {/* Logo & Academic Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 tracking-tight leading-tight">
                Cuestionario de Hábitos de Estudio
              </h1>
              <p className="text-[11px] text-slate-400">
                Investigación Académica sobre Procrastinación Universitaria
              </p>
            </div>
          </div>

          {/* Navigation & Admin Access */}
          <div className="flex items-center gap-2">
            {/* View Mode Navigation */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => onViewChange('survey')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  currentView === 'survey'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Encuesta</span>
              </button>

              <button
                type="button"
                onClick={() => onViewChange('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Resultados</span>
                {totalResponsesCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-900 text-emerald-400 font-bold text-[10px]">
                    {totalResponsesCount}
                  </span>
                )}
              </button>
            </div>

            {/* Discreet Admin / Google Sheet Setup button */}
            <button
              type="button"
              onClick={onOpenConfig}
              title="Panel de Configuración de Google Sheets"
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                sheetConfig
                  ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50'
                  : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              {sheetConfig && (
                <span className="hidden md:inline text-[11px] font-medium text-emerald-300">
                  Google Sheet Conectado
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
