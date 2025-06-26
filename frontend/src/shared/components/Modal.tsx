import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClickOutside } from '../hooks';
import { ANIMATIONS } from '../constants';
import type { ModalProps } from '../types';

interface ExtendedModalProps extends ModalProps {
  children: React.ReactNode;
  className?: string;
  backdrop?: boolean;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
}

const Modal: React.FC<ExtendedModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  className = '',
  backdrop = true,
  closeOnBackdrop = true,
  showCloseButton = true,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(modalRef, () => {
    if (closeOnBackdrop) {
      onClose();
    }
  });

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case 'full':
        return 'max-w-full mx-4';
      default:
        return 'max-w-md';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {backdrop && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ANIMATIONS.FAST }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeOnBackdrop ? onClose : undefined}
            />
          )}
          
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={ANIMATIONS.SPRING_SMOOTH}
            className={`
              relative w-full ${getSizeClasses(size)} max-h-[90vh] overflow-auto
              bg-white dark:bg-gray-800 rounded-lg shadow-xl
              ${className}
            `}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                {title && (
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
