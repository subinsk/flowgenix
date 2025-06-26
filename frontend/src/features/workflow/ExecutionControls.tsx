import React from 'react';
import { motion } from 'framer-motion';
import { useWorkflowStore } from '../../store/workflow';
import { useUIStore } from '../../store/ui';
import { useNotifications } from '../../shared/hooks';
import { Button } from '../../shared/components';
import { ANIMATIONS } from '../../shared/constants';

interface ExecutionControlsProps {
  className?: string;
  onBuildStack?: () => Promise<void>;
  onChatWithStack?: () => Promise<void>;
}

const ExecutionControls: React.FC<ExecutionControlsProps> = ({
  className = '',
  onBuildStack,
  onChatWithStack,
}) => {
  const { 
    nodes, 
    edges, 
    isBuilding, 
    isChatting, 
    lastBuildTime,
    setIsBuilding,
    setIsChatting,
  } = useWorkflowStore();
  
  const { setGlobalLoading } = useUIStore();
  const { showSuccess, showError } = useNotifications();

  const isWorkflowValid = nodes.length > 0 && edges.length > 0;
  const hasUserQuery = nodes.some(node => node.data?.type === 'user-query');
  const hasOutput = nodes.some(node => node.data?.type === 'output');

  const handleBuildStack = async () => {
    if (!isWorkflowValid) {
      showError('Invalid Workflow', 'Please add components and connect them to build a workflow.');
      return;
    }

    if (!hasUserQuery) {
      showError('Missing User Query', 'Your workflow needs a User Query component.');
      return;
    }

    if (!hasOutput) {
      showError('Missing Output', 'Your workflow needs an Output component.');
      return;
    }

    setIsBuilding(true);
    setGlobalLoading(true, 'Building workflow stack...');

    try {
      await onBuildStack?.();
      showSuccess('Workflow Built', 'Your workflow stack has been built successfully!');
    } catch (error) {
      showError('Build Failed', error instanceof Error ? error.message : 'Failed to build workflow');
    } finally {
      setIsBuilding(false);
      setGlobalLoading(false);
    }
  };

  const handleChatWithStack = async () => {
    if (!lastBuildTime) {
      showError('Workflow Not Built', 'Please build the workflow stack first.');
      return;
    }

    setIsChatting(true);
    setGlobalLoading(true, 'Starting chat session...');

    try {
      await onChatWithStack?.();
      showSuccess('Chat Started', 'Chat session is now active!');
    } catch (error) {
      showError('Chat Failed', error instanceof Error ? error.message : 'Failed to start chat');
    } finally {
      setIsChatting(false);
      setGlobalLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={ANIMATIONS.SPRING_SMOOTH}
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Execution Controls
        </h3>
        {lastBuildTime && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Last built: {lastBuildTime.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Workflow Status */}
        <div className="text-sm">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-gray-600 dark:text-gray-400">Workflow Status:</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isWorkflowValid 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
            }`}>
              {isWorkflowValid ? '✓ Valid' : '⚠ Incomplete'}
            </span>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex items-center space-x-2">
              <span className={nodes.length > 0 ? 'text-green-600' : 'text-gray-400'}>
                {nodes.length > 0 ? '✓' : '○'}
              </span>
              <span>Components: {nodes.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={edges.length > 0 ? 'text-green-600' : 'text-gray-400'}>
                {edges.length > 0 ? '✓' : '○'}
              </span>
              <span>Connections: {edges.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={hasUserQuery ? 'text-green-600' : 'text-gray-400'}>
                {hasUserQuery ? '✓' : '○'}
              </span>
              <span>User Query Component</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={hasOutput ? 'text-green-600' : 'text-gray-400'}>
                {hasOutput ? '✓' : '○'}
              </span>
              <span>Output Component</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="primary"
            size="md"
            loading={isBuilding}
            disabled={!isWorkflowValid || isBuilding || isChatting}
            onClick={handleBuildStack}
            icon="🔧"
            className="flex-1"
          >
            {isBuilding ? 'Building...' : 'Build Stack'}
          </Button>

          <Button
            variant="secondary"
            size="md"
            loading={isChatting}
            disabled={!lastBuildTime || isBuilding || isChatting}
            onClick={handleChatWithStack}
            icon="💬"
            className="flex-1"
          >
            {isChatting ? 'Starting...' : 'Chat with Stack'}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-md p-2">
          <p className="mb-1"><strong>Build Stack:</strong> Processes and validates your workflow</p>
          <p><strong>Chat with Stack:</strong> Start an interactive session with your workflow</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ExecutionControls;
