import httpx
from typing import Optional, Dict, Any
from app.core.config import settings


class AIService:
    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    async def generate_response(self, prompt: str, model: str = "gemini-pro") -> str:
        """Generate AI response using Gemini API"""
        if not self.api_key:
            return "AI service not configured"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/models/{model}:generateContent",
                    params={"key": self.api_key},
                    json={
                        "contents": [{
                            "parts": [{"text": prompt}]
                        }]
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                else:
                    return f"AI service error: {response.status_code}"
                    
        except Exception as e:
            return f"AI service error: {str(e)}"

    async def generate_embeddings(self, text: str, model: str = "embedding-001") -> Optional[list]:
        """Generate embeddings for text"""
        if not self.api_key:
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/models/{model}:embedContent",
                    params={"key": self.api_key},
                    json={
                        "content": {
                            "parts": [{"text": text}]
                        }
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["embedding"]["values"]
                else:
                    return None
                    
        except Exception as e:
            return None

    async def analyze_document(self, text: str) -> Dict[str, Any]:
        """Analyze document content"""
        prompt = f"""
        Analyze the following document and provide:
        1. A brief summary
        2. Key topics/themes
        3. Important entities mentioned
        4. Main insights

        Document:
        {text[:2000]}...
        """
        
        response = await self.generate_response(prompt)
        return {
            "analysis": response,
            "length": len(text),
            "processed_at": "now"
        }
