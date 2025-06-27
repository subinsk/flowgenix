import asyncio
from app.services.document_service import DocumentService
from app.core.database import get_db

async def test_chroma():
    doc_service = DocumentService(next(get_db()))
    try:
        collection = doc_service._get_or_create_collection()
        all_docs = collection.get()
        print('All documents in ChromaDB:')
        print(f'Count: {len(all_docs["documents"]) if all_docs["documents"] else 0}')
        if all_docs['metadatas']:
            for i, meta in enumerate(all_docs['metadatas']):
                print(f'  {i}: {meta}')
        
        # Test workflow-specific query
        workflow_docs = collection.get(where={"workflow_id": "ef19e198-16e5-4c7e-af77-29e4ecd72497"})
        print(f'\nWorkflow-specific documents: {len(workflow_docs["documents"]) if workflow_docs["documents"] else 0}')
        if workflow_docs['metadatas']:
            for i, meta in enumerate(workflow_docs['metadatas']):
                print(f'  {i}: {meta}')
                
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_chroma())
