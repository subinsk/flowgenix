'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { Icon as Iconify } from '@iconify/react';

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
      <div className="text-center px-8 py-10">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
          <Iconify icon="tabler:drag-drop" className='w-8 h-8 text-primary'/>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Drag & drop to get started</h3>
      </div>
    </motion.div>
  );
}
