'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { Icon as Iconify } from '@iconify/react'

interface WorkflowActionButtonsProps {
  isBuilding: boolean;
  hasUnsavedChanges: boolean;
  onBuild: () => void;
  onChat: () => void;
}

export default function WorkflowActionButtons({
  isBuilding,
  hasUnsavedChanges,
  onBuild,
  onChat
}: WorkflowActionButtonsProps) {
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
      <Button
        size="sm"
        variant="default"
        onClick={onBuild}
        disabled={isBuilding}
        className={`w-14 h-14 p-1 rounded-full bg-primary relative ${hasUnsavedChanges ? '' : ''}`}
      >
        {isBuilding ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className=""
          />
        ) : (
          <Iconify icon="ph:play-fill" style={{ width: '32px', height: '32px' }} />
        )}
        {hasUnsavedChanges && !isBuilding && (
          <span className="absolute top-0 left-0 w-4 h-4 bg-orange-500 rounded-full animate-pulse"></span>
        )}
      </Button>
      <Button
        size="sm"
        variant="default"
        onClick={onChat}
        disabled={false}
        className="w-14 h-14 rounded-full relative bg-[#2563EB] hover:bg-[#2563EB]/80"
      >
        <Iconify icon="heroicons-solid:chat" style={{ width: '32px', height: '32px' }} />
      </Button>
    </div>
  );
}
