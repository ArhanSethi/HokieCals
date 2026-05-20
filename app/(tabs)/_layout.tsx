import React from 'react';
import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          borderTopColor: '#2a2a2a',
        },
        headerStyle: { backgroundColor: '#121212' },
        headerTintColor: '#fff',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'house.fill',
                android: 'home',
                web: 'home',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'calendar',
                android: 'calendar_today',
                web: 'calendar_today',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="grubhub"
        options={{
          title: 'Grubhub',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'bag.fill',
                android: 'shopping_cart',
                web: 'shopping_cart',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
