'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../../shared/components';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { NODE_TYPE_MAP } from '@/constants';
import { NodeFieldError } from '../../../hooks/useWorkflowValidation';

interface ComponentSidebarProps {
  collapsed: boolean;
  validationErrors: NodeFieldError[];
  showValidationErrors: boolean;
  onToggleCollapse: () => void;
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

export default function ComponentSidebar({
  collapsed,
  validationErrors,
  showValidationErrors,
  onToggleCollapse,
  onDragStart
}: ComponentSidebarProps) {
  if (collapsed) return null;

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-card border-r border-border flex flex-col overflow-hidden"
    >
      {/* Component Library */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Components</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-1 h-auto"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          {Object.values(NODE_TYPE_MAP).map((component) => {
            const Icon = component.icon;
            return (
              <motion.div
                key={component.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-2 bg-background border border-border rounded-lg cursor-grab hover:border-primary transition-colors flex items-center gap-2"
                draggable
                onDragStart={(event) => onDragStart(event as any, component.id)}
              >
                <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center text-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-foreground text-sm">{component.label}</span>
              </motion.div>
            );
          })}
        </div>
        
        {showValidationErrors && validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Validation Errors
            </h4>
            <ul className="text-xs text-red-700 space-y-1">
              {validationErrors.map((err, index) => {
                const nodeType = NODE_TYPE_MAP[err.nodeType as keyof typeof NODE_TYPE_MAP];
                return (
                  <li key={index}>
                    • <span className="font-semibold">{nodeType ? nodeType.label : err.nodeType}</span>
                    {err.field && err.field !== 'workflow' ? (
                      <> (<span className="italic">{err.field}</span>)</>
                    ) : null}
                    : {err.error}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
