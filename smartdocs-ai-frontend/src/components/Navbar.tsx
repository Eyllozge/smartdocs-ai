import React from 'react';
import { FileText, LogOut, Settings2 } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenBackendConfig: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenBackendConfig,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Professional Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">
                SmartDocs AI
              </span>
              <span className="text-slate-300 font-light">|</span>
              <span className="text-xs font-medium text-slate-600">
                Profesyonel Belge Analizi
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Subtle settings button without "localhost:8000 bağlı" text */}
          <button
            id="btn-backend-settings-nav"
            onClick={onOpenBackendConfig}
            title="Sunucu Bağlantı Ayarları"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sunucu</span>
          </button>

          {/* User Info & Logout */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-800">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[160px] truncate">{user.email}</span>
              </div>
              <button
                id="btn-logout"
                onClick={onLogout}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-500" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
