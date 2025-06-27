import React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/auth';
import { useUIStore } from '../../store/ui';
import { Button } from '../../shared/components';
import { ANIMATIONS } from '../../constants';

const ModernHeader: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={ANIMATIONS.SPRING_SMOOTH}
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Flowgenix
            </h1>
          </motion.div>
          
          <div className="hidden md:flex items-center space-x-1">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              AI Workflow Builder
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              Beta
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            icon={theme === 'light' ? '🌙' : '☀️'}
            className="hidden sm:flex"
          >
            {theme === 'light' ? 'Dark' : 'Light'}
          </Button>

          {/* User Info */}
          {user && (
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-sm">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {user.username || user.email}
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {user.email}
                </div>
              </div>
              
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {(user.username || user.email).charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            icon="🚪"
          >
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default ModernHeader;
