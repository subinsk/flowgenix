import httpx
from typing import Dict, Any, List


class SearchService:
    async def search(self, query: str, provider: str = "brave", num_results: int = 5, api_key: str = None) -> List[Dict[str, Any]]:
        """Perform web search using specified provider and return results list"""
        search_result = await self._search_internal(query, provider, num_results, api_key)
        
        if "error" in search_result:
            return []
        
        return search_result.get("results", [])

    async def _search_internal(self, query: str, provider: str = "brave", limit: int = 5, api_key: str = None) -> Dict[str, Any]:
        """Internal search method that returns full response"""
        if provider == "brave":
            return await self._brave_search(query, limit, api_key)
        elif provider == "serpapi":
            return await self._serpapi_search(query, limit, api_key)
        else:
            return {"error": f"Unknown search provider: {provider}"}

    async def _brave_search(self, query: str, limit: int, api_key: str = None) -> Dict[str, Any]:
        """Search using Brave Search API"""
        if not api_key:
            return {"error": "Brave API key not provided in node data"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.search.brave.com/res/v1/web/search",
                    headers={
                        "Accept": "application/json",
                        "X-Subscription-Token": api_key
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

    async def _serpapi_search(self, query: str, limit: int, api_key: str = None) -> Dict[str, Any]:
        """Search using SerpAPI"""
        if not api_key:
            return {"error": "SerpAPI key not provided in node data"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://serpapi.com/search",
                    params={
                        "q": query,
                        "api_key": api_key,
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

    def get_available_providers(self, brave_api_key: str = None, serpapi_key: str = None) -> List[str]:
        """Get list of available search providers based on provided keys"""
        providers = []
        if brave_api_key:
            providers.append("brave")
        if serpapi_key:
            providers.append("serpapi")
        return providers
