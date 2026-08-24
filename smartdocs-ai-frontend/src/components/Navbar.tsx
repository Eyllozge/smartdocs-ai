import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Server, CheckCircle2, XCircle, LogIn, LogOut, User as UserIcon, Settings2, RefreshCw } from 'lucide-react';
import { User } from '../types';
import { getApiBaseUrl, api } from '../api/client';

interface NavbarProps {
  user: User | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenBackendConfig: () => void;
  onRefreshDocuments: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
  onLogout,
  onOpenBackendConfig,
  onRefreshDocuments,
}) => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const apiUrl = getApiBaseUrl();

  const checkStatus = async () => {
    setBackendStatus('checking');
    try {
      const res = await api.checkHealth();
      setBackendStatus(res.status === 'connected' ? 'connected' : 'disconnected');
    } catch {
      setBackendStatus('disconnected');
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-md shadow-indigo-100">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                SmartDocs <span className="text-indigo-600">AI</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                <Sparkles className="h-3 w-3" /> RAG Client
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              FastAPI Doküman & Soru-Cevap Arayüzü
            </p>
          </div>
        </div>

        {/* Center / Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Backend Status Pill */}
          <button
            id="btn-backend-status"
            onClick={onOpenBackendConfig}
            title="Backend bağlantı ayarlarını yapılandır"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:border-slate-300"
          >
            <Server className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden md:inline text-slate-500 font-mono">
              {apiUrl.replace(/^https?:\/\//, '')}
            </span>
            {backendStatus === 'connected' ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Bağlı</span>
              </span>
            ) : backendStatus === 'checking' ? (
              <span className="flex items-center gap-1 text-amber-600">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span className="hidden sm:inline">Kontrol...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-600">
                <XCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Çevrimdışı</span>
              </span>
            )}
            <Settings2 className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* User Auth Info */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-800">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[140px] truncate">{user.email}</span>
              </div>
              <button
                id="btn-logout"
                onClick={onLogout}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Çıkış Yap</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="btn-nav-login"
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:bg-indigo-800"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Giriş Yap</span>
              </button>
              <button
                id="btn-nav-register"
                onClick={() => onOpenAuth('register')}
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                <span>Kayıt Ol</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
