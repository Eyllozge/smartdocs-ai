import os
import shutil
import pdfplumber
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from ..chunking import chunk_text
from ..models import Document, DocumentChunk
from ..database import get_db
from ..embedding import embed_texts

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Sadece PDF dosyası kabul edilir")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    document = Document(filename=file.filename, status="processing")
    db.add(document)
    db.commit()
    db.refresh(document)

    try:
        text = extract_text_from_pdf(file_path)

        chunks = chunk_text(text)
        embeddings = embed_texts(chunks)

        for i, (chunk_content, vector) in enumerate(zip(chunks, embeddings)):
            chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=i,
                content=chunk_content,
                embedding=vector,
            )
            db.add(chunk)

        document.status = "completed"
        db.commit()
    except Exception:
        document.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail="PDF işlenemedi")

    return {
        "id": document.id,
        "filename": document.filename,
        "status": document.status,
        "chunk_count": len(chunks),
    }


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


@router.get("/")
def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).all()


@router.get("/{document_id}/chunks")
def get_chunks(document_id: int, db: Session = Depends(get_db)):
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).all()
    return chunks