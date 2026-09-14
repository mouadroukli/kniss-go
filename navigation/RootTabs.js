import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ExploreStack from './ExploreStack';
import FavoritesStack from './FavoritesStack';
import SettingsStack from './SettingsStack';
import AddStack from './AddStack';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Explore: 'compass-outline',
  Add: 'add-circle-outline',
  Favorites: 'heart-outline',
  Settings: 'settings-outline',
};

export default function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
        tabBarActiveTintColor: '#1c1c1c',
        tabBarInactiveTintColor: '#b4b2a9',
      })}
    >
      <Tab.Screen name="Explore" component={ExploreStack} />
      <Tab.Screen name="Add" component={AddStack} />
      <Tab.Screen name="Favorites" component={FavoritesStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}
