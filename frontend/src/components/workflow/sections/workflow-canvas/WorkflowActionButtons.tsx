'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { Play, MessageCircle } from 'lucide-react';

interface WorkflowActionButtonsProps {
  isBuilding: boolean;
  onBuild: () => void;
  onChat: () => void;
}

export default function WorkflowActionButtons({
  isBuilding,
  onBuild,
  onChat
}: WorkflowActionButtonsProps) {
  return (
    <div className="absolute bottom-6 right-6 flex gap-2 z-20">
      <Button
        size="sm"
        variant="outline"
        onClick={onBuild}
        disabled={isBuilding}
        className="p-2 w-auto px-3"
      >
        {isBuilding ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
        ) : (
          <Play className="w-4 h-4" />
        )}
        <span className="ml-1">Build</span>
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onChat}
        disabled={false} // Always enabled
        className="p-2 w-auto px-3"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="ml-1">Chat</span>
      </Button>
    </div>
  );
}
