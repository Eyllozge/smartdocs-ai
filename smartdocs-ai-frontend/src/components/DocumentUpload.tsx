import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, X } from 'lucide-react';
import { api, getStoredToken } from '../api/client';
import { DocumentItem } from '../types';

interface DocumentUploadProps {
  onUploadSuccess: (newDoc: DocumentItem) => void;
  onRequireAuth: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadSuccess,
  onRequireAuth,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [uploadedResult, setUploadedResult] = useState<DocumentItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadStatus('error');
      setStatusMessage('Lütfen geçerli bir PDF (.pdf) dosyası seçin.');
      return false;
    }
    setSelectedFile(file);
    setUploadStatus('idle');
    setStatusMessage('');
    setUploadedResult(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const token = getStoredToken();
    if (!token) {
      setUploadStatus('error');
      setStatusMessage('Doküman yüklemek için lütfen önce giriş yapın.');
      onRequireAuth();
      return;
    }

    setUploadStatus('uploading');
    setStatusMessage('PDF yükleniyor ve backend tarafından parçalanıyor (chunking & embedding)...');

    try {
      // POST /documents/upload multipart with "file"
      const result = await api.uploadDocument(selectedFile);
      setUploadStatus('success');
      setUploadedResult(result);
      const chunkMsg = result.chunk_count !== undefined 
        ? `${result.chunk_count} parça (chunk) başarıyla oluşturuldu.`
        : 'Doküman başarıyla işlendi.';
      setStatusMessage(chunkMsg);
      onUploadSuccess(result);
    } catch (err: unknown) {
      setUploadStatus('error');
      const msg = err instanceof Error ? err.message : 'Yükleme başarısız oldu.';
      setStatusMessage(msg);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setStatusMessage('');
    setUploadedResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <UploadCloud className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">PDF Dokümanı Yükle</h3>
            <p className="text-[11px] text-slate-500">
              FastAPI <code className="bg-slate-100 px-1 py-0.2 rounded font-mono">/documents/upload</code> endpointine aktarılır
            </p>
          </div>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        id="drop-zone-pdf"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (uploadStatus !== 'uploading') {
            fileInputRef.current?.click();
          }
        }}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/60 ring-4 ring-indigo-50'
            : 'border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="file-input-pdf"
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 mb-3 text-indigo-600">
          <UploadCloud className="h-6 w-6" />
        </div>

        <p className="text-sm font-semibold text-slate-800">
          PDF dosyasını buraya sürükleyin veya <span className="text-indigo-600 underline">seçin</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Sadece .pdf formatındaki belgeler desteklenir
        </p>
      </div>

      {/* Selected File Card & Actions */}
      {selectedFile && (
        <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 font-bold text-xs">
                PDF
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  {formatBytes(selectedFile.size)}
                </p>
              </div>
            </div>

            {uploadStatus !== 'uploading' && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
                title="Dosyayı kaldır"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Action Button */}
          {uploadStatus !== 'success' && (
            <div className="mt-3">
              <button
                id="btn-start-upload"
                type="button"
                onClick={handleUpload}
                disabled={uploadStatus === 'uploading'}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-60"
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Yükleniyor ve Parçalanıyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Dokümanı Backend'e Yükle</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Uploading Progress State */}
      {uploadStatus === 'uploading' && (
        <div className="mt-3 rounded-xl bg-indigo-50 p-3 border border-indigo-100 animate-pulse">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            <span>İşlem Devam Ediyor</span>
          </div>
          <p className="text-[11px] text-indigo-700 mt-1">{statusMessage}</p>
        </div>
      )}

      {/* Success Notification */}
      {uploadStatus === 'success' && (
        <div className="mt-3 rounded-xl bg-emerald-50 p-3.5 border border-emerald-200">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Doküman Başarıyla Yüklendi!</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">{statusMessage}</p>
          {uploadedResult && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-800 font-mono bg-white/70 p-2 rounded-lg border border-emerald-100">
              <span>ID: <b>{uploadedResult.id}</b></span>
              {uploadedResult.chunk_count !== undefined && (
                <span>• Parçalar: <b>{uploadedResult.chunk_count}</b></span>
              )}
              <span>• Durum: <b>{uploadedResult.status}</b></span>
            </div>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="mt-2 text-[11px] font-semibold text-emerald-800 hover:underline"
          >
            + Yeni bir PDF yükle
          </button>
        </div>
      )}

      {/* Error Notification */}
      {uploadStatus === 'error' && (
        <div className="mt-3 rounded-xl bg-rose-50 p-3 border border-rose-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-900">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Yükleme Hatası</span>
          </div>
          <p className="text-[11px] text-rose-700 mt-1">{statusMessage}</p>
        </div>
      )}
    </div>
  );
};
