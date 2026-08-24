import React, { useState, useEffect } from 'react';
import { X, Layers, Copy, Check, Search, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { DocumentItem, DocumentChunk } from '../types';
import { api } from '../api/client';

interface ChunksViewerModalProps {
  isOpen: boolean;
  doc: DocumentItem | null;
  onClose: () => void;
}

export const ChunksViewerModal: React.FC<ChunksViewerModalProps> = ({
  isOpen,
  doc,
  onClose,
}) => {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  useEffect(() => {
    if (isOpen && doc) {
      fetchChunks(doc.id);
    } else {
      setChunks([]);
      setError(null);
      setSearchQuery('');
    }
  }, [isOpen, doc]);

  const fetchChunks = async (docId: string | number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDocumentChunks(docId);
      setChunks(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Parçalar alınamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !doc) return null;

  const filteredChunks = chunks.filter((chunk) => {
    const text = chunk.content || chunk.text || JSON.stringify(chunk);
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCopyChunk = (chunk: DocumentChunk, index: number) => {
    const text = chunk.content || chunk.text || JSON.stringify(chunk, null, 2);
    navigator.clipboard.writeText(text);
    const identifier = chunk.id ?? index;
    setCopiedId(identifier);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 truncate max-w-md">
                  {doc.filename}
                </h3>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
                  {chunks.length} Parça (Chunks)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                GET /documents/{doc.id}/chunks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Toolbar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Parça metinlerinde ara..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button
            onClick={() => fetchChunks(doc.id)}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>Yenile</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs font-medium text-slate-600">Parçalar yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-4 text-xs text-rose-800 border border-rose-200">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Parçalar Alınamadı</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          ) : filteredChunks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
              <FileText className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">
                {searchQuery ? 'Aramaya uygun parça bulunamadı' : 'Dokümanda henüz parça bulunmuyor'}
              </p>
            </div>
          ) : (
            filteredChunks.map((chunk, index) => {
              const textContent = chunk.content || chunk.text || JSON.stringify(chunk, null, 2);
              const chunkIdx = chunk.chunk_index !== undefined ? chunk.chunk_index : index + 1;
              const identifier = chunk.id ?? index;
              const isCopied = copiedId === identifier;

              return (
                <div
                  key={String(chunk.id || index)}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-xs transition hover:border-slate-300 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                        Parça #{chunkIdx}
                      </span>
                      {chunk.page !== undefined && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          Sayfa: {chunk.page}
                        </span>
                      )}
                      {chunk.id && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {chunk.id}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopyChunk(chunk, index)}
                      className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 transition"
                      title="Metni Kopyala"
                    >
                      {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      <span>{isCopied ? 'Kopyalandı' : 'Kopyala'}</span>
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-xs bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    {textContent}
                  </p>
                  {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                    <div className="mt-2 text-[10px] text-slate-400 font-mono">
                      Metadata: {JSON.stringify(chunk.metadata)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
