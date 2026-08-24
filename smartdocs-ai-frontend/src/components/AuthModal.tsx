import React, { useState } from 'react';
import { X, Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { api, setStoredToken, setStoredUser } from '../api/client';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    setMode(initialMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Lütfen e-posta ve şifrenizi girin.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        const registerRes = await api.register(email.trim(), password);
        setSuccessMessage('Kayıt tamamlandı. Oturum açılıyor...');

        try {
          const loginRes = await api.login(email.trim(), password);
          if (loginRes.access_token) {
            setStoredToken(loginRes.access_token);
            const userObj: User = {
              id: registerRes.id || loginRes.email || email.trim(),
              email: email.trim(),
            };
            setStoredUser(userObj);
            setTimeout(() => {
              onSuccess(userObj);
              onClose();
            }, 600);
            return;
          }
        } catch {
          setMode('login');
          setSuccessMessage('Hesabınız oluşturuldu. Lütfen giriş yapın.');
        }
      } else {
        const loginRes = await api.login(email.trim(), password);
        if (loginRes.access_token) {
          setStoredToken(loginRes.access_token);
          const userObj: User = {
            id: loginRes.id || email.trim(),
            email: email.trim(),
          };
          setStoredUser(userObj);
          setSuccessMessage('Giriş başarılı.');
          setTimeout(() => {
            onSuccess(userObj);
            onClose();
          }, 400);
        } else {
          throw new Error('Oturum anahtarı alınamadı.');
        }
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Şu anda servislerimizdeki yoğunluk nedeniyle hizmet verilemiyor. Lütfen daha sonra tekrar deneyin.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {mode === 'login' ? 'Oturum Açın' : 'Kayıt Olun'}
            </h3>
            <p className="text-xs text-slate-500">
              {mode === 'login'
                ? 'Belge analizine devam etmek için giriş yapın'
                : 'SmartDocs AI ile belge analizine başlayın'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="mt-4 flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              E-posta Adresi
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="input-modal-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ad.soyad@sirket.com"
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="input-modal-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>
          </div>

          <button
            id="btn-modal-submit"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:bg-black transition disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>İşleniyor...</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
