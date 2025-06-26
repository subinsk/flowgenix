from fastapi import APIRouter, Depends
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/providers")
async def get_search_providers():
    """Get available search providers"""
    search_service = SearchService()
    providers = search_service.get_available_providers()
    
    return {
        "providers": providers,
        "default": "brave" if "brave" in providers else providers[0] if providers else None
    }


@router.post("/")
async def search_web(
    query: str,
    provider: str = "brave",
    limit: int = 5
):
    """Perform web search"""
    search_service = SearchService()
    results = await search_service.search(query, provider, limit)
    
    return results
