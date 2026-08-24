import React, { useState } from 'react';
import { FileText, Lock, Mail, ArrowRight, ShieldCheck, Search, Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api, setStoredToken, setStoredUser } from '../api/client';
import { User } from '../types';

interface AuthScreenProps {
  onSuccess: (user: User) => void;
  onOpenBackendSettings: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  onOpenBackendSettings,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Lütfen e-posta ve şifrenizi eksiksiz girin.');
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
              id: registerRes.id || email.trim(),
              email: email.trim(),
            };
            setStoredUser(userObj);
            setTimeout(() => {
              onSuccess(userObj);
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-slate-700 selection:text-white">
      {/* Top minimal bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
            <FileText className="h-4 w-4" />
          </div>
          <span className="font-semibold text-slate-100 tracking-tight text-sm">SmartDocs AI</span>
        </div>
        <button
          onClick={onOpenBackendSettings}
          className="text-xs text-slate-400 hover:text-slate-200 transition font-medium"
        >
          Sunucu Ayarları
        </button>
      </header>

      {/* Main split screen */}
      <main className="w-full max-w-7xl mx-auto px-6 py-8 sm:py-12 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Brand & Professional Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.1]">
                SmartDocs AI
              </h1>
              <p className="text-xl sm:text-2xl font-normal text-slate-300">
                Profesyonel Belge Analizi
              </p>
            </div>

            <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
              Teknik şartnameler, sözleşmeler ve kapsamlı kurumsal raporlar üzerinde
              doğrudan soru-cevap yapın. Her yanıtı kaynak sayfa ve paragraf alıntılarıyla doğrulayın.
            </p>

            {/* Feature points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                  <Database className="h-4 w-4 text-slate-400" />
                  <span>Otomatik Ayrıştırma</span>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  PDF dosyaları sayfa ve anlamsal parçalara bölünerek indekslenir.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                  <Search className="h-4 w-4 text-slate-400" />
                  <span>Kaynak Doğrulama</span>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Üretilen her yanıt doğrudan dokümandaki ilgili paragrafa referans verir.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  <span>Güvenli Oturum</span>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Dokümanlarınız sadece kimliği doğrulanmış kullanıcıya özel işlenir.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek & Clean Auth Box */}
          <div className="lg:col-span-5">
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
              
              {/* Tab Switch */}
              <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-700/50 mb-6">
                <button
                  type="button"
                  id="tab-btn-login"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                    mode === 'login'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Giriş Yap
                </button>
                <button
                  type="button"
                  id="tab-btn-register"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                    mode === 'register'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Kayıt Ol
                </button>
              </div>

              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">
                  {mode === 'login' ? 'Oturum Açın' : 'Yeni Hesap Oluşturun'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {mode === 'login'
                    ? 'Belgelerinize erişmek ve analiz yapmak için giriş yapın.'
                    : 'Hızlıca hesabınızı oluşturup belgelerinizi yüklemeye başlayın.'}
                </p>
              </div>

              {/* Status alerts */}
              {errorMessage && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-950/50 border border-rose-800/80 p-3 text-xs text-rose-200">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/80 p-3 text-xs text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    E-posta Adresi
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      id="input-landing-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ad.soyad@sirket.com"
                      className="w-full rounded-xl bg-slate-900/90 border border-slate-700 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Şifre
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      id="input-landing-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-slate-900/90 border border-slate-700 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>
                </div>

                <button
                  id="btn-landing-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white active:bg-slate-200 transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
                      <span>İşleniyor...</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol ve Başla'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Mode switch tip */}
              <div className="mt-5 text-center text-xs text-slate-400">
                {mode === 'login' ? (
                  <span>
                    Hesabınız yok mu?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-slate-200 font-semibold hover:underline"
                    >
                      Kayıt Olun
                    </button>
                  </span>
                ) : (
                  <span>
                    Zaten hesabınız var mı?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-slate-200 font-semibold hover:underline"
                    >
                      Giriş Yapın
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Bottom minimal note */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/80 gap-2">
        <span>SmartDocs AI • Profesyonel Belge Analizi</span>
        <span>Gizli ve güvenli belge analizi arayüzü</span>
      </footer>
    </div>
  );
};
