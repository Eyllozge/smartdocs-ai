import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BookOpen, Layers, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Copy, Check, Trash2, ArrowRight } from 'lucide-react';
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
          text: `**"${selectedDoc.filename}"** belgesi incelenmeye hazır. Bu belge hakkında merak ettiğiniz konuları sorabilirsiniz.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else {
      setMessages([]);
    }
  }, [selectedDoc?.id]);

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
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Şu anda servislerimizdeki yoğunluk nedeniyle hizmet verilemiyor. Lütfen daha sonra tekrar deneyin.';
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: errorMsg,
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
          text: `Sohbet geçmişi sıfırlandı. **"${selectedDoc.filename}"** hakkında yeni bir soru sorabilirsiniz.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const samplePrompts = [
    'Belgenin ana konusunu ve amacını özetle.',
    'Belgede geçen en önemli maddeler ve bulgular neler?',
    'Önemli tarihler, sayılar ve yükümlülükler nelerdir?',
    'Bu belgedeki temel şartları listele.',
  ];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
            <Bot className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            {selectedDoc ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {selectedDoc.filename}
                </span>
                {selectedDoc.chunk_count !== undefined && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    <Layers className="h-3 w-3 text-slate-500" />
                    {selectedDoc.chunk_count} parça
                  </span>
                )}
              </div>
            ) : (
              <h3 className="text-xs font-bold text-slate-700">Belge Seçilmedi</h3>
            )}
            <p className="text-[11px] text-slate-500">
              {selectedDoc ? 'Belge Analizi ve Soru-Cevap' : 'Lütfen sol menüden bir doküman seçin'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedDoc && messages.length > 1 && (
            <button
              id="btn-clear-chat"
              onClick={handleClearHistory}
              title="Sohbet geçmişini temizle"
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Temizle</span>
            </button>
          )}
          {!selectedDoc && (
            <button
              onClick={onOpenDocList}
              className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Belge Seç</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
        {!selectedDoc ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 mb-3 border border-slate-200">
              <BookOpen className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Analiz İçin Belge Seçin</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
              Sorularınızı sormak ve doğrulanmış yanıtlar almak için listeden bir PDF belgesi seçin veya yeni bir belge yükleyin.
            </p>
            <button
              onClick={onOpenDocList}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
            >
              <span>Belgeleri Görüntüle</span>
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
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold shadow-2xs ${
                      isUser
                        ? 'bg-slate-900 text-white'
                        : isError
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    {isUser ? <User className="h-3.5 w-3.5" /> : isError ? <AlertCircle className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>

                  {/* Bubble Container */}
                  <div className={`flex flex-col max-w-[88%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`relative rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-slate-900 text-white rounded-tr-xs shadow-xs'
                          : isError
                          ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {/* Markdown Text */}
                      <div className="prose prose-xs max-w-none text-inherit prose-headings:font-semibold prose-headings:text-inherit prose-p:my-1 prose-pre:bg-slate-900 prose-pre:text-slate-100">
                        <Markdown>{msg.text}</Markdown>
                      </div>

                      {/* Message Actions */}
                      <div
                        className={`mt-2 flex items-center justify-between gap-3 text-[10px] ${
                          isUser ? 'text-slate-400' : 'text-slate-400'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {!isUser && (
                          <button
                            onClick={() => handleCopyMessage(msg)}
                            className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 hover:text-slate-900"
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

                    {/* Sources Section */}
                    {hasSources && (
                      <div className="mt-2 w-full">
                        <button
                          type="button"
                          onClick={() => toggleSources(msg.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 border border-slate-200 hover:bg-slate-100 transition shadow-2xs"
                        >
                          <BookOpen className="h-3 w-3 text-slate-500" />
                          <span>Kaynak Referansları ({msg.sources?.length})</span>
                          {isSourcesOpen ? (
                            <ChevronUp className="h-3 w-3 ml-0.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-0.5 text-slate-400" />
                          )}
                        </button>

                        {isSourcesOpen && (
                          <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-slate-100/70 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                              Dokümandan Alıntılanan Kaynak Parçalar
                            </p>
                            {msg.sources?.map((source, sIdx) => {
                              const snippet =
                                source.content || source.text || JSON.stringify(source);
                              return (
                                <div
                                  key={sIdx}
                                  className="rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] shadow-2xs"
                                >
                                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 mb-1">
                                    <span className="font-semibold text-slate-900">
                                      Kaynak #{sIdx + 1}
                                      {source.chunk_index !== undefined ? ` (Parça ${source.chunk_index})` : ''}
                                    </span>
                                    {source.page !== undefined && (
                                      <span>Sayfa: {source.page}</span>
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

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white shadow-2xs">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600 shadow-xs">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-800" />
                  <span>Belge taranıyor ve yanıt hazırlanıyor...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Suggested Questions */}
      {selectedDoc && messages.length <= 1 && (
        <div className="border-t border-slate-100 bg-white px-4 py-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Örnek Sorular
          </p>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
        <div className="relative flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-1.5 shadow-xs focus-within:border-slate-600 focus-within:ring-1 focus-within:ring-slate-600">
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
                ? 'Lütfen önce bir belge seçin...'
                : 'Belge hakkında soru sorun (Enter ile gönder)...'
            }
            className="flex-1 max-h-32 min-h-[38px] resize-none border-0 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 disabled:opacity-50"
          />
          <button
            id="btn-send-message"
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputQuestion.trim() || !selectedDoc || isLoading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs hover:bg-slate-800 active:bg-black transition disabled:opacity-30"
            title="Gönder"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Shift + Enter: Yeni satır • Enter: Gönder</span>
          {selectedDoc && (
            <span className="text-slate-600 font-medium truncate max-w-[200px]">
              {selectedDoc.filename}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
