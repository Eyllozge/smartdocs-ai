import React, { useState } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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

  // Sync mode if initialMode changes
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
        // Call POST /auth/register
        const registerRes = await api.register(email.trim(), password);
        setSuccessMessage('Kayıt başarılı! Otomatik giriş yapılıyor...');

        // Attempt automatic login right after registration
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
            }, 800);
            return;
          }
        } catch {
          // If auto login fails, switch to login tab
          setMode('login');
          setSuccessMessage('Kayıt oluşturuldu. Lütfen giriş yapın.');
        }
      } else {
        // Call POST /auth/login
        const loginRes = await api.login(email.trim(), password);
        if (loginRes.access_token) {
          setStoredToken(loginRes.access_token);
          const userObj: User = {
            id: loginRes.id || email.trim(),
            email: email.trim(),
          };
          setStoredUser(userObj);
          setSuccessMessage('Giriş başarılı!');
          setTimeout(() => {
            onSuccess(userObj);
            onClose();
          }, 500);
        } else {
          throw new Error('Token alınamadı, yanıt formatını kontrol edin.');
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 mb-6">
          <button
            id="tab-login"
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 pb-3 text-sm font-semibold transition border-b-2 ${
              mode === 'login'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <LogIn className="h-4 w-4" />
              <span>Giriş Yap</span>
            </div>
          </button>
          <button
            id="tab-register"
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 pb-3 text-sm font-semibold transition border-b-2 ${
              mode === 'register'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Kayıt Ol</span>
            </div>
          </button>
        </div>

        {/* Form Header */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900">
            {mode === 'login' ? 'Hesabınıza Giriş Yapın' : 'Yeni Hesap Oluşturun'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'login'
              ? 'FastAPI /auth/login endpointi ile JWT kimlik doğrulaması'
              : 'FastAPI /auth/register endpointi ile kayıt işlemi'}
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              E-posta Adresi
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="input-auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@domain.com"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="input-auth-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <button
            id="btn-auth-submit"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{mode === 'login' ? 'Giriş yapılıyor...' : 'Kaydediliyor...'}</span>
              </>
            ) : mode === 'login' ? (
              <>
                <LogIn className="h-4 w-4" />
                <span>Giriş Yap</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Kayıt Ol</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-5 text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <p>
              Hesabınız yok mu?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-semibold text-indigo-600 hover:underline"
              >
                Hemen Kayıt Olun
              </button>
            </p>
          ) : (
            <p>
              Zaten hesabınız var mı?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-semibold text-indigo-600 hover:underline"
              >
                Giriş Yapın
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
