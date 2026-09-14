import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '../screens/DashboardScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';

const Stack = createStackNavigator();

// The Home tab. A stack so the dashboard's property and expiring rows can
// open the same PropertyDetail screen the buyer side uses, and a name in
// Interested buyers can open that buyer's public profile.
export default function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <Stack.Screen
        name="PublicProfile"
        component={PublicProfileScreen}
        options={{ headerShown: true, title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}
