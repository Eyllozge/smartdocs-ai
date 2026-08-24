# SmartDocs AI — Frontend Arayüzü (React + Vite)

Bu proje, Python / FastAPI ile geliştirilmiş RAG (Retrieval-Augmented Generation) backend sunucusu ile haberleşen modern, sade ve hızlı bir React istemcisidir.

---

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükleyin:
```bash
npm install
```

### 2. Geliştirme Sunucusunu Başlatın:
```bash
npm run dev
```
Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

---

## ⚙️ Backend URL Yapılandırması

FastAPI backend sunucunuzun adresini (varsayılan: `http://localhost:8000`) 3 farklı şekilde ayarlayabilirsiniz:

### Yöntem 1: `.env` Dosyası ile (Önerilen)
Kök dizindeki `.env` dosyasında (veya `.env.example` referans alınarak oluşturulan `.env` dosyasında) `VITE_API_BASE_URL` değişkenini tanımlayın:
```env
VITE_API_BASE_URL=http://localhost:8000
```
Farklı bir port veya uzak sunucu kullanıyorsanız (örn: `http://localhost:8080` veya `https://api.domain.com`), bu adresi girip uygulamayı yeniden başlatın (`npm run dev`).

### Yöntem 2: Canlı Arayüz Üzerinden (Anında Değiştirme)
1. Uygulama üst çubuğundaki (Navbar) **"Bağlı / Çevrimdışı"** göstergesine tıklayın.
2. Açılan pencerede yeni FastAPI URL'ini yazıp **"Test Et"** butonuna basarak bağlantıyı sınayın.
3. **"Kaydet ve Uygula"** butonuna tıkladığınızda ayar tarayıcının `localStorage` alanına kaydedilir ve sayfa yenilenmeden geçerli olur.

---

## 🔌 Bağlanılan FastAPI Endpoint'leri

| İstek | Endpoint | Açıklama |
|---|---|---|
| `POST` | `/auth/register` | `{ email, password }` → `{ id, email }` |
| `POST` | `/auth/login` | `{ email, password }` → `{ access_token, token_type }` |
| `POST` | `/documents/upload` | `multipart/form-data` (`file` alanı, PDF) → `{ id, filename, status, chunk_count }` |
| `GET` | `/documents/` | Yüklenen dokümanların listesi |
| `GET` | `/documents/{id}/chunks` | Dokümanın parçalarını döner |
| `POST` | `/chat` | `{ document_id, question }` → `{ answer, sources }` |

---

## ⚠️ FastAPI CORS Ayarı (Önemli)

Tarayıcının `http://localhost:3000` adresinden `http://localhost:8000` adresine istek atabilmesi için FastAPI tarafında CORS middleware'inin aktif olması gerekir:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Geliştirme için tüm kaynaklara izin ver
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🛠️ Dahil Olan Bileşenler & Özellikler

1. **Login & Register Formu**: Email ve şifre ile giriş/kayıt, JWT Token `localStorage` saklama ve `Authorization: Bearer <token>` ile güvenli istekler.
2. **PDF Yükleme Alanı**: Sürükle-bırak veya dosya seçimi ile PDF yükleme, yükleme ve chunking ilerleme durumu gösterimi.
3. **Doküman Listesi**: Yüklenen dokümanlar, durum rozetleri (`ready`, `processing`, `failed`), parça (chunk) sayıları ve arama filtresi.
4. **Parça (Chunks) Görüntüleyici**: Dokümanın parçalarını, sayfa numaralarını ve metadata bilgilerini inceleme modalı.
5. **RAG Soru-Cevap Sohbeti**: Seçili doküman için markdown destekli sohbet alanı, hızlı soru önerileri ve backend'den gelen kaynak parça (`sources`) alıntıları.
