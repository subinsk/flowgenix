import { NOTIFICATION_TYPES } from '@/constants';
import { useUIStore } from '@/store';
import { useState, useCallback } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

export const useNotifications = () => {
  const { addNotification, removeNotification, clearNotifications, notifications } = useUIStore();

  const showSuccess = useCallback((title: string, message: string, duration?: number) => {
    addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      title,
      message,
      duration,
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, duration?: number) => {
    addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      title,
      message,
      duration: duration || 8000, // Errors stay longer
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, duration?: number) => {
    addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      title,
      message,
      duration,
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, duration?: number) => {
    addNotification({
      type: NOTIFICATION_TYPES.INFO,
      title,
      message,
      duration,
    });
  }, [addNotification]);

  const dismiss = useCallback((id: string) => {
    removeNotification(id);
  }, [removeNotification]);

  const dismissAll = useCallback(() => {
    clearNotifications();
  }, [clearNotifications]);

  return {
    notifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismiss,
    dismissAll,
  };
};