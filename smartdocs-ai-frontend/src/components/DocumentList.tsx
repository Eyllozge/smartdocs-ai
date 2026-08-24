import React, { useState } from 'react';
import { FileText, RefreshCw, Layers, MessageSquare, Search, AlertCircle, CheckCircle2, Clock, FileQuestion, ChevronRight } from 'lucide-react';
import { DocumentItem } from '../types';

interface DocumentListProps {
  documents: DocumentItem[];
  selectedDoc: DocumentItem | null;
  isLoading: boolean;
  onSelectDoc: (doc: DocumentItem) => void;
  onViewChunks: (doc: DocumentItem) => void;
  onRefresh: () => void;
  onRequireAuth: () => void;
  isAuthenticated: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDoc,
  isLoading,
  onSelectDoc,
  onViewChunks,
  onRefresh,
  onRequireAuth,
  isAuthenticated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = documents.filter((doc) =>
    (doc.filename || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'chunked' || s === 'ready' || s === 'processed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-3 w-3" />
          Hazır
        </span>
      );
    }
    if (s === 'processing' || s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
          <Clock className="h-3 w-3 animate-spin" />
          İşleniyor
        </span>
      );
    }
    if (s === 'failed' || s === 'error') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
          <AlertCircle className="h-3 w-3" />
          Hata
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
        {status || 'Yüklendi'}
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Yüklenen Dokümanlar</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {documents.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              FastAPI <code className="bg-slate-100 px-1 py-0.2 rounded font-mono">/documents/</code> listesi
            </p>
          </div>
        </div>

        <button
          id="btn-refresh-docs"
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Doküman listesini yenile"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">Yenile</span>
        </button>
      </div>

      {/* Search Filter */}
      {documents.length > 0 && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            id="input-search-docs"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Doküman adı ile filtrele..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      )}

      {/* Documents List */}
      {!isAuthenticated ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
          <FileQuestion className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-xs font-semibold text-slate-700">Dokümanları Görmek İçin Giriş Yapın</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
            Backend doküman listesi için Authorization Bearer token gereklidir.
          </p>
          <button
            onClick={onRequireAuth}
            className="mt-3 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            Giriş Yap
          </button>
        </div>
      ) : isLoading && documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs font-medium text-slate-600">Dokümanlar yükleniyor...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-xs font-semibold text-slate-700">
            {searchQuery ? 'Aramanıza uygun doküman bulunamadı' : 'Henüz yüklenmiş doküman yok'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {searchQuery
              ? 'Farklı bir arama terimi deneyin.'
              : 'Yukarıdaki alandan ilk PDF dokümanınızı yükleyerek başlayın.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
          {filteredDocs.map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <div
                key={String(doc.id)}
                className={`group rounded-xl border p-3 transition ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-200/60'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() => onSelectDoc(doc)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 font-bold text-[10px]">
                        PDF
                      </div>
                      <p
                        className={`text-xs font-semibold truncate ${
                          isSelected ? 'text-indigo-950' : 'text-slate-900'
                        }`}
                        title={doc.filename}
                      >
                        {doc.filename}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      {getStatusBadge(doc.status)}

                      {doc.chunk_count !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 border border-indigo-100">
                          <Layers className="h-3 w-3" />
                          {doc.chunk_count} parça
                        </span>
                      )}

                      <span className="text-[10px] text-slate-400 font-mono">
                        ID: {doc.id}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      id={`btn-chat-doc-${doc.id}`}
                      type="button"
                      onClick={() => onSelectDoc(doc)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                      }`}
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>{isSelected ? 'Seçildi' : 'Sohbet Et'}</span>
                    </button>

                    <button
                      id={`btn-chunks-doc-${doc.id}`}
                      type="button"
                      onClick={() => onViewChunks(doc)}
                      className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 transition"
                      title="Parçaları (chunks) görüntüle"
                    >
                      <Layers className="h-3 w-3" />
                      <span>Parçaları Gör</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
