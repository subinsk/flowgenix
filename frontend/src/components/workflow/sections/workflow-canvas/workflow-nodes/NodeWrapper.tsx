import React, { useCallback } from 'react';
import { Settings} from 'lucide-react';
import { NodeWrapperProps } from '@/types';
import { Button } from '@/components/ui/button';

export const  NodeWrapper: React.FC<NodeWrapperProps> = ({ 
  children, 
  type, 
  selected, 
  onSettings,
  validationErrors = []
}) => {
  const hasErrors = validationErrors.length > 0;

  const handleSettings = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSettings?.();
  }, [onSettings]);

  return (
    <div 
      data-nodetype={type}
      className={`min-w-[280px] bg-card border-1 rounded-lg shadow-lg transition-all duration-200 relative ${
        hasErrors 
          ? 'border-red-500 shadow-red-500/20' 
          : selected 
            ? 'border-primary shadow-primary/20' 
            : 'border-border hover:border-border-hover'
      }`}
    >      
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
        {onSettings && (
          <Button
            onClick={handleSettings}
            variant="ghost"
            size="sm"
            className="nodrag"
            title="Node Settings"
            type="button"
          >
            <Settings size={16} />
          </Button>
        )}
        {/* {onDelete && (
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
        )} */}
      </div>      
      {children}
    </div>
  );
};
