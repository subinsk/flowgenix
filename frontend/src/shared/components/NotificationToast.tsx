"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/ui';
import { ANIMATIONS } from '@/constants';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useUIStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="text-green-500 w-5 h-5" />;
      case 'error':
        return <XCircle className="text-red-500 w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500 w-5 h-5" />;
      case 'info':
        return <Info className="text-blue-500 w-5 h-5" />;
      default:
        return <Info className="text-gray-500 w-5 h-5" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={ANIMATIONS.SPRING_SMOOTH}
            className={`
              w-full p-4 rounded-lg border shadow-lg backdrop-blur-sm
              ${getBackgroundColor(notification.type)}
            `}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 text-lg">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {notification.title}
                </h4>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;
