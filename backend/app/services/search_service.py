import httpx
import re
from typing import Dict, Any, List
from datetime import datetime, timedelta


class SearchService:
    def __init__(self):
        # Keywords that indicate current/recent information is needed
        self.current_info_keywords = [
            "current", "latest", "recent", "today", "now", "2024", "2025", 
            "this year", "this month", "trending", "news", "breaking",
            "updated", "new", "fresh", "live", "real-time"
        ]
        
        # Keywords that indicate factual/historical information
        self.factual_keywords = [
            "what is", "who is", "when was", "where is", "how to",
            "definition", "meaning", "explain", "history of", "founded"
        ]
        
        # Keywords that indicate opinion/analysis queries
        self.analysis_keywords = [
            "best", "worst", "compare", "vs", "versus", "review",
            "opinion", "thoughts", "analysis", "pros and cons"
        ]

    def should_trigger_search(self, query: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Analyze query to determine if web search should be triggered and why
        
        Returns:
        {
            "should_search": bool,
            "confidence": float,  # 0.0-1.0
            "reasoning": str,
            "search_type": str,  # "current_info", "factual", "analysis", "general"
            "suggested_query": str
        }
        """
        query_lower = query.lower()
        
        # Initialize scoring
        search_score = 0.0
        reasoning_parts = []
        search_type = "general"
        
        # Check for current information needs (high priority)
        current_matches = sum(1 for keyword in self.current_info_keywords if keyword in query_lower)
        if current_matches > 0:
            search_score += 0.8
            search_type = "current_info"
            reasoning_parts.append(f"Query contains {current_matches} current info indicators")
        
        # Check for factual information needs
        factual_matches = sum(1 for keyword in self.factual_keywords if keyword in query_lower)
        if factual_matches > 0:
            search_score += 0.6
            if search_type == "general":
                search_type = "factual"
            reasoning_parts.append(f"Query contains {factual_matches} factual indicators")
        
        # Check for analysis/comparison needs
        analysis_matches = sum(1 for keyword in self.analysis_keywords if keyword in query_lower)
        if analysis_matches > 0:
            search_score += 0.7
            if search_type == "general":
                search_type = "analysis"
            reasoning_parts.append(f"Query contains {analysis_matches} analysis indicators")
        
        # Check for specific entities/companies/products (medium priority)
        entity_patterns = [
            r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',  # Proper names
            r'\b[A-Z]{2,}\b',  # Acronyms
            r'\$[A-Z]+\b',  # Stock symbols
        ]
        
        entity_matches = 0
        for pattern in entity_patterns:
            entity_matches += len(re.findall(pattern, query))
        
        if entity_matches > 0:
            search_score += 0.5
            reasoning_parts.append(f"Query contains {entity_matches} potential entities")
        
        # Check for question patterns
        question_patterns = [
            r'\?',  # Direct questions
            r'\bwhat\b', r'\bwho\b', r'\bwhen\b', r'\bwhere\b', r'\bhow\b', r'\bwhy\b'
        ]
        
        question_matches = sum(1 for pattern in question_patterns if re.search(pattern, query_lower))
        if question_matches > 0:
            search_score += 0.4
            reasoning_parts.append(f"Query has question format")
        
        # Penalize very general or conversational queries
        general_patterns = [
            r'\bhello\b', r'\bhi\b', r'\bthanks\b', r'\bthank you\b',
            r'\byes\b', r'\bno\b', r'\bokay\b', r'\bok\b'
        ]
        
        general_matches = sum(1 for pattern in general_patterns if re.search(pattern, query_lower))
        if general_matches > 0:
            search_score -= 0.3
            reasoning_parts.append(f"Query appears conversational")
        
        # Cap the score and determine final decision
        search_score = min(search_score, 1.0)
        should_search = search_score >= 0.5
        
        # Generate optimized search query
        suggested_query = self._optimize_search_query(query, search_type)
        
        reasoning = "; ".join(reasoning_parts) if reasoning_parts else "General query analysis"
        
        return {
            "should_search": should_search,
            "confidence": search_score,
            "reasoning": reasoning,
            "search_type": search_type,
            "suggested_query": suggested_query
        }

    def _optimize_search_query(self, query: str, search_type: str) -> str:
        """Optimize the search query based on the type of search needed"""
        query = query.strip()
        
        if search_type == "current_info":
            # Add temporal context for current info
            if not any(word in query.lower() for word in ["2024", "2025", "recent", "latest"]):
                query += " 2024"
        
        elif search_type == "factual":
            # Clean up conversational elements for factual queries
            query = re.sub(r'\b(please|can you|could you|tell me|explain)\b', '', query, flags=re.IGNORECASE)
            query = re.sub(r'\s+', ' ', query).strip()
        
        elif search_type == "analysis":
            # Add comparative context
            if "compare" not in query.lower() and ("vs" in query.lower() or "versus" in query.lower()):
                query = "compare " + query
        
        return query

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

    def analyze_search_results_quality(self, results: List[Dict[str, Any]], query: str) -> Dict[str, Any]:
        """
        Analyze the quality and relevance of search results
        
        Returns:
        {
            "overall_quality": float,  # 0.0-1.0
            "relevance_scores": List[float],
            "best_result_index": int,
            "quality_assessment": str
        }
        """
        if not results:
            return {
                "overall_quality": 0.0,
                "relevance_scores": [],
                "best_result_index": -1,
                "quality_assessment": "No search results found"
            }
        
        query_words = set(query.lower().split())
        relevance_scores = []
        
        for result in results:
            score = 0.0
            title = result.get("title", "").lower()
            snippet = result.get("snippet", "").lower()
            url = result.get("url", "").lower()
            
            # Title relevance (weighted heavily)
            title_words = set(title.split())
            title_overlap = len(query_words.intersection(title_words)) / max(len(query_words), 1)
            score += title_overlap * 0.5
            
            # Snippet relevance
            snippet_words = set(snippet.split())
            snippet_overlap = len(query_words.intersection(snippet_words)) / max(len(query_words), 1)
            score += snippet_overlap * 0.3
            
            # Domain authority heuristics (basic)
            authoritative_domains = [
                "wikipedia.org", "edu", "gov", "org", "reuters.com", 
                "bbc.com", "cnn.com", "nytimes.com", "wsj.com"
            ]
            
            if any(domain in url for domain in authoritative_domains):
                score += 0.2
            
            # Length and quality indicators
            if len(snippet) > 50:  # Substantial content
                score += 0.1
            
            if any(word in snippet for word in ["according to", "research", "study", "data"]):
                score += 0.1
            
            relevance_scores.append(min(score, 1.0))
        
        overall_quality = sum(relevance_scores) / len(relevance_scores)
        best_result_index = relevance_scores.index(max(relevance_scores)) if relevance_scores else -1
        
        # Quality assessment
        if overall_quality >= 0.7:
            assessment = "High quality results with strong relevance"
        elif overall_quality >= 0.5:
            assessment = "Good quality results with moderate relevance"
        elif overall_quality >= 0.3:
            assessment = "Fair quality results with some relevance"
        else:
            assessment = "Low quality results with limited relevance"
        
        return {
            "overall_quality": overall_quality,
            "relevance_scores": relevance_scores,
            "best_result_index": best_result_index,
            "quality_assessment": assessment
        }

    def format_search_results_for_llm(self, results: List[Dict[str, Any]], search_analysis: Dict[str, Any] = None, max_results: int = 5) -> str:
        """
        Format search results optimally for LLM consumption based on search type and quality
        """
        if not results:
            return "No relevant search results found."
        
        # Analyze result quality
        quality_analysis = self.analyze_search_results_quality(results, search_analysis.get("suggested_query", "") if search_analysis else "")
        
        # Limit to best results
        limited_results = results[:max_results]
        
        search_type = search_analysis.get("search_type", "general") if search_analysis else "general"
        
        if search_type == "current_info":
            formatted = "📅 CURRENT INFORMATION (Latest Web Results):\n\n"
            for i, result in enumerate(limited_results):
                relevance = quality_analysis["relevance_scores"][i] if i < len(quality_analysis["relevance_scores"]) else 0.5
                relevance_indicator = "🔥" if relevance > 0.7 else "⭐" if relevance > 0.5 else "📝"
                formatted += f"{relevance_indicator} **{result.get('title', 'Untitled')}**\n"
                formatted += f"   Source: {result.get('url', 'No URL')}\n"
                formatted += f"   Content: {result.get('snippet', 'No snippet available')}\n\n"
        
        elif search_type == "factual":
            formatted = "📚 FACTUAL INFORMATION (Verified Sources):\n\n"
            for i, result in enumerate(limited_results):
                formatted += f"**Source {i+1}: {result.get('title', 'Untitled')}**\n"
                formatted += f"   Reference: {result.get('url', 'No URL')}\n"
                formatted += f"   Information: {result.get('snippet', 'No content available')}\n\n"
        
        elif search_type == "analysis":
            formatted = "🔍 COMPARATIVE ANALYSIS (Multiple Perspectives):\n\n"
            for i, result in enumerate(limited_results):
                formatted += f"**Perspective {i+1}: {result.get('title', 'Untitled')}**\n"
                formatted += f"   Source: {result.get('url', 'No URL')}\n"
                formatted += f"   Analysis: {result.get('snippet', 'No analysis available')}\n\n"
        
        else:
            formatted = "🌐 WEB SEARCH RESULTS:\n\n"
            for i, result in enumerate(limited_results):
                formatted += f"**Result {i+1}: {result.get('title', 'Untitled')}**\n"
                formatted += f"   URL: {result.get('url', 'No URL')}\n"
                formatted += f"   Summary: {result.get('snippet', 'No summary available')}\n\n"
        
        # Add quality footer
        formatted += f"\n📊 Search Quality: {quality_analysis['quality_assessment']}"
        
        return formatted
