import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()


genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-3.6-flash")

def generate_answer(question: str, context_chunks: list[str]) -> str:
    context = "\n\n---\n\n".join(context_chunks)
    
    prompt = f"""Aşağıdaki belge parçalarına dayanarak soruyu cevapla.
Cevap belgede yoksa, uydurmadan "Bu bilgi belgede bulunmuyor" de.

BELGE PARÇALARI:
{context}

SORU: {question}
CEVAP:"""
    
    response = model.generate_content(prompt)
    return response.text