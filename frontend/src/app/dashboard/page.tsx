'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { workflowService } from '@/services';
import { FilePlus } from 'lucide-react';
import { useNotifications } from '@/hooks';
import { STATUS_MAP } from '@/constants';
import { CreateWorkflowModal, DashboardHeader } from '@/sections';
import { DashboardWorkflow, WorkflowStatus } from '@/types';


export default function DashboardPage() {
  // hooks
  const router = useRouter();
  const { showError } = useNotifications();

  // states
  const [workflows, setWorkflows] = useState<DashboardWorkflow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)

  // effects
  useEffect(() => {
    loadWorkflows();
  }, [router]);

  // functions
  const loadWorkflows = async () => {
    try {
      const data = await workflowService.getWorkflows();
      const formattedWorkflows: DashboardWorkflow[] = data.map(w => ({
        id: w.id,
        name: w.name,
        description: w.description || 'No description',
        createdAt: new Date(w.created_at).toLocaleDateString(),
        updatedAt: new Date(w.updated_at).toLocaleDateString(),
        status: w.status ?? 'unknown'
      }));

      setWorkflows(formattedWorkflows);
    } catch (error) {
      showError('Load Error', 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
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
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_MAP[workflow.status]?.color ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {STATUS_MAP[workflow.status]?.label ?? workflow.status}
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
                  <span>Modified {workflow.updatedAt}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <CreateWorkflowModal isCreateModalOpen={isCreateModalOpen} setIsCreateModalOpen={setIsCreateModalOpen} setWorkflows={setWorkflows} />
    </div>
  );
}
