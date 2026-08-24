import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentList } from './components/DocumentList';
import { ChatInterface } from './components/ChatInterface';
import { AuthModal } from './components/AuthModal';
import { AuthScreen } from './components/AuthScreen';
import { BackendConfigModal } from './components/BackendConfigModal';
import { ChunksViewerModal } from './components/ChunksViewerModal';
import { User, DocumentItem } from './types';
import { api, getStoredUser, clearAuth, getStoredToken } from './api/client';
import { Files, MessageSquare, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [chunksModalDoc, setChunksModalDoc] = useState<DocumentItem | null>(null);

  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [backendModalOpen, setBackendModalOpen] = useState<boolean>(false);
  const [chunksModalOpen, setChunksModalOpen] = useState<boolean>(false);

  // Mobile navigation active tab
  const [mobileTab, setMobileTab] = useState<'docs' | 'chat'>('docs');

  // Load user from storage on mount
  useEffect(() => {
    const savedUser = getStoredUser();
    const token = getStoredToken();
    if (savedUser && token) {
      setUser(savedUser);
    }
  }, []);

  // Fetch documents callback
  const fetchDocuments = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setDocuments([]);
      return;
    }

    setIsLoadingDocs(true);
    setDocsError(null);
    try {
      const data = await api.getDocuments();
      setDocuments(data);

      // Auto-select first document if none selected
      setSelectedDoc((currentSelected) => {
        if (!currentSelected && data.length > 0) {
          return data[0];
        }
        if (currentSelected) {
          const updated = data.find((d) => d.id === currentSelected.id);
          return updated || currentSelected;
        }
        return currentSelected;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Şu anda servislerimizdeki yoğunluk nedeniyle hizmet verilemiyor. Lütfen daha sonra tekrar deneyin.';
      setDocsError(msg);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  // Refresh docs whenever user changes
  useEffect(() => {
    if (user) {
      fetchDocuments();
    } else {
      setDocuments([]);
      setSelectedDoc(null);
    }
  }, [user, fetchDocuments]);

  // Handlers
  const handleOpenAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    fetchDocuments();
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setDocuments([]);
    setSelectedDoc(null);
  };

  const handleUploadSuccess = (newDoc: DocumentItem) => {
    setSelectedDoc(newDoc);
    fetchDocuments();
    if (window.innerWidth < 1024) {
      setMobileTab('chat');
    }
  };

  const handleSelectDocForChat = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setMobileTab('chat');
  };

  const handleOpenChunks = (doc: DocumentItem) => {
    setChunksModalDoc(doc);
    setChunksModalOpen(true);
  };

  // If user is not logged in, render the dedicated Landing / Auth first screen
  if (!user) {
    return (
      <>
        <AuthScreen
          onSuccess={handleAuthSuccess}
          onOpenBackendSettings={() => setBackendModalOpen(true)}
        />
        <BackendConfigModal
          isOpen={backendModalOpen}
          onClose={() => setBackendModalOpen(false)}
          onConfigChanged={fetchDocuments}
        />
      </>
    );
  }

  // Once authenticated, show the primary professional workspace
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans antialiased">
      {/* Navigation */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenBackendConfig={() => setBackendModalOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 flex flex-col gap-4">
        {/* Service Status Notice */}
        {docsError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{docsError}</p>
              </div>
            </div>
            <button
              onClick={() => fetchDocuments()}
              className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-300 hover:bg-rose-100 transition shrink-0"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {/* Mobile Tab Switcher */}
        <div className="flex lg:hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
          <button
            onClick={() => setMobileTab('docs')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
              mobileTab === 'docs'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Files className="h-4 w-4" />
            <span>Belgeler ({documents.length})</span>
          </button>
          <button
            onClick={() => setMobileTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
              mobileTab === 'chat'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Soru-Cevap {selectedDoc ? `(${selectedDoc.filename.slice(0, 12)}...)` : ''}</span>
          </button>
        </div>

        {/* Two-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
          {/* Left Column: Upload & Documents List */}
          <div
            className={`lg:col-span-5 flex flex-col gap-4 ${
              mobileTab === 'docs' ? 'block' : 'hidden lg:flex'
            }`}
          >
            {/* Upload Box */}
            <DocumentUpload
              onUploadSuccess={handleUploadSuccess}
              onRequireAuth={() => handleOpenAuthModal('login')}
            />

            {/* Documents List */}
            <div className="flex-1">
              <DocumentList
                documents={documents}
                selectedDoc={selectedDoc}
                isLoading={isLoadingDocs}
                onSelectDoc={handleSelectDocForChat}
                onViewChunks={handleOpenChunks}
                onRefresh={fetchDocuments}
                onRequireAuth={() => handleOpenAuthModal('login')}
                isAuthenticated={!!user}
              />
            </div>
          </div>

          {/* Right Column: Interactive Chat Interface */}
          <div
            className={`lg:col-span-7 flex flex-col min-h-[550px] lg:min-h-[640px] ${
              mobileTab === 'chat' ? 'block' : 'hidden lg:flex'
            }`}
          >
            <ChatInterface
              selectedDoc={selectedDoc}
              onRequireAuth={() => handleOpenAuthModal('login')}
              isAuthenticated={!!user}
              onOpenDocList={() => setMobileTab('docs')}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3.5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-800">
            SmartDocs AI • Profesyonel Belge Analizi
          </span>
          <span className="text-slate-400 text-[11px]">
            Tüm hakları saklıdır.
          </span>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <BackendConfigModal
        isOpen={backendModalOpen}
        onClose={() => setBackendModalOpen(false)}
        onConfigChanged={fetchDocuments}
      />

      <ChunksViewerModal
        isOpen={chunksModalOpen}
        doc={chunksModalDoc}
        onClose={() => {
          setChunksModalOpen(false);
          setChunksModalDoc(null);
        }}
      />
    </div>
  );
}
