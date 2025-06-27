import httpx
from typing import Optional, Dict, Any, List


class AIService:
    def __init__(self):
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.openai_base_url = "https://api.openai.com/v1"

    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        model: str = "gemini-pro",
        temperature: float = 0.7,
        max_tokens: int = 1000,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate AI response using Gemini or OpenAI API"""
        
        # Handle OpenAI models
        if model.startswith("gpt-"):
            return await self._generate_openai_response(messages, model, temperature, max_tokens, api_key=api_key)
        
        # Handle Gemini models
        return await self._generate_gemini_response(messages, model, temperature, max_tokens, api_key=api_key)

    async def _generate_openai_response(
        self, 
        messages: List[Dict[str, str]], 
        model: str,
        temperature: float,
        max_tokens: int,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate response using OpenAI API"""
        key = api_key
        if not key:
            return {"content": "OpenAI API key not configured", "model": model}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.openai_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "content": data["choices"][0]["message"]["content"],
                        "model": model,
                        "usage": data.get("usage", {})
                    }
                else:
                    return {"content": f"OpenAI API error: {response.status_code}", "model": model}
                    
        except Exception as e:
            return {"content": f"OpenAI API error: {str(e)}", "model": model}

    async def _generate_gemini_response(
        self, 
        messages: List[Dict[str, str]], 
        model: str,
        temperature: float,
        max_tokens: int,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate response using Gemini API"""
        key = api_key
        if not key:
            return {"content": "Gemini API key not configured", "model": model}

        # Convert messages to Gemini format
        prompt = self._convert_messages_to_prompt(messages)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/models/{model}:generateContent",
                    params={"key": key},
                    json={
                        "contents": [{
                            "parts": [{"text": prompt}]
                        }],
                        "generationConfig": {
                            "temperature": temperature,
                            "maxOutputTokens": max_tokens
                        }
                    }
                )
                
                print('response', response.json())
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "content": data["candidates"][0]["content"]["parts"][0]["text"],
                        "model": model
                    }
                else:
                    return {"content": f"Gemini API error: {response.status_code}", "model": model}
                    
        except Exception as e:
            return {"content": f"Gemini API error: {str(e)}", "model": model}

    def _convert_messages_to_prompt(self, messages: List[Dict[str, str]]) -> str:
        """Convert OpenAI-style messages to a single prompt for Gemini"""
        prompt_parts = []
        
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            
            if role == "system":
                prompt_parts.append(f"System: {content}")
            elif role == "user":
                prompt_parts.append(f"User: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")
        
        return "\n\n".join(prompt_parts)

    async def generate_simple_response(self, prompt: str, model: str = "gemini-pro", api_key: Optional[str] = None) -> str:
        """Generate AI response with simple prompt (backward compatibility)"""
        messages = [{"role": "user", "content": prompt}]
        response = await self.generate_response(messages, model, api_key=api_key)
        return response.get("content", "No response generated")

    async def generate_embeddings(self, text: str, model: str = "text-embedding-ada-002", api_key: Optional[str] = None) -> Optional[list]:
        """Generate embeddings for text, supporting OpenAI, Gemini, and Hugging Face MiniLM."""
        if model == "all-MiniLM-L6-v2":
            # Hugging Face Inference API
            if not api_key:
                return None
            url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
            headers = {"Authorization": f"Bearer {api_key}"}
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(url, headers=headers, json={"inputs": text})
                    if response.status_code == 200:
                        data = response.json()
                        # Hugging Face returns [ [embedding floats] ]
                        if isinstance(data, list) and isinstance(data[0], list):
                            return data[0]
                        return data
                    else:
                        print(f"Hugging Face API error: {response.status_code}", response.text)
                        return None
            except Exception as e:
                print(f"Hugging Face API error: {str(e)}")
                return None
        # TODO: Add OpenAI and Gemini embedding logic as needed
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
        
        response = await self.generate_simple_response(prompt)
        return {
            "analysis": response,
            "length": len(text),
            "processed_at": "now"
        }
