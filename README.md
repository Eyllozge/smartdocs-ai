# SmartDocs AI

RAG (Retrieval-Augmented Generation) tabanlı doküman soru-cevap platformu. Kullanıcı bir PDF yükler, sistem içeriği parçalayıp vektörleştirir, ardından kullanıcı doküman üzerinde soru sorup kaynak gösterimli cevap alabilir.


## Teknoloji Yığını(Tech Stack)

**Backend**
- Python + FastAPI
- PostgreSQL + SQLAlchemy
- pgvector (vektör benzerlik araması için Postgres extension)
- JWT (kimlik doğrulama, passlib/bcrypt ile şifre hashleme)
- pdfplumber (PDF metin çıkarımı)
- sentence-transformers — `all-MiniLM-L6-v2` (yerel, ücretsiz embedding modeli, 384 boyut)
- Google Gemini API (cevap üretimi, ücretsiz kota)

**Frontend**
- React + Vite (TypeScript)(With Google AI Studıo)

## Kurulum

### 1. Backend

```bash
# Sanal ortam oluştur ve etkinleştir
python -m venv .venv
.venv\Scripts\activate      # Windows

# Bağımlılıkları kur
pip install -r requirements.txt
```

### 2. Veritabanı

PostgreSQL üzerinde bir veritabanı oluştur (örn. `smartdocs`) ve pgvector extension'ını etkinleştir:

```sql
CREATE DATABASE smartdocs;
\c smartdocs
CREATE EXTENSION vector;
```

> **Not:** pgvector, Postgres kurulumunun standart bir parçası değildir. Windows'ta [pgvector_pgsql_windows](https://github.com/andreiramani/pgvector_pgsql_windows) reposundan Postgres sürümünüze uygun hazır derlenmiş dosyaları indirip `lib/` ve `share/extension/` klasörlerine kopyalamanız, ardından servisi yeniden başlatmanız gerekir.

### 3. Ortam değişkenleri

Proje kökünde bir `.env` dosyası oluşturun:

```
DATABASE_URL=postgresql://postgres:SIFRENIZ@localhost:5432/smartdocs
SECRET_KEY=herhangi-bir-gizli-anahtar
GEMINI_API_KEY=your-gemini-api-key
```

Gemini API key'i [aistudio.google.com](https://aistudio.google.com) üzerinden ücretsiz alınabilir.

### 4. Çalıştırma

```bash
uvicorn app.main:app --reload
```

API dokümantasyonu: `http://127.0.0.1:8000/docs`

### 5. Frontend

```bash
cd smartdocs-ai-frontend
npm install
npm run dev
```

Varsayılan olarak `http://localhost:3000` üzerinde çalışır. Backend'in CORS ayarlarındaki (`app/main.py`) `allow_origins` değerinin frontend portunuzla eşleştiğinden emin olun.

## API Endpoint'leri

| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/auth/register` | Kullanıcı kaydı |
| POST | `/auth/login` | Giriş, JWT token döner |
| POST | `/documents/upload` | PDF yükleme, metin çıkarımı, chunking, embedding |
| GET | `/documents/` | Yüklenen dokümanların listesi |
| GET | `/documents/{id}/chunks` | Bir dokümanın parçalarını listeler |
| POST | `/chat/` | Doküman üzerinde soru sorma (RAG) |

## RAG Akışı

1. PDF yüklenir, `pdfplumber` ile metin çıkarılır
2. Metin sabit boyutlu (1000 karakter) + overlap'li (150 karakter) parçalara bölünür
3. Her parça yerel bir embedding modeliyle 384 boyutlu vektöre çevrilir ve pgvector'a kaydedilir
4. Kullanıcı soru sorduğunda, soru da aynı şekilde vektöre çevrilir
5. pgvector, cosine similarity ile en alakalı 3 parçayı bulur
6. Bu parçalar context olarak Gemini API'ye gönderilir, kaynak gösterimli bir cevap üretilir

Chunking/embedding stratejisinin gerekçesi için `RAG-notlari.md` dosyasına bakınız.

## Bilinçli Olarak Kapsam Dışı Bırakılanlar

Süre kısıtı (staj bitimine 1.5 hafta kala verilen görev) nedeniyle aşağıdaki noktalar bilinçli olarak kapsam dışı bırakılmıştır:

- **Endpoint yetkilendirmesi:** `/documents/upload` ve `/chat/` endpoint'leri şu an JWT token kontrolü yapmıyor. Üretim ortamında bu endpoint'lere `Depends` ile auth kontrolü eklenmelidir.
- **Otomatik test paketi:** Sadece manuel test senaryoları üzerinden doğrulama yapılmıştır.
- **Konuşma geçmişi:** Chat endpoint'i stateless çalışır, önceki sorular/cevaplar kaydedilmez.
- **Gelişmiş chunking:** Sabit boyutlu chunking kullanıldı; cümle/paragraf sınırlarına duyarlı (semantic) chunking uygulanmadı.
- **Deployment/CI-CD:** Proje yalnızca yerel ortamda çalıştırılmak üzere hazırlanmıştır.
- **Çoklu dosya formatı desteği:** Sadece PDF desteklenmektedir.
