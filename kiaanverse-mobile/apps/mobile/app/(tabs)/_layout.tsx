/**
 * Tabs Layout — 5-tab bottom navigation
 *
 * Home | Sakha | Journey | Gita | Profile
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Home, MessageCircle, Compass, BookOpen, User } from 'lucide-react-native';
import { useTheme, spacing } from '@kiaanverse/ui';
import { useTranslation } from '@kiaanverse/i18n';

export default function TabsLayout(): React.JSX.Element {
  const { theme } = useTheme();
  const { t } = useTranslation('navigation');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          height: spacing.navHeight,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sakha"
        options={{
          title: t('sakha'),
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: t('journey'),
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gita"
        options={{
          title: t('gita'),
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
