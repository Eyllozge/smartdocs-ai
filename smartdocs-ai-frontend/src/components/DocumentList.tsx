import React, { useState } from 'react';
import { FileText, RefreshCw, Layers, MessageSquare, Search, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
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
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = documents.filter((doc) =>
    (doc.filename || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'chunked' || s === 'ready' || s === 'processed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" />
          Hazır
        </span>
      );
    }
    if (s === 'processing' || s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
          <Clock className="h-3 w-3 animate-spin" />
          İşleniyor
        </span>
      );
    }
    if (s === 'failed' || s === 'error') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 border border-rose-200">
          <AlertCircle className="h-3 w-3" />
          Hata
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
        {status || 'Yüklendi'}
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Belgelerim</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.2 text-xs font-semibold text-slate-600">
                {documents.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Analiz edilebilir dokümanlar
            </p>
          </div>
        </div>

        <button
          id="btn-refresh-docs"
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Listeyi yenile"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-slate-900' : 'text-slate-500'}`} />
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
            placeholder="Belge adı ile ara..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      )}

      {/* Documents List */}
      {isLoading && documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-700 mb-2" />
          <p className="text-xs text-slate-600">Belgeler yükleniyor...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <FileText className="mx-auto h-7 w-7 text-slate-400 mb-2" />
          <p className="text-xs font-semibold text-slate-700">
            {searchQuery ? 'Aramanıza uygun belge bulunamadı' : 'Henüz yüklenmiş belge yok'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {searchQuery
              ? 'Farklı bir arama terimi deneyin.'
              : 'Yukarıdaki alandan PDF yükleyerek analize başlayabilirsiniz.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-0.5">
          {filteredDocs.map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <div
                key={String(doc.id)}
                className={`rounded-xl border p-3 transition ${
                  isSelected
                    ? 'border-slate-800 bg-slate-50/90 shadow-xs ring-1 ring-slate-800'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() => onSelectDoc(doc)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white font-semibold text-[10px]">
                        PDF
                      </div>
                      <p
                        className="text-xs font-semibold text-slate-900 truncate"
                        title={doc.filename}
                      >
                        {doc.filename}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      {getStatusBadge(doc.status)}

                      {doc.chunk_count !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
                          <Layers className="h-3 w-3 text-slate-500" />
                          {doc.chunk_count} parça
                        </span>
                      )}
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
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>{isSelected ? 'Seçildi' : 'Soru Sor'}</span>
                    </button>

                    <button
                      id={`btn-chunks-doc-${doc.id}`}
                      type="button"
                      onClick={() => onViewChunks(doc)}
                      className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 transition"
                      title="Parçaları incele"
                    >
                      <Layers className="h-3 w-3" />
                      <span>Parçalar</span>
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
