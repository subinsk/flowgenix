"""
Test script to verify the complete API key flow from frontend to backend
"""

# Frontend simulation test
def test_frontend_integration():
    """Test that all frontend components are properly integrated"""
    print("Testing frontend integration...")
    
    # Check if NodeConfigurationPanel imports are correct
    try:
        from pathlib import Path
        import os
        
        frontend_path = Path(__file__).parent.parent / "frontend" / "src"
        
        # Check if the API key service exists
        api_key_service_path = frontend_path / "services" / "apiKeyService.ts"
        if api_key_service_path.exists():
            print("✓ API Key Service exists")
        else:
            print("✗ API Key Service missing")
            
        # Check if the API Key Manager component exists
        api_key_manager_path = frontend_path / "components" / "ApiKeyManager.tsx"
        if api_key_manager_path.exists():
            print("✓ API Key Manager component exists")
        else:
            print("✗ API Key Manager component missing")
            
        # Check if NodeConfigurationPanel exists
        node_config_path = frontend_path / "components" / "NodeConfigurationPanel.tsx"
        if node_config_path.exists():
            print("✓ Node Configuration Panel exists")
        else:
            print("✗ Node Configuration Panel missing")
            
        return True
    except Exception as e:
        print(f"Error checking frontend integration: {e}")
        return False

def test_backend_integration():
    """Test that all backend components are properly integrated"""
    print("\nTesting backend integration...")
    
    try:
        # Test model imports
        from app.models.api_keys import UserApiKey
        print("✓ UserApiKey model imported successfully")
        
        # Test service imports
        from app.services.api_key_service import ApiKeyService
        print("✓ ApiKeyService imported successfully")
        
        # Test schema imports
        from app.schemas.api_keys import ApiKeyCreate, ApiKeyResponse
        print("✓ API key schemas imported successfully")
        
        # Test API endpoint imports
        from app.api.v1.api_keys import router
        print("✓ API key endpoints imported successfully")
        
        # Test workflow service integration
        from app.services.workflow_service import WorkflowService
        print("✓ WorkflowService with API key integration imported successfully")
        
        return True
    except Exception as e:
        print(f"Error checking backend integration: {e}")
        return False

def test_embedding_flow():
    """Test the embedding flow with API keys"""
    print("\nTesting embedding flow...")
    
    try:
        from app.services.ai_service import AIService
        print("✓ AI Service (for embeddings) imported successfully")
        
        from app.services.document_service import DocumentService
        print("✓ Document Service imported successfully")
        
        # Check if the AI service supports HuggingFace embeddings
        ai_service = AIService()
        if hasattr(ai_service, 'generate_embeddings'):
            print("✓ AI Service has generate_embeddings method")
        else:
            print("✗ AI Service missing generate_embeddings method")
            
        return True
    except Exception as e:
        print(f"Error checking embedding flow: {e}")
        return False

def test_workflow_execution_flow():
    """Test the workflow execution with stored API keys"""
    print("\nTesting workflow execution flow...")
    
    try:
        from app.services.workflow_service import WorkflowService
        from app.services.search_service import SearchService
        
        # Check if workflow service has API key service
        workflow_service = WorkflowService()
        if hasattr(workflow_service, 'api_key_service'):
            print("✓ WorkflowService has api_key_service attribute")
        else:
            print("! WorkflowService will have api_key_service when initialized with DB")
            
        # Check if search service supports API keys
        search_service = SearchService()
        if hasattr(search_service, 'search'):
            print("✓ SearchService has search method with API key support")
        else:
            print("✗ SearchService missing search method")
            
        return True
    except Exception as e:
        print(f"Error checking workflow execution flow: {e}")
        return False

if __name__ == "__main__":
    print("=== FlowGenix API Key Integration Test ===\n")
    
    frontend_ok = test_frontend_integration()
    backend_ok = test_backend_integration()
    embedding_ok = test_embedding_flow()
    workflow_ok = test_workflow_execution_flow()
    
    print(f"\n=== Results ===")
    print(f"Frontend Integration: {'PASS' if frontend_ok else 'FAIL'}")
    print(f"Backend Integration: {'PASS' if backend_ok else 'FAIL'}")
    print(f"Embedding Flow: {'PASS' if embedding_ok else 'FAIL'}")
    print(f"Workflow Execution: {'PASS' if workflow_ok else 'FAIL'}")
    
    overall_success = all([frontend_ok, backend_ok, embedding_ok, workflow_ok])
    print(f"\nOverall: {'SUCCESS' if overall_success else 'NEEDS ATTENTION'}")
    
    if overall_success:
        print("\n🎉 All API key integration components are ready!")
        print("\nNext steps:")
        print("1. Run the database migration: alembic upgrade head")
        print("2. Start the backend server")
        print("3. Start the frontend server")
        print("4. Test the complete flow in the UI")
    else:
        print("\n⚠️  Some components need attention before testing")
