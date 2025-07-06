'use client';

import React from 'react';
import { ChevronLeft, AlertCircle, CheckCircle, Save, Undo, Redo } from 'lucide-react';
import { NodeFieldError } from '@/hooks/useWorkflowValidation';
import { Button } from '@/components/ui';
import { STATUS_MAP } from '@/constants';

interface WorkflowHeaderProps {
  workflow: {
    name: string;
    description: string;
    status?: string; // Add status to workflow interface
  };
  isWorkflowValid: boolean;
  validationErrors: NodeFieldError[];
  showValidationErrors: boolean;
  hasValidated: boolean; // Add this to know if validation has been triggered
  onBack: () => void;
  onSave: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onToggleValidationErrors: () => void;
}

export default function WorkflowHeader({
  workflow,
  isWorkflowValid,
  validationErrors,
  showValidationErrors,
  hasValidated,
  onBack,
  onSave,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onToggleValidationErrors
}: WorkflowHeaderProps) {
  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground p-2 w-auto px-3"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{workflow.name}</h1>
            <p className="text-sm text-muted-foreground">{workflow.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Workflow Status Badge */}
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_MAP[workflow.status || 'draft']?.color || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
              {STATUS_MAP[workflow.status || 'draft']?.label || workflow.status || 'Draft'}
            </div>
          </div>
          
          {/* Workflow Validation Status Indicator */}
          <div className="flex items-center space-x-2">
            {!hasValidated ? (
              <div className="flex items-center text-gray-500">
                <span className="text-xs">Ready to Build</span>
              </div>
            ) : isWorkflowValid ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="text-xs">Valid</span>
              </div>
            ) : (
              <button 
                onClick={onToggleValidationErrors}
                className={`flex items-center text-red-600 px-2 py-1 rounded transition-colors ${
                  showValidationErrors 
                    ? 'bg-red-100 border border-red-300' 
                    : 'hover:bg-red-50 border border-transparent'
                }`}
                title="Click to view validation errors"
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-xs">{validationErrors.length} Error{validationErrors.length !== 1 ? 's' : ''}</span>
              </button>
            )}
          </div>
          
          {/* Undo/Redo buttons */}
          <div className="flex items-center space-x-1">
            <div title="Undo">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onUndo}
                disabled={!canUndo}
                className="p-2"
              >
                <Undo className="w-4 h-4" />
              </Button>
            </div>
            <div title="Redo">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRedo}
                disabled={!canRedo}
                className="p-2"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <Button size="sm" onClick={onSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </header>
  );
}
