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
    // Temporarily test the entered URL
    const original = getApiBaseUrl();
    setApiBaseUrl(urlInput);
    try {
      const res = await api.checkHealth();
      if (res.status === 'connected') {
        setTestStatus('success');
        setTestMessage(`FastAPI backend ile bağlantı kuruldu (${urlInput})`);
      } else {
        setTestStatus('error');
        setTestMessage(`Sunucuya erişilemedi. ${urlInput} adresinde FastAPI sunucusunun çalıştığından emin olun.`);
      }
    } catch (err: unknown) {
      setTestStatus('error');
      setTestMessage(err instanceof Error ? err.message : 'Bağlantı hatası');
    } finally {
      // restore until save clicked
      setApiBaseUrl(urlInput);
    }
  };

  const corsCodeSnippet = `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Frontend'in API'ye erişebilmesi için CORS ayarı
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # veya frontend URL'iniz
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Backend Bağlantı Ayarları</h3>
              <p className="text-xs text-slate-500">FastAPI sunucu adresini yapılandırın</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              FastAPI API Base URL
            </label>
            <div className="flex gap-2">
              <input
                id="input-backend-url"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                id="btn-test-connection"
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
              >
                {testStatus === 'testing' ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                    <span>Test ediliyor...</span>
                  </>
                ) : (
                  <span>Test Et</span>
                )}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Varsayılan: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{DEFAULT_API_BASE}</code> (veya .env içindeki <code className="bg-slate-100 px-1 py-0.5 rounded">VITE_API_BASE_URL</code>)
            </p>
          </div>

          {/* Test Status Banner */}
          {testStatus === 'success' && (
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Bağlantı Başarılı!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">{testMessage}</p>
              </div>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Bağlantı Kurulamadı</p>
                <p className="text-[11px] text-rose-700 mt-0.5">{testMessage}</p>
              </div>
            </div>
          )}

          {/* FastAPI CORS Tip */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                FastAPI CORS Gereksinimi
              </span>
              <button
                onClick={handleCopyCors}
                className="flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200 hover:bg-slate-100"
              >
                {copiedCors ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copiedCors ? 'Kopyalandı' : 'Kodu Kopyala'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Frontend'in tarayıcıdan <code className="text-indigo-600">localhost:8000</code>'e sorunsuz istek atabilmesi için FastAPI'de CORS middleware ekli olmalıdır:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-2.5 text-[11px] font-mono text-emerald-400">
              {corsCodeSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            Varsayılana Sıfırla
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
              id="btn-save-backend-url"
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Kaydet ve Uygula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
