import React, { createContext, useContext, useState } from 'react';

interface NotificationContextType {
  hasUnread: boolean;
  setHasUnread: (unread: boolean) => void;
  markAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [hasUnread, setHasUnread] = useState(true);

  const markAsRead = () => {
    setHasUnread(false);
  };

  return (
    <NotificationContext.Provider value={{ hasUnread, setHasUnread, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
