import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
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
    setStatusMessage('Belge yükleniyor ve metin indekslemesi yapılıyor...');

    try {
      const result = await api.uploadDocument(selectedFile);
      setUploadStatus('success');
      setUploadedResult(result);
      const chunkMsg = result.chunk_count !== undefined 
        ? `${result.chunk_count} parça indekslendi.`
        : 'Doküman analize hazırlandı.';
      setStatusMessage(chunkMsg);
      onUploadSuccess(result);
    } catch (err: unknown) {
      setUploadStatus('error');
      const msg =
        err instanceof Error
          ? err.message
          : 'Şu anda servislerimizdeki yoğunluk nedeniyle hizmet verilemiyor. Lütfen daha sonra tekrar deneyin.';
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <UploadCloud className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Belge Yükle</h3>
            <p className="text-xs text-slate-500">
              Analiz edilecek PDF dosyasını seçin
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
            ? 'border-slate-800 bg-slate-100 ring-2 ring-slate-300'
            : 'border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-50'
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

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-xs border border-slate-200 mb-2.5 text-slate-700">
          <FileText className="h-5 w-5" />
        </div>

        <p className="text-xs font-semibold text-slate-800">
          PDF dosyasını buraya sürükleyin veya <span className="text-slate-900 underline font-bold">seçin</span>
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Maksimum dosya boyutu: 50MB (.pdf)
        </p>
      </div>

      {/* Selected File Card & Actions */}
      {selectedFile && (
        <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white font-semibold text-[11px]">
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
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
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
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:bg-black transition disabled:opacity-60"
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Yükleniyor ve İndeksleniyor...</span>
                  </>
                ) : (
                  <span>Dokümanı Yükle ve Analiz Et</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Uploading Progress State */}
      {uploadStatus === 'uploading' && (
        <div className="mt-3 rounded-xl bg-slate-100 p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <Loader2 className="h-4 w-4 animate-spin text-slate-700" />
            <span>İşleniyor</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">{statusMessage}</p>
        </div>
      )}

      {/* Success Notification */}
      {uploadStatus === 'success' && (
        <div className="mt-3 rounded-xl bg-emerald-50 p-3 border border-emerald-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Belge Başarıyla Yüklendi</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">{statusMessage}</p>
          <button
            type="button"
            onClick={handleClear}
            className="mt-2 text-[11px] font-semibold text-emerald-800 hover:underline"
          >
            + Başka bir belge yükle
          </button>
        </div>
      )}

      {/* Error Notification */}
      {uploadStatus === 'error' && (
        <div className="mt-3 rounded-xl bg-rose-50 p-3 border border-rose-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-900">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>İşlem Başarısız</span>
          </div>
          <p className="text-[11px] text-rose-700 mt-1">{statusMessage}</p>
        </div>
      )}
    </div>
  );
};
