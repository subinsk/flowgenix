from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings
import os
import httpx

# Initialize ChromaDB client (in-memory for now)
chroma_client = chromadb.Client(Settings())
collection = chroma_client.create_collection("documents")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "demo-key")
GEMINI_EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=" + GEMINI_API_KEY

async def get_gemini_embedding(text: str) -> list:
    async with httpx.AsyncClient() as client:
        payload = {"content": text}
        response = await client.post(GEMINI_EMBEDDING_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        return data.get("embedding", [0.0] * 768)

# Placeholder for vector/embedding logic

async def generate_embeddings(text: str) -> Dict[str, Any]:
    # Use Gemini API for real embeddings
    embedding = await get_gemini_embedding(text)
    doc_id = f"doc_{len(collection.get()['ids'])+1}"
    collection.add(documents=[text], embeddings=[embedding], ids=[doc_id])
    return {"embedding": embedding, "doc_id": doc_id, "message": "Gemini embedding generated and stored."}

def search_vectors(query: str) -> List[Dict[str, Any]]:
    # Use Gemini API for query embedding
    import asyncio
    embedding = asyncio.run(get_gemini_embedding(query))
    results = collection.query(query_embeddings=[embedding], n_results=3)
    return [{"id": r, "document": d} for r, d in zip(results['ids'][0], results['documents'][0])]
