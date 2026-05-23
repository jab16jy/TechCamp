import logging
import re
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

RAG_DIR = Path(__file__).parent.parent.parent / "data" / "rag"

_STOPWORDS = [
    "de", "la", "el", "en", "y", "que", "los", "las", "del", "un", "una",
    "es", "para", "por", "con", "no", "al", "se", "como", "su", "lo", "le",
    "a", "o", "e", "pero", "mas", "son", "han", "fue", "era", "sus", "hay",
    "les", "nos", "esta", "entre", "desde", "hasta", "sin", "cada",
    "todo", "muy", "tan", "asi", "aunque", "tambien", "ser",
]

_vectorizer: TfidfVectorizer | None = None
_tfidf_matrix = None
_chunks: list[dict] = []
_docs_raw: list[dict] = []


def _load_documents() -> list[dict]:
    global _docs_raw
    if _docs_raw:
        return _docs_raw

    if not RAG_DIR.exists():
        logger.warning(f"RAG directory not found: {RAG_DIR}")
        return []

    docs = []
    for f in sorted(RAG_DIR.glob("*.md")):
        if f.name == "README.md":
            continue
        try:
            content = f.read_text(encoding="utf-8")
            name = re.sub(r"^\d+\s+", "", f.stem.replace("-", " "))
            docs.append({"name": name, "content": content})
        except Exception:
            pass

    logger.info(f"RAG: loaded {len(docs)} documents")
    _docs_raw = docs
    return docs


def _chunk_document(doc: dict) -> list[dict]:
    content = doc["content"]
    name = doc["name"]
    target = 500

    sections = re.split(r"\n(?=## )", content)
    if len(sections) <= 1:
        sections = re.split(r"\n(?=# )", content)
    if len(sections) <= 1:
        sections = content.split("\n\n")

    chunks = []
    for idx, section in enumerate(sections):
        section = section.strip()
        if not section or len(section) < 50:
            continue
        if len(section) <= target + 200:
            chunks.append({"text": section, "doc_name": name, "chunk_idx": idx})
            continue

        words = section.split()
        i = 0
        while i < len(words):
            chunk = " ".join(words[i:i + target // 5])
            if len(chunk) >= 50:
                chunks.append({"text": chunk, "doc_name": name, "chunk_idx": idx})
            i += max(1, (target // 5) - 20)

    return chunks


def _build_index() -> None:
    global _vectorizer, _tfidf_matrix, _chunks

    docs = _load_documents()
    if not docs:
        return

    all_chunks = []
    for doc in docs:
        all_chunks.extend(_chunk_document(doc))

    if not all_chunks:
        logger.warning("RAG: no chunks generated")
        return

    texts = [c["text"] for c in all_chunks]
    _chunks = all_chunks

    _vectorizer = TfidfVectorizer(
        stop_words=_STOPWORDS,
        ngram_range=(1, 2),
        max_df=0.85,
        min_df=1,
        sublinear_tf=True,
        max_features=5000,
    )
    _tfidf_matrix = _vectorizer.fit_transform(texts)
    logger.info(f"RAG: indexed {len(_chunks)} chunks from {len(docs)} documents")


def search_rag(query: str, k: int = 8) -> list[str]:
    if _tfidf_matrix is None:
        _build_index()

    if _tfidf_matrix is None or not _chunks:
        return _keyword_search(query, k)

    try:
        query_vec = _vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, _tfidf_matrix).flatten()
    except Exception:
        logger.warning("TF-IDF search failed, falling back to keyword")
        return _keyword_search(query, k)

    top_indices = np.argsort(similarities)[::-1]
    seen_docs: set[str] = set()
    results: list[str] = []

    for idx in top_indices:
        if similarities[idx] < 0.01:
            continue
        chunk = _chunks[idx]
        doc_name = chunk["doc_name"]
        if doc_name not in seen_docs:
            seen_docs.add(doc_name)
            results.append(chunk["text"][:2000])
            if len(results) >= k:
                break

    if len(results) < k:
        for idx in top_indices:
            if len(results) >= k:
                break
            text = _chunks[idx]["text"][:2000]
            if text not in results:
                results.append(text)

    return results


def _keyword_search(query: str, k: int = 5) -> list[str]:
    docs = _load_documents()
    if not docs:
        return []

    query_lower = query.lower()
    query_terms = set(re.findall(r"\w+", query_lower))
    stop_set = set(_STOPWORDS)

    scored = []
    for doc in docs:
        name_lower = doc["name"].lower()
        content_lower = doc["content"].lower()
        score = 0
        if any(t in name_lower for t in query_terms if t not in stop_set):
            score += 3
        for term in query_terms:
            if term not in stop_set:
                score += min(content_lower.count(term), 10)
        if query_lower in content_lower:
            score += 5
        if score > 0:
            scored.append((score, doc))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [d["content"][:2000] for _, d in scored[:k]]


def get_full_knowledge() -> str:
    docs = _load_documents()
    return "\n\n".join(d["content"][:1500] for d in docs[:12])


def get_all_knowledge() -> str:
    docs = _load_documents()
    parts = []
    for d in docs:
        parts.append(f"--- {d['name']} ---\n{d['content']}")
    return "\n\n".join(parts)


def rebuild_index() -> None:
    global _vectorizer, _tfidf_matrix, _chunks, _docs_raw
    _vectorizer = None
    _tfidf_matrix = None
    _chunks = []
    _docs_raw = []
    _build_index()
    logger.info("RAG index rebuilt")
