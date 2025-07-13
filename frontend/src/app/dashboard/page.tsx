'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Separator } from '@/components/ui';
import { workflowService } from '@/services';
import { FilePlus } from 'lucide-react';
import { useNotifications } from '@/hooks';
import { STATUS_MAP } from '@/constants';
import { CreateWorkflowModal, DashboardHeader } from '@/sections';
import { DashboardWorkflow, WorkflowStatus } from '@/types';
import { PlusIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';


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

      <main className="max-w-7xl mx-auto px-[51px] py-8 bg-muted min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div className="mb-4 md:mb-0">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-foreground mb-2"
            >
              My Stacks
            </motion.h2>
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
              <PlusIcon className="w-6 h-6" />
              New Stack
            </Button>
          </motion.div>
        </div>
        <Separator />
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="my-6"
        >
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </motion.div> */}
        {filteredWorkflows.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col max-w-md mx-auto mt-32 bg-white rounded-2xl px-10 py-8 border"
          >
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {searchQuery ? 'No stacks found' : 'Create New Stack'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Start building your generative AI apps with our essential tools and frameworks'
              }
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 max-w-[124px]"
              >
                <PlusIcon /> New Stack
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-9">
            {filteredWorkflows.map((workflow, index) => (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -2 }}
                className="bg-card border border-border rounded-2xl px-7 py-8 transition-all duration-200 group"
              >
                <div className="flex flex-col space-y-10">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">
                      {workflow.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {workflow.description}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      className="text-black hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/edit-stack/${workflow.id}`);
                      }}
                    >
                      Edit Stack
                      <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <CreateWorkflowModal isModalOpen={isCreateModalOpen} setIsModalOpen={setIsCreateModalOpen} setWorkflows={setWorkflows} />
    </div>
  );
}
