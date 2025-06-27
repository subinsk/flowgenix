import React, { useState, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Eye, EyeOff, Trash2, Settings, MessageSquare, BookOpen, Brain, Monitor, AlertCircle } from 'lucide-react';
import { NodeWrapperProps } from '@/types';
import { Button } from '@/components/ui/button';

export const NodeWrapper: React.FC<NodeWrapperProps> = ({ 
  children, 
  type, 
  selected, 
  hasSource = true, 
  hasTarget = true,
  onSettings,
  onDelete,
  id,
  validationErrors = []
}) => {
  const hasErrors = validationErrors.length > 0;

  const handleSettings = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSettings?.();
  }, [onSettings]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.(id);
  }, [onDelete, id]);

  return (
    <div className={`min-w-[280px] bg-card border-1 rounded-lg shadow-lg transition-all duration-200 relative ${
      hasErrors 
        ? 'border-red-500 shadow-red-500/20' 
        : selected 
          ? 'border-primary shadow-primary/20' 
          : 'border-border hover:border-border-hover'
    }`}>
      {hasTarget && <Handle type="target" position={Position.Left} className="w-3 h-3 bg-primary" />}
      
      {/* Action buttons in top-right corner */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
        {onSettings && (
          <Button
            onClick={handleSettings}
            variant="ghost"
            size="icon"
            className="nodrag"
            title="Node Settings"
            type="button"
          >
            <Settings size={16} />
          </Button>
        )}
        {onDelete && (
          <Button
            onClick={handleDelete}
            variant="ghost"
            size="icon"
            className="nodrag hover:text-destructive"
            title="Delete Node"
            type="button"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>      
      {children}
      {hasSource && <Handle type="source" position={Position.Right} className="w-3 h-3 bg-primary" />}
    </div>
  );
};
