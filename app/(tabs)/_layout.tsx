import { Tabs } from 'expo-router';
import { Home, Search, BarChart2, User } from 'lucide-react-native';
import { useAppTheme } from '../../src/context/ThemeContext';
import { View } from 'react-native';

import { FuelProvider } from '../../src/context/FuelContext';

export default function TabLayout() {
  const { colors } = useAppTheme();

  return (
    <FuelProvider>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          backgroundColor: colors.bgWhite,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, focused }) => (
            <Home size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'SEARCH',
          tabBarIcon: ({ color, focused }) => (
            <Search size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: 'TRENDS',
          tabBarIcon: ({ color, focused }) => (
            <BarChart2 size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ color, focused }) => (
            <User size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      </Tabs>
    </FuelProvider>
  );
}
