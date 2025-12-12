from __future__ import annotations

import io
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

import fitz
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from ..config import Settings


@dataclass(slots=True)
class IngestResult:
    resume_text: str
    document_ids: list[str]


class ResumeRAG:
    """Handles PDF ingestion and vector retrieval for resumes."""

    def __init__(self, settings: Settings) -> None:
        if not settings.google_api_key:
            raise ValueError("GOOGLE_API_KEY is required for embeddings")

        self._settings = settings
        self._persist_dir = Path(settings.chroma_persist_dir)
        self._persist_dir.mkdir(parents=True, exist_ok=True)
        self._embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=settings.google_api_key,
        )
        self._text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=900,
            chunk_overlap=150,
            add_start_index=True,
        )
        self._vectorstore = Chroma(
            collection_name="resume_chunks",
            embedding_function=self._embeddings,
            persist_directory=str(self._persist_dir),
        )

    def ingest_pdf(self, file_bytes: bytes, source_name: str) -> IngestResult:
        resume_text = self._extract_text(file_bytes)
        if not resume_text.strip():
            raise ValueError("Unable to extract text from PDF")

        docs = self._text_splitter.create_documents([resume_text], metadatas=[{"source": source_name}])
        doc_ids = self._vectorstore.add_documents(docs)
        self._vectorstore.persist()
        return IngestResult(resume_text=resume_text, document_ids=doc_ids)

    def similarity_search(self, query: str, k: int = 4) -> Sequence[str]:
        """Return top-k context chunks as raw text."""
        retriever = self._vectorstore.as_retriever(search_kwargs={"k": k})
        results = retriever.get_relevant_documents(query)
        return [doc.page_content for doc in results]

    @staticmethod
    def _extract_text(file_bytes: bytes) -> str:
        buffer = io.BytesIO(file_bytes)
        with fitz.open(stream=buffer, filetype="pdf") as doc:
            texts: list[str] = []
            for page in doc:
                texts.append(page.get_text())
        return "\n".join(texts)


__all__ = ["ResumeRAG", "IngestResult"]
