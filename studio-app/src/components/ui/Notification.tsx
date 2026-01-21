import { useState, createContext, useContext, useCallback, type ReactNode } from 'react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextValue {
  notifications: Notification[];
  showNotification: (type: NotificationType, message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showNotification = useCallback(
    (type: NotificationType, message: string, duration = 3000) => {
      const id = `notification_${Date.now()}`;
      const notification: Notification = { id, type, message, duration };

      setNotifications(prev => [...prev, notification]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification]
  );

  return (
    <NotificationContext.Provider
      value={{ notifications, showNotification, removeNotification }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

const typeStyles: Record<NotificationType, { bg: string; icon: string }> = {
  success: {
    bg: 'bg-success',
    icon: '✓',
  },
  error: {
    bg: 'bg-error',
    icon: '✕',
  },
  warning: {
    bg: 'bg-warning',
    icon: '⚠',
  },
  info: {
    bg: 'bg-primary',
    icon: 'ℹ',
  },
};

function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const style = typeStyles[notification.type];

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`
        flex items-center gap-3
        px-4 py-3
        ${style.bg} text-white
        rounded-lg shadow-lg
        transition-all duration-200
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
        animate-slideIn
      `}
    >
      <span className="text-lg">{style.icon}</span>
      <p className="flex-1 text-sm">{notification.message}</p>
      <button
        onClick={handleClose}
        className="p-1 hover:bg-white/20 rounded transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Simple standalone notification function for quick use
export function showToast(type: NotificationType, message: string) {
  // Create a temporary container for the toast
  const container = document.createElement('div');
  container.className = 'fixed bottom-4 right-4 z-50';
  document.body.appendChild(container);

  const style = typeStyles[type];

  container.innerHTML = `
    <div class="flex items-center gap-3 px-4 py-3 ${style.bg} text-white rounded-lg shadow-lg animate-slideIn">
      <span class="text-lg">${style.icon}</span>
      <p class="flex-1 text-sm">${message}</p>
    </div>
  `;

  setTimeout(() => {
    container.firstElementChild?.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => container.remove(), 200);
  }, 3000);
}
