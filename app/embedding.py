from sentence_transformers import SentenceTransformer

_model = SentenceTransformer("all-MiniLM-L6-v2")


def embed_text(text: str) -> list[float]:
    """Tek bir metni 384 boyutlu vektöre çevirir."""
    vector = _model.encode(text)
    return vector.tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Birden fazla metni tek seferde vektöre çevirir (daha hızlı)."""
    vectors = _model.encode(texts)
    return [v.tolist() for v in vectors]