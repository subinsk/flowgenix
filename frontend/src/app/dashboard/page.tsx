'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Modal } from '../../shared/components';
import { authService } from '../../services/authService';
import { workflowService, Workflow as WorkflowType } from '../../services/workflowService';
import { useNotifications } from '../../shared/hooks';
import { FilePlus } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastModified: string;
  status: 'draft' | 'published' | 'running';
}

export default function DashboardPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotifications();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Load workflows
    loadWorkflows();
  }, [router]);

  const loadWorkflows = async () => {
    try {
      const data = await workflowService.getWorkflows();
      const formattedWorkflows: Workflow[] = data.map(w => ({
        id: w.id,
        name: w.name,
        description: w.description || 'No description',
        createdAt: new Date(w.created_at).toLocaleDateString(),
        lastModified: new Date(w.updated_at).toLocaleDateString(),
        status: 'draft' as const // Map from API status if needed
      }));
      setWorkflows(formattedWorkflows);
    } catch (error) {
      console.error('Error loading workflows:', error);
      showError('Load Error', 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) {
      showError('Name Required', 'Please enter a workflow name.');
      return;
    }

    setCreateLoading(true);
    try {
      const newWorkflowData = {
        name: newWorkflowName.trim(),
        description: newWorkflowDescription.trim() || undefined,
        nodes: [],
        edges: []
      };
      
      const createdWorkflow = await workflowService.createWorkflow(newWorkflowData);
      
      const formattedWorkflow: Workflow = {
        id: createdWorkflow.id,
        name: createdWorkflow.name,
        description: createdWorkflow.description || 'No description',
        createdAt: new Date(createdWorkflow.created_at).toLocaleDateString(),
        lastModified: new Date(createdWorkflow.updated_at).toLocaleDateString(),
        status: 'draft'
      };

      setWorkflows(prev => [formattedWorkflow, ...prev]);
      setIsCreateModalOpen(false);
      setNewWorkflowName('');
      setNewWorkflowDescription('');
      showSuccess('Workflow Created', `"${formattedWorkflow.name}" has been created successfully!`);
    } catch (error) {
      console.error('Error creating workflow:', error);
      showError('Creation Failed', 'Failed to create workflow. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-gray-900 text-white border-gray-900';
      case 'running': return 'bg-gray-700 text-white border-gray-700';
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold"
              >
                F
              </motion.div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Flowgenix</h1>
                <p className="text-sm text-muted-foreground">Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-foreground mb-2"
            >
              Your Workflows
            </motion.h2>
            <p className="text-muted-foreground">
              Create and manage your AI-powered workflows
            </p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              + Create Workflow
            </Button>
          </motion.div>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </motion.div>

        {/* Workflows Grid */}
        {filteredWorkflows.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FilePlus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? 'No workflows found' : 'No workflows yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Create your first workflow to get started'
              }
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create Your First Workflow
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow, index) => (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -2 }}
                className="bg-card border border-border rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-200 group"
                onClick={() => router.push(`/edit-stack/${workflow.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {workflow.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {workflow.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(workflow.status)}`}>
                      {workflow.status}
                    </div>
                    <motion.div 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      whileHover={{ y: -2 }}
                    >
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </motion.div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Created {workflow.createdAt}</span>
                  <span>Modified {workflow.lastModified}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Workflow Modal */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <Modal
              isOpen={isCreateModalOpen}
              onClose={() => {
                setIsCreateModalOpen(false);
                setNewWorkflowName('');
                setNewWorkflowDescription('');
              }}
              title="Create New Workflow"
              className="max-w-md"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Workflow Name *
                  </label>
                  <input
                    type="text"
                    value={newWorkflowName}
                    onChange={(e) => setNewWorkflowName(e.target.value)}
                    placeholder="Enter workflow name..."
                    className="w-full p-3 bg-input border border-border rounded-lg text-foreground 
                             focus:ring-2 focus:ring-primary focus:border-transparent 
                             transition-all duration-200 placeholder:text-muted-foreground"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={newWorkflowDescription}
                    onChange={(e) => setNewWorkflowDescription(e.target.value)}
                    placeholder="Describe what this workflow does..."
                    rows={3}
                    className="w-full p-3 bg-input border border-border rounded-lg text-foreground 
                             focus:ring-2 focus:ring-primary focus:border-transparent 
                             transition-all duration-200 placeholder:text-muted-foreground resize-none"
                  />
                </div>

                <div className="flex space-x-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setNewWorkflowName('');
                      setNewWorkflowDescription('');
                    }}
                    className="flex-1"
                    disabled={createLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWorkflow}
                    disabled={createLoading || !newWorkflowName.trim()}
                    className="flex-1"
                  >
                    {createLoading ? 'Creating...' : 'Create Workflow'}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
