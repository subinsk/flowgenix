from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.api_keys import ApiKeyCreate, ApiKeyUpdate, ApiKeyResponse, ApiKeysListResponse
from app.services.api_key_service import ApiKeyService
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


@router.post("/", response_model=ApiKeyResponse)
async def create_or_update_api_key(
    api_key_data: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update an API key for the current user"""
    api_key_service = ApiKeyService(db)
    try:
        return api_key_service.create_api_key(str(current_user.id), api_key_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create/update API key: {str(e)}"
        )


@router.get("/", response_model=ApiKeysListResponse)
async def get_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all API keys for the current user (without actual key values)"""
    api_key_service = ApiKeyService(db)
    api_keys = api_key_service.get_api_keys(str(current_user.id))
    return ApiKeysListResponse(api_keys=api_keys)


@router.get("/{key_name}/value")
async def get_api_key_value(
    key_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the decrypted value of a specific API key (for internal use)"""
    api_key_service = ApiKeyService(db)
    api_key = api_key_service.get_decrypted_api_key(str(current_user.id), key_name)
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API key '{key_name}' not found"
        )
    
    return {"key_name": key_name, "api_key": api_key}


@router.put("/{key_name}", response_model=ApiKeyResponse)
async def update_api_key(
    key_name: str,
    api_key_data: ApiKeyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing API key"""
    api_key_service = ApiKeyService(db)
    updated_key = api_key_service.update_api_key(str(current_user.id), key_name, api_key_data)
    
    if not updated_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API key '{key_name}' not found"
        )
    
    return updated_key


@router.delete("/{key_name}")
async def delete_api_key(
    key_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an API key"""
    api_key_service = ApiKeyService(db)
    success = api_key_service.delete_api_key(str(current_user.id), key_name)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API key '{key_name}' not found"
        )
    
    return {"message": f"API key '{key_name}' deleted successfully"}
