from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import AIService
from app.services.vector_service import get_gemini_embedding
import os

router = APIRouter()
ai_service = AIService()

class LLMRequest(BaseModel):
    prompt: str
    model: str = "gpt-3.5-turbo"
    temperature: float = 0.7
    max_tokens: int = 512
    api_key: str = None

class EmbeddingRequest(BaseModel):
    text: str

@router.post("/llm/openai")
async def test_openai(req: LLMRequest):
    resp = await ai_service._generate_openai_response([
        {"role": "user", "content": req.prompt}
    ], req.model, req.temperature, req.max_tokens, api_key=req.api_key)
    return resp

@router.post("/llm/gemini")
async def test_gemini(req: LLMRequest):
    resp = await ai_service._generate_gemini_response([
        {"role": "user", "content": req.prompt}
    ], req.model, req.temperature, req.max_tokens)
    return resp

@router.post("/llm/serp")
async def test_serp(req: LLMRequest):
    # Implement your SERP API logic here
    return {"message": "SERP API not implemented in this stub."}

@router.post("/llm/brave")
async def test_brave(req: LLMRequest):
    # Implement your Brave API logic here
    return {"message": "Brave API not implemented in this stub."}

@router.post("/llm/embedding/gemini")
async def test_gemini_embedding(req: EmbeddingRequest):
    embedding = await get_gemini_embedding(req.text)
    return {"embedding": embedding}

# You can add more embedding endpoints for OpenAI, etc.
