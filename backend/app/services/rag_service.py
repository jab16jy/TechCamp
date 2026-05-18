import logging
from pathlib import Path
import re

logger = logging.getLogger(__name__)

RAG_DIR = Path(__file__).parent.parent.parent / "data" / "rag"

_knowledge_cache: list[dict] | None = None


def _load_documents() -> list[dict]:
    global _knowledge_cache
    if _knowledge_cache is not None:
        return _knowledge_cache

    if not RAG_DIR.exists():
        logger.warning(f"RAG directory not found: {RAG_DIR}")
        _knowledge_cache = []
        return []

    docs = []
    for f in sorted(RAG_DIR.glob("*.md")):
        if f.name == "README.md":
            continue
        try:
            content = f.read_text(encoding="utf-8")
            docs.append({"name": f.stem.replace("-", " "), "content": content})
        except Exception:
            pass

    logger.info(f"Cargados {len(docs)} documentos RAG en memoria")
    _knowledge_cache = docs
    return docs


def search_rag(query: str, k: int = 4) -> list[str]:
    docs = _load_documents()
    if not docs:
        return []

    query_lower = query.lower()
    query_terms = set(re.findall(r"\w+", query_lower))
    stopwords = {"de", "la", "el", "en", "y", "que", "los", "las", "del", "un", "una",
                 "es", "para", "por", "con", "no", "al", "se", "como", "su", "lo", "le"}

    scored = []
    for doc in docs:
        name_lower = doc["name"].lower()
        content_lower = doc["content"].lower()
        score = 0
        if any(t in name_lower for t in query_terms if t not in stopwords):
            score += 3
        for term in query_terms:
            if term not in stopwords:
                count = content_lower.count(term)
                if count:
                    score += min(count, 10)
        if query_lower in content_lower:
            score += 5
        if score > 0:
            scored.append((score, doc))

    scored.sort(key=lambda x: x[0], reverse=True)

    chunks = []
    for _, doc in scored[:k]:
        content = doc["content"]
        if len(content) > 2500:
            paragraphs = content.split("\n\n")
            best_para = paragraphs[0]
            best_score = 0
            for p in paragraphs[:10]:
                p_score = sum(1 for t in query_terms if t in p.lower())
                if p_score > best_score:
                    best_score = p_score
                    best_para = p
            chunks.append(best_para[:2500])
        else:
            chunks.append(content[:2500])

    return chunks


def get_full_knowledge() -> str:
    docs = _load_documents()
    return "\n\n".join(d["content"][:1500] for d in docs[:12])
