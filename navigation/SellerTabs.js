import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardStack from './DashboardStack';
import PropertyStack from './PropertyStack';
import AddStack from './AddStack';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home-outline',
  Property: 'business-outline',
  Add: 'add-circle-outline',
  Profile: 'person-outline',
};

// The seller's app, entered only after login or sign-up. Separate from the
// buyer's tab bar (RootTabs): different audience, different navigation.
export default function SellerTabs() {
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
      <Tab.Screen name="Home" component={DashboardStack} />
      <Tab.Screen name="Property" component={PropertyStack} />
      <Tab.Screen name="Add" component={AddStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
