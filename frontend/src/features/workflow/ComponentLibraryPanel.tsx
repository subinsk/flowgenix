import React from 'react';
import { motion } from 'framer-motion';
import { WORKFLOW_COMPONENTS, ANIMATIONS } from '../../shared/constants';
import { Card } from '../../shared/components';

interface ComponentLibraryPanelProps {
  className?: string;
}

const ComponentLibraryPanel: React.FC<ComponentLibraryPanelProps> = ({
  className = '',
}) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={ANIMATIONS.SPRING_SMOOTH}
      className={`
        w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
        ${className}
      `}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Component Library
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Drag components to the canvas to build your workflow
        </p>
      </div>

      <div className="p-4 space-y-3 max-h-full overflow-y-auto">
        {WORKFLOW_COMPONENTS.map((component, index) => (
          <motion.div
            key={component.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, ...ANIMATIONS.SPRING_SMOOTH }}
          >
            <div
              className="cursor-grab active:cursor-grabbing select-none"
              draggable
              onDragStart={(event: React.DragEvent) => onDragStart(event, component.type)}
            >
              <Card
                padding="sm"
                hover
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${component.color}20`, color: component.color }}
                  >
                    {component.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {component.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {component.description}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 Tip: Connect components to create your workflow
        </div>
      </div>
    </motion.div>
  );
};

export default ComponentLibraryPanel;
