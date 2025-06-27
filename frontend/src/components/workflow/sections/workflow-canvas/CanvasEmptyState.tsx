'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

interface CanvasEmptyStateProps {
  isDraggingOver: boolean;
}

export default function CanvasEmptyState({ isDraggingOver }: CanvasEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isDraggingOver ? 0.5 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
    >
      <div className="text-center bg-white px-8 py-10 rounded-lg border shadow-sm">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Start Building Your Workflow</h3>
        <p className="text-muted-foreground mb-4">
          Drag components from the sidebar to create your AI workflow
        </p>
        <p className="text-sm text-muted-foreground">
          Connect components by dragging from one node to another
        </p>
      </div>
    </motion.div>
  );
}
