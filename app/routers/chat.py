from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import DocumentChunk
from ..embedding import embed_text
from ..llm import generate_answer

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    document_id: int
    question: str

@router.post("/")
def chat(data: ChatRequest, db: Session = Depends(get_db)):
    # 1. Soruyu vektöre çevir
    question_embedding = embed_text(data.question)
    
    # 2. pgvector: en yakın 3 chunk'ı cosine distance'a göre bul
    results = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == data.document_id)
        .order_by(DocumentChunk.embedding.cosine_distance(question_embedding))
        .limit(3)
        .all()
    )
    
    if not results:
        raise HTTPException(status_code=404, detail="Bu dokümana ait chunk bulunamadı")
    
    # 3. Bulunan chunk'ları metin olarak listeye al
    context_chunks = [r.content for r in results]
    
    # 4. Gemini'ye gönder (Şu an API çökmüşse burası hata verebilir)
    answer = generate_answer(data.question, context_chunks)
    
    # 5. Frontend'e dön
    return {
        "answer": answer,
        "sources": [
            {"chunk_index": r.chunk_index, "content": r.content[:200]}
            for r in results
        ],
    }