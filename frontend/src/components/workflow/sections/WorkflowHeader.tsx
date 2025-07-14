'use client';

import React from 'react';
import { Logo } from '@/components/common/logo';
import { Button, DropdownMenuTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui';
import {  AlertCircle, CheckCircle, Save, Undo, Redo } from 'lucide-react';
import { NodeFieldError } from '@/hooks/useWorkflowValidation';
import { STATUS_MAP } from '@/constants';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WorkflowHeaderProps {
  workflow: {
    name: string;
    description?: string;
    status?: string;
  };
  isWorkflowValid: boolean;
  validationErrors: NodeFieldError[];
  showValidationErrors: boolean;
  hasValidated: boolean;
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
  onSave,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onToggleValidationErrors
}: WorkflowHeaderProps) {
  // hooks
  const router = useRouter();
  const { user, logout } = useAuth();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // functions
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Navigate to login even if logout fails
      router.replace('/login');
    }
  };

  useEffect(() => {
    // Use user from context instead of fetching
    setUserEmail(user?.email || null);
  }, [user]);

  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
            >
              <Logo type="dark" variant='small' className='h-[25px] w-[25px]' />
            </motion.div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">GenAI Stack</h1>
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
                  className={`flex items-center text-red-600 px-2 py-1 rounded transition-colors ${showValidationErrors
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

            <Button variant="outline" className='mr-6' size="sm" onClick={onSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span className="text-xl cursor-pointer font-semibold text-white bg-primary rounded-full w-10 h-10 flex items-center justify-center">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <div>
                  <p className='text-gray-500 text-sm pl-2'>{userEmail}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
