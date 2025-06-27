#!/usr/bin/env python3
"""
End-to-end test script for the FlowGenix workflow system.
This script tests the complete workflow: create, build, and execute.
"""

import asyncio
import httpx
import json
from typing import Dict, Any

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpassword123"

class WorkflowE2ETest:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=API_BASE_URL)
        self.auth_token = None
        self.workflow_id = None

    async def setup(self):
        """Setup test user and authentication"""
        print("🔧 Setting up test environment...")
        
        # Try to login, if fails, register first
        try:
            login_response = await self.client.post("/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            
            if login_response.status_code == 200:
                data = login_response.json()
                self.auth_token = data["access_token"]
                print("✅ Successfully logged in")
            else:
                # Try to register
                register_response = await self.client.post("/auth/register", json={
                    "email": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD,
                    "name": "Test User"
                })
                
                if register_response.status_code == 201:
                    print("✅ Successfully registered new user")
                    # Now login
                    login_response = await self.client.post("/auth/login", json={
                        "email": TEST_USER_EMAIL,
                        "password": TEST_USER_PASSWORD
                    })
                    data = login_response.json()
                    self.auth_token = data["access_token"]
                    print("✅ Successfully logged in after registration")
                else:
                    print("❌ Failed to register user")
                    return False
                    
        except Exception as e:
            print(f"❌ Authentication failed: {e}")
            return False
        
        # Set auth header
        self.client.headers.update({"Authorization": f"Bearer {self.auth_token}"})
        return True

    async def test_create_workflow(self):
        """Test workflow creation"""
        print("📝 Testing workflow creation...")
        
        workflow_data = {
            "name": "Test E2E Workflow",
            "description": "End-to-end test workflow with LLM processing",
            "nodes": [
                {
                    "id": "user-query-1",
                    "type": "userQuery",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "label": "User Query",
                        "configuration": {
                            "query": "What are the main benefits of artificial intelligence?",
                            "queryType": "general"
                        }
                    }
                },
                {
                    "id": "llm-engine-1",
                    "type": "llmEngine",
                    "position": {"x": 400, "y": 100},
                    "data": {
                        "label": "LLM Engine",
                        "configuration": {
                            "model": "gpt-3.5-turbo",
                            "temperature": 0.7,
                            "maxTokens": 500,
                            "systemPrompt": "You are a helpful AI assistant. Provide clear, informative responses."
                        }
                    }
                },
                {
                    "id": "output-1",
                    "type": "output",
                    "position": {"x": 700, "y": 100},
                    "data": {
                        "label": "Output",
                        "configuration": {
                            "format": "text",
                            "includeMetadata": False
                        }
                    }
                }
            ],
            "edges": [
                {
                    "id": "edge-1",
                    "source": "user-query-1",
                    "target": "llm-engine-1"
                },
                {
                    "id": "edge-2",
                    "source": "llm-engine-1",
                    "target": "output-1"
                }
            ]
        }
        
        try:
            response = await self.client.post("/workflows/", json=workflow_data)
            
            if response.status_code == 200:
                data = response.json()
                self.workflow_id = data["id"]
                print(f"✅ Successfully created workflow: {self.workflow_id}")
                return True
            else:
                print(f"❌ Failed to create workflow: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error creating workflow: {e}")
            return False

    async def test_build_workflow(self):
        """Test workflow build/validation"""
        print("🔨 Testing workflow build...")
        
        if not self.workflow_id:
            print("❌ No workflow ID available")
            return False
        
        # Get the workflow to get current nodes/edges
        workflow_response = await self.client.get(f"/workflows/{self.workflow_id}")
        if workflow_response.status_code != 200:
            print("❌ Failed to fetch workflow for building")
            return False
        
        workflow_data = workflow_response.json()
        
        build_data = {
            "nodes": workflow_data["nodes"],
            "edges": workflow_data["edges"]
        }
        
        try:
            response = await self.client.post(f"/workflows/{self.workflow_id}/build", json=build_data)
            
            if response.status_code == 200:
                data = response.json()
                if data["success"]:
                    print("✅ Successfully built workflow")
                    print(f"   Execution plan created: {bool(data.get('execution_plan'))}")
                    return True
                else:
                    print(f"❌ Build failed: {data['message']}")
                    if data.get("errors"):
                        for error in data["errors"]:
                            print(f"   - {error}")
                    return False
            else:
                print(f"❌ Build request failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error building workflow: {e}")
            return False

    async def test_execute_workflow(self):
        """Test workflow execution"""
        print("🚀 Testing workflow execution...")
        
        if not self.workflow_id:
            print("❌ No workflow ID available")
            return False
        
        execute_data = {
            "query": "Explain the key advantages of using AI in modern businesses, focusing on efficiency and innovation."
        }
        
        try:
            response = await self.client.post(f"/workflows/{self.workflow_id}/execute", json=execute_data)
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Successfully executed workflow")
                print(f"   Execution ID: {data['execution_id']}")
                print(f"   Status: {data['status']}")
                
                if data.get("result") and data["result"].get("result"):
                    result_text = data["result"]["result"]
                    print(f"   Result preview: {result_text[:200]}...")
                    return True
                else:
                    print("   No result content returned")
                    return False
            else:
                print(f"❌ Execution failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error executing workflow: {e}")
            return False

    async def test_get_executions(self):
        """Test getting workflow executions"""
        print("📊 Testing execution history retrieval...")
        
        if not self.workflow_id:
            print("❌ No workflow ID available")
            return False
        
        try:
            response = await self.client.get(f"/workflows/{self.workflow_id}/executions")
            
            if response.status_code == 200:
                executions = response.json()
                print(f"✅ Successfully retrieved {len(executions)} executions")
                
                if executions:
                    latest = executions[0]
                    print(f"   Latest execution: {latest['status']} - {latest.get('input_query', 'N/A')[:50]}...")
                
                return True
            else:
                print(f"❌ Failed to get executions: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error getting executions: {e}")
            return False

    async def cleanup(self):
        """Cleanup test resources"""
        print("🧹 Cleaning up...")
        
        if self.workflow_id:
            try:
                response = await self.client.delete(f"/workflows/{self.workflow_id}")
                if response.status_code == 200:
                    print("✅ Successfully deleted test workflow")
                else:
                    print(f"⚠️  Failed to delete workflow: {response.status_code}")
            except Exception as e:
                print(f"⚠️  Error deleting workflow: {e}")
        
        await self.client.aclose()

    async def run_full_test(self):
        """Run the complete end-to-end test"""
        print("🎯 Starting FlowGenix End-to-End Test")
        print("=" * 50)
        
        success = True
        
        # Setup
        if not await self.setup():
            return False
        
        # Test workflow creation
        if not await self.test_create_workflow():
            success = False
        
        # Test workflow building
        if success and not await self.test_build_workflow():
            success = False
        
        # Test workflow execution
        if success and not await self.test_execute_workflow():
            success = False
        
        # Test execution history
        if success and not await self.test_get_executions():
            success = False
        
        # Cleanup
        await self.cleanup()
        
        print("=" * 50)
        if success:
            print("🎉 All tests passed! End-to-end workflow is working correctly.")
        else:
            print("❌ Some tests failed. Please check the logs above.")
        
        return success


async def main():
    """Main test function"""
    test = WorkflowE2ETest()
    success = await test.run_full_test()
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
