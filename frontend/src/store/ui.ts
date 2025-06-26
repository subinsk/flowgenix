import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UIState {
  // Layout state
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  theme: 'light' | 'dark';
  
  // Search provider
  searchProvider: 'brave' | 'serpapi';
  
  // Modals and overlays
  isConfigPanelOpen: boolean;
  isExecutionProgressOpen: boolean;
  isDocumentUploadOpen: boolean;
  
  // Loading states
  globalLoading: boolean;
  loadingMessage: string;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    duration?: number;
  }>;
  
  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setSearchProvider: (provider: 'brave' | 'serpapi') => void;
  setConfigPanelOpen: (open: boolean) => void;
  setExecutionProgressOpen: (open: boolean) => void;
  setDocumentUploadOpen: (open: boolean) => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        sidebarCollapsed: false,
        rightPanelOpen: true,
        theme: 'light',
        searchProvider: 'brave',
        isConfigPanelOpen: false,
        isExecutionProgressOpen: false,
        isDocumentUploadOpen: false,
        globalLoading: false,
        loadingMessage: '',
        notifications: [],

        // Actions
        setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
        setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
        setTheme: (theme) => set({ theme }),
        setSearchProvider: (searchProvider) => set({ searchProvider }),
        setConfigPanelOpen: (isConfigPanelOpen) => set({ isConfigPanelOpen }),
        setExecutionProgressOpen: (isExecutionProgressOpen) => set({ isExecutionProgressOpen }),
        setDocumentUploadOpen: (isDocumentUploadOpen) => set({ isDocumentUploadOpen }),
        
        setGlobalLoading: (globalLoading, loadingMessage = '') => 
          set({ globalLoading, loadingMessage }),

        addNotification: (notification) => {
          const { notifications } = get();
          const newNotification = {
            ...notification,
            id: `notification-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
          };
          set({ notifications: [...notifications, newNotification] });
          
          // Auto-remove notification after duration (default 5 seconds)
          const duration = notification.duration || 5000;
          setTimeout(() => {
            const current = get();
            set({ 
              notifications: current.notifications.filter((n) => n.id !== newNotification.id)
            });
          }, duration);
        },

        removeNotification: (id) => {
          const { notifications } = get();
          set({ notifications: notifications.filter((n) => n.id !== id) });
        },

        clearNotifications: () => set({ notifications: [] }),

        toggleSidebar: () => {
          const { sidebarCollapsed } = get();
          set({ sidebarCollapsed: !sidebarCollapsed });
        },

        toggleRightPanel: () => {
          const { rightPanelOpen } = get();
          set({ rightPanelOpen: !rightPanelOpen });
        },

        toggleTheme: () => {
          const { theme } = get();
          set({ theme: theme === 'light' ? 'dark' : 'light' });
        },
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          rightPanelOpen: state.rightPanelOpen,
          theme: state.theme,
          searchProvider: state.searchProvider,
        }),
      }
    )
  )
);
