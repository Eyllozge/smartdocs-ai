import React, { useState } from 'react';
import { X, Server, CheckCircle2, AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, resetApiBaseUrl, DEFAULT_API_BASE, api } from '../api/client';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
}) => {
  const [urlInput, setUrlInput] = useState(getApiBaseUrl());
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [copiedCors, setCopiedCors] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiBaseUrl(urlInput);
    onConfigChanged();
    onClose();
  };

  const handleReset = () => {
    resetApiBaseUrl();
    setUrlInput(DEFAULT_API_BASE);
    onConfigChanged();
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('');
    setApiBaseUrl(urlInput);
    try {
      const res = await api.checkHealth();
      if (res.status === 'connected') {
        setTestStatus('success');
        setTestMessage(`Sunucu ile bağlantı başarılı (${urlInput})`);
      } else {
        setTestStatus('error');
        setTestMessage(`Sunucuya erişilemedi. ${urlInput} adresinde backend servisinin çalıştığından emin olun.`);
      }
    } catch (err: unknown) {
      setTestStatus('error');
      setTestMessage(err instanceof Error ? err.message : 'Bağlantı hatası');
    }
  };

  const corsCodeSnippet = `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Frontend erişimi için CORS ayarı
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)`;

  const handleCopyCors = () => {
    navigator.clipboard.writeText(corsCodeSnippet);
    setCopiedCors(true);
    setTimeout(() => setCopiedCors(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Sunucu Bağlantı Ayarları</h3>
              <p className="text-xs text-slate-500">FastAPI API sunucu adresi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Backend API URL Adresi
            </label>
            <div className="flex gap-2">
              <input
                id="input-backend-url"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono text-slate-800 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
              <button
                type="button"
                id="btn-test-connection"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                <span>Test Et</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Varsayılan adres: <code className="font-mono text-slate-700">{DEFAULT_API_BASE}</code>
            </p>
          </div>

          {/* Test Status Feedback */}
          {testStatus === 'success' && (
            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{testMessage}</span>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="space-y-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{testMessage}</p>
                  <p className="text-[11px] text-amber-700">
                    FastAPI uygulamanızda CORS middleware yapılandırmasının açık olduğundan emin olun:
                  </p>
                </div>
              </div>

              <div className="relative rounded-lg bg-slate-900 p-2.5 font-mono text-[10px] text-slate-200 overflow-x-auto">
                <pre>{corsCodeSnippet}</pre>
                <button
                  onClick={handleCopyCors}
                  className="absolute top-2 right-2 flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-700 transition"
                >
                  {copiedCors ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedCors ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            Varsayılana Dön
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-xs"
            >
              Kaydet ve Uygula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
