import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, Layers, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Copy, Check, MessageSquare, Trash2, ArrowRight } from 'lucide-react';
import Markdown from 'react-markdown';
import { DocumentItem, ChatMessage, SourceReference } from '../types';
import { api, getStoredToken } from '../api/client';

interface ChatInterfaceProps {
  selectedDoc: DocumentItem | null;
  onRequireAuth: () => void;
  isAuthenticated: boolean;
  onOpenDocList: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  selectedDoc,
  onRequireAuth,
  isAuthenticated,
  onOpenDocList,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load / reset messages when selected document changes
  useEffect(() => {
    if (selectedDoc) {
      // Check if there is saved chat in sessionStorage for this doc
      const saved = sessionStorage.getItem(`chat_${selectedDoc.id}`);
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
          return;
        } catch {
          // ignore
        }
      }
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Merhaba! **"${selectedDoc.filename}"** dokümanı hazır. Dokümanın içeriği hakkında dilediğiniz soruyu sorabilirsiniz.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else {
      setMessages([]);
    }
  }, [selectedDoc?.id]);

  // Save messages to sessionStorage
  const updateMessages = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    if (selectedDoc) {
      sessionStorage.setItem(`chat_${selectedDoc.id}`, JSON.stringify(newMessages));
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const question = (textToSend || inputQuestion).trim();
    if (!question || isLoading) return;

    if (!isAuthenticated || !getStoredToken()) {
      onRequireAuth();
      return;
    }

    if (!selectedDoc) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMessage];
    updateMessages(nextMessages);
    setInputQuestion('');
    setIsLoading(true);

    try {
      // POST /chat -> { document_id, question } -> { answer, sources }
      const res = await api.sendChatMessage(selectedDoc.id, question);
      
      const assistantText = res.answer || res.response || (typeof res === 'string' ? res : 'Yanıt alındı.');
      const assistantSources: SourceReference[] = Array.isArray(res.sources) ? res.sources : [];

      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: assistantText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: assistantSources,
      };

      updateMessages([...nextMessages, botMessage]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Yanıt alınamadı.';
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `Hata: ${errorMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      updateMessages([...nextMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleCopyMessage = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.text);
    setCopiedMsgId(msg.id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleClearHistory = () => {
    if (selectedDoc) {
      sessionStorage.removeItem(`chat_${selectedDoc.id}`);
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Sohbet geçmişi temizlendi. **"${selectedDoc.filename}"** hakkında soru sorabilirsiniz.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const samplePrompts = [
    'Dokümanın ana fikrini ve amacını 3 maddede özetle.',
    'Dokümandaki en kritik bulgular veya sonuçlar nelerdir?',
    'Öne çıkan sayısal veriler ve tarihler neler?',
    'Bu belgede bahsedilen temel terimleri açıkla.',
  ];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm shadow-indigo-100">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            {selectedDoc ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {selectedDoc.filename}
                </span>
                {selectedDoc.chunk_count !== undefined && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                    <Layers className="h-3 w-3" />
                    {selectedDoc.chunk_count} parça
                  </span>
                )}
              </div>
            ) : (
              <h3 className="text-xs font-bold text-slate-700">Doküman Seçilmedi</h3>
            )}
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="font-mono">POST /chat</span>
              {selectedDoc && (
                <span>• ID: <b className="font-mono text-slate-700">{selectedDoc.id}</b></span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedDoc && messages.length > 1 && (
            <button
              id="btn-clear-chat"
              onClick={handleClearHistory}
              title="Sohbet geçmişini temizle"
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Temizle</span>
            </button>
          )}
          {!selectedDoc && (
            <button
              onClick={onOpenDocList}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Doküman Seç</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
        {!selectedDoc ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3 shadow-inner">
              <BookOpen className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Sohbet İçin Bir Doküman Seçin</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Soru sormak ve RAG ile yanıt alabilmek için sol panelden bir PDF dokümanı seçin veya yeni bir PDF yükleyin.
            </p>
            <button
              onClick={onOpenDocList}
              className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <span>Doküman Listesine Git</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isError = msg.isError;
              const hasSources = msg.sources && msg.sources.length > 0;
              const isSourcesOpen = expandedSources[msg.id] ?? false;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  } group`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-xs text-xs font-bold ${
                      isUser
                        ? 'bg-slate-900 text-white'
                        : isError
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white'
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : isError ? <AlertCircle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Bubble Container */}
                  <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`relative rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-xs'
                          : isError
                          ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                      }`}
                    >
                      {/* Markdown Text */}
                      <div className="prose prose-xs max-w-none text-inherit prose-headings:font-bold prose-headings:text-inherit prose-p:my-1 prose-pre:bg-slate-900 prose-pre:text-slate-100">
                        <Markdown>{msg.text}</Markdown>
                      </div>

                      {/* Message Actions */}
                      <div
                        className={`mt-2 flex items-center justify-between gap-3 text-[10px] ${
                          isUser ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {!isUser && (
                          <button
                            onClick={() => handleCopyMessage(msg)}
                            className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 hover:text-indigo-600"
                            title="Yanıtı Kopyala"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span>{copiedMsgId === msg.id ? 'Kopyalandı' : 'Kopyala'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sources (Citations) Section */}
                    {hasSources && (
                      <div className="mt-2 w-full">
                        <button
                          type="button"
                          onClick={() => toggleSources(msg.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-indigo-50/80 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition"
                        >
                          <BookOpen className="h-3 w-3" />
                          <span>Kaynak Parçalar ({msg.sources?.length})</span>
                          {isSourcesOpen ? (
                            <ChevronUp className="h-3 w-3 ml-0.5" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-0.5" />
                          )}
                        </button>

                        {isSourcesOpen && (
                          <div className="mt-2 space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/30 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                              RAG Kaynak Alıntıları (Backend'den Dönen Parçalar)
                            </p>
                            {msg.sources?.map((source, sIdx) => {
                              const snippet =
                                source.content || source.text || JSON.stringify(source);
                              return (
                                <div
                                  key={sIdx}
                                  className="rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] shadow-xs"
                                >
                                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 mb-1">
                                    <span className="font-semibold text-indigo-700">
                                      Kaynak #{sIdx + 1}
                                      {source.chunk_index !== undefined ? ` (Parça ${source.chunk_index})` : ''}
                                    </span>
                                    {source.page !== undefined && (
                                      <span>Sayfa: {source.page}</span>
                                    )}
                                    {source.score !== undefined && (
                                      <span className="font-mono text-emerald-600">
                                        Benzerlik: {Number(source.score).toFixed(3)}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-700 whitespace-pre-wrap leading-normal font-sans bg-slate-50 p-2 rounded border border-slate-100">
                                    {snippet}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading animation */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-xs">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  <span>Dokümanda taranıyor ve yanıt üretiliyor...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Suggested Prompts (if chat is fresh) */}
      {selectedDoc && messages.length <= 1 && (
        <div className="border-t border-slate-100 bg-white px-4 py-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" /> Hızlı Soru Önerileri
          </p>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
        <div className="relative flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-1.5 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
          <textarea
            ref={textareaRef}
            id="input-chat-question"
            rows={1}
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedDoc || isLoading}
            placeholder={
              !selectedDoc
                ? 'Lütfen önce bir PDF dokümanı seçin...'
                : 'Doküman hakkında soru sorun (Enter ile gönder)...'
            }
            className="flex-1 max-h-32 min-h-[38px] resize-none border-0 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 disabled:opacity-50"
          />
          <button
            id="btn-send-message"
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputQuestion.trim() || !selectedDoc || isLoading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-40"
            title="Gönder"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Shift + Enter: Yeni satır • Enter: Gönder</span>
          {selectedDoc && (
            <span className="text-slate-500 font-medium">
              Aktif Doküman: <b>{selectedDoc.filename}</b>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
