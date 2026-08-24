import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentList } from './components/DocumentList';
import { ChatInterface } from './components/ChatInterface';
import { AuthModal } from './components/AuthModal';
import { BackendConfigModal } from './components/BackendConfigModal';
import { ChunksViewerModal } from './components/ChunksViewerModal';
import { User, DocumentItem } from './types';
import { api, getStoredUser, clearAuth, getStoredToken } from './api/client';
import { Files, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';

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

      // If we have docs and none selected, auto-select the first ready doc
      setSelectedDoc((currentSelected) => {
        if (!currentSelected && data.length > 0) {
          return data[0];
        }
        // Ensure selected doc info is updated if refreshed
        if (currentSelected) {
          const updated = data.find((d) => d.id === currentSelected.id);
          return updated || currentSelected;
        }
        return currentSelected;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Dokümanlar yüklenirken bir hata oluştu.';
      setDocsError(msg);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  // Refresh docs whenever user or auth changes
  useEffect(() => {
    if (user) {
      fetchDocuments();
    } else {
      setDocuments([]);
      setSelectedDoc(null);
    }
  }, [user, fetchDocuments]);

  // Handlers
  const handleOpenAuth = (mode: 'login' | 'register') => {
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
    // On mobile, switch to chat tab
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans antialiased">
      {/* Top Navigation */}
      <Navbar
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenBackendConfig={() => setBackendModalOpen(true)}
        onRefreshDocuments={fetchDocuments}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 flex flex-col gap-4">
        {/* Connection Notice / Error Banner if any */}
        {docsError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Backend İletişim Uyarısı</p>
                <p className="mt-0.5 text-rose-700">{docsError}</p>
              </div>
            </div>
            <button
              onClick={() => setBackendModalOpen(true)}
              className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-300 hover:bg-rose-100 transition shrink-0"
            >
              Bağlantıyı Ayarla
            </button>
          </div>
        )}

        {/* Mobile Tab Switcher (Visible only on < lg screens) */}
        <div className="flex lg:hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
          <button
            onClick={() => setMobileTab('docs')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
              mobileTab === 'docs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Files className="h-4 w-4" />
            <span>Dokümanlar ({documents.length})</span>
          </button>
          <button
            onClick={() => setMobileTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
              mobileTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Sohbet {selectedDoc ? `(${selectedDoc.filename.slice(0, 12)}...)` : ''}</span>
          </button>
        </div>

        {/* Two-Column Responsive Layout */}
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
              onRequireAuth={() => handleOpenAuth('login')}
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
                onRequireAuth={() => handleOpenAuth('login')}
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
              onRequireAuth={() => handleOpenAuth('login')}
              isAuthenticated={!!user}
              onOpenDocList={() => setMobileTab('docs')}
            />
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>SmartDocs AI — FastAPI RAG Frontend Client</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Auth: <code className="font-mono">/auth/login</code> • Upload: <code className="font-mono">/documents/upload</code> • Chat: <code className="font-mono">/chat</code>
          </div>
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
