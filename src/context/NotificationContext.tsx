import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface NotificationContextType {
  hasUnread: boolean;
  setHasUnread: (unread: boolean) => void;
  markAsRead: () => void;
  expoPushToken: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [hasUnread, setHasUnread] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { user } = useAuth();
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const markAsRead = () => setHasUnread(false);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // If user is logged in, securely link this token to their account
        if (user?.uid) {
          updateDoc(doc(db, 'users', user.uid), {
            pushToken: token,
            updatedAt: new Date().toISOString()
          }).catch(err => console.warn('Failed to save push token to profile:', err));
        }
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setHasUnread(true);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.uid]);

  return (
    <NotificationContext.Provider value={{ hasUnread, setHasUnread, markAsRead, expoPushToken }}>
      {children}
    </NotificationContext.Provider>
  );
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }
    
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
        console.warn('EAS projectId is not defined in app.json. Push tokens may not generate correctly.');
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
    } catch (e) {
      console.warn('Error generating push token:', e);
    }
  }

  return token;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
