import React, { useState, useEffect } from 'react';
import { X, Layers, Copy, Check, Search, AlertCircle, RefreshCw } from 'lucide-react';
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
      setError(
        err instanceof Error
          ? err.message
          : 'Şu anda servislerimizdeki yoğunluk nedeniyle hizmet verilemiyor. Lütfen daha sonra tekrar deneyin.'
      );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="relative flex h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                  {doc.filename}
                </h3>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {chunks.length} Parça
                </span>
              </div>
              <p className="text-xs text-slate-500">
                İndekslenen metin kesitleri ve parçalar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Toolbar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Parça içeriğinde ara..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <button
            type="button"
            onClick={() => fetchChunks(doc.id)}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>

        {/* Body List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-700 mb-2" />
              <p className="text-xs text-slate-600">Parçalar yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Parçalar alınamadı</p>
                <p className="mt-1 text-rose-700">{error}</p>
              </div>
            </div>
          ) : filteredChunks.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-8 text-slate-400">
              <Layers className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">
                {searchQuery ? 'Aramaya uygun parça bulunamadı.' : 'Bu dokümana ait parça bulunamadı.'}
              </p>
            </div>
          ) : (
            filteredChunks.map((chunk, index) => {
              const chunkText = chunk.content || chunk.text || (typeof chunk === 'string' ? chunk : JSON.stringify(chunk, null, 2));
              const chunkNumber = chunk.chunk_index !== undefined ? chunk.chunk_index : index + 1;
              const isCopied = copiedId === (chunk.id ?? index);

              return (
                <div
                  key={chunk.id ?? index}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-slate-300"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Parça #{chunkNumber}</span>
                      {chunk.page !== undefined && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          Sayfa {chunk.page}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyChunk(chunk, index)}
                      className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 transition"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Kopyalandı</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                    {chunkText}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3 text-xs text-slate-500">
          <span>Toplam {chunks.length} parça listelendi</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
