import httpx
from typing import Dict, Any, List
from app.core.config import settings


class SearchService:
    def __init__(self):
        self.brave_api_key = settings.brave_api_key
        self.serpapi_key = settings.serpapi_key

    async def search(self, query: str, provider: str = "brave", limit: int = 5) -> Dict[str, Any]:
        """Perform web search using specified provider"""
        if provider == "brave":
            return await self._brave_search(query, limit)
        elif provider == "serpapi":
            return await self._serpapi_search(query, limit)
        else:
            return {"error": f"Unknown search provider: {provider}"}

    async def _brave_search(self, query: str, limit: int) -> Dict[str, Any]:
        """Search using Brave Search API"""
        if not self.brave_api_key:
            return {"error": "Brave API key not configured"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.search.brave.com/res/v1/web/search",
                    headers={
                        "Accept": "application/json",
                        "X-Subscription-Token": self.brave_api_key
                    },
                    params={
                        "q": query,
                        "count": limit,
                        "search_lang": "en",
                        "country": "US"
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    results = []
                    
                    for result in data.get("web", {}).get("results", []):
                        results.append({
                            "title": result.get("title", ""),
                            "url": result.get("url", ""),
                            "description": result.get("description", ""),
                            "snippet": result.get("snippet", "")
                        })

                    return {
                        "provider": "brave",
                        "query": query,
                        "results": results,
                        "total_results": len(results)
                    }
                else:
                    return {"error": f"Brave API error: {response.status_code}"}

        except Exception as e:
            return {"error": f"Brave search error: {str(e)}"}

    async def _serpapi_search(self, query: str, limit: int) -> Dict[str, Any]:
        """Search using SerpAPI"""
        if not self.serpapi_key:
            return {"error": "SerpAPI key not configured"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://serpapi.com/search",
                    params={
                        "q": query,
                        "api_key": self.serpapi_key,
                        "engine": "google",
                        "num": limit,
                        "gl": "us",
                        "hl": "en"
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    results = []
                    
                    for result in data.get("organic_results", []):
                        results.append({
                            "title": result.get("title", ""),
                            "url": result.get("link", ""),
                            "description": result.get("snippet", ""),
                            "snippet": result.get("snippet", "")
                        })

                    return {
                        "provider": "serpapi",
                        "query": query,
                        "results": results,
                        "total_results": len(results)
                    }
                else:
                    return {"error": f"SerpAPI error: {response.status_code}"}

        except Exception as e:
            return {"error": f"SerpAPI search error: {str(e)}"}

    def get_available_providers(self) -> List[str]:
        """Get list of available search providers"""
        providers = []
        if self.brave_api_key:
            providers.append("brave")
        if self.serpapi_key:
            providers.append("serpapi")
        return providers
