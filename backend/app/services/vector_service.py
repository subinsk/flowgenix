from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
import httpx
from app.services.api_key_service import ApiKeyService

# Initialize ChromaDB client (in-memory for now)
chroma_client = chromadb.Client(Settings())
collection = chroma_client.create_collection("documents")

async def get_gemini_embedding(text: str, user_id: int) -> list:
    api_key_service = ApiKeyService()
    gemini_key = await api_key_service.get_api_key(user_id, "google")
    
    if not gemini_key:
        raise ValueError("Gemini API key not found. Please save your Google API key in settings.")
    
    gemini_embedding_url = f"https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key={gemini_key}"
    
    async with httpx.AsyncClient() as client:
        payload = {"content": text}
        response = await client.post(gemini_embedding_url, json=payload)
        response.raise_for_status()
        data = response.json()
        return data.get("embedding", [0.0] * 768)

async def generate_embeddings(text: str, user_id: int) -> Dict[str, Any]:
    embedding = await get_gemini_embedding(text, user_id)
    doc_id = f"doc_{len(collection.get()['ids'])+1}"
    collection.add(documents=[text], embeddings=[embedding], ids=[doc_id])
    return {"embedding": embedding, "doc_id": doc_id, "message": "Gemini embedding generated and stored."}

def search_vectors(query: str, user_id: int) -> List[Dict[str, Any]]:
    import asyncio
    embedding = asyncio.run(get_gemini_embedding(query, user_id))
    results = collection.query(query_embeddings=[embedding], n_results=3)
    return [{"id": r, "document": d} for r, d in zip(results['ids'][0], results['documents'][0])]
